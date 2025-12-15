# Workflow Evolution

This document tracks the evolution of our development workflow and the rationale behind changes.

## Timeline

### Phase 1: Direct to Master (Pre-Nov 2025)

- Simple workflow for early development
- All features merged directly to master
- No E2E tests in CI

### Phase 2: Develop Branch (Nov-Dec 2025)

- **Added:** commit e640156 "feat: Implement develop branch workflow with E2E tests"
- Introduced develop → master workflow
- E2E tests on both branches
- Separate databases for each branch

### Phase 3: Back to Direct Master (Dec 13, 2025 - Current)

- **Removed:** commit e338ec1 "chore: Disable develop branch workflow and E2E tests (#237)"
- **Rationale:**
  - E2E tests were flaky (timeout issues)
  - Slowed down iteration during active feature development
  - Small team could coordinate deployment safety manually
  - Develop branch added complexity without sufficient benefit at this stage

### Phase 4: Mature Workflow (Future)

- Will re-introduce develop branch when:
  - Team size grows (>3 developers)
  - Production stability becomes critical
  - E2E tests are reliable and fast
  - Multiple concurrent features in flight

## Current Workflow Details

See [CLAUDE.md](../CLAUDE.md#branch-workflow) for current workflow documentation.

## Decision Records

### Why Disable Develop Branch?

**Date:** Dec 13, 2025
**Decision:** Temporarily disable develop branch and E2E tests
**Context:**

- Active development phase with rapid feature additions
- E2E test failures blocking PRs (login timeout issues)
- Small team (1-2 developers) with direct communication
- Every merge goes to production via Coolify webhook

**Consequences:**

- ✅ Faster iteration (CI runs 2-3 min vs 8-10 min)
- ✅ Fewer blocked PRs due to test flakiness
- ✅ Simpler mental model (one main branch)
- ⚠️ Higher risk of production issues
- ⚠️ Manual testing responsibility increases
- ⚠️ Need to re-enable before team scales

### When to Re-enable?

**Criteria:**

1. E2E tests pass consistently (>95% success rate)
2. Test suite runs in <5 minutes
3. Team size > 2 developers OR
4. Production incidents > 1 per week OR
5. User base > 1000 active users

**Review Date:** January 2026 or when criteria met
