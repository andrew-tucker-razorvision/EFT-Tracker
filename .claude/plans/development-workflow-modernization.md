# Development Workflow Modernization Plan

## Executive Summary

This plan addresses the gaps between documented and actual development practices, provides a clear path forward for the `docs/tauri-phase5-guide` branch, and establishes a scalable workflow for the project's evolution.

**Key Findings:**

- Develop branch workflow was intentionally disabled on Dec 13, 2025 (commit e338ec1)
- Current practice: Direct to master workflow for faster iteration
- Documentation still describes old develop branch workflow
- The `docs/tauri-phase5-guide` branch contains outdated companion API implementations
- Master already has enhanced companion endpoints from PR #257

---

## Part 1: Immediate Actions (This Session)

### 1.1 Clean Up Current Branch Situation

**Problem:** `docs/tauri-phase5-guide` branch has:

- 19 commits with companion token implementations that are outdated
- Documentation updates that ARE valuable
- Diverged before PR #257 merged enhanced implementations

**What NOT to salvage from docs/tauri-phase5-guide branch:**

- ❌ `src/app/api/companion/link/route.ts` - Master's version is better (has rate limiting)
- ❌ `src/app/api/companion/status/route.ts` - Master has withRateLimit middleware
- ❌ `src/app/api/companion/sync/route.ts` - Master has enhanced security logging
- ❌ `src/app/api/companion/unlink/route.ts` - Master's version is complete
- ❌ `src/lib/auth/validate-companion-token.ts` - Redundant (master has integrated version)
- ❌ `src/app/settings/SettingsClient.tsx` changes - May conflict with master

**What TO salvage:**

- ✅ `docs/API.md` - New file, comprehensive documentation
- ✅ `docs/TAURI_PHASE5_GUIDE.md` updates - Enhanced setup instructions
- ✅ `README.md` companion app section - User-facing documentation
- ⚠️ `playwright.config.ts` port fixes - Review if master already has them
- ⚠️ E2E test timeout fixes - Review if master already has them

**Decision Point:** What to salvage?

**Option A: Fresh Start (Recommended - 45 minutes)**

```bash
# 1. Create new branch from master
git checkout origin/master
git pull origin master
git checkout -b docs/update-tauri-phase5-guide

# 2. Copy ONLY documentation files from docs branch
git checkout docs/tauri-phase5-guide -- docs/TAURI_PHASE5_GUIDE.md
git checkout docs/tauri-phase5-guide -- docs/API.md
git checkout docs/tauri-phase5-guide -- README.md

# 3. Review and update to reference master's actual endpoints
# Edit files to:
# - Remove implementation details (already in master)
# - Add references to PR #257
# - Update token setup instructions
# - Verify API documentation matches master's implementation

# 4. Check if port/timeout fixes are needed
git diff docs/tauri-phase5-guide -- playwright.config.ts
git diff docs/tauri-phase5-guide -- __tests__/e2e/companion-token-flow.spec.ts
# Apply manually if needed

# 5. Commit and push
git add docs/ README.md
git commit -m "docs: Update Phase 5 guide with companion token authentication

- Add comprehensive API documentation for companion endpoints
- Update Tauri Phase 5 guide with token setup instructions
- Add companion app section to README
- Reference PR #257 for implementation details

Refs #[issue_number_if_exists]"
git push -u origin docs/update-tauri-phase5-guide

# 6. Create PR targeting master
gh pr create --base master --title "docs: Update Phase 5 guide with companion token authentication" --body "..."
```

**Option B: Interactive Rebase (Complex - 1-2 hours)**

```bash
# Rebase and manually drop outdated commits
git checkout docs/tauri-phase5-guide
git rebase -i origin/master
# In editor: drop all implementation commits, keep only docs
# Risk: Complex conflicts, time-consuming
```

**Recommendation:** Option A - cleaner, faster, less error-prone

---

### 1.2 Update Documentation to Match Reality

**Files to Update:**

#### A. CLAUDE.md (Primary workflow document)

