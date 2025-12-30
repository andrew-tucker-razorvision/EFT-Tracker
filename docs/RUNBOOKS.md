# Production Runbooks

This document contains operational runbooks for EFT-Tracker production deployments, monitoring, and incident response.

## Table of Contents

- [Database Backup and Restore](#database-backup-and-restore)
- [Database Migrations](#database-migrations)
- [Deployment Procedures](#deployment-procedures)
- [Incident Response](#incident-response)
- [Monitoring](#monitoring)

## Database Backup and Restore

For comprehensive backup procedures, see [DATABASE_BACKUPS.md](./DATABASE_BACKUPS.md).

### Quick Reference: Create Backup

```bash
# 1. Navigate to Neon Console → Branches
# 2. Create Branch
# 3. Name: backup-YYYYMMDD-HHMMSS
# 4. Source: main
# 5. Point in time: now
```

### Quick Reference: Restore from Backup

```bash
# 1. Get backup branch connection string from Neon Console
# 2. Update DATABASE_URL in Coolify
# 3. Redeploy application
# 4. Verify data integrity
```

## Database Migrations

For comprehensive migration strategy, see [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md).

### Quick Reference: Safe Migration Deployment

**For safe operations (adding columns, tables, indexes):**

```bash
# 1. Test on staging branch first
DATABASE_URL="<staging-url>" npx prisma migrate deploy

# 2. Verify schema
npx prisma db pull

# 3. Run tests
npm test

# 4. Deploy to production
# Merge PR → Auto-deploys → Prisma migrate runs
```

**For unsafe operations (dropping, renaming, type changes):**

Use 2-phase deployment process:

**Phase 1:** Add new schema, deploy code that writes to both old and new
**Phase 2:** (1+ week later) Remove old schema after verifying Phase 1

See [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) for detailed patterns.

### Migration Testing Checklist

Before deploying database migrations:

- [ ] Tested on Neon staging branch
- [ ] Verified schema changes with `npx prisma db pull`
- [ ] All tests pass (`npm test`)
- [ ] Reviewed generated SQL
- [ ] Created pre-migration backup (if destructive)
- [ ] Verified backward compatibility (for 2-phase migrations)
- [ ] Documented rollback plan

### Common Migration Patterns

**Adding nullable column:**

```prisma
model User {
  newField String? // ✅ Safe to add
}
```

**Dropping column (2-phase):**

```text
Phase 1: Stop using column in code → Deploy
Phase 2: Drop column from schema → Deploy
```

**Renaming column (2-phase):**

```text
Phase 1: Add new column, write to both → Deploy
Phase 2: Remove old column → Deploy
```

## Deployment Procedures

### Pre-Deployment Checklist

Before deploying to production:

- [ ] All CI checks passing (tests, lint, security audit)
- [ ] PR approved and merged to master
- [ ] Database backup created (if schema changes or risky operations)
- [ ] Staging environment tested with production-like data
- [ ] Rollback plan documented
- [ ] Off-hours deployment scheduled (if high-risk)

### Standard Deployment Process

1. **Merge PR to Master**
   - Ensure all checks pass
   - Get approval from code owner
   - Squash and merge

2. **Monitor Auto-Deployment**
   - Coolify automatically triggers build on push to master
   - Watch build logs for errors
   - Typical build time: 3-6 minutes

3. **Verify Health Checks**

   ```bash
   # Check application health
   curl https://learntotarkov.com/api/health

   # Expected response: {"status": "ok", "database": "connected"}
   ```

4. **Verify Key Endpoints**
   - Home page loads: https://learntotarkov.com
   - Quests API works: https://learntotarkov.com/api/quests
   - Authentication works: Try login/register
   - Database queries succeed: Check quest progress loading

5. **Monitor Error Rates**
   - Check Sentry dashboard for new errors
   - Monitor for 15-30 minutes after deployment
   - Watch for unusual traffic patterns

### Rollback Procedure

If deployment fails or causes issues:

1. **Immediate Rollback (Application)**
   - Navigate to Coolify → Deployments
   - Find previous successful deployment
   - Click "Redeploy"
   - Monitor health checks

2. **Database Rollback (if needed)**
   - See [DATABASE_BACKUPS.md](./DATABASE_BACKUPS.md#restoration-procedures)
   - Use pre-deployment backup or PITR
   - Update `DATABASE_URL` in Coolify
   - Redeploy application

3. **Post-Rollback**
   - Verify application is stable
   - Document reason for rollback
   - Create issue to fix deployment problem
   - Notify users if there was downtime

## Incident Response

### Severity Levels

**P0 (Critical) - Response Time: Immediate**

- Complete service outage
- Database unavailable
- Authentication broken for all users
- Data loss or corruption

**P1 (High) - Response Time: 15 minutes**

- Partial outage affecting >50% of users
- Major feature completely broken
- Severe performance degradation

**P2 (Medium) - Response Time: 1 hour**

- Minor feature broken
- Performance issues affecting <50% of users
- Non-critical API failures

**P3 (Low) - Response Time: 4 hours**

- Cosmetic issues
- Minor bugs with workarounds
- Documentation errors

### Incident Response Workflow

1. **Acknowledge**
   - Respond to alert within SLA
   - Create incident channel/document
   - Begin investigation

2. **Assess**
   - Check Coolify logs
   - Check Sentry for errors
   - Review recent deployments
   - Check database health

3. **Mitigate**
   - Apply immediate fixes if available
   - Roll back deployment if needed
   - Scale resources if capacity issue
   - Enable maintenance mode if severe

4. **Communicate**
   - Update status page
   - Notify affected users
   - Provide ETA for resolution
   - Send regular updates every 30 minutes

5. **Resolve**
   - Implement permanent fix
   - Deploy to production
   - Verify resolution
   - Close incident

6. **Post-Incident Review**
   - Schedule review within 24-48 hours
   - Document root cause
   - Create action items to prevent recurrence
   - Update runbooks if needed

### Common Incident Scenarios

#### Database Connection Exhaustion

**Symptoms:**

- 503 errors
- "Too many connections" errors
- Slow database queries

**Resolution:**

```bash
# 1. Check connection pool in health check
curl https://learntotarkov.com/api/health

# 2. Check Neon dashboard for active connections

# 3. Restart application to clear connections
# (In Coolify: Redeploy or restart container)

# 4. Review slow queries in last hour

# 5. Consider increasing connection pool limit
# Update DATABASE_URL query params: ?connection_limit=15
```

#### Deployment Failure

**Symptoms:**

- Build fails in Coolify
- Health checks fail after deployment
- Application won't start

**Resolution:**

```bash
# 1. Check build logs in Coolify
# Look for: npm install errors, TypeScript errors, missing env vars

# 2. Verify environment variables
# Ensure all required variables are set

# 3. Test migration on staging
# If database migration involved

# 4. Roll back to previous version
# Coolify → Deployments → Previous successful → Redeploy
```

#### High Error Rate

**Symptoms:**

- Spike in Sentry errors
- Elevated 500 responses
- User reports of failures

**Resolution:**

```bash
# 1. Check Sentry dashboard
# Identify common error pattern

# 2. Check recent deployments
# Correlate errors with recent changes

# 3. Check database status
curl https://learntotarkov.com/api/health

# 4. Review Coolify logs
# Look for application crashes or restarts

# 5. Roll back if error rate unacceptable
# Use rollback procedure above
```

#### Slow Performance

**Symptoms:**

- Page load times >3 seconds
- API response times >1 second
- User complaints of slowness

**Resolution:**

```bash
# 1. Check Neon dashboard
# Look for slow queries or high CPU

# 2. Check application logs
# Identify slow endpoints

# 3. Check database connection pool
# Ensure connections aren't maxed out

# 4. Review recent code changes
# Look for N+1 queries or inefficient operations

# 5. Consider adding database indexes
# If specific queries are slow
```

## Monitoring

### Daily Checks

- [ ] Check Sentry for new errors
- [ ] Review Coolify deployment status
- [ ] Check application uptime
- [ ] Verify database is healthy

### Weekly Checks

- [ ] Review error trends in Sentry
- [ ] Check database connection pool utilization
- [ ] Review Neon storage usage
- [ ] Delete old backup branches (>7 days)
- [ ] Check for npm security vulnerabilities

### Monthly Checks

- [ ] Perform backup restoration test (staging)
- [ ] Review and update runbooks
- [ ] Check for Next.js/dependency updates
- [ ] Load test critical endpoints
- [ ] Review incident response procedures

### Key Metrics to Monitor

**Application Health:**

- Uptime: Target 99.9%
- Error rate: Target <0.1%
- Response time (p95): Target <500ms
- Response time (p99): Target <1s

**Database Health:**

- Connection pool utilization: Target <80%
- Query performance: Most queries <100ms
- Storage usage: Monitor monthly growth
- Active connections: Stay under tier limit (20 on free tier)

**Security:**

- Failed login attempts: Watch for patterns
- Rate limit hits: Investigate spikes
- npm audit: Zero high/critical vulnerabilities
- Sentry security alerts: Review immediately

## Emergency Contacts

**System Access:**

- Coolify: https://panel.razorvision.com
- Neon Console: https://console.neon.tech
- Sentry: https://sentry.io
- GitHub: https://github.com/tuckerandrew21/EFT-Tracker

**Support:**

- Neon Support: support@neon.tech
- Coolify Discord: https://discord.gg/coolify
- GitHub Issues: https://github.com/tuckerandrew21/EFT-Tracker/issues

## Related Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Database Backup Procedures](./DATABASE_BACKUPS.md)
- [Database Migration Strategy](./DATABASE_MIGRATIONS.md)
- [Incident Response and Disaster Recovery](./INCIDENT_RESPONSE.md)
- [Database Branching Strategy](./DATABASE_BRANCHING.md)
- [Security Hardening](./security/SECURITY.md)

## Revision History

| Date       | Version | Changes                        |
| ---------- | ------- | ------------------------------ |
| 2025-01-13 | 1.0     | Initial runbooks documentation |
