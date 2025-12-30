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
version: "3.8"

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
      test:
        [
          "CMD",
          "node",
          "-e",
          "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})",
        ]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
        reservations:
          cpus: "0.5"
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
- `SENTRY_DSN` - Sentry error monitoring DSN
- `LOG_LEVEL` - Logging verbosity (error, warn, info, debug)

### Environment Validation

All environment variables are validated at application startup using Zod (see [src/lib/env.ts](../src/lib/env.ts)).

**Benefits:**

- **Fail fast**: Application won't start with invalid configuration
- **Type safety**: Full TypeScript support for all environment variables
- **Clear errors**: Helpful error messages for missing or invalid values

**Example validation error:**

```json
ZodError: [
  {
    "code": "too_small",
    "minimum": 32,
    "path": ["AUTH_SECRET"],
    "message": "AUTH_SECRET must be at least 32 characters"
  }
]
```

**Usage in code:**

```typescript
// ❌ Don't use process.env directly (no validation, no types)
const dbUrl = process.env.DATABASE_URL;

// ✅ Use validated env (type-safe, validated at startup)
import { env } from "@/lib/env";
const dbUrl = env.DATABASE_URL;
```

**Skipping validation (testing only):**

```bash
SKIP_ENV_VALIDATION=1 npm test
```

See [.env.template](../.env.template) for complete list of environment variables with documentation.

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

### Coolify Deployment

Coolify is a self-hosted Platform-as-a-Service (PaaS) that simplifies deployment and auto-deployment from Git.

#### Initial Setup

1. **Access Coolify Dashboard**
   - Navigate to your Coolify instance (e.g., `https://coolify.yourdomain.com`)
   - Log in with admin credentials

2. **Create New Resource**
   - Click "New Resource" → "Application"
   - Select "Public Repository" or connect your GitHub account
   - Enter repository: `https://github.com/tuckerandrew21/EFT-Tracker`
   - Branch: `master`
   - Build pack: `Dockerfile`

3. **Configure Build Settings**
   - Dockerfile path: `./Dockerfile`
   - Build context: `.`
   - Port: `3000`
   - Health check path: `/api/health`

4. **Set Environment Variables**

   Navigate to Environment Variables tab and add:

   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   AUTH_SECRET=<generated-with-openssl-rand-base64-32>
   NEXTAUTH_URL=https://learntotarkov.com
   ```

   Mark all as **Secret** (encrypted at rest).

5. **Configure Health Checks**
   - Health check endpoint: `/api/health`
   - Health check timeout: `30s`
   - Health check interval: `30s`
   - Health check retries: `3`
   - Start period: `40s`

6. **Set Resource Limits**
   - Memory limit: `2GB`
   - Memory reservation: `512MB`
   - CPU limit: `2` cores
   - CPU reservation: `0.5` cores

7. **Configure Restart Policy**
   - Restart policy: `on-failure`
   - Max restart attempts: `3`

#### Auto-Deployment from GitHub

1. **Enable Webhooks**
   - In Coolify application settings, go to "Deployment" tab
   - Enable "Automatic Deployment"
   - Select branch: `master`
   - Coolify will automatically create a GitHub webhook

2. **Verify Webhook**
   - Go to GitHub repository → Settings → Webhooks
   - You should see a Coolify webhook with:
     - Payload URL: `https://coolify.yourdomain.com/api/v1/webhooks/<app-id>`
     - Content type: `application/json`
     - Events: `push`
   - Test the webhook by clicking "Test" → "Push event"

3. **Test Auto-Deployment**

   ```bash
   # Make a test commit
   git commit --allow-empty -m "test: trigger Coolify auto-deployment"
   git push origin master

   # Monitor in Coolify UI
   # Should see:
   # 1. Webhook received
   # 2. Build started
   # 3. Build logs streaming
   # 4. Deployment triggered
   # 5. Health checks passing
   # 6. New version live
   ```

#### Deployment Pipeline Flow

```text
Push to master → GitHub webhook → Coolify webhook handler →
Git pull latest → Docker build → Database migrations (if any) →
Stop old container → Start new container → Health check →
Route traffic if healthy → Keep old container for rollback
```

#### Monitoring Deployments

1. **Build Logs**
   - Click on application in Coolify dashboard
   - Go to "Logs" tab
   - View real-time build output
   - Filter by: Build, Runtime, Error

2. **Deployment History**
   - View all past deployments
   - Git commit SHA for each deployment
   - Build duration and status
   - One-click rollback to previous version

3. **Container Metrics**
   - CPU usage graph
   - Memory usage graph
   - Network I/O
   - Request rate (if metrics endpoint added)

#### Rollback Process

1. **Automatic Rollback**
   - If health checks fail, Coolify automatically keeps old container running
   - New container is stopped
   - Traffic continues to old version

2. **Manual Rollback**
   - Go to Coolify dashboard → Application → Deployments
   - Find previous successful deployment
   - Click "Redeploy"
   - Confirm rollback

#### Coolify-Specific Configuration

