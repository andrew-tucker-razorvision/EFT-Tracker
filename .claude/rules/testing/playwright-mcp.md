# Browser Automation with Playwright MCP

Use Playwright MCP tools for E2E testing, visual verification, and debugging:

- `browser_navigate` - Go to URL
- `browser_snapshot` - Get accessibility tree (preferred for interaction)
- `browser_click`, `browser_type`, `browser_fill_form` - Interactions
- `browser_take_screenshot` - Visual capture
- `browser_tabs` with `action: 'list'` - List all open tabs
- `browser_close` - Close current page/session

**Note:** This project's E2E tests use the Playwright test runner (`npx playwright test`), which is separate from the MCP tools. The MCP tools are for ad-hoc browser automation during development.

## Screenshot Cleanup

When taking screenshots during development debugging (stored in `.playwright-mcp/`), remember to delete them when closing the related issue or PR. These are temporary files and should not accumulate in the working directory.

## Playwright Session Management

The MCP Playwright server uses a **persistent browser profile** by default, which can cause "Browser is already in use" errors if sessions aren't closed properly.

**Best practices:**

1. Always call `browser_close` when done with browser automation
2. Before starting new automation, try `browser_tabs` with `action: 'list'` to check session state
3. If you get "Browser is already in use" error, the profile is locked

**Recovery steps for locked sessions:**

**IMPORTANT:** When Playwright MCP commands fail with timeouts, "about:blank", "AbortError", or "Browser is already in use" errors, run the cleanup script:

```bash
powershell -ExecutionPolicy Bypass -File scripts/dev-cleanup.ps1
```

Or for Playwright-only cleanup (faster):

```bash
powershell -ExecutionPolicy Bypass -File scripts/dev-cleanup.ps1 -PlaywrightOnly
```

Manual recovery (if script unavailable):

1. First try `browser_close` - may work even if other commands fail
2. If that fails, manually close Chrome windows opened by Playwright
3. As last resort, delete the lock: `Remove-Item -Recurse "$env:LOCALAPPDATA\ms-playwright\mcp-chrome-*" -Force`
4. The user may need to restart Claude Code if the MCP server is stuck

**To prevent tab accumulation:**

- Don't call `browser_navigate` repeatedly without closing - reuse the existing tab
- Use `browser_tabs` with `action: 'select'` to switch to existing tabs instead of creating new ones
- Close tabs you're done with using `browser_tabs` with `action: 'close'`

## Visual Change Self-Evaluation

**IMPORTANT:** After making any visual/UI changes, always self-evaluate before presenting to the user:

1. Take a screenshot using `browser_take_screenshot`
2. Critically assess the result - does it look good? Are there obvious issues?
3. If issues are found, iterate and fix them before showing the user
4. Only present the final result once you're satisfied it meets quality standards

Examples of things to check:

- Spacing and alignment - is it balanced and readable?
- Font sizes - are they appropriate for the context?
- Color contrast - is text readable against backgrounds?
- Layout - does it work across different content lengths?
- Overall polish - would this look professional to end users?

Don't rely on the user to catch visual issues - proactively identify and fix them yourself.

## Feature Testing with Playwright MCP

**IMPORTANT:** After implementing new features, use Playwright MCP tools to test them interactively before presenting to the user. This provides additional automated testing beyond unit tests.

**Testing workflow:**

1. **Start dev server** - Ensure `npm run dev` is running (note the port in console output)
2. **Navigate to feature** - Use `browser_navigate` with the actual dev server URL
3. **Wait for load** - Use `browser_wait_for` if needed for async content
4. **Test interactions** - Use `browser_snapshot` to see the accessibility tree, then:
   - `browser_click` to click buttons/links
   - `browser_type` to fill inputs
   - `browser_select_option` for dropdowns
5. **Verify results** - Check the page snapshot after each action
6. **Iterate on failures** - If something doesn't work:
   - Identify the issue from the snapshot or console messages
   - Fix the code
   - Re-test until it works
7. **Clean up** - Always call `browser_close` when done

**Example test flow:**

```
1. browser_navigate -> http://localhost:3000/quests
2. browser_wait_for -> time: 2 (wait for data load)
3. browser_snapshot -> verify UI elements exist
4. browser_click -> click a button (use ref from snapshot)
5. browser_snapshot -> verify expected changes occurred
6. browser_close -> clean up session
```

**What to test:**

- New UI components render correctly
- Buttons/links trigger expected actions
- Forms submit and show success/error states
- Navigation works between views
- Data displays correctly after API calls
- Popovers/modals open and close properly

**Interpreting snapshots:**

- The snapshot shows an accessibility tree with `ref` attributes
- Use the `ref` value to target elements for clicks/interactions
- Look for `[active]`, `[expanded]`, `[disabled]` states
- Check for expected text content and structure

## Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run with UI mode for debugging
npx playwright test --ui

# Run specific test file
npx playwright test homepage.spec.ts
```
