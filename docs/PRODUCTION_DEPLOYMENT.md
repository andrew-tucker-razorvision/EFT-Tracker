# Production Deployment Guide

This guide covers deploying the EFT-Tracker application in production using Docker containers.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Building the Production Image](#building-the-production-image)
- [Running the Container](#running-the-container)
- [Environment Variables](#environment-variables)
- [Container Orchestration](#container-orchestration)
- [Security Considerations](#security-considerations)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker 20.10+ or compatible container runtime
- PostgreSQL database (managed service recommended)
- Container registry (Docker Hub, GitHub Container Registry, etc.)
- SSL/TLS certificates for HTTPS

## Building the Production Image

### Local Build

```bash
# Build the production image
docker build -t eft-tracker:latest -f Dockerfile .

# Tag for registry
docker tag eft-tracker:latest your-registry.com/eft-tracker:latest

# Push to registry
docker push your-registry.com/eft-tracker:latest
```

### Multi-Platform Build

```bash
# Build for multiple platforms (ARM64 and AMD64)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t your-registry.com/eft-tracker:latest \
  --push \
  -f Dockerfile .
```

## Running the Container

### Docker Run

```bash
docker run -d \
  --name eft-tracker \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  --restart unless-stopped \
  your-registry.com/eft-tracker:latest
```

### Docker Compose

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    image: your-registry.com/eft-tracker:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NODE_ENV: production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped
```

Run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables

### Required

- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database?schema=public`
  - Use connection pooling for production (e.g., Prisma Accelerate, PgBouncer)

- `NEXTAUTH_SECRET` - Secret key for NextAuth.js session encryption
  - Generate with: `openssl rand -base64 32`
  - Must be at least 32 characters

- `NEXTAUTH_URL` - Public URL of your application
  - Format: `https://your-domain.com`
  - Used for OAuth callbacks and redirects

### Optional

- `PORT` - Port to listen on (default: 3000)
- `NODE_ENV` - Should be `production`
- `NEXT_TELEMETRY_DISABLED` - Set to `1` to disable Next.js telemetry

### Secrets Management

#### Using Docker Secrets

```bash
# Create secrets
echo "postgresql://..." | docker secret create db_url -
echo "your-secret-key" | docker secret create nextauth_secret -

# Reference in docker-compose.yml
services:
  app:
    secrets:
      - db_url
      - nextauth_secret
    environment:
      DATABASE_URL_FILE: /run/secrets/db_url
      NEXTAUTH_SECRET_FILE: /run/secrets/nextauth_secret

secrets:
  db_url:
    external: true
  nextauth_secret:
    external: true
```

#### Using Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: eft-tracker-secrets
type: Opaque
stringData:
  DATABASE_URL: postgresql://...
  NEXTAUTH_SECRET: your-secret-key
  NEXTAUTH_URL: https://your-domain.com
```

## Container Orchestration

### Kubernetes Deployment

Example `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eft-tracker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: eft-tracker
  template:
    metadata:
      labels:
        app: eft-tracker
    spec:
      containers:
      - name: eft-tracker
        image: your-registry.com/eft-tracker:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: eft-tracker-secrets
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "100m"
            memory: "256Mi"
```

### AWS ECS Task Definition

```json
{
  "family": "eft-tracker",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "eft-tracker",
      "image": "your-registry.com/eft-tracker:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
        },
        {
          "name": "NEXTAUTH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:nextauth-secret"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/eft-tracker",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## Security Considerations

### Image Security

1. **Regular Updates**: Rebuild images weekly to get security patches
   ```bash
   docker build --no-cache -t eft-tracker:$(date +%Y%m%d) .
   ```

2. **Vulnerability Scanning**: Use Trivy or Snyk
   ```bash
   trivy image eft-tracker:latest
   ```

3. **Non-Root User**: The production image runs as user `nextjs` (UID 1001)

4. **Read-Only Root Filesystem**: Add to container config
   ```yaml
   security_opt:
     - no-new-privileges:true
   read_only: true
   tmpfs:
     - /tmp
     - /var/cache/nginx
   ```

### Network Security

1. **Use HTTPS**: Always use TLS in production
2. **Private Networks**: Run containers on private subnets
3. **Firewall Rules**: Restrict ingress to necessary ports
4. **DDoS Protection**: Use CloudFlare, AWS Shield, or similar

### Database Security

1. **Connection Pooling**: Use Prisma Accelerate or PgBouncer
2. **SSL Connections**: Enable `?sslmode=require` in DATABASE_URL
3. **Least Privilege**: Database user should have minimal permissions
4. **Backup Strategy**: Regular automated backups

## Monitoring and Health Checks

### Health Check Endpoint

The application exposes `/api/health` for health checks:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 12345.67
}
```

### Container Monitoring

#### Prometheus Metrics

Add metrics collection (future enhancement):
```yaml
services:
  app:
    labels:
      - "prometheus.io/scrape=true"
      - "prometheus.io/port=3000"
      - "prometheus.io/path=/api/metrics"
```

#### Logging

Structured JSON logging to stdout:
```bash
docker logs -f eft-tracker
```

#### Resource Monitoring

```bash
# Docker stats
docker stats eft-tracker

# Detailed inspection
docker inspect eft-tracker
```

## Troubleshooting

### Container Won't Start

1. Check logs:
   ```bash
   docker logs eft-tracker
   ```

2. Verify environment variables:
   ```bash
   docker inspect eft-tracker | jq '.[].Config.Env'
   ```

3. Test database connection:
   ```bash
   docker exec -it eft-tracker node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected')).catch(console.error)"
   ```

### Health Check Failing

1. Check if app is responding:
   ```bash
   docker exec -it eft-tracker wget -O- http://localhost:3000/api/health
   ```

2. Verify port is exposed:
   ```bash
   docker port eft-tracker
   ```

3. Check resource limits:
   ```bash
   docker stats eft-tracker --no-stream
   ```

### Performance Issues

1. **Increase Memory**: Add `--memory=2g` or update compose file
2. **Connection Pool**: Adjust Prisma connection pool size
3. **Enable Caching**: Use Redis for session storage
4. **CDN**: Serve static assets from CDN

### Database Connection Issues

1. **Connection String**: Verify DATABASE_URL format
2. **Network**: Check if container can reach database
3. **SSL**: Try with and without `?sslmode=require`
4. **Prisma Client**: Regenerate if schema changed:
   ```bash
   docker exec -it eft-tracker npx prisma generate
   ```

## Scaling Considerations

### Horizontal Scaling

- **Stateless**: App is stateless, safe to run multiple instances
- **Load Balancer**: Use Nginx, HAProxy, or cloud load balancer
- **Session Storage**: Use database-backed sessions (already configured)

### Database Scaling

- **Read Replicas**: Use read replicas for query scaling
- **Connection Pooling**: Essential with multiple app instances
- **Caching**: Add Redis for session and query caching

### CDN Configuration

Serve static assets from CDN:
- `/public/*` - Images, fonts, static files
- `/_next/static/*` - Next.js build artifacts

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] SSL/TLS certificates installed
- [ ] Health checks configured
- [ ] Resource limits set
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Security scan passed
- [ ] Load testing completed
- [ ] Rollback plan documented

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/security/)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
