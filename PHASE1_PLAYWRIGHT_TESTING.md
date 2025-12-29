# Phase 1 Playwright Testing Guide

Automated E2E tests to verify Phase 1 deployment using Playwright.

## Test File

**Location:** `__tests__/e2e/next-up-phase1.spec.ts`

**Coverage:**
- ✅ UI Enhancements (tooltip, icons)
- ✅ Type Diversity Filter (max 2 per type)
- ✅ New Suggestion Tiers (momentum, synergy, trader)
- ✅ Integration & Functionality
- ✅ Edge Cases & Error Handling

## Running Tests

### Prerequisites

```bash
# Install Playwright (already in project)
npm install -D @playwright/test

# Ensure browsers are installed
npx playwright install
```

### Against Production

Once Phase 1 is deployed to https://learntotarkov.com:

```bash
# Run all Phase 1 tests
npx playwright test __tests__/e2e/next-up-phase1.spec.ts

# Run with UI mode (recommended first run)
npx playwright test __tests__/e2e/next-up-phase1.spec.ts --ui

# Run in headed mode (see browser)
npx playwright test __tests__/e2e/next-up-phase1.spec.ts --headed

# Run specific test
npx playwright test __tests__/e2e/next-up-phase1.spec.ts -g "Tooltip"

# With custom URL (if not using production)
E2E_TEST_URL=http://localhost:3000 npx playwright test __tests__/e2e/next-up-phase1.spec.ts
```

### Generate Report

```bash
# Run tests and generate HTML report
npx playwright test __tests__/e2e/next-up-phase1.spec.ts --reporter=html

# Open report
npx playwright show-report
```

## Test Suites

### 1. UI Enhancements (4 tests)

**Purpose:** Verify visual elements render correctly

- ✅ Next Up panel appears on quests page
- ✅ InfoTooltip button is present
- ✅ Tooltip displays with correct content (all 5 points)
- ✅ New icon types render (momentum, trader)

**Success Criteria:**
- Panel visible
- Tooltip shows on hover
- All 5 bullet points present
- No console errors about icons

### 2. Type Diversity Filter (1 test)

**Purpose:** Verify max 2 quests per type

- ✅ Max 2 of same type in final output

**Success Criteria:**
- Total suggestions ≤ 5
- If 5 suggestions, at least 2 different types
- No more than 2 consecutive same type

### 3. New Suggestion Tiers (3 tests)

**Purpose:** Verify new tier messages appear correctly

- ✅ Tier 5: Chain Momentum - "X/Y in chain - finish it!"
- ✅ Tier 6: Map Synergy - "X quests on [Map] - efficient!"
- ✅ Tier 7: Trader Progress - "X% [Trader] done"