**Current state:** Lines 219-275 describe develop branch workflow
**Target state:** Reflect actual "direct to master" workflow

**Changes:**

````markdown
### Branch Workflow

**Current Strategy: Direct to Master (Active Development Phase)**

This project uses a simplified workflow during active development for faster iteration:

```text
feature/* → master → production (Coolify auto-deploy)
```
````

**Why this approach:**

- Faster iteration during active development
- Small team with tight coordination
- Every merge is deployment-ready
- Manual testing responsibility on developers

**Development Flow:**

1. **Create feature branch from master**

   ```bash
   git checkout master && git pull origin master
   git checkout -b feature/your-feature-name
   ```

2. **Develop and test locally**
   - Run tests: `npm test`
   - Run E2E locally: `NEXTAUTH_URL=http://localhost:3001 npx playwright test`
   - Ensure all checks pass

3. **Push and create PR targeting master**

   ```bash
   git push -u origin feature/your-feature-name
   gh pr create --base master
   ```

4. **CI runs (E2E tests currently disabled):**
   - ✅ Lint: ESLint + Prettier
   - ✅ Test: Vitest unit tests
   - ✅ Typecheck: TypeScript
   - ✅ Build: Next.js production build
   - ⏸️ E2E: Playwright (disabled during active dev)

5. **Manual review and testing**
   - Code review by maintainer
   - Manual testing of critical paths
   - Verify no breaking changes

6. **Merge triggers automatic deployment**
   - GitHub webhook to Coolify
   - Docker build (~2 min)
   - Rolling update with healthcheck
   - Production live (~3 min total)

**E2E Test Status:**

- Currently disabled with `if: false` in `.github/workflows/ci.yml`
- Can run locally: `npx playwright test`
- Will be re-enabled when:
  - Tests are stable and fast (<5 min)
  - Team size grows or production incidents increase
  - Feature velocity slows (fewer breaking changes)

**Hotfixes:**

- Same workflow (all changes go through PRs)
- Use `hotfix/` prefix for critical fixes
- Can expedite review but still require CI checks

### Future: Develop Branch Workflow (Post-1.0)

When the project matures, we may re-enable the develop branch workflow:

```text
feature/* → develop → master → production
```

**Triggers for transition:**

- [ ] E2E tests stable and required
- [ ] Team size > 3 developers
- [ ] Multiple concurrent feature branches
- [ ] Production SLA requirements
- [ ] User base reaches critical mass

**Previous workflow (disabled Dec 13, 2025):**

- Develop branch for iteration with `DATABASE_URL_DEVELOP`
- Master for production-ready code with `DATABASE_URL_STAGING`
- E2E tests on both branches
- See commit e338ec1 for context on why this was disabled

````

#### B. CI_CD_SETUP.md

**Add section:**
```markdown
## E2E Test Status (Active Development Phase)

### Current State
E2E tests are **temporarily disabled** in CI (`.github/workflows/ci.yml` line 170):
```yaml
e2e-tests:
  if: false  # Disabled during active development
````

### Rationale

- Faster CI feedback during rapid iteration
- Tests are not yet stable (flaky timeouts)
- Local testing preferred during active dev
- Small team can coordinate deployment safety

### Running E2E Tests Locally

```bash
# Start dev server
npm run dev
# Note the port (usually 3001)

# Run tests in another terminal
NEXTAUTH_URL=http://localhost:3001 npx playwright test

# Run with UI for debugging
NEXTAUTH_URL=http://localhost:3001 npx playwright test --ui
```

### Re-enablement Plan

E2E tests will be re-enabled when:

1. Login timeout issues resolved (increase from 10s to 15s) ✅
2. Quest tree viewport loading stabilized
3. All tests pass consistently (3 consecutive runs)
4. Test suite completes in <5 minutes
5. Team agrees it's the right time

**To re-enable:**

```yaml
e2e-tests:
  if: true # or remove the if condition entirely
```

````

#### C. Add new file: docs/WORKFLOW_EVOLUTION.md

