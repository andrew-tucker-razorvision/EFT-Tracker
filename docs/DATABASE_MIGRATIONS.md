# Database Migration Strategy

This document defines the backward-compatible migration strategy for EFT-Tracker, ensuring safe database schema changes without downtime.

## Table of Contents

- [Overview](#overview)
- [Backward-Compatibility Principles](#backward-compatibility-principles)
- [Safe vs Unsafe Operations](#safe-vs-unsafe-operations)
- [2-Phase Deployment Process](#2-phase-deployment-process)
- [Common Migration Patterns](#common-migration-patterns)
- [Migration Testing](#migration-testing)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Overview

### Goals

- **Zero-downtime deployments** - Users never experience service interruption
- **Backward compatibility** - Old code works with new schema during rollout
- **Safe rollbacks** - Easy to revert if issues arise
- **Data integrity** - No data loss during migrations

### Key Principle

**Always deploy code changes before or alongside schema changes that support them. Never deploy schema changes that break existing code.**

## Backward-Compatibility Principles

### The Golden Rule

**New schema must work with old code AND new code must work with old schema.**

During a deployment, there's a window where:

1. Database has new schema
2. Some application instances run old code
3. Some application instances run new code

All three must coexist harmoniously.

### Compatibility Window

```
Time:      T0 ────────────────► T1 ────────────────► T2
Database:  [Old Schema]        [New Schema]         [New Schema]
App Code:  [Old Code]          [Old + New Code]     [New Code]
           ↓                   ↓                    ↓
           ✅ Compatible       ✅ Compatible        ✅ Compatible
```

### Safe Deployment Order

1. **Additive changes first** - Add new columns/tables
2. **Deploy code** - New code uses new + old schema
3. **Remove old schema** - After all instances updated

## Safe vs Unsafe Operations

### Safe Operations (Single Phase)

These changes are backward-compatible and can be deployed immediately:

#### ✅ Adding New Tables

```prisma
// Safe: New table doesn't affect existing queries
model NewFeature {
  id    String @id @default(uuid())
  name  String
}
```

**Why safe:** Old code doesn't know about this table.

#### ✅ Adding Nullable Columns

```prisma
model User {
  id       String @id
  email    String
  newField String? // ✅ Nullable - safe to add
}
```

**Why safe:** Old code doesn't write to it; NULLs are acceptable.

#### ✅ Adding Columns with Defaults

```prisma
model Quest {
  id      String  @id
  name    String
  enabled Boolean @default(true) // ✅ Has default - safe to add
}
```

**Why safe:** Old code doesn't set it; database provides value.

#### ✅ Adding Indexes

```sql
-- Safe: Only affects performance, not data structure
CREATE INDEX idx_user_email ON "User"("email");
```

**Why safe:** Doesn't change data, only query performance.

#### ✅ Adding Foreign Keys

```prisma
model QuestProgress {
  id      String @id
  userId  String
  user    User   @relation(fields: [userId], references: [id])
}
```

**Why safe (usually):** Enforces existing application logic at DB level.

**⚠️ Caution:** Ensure data integrity before adding FK.

### Unsafe Operations (Require 2-Phase)

These changes break backward compatibility and require careful planning:

#### ❌ Dropping Columns

**Problem:** Old code tries to SELECT/INSERT/UPDATE dropped column → **💥 Error**

**Solution:** 2-phase deployment (see [Dropping Columns](#dropping-columns))

#### ❌ Renaming Columns

**Problem:** Old code references old name → **💥 Error**

**Solution:** 2-phase deployment (see [Renaming Columns](#renaming-columns))

#### ❌ Changing Column Types

**Problem:** Old code writes incompatible data type → **💥 Error**

**Solution:** 2-phase deployment (see [Changing Column Types](#changing-column-types))

#### ❌ Adding NOT NULL Without Default

```prisma
model User {
  email    String
  required String  // ❌ NOT NULL, no default
}
```

**Problem:** Old code doesn't provide value → **💥 Error**

**Solution:** 2-phase deployment (see [Adding NOT NULL Constraints](#adding-not-null-constraints))

#### ❌ Renaming Tables

**Problem:** Old code queries old table name → **💥 Error**

**Solution:** Create view with old name, migrate code, drop view.

## 2-Phase Deployment Process

For unsafe operations, use this process:

### Phase 1: Make Schema Backward-Compatible

**Goal:** New schema works with old code.

**Steps:**

1. Add new schema elements (columns, tables)
2. Update code to write to BOTH old and new schema
3. Deploy code + migration
4. Verify old and new schema are in sync
5. Wait for all instances to update

**Deployment 1:**

- ✅ Old code works (ignores new schema)
- ✅ New code works (writes to both)

### Phase 2: Remove Old Schema

**Goal:** Clean up deprecated schema.

**Steps:**

1. Update code to stop using old schema
2. Deploy code
3. Verify no errors in logs
4. Drop old schema elements
5. Deploy migration

**Deployment 2:**

- ✅ New code only uses new schema
- ✅ Old schema removed

### Timeline Example

```
Week 1, Monday:
  - Phase 1 deployment
  - New column added
  - Code writes to both old and new

Week 1, Wednesday:
  - Monitor for issues
  - Verify data syncing correctly

Week 1, Friday:
  - Phase 2 deployment
  - Code stops using old column
  - Old column dropped
```

**Why wait?** Allows time to:

- Detect issues with Phase 1
- Roll back easily if needed
- Verify data migration

## Common Migration Patterns

### Dropping Columns

**Scenario:** Remove `User.companionToken` field.

#### Phase 1: Stop Using Column

**Schema:** Keep column

```prisma
model User {
  id             String  @id
  companionToken String? // Keep for now
}
```

**Code changes:**

```typescript
// ❌ Remove all references
// const token = user.companionToken;

// ✅ Stop reading/writing
```

**Deploy:** Code + no migration

**Verify:**

```sql
-- Check column not being written to
SELECT COUNT(*) FROM "User"
WHERE "companionToken" IS NOT NULL
AND "updatedAt" > NOW() - INTERVAL '1 day';
-- Should be 0 after sufficient time
```

#### Phase 2: Drop Column

**Schema:** Remove column

```prisma
model User {
  id String @id
  // companionToken removed
}
```

**Migration:** Prisma generates `DROP COLUMN`

**Deploy:** Migration only

**Estimated timeline:** 1 week between phases

### Renaming Columns

**Scenario:** Rename `companionToken` → `apiToken`

#### Phase 1: Add New Column + Dual Write

**Schema:** Both columns exist

```prisma
model User {
  id             String  @id
  companionToken String? // Old column
  apiToken       String? // New column
}
```

**Code changes:**

```typescript
// ✅ Write to BOTH columns
async function setToken(userId: string, token: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      companionToken: token, // Old
      apiToken: token, // New
    },
  });
}

// ✅ Read from new column, fallback to old
async function getToken(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { apiToken: true, companionToken: true },
  });
  return user?.apiToken ?? user?.companionToken;
}
```

**Migration:**

```sql
-- Add new column
ALTER TABLE "User" ADD COLUMN "apiToken" TEXT;

-- Backfill data
UPDATE "User" SET "apiToken" = "companionToken"
WHERE "companionToken" IS NOT NULL;
```

**Deploy:** Code + migration

**Verify:**

```sql
-- Check both columns have same data
SELECT COUNT(*) FROM "User"
WHERE "apiToken" != "companionToken"
OR ("apiToken" IS NULL) != ("companionToken" IS NULL);
-- Should be 0
```

#### Phase 2: Remove Old Column

**Schema:** Only new column

```prisma
model User {
  id       String  @id
  apiToken String? // Only new column
}
```

**Code changes:**

```typescript
// ✅ Use only new column
async function setToken(userId: string, token: string) {
  await db.user.update({
    where: { id: userId },
    data: { apiToken: token },
  });
}

async function getToken(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { apiToken: true },
  });
  return user?.apiToken;
}
```

**Migration:** Prisma generates `DROP COLUMN companionToken`

**Deploy:** Code + migration

**Estimated timeline:** 1-2 weeks between phases

### Changing Column Types

**Scenario:** Change `Quest.wikiBountyValue` from `Int` → `Float`

#### Phase 1: Add New Column

**Schema:** Both columns exist

```prisma
model Quest {
  id                   String @id
  wikiBountyValue      Int?   // Old (integer)
  wikiBountyValueFloat Float? // New (decimal)
}
```

**Code changes:**

```typescript
// ✅ Write to new column only (preferred)
const quest = await db.quest.update({
  where: { id: questId },
  data: { wikiBountyValueFloat: 15000.5 },
});

// ✅ Read from new, fallback to old
function getBountyValue(quest: Quest): number {
  return quest.wikiBountyValueFloat ?? quest.wikiBountyValue ?? 0;
}
```

**Migration:**

```sql
-- Add new column
ALTER TABLE "Quest" ADD COLUMN "wikiBountyValueFloat" DOUBLE PRECISION;

-- Backfill: cast integer to float
UPDATE "Quest" SET "wikiBountyValueFloat" = "wikiBountyValue"::DOUBLE PRECISION
WHERE "wikiBountyValue" IS NOT NULL;
```

**Deploy:** Code + migration

#### Phase 2: Remove Old Column

**Schema:** Only new column

```prisma
model Quest {
  id              String @id
  wikiBountyValue Float? // Renamed from wikiBountyValueFloat
}
```

**Code changes:**

```typescript
// ✅ Use only new column (renamed for cleaner API)
const quest = await db.quest.update({
  where: { id: questId },
  data: { wikiBountyValue: 15000.5 },
});
```

**Migration:**

```sql
-- Drop old column
ALTER TABLE "Quest" DROP COLUMN "wikiBountyValue";

-- Rename new column to take old name (optional)
ALTER TABLE "Quest" RENAME COLUMN "wikiBountyValueFloat" TO "wikiBountyValue";
```

**Deploy:** Code + migration

**Estimated timeline:** 1 week between phases

### Adding NOT NULL Constraints

**Scenario:** Make `Quest.gameId` required (was optional)

#### Phase 1: Make Column Nullable with Default

**Schema:** Nullable, with default

```prisma
model Quest {
  id     String @id
  gameId String @default("eft") // ✅ Has default
}
```

**Code changes:**

```typescript
// ✅ Always provide value in new code
const quest = await db.quest.create({
  data: {
    id: "new-quest",
    gameId: "eft", // Always set
  },
});
```

**Migration:**

```sql
-- Add column with default
ALTER TABLE "Quest" ADD COLUMN "gameId" TEXT DEFAULT 'eft';

-- Backfill existing rows
UPDATE "Quest" SET "gameId" = 'eft' WHERE "gameId" IS NULL;
```

**Deploy:** Code + migration

**Verify:**

```sql
-- Check no NULLs exist
SELECT COUNT(*) FROM "Quest" WHERE "gameId" IS NULL;
-- Should be 0
```

#### Phase 2: Add NOT NULL Constraint

**Schema:** Not nullable

```prisma
model Quest {
  id     String @id
  gameId String // ✅ Now required
}
```

**Migration:**

```sql
-- Add NOT NULL constraint (safe now - no NULLs exist)
ALTER TABLE "Quest" ALTER COLUMN "gameId" SET NOT NULL;
```

**Deploy:** Migration only

**Estimated timeline:** 1 week between phases (or same day if verified)

## Migration Testing

### Pre-Deployment Testing Checklist

Before deploying any migration to production:

- [ ] **Test on staging database branch**

  ```bash
  # Use Neon development branch
  DATABASE_URL="<dev-branch-url>" npx prisma migrate deploy
  ```

- [ ] **Verify schema changes**

  ```bash
  # Pull schema to verify
  npx prisma db pull

  # Check generated schema matches expectations
  git diff prisma/schema.prisma
  ```

- [ ] **Run full test suite**

  ```bash
  npm test
  ```

- [ ] **Check for N+1 queries or performance issues**

  ```bash
  # Enable Prisma query logging
  DATABASE_URL="<dev-branch-url>?connection_limit=1" npm run dev
  # Exercise the changed code paths
  # Check logs for excessive queries
  ```

- [ ] **Verify data integrity**

  ```sql
  -- Run verification queries specific to your migration
  SELECT COUNT(*) FROM "User";
  SELECT COUNT(*) FROM "Quest" WHERE "gameId" IS NULL;
  ```

- [ ] **Test rollback procedure**

  ```bash
  # If migration fails, can you roll back?
  # Test on staging first
  ```

- [ ] **Load test critical endpoints** (for large migrations)
  ```bash
  # Use k6, artillery, or similar
  ```

### Verification Queries

Common queries to verify migration success:

#### After Adding Column

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User' AND column_name = 'newColumn';

-- Check default value applied
SELECT COUNT(*) FROM "User" WHERE "newColumn" IS NULL;
```

#### After Dropping Column

```sql
-- Verify column doesn't exist (should error)
SELECT "oldColumn" FROM "User" LIMIT 1;
-- ERROR:  column "oldColumn" does not exist
```

#### After Data Backfill

```sql
-- Check old and new columns match
SELECT COUNT(*) FROM "User"
WHERE "oldColumn" != "newColumn"
OR ("oldColumn" IS NULL) != ("newColumn" IS NULL);
-- Should be 0
```

#### After Adding Index

```sql
-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'User' AND indexname = 'idx_user_email';

-- Check index is being used
EXPLAIN SELECT * FROM "User" WHERE email = 'test@example.com';
-- Should show "Index Scan using idx_user_email"
```

## Rollback Procedures

### When to Rollback

Roll back a migration if:

- Application errors spike after deployment
- Data integrity issues discovered
- Performance degrades significantly
- Migration takes longer than expected

### How to Rollback

#### Option 1: Rollback via Code Deployment (Preferred)

**Best for:** Phase 1 migrations (added new schema)

1. **Revert code** to previous version

   ```bash
   # In Coolify: Deployments → Previous successful → Redeploy
   ```

2. **Leave schema as-is** (new columns harmless if unused)

3. **Monitor** for stability

4. **Fix issue**, then retry migration

**Why preferred:** Fast, no data loss, database unchanged.

#### Option 2: Rollback via Database Restore

**Best for:** Phase 2 migrations (dropped old schema) that cause issues

1. **Take note** of current state

   ```sql
   -- Document what's broken
   SELECT COUNT(*) FROM "User";
   ```

2. **Restore** from backup (see [DATABASE_BACKUPS.md](./DATABASE_BACKUPS.md))

   ```bash
   # Use pre-deployment backup
   # Update DATABASE_URL in Coolify
   # Redeploy application
   ```

3. **Verify** data integrity

   ```sql
   -- Check data is correct
   SELECT COUNT(*) FROM "User";
   ```

4. **Investigate** root cause before retry

**Why last resort:** Takes longer (RTO ~30 minutes), may lose recent data (RPO up to 1 hour).

#### Option 3: Manual Rollback Migration

**Best for:** Simple migrations without data loss risk

1. **Write inverse migration**

   ```sql
   -- If migration added column:
   ALTER TABLE "User" DROP COLUMN "newColumn";

   -- If migration dropped column:
   ALTER TABLE "User" ADD COLUMN "oldColumn" TEXT;
   ```

2. **Test on staging first**

3. **Apply to production** via Prisma or direct SQL

4. **Verify** application works

**Why risky:** Easy to make mistakes, hard to undo if wrong.

### Rollback Decision Tree

```
Issue detected after migration?
│
├─ Is it Phase 1 (added schema)?
│  └─ YES: Rollback code only (Option 1) ✅
│
├─ Is it Phase 2 (removed schema)?
│  ├─ Can we add schema back easily?
│  │  └─ YES: Manual rollback migration (Option 3)
│  └─ NO: Restore from backup (Option 2)
│
└─ Data corruption detected?
   └─ Restore from backup immediately (Option 2) ⚠️
```

## Troubleshooting

### Issue: Migration Fails to Apply

**Symptoms:**

```
Error: P3009: migrate found failed migrations
```

**Resolution:**

1. **Check migration status**

   ```bash
   npx prisma migrate status
   ```

2. **If migration partially applied:**

   ```bash
   # Mark as rolled back
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Fix the migration** file

4. **Retry:**
   ```bash
   npx prisma migrate deploy
   ```

### Issue: Constraint Violation During Migration

**Symptoms:**

```
Error: Foreign key constraint violation
Error: NOT NULL constraint violation
```

**Resolution:**

1. **Identify** the constraint issue

   ```sql
   -- For FK violation
   SELECT * FROM "QuestProgress"
   WHERE "userId" NOT IN (SELECT id FROM "User");

   -- For NOT NULL violation
   SELECT COUNT(*) FROM "User" WHERE "email" IS NULL;
   ```

2. **Fix data** before retrying migration

   ```sql
   -- Delete orphaned records
   DELETE FROM "QuestProgress"
   WHERE "userId" NOT IN (SELECT id FROM "User");

   -- Backfill NULL values
   UPDATE "User" SET "email" = 'unknown@example.com'
   WHERE "email" IS NULL;
   ```

3. **Retry migration**

### Issue: Migration Takes Too Long

**Symptoms:**

- Migration runs for >5 minutes
- Database locks other queries
- Application times out

**Resolution:**

1. **For large tables**, run migration during low-traffic window

2. **Add indexes CONCURRENTLY** (doesn't lock table)

   ```sql
   CREATE INDEX CONCURRENTLY idx_user_email ON "User"("email");
   ```

3. **For large data backfills**, batch the updates

   ```sql
   -- Instead of:
   UPDATE "Quest" SET "gameId" = 'eft';

   -- Do:
   UPDATE "Quest" SET "gameId" = 'eft'
   WHERE id IN (
     SELECT id FROM "Quest" WHERE "gameId" IS NULL LIMIT 1000
   );
   -- Repeat until no rows affected
   ```

4. **Consider maintenance window** for large migrations

### Issue: Schema Drift Detected

**Symptoms:**

```
Error: Your database schema is not in sync with your Prisma schema
```

**Resolution:**

1. **Check what's different**

   ```bash
   npx prisma db pull
   git diff prisma/schema.prisma
   ```

2. **If manual changes were made to database:**
   - Update Prisma schema to match
   - Create migration to formalize changes

   ```bash
   npx prisma migrate dev --name fix-schema-drift
   ```

3. **If Prisma schema should be source of truth:**
   ```bash
   npx prisma db push --accept-data-loss
   ```
   ⚠️ **Warning:** May lose data, use carefully

## Best Practices Summary

### ✅ Do's

- ✅ **Always test migrations on staging first**
- ✅ **Create backup before risky migrations**
- ✅ **Use 2-phase deployments for destructive changes**
- ✅ **Add columns as nullable or with defaults**
- ✅ **Backfill data before adding constraints**
- ✅ **Monitor error rates after deployment**
- ✅ **Wait 1+ weeks between phases for large changes**
- ✅ **Document why each migration is needed**
- ✅ **Review migration SQL before applying**

### ❌ Don'ts

- ❌ **Never drop columns in the same deploy as code changes**
- ❌ **Never rename columns without dual-write period**
- ❌ **Never add NOT NULL without backfilling first**
- ❌ **Never skip testing on staging**
- ❌ **Never apply migrations manually without Prisma**
- ❌ **Never ignore migration warnings**
- ❌ **Never deploy large migrations during peak hours**

## Related Documentation

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Database Backup Procedures](./DATABASE_BACKUPS.md)
- [Incident Response](./INCIDENT_RESPONSE.md)
- [Production Runbooks](./RUNBOOKS.md)

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Zero-Downtime Migrations (Blog)](https://www.braintreepayments.com/blog/safe-operations-for-high-volume-postgresql/)

## Revision History

| Date       | Version | Changes               |
| ---------- | ------- | --------------------- |
| 2025-01-13 | 1.0     | Initial documentation |
