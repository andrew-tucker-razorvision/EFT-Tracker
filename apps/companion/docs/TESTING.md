# Companion App Testing Guide

## Overview

The companion app uses a three-tier testing strategy:

| Tier            | Type                      | Speed         | Coverage                  | When to Use                      |
| --------------- | ------------------------- | ------------- | ------------------------- | -------------------------------- |
| **Unit**        | Pure functions, utilities | <100ms        | Functions, business logic | Always, default choice           |
| **Integration** | Components, API routes    | <500ms        | Component behavior        | Component testing                |
| **E2E**         | Full user workflows       | <10s per test | Critical paths only       | Smoke tests, manual verification |

**Current distribution:** 49% Unit : 49% Integration : 2% E2E

## Unit Tests

### Running Unit Tests

```bash
# Run all unit tests
pnpm --filter @eft-tracker/companion test

# Watch mode (re-run on file changes)
pnpm --filter @eft-tracker/companion test:watch

# Coverage report
pnpm --filter @eft-tracker/companion test:coverage
```

### Frontend Unit Tests

**Location:** `src/**/*.test.tsx`

Test React utilities and pure functions:

```typescript
// Example: useStore hook test
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStore } from "./useStore";

describe("useStore", () => {
  it("loads settings from storage", async () => {
    const { result } = renderHook(() => useStore());
    expect(result.current.token).toBeDefined();
  });

  it("saves settings to storage", async () => {
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.setToken("new-token-123");
    });
    expect(result.current.token).toBe("new-token-123");
  });
});
```

**Currently tested:**

- ✅ Token validation and parsing
- ✅ Settings persistence
- ✅ Component rendering
- ⚠️ Gap: LinkAccount component logic
- ⚠️ Gap: SettingsPanel component interactions

### Backend Unit Tests

**Location:** `src-tauri/src/**/*.rs`

Test Rust functions inline using `#[cfg(test)]` modules:

```rust
#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_detect_eft_installation() {
    let path = detect_eft_path();
    assert!(path.exists());
  }

  #[test]
  fn test_parse_quest_log() {
    let log = "some quest data";
    let result = parse_quest_line(log);
    assert!(result.is_ok());
  }
}
```

**Run backend tests:**

```bash
cd apps/companion/src-tauri
cargo test                    # All tests
cargo test test_eft_path      # Specific test
cargo test -- --nocapture    # Show println! output
```

**Currently tested (28 tests):**

- ✅ EFT installation detection (5 tests)
  - Valid EFT paths
  - Invalid/missing paths
  - Registry fallback detection
- ✅ Game log parsing (8 tests)
  - Quest completion events
  - Malformed log lines
  - Edge cases
- ✅ API response handling (10 tests)
  - Success responses
  - Authentication errors
  - Network retries
- ✅ Settings management (5 tests)
  - Save/load cycle
  - Persistence across restarts
  - Default values

## Integration Tests

### Running Integration Tests

```bash
# Run all integration tests
pnpm --filter @eft-tracker/companion test -- __tests__/integration

# Specific test file
pnpm --filter @eft-tracker/companion test -- __tests__/integration/components/LinkAccount.test.tsx
```

### Component Integration Tests

**Location:** `__tests__/integration/components/`

Test React components with mocked Tauri API:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { invoke } from '@tauri-apps/api/core';
import LinkAccount from '../../../src/components/LinkAccount';

vi.mock('@tauri-apps/api/core');

describe('LinkAccount Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates token format before submitting', async () => {
    render(<LinkAccount />);
    const input = screen.getByPlaceholderText(/enter token/i);
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText(/link account/i));
    expect(await screen.findByText(/invalid token format/i)).toBeInTheDocument();
  });

  it('calls backend sync on valid token', async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({ success: true });

    render(<LinkAccount />);
    const input = screen.getByPlaceholderText(/enter token/i);
    fireEvent.change(input, { target: { value: 'valid_token_123' } });
    fireEvent.click(screen.getByText(/link account/i));

    expect(mockInvoke).toHaveBeenCalledWith('link_account', expect.any(Object));
  });

  it('navigates back on success', async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue({ success: true });

    const { rerender } = render(<LinkAccount />);
    // ... interact with component
    expect(screen.queryByText(/link account/i)).not.toBeInTheDocument();
  });
});
```

**Mocking strategies:**

```typescript
// Mock Tauri invoke command
vi.mock("@tauri-apps/api/core");

