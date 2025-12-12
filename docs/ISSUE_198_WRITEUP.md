# Issue #198: Enhanced Health Check with Database Connectivity

## Problem Analysis

### Current State

The existing `/api/health` endpoint ([src/app/api/health/route.ts](../src/app/api/health/route.ts)) is minimal:

- Returns 200 OK unconditionally
- Shows basic uptime and timestamp
- **No database connectivity check**
- **Cannot detect if the app is unhealthy**

### Why This Matters

1. **UptimeRobot monitoring**: Needs reliable health indicator
2. **Coolify deployments**: Uses health check for zero-downtime deployments
3. **Production debugging**: Quick way to verify database connectivity
4. **Load balancer integration**: Can route traffic away from unhealthy instances

### Root Cause

The current health check only verifies that the Node.js process is running, not that the application can serve requests. A running process with a broken database connection appears "healthy" but cannot function.

## Proposed Solution

### Enhanced Health Check Design

**Comprehensive status checks:**

1. ✅ **Process health**: Uptime, memory usage
2. ✅ **Database connectivity**: Connection test + response time
3. ✅ **Connection pool**: Active/idle connections
4. ✅ **Environment info**: NODE_ENV, app version

**Response codes:**

- `200 OK`: All systems operational
- `503 Service Unavailable`: Database unreachable or critical failure

**Timeouts:**

- Database query: 5 second timeout
- Overall endpoint: <1 second target response time

### Implementation Approach

#### 1. Database Health Check

Use Prisma's `$queryRaw` for a simple connectivity test:

```typescript
const start = Date.now();
await prisma.$queryRaw`SELECT 1`;
const responseTime = Date.now() - start;
```

**Why `SELECT 1`?**

- Minimal database load
- Works on all SQL databases
- Fast execution (<50ms typically)
- Standard health check pattern

#### 2. Connection Pool Status

Prisma Client exposes pool metrics via internal metrics:

```typescript
// Note: Pool metrics may require Prisma 5.x+
// Fallback: Return pool config if metrics unavailable
const pool = {
  active: (await prisma.$metrics?.poolActive?.value) || "unavailable",
  idle: (await prisma.$metrics?.poolIdle?.value) || "unavailable",
  max: Number(process.env.DATABASE_POOL_MAX) || 10,
};
```

#### 3. Error Handling

**Graceful degradation:**

- Catch database errors without crashing
- Log failures with Pino structured logging
- Return 503 with error details (redacted for security)

**Security considerations:**

- Don't expose database credentials in errors
- Redact connection strings
- Only show high-level error categories

#### 4. Response Schema

```typescript
{
  "status": "healthy" | "degraded" | "unhealthy",
  "version": "1.0.0",
  "timestamp": "2025-12-12T10:30:00.000Z",
  "uptime": 86400,
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy" | "unhealthy",
      "responseTime": 15,
      "pool": {
        "active": 2,
        "idle": 8,
        "max": 10
      }
    }
  }
}
```

**Status logic:**

- `healthy`: All checks pass
- `degraded`: Database slow (>1000ms) but reachable
- `unhealthy`: Database unreachable or critical error

### Trade-offs

#### Chosen Approach: Comprehensive Health Check

**Pros:**

- ✅ Accurate health status (detects database issues)
- ✅ Useful for debugging (connection pool info)
- ✅ Standard pattern (compatible with most monitoring tools)
- ✅ Fast response time (<100ms typically)

**Cons:**

- ❌ Slight overhead (database query per health check)
- ❌ More complex than basic health check
- ❌ Requires database query permissions

#### Alternative 1: Basic Process Health Only

**Pros:**

- ✅ Zero overhead
- ✅ Simple implementation
- ✅ No database dependency

**Cons:**

- ❌ Cannot detect database failures
- ❌ Less useful for monitoring
- ❌ May report "healthy" when app cannot serve requests

**Verdict:** ❌ Rejected - Not sufficient for production monitoring

#### Alternative 2: Full Application Test

Test actual application logic (e.g., query users table):

**Pros:**

- ✅ Most accurate health check
- ✅ Verifies permissions and schema

**Cons:**

