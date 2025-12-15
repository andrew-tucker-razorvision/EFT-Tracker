# Database Backup Procedures

This document outlines backup and restoration procedures for the EFT-Tracker database hosted on Neon.

## Overview

The EFT-Tracker uses Neon PostgreSQL for database hosting, which provides built-in backup capabilities:

- **Automatic Backups**: 7-day point-in-time recovery (PITR) on free tier
- **Manual Backups**: Branch creation for instant copy-on-write backups
- **Retention**: 7 days for manual backups (automatic on free tier)

## Neon Backup Features

### Automatic Point-in-Time Recovery (PITR)

Neon automatically maintains transaction logs that allow you to restore your database to any point in time within the last 7 days (free tier) or 30 days (scale tier).

**Features:**

- No manual intervention required
- Granularity down to the second
- Available through Neon dashboard
- No additional storage costs

### Manual Backups via Branching

Neon branches provide instant copy-on-write backups of your database at a specific point in time.

**Features:**

- Instant creation (no downtime)
- Copy-on-write (minimal storage usage initially)
- Independent connection string
- Can be used for testing, staging, or backup purposes

## When to Create Manual Backups

Create manual backups before:

1. **Schema Migrations**: Before running `prisma migrate deploy`
2. **Major Deployments**: Before deploying significant code changes
3. **Bulk Data Operations**: Before running scripts that modify large amounts of data
4. **Configuration Changes**: Before changing database settings or connection pooling
5. **On-Demand**: For compliance, auditing, or before risky operations

## Manual Backup Procedure

### Step 1: Create Backup Branch

1. Navigate to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click "Branches" in the sidebar
4. Click "Create Branch"
5. Configure the branch:
   - **Name**: `backup-YYYYMMDD-HHMMSS` (e.g., `backup-20250113-143000`)
   - **Source**: `main` (or current production branch)
   - **Point in time**: "Now" (or select specific timestamp for PITR)
6. Click "Create Branch"

### Step 2: Document the Backup

Record the backup in your deployment notes:

```bash
# In deployment log or PR description
echo "Backup created: backup-20250113-143000" >> deployment-log.txt
```

Include:

- Backup branch name
- Creation timestamp
- Reason for backup (e.g., "Pre-migration backup for schema v1.5")
- Expected retention date (7 days from creation)

### Step 3: Verify Backup

1. Navigate to the backup branch in Neon console
2. Copy the connection string
3. Test connection with psql or database client:

```bash
# Test connection
psql "postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require"

# Verify key tables exist
\dt

# Check row counts
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Quest";
SELECT COUNT(*) FROM "QuestProgress";
```

## Backup Retention Policy

- **Automatic PITR**: 7 days (free tier), 30 days (scale tier)
- **Manual Backups**: Delete after 7 days or when no longer needed
- **Critical Backups**: Document why a backup should be retained longer

### Deleting Old Backups

1. Navigate to Neon Console → Branches
2. Identify backups older than 7 days
3. Click the backup branch → Settings → Delete Branch
4. Confirm deletion

**Note**: Deleting old backups helps manage storage costs and keeps the branch list clean.

## Restoration Procedures

### Scenario 1: Restore from Manual Backup Branch

Use this when you have a known-good backup branch and need to roll back.

**Steps:**

1. **Identify Backup Branch**
   - Navigate to Neon Console → Branches
   - Find the appropriate backup (e.g., `backup-20250113-143000`)

2. **Get Connection String**
   - Click on the backup branch
   - Copy the connection string
   - Make sure to copy the correct environment (production)

3. **Update Application Configuration**
   - In Coolify, navigate to your application
   - Update `DATABASE_URL` environment variable with backup branch connection string
   - Save changes

4. **Redeploy Application**
   - Click "Redeploy" in Coolify
   - Wait for deployment to complete
   - Monitor health checks

5. **Verify Data Integrity**

   ```sql
   -- Check recent data
   SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 10;
   SELECT * FROM "QuestProgress" ORDER BY "updatedAt" DESC LIMIT 10;

   -- Verify counts match expected state
   SELECT COUNT(*) as total_users FROM "User";
   SELECT COUNT(*) as total_progress FROM "QuestProgress";
   ```

6. **Notify Users (if applicable)**
   - Inform users of the restoration
   - Explain any data that may have been rolled back
   - Provide ETA for normal operations

### Scenario 2: Restore from Point-in-Time Recovery (PITR)

Use this when you need to restore to a specific timestamp without a pre-existing backup branch.

**Steps:**

1. **Determine Restore Point**
   - Identify the exact timestamp before the issue occurred
   - Example: `2025-01-13 14:25:00 UTC`

2. **Create Branch from PITR**
   - Navigate to Neon Console → Branches
   - Click "Create Branch"
   - **Name**: `restore-YYYYMMDD-HHMMSS`
   - **Source**: `main`
   - **Point in time**: Select "Custom" and enter timestamp
   - Click "Create Branch"

3. **Verify Restored Data**
   - Connect to the new branch
   - Verify data is at the correct state
   - Check critical tables and recent changes

4. **Follow Steps 3-6 from Scenario 1**
   - Update `DATABASE_URL` in Coolify
   - Redeploy application
   - Verify data integrity
   - Notify users if needed

### Scenario 3: Promote Backup Branch to Primary

Use this for major rollbacks where you want to make the backup branch the new primary.

**Steps:**

