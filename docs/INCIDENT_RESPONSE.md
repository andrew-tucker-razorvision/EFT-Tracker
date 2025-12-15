# Incident Response and Disaster Recovery

This document outlines disaster recovery procedures, incident response workflows, and recovery objectives for the EFT-Tracker application.

## Table of Contents

- [Recovery Objectives](#recovery-objectives)
- [Incident Severity Classification](#incident-severity-classification)
- [Disaster Scenarios](#disaster-scenarios)
- [Incident Response Workflow](#incident-response-workflow)
- [Communication Templates](#communication-templates)
- [Post-Incident Review](#post-incident-review)

## Recovery Objectives

### Recovery Point Objective (RPO)

**Target: 1 hour**

- Maximum acceptable data loss period
- Based on Neon's point-in-time recovery granularity
- Users may lose up to 1 hour of quest progress in worst-case scenario
- Automatic PITR backups every second (can restore to any point within 7 days)

### Recovery Time Objective (RTO)

**Target: 30 minutes**

- Maximum acceptable downtime for critical incidents
- Includes:
  - Detection: 5 minutes (via monitoring)
  - Decision: 5 minutes (assess situation)
  - Restoration: 15 minutes (execute recovery)
  - Verification: 5 minutes (confirm systems operational)

### Acceptable Data Loss Scenarios

**Zero Data Loss (P0):**

- User account data
- Authentication credentials
- Quest definitions and relationships

**Minimal Data Loss Acceptable (P1):**

- Quest progress updates (up to 1 hour via PITR)
- Companion app sync events (can be re-synced)
- Session data (users can re-login)

**No Recovery Needed (P2/P3):**

- Cached data
- Temporary files
- Log entries older than retention period

## Incident Severity Classification

### P0: Critical - Response Time: Immediate

**Definition:**

- Complete service outage (site unreachable)
- Database completely unavailable
- Data loss or corruption detected
- Security breach or data exposure
- Authentication broken for all users

**Response Actions:**

1. **Immediate acknowledgment** (within 5 minutes)
2. **Activate incident commander**
3. **Create war room** (incident channel/call)
4. **Execute appropriate disaster recovery procedure**
5. **Communicate status every 15 minutes**

**Escalation:**

- Notify all stakeholders immediately
- Consider emergency rollback without testing
- Activate backup systems if available

### P1: High - Response Time: 15 minutes

**Definition:**

- Partial outage affecting >50% of users
- Major feature completely broken (quest tracking, auth, sync)
- Severe performance degradation (>10s response times)
- Database connection issues affecting functionality

**Response Actions:**

1. **Acknowledge within 15 minutes**
2. **Assign incident owner**
3. **Begin investigation**
4. **Prepare rollback plan**
5. **Update status every 30 minutes**

**Escalation:**

- Notify stakeholders within 30 minutes
- Consider rollback if no fix identified within 1 hour

### P2: Medium - Response Time: 1 hour

**Definition:**

- Minor feature broken (non-critical functionality)
- Performance issues affecting <50% of users
- Non-critical API failures with fallback available
- Intermittent errors with low frequency

**Response Actions:**

1. **Acknowledge within 1 hour**
2. **Assign engineer to investigate**
3. **Document issue and impact**
4. **Plan fix for next deployment**
5. **Update status daily**

**Escalation:**

- Standard fix/deploy cycle
- No emergency procedures needed

### P3: Low - Response Time: 4 hours

**Definition:**

- Cosmetic issues (UI glitches)
- Minor bugs with workarounds available
- Documentation errors
- Non-user-facing issues

**Response Actions:**

1. **Acknowledge within 4 hours**
2. **Add to backlog**
3. **Fix in next sprint**

## Disaster Scenarios

### Scenario 1: Database Corruption

**Symptoms:**

- Query errors indicating corrupted data
- Inconsistent data returned from database
- Failed integrity checks

**Impact:** P0 - Critical

**Recovery Procedure:**

1. **Immediate Actions**

   ```bash
   # 1. Take application offline (maintenance mode if available)
   # 2. Document corruption evidence
   # 3. Create emergency backup of current state (even if corrupted)
   ```

2. **Identify Restore Point**
   - Determine when corruption occurred
   - Check recent deployments and migrations
   - Review Sentry errors for timing
   - Target PITR timestamp before corruption

3. **Create Recovery Branch**

   ```bash
   # In Neon Console:
   # Branches → Create Branch
   # Name: disaster-recovery-YYYYMMDD-HHMMSS
   # Source: main
   # Point in time: [timestamp before corruption]
   ```

4. **Verify Recovery Data**

   ```sql
   -- Connect to recovery branch
   -- Run integrity checks
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Quest";
   SELECT COUNT(*) FROM "QuestProgress";

   -- Verify recent data looks correct
   SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 10;
   SELECT * FROM "QuestProgress" ORDER BY "updatedAt" DESC LIMIT 10;
   ```

5. **Switch to Recovery Branch**

   ```bash
   # In Coolify:
   # 1. Update DATABASE_URL to recovery branch connection string
   # 2. Redeploy application
   # 3. Monitor health checks
   # 4. Run smoke tests
   ```

6. **Verify and Communicate**
   - Test critical user flows
   - Check authentication works
   - Verify quest data displays correctly
   - Notify users of data loss window (RPO)

**Estimated Recovery Time:** 20-30 minutes

### Scenario 2: Complete Database Loss

**Symptoms:**

- Database connection completely fails
- Neon reports service unavailable
- All database queries timeout

**Impact:** P0 - Critical

**Recovery Procedure:**

1. **Verify Outage**

   ```bash
   # Test direct database connection
   psql "$DATABASE_URL"

   # Check Neon status page
   # https://neon.tech/status
   ```

2. **If Neon Infrastructure Issue**
   - Wait for Neon to resolve (automatic failover)
   - Monitor Neon status page
   - Communicate with users about external issue
   - ETA based on Neon's updates

3. **If Project-Specific Issue**

   ```bash
   # Create new branch from latest backup
   # In Neon Console:
   # Branches → Create Branch
   # Name: emergency-restore-YYYYMMDD-HHMMSS
   # Source: main
   # Point in time: Latest available

   # Update Coolify DATABASE_URL
   # Redeploy application
   ```

4. **Verify Recovery**
   - Run health check: `/api/health`
   - Test user login
   - Verify quest data loads
   - Check companion app sync

**Estimated Recovery Time:** 15-20 minutes

### Scenario 3: Application Server Failure

**Symptoms:**

- Coolify reports container crash
- Application health checks failing
- 502/503 errors from proxy
- Server unresponsive

**Impact:** P0 - Critical

**Recovery Procedure:**

1. **Check Server Status**

   ```bash
   # SSH to Hetzner VPS
   ssh root@panel.razorvision.com

   # Check Coolify status
   docker ps | grep eft-tracker

   # Check system resources
   htop
   df -h
   ```

2. **If Container Issue**

   ```bash
   # Restart container via Coolify UI
   # Or via CLI:
   docker restart <container-id>
   ```

3. **If Server Resource Issue**

   ```bash
   # Check disk space
   du -h --max-depth=1 /

   # Clear old Docker images
   docker system prune -a

   # Check memory
   free -h
   ```

4. **If Server Completely Down**
   - Reboot VPS via Hetzner control panel
   - Wait for Coolify to start (~2 minutes)
   - Application auto-starts with Coolify

5. **If Persistent Failure**
   - Roll back to previous deployment
   - In Coolify: Deployments → Previous successful → Redeploy
   - Investigate root cause after service restored

**Estimated Recovery Time:** 5-15 minutes

### Scenario 4: Deployment Failure Causing Outage

**Symptoms:**

- Deployment completed but application won't start
- Health checks failing after deployment
- Build succeeded but runtime errors
- Database migration failed

**Impact:** P1 - High

**Recovery Procedure:**

1. **Immediate Rollback**

   ```bash
   # In Coolify UI:
   # 1. Navigate to Deployments
   # 2. Find previous successful deployment
   # 3. Click "Redeploy"
   # 4. Monitor health checks
   ```

2. **Investigate Failure**

   ```bash
   # Check Coolify build logs
   # Look for:
   # - npm install errors
   # - TypeScript compilation errors
   # - Missing environment variables
   # - Database migration errors
   ```

3. **If Migration Issue**

   ```bash
   # Check Prisma migration status
   npx prisma migrate status

   # If migration failed, may need to:
   # 1. Roll back database to pre-migration state (use backup)
   # 2. Fix migration script
   # 3. Test on staging
   # 4. Deploy again
   ```

4. **Verify Rollback**
   - Test health endpoint: `/api/health`
   - Check recent deployments in Sentry
   - Monitor error rates
   - Test critical user flows

**Estimated Recovery Time:** 10-15 minutes

### Scenario 5: Accidental Data Deletion

**Symptoms:**

- User reports missing quest progress
- Bulk data delete detected in logs
- Database row count drops suddenly

**Impact:** P1 - High (if widespread), P2 - Medium (if limited)

**Recovery Procedure:**

1. **Assess Impact**

   ```sql
   -- Check affected users
   SELECT COUNT(*) FROM "QuestProgress"
   WHERE "updatedAt" > NOW() - INTERVAL '1 hour';

   -- Compare with historical counts
   SELECT COUNT(*) FROM "QuestProgress";
   ```

2. **Identify Deletion Time**
   - Check application logs for delete operations
   - Review Sentry events
   - Check Prisma query logs
   - Determine PITR restore point (just before deletion)

3. **Create Restore Branch for Data**

   ```bash
   # Create branch from just before deletion
   # Neon Console → Create Branch
   # Name: data-restore-YYYYMMDD-HHMMSS
   # Point in time: [timestamp before deletion]
   ```

4. **Extract Lost Data**

   ```sql
   -- Connect to restore branch
   -- Export affected data
   \copy (SELECT * FROM "QuestProgress" WHERE "userId" IN (...)) TO '/tmp/restore-data.csv' CSV HEADER;
   ```

5. **Import to Production**

   ```sql
   -- Connect to production database
   -- Re-import lost data (use ON CONFLICT to avoid duplicates)
   INSERT INTO "QuestProgress" (...)
   SELECT * FROM restored_data
   ON CONFLICT (userId, questId) DO UPDATE ...;
   ```

**Estimated Recovery Time:** 30-60 minutes (depending on data volume)

## Incident Response Workflow

### Step 1: Detection

**Automatic Detection:**

- Sentry alerts for critical errors
- UptimeRobot alerts for downtime
- Health check failures in Coolify

**Manual Detection:**

- User reports via GitHub issues
- Social media mentions
- Direct user contact

### Step 2: Acknowledge

1. Respond within SLA timeframe
2. Create incident ticket/document
3. Assign incident commander (if P0/P1)
4. Begin investigation

### Step 3: Assess

1. Determine severity level (P0-P3)
2. Identify affected systems
3. Estimate user impact (% affected)
4. Review recent changes (deployments, config, migrations)

**Quick Assessment Checklist:**

```bash
# 1. Check application health
curl https://learntotarkov.com/api/health

# 2. Check database connectivity
# (via health endpoint or direct connection)

# 3. Check recent deployments
# Coolify → Deployments → Recent activity

# 4. Check error rates
# Sentry → Issues → Last 1 hour

# 5. Check server resources
# Coolify → Server → Metrics
```

### Step 4: Communicate

**Internal:**

- Create incident channel (if not exists)
- Update stakeholders on status
- Assign roles (commander, responders, communicator)

**External (P0/P1 only):**

- Post to status page (if available)
- Send user notification (see templates below)
- Update social media
- Set auto-responder for support

### Step 5: Mitigate

Choose appropriate mitigation:

- **Immediate:** Emergency rollback
- **Short-term:** Apply hotfix
- **Long-term:** Implement permanent fix

Execute disaster recovery procedure if needed (see scenarios above).

### Step 6: Verify

1. **Confirm Resolution**
   - Run smoke tests
   - Check health endpoints
   - Verify error rates returned to normal
   - Test critical user flows

2. **Monitor Stability**
   - Watch metrics for 30 minutes post-fix
   - Check Sentry for new related errors
   - Monitor user reports

### Step 7: Document

1. Update incident ticket with:
   - Timeline of events
   - Actions taken
   - Final resolution
   - Data loss (if any)
2. Close incident
3. Schedule post-incident review

## Communication Templates

### Template 1: Incident Detection (Internal)

```
🚨 INCIDENT ALERT - P[0/1/2/3]

Title: [Brief description]
Detected: [Timestamp]
Severity: P[0/1/2/3]
Impact: [% users affected / specific feature]

Symptoms:
- [List observed issues]

Next Steps:
- [ ] Acknowledge incident
- [ ] Assign incident commander
- [ ] Begin investigation

Incident Channel: [link]
Incident Document: [link]
```

### Template 2: User Notification (External - P0/P1)

```markdown
# [Service Status] EFT-Tracker Experiencing Issues

Posted: [Timestamp]
Status: Investigating / Identified / Monitoring / Resolved

## Issue

We are currently experiencing [brief description of issue]. This is affecting [specific features or % of users].

## Impact

- [List what users cannot do]
- [Estimated affected users]

## What We're Doing

Our team is actively working on restoration. Current progress:

- [Action item 1] - In Progress
- [Action item 2] - Pending

## Expected Resolution

ETA: [estimated time or "investigating"]

## What You Can Do

[Workarounds if available, or "Please wait for resolution"]

## Updates

We will provide updates every [15/30/60] minutes.

Next update: [Timestamp]

---

Last updated: [Timestamp]
```

### Template 3: Resolution Notification

```markdown
# [Service Status] Issue Resolved

Posted: [Timestamp]
Status: Resolved

## Resolution

The issue affecting [feature/users] has been resolved. All systems are now operational.

## What Happened

[Brief explanation without technical jargon]

## Impact

- Duration: [HH:MM]
- Affected users: [X% or "limited set"]
- Data loss: [None / Minimal - last X minutes of progress]

## What We Did

[High-level explanation of fix]

## What's Next

We are conducting a full post-incident review to prevent similar issues in the future.

## Apology

We apologize for any inconvenience this may have caused. Thank you for your patience.

---

If you continue to experience issues, please:

1. Clear your browser cache
2. Try logging out and back in
3. Contact support: [GitHub Issues link]
```

### Template 4: Data Loss Notification

```markdown
# [Service Status] Service Restored - Data Recovery Information

Posted: [Timestamp]
Status: Resolved (with data loss)

## Service Restored

EFT-Tracker is now fully operational. However, we need to inform you about data loss during the incident.

## Data Loss Details

**Time Window:** [Start time] to [End time] ([Duration])

**Affected Data:**

- Quest progress updates made during this window

**NOT Affected:**

- User accounts
- Quest definitions
- Progress made before [Start time]

## Recovery

We restored to the last known good backup from [Timestamp]. This means:

- ✅ All data before [Timestamp] is intact
- ❌ Changes made between [Timestamp] and incident are lost

## What This Means for You

If you updated quest progress during [Time window], you will need to:

1. Review your current progress
2. Re-mark any quests completed during that time
3. Re-sync companion app if used

## Apology

We sincerely apologize for this data loss. We are implementing additional measures to prevent similar incidents:

- [Prevention measure 1]
- [Prevention measure 2]

## Support

If you have questions or need assistance, please:

- Create an issue: [GitHub Issues link]
- Include your username and approximate time of lost progress
```

## Post-Incident Review

### Conduct Review Within 24-48 Hours

**Required Attendees:**

- Incident commander
- Key responders
- Product owner (if applicable)

**Review Agenda:**

1. **Timeline Review** (10 minutes)
   - Walk through incident timeline
   - When detected, acknowledged, resolved
   - Key decision points

2. **Root Cause Analysis** (20 minutes)
   - What happened?
   - Why did it happen?
   - Contributing factors?

3. **Response Evaluation** (15 minutes)
   - What went well?
   - What could be improved?
   - Were RTO/RPO met?

4. **Action Items** (15 minutes)
   - Preventive measures
   - Process improvements
   - Documentation updates
   - Technical debt to address

### Post-Incident Review Template

```markdown
# Post-Incident Review: [Incident Title]

**Incident Date:** [Date]
**Review Date:** [Date]
**Severity:** P[0/1/2/3]
**Duration:** [HH:MM]

## Executive Summary

[2-3 sentence summary of what happened and how it was resolved]

## Timeline

| Time  | Event                          | Owner |
| ----- | ------------------------------ | ----- |
| HH:MM | Issue first detected           | [Who] |
| HH:MM | Incident acknowledged          | [Who] |
| HH:MM | Root cause identified          | [Who] |
| HH:MM | Fix deployed                   | [Who] |
| HH:MM | Incident resolved              | [Who] |
| HH:MM | Post-incident review scheduled | [Who] |

## Impact

- **Users Affected:** [Number or %]
- **Duration:** [HH:MM]
- **Data Loss:** [Yes/No - details]
- **Financial Impact:** [$X in SLA credits, revenue loss, etc.]

## Root Cause

### What Happened

[Detailed technical explanation]

### Why It Happened

[Contributing factors, underlying issues]

### Why It Wasn't Detected Sooner

[Monitoring gaps, alert failures]

## Response Evaluation

### What Went Well ✅

- [Success 1]
- [Success 2]

### What Could Be Improved 🔄

- [Improvement 1]
- [Improvement 2]

### RTO/RPO Performance

- **RPO Target:** 1 hour | **Actual:** [X minutes]
- **RTO Target:** 30 minutes | **Actual:** [X minutes]

## Action Items

| Action                   | Owner | Due Date | Priority |
| ------------------------ | ----- | -------- | -------- |
| [Preventive measure 1]   | [Who] | [Date]   | High     |
| [Process improvement 1]  | [Who] | [Date]   | Medium   |
| [Documentation update 1] | [Who] | [Date]   | Low      |

## Lessons Learned

1. [Lesson 1]
2. [Lesson 2]
3. [Lesson 3]

## Follow-Up

- [ ] Action items created and tracked
- [ ] Runbooks updated
- [ ] Monitoring improved
- [ ] Team training scheduled (if needed)
```

## Related Documentation

- [Database Backup Procedures](./DATABASE_BACKUPS.md)
- [Production Runbooks](./RUNBOOKS.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Database Branching Strategy](./DATABASE_BRANCHING.md)

## Revision History

| Date       | Version | Changes                         |
| ---------- | ------- | ------------------------------- |
| 2025-01-13 | 1.0     | Initial incident response guide |