- ❌ Slower (100-500ms)
- ❌ Requires specific tables/data
- ❌ More complex to maintain

**Verdict:** ❌ Rejected - Overkill for health check, prefer simple connectivity test

#### Alternative 3: Separate Liveness vs Readiness

Kubernetes-style separate endpoints:

- `/health/live` - Process alive
- `/health/ready` - Ready to serve traffic

**Pros:**

- ✅ Granular control for orchestration
- ✅ Standard Kubernetes pattern

**Cons:**

- ❌ More endpoints to maintain
- ❌ Overkill for current deployment (Docker + Coolify)

**Verdict:** ❌ Deferred - Can add later if needed

### Monitoring Integration

#### UptimeRobot Configuration

**Monitor settings:**

- Type: HTTP(S)
- URL: `https://learntotarkov.com/api/health`
- Method: GET
- Interval: 5 minutes
- Timeout: 30 seconds
- Keyword monitoring: "healthy" (alerts if missing)

**Alert rules:**

- Down: 2 consecutive failures
- Response time: >2 seconds
- Missing keyword: "healthy" not in response

#### Coolify Health Check

**Docker health check:**

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

**Deployment strategy:**

- Zero-downtime: New container must pass health check before old container stops
- Rollback: If health check fails after deploy, rollback to previous version

### Security Considerations

1. **Rate limiting**: Health check should not be rate limited (needed for rapid checks)
2. **No authentication**: Public endpoint (no sensitive data exposed)
3. **Error redaction**: Database errors sanitized before returning
4. **No PII**: Response contains only operational metrics

### Performance Impact

**Expected latency:**

- Database query: 10-50ms (local network)
- JSON serialization: <1ms
- Total response time: 20-100ms

**Load impact:**

- Health checks every 5 minutes (UptimeRobot)
- Health checks every 30 seconds (Docker)
- ~3 extra database queries per minute
- Negligible impact on database performance

### Testing Strategy

1. **Unit tests**: Mock Prisma client, test response formatting
2. **Integration tests**: Test against test database
3. **Manual testing**:
   - Normal operation: Returns 200 + healthy status
   - Database down: Returns 503 + unhealthy status
   - Slow database: Returns 200 + degraded status (if >1000ms)
4. **Load testing**: Verify health check doesn't impact performance

## Implementation Plan

### Step 1: Update Health Check Endpoint

Enhance [src/app/api/health/route.ts](../src/app/api/health/route.ts):

- Add database connectivity check
- Add connection pool metrics
- Add error handling with 503 status
- Structure response with checks object

### Step 2: Add Logging

Use Pino structured logging:

- Log health check failures (warn level)
- Include error details and response time
- No logging for successful checks (reduce noise)

### Step 3: Test Implementation

Manual testing:

1. Start dev server: `npm run dev`
2. Test healthy: `curl http://localhost:3000/api/health`
3. Test unhealthy: Stop database, retry
4. Verify response format and status codes

### Step 4: Documentation

Update docs:

- Add health check details to `docs/PRODUCTION_DEPLOYMENT.md`
- Document response schema
- Include UptimeRobot configuration

### Step 5: Deploy and Monitor

1. Deploy to production
2. Verify health check responds correctly
3. Configure UptimeRobot monitor
4. Monitor for false positives/negatives

## Files to Modify

1. **src/app/api/health/route.ts** - Enhanced health check logic
2. **docs/PRODUCTION_DEPLOYMENT.md** - Health check documentation
3. **Dockerfile** (if needed) - Health check command

## Acceptance Criteria

- [ ] Health check returns 200 OK when database is reachable
- [ ] Health check returns 503 when database is unreachable
- [ ] Response includes database status and response time
- [ ] Response includes connection pool metrics (if available)
- [ ] Health check completes in <1 second under normal conditions
- [ ] Database query has 5-second timeout
- [ ] Errors are logged with Pino
- [ ] Response format matches schema
- [ ] Manual testing passes all scenarios

## Estimated Effort

**1-2 hours**

- Implementation: 30 minutes
- Testing: 30 minutes
- Documentation: 30 minutes

## Related Issues

- **Issue #197**: UptimeRobot monitoring (depends on this)
- **Issue #185**: Production deployment epic (parent)