// Mock React Router navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  ...vi.importActual("react-router-dom"),
}));

// Mock window APIs
Object.defineProperty(window, "localStorage", {
  value: new Map(),
});
```

## End-to-End Tests

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run with browser UI (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test __tests__/e2e/quest-workflow.spec.ts

# Run specific test by name
npx playwright test -g "authentication flow"

# Debug mode (step through)
npx playwright test --debug
```

### E2E Test Structure

**Location:** `__tests__/e2e/`

Test critical user workflows end-to-end:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Companion App E2E", () => {
  test("complete authentication and quest sync flow", async ({ page }) => {
    // 1. Navigate to app
    await page.goto("http://localhost:1420");

    // 2. Wait for initial load
    await page.waitForLoadState("networkidle");

    // 3. Link account
    await page.click('[data-testid="link-button"]');
    await page.fill('[data-testid="token-input"]', "valid_token_xyz");
    await page.click('[data-testid="submit-button"]');

    // 4. Verify success
    await expect(page.locator('[data-testid="status"]')).toContainText(
      "Linked"
    );

    // 5. Verify quest data loaded
    const quests = page.locator('[data-testid="quest-item"]');
    await expect(quests).toHaveCount(5);
  });

  test("settings persistence across restarts", async ({ page, context }) => {
    // First load
    await page.goto("http://localhost:1420");
    await page.click('[data-testid="settings-icon"]');
    await page.click('[data-testid="toggle-notifications"]');

    // Simulate app restart (new page in same context)
    const newPage = await context.newPage();
    await newPage.goto("http://localhost:1420");

    // Verify setting persisted
    const toggle = newPage.locator('[data-testid="toggle-notifications"]');
    await expect(toggle).toHaveAttribute("data-checked", "true");
  });
});
```

**Currently tested (1 E2E suite):**

- ✅ Authentication flow
- ✅ Settings panel interactions
- ✅ System tray behavior
- ⚠️ Limited: Only critical paths

### Playwright Best Practices

**Wait for elements properly:**

```typescript
// ❌ Bad - might not work
await page.click('[data-testid="button"]');

// ✅ Good - wait for visibility
await page.click('[data-testid="button"]', { timeout: 5000 });

// ✅ Better - wait for condition
await page.waitForSelector('[data-testid="button"]:visible');
await page.click('[data-testid="button"]');
```

**Handle dialogs/modals:**

```typescript
// Listen for dialog BEFORE triggering it
const dialogPromise = page.waitForEvent("dialog");
await page.click('[data-testid="delete-button"]');
const dialog = await dialogPromise;
await dialog.accept();

// Or dismiss with cancel
await dialog.dismiss();
```

**Test data attributes:**

All testable elements should have `data-testid`:

```tsx
// Components should include test attributes
export function LinkAccount() {
  return (
    <div data-testid="link-account-panel">
      <input data-testid="token-input" />
      <button data-testid="submit-button">Link Account</button>
    </div>
  );
}
```

## Test Coverage

### Current Coverage

| Layer         | Coverage | Status               |
| ------------- | -------- | -------------------- |
| Frontend Unit | ~15%     | ⚠️ Needs improvement |
| Backend Unit  | ~30%     | ✅ Good              |
| Integration   | ~5%      | ⚠️ Needs tests       |
| E2E           | 1 suite  | ⚠️ Limited           |
| **Overall**   | **~10%** | ⚠️ **Target: >40%**  |

### Coverage Report

```bash
# Generate coverage report
pnpm --filter @eft-tracker/companion test:coverage

