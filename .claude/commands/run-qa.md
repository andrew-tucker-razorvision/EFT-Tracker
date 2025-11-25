# Run QA Command

Run the complete QA test suite for the EFT Quest Tracker project.

## Instructions

Execute the full QA automation pipeline which includes:

1. **Unit Tests** - Hooks, utilities, and pure functions
2. **Component Tests** - React component rendering and interactions
3. **API Integration Tests** - Backend endpoint testing
4. **E2E Tests** - End-to-end browser automation (optional)

## Quick Commands

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm test -- --testPathPattern="__tests__/unit"
```

### Run Component Tests Only
```bash
npm test -- --testPathPattern="__tests__/components"
```

### Run API Integration Tests Only
```bash
npm test -- --testPathPattern="__tests__/integration"
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

## Test Locations

| Test Type | Directory | Description |
|-----------|-----------|-------------|
| Unit | `__tests__/unit/` | Hooks, utilities, helpers |
| Components | `__tests__/components/` | React component tests |
| Integration | `__tests__/integration/api/` | API endpoint tests |
| E2E | `__tests__/e2e/` | Browser automation tests |

## Visual Baseline Locations

Visual regression baselines are stored in:
- **Desktop:** `.claude/qa/baselines/desktop/`
- **Tablet:** `.claude/qa/baselines/tablet/`
- **Mobile:** `.claude/qa/baselines/mobile/`

## Test Configuration

- **Framework:** Vitest
- **React Testing:** @testing-library/react
- **Mocking:** vitest mocks for Prisma, bcryptjs, NextAuth
- **Coverage:** V8 provider

## Execution Steps

When this command is invoked:

1. First, run `npm test` to execute the full test suite
2. Review the output for any failures
3. If tests fail, analyze the error messages
4. Report results with:
   - Total tests run
   - Passed/Failed count
   - Coverage summary (if enabled)
   - Any specific failures with file locations

## Coverage Goals

- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

## Troubleshooting Common Issues

### Database Connection Errors
- Ensure Prisma mock is properly configured
- Check `__tests__/setup.ts` for mock setup

### Authentication Errors
- Verify NextAuth session mocks are in place
- Check `__mocks__/next-auth/react.ts`

### Component Rendering Issues
- Ensure proper provider wrappers (QueryClient, SessionProvider)
- Check `__tests__/utils/test-utils.tsx` for render helpers

## Example Output

```
 PASS  __tests__/unit/hooks/useQuestProgress.test.ts (5 tests)
 PASS  __tests__/components/QuestNode.test.tsx (8 tests)
 PASS  __tests__/integration/api/auth.test.ts (10 tests)
 PASS  __tests__/integration/api/traders.test.ts (7 tests)

Test Suites: 4 passed, 4 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        3.456s
```
