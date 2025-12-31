## Description

<!-- Brief description of what this PR does and why -->

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] Other: \_\_\_

## Related Issues

<!-- Link to the SPECIFIC issue this PR completes (not the epic) -->
<!-- Each "Closes #" line auto-closes that issue when PR merges -->
Closes #

<!-- If this is part of an epic, reference it separately (doesn't auto-close) -->
<!-- Part of #XXX (epic name) -->

## Changes Made

-

## Testing

- [ ] `npm test` passes
- [ ] `npm run lint` passes
- [ ] Tested locally

# <!--

# OPTIONAL SECTIONS - Uncomment if applicable

## Security Checklist (for auth/API/data changes)

- [ ] No hardcoded secrets or API keys
- [ ] Input validation implemented
- [ ] SQL injection prevention (parameterized queries/ORM)
- [ ] Authentication/authorization checks in place

## Deployment Notes (for infra/config changes)

- [ ] Database migrations included
- [ ] Environment variables need updating
- [ ] Requires specific deployment order

## Database Migration Checklist (if schema changes)

- [ ] Migration type:
  - [ ] Safe (adding nullable column, index, table)
  - [ ] Unsafe (dropping, renaming, type change - requires 2-phase)
- [ ] If 2-phase migration:
  - [ ] This is Phase 1 (add new schema + dual write)
  - [ ] This is Phase 2 (remove old schema) - waited 1+ week after Phase 1
- [ ] Tested on Neon staging branch
- [ ] Verified schema with `npx prisma db pull`
- [ ] All tests pass with new schema
- [ ] Pre-deployment backup created (name: `backup-YYYYMMDD-HHMMSS`)
- [ ] Rollback plan documented
- [ ] Verified backward compatibility (old code works with new schema)

See [DATABASE_MIGRATIONS.md](../docs/DATABASE_MIGRATIONS.md) for migration strategy.

## Screenshots (for UI changes)

**Before:**

**After:**

================================================================================
-->