Add these settings in Coolify UI:

**Domains:**

- Primary: `learntotarkov.com`
- Aliases: `www.learntotarkov.com`
- SSL: Let's Encrypt (auto-renewal enabled)

**Build Settings:**

- Build timeout: `10 minutes`
- Build command: `docker build -f Dockerfile -t $IMAGE_NAME .`
- No additional build args needed (Dockerfile handles it)

**Deployment Settings:**

- Deployment timeout: `5 minutes`
- Zero-downtime deployment: `enabled`
- Pre-deployment command: `npx prisma migrate deploy` (runs migrations)

**Notifications:**

- Enable deployment notifications (optional)
- Webhook for successful deployments
- Webhook for failed deployments
- Email notifications for failures

#### Troubleshooting Coolify Deployments

**Webhook Not Triggering:**

```bash
# Check GitHub webhook delivery
# GitHub → Settings → Webhooks → Recent Deliveries
# Look for 200 OK response

# If webhook is missing, recreate it manually:
# 1. Get webhook URL from Coolify app settings
# 2. Add webhook in GitHub repository settings
# 3. Payload URL: <coolify-webhook-url>
# 4. Content type: application/json
# 5. Events: Just the push event
```

**Build Failing:**

```bash
# Check build logs in Coolify dashboard
# Common issues:
# 1. Dockerfile syntax error
# 2. Missing files in .dockerignore
# 3. Build timeout (increase in settings)
# 4. Out of memory during build (increase build memory)

# Test build locally:
docker build -f Dockerfile -t test .
```

**Container Won't Start:**

```bash
# Check runtime logs in Coolify
# Common issues:
# 1. Missing environment variables
# 2. Database connection failing
# 3. Port already in use
# 4. Health check failing

# Verify env vars in Coolify UI
# Check container logs for specific error
```

**Health Checks Failing:**

```bash
# Coolify marks container as unhealthy if /api/health returns non-200
# Check health check logs in Coolify
# Verify health check configuration:
# - Path: /api/health
# - Timeout: 30s (increase if needed)
# - Start period: 40s (time before first check)

# Test health endpoint manually:
curl https://learntotarkov.com/api/health
```

#### Coolify Best Practices

1. **Environment Variables**
   - Always mark secrets as "Secret" in Coolify
   - Use different AUTH_SECRET for production vs development
   - Never commit production env vars to Git

2. **Resource Limits**
   - Start with: 512MB memory, 0.5 CPU
   - Monitor usage and adjust as needed
   - Set limits to prevent one container from consuming all resources

3. **Deployment Strategy**
   - Use zero-downtime deployments
   - Enable auto-rollback on health check failure
   - Test in staging branch first (if you set one up)

4. **Monitoring**
   - Check build logs after each deployment
   - Monitor container resource usage
   - Set up notifications for failed deployments

5. **Backups**
   - Coolify doesn't backup your application data
   - Ensure database backups are configured separately
   - Keep container images in a registry as backup

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
        "command": [
          "CMD-SHELL",
          "node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""
        ],
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

## Pre-Deployment Procedures

### Database Backup

Before any production deployment, especially those involving schema changes or risky operations, create a manual backup:

**When to Create Backup:**

- Schema migrations (`prisma migrate deploy`)
- Major code deployments
- Bulk data operations
- Configuration changes

**Backup Procedure:**

1. Navigate to [Neon Console](https://console.neon.tech) → Branches
2. Click "Create Branch"
3. Configure backup:
   - **Name**: `backup-YYYYMMDD-HHMMSS` (e.g., `backup-20250113-143000`)
   - **Source**: `main` (production branch)
   - **Point in time**: "Now"
4. Document backup in PR description or deployment notes
5. Proceed with deployment

**Example:**

```bash
# Document in deployment notes
Backup created: backup-20250113-143000
Reason: Pre-deployment backup for PR #238 (schema changes)
Retention: Delete after 2025-01-20 (7 days)
```

For detailed backup and restoration procedures, see [DATABASE_BACKUPS.md](./DATABASE_BACKUPS.md).

For safe database migration strategies and 2-phase deployment patterns, see [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md).

## Production Checklist

### Pre-Deployment Checklist

- [ ] All CI checks passing (tests, lint, security)
- [ ] PR approved and merged
- [ ] **Database backup created** (if schema changes or risky operations)
- [ ] Staging environment tested
- [ ] Rollback plan documented

### Post-Deployment Checklist

- [ ] Health checks passing
- [ ] Key endpoints verified (home, API, auth)
- [ ] Error rates normal in Sentry
- [ ] No performance degradation
- [ ] Monitor for 15-30 minutes

### Production Environment Checklist

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

### Project Documentation

- [Database Backup Procedures](./DATABASE_BACKUPS.md)
- [Database Migration Strategy](./DATABASE_MIGRATIONS.md)
- [Incident Response and Disaster Recovery](./INCIDENT_RESPONSE.md)
- [Production Runbooks](./RUNBOOKS.md)

### External Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/security/)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