# Opens: apps/companion/coverage/index.html
```

### Improving Coverage

**Priority 1 (Component Tests):**

1. `LinkAccount` - Authentication form
2. `SettingsPanel` - Settings UI
3. `RecentEvents` - Event list display

**Priority 2 (Integration Tests):**

1. API integration with mocked responses
2. Store persistence
3. Settings panel saving

**Priority 3 (E2E Tests):**

1. Full authentication workflow
2. Settings save/restore
3. Auto-update simulation (complex)

## Manual Testing

### Pre-Release Checklist

Use this checklist before each release:

**Installation & Launch:**

- [ ] Download and run `.msi` installer
- [ ] App launches from Start Menu
- [ ] System tray icon appears
- [ ] Settings accessible from tray icon

**First Run Experience:**

- [ ] Welcome dialog displays
- [ ] Can link Learn to Tarkov account
- [ ] Token validation works (try invalid first)
- [ ] Settings panel shows default values

**Settings:**

- [ ] Can enable/disable notifications
- [ ] Can toggle auto-watch
- [ ] Can toggle autostart on boot
- [ ] Settings persist after app restart

**EFT Integration:**

- [ ] App auto-detects EFT installation
- [ ] Can manually set EFT path
- [ ] Log watching starts after linking account
- [ ] Progress updates show in system tray

**System Tray:**

- [ ] Icon visible in system tray
- [ ] Click opens/closes app window
- [ ] Right-click shows context menu
- [ ] "Quit" option closes app properly

**Auto-Updates:**

- [ ] App checks for updates on startup
- [ ] Update notification appears if available
- [ ] Update download and installation works
- [ ] App restarts successfully after update

**Uninstallation:**

- [ ] App can be uninstalled from Add/Remove Programs
- [ ] All files removed (no leftover shortcuts)
- [ ] Registry cleaned up

## Debugging Tests

### Unit Test Debugging

```bash
# Run with verbose output
pnpm --filter @eft-tracker/companion test -- --reporter=verbose

# Run with console logs visible
pnpm --filter @eft-tracker/companion test -- --reporter=verbose 2>&1

# Debug single test
pnpm --filter @eft-tracker/companion test -- __tests__/unit/utils.test.ts
```

### E2E Test Debugging

```bash
# Interactive debug mode
npx playwright test --debug

# Generate trace (records all actions)
npx playwright test --trace=on

# View trace
npx playwright show-trace trace.zip
```

### Common Issues

**Test hangs on async operations:**

```typescript
// ❌ Bad - might timeout
test("loads data", async ({ page }) => {
  await page.goto("http://localhost:1420");
  // No wait - test hangs
});

// ✅ Good - wait for data
test("loads data", async ({ page }) => {
  await page.goto("http://localhost:1420");
  await page.waitForSelector('[data-testid="quest-list"]');
});
```

**Mock not working:**

```typescript
// ✅ Mock BEFORE import
vi.mock("@tauri-apps/api/core");
import LinkAccount from "./LinkAccount";

// ❌ Mock AFTER import doesn't work
import LinkAccount from "./LinkAccount";
vi.mock("@tauri-apps/api/core");
```

**Flaky tests (intermittent failures):**

- Increase timeouts: `{ timeout: 10000 }`
- Wait for specific condition instead of time
- Check for race conditions in component code

## CI/CD Integration

### GitHub Actions

Tests run automatically on every push to `master`:

```yaml
# .github/workflows/ci.yml
- name: Run Tests
  run: npm test
```

**CI includes:**

- ✅ Unit tests
- ✅ Integration tests
- ✅ Linting & type checking
- ✅ Build verification
- ✅ E2E tests (if re-enabled)

### Pre-Commit Hooks

The project includes git hooks to catch issues before pushing:

```bash
# Automatically runs before git commit
npm run lint
npm run type-check

# Automatically runs before git push
npm test
npm run build
```

## Performance Testing

### Measuring Performance

```bash
# Create performance baseline
powershell -File scripts/measure-performance.ps1

# Results saved to: docs/tauri/PERFORMANCE_BASELINE.md
```

### Performance Targets

| Metric       | Target  | Current | Status  |
| ------------ | ------- | ------- | ------- |
| Binary size  | <20 MB  | 2.7 MB  | ✅ PASS |
| Startup time | <3s     | 1.8s    | ✅ PASS |
| Idle memory  | <150 MB | 87 MB   | ✅ PASS |

See: `docs/tauri/PERFORMANCE_BASELINE.md`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Trophy](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Need help?** Check existing issues or create a new GitHub issue.

Last updated: December 17, 2025