```markdown
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
````

---

## Part 2: Workflow Decision (Choose One)

### Option A: Formalize Direct-to-Master (Recommended for Now)

**Pros:**

- Matches current practice (no behavior change)
- Faster iteration for small team
- Less CI complexity and cost
- Documentation will finally be accurate

**Cons:**

- Every merge goes to production (higher risk)
- No safety net for catching issues
- Harder to scale as team grows

**Implementation:**

1. Update CLAUDE.md per above (1.2.A)
2. Update CI_CD_SETUP.md per above (1.2.B)
3. Create WORKFLOW_EVOLUTION.md per above (1.2.C)
4. Update CONTRIBUTING.md to reference CLAUDE.md
5. Commit with message: `docs: Formalize direct-to-master workflow for active development phase`

**Timeline:** 1 hour

---

### Option B: Re-enable Develop Branch Workflow

**Pros:**

- Safer for production stability
- Iterate on develop, deploy master when ready
- Better matches documented best practices
- Scales better as team grows

**Cons:**

- Need to fix E2E tests first (2-3 hours work)
- Slower feedback loop (longer CI runs)
- More complexity for small team
- Requires discipline to maintain

**Implementation:**

1. Fix E2E test issues (timeout fixes already done on docs branch)
2. Re-enable E2E tests in ci.yml
3. Update branch protection rules
4. Restore develop branch triggers
5. Test with sample PR through full flow
6. Update documentation to match

**Timeline:** 3-4 hours

---

## Part 3: Long-term Workflow Strategy

### Maturity Model

#### Stage 1: Startup (Current)

**Characteristics:**

- 1-2 developers
- Rapid feature development
- Every merge to production acceptable
- Manual coordination feasible

**Workflow:** Direct to master
**Testing:** Unit tests + manual testing
**Deployment:** Auto-deploy on merge

---

#### Stage 2: Growth (Target: Q1 2026 or sooner)

**Characteristics:**

- 3-5 developers
- Multiple features in parallel
- Production stability matters
- Need coordination mechanism

**Workflow:** Develop branch
**Testing:** Unit + E2E (required)
**Deployment:** Auto-deploy master, manual deploy develop

**Triggers to transition:**

- Team size > 2
- > 2 concurrent feature branches
- Production incidents > 1/week
- User complaints about stability

---

#### Stage 3: Scale (Target: Post-1.0)

**Characteristics:**

- 5+ developers
- Paying customers with SLAs
- Compliance requirements
- Zero-downtime deployments

**Workflow:** Gitflow (develop → staging → master)
**Testing:** Unit + Integration + E2E + Performance
**Deployment:** CD pipeline with manual gates

**Triggers to transition:**

- Enterprise customers
- SLA requirements
- SOC2/compliance needs
- Deployment frequency > 5/day

---

## Part 4: Branch Cleanup Plan

### Current Branch Status

```bash
# Active branches (50+)
git branch -r | wc -l
# 50+

# Most are feature branches that were merged but not deleted
# Some are stale (no activity in >30 days)
```

### Cleanup Strategy

**Safe to delete:**

- Branches whose PRs are merged
- Branches >30 days old with no activity
- Test/experiment branches

**Keep:**

- master (primary)
- docs/tauri-phase5-guide (needs cleanup per 1.1)
- Any active feature branches

**Cleanup script:**

```bash
# List merged branches (safe to delete)
git branch -r --merged origin/master | grep -v master

# Delete local merged branches
git branch -d $(git branch --merged master | grep -v master)