**Success Criteria:**
- Message format matches regex pattern
- Appears when conditions are met
- Test is lenient (depends on user's quest state)

### 4. Integration & Functionality (4 tests)

**Purpose:** Verify real-time updates and basic functionality

- ✅ Suggestions update when quest is completed
- ✅ No duplicate quests in output
- ✅ Existing tiers (1-4) still work
- ✅ Max 5 total suggestions shown

**Success Criteria:**
- Suggestions respond to quest completion
- Each quest appears only once
- All tiers functional
- Never more than 5 suggestions

### 5. Edge Cases (2 tests)

**Purpose:** Verify error handling

- ✅ Handles empty suggestion list
- ✅ No console errors

**Success Criteria:**
- No crashes with empty state
- No relevant console errors

## Interpreting Results

### All Tests Pass ✅
```
  Phase 1: Next Up Intelligence Enhancements
    UI Enhancements
      ✓ Next Up panel renders on quests page
      ✓ InfoTooltip button is present
      ✓ InfoTooltip displays on hover with correct content
      ✓ New icon types render correctly
    Type Diversity Filter
      ✓ Max 2 quests of same type in suggestions
    New Suggestion Tiers
      ✓ Tier 5: Chain Momentum message format is correct
      ✓ Tier 6: Map Synergy message format is correct
      ✓ Tier 7: Trader Progress message format is correct
    Integration & Functionality
      ✓ Suggestions update in real-time
      ✓ No duplicate quests appear
      ✓ Existing tiers still work correctly
      ✓ Next Up panel shows max 5 suggestions
    Edge Cases
      ✓ Handles empty suggestion list gracefully
      ✓ No console errors

  14 passed (2s)
```

### Some Tests Skip (Expected)
Some tests skip if conditions aren't met (e.g., trader momentum only shows if user has 70%+ trader completion). This is normal and expected.

```
  ✓ Tier 5: Chain Momentum (skipped - no momentum quests available)
  ✓ Tier 6: Map Synergy (skipped - no synergy quests available)
```

### Tests Fail ❌
If tests fail, check:

1. **Panel not visible**
   - Is the quests page loading?
   - Are there any available quests?
   - Check browser console for errors

2. **Tooltip not displaying**
   - Is the info button visible?
   - Check hover event working
   - Verify CSS for visibility transitions

3. **Wrong message format**
   - Check regex patterns in test
   - Verify component is rendering correct text
   - Check for typos in message generation

4. **Duplicates found**
   - Check `applyTypeDiversityFilter` logic
   - Verify duplicate prevention in tier loops
   - Check suggestion deduplication

5. **More than 5 suggestions**
   - Check `.slice(0, 5)` is applied
   - Verify type diversity filter runs before slice

## CI Integration

To run these tests in CI after deployment:

```yaml
# .github/workflows/phase1-smoke-tests.yml (example)
name: Phase 1 Smoke Tests

on:
  workflow_dispatch:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 22.12.0
      - run: npm ci
      - run: npx playwright install
      - run: npx playwright test __tests__/e2e/next-up-phase1.spec.ts
        env:
          E2E_TEST_URL: https://learntotarkov.com
```

## Troubleshooting

### Test Timeouts
If tests timeout waiting for elements:
1. Increase timeout: `await page.waitForSelector(..., { timeout: 10000 })`
2. Check if quests page is loading
3. Verify network connectivity

### Flaky Tests
If tests are flaky:
1. Ensure no rapid suggestion updates during test
2. Add longer waits for network requests
3. Use `waitForLoadState('networkidle')` before checks
4. Increase wait times for hover/interactions

### Local vs Production Differences
- **Local (dev server):** May have different data
- **Production:** Uses real user data and styling
- Run both to compare behavior

## Testing Workflow

1. **After PR Merge** (auto-deployment to prod)
   ```bash
   # Wait 5 minutes for deployment
   sleep 300

   # Run smoke tests
   npx playwright test __tests__/e2e/next-up-phase1.spec.ts
   ```

2. **Manual Testing** (during QA)
   ```bash
   # Interactive mode for debugging
   npx playwright test __tests__/e2e/next-up-phase1.spec.ts --ui
   ```

3. **Continuous Monitoring** (scheduled)
   ```bash
   # Run every 4 hours via GitHub Actions
   # (see CI Integration section)
   ```

## Debugging Failed Tests

### Generate Trace
```bash
npx playwright test __tests__/e2e/next-up-phase1.spec.ts --trace on
```

### View Trace
```bash
npx playwright show-trace trace.zip
```

### Screenshot on Failure
Tests automatically capture screenshots on failure in `test-results/`

### Video Recording
```bash
npx playwright test __tests__/e2e/next-up-phase1.spec.ts --headed --video retain-on-failure
```

## Success Criteria for Phase 1

✅ All UI enhancement tests pass
✅ Type diversity filter test passes
✅ At least 2 of 3 tier tests pass (depends on user quest state)
✅ Integration tests pass
✅ No console errors
✅ No crashes on edge cases

**Result:** Phase 1 deployment successful, proceed to Phase 2 planning

---

## Quick Commands

```bash
# Run all tests
npm test -- __tests__/e2e/next-up-phase1.spec.ts --run

# Run with UI (interactive)
npx playwright test __tests__/e2e/next-up-phase1.spec.ts --ui

# Generate report
npx playwright test __tests__/e2e/next-up-phase1.spec.ts --reporter=html && npx playwright show-report

# Run against local dev
E2E_TEST_URL=http://localhost:3000 npx playwright test __tests__/e2e/next-up-phase1.spec.ts --headed

# Run specific test
npx playwright test __tests__/e2e/next-up-phase1.spec.ts -g "InfoTooltip displays"

# Debug failed test
npx playwright test __tests__/e2e/next-up-phase1.spec.ts --debug
```