1. **Verify Backup Branch**
   - Ensure the backup branch has the correct data
   - Test the application against the backup branch

2. **Update Primary Branch Pointer** (Option A - Recommended)
   - Update `DATABASE_URL` to point to backup branch
   - Rename backup branch to `production-YYYYMMDD`
   - Keep old primary branch as `rollback-YYYYMMDD`

3. **Create New Primary from Backup** (Option B)
   - Create new branch from backup branch
   - Name it `main-restored-YYYYMMDD`
   - Update application to use new branch
   - Delete old primary after verification

4. **Clean Up**
   - Archive or delete the problematic primary branch after 7 days
   - Update documentation with restoration details

## Recovery Time Objectives

- **Manual Backup Restoration**: 5-10 minutes
  - Get connection string: 1 minute
  - Update Coolify: 2 minutes
  - Redeploy: 3-5 minutes
  - Verification: 2 minutes

- **PITR Restoration**: 10-15 minutes
  - Create branch: 2-3 minutes
  - Verify data: 3-5 minutes
  - Update and redeploy: 5-7 minutes

- **Full Recovery**: 15-30 minutes
  - Includes investigation, decision-making, and user communication

## Testing Backup Procedures

### Monthly Backup Test

Perform this test monthly to ensure backup procedures work:

1. **Create Test Backup**

   ```bash
   # Create backup branch
   Name: test-backup-YYYYMMDD-HHMMSS
   Source: main
   Point in time: now
   ```

2. **Verify Backup Data**

   ```bash
   # Connect to backup
   psql "<backup-connection-string>"

   # Run verification queries
   \dt
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Quest";
   ```

3. **Test Restoration (Staging Only)**
   - Update staging environment to use backup branch
   - Redeploy staging
   - Verify application works correctly
   - Revert staging to normal branch

4. **Document Results**
   - Record time taken for each step
   - Note any issues encountered
   - Update procedures if needed

5. **Clean Up**
   - Delete test backup branch after verification

## Backup Checklist

### Pre-Deployment Backup Checklist

Use this checklist before major deployments:

- [ ] Review changes being deployed
- [ ] Determine if backup is needed (schema changes, bulk operations, etc.)
- [ ] Create backup branch with naming convention `backup-YYYYMMDD-HHMMSS`
- [ ] Verify backup branch creation in Neon console
- [ ] Test connection to backup branch
- [ ] Document backup in deployment notes
- [ ] Set calendar reminder to delete backup after 7 days
- [ ] Proceed with deployment

### Post-Incident Restoration Checklist

Use this checklist when restoring from backup:

- [ ] Identify the issue and determine restore point
- [ ] Choose restoration method (manual backup vs PITR)
- [ ] Create/identify restore branch
- [ ] Verify data in restore branch
- [ ] Update `DATABASE_URL` in Coolify
- [ ] Redeploy application
- [ ] Run verification queries
- [ ] Check application health
- [ ] Monitor error rates in Sentry
- [ ] Notify users of any data loss
- [ ] Document incident and restoration steps
- [ ] Schedule post-incident review

## Monitoring Backup Health

### Weekly Checks

- [ ] Verify automatic PITR is enabled on production branch
- [ ] Review list of manual backup branches
- [ ] Delete backups older than 7 days (unless documented otherwise)
- [ ] Check Neon storage usage

### Monthly Tests

- [ ] Perform backup creation and restoration test (non-production)
- [ ] Verify backup procedures documentation is up-to-date
- [ ] Review and update backup retention policy if needed
- [ ] Test PITR restoration on staging environment

## Troubleshooting

### Issue: Backup Branch Creation Fails

**Symptoms**: Error when creating branch in Neon console

**Resolution**:

1. Check Neon project limits (free tier: 10 branches max)
2. Delete unused branches to free up slots
3. Verify you have permissions to create branches
4. Contact Neon support if issue persists

### Issue: Cannot Connect to Backup Branch

**Symptoms**: Connection timeout or authentication error

**Resolution**:

1. Verify connection string is correct
2. Check IP allowlist settings in Neon
3. Ensure SSL mode is required: `?sslmode=require`
4. Test with `psql` to isolate application vs connection issues

### Issue: Backup Branch Has Missing Data

**Symptoms**: Row counts don't match expected values

**Resolution**:

1. Verify backup was created at correct point in time
2. Check Neon Console → Branches → History for branch creation timestamp
3. Create new backup from earlier PITR timestamp if needed
4. Investigate source of data loss (application bug, user deletion, etc.)

### Issue: Restoration Takes Too Long

**Symptoms**: Application deployment exceeds 10 minutes

**Resolution**:

1. Check Coolify build logs for errors
2. Verify database connection pool isn't exhausted
3. Test connection to backup branch independently
4. Consider using Neon's "Scale to Zero" feature during restoration

## Related Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Database Branching Strategy](./DATABASE_BRANCHING.md)
- [Incident Response Runbook](./RUNBOOKS.md) (when created)
- [Disaster Recovery Procedures](./INCIDENT_RESPONSE.md) (when created)

## Additional Resources

- [Neon Branching Documentation](https://neon.tech/docs/introduction/branching)
- [Neon Point-in-Time Recovery](https://neon.tech/docs/introduction/point-in-time-restore)
- [Neon Console](https://console.neon.tech)

## Revision History

| Date       | Version | Changes               |
| ---------- | ------- | --------------------- |
| 2025-01-13 | 1.0     | Initial documentation |
