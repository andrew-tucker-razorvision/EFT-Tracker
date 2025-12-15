# Upstash Redis Setup for Rate Limiting

This guide covers setting up Upstash Redis for distributed rate limiting across multiple server instances.

## Table of Contents

- [Overview](#overview)
- [Why Upstash for Rate Limiting](#why-upstash-for-rate-limiting)
- [Creating Upstash Account](#creating-upstash-account)
- [Creating Redis Database](#creating-redis-database)
- [Configuration](#configuration)
- [Monitoring Usage](#monitoring-usage)
- [Troubleshooting](#troubleshooting)

## Overview

**What is Upstash?**

Upstash is a serverless Redis-compatible database with a REST API. It's perfect for rate limiting because:

- **Serverless**: Pay only for what you use, no idle costs
- **Global edge network**: Low latency worldwide
- **REST API**: Works from any environment (serverless, containers, edge functions)
- **Free tier**: 10,000 commands/day (sufficient for moderate traffic)

**What does rate limiting do?**

Rate limiting protects your API from:

- **Abuse**: Prevents malicious users from overwhelming your servers
- **DoS attacks**: Limits request rate per IP address
- **Resource exhaustion**: Prevents a single user from consuming all database connections

## Why Upstash for Rate Limiting

### Without Upstash (In-Memory Fallback)

```
Server 1: 100 req/min from IP 1.2.3.4 → Allowed
Server 2: 100 req/min from IP 1.2.3.4 → Allowed
Total: 200 req/min (rate limit bypassed! ❌)
```

**Problem**: Each server tracks rate limits independently, allowing users to bypass limits by hitting multiple servers.

### With Upstash (Distributed)

```
Server 1: 100 req/min from IP 1.2.3.4 → Upstash: 100/100 → Allowed
Server 2:   1 req from IP 1.2.3.4    → Upstash: 101/100 → Blocked ✅
```

**Solution**: All servers share rate limit state via Upstash, enforcing limits globally.

## Creating Upstash Account

1. **Visit Upstash Console**
   - Navigate to [console.upstash.com](https://console.upstash.com)
   - Click "Sign Up" or "Continue with GitHub"

2. **Verify Email**
   - Check your email for verification link
   - Click link to activate account

3. **Select Plan**
   - Choose "Free" plan
   - No credit card required
   - Includes:
     - 10,000 commands/day
     - 256 MB storage
     - Global edge network

## Creating Redis Database

### Step 1: Create Database

1. **Navigate to Redis Dashboard**
   - Click "Redis" in left sidebar
   - Click "Create Database" button

2. **Configure Database**

   ```
   Name: eft-tracker-rate-limit-production
   Type: Regional (faster) or Global (more resilient)
   Region: Choose closest to your primary server location
           (e.g., us-east-1 if using Hetzner US East)
   Eviction Policy: allkeys-lru (recommended)
   TLS: Enabled (default, recommended)
   ```

3. **Create Database**
   - Click "Create"
   - Wait 10-30 seconds for provisioning

### Step 2: Get Credentials

1. **Access Database Dashboard**
   - Click on your newly created database
   - Navigate to "Details" tab

2. **Copy REST API Credentials**

   **UPSTASH_REDIS_REST_URL:**

   ```
   https://region-xxxxx.upstash.io
   ```

   **UPSTASH_REDIS_REST_TOKEN:**

   ```
   AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
   ```

3. **Important**: Store these securely
   - Add to password manager
   - Never commit to git
   - Rotate periodically

### Step 3: Create Staging Database (Optional)

Repeat steps 1-2 with name `eft-tracker-rate-limit-staging` for testing before production deployment.

## Configuration

### Add to Environment Variables

**Local Development** (`.env.local`):

```bash
UPSTASH_REDIS_REST_URL=https://region-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

**Production** (Coolify):

1. Navigate to: Application → Environment Variables
2. Add variables:
   - `UPSTASH_REDIS_REST_URL`: `https://region-xxxxx.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN`: `Axxxxxxxxxxxxx...` (mark as Secret)
3. Redeploy application

### Verify Configuration

1. **Start Application**

   ```bash
   npm run dev
   ```

2. **Check Logs**

   Look for initialization message:

   ```
   {"level":"info","msg":"Upstash rate limiter initialized"}
   ```

3. **Test Rate Limiting**

   ```bash
   # Make multiple requests to trigger rate limit
   for i in {1..35}; do
     curl http://localhost:3000/api/quests
   done

   # Should see 429 response after 30 requests (API_GENERAL limit)
   ```

4. **Check Upstash Dashboard**
   - Navigate to: Database → Metrics
   - Should see command count increasing

### Fallback Behavior

If Upstash credentials are not configured, the application **automatically falls back** to in-memory rate limiting:

```typescript
// No Upstash configured
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

// Result: In-memory rate limiting (works for single-instance deployments)
```

This allows local development without Upstash.

## Monitoring Usage

### Upstash Dashboard

**Daily Command Count:**

1. Navigate to: Database → Metrics
2. Check: "Commands" graph
3. Monitor: Stay under 10,000/day on free tier

**Storage Usage:**

1. Navigate to: Database → Details
2. Check: "Database Size"
3. Monitor: Stay under 256 MB on free tier

### Expected Usage

**EFT-Tracker rate limiting usage:**

```
Requests per day: 10,000
Rate limit checks: 10,000 (1 per request)
Upstash commands: 20,000 (2 per check: GET + SET)

Free tier limit: 10,000 commands/day
Max requests with rate limiting: ~5,000/day
```

**If you exceed free tier:**

- Upgrade to "Pay as you go" ($0.20 per 100k commands)
- Or optimize rate limit configuration (increase time windows)

### Application Logs

**Rate Limit Hit:**

```json
{
  "level": "warn",
  "msg": "Rate limit exceeded",
  "clientIp": "1.2.3.4",
  "limit": 30,
  "path": "/api/quests"
}
```

**Upstash Error (falls back to in-memory):**

```json
{
  "level": "error",
  "msg": "Upstash rate limit check failed, falling back to in-memory",
  "error": "Network timeout"
}
```

## Troubleshooting

### Issue: Rate Limiting Not Working

**Symptoms**: Users can exceed rate limits

**Resolution**:

1. **Check Upstash credentials are set**

   ```bash
   # In application logs
   grep "Upstash rate limiter initialized" logs/app.log
   ```

   If not found, credentials are missing or invalid.

2. **Verify credentials**

   ```bash
   # Test REST API directly
   curl https://your-upstash-url.upstash.io/ping \
     -H "Authorization: Bearer your-token"

   # Should return: {"result":"PONG"}
   ```

3. **Check for fallback warnings**

   ```bash
   grep "falling back to in-memory" logs/app.log
   ```

   If found, Upstash is unreachable.

### Issue: 429 Errors for Legitimate Traffic

**Symptoms**: Users getting blocked unexpectedly

**Resolution**:

1. **Review rate limit configuration**

   Check [src/lib/rate-limit.ts](../src/lib/rate-limit.ts) for limits:

   ```typescript
   API_GENERAL: {
     limit: 30,
     window: 60 * 1000, // 1 minute
   }
   ```

2. **Check if multiple users share same IP**
   - Corporate networks
   - VPN services
   - Cloudflare (if not using cf-connecting-ip header)

3. **Increase limits if needed**

   ```typescript
   API_GENERAL: {
     limit: 60, // Increased from 30
     window: 60 * 1000,
   }
   ```

### Issue: High Upstash Command Count

**Symptoms**: Approaching 10,000 commands/day limit

**Resolution**:

1. **Check command count in Upstash dashboard**
   - Commands/day: 9,500 (approaching limit)

2. **Optimize rate limit windows**

   ```typescript
   // Before: Many short windows (more Redis calls)
   API_GENERAL: {
     limit: 30,
     window: 60 * 1000, // 1 minute
   }

   // After: Fewer long windows (fewer Redis calls)
   API_GENERAL: {
     limit: 450,
     window: 15 * 60 * 1000, // 15 minutes
   }
   ```

3. **Upgrade to pay-as-you-go** ($0.20 per 100k commands)

### Issue: Upstash Connection Timeout

**Symptoms**: Errors in logs about connection timeout

**Resolution**:

1. **Check Upstash status**
   - Visit [status.upstash.com](https://status.upstash.com)
   - Check for outages in your region

2. **Verify network connectivity**

   ```bash
   # From your server
   curl -v https://your-upstash-url.upstash.io/ping
   ```

3. **Application automatically falls back**
   - In-memory rate limiting continues to work
   - No downtime for users

## Best Practices

### Do's ✅

- ✅ Create separate databases for staging and production
- ✅ Store credentials in password manager
- ✅ Monitor command usage weekly
- ✅ Test rate limiting after deployment
- ✅ Use Cloudflare cf-connecting-ip header for real client IPs
- ✅ Set appropriate limits for each endpoint type

### Don'ts ❌

- ❌ Commit Upstash credentials to git
- ❌ Use same database for staging and production
- ❌ Set rate limits too low (blocks legitimate users)
- ❌ Set rate limits too high (doesn't protect against abuse)
- ❌ Ignore high command count warnings

## Cost Optimization

**Free Tier Capacity:**

- 10,000 commands/day
- ~5,000 rate-limited requests/day
- Sufficient for small to medium traffic

**When to Upgrade:**

- **Traffic spike**: Expecting >5,000 requests/day
- **Multiple applications**: Sharing one database
- **Need more storage**: >256 MB (unlikely for rate limiting)

**Pricing** (Pay as you go):

- $0.20 per 100,000 commands
- $0.25 per GB storage/month

**Example costs**:

- 50,000 requests/day → 100,000 commands/day → $0.60/month
- 500,000 requests/day → 1,000,000 commands/day → $2.00/month

## Related Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Cloudflare CDN Setup](./CLOUDFLARE_SETUP.md)
- [Security Hardening](./security/SECURITY.md)

## External Resources

- [Upstash Documentation](https://docs.upstash.com/redis)
- [Upstash Status](https://status.upstash.com)
- [Upstash Console](https://console.upstash.com)

## Revision History

| Date       | Version | Changes                     |
| ---------- | ------- | --------------------------- |
| 2025-01-13 | 1.0     | Initial Upstash setup guide |
