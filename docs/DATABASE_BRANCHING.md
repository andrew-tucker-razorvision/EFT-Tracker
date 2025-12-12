# Neon Database Branching Guide

This guide covers using Neon database branching for staging environments and E2E testing with isolated data.

## Table of Contents

- [Overview](#overview)
- [Branch Types](#branch-types)
- [Creating Branches](#creating-branches)
- [Branch Management](#branch-management)
- [Connection Strings](#connection-strings)
- [Migration Strategy](#migration-strategy)
- [Testing with Branches](#testing-with-branches)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Neon database branching provides instant, isolated copies of your database using copy-on-write technology. This allows you to:

- Test database migrations without affecting production
- Create staging environments with production-like data
- Run E2E tests with isolated test data
- Experiment with schema changes safely

### Key Features

- **Instant Creation**: Branches are created in seconds using copy-on-write
- **Isolated Data**: Changes to branches don't affect the main database
- **Point-in-Time Recovery**: Create branches from any point in time
- **Cost-Effective**: Only stores the data that differs from the parent branch
- **Connection Pooling**: Each branch has its own pooled connection endpoint

## Branch Types

### Main Branch (Production)

- **Purpose**: Production database
- **Lifecycle**: Permanent
- **Data**: Real production data
- **Naming**: `main` (default)
- **Connection**: Use pooler endpoint (`*-pooler.*.neon.tech`)

### Staging Branch

- **Purpose**: Pre-production testing and validation
- **Lifecycle**: Long-lived (permanent or recreated monthly)
- **Data**: Copy of production data or anonymized subset
- **Naming**: `staging`
- **Connection**: Use pooler endpoint for staging

### Development Branches

- **Purpose**: Feature development and testing
- **Lifecycle**: Short-lived (days to weeks)
- **Data**: Copy of staging or production
- **Naming**: `dev-feature-name`, `dev-username`
- **Connection**: Direct connection (non-pooled) for development

### Test Branches (Ephemeral)

- **Purpose**: Automated E2E tests
- **Lifecycle**: Ephemeral (created and deleted per test run)
- **Data**: Seeded test data
- **Naming**: `test-{timestamp}`, `test-{pr-number}`
- **Connection**: Direct connection

## Creating Branches

### Via Neon Dashboard

1. **Access Neon Dashboard**
   - Navigate to https://console.neon.tech
   - Select your project

2. **Create Branch**
   - Click "Branches" in left sidebar
   - Click "Create Branch"
   - Configure branch:
     - Name: `staging` (or appropriate name)
     - Parent: `main`
     - Point in time: Latest (or specific timestamp)
   - Click "Create"

3. **Get Connection String**
   - Click on the new branch
   - Copy the connection string
   - For production-like usage, use the pooler endpoint

### Via Neon CLI (Future)

```bash
# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# Create branch
neonctl branches create --name staging --parent main

# List branches
neonctl branches list

# Delete branch
neonctl branches delete staging
```

### Via API (Future - for CI/CD)

```bash
# Create branch via API
curl -X POST https://console.neon.tech/api/v2/projects/{project_id}/branches \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "branch": {
      "name": "test-'$(date +%s)'",
      "parent_id": "main"
    }
  }'
```

## Branch Management

### Staging Branch Lifecycle

**Initial Setup:**

```bash
# 1. Create staging branch in Neon dashboard
# 2. Get connection string (with pooler endpoint)
# 3. Add to environment variables
DATABASE_URL_STAGING="postgresql://user:pass@ep-staging-pooler.region.aws.neon.tech/dbname"

# 4. Run migrations on staging
DATABASE_URL=$DATABASE_URL_STAGING npx prisma migrate deploy

# 5. Seed staging data (optional)
DATABASE_URL=$DATABASE_URL_STAGING npm run seed
```

**Monthly Reset (Recommended):**

```bash
# Staging should be reset monthly to stay in sync with production

# 1. In Neon dashboard, delete staging branch
# 2. Create new staging branch from main
# 3. Update connection string if changed
# 4. Run migrations
DATABASE_URL=$DATABASE_URL_STAGING npx prisma migrate deploy
```

### Development Branch Workflow

```bash
# Developer creates branch for feature work
# 1. Create branch in Neon dashboard: dev-feature-name
# 2. Get connection string
# 3. Work locally with branch

# Add to .env.local
DATABASE_URL="postgresql://user:pass@ep-dev-feature.region.aws.neon.tech/dbname"

# Run migrations
npx prisma migrate deploy

# When feature is done, delete branch in Neon dashboard
```

### Ephemeral Test Branches (Future)

```bash
# Create branch for E2E test run
# This will be automated in CI

# 1. Create branch from main
curl -X POST https://console.neon.tech/api/v2/projects/{id}/branches \
  -d '{"branch": {"name": "test-'$CI_BUILD_ID'", "parent_id": "main"}}'

# 2. Run migrations
DATABASE_URL=$TEST_BRANCH_URL npx prisma migrate deploy

# 3. Seed test data
DATABASE_URL=$TEST_BRANCH_URL npm run seed:test

# 4. Run E2E tests
DATABASE_URL=$TEST_BRANCH_URL npm run test:e2e

# 5. Delete branch
curl -X DELETE https://console.neon.tech/api/v2/projects/{id}/branches/test-$CI_BUILD_ID
```

## Connection Strings

### Format

```
postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[database]?sslmode=require
```

### Pooler Endpoints

For production and staging (high connection count):

```
# Main/Production (pooler)
postgresql://user:pass@ep-main-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Staging (pooler)
postgresql://user:pass@ep-staging-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Direct Endpoints

For development and ephemeral test branches (low connection count):

```
# Dev branch (direct)
postgresql://user:pass@ep-dev-feature.us-east-1.aws.neon.tech/neondb?sslmode=require

# Test branch (direct)
postgresql://user:pass@ep-test-12345.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Environment Variables

```bash
# .env.template

# Production (main branch with pooler)
DATABASE_URL=postgresql://user:pass@ep-main-pooler.region.aws.neon.tech/neondb

# Staging (staging branch with pooler)
DATABASE_URL_STAGING=postgresql://user:pass@ep-staging-pooler.region.aws.neon.tech/neondb

# Local development (can use any branch)
DATABASE_URL=postgresql://user:pass@ep-dev-yourname.region.aws.neon.tech/neondb
```

## Migration Strategy

### Running Migrations on Branches

```bash
# Production (via deployment)
DATABASE_URL=$DATABASE_URL_PRODUCTION npx prisma migrate deploy

# Staging (manual or via deployment)
DATABASE_URL=$DATABASE_URL_STAGING npx prisma migrate deploy

# Development branch (local)
DATABASE_URL=$DATABASE_URL_DEV npx prisma migrate dev
```

### Testing Migrations Before Production

1. **Create Migration on Dev Branch**

   ```bash
   # Connect to dev branch
   DATABASE_URL=$DEV_BRANCH_URL npx prisma migrate dev --name add_user_settings
   ```

2. **Test Migration on Staging**

   ```bash
   # Apply to staging
   DATABASE_URL=$STAGING_URL npx prisma migrate deploy

   # Verify in staging environment
   npm run test:integration
   ```

3. **Merge to Main and Deploy**

   ```bash
   # Migration runs automatically on production deploy via Coolify
   # Pre-deployment command: npx prisma migrate deploy
   ```

### Rolling Back Migrations

```bash
# Neon doesn't support Prisma migrate rollback directly
# Instead, use point-in-time recovery:

# 1. Create new branch from before migration
# In Neon dashboard: Create branch from timestamp before migration

# 2. Update connection string to new branch

# 3. Or manually write down migration:
#    - Copy the SQL from the migration file
#    - Write reverse SQL
#    - Execute on production (use with caution!)
```

## Testing with Branches

### Integration Tests

```bash
# Use staging branch for integration tests
DATABASE_URL=$DATABASE_URL_STAGING npm run test:integration
```

### E2E Tests (Local)

```bash
# Create a test branch in Neon dashboard
# Name it: test-local

# Run E2E tests
DATABASE_URL=$TEST_BRANCH_URL npm run test:e2e

# Reset test data by recreating branch or running seed script
DATABASE_URL=$TEST_BRANCH_URL npm run seed:test
```

### E2E Tests (CI) - Future

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on: [pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Create Neon branch
        id: create-branch
        run: |
          BRANCH_NAME="test-${{ github.run_id }}"
          # API call to create branch
          # Store connection string in output

      - name: Run migrations
        env:
          DATABASE_URL: ${{ steps.create-branch.outputs.connection_string }}
        run: npx prisma migrate deploy

      - name: Seed test data
        env:
          DATABASE_URL: ${{ steps.create-branch.outputs.connection_string }}
        run: npm run seed:test

      - name: Run E2E tests
        env:
          DATABASE_URL: ${{ steps.create-branch.outputs.connection_string }}
        run: npm run test:e2e

      - name: Delete Neon branch
        if: always()
        run: |
          # API call to delete test branch
```

## Best Practices

### Branch Naming Convention

- `main` - Production database
- `staging` - Staging environment
- `dev-{feature}` - Feature development (e.g., `dev-auth-system`)
- `dev-{username}` - Personal development (e.g., `dev-john`)
- `test-{timestamp}` - Ephemeral test branches (e.g., `test-1701234567`)
- `test-{pr-number}` - PR-specific test branches (e.g., `test-pr-123`)
- `backup-{YYYYMMDD}` - Manual backups (e.g., `backup-20250112`)

### Data Management

1. **Production Data Privacy**
   - Never use production data directly in development
   - Create anonymized data for staging if using production copy
   - Use synthetic test data for development and testing

2. **Staging Data**
   - Reset staging monthly to match production schema
   - Seed realistic test data for staging
   - Use staging for final validation before production deploy

3. **Development Data**
   - Use minimal dataset for development
   - Seed development branches with representative data
   - Don't replicate full production data volume

### Branch Lifecycle

1. **Staging**: Long-lived, reset monthly
2. **Development**: Short-lived (1-4 weeks), delete when feature merges
3. **Test**: Ephemeral (minutes to hours), auto-delete after tests
4. **Backup**: Create before major migrations, delete after 30 days

### Security

1. **Connection Strings**
   - Store in environment variables or secrets manager
   - Never commit connection strings to Git
   - Use different credentials for each branch if possible

2. **Access Control**
   - Limit production branch access to CI/CD and senior engineers
   - Allow broader access to staging and dev branches
   - Rotate credentials regularly

## Troubleshooting

### Branch Creation Fails

**Symptom**: "Failed to create branch" error in Neon dashboard

**Solutions**:

1. Check you haven't exceeded branch limit on your Neon plan
2. Verify parent branch exists and is active
3. Try creating from latest timestamp instead of specific point in time
4. Contact Neon support if issue persists

### Connection Timeout

**Symptom**: `Error: connect ETIMEDOUT` when connecting to branch

**Solutions**:

```bash
# 1. Verify connection string is correct
echo $DATABASE_URL

# 2. Check branch is active in Neon dashboard
# Inactive branches can't accept connections

# 3. Test connection with psql
psql "$DATABASE_URL" -c "SELECT version();"

# 4. Verify SSL mode is set
# Add ?sslmode=require to connection string

# 5. Check firewall allows connections to Neon
# Neon requires outbound HTTPS (port 443)
```

### Migration Fails on Branch

**Symptom**: `prisma migrate deploy` fails on branch

**Solutions**:

```bash
# 1. Check branch schema is in sync with parent
# In Neon dashboard, verify branch was created recently

# 2. Reset migrations
DATABASE_URL=$BRANCH_URL npx prisma migrate reset

# 3. Or start fresh by recreating branch
# Delete branch in Neon dashboard
# Create new branch from main
# Run migrations again
```

### Pooler Connection Errors

**Symptom**: "Too many connections" or pooler timeout errors

**Solutions**:

1. Use pooler endpoints for production and staging
2. Use direct endpoints for development and testing
3. Configure Prisma connection pool limits:

   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     // Limit connections when using pooler
     // Default is 10, reduce if you hit limits
     pool_timeout = 20
     connection_limit = 5
   }
   ```

### Branch Not Deleting

**Symptom**: Branch deletion fails in Neon dashboard

**Solutions**:

1. Verify no active connections to branch:
   - Close any database clients
   - Stop any running applications using the branch
2. Wait a few minutes and try again
3. Contact Neon support if branch is stuck

## Additional Resources

- [Neon Branching Documentation](https://neon.tech/docs/guides/branching)
- [Neon API Reference](https://api-docs.neon.tech/reference/getting-started-with-neon-api)
- [Prisma with Neon](https://www.prisma.io/docs/guides/database/neon)
- [Database Testing Best Practices](https://www.prisma.io/docs/guides/testing)
