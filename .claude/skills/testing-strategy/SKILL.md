---
name: testing-strategy
description: >
  Testing strategy and test pyramid for EFT-Tracker.
  Guides when to write unit, integration, E2E, or smoke tests.
  Includes MSW patterns, Playwright best practices, and contract testing.
  Activates when user mentions: test, unit test, integration test, E2E,
  Playwright, MSW, coverage, mock, test pyramid, vitest.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Testing Strategy Skill

## Test Pyramid

```
        /\
       /E2\     E2E (2%) - Critical user journeys only
      /----\
     / INT  \   Integration (49%) - Components with mocked APIs
    /--------\
   /   UNIT   \ Unit (49%) - Pure functions, calculations
  /------------\
```

**Target Distribution:** 49% Unit : 49% Integration : 2% E2E

## Quick Decision Tree

```
Is it a pure function with no dependencies?
  └─ YES → Unit test
  └─ NO → Does it involve React components?
           └─ YES → Integration test (React Testing Library)
           └─ NO → Is it an API route?
                    └─ YES → Integration test (MSW)
                    └─ NO → Is it a critical user journey?
                             └─ YES → E2E test (Playwright)
                             └─ NO → Probably don't need a test
```

## Test Types

### Unit Tests (`__tests__/unit/`)

**Use for:** Pure functions, calculations, utilities, business logic

**Characteristics:**

- Fast (<100ms per test)
- No external dependencies
- No browser, no API calls, no database
- Test edge cases exhaustively

**Examples:**

- Transform parsing (`parseZoomFromTransform`)
- Node positioning calculations
- Utility functions
- Data transformations

**Run:** `npm test -- __tests__/unit/`

### Integration Tests (`__tests__/integration/`)

**Use for:** React components, API routes with mocked dependencies

**Characteristics:**

- Medium speed (<500ms per test)
- Mock external dependencies (APIs, databases)
- Test component behavior, not implementation
- Use MSW for API mocking
- Use React Testing Library for components

**Examples:**

- `QuestTree` component with mocked ReactFlow
- `QuestFilters` with mocked API calls
- API routes with MSW handlers
- Contract verification tests

**Run:** `npm test -- __tests__/integration/`

### E2E Tests (`__tests__/e2e/`)

**Use for:** ONLY critical user journeys

**Critical Rules:**

- Maximum 3-5 E2E tests total
- Each test = complete user journey
- Keep tests under 150 lines
- Use helper functions for common operations
- **ALWAYS dismiss modals properly** - wait for `hidden` state

**Good E2E examples:**

- Login → complete quest → verify progress saved
- Double-click quest → enter focus mode → ESC exits

**Bad E2E examples (use integration instead):**

- Filter by trader
- Verify quest count

**Run:** `npx playwright test`

### Smoke Tests (`__tests__/smoke/`)

**Use for:** Post-deployment validation

**Characteristics:**

- Very fast (<2 min total)
- Run against production URL
- Read-only operations
- Creates GitHub issue on failure

**Run:** `npx playwright test --config=__tests__/smoke/smoke.config.ts`

## MSW Patterns

### Handler Setup

```typescript
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const handlers = [
  http.get("/api/quests", () => {
    return HttpResponse.json({ quests: mockQuests });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Override for Specific Test

```typescript
it("handles error state", async () => {
  server.use(
    http.get("/api/quests", () => {
      return HttpResponse.json({ error: "Failed" }, { status: 500 });
    })
  );
  // Test error handling...
});
```

## Playwright Best Practices

### Modal Dismissal (Critical!)

The biggest source of E2E flakiness is modals not being dismissed:

```typescript
// WRONG - modal may still be animating
await page.click('[data-testid="close-modal"]');
await page.click('[data-testid="next-button"]'); // May fail!

// RIGHT - wait for modal to be fully hidden
await page.click('[data-testid="close-modal"]');
await expect(page.locator('[data-testid="modal"]')).toBeHidden();
await page.click('[data-testid="next-button"]'); // Works!
```

### Waiting for Data

```typescript
// Wait for API data to load
await page.waitForResponse((response) =>
  response.url().includes("/api/quests")
);

// Or wait for element with data
await expect(page.locator('[data-testid="quest-list"]')).toBeVisible();
```

## API Contract Testing

Use TypeScript + Zod for type safety:

1. Define schemas in `src/types/api-contracts.ts`
2. Import in API routes AND MSW handlers
3. TypeScript catches mismatches at compile time
4. Zod validates at runtime

**No need for Pact/Dredd** - TypeScript type-sharing is sufficient.

## Checklists

### Before Writing a Test

- [ ] Identify the right test type (unit/integration/E2E)
- [ ] Check if similar test already exists
- [ ] Understand what behavior to test (not implementation)

### After Writing a Test

- [ ] Test runs in isolation
- [ ] Test is deterministic (no flakiness)
- [ ] Test has meaningful assertions
- [ ] Test name describes the behavior

### New Feature Checklist

- [ ] Unit tests for new utility functions
- [ ] Integration tests for new components
- [ ] Integration tests for new API routes
- [ ] E2E test ONLY if it's a critical user journey

## Commands Reference

```bash
# All tests
npm test

# Unit tests only
npm test -- __tests__/unit/

# Integration tests only
npm test -- __tests__/integration/

# E2E tests
npx playwright test

# E2E with UI (debugging)
npx playwright test --ui

# Specific test file
npm test -- path/to/test.spec.ts

# Watch mode
npm test -- --watch
```

## Anti-Patterns to Avoid

- Testing implementation details (internal state, method calls)
- Snapshot tests for complex components
- E2E tests for simple filtering/sorting
- Mocking everything (over-mocking)
- Tests that depend on test order
- Flaky tests (timing, animation issues)