# Delete remote merged branches (careful!)
git push origin --delete $(git branch -r --merged origin/master | grep -v master | sed 's/origin\///')
```

**Recommendation:**

- Clean up in separate PR
- Review list before deleting
- Keep for now, revisit when workflow is stable

---

## Part 5: Testing Strategy

### Current Test Coverage

**Unit Tests (Vitest):**

- ✅ Enabled in CI
- ✅ Required for merge
- Coverage: ~60-70%

**E2E Tests (Playwright):**

- ⏸️ Disabled in CI
- ✅ Can run locally
- 37 tests total, ~5 passing consistently

**Integration Tests:**

- ⚠️ Minimal coverage
- No dedicated integration test suite
- API endpoints tested via E2E

### Test Improvement Roadmap

#### Phase 1: Stabilize E2E (Before Re-enabling)

1. Fix login timeout issues (done in docs branch)
2. Fix quest tree viewport loading
3. Add retry logic for flaky tests
4. Increase timeouts for slow operations
5. Run 10 consecutive times without failures

**Estimated effort:** 4-6 hours

#### Phase 2: Expand Coverage

1. Add integration tests for API endpoints
2. Increase unit test coverage to >80%
3. Add visual regression tests (optional)
4. Performance tests for critical paths

**Estimated effort:** 8-12 hours

#### Phase 3: CI Optimization

1. Parallelize test execution
2. Cache dependencies aggressively
3. Optimize build times
4. Target: <5 min total CI time

**Estimated effort:** 4-6 hours

---

## Part 6: Documentation Sprint

### Documentation Audit Checklist

**High Priority (Do This Session):**

- [ ] CLAUDE.md: Update workflow section (1.2.A)
- [ ] CI_CD_SETUP.md: Add E2E status section (1.2.B)
- [ ] Create WORKFLOW_EVOLUTION.md (1.2.C)
- [ ] Clean up docs/tauri-phase5-guide branch (1.1)
- [ ] Update .github/workflows/ci.yml comments
- [ ] Clean up DATABASE_URL_DEVELOP references in docs/

**Medium Priority (Next Session):**

- [ ] CONTRIBUTING.md: Reference CLAUDE.md for workflow
- [ ] README.md: Add "Development Workflow" quick link
- [ ] docs/TAURI_PHASE5_GUIDE.md: Update to reference master endpoints
- [ ] docs/API.md: Verify API documentation is accurate

**Low Priority (Future):**

- [ ] Add architecture decision records (ADRs)
- [ ] Create runbook for E2E re-enablement
- [ ] Document rollback procedures
- [ ] Add troubleshooting guides

---

## Part 7: Review and Gap Analysis

### Remaining Gaps After This Plan

**Technical:**

- E2E tests still flaky (quest tree viewport issue)
- No integration test suite
- Manual testing process not documented

**Process:**

- No formal release process documented
- Hotfix process not tested
- Rollback procedures unclear

**Team:**

- Onboarding docs may be outdated
- No clear escalation path for production issues
- Code review standards not formalized

**Infrastructure:**

- Database backup/restore not documented in runbooks
- Monitoring and alerting gaps
- Performance baseline not established

### Addressing Gaps

**This Session:**

- Fix documentation gaps (Parts 1, 6)
- Choose and implement workflow (Part 2)
- Clean up branch situation (Part 1.1)

**Next Session:**

- Address technical gaps (Part 5)
- Document manual testing process
- Create E2E re-enablement runbook

**Future Sessions:**

- Formalize release process
- Create comprehensive runbooks
- Establish monitoring baselines
- Document team processes

---

## Part 8: Success Criteria

### Short-term (This Session)

- [ ] Documentation accurately reflects current workflow
- [ ] docs/tauri-phase5-guide situation resolved
- [ ] Workflow decision made and implemented
- [ ] No confusion about develop vs master

### Medium-term (Next 2 Weeks)

- [ ] E2E tests stabilized and re-enabled (if Option B chosen)
- [ ] All documentation updated and consistent
- [ ] Branch cleanup completed
- [ ] Testing strategy documented

### Long-term (Q1 2026)

- [ ] Clear triggers for workflow evolution
- [ ] Automated E2E tests in CI
- [ ] > 80% test coverage
- [ ] Formal release process
- [ ] Production runbooks complete

---

## Part 9: Decision Matrix

### Choose Your Path

| Criteria                  | Option A: Direct to Master | Option B: Develop Branch |
| ------------------------- | -------------------------- | ------------------------ |
| **Current state match**   | ✅ Yes                     | ❌ No                    |
| **Documentation effort**  | ⏱️ 1 hour                  | ⏱️ 4 hours               |
| **Technical work**        | ✅ None                    | ⚠️ Fix E2E tests         |
| **Team size suitability** | ✅ 1-2 devs                | ✅ 3+ devs               |
| **Risk level**            | ⚠️ Higher                  | ✅ Lower                 |
| **Iteration speed**       | ✅ Faster                  | ⏱️ Slower                |
| **Scalability**           | ⚠️ Limited                 | ✅ Better                |
| **Production safety**     | ⏱️ Manual                  | ✅ Automated             |

**Recommendation:**

- **Now (Active Dev):** Option A - Direct to Master
- **Later (Growth):** Transition to Option B when triggers met
- **Document:** Clear criteria for transition (Part 3)

---

## Part 10: Implementation Checklist

### Immediate Actions (This Session)

**1. Verify Master's Companion Implementation (15 min)**

- [ ] Check out master branch
- [ ] Review PR #257 to understand what's already implemented
- [ ] Test companion token generation in web UI (if deployed)
- [ ] Verify all 4 API endpoints exist and work
- [ ] Check if Tauri app already works with master's endpoints
- [ ] Document any missing pieces that still need implementation

**2. Branch Situation Resolution (45 min)**

- [ ] Create fresh branch from master: `docs/update-tauri-phase5-guide`
- [ ] Cherry-pick ONLY documentation files from old branch
  - `docs/API.md`
  - `docs/TAURI_PHASE5_GUIDE.md`
  - `README.md` (companion section only)
- [ ] Review if playwright.config.ts or E2E test fixes are needed
- [ ] Update docs to reference master's endpoints (PR #257)
- [ ] Remove any implementation details (already in master)
- [ ] Create clean PR with documentation only

**3. Documentation Updates (1 hour)**

- [ ] Update CLAUDE.md workflow section (Part 1.2.A)
- [ ] Update CI_CD_SETUP.md E2E section (Part 1.2.B)
- [ ] Create WORKFLOW_EVOLUTION.md (Part 1.2.C)
- [ ] Update .github/workflows/ci.yml line 162 comment
  - Change from "Runs on develop and master branches"
  - To "Currently disabled during active development (if: false)"
- [ ] Commit: "docs: Formalize direct-to-master workflow"

**4. Clean Up Database Branch References (30 min)**

- [ ] Audit all docs/ files for DATABASE_URL_DEVELOP references
- [ ] Update docs/DATABASE_BRANCHING.md to remove develop branch section
- [ ] Update docs/LAUNCH_CHECKLIST.md to remove develop-specific steps
- [ ] Update docs/DATABASE_MIGRATIONS.md if needed
- [ ] Update docs/RUNBOOKS.md if needed
- [ ] Search codebase for any hardcoded develop branch logic

**5. Verify and Test (15 min)**

- [ ] Run linter on updated docs
- [ ] Verify all internal links work
- [ ] Check for formatting issues
- [ ] Test build still passes

**6. Create PRs (15 min)**

- [ ] PR #1: Documentation updates (workflow formalization)
- [ ] PR #2: Phase 5 guide updates (companion token docs)
- [ ] Link PRs in description
- [ ] Request review

**Total time estimate: ~2.5 hours**

---

## Conclusion

This plan provides:

1. ✅ Clear path forward for current branch situation
2. ✅ Documentation that matches reality
3. ✅ Flexible workflow that can evolve
4. ✅ Decision framework for future transitions
5. ✅ Specific, actionable implementation steps
6. ✅ Gap analysis and mitigation strategies

**Next Steps:**

1. User reviews and approves plan
2. User chooses Option A or Option B
3. Execute implementation checklist (Part 10)
4. Create PRs and merge
5. Schedule follow-up for Part 5 (testing improvements)

---

## Open Questions for User

1. **Workflow Choice:** Option A (direct to master) or Option B (develop branch)?
2. **Branch Cleanup:** Do now or defer?
3. **E2E Priority:** Fix and re-enable soon, or wait until team grows?
4. **Documentation Depth:** Minimal updates or comprehensive rewrite?
5. **Timeline:** Complete this session or spread across multiple sessions?
