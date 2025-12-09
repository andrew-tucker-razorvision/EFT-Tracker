# EFT-Tracker Project Notes

## Change Request Workflow

**IMPORTANT:** For non-trivial changes (bug fixes, features, refactors), follow this workflow:

1. **Research deeply** - Explore the codebase to understand the issue/feature fully
   - Read relevant files and understand existing patterns
   - Identify all affected components
   - Consider edge cases and potential side effects

2. **Create a write-up** - Document findings before implementing:
   - Root cause analysis (for bugs) or design approach (for features)
   - Proposed solution with specific files/functions to modify
   - Any trade-offs or alternative approaches considered

3. **Create GitHub issue** - File an issue with the write-up for tracking

4. **Request review** - Present the write-up to the user for approval
   - Wait for explicit approval before proceeding
   - Address any concerns or questions

5. **Implement with approval** - Only after user approves, make the changes
   - Follow the approved approach
   - Test thoroughly before presenting results

This ensures alignment on approach before investing time in implementation.

## Development Workflow

### After Pushing Code

Always clear the Next.js cache after pushing code to ensure changes are visible:

```bash
rm -rf .next && npx prisma generate
```

Then restart the dev server:

```bash
npm run dev
```

### Development Server Port

**IMPORTANT:** Always use port 3000 for the dev server. Never use alternative ports (3001, 3002, etc.) as this can cause confusion and authentication issues with NextAuth callbacks.

If port 3000 is in use:

1. Find the process: `netstat -ano | findstr :3000`
2. Kill it: `cmd /c "taskkill /F /PID <PID>"`
3. Then start the server on port 3000

### Database Schema Changes

After modifying `prisma/schema.prisma`, sync to remote database:

```bash
npx prisma db push
```

## Tech Stack

- Next.js 16 with Turbopack
- Prisma ORM with PostgreSQL (Neon)
- NextAuth for authentication
- Tailwind CSS for styling

## Browser Automation (MCP)

### Playwright (`mcp__playwright__*`)

Use for E2E testing, visual verification, and debugging:

- `browser_navigate` - Go to URL
- `browser_snapshot` - Get accessibility tree (preferred for interaction)
- `browser_click`, `browser_type`, `browser_fill_form` - Interactions
- `browser_take_screenshot` - Visual capture
- `browser_tabs` with `action: 'list'` - List all open tabs
- `browser_close` - Close current page/session

**Note:** This project's E2E tests use the Playwright test runner (`npx playwright test`), which is separate from the MCP tools. The MCP tools are for ad-hoc browser automation during development.

**Screenshot Cleanup:** When taking screenshots during development debugging (stored in `.playwright-mcp/`), remember to delete them when closing the related issue or PR. These are temporary files and should not accumulate in the working directory.

### Playwright Session Management

The MCP Playwright server uses a **persistent browser profile** by default, which can cause "Browser is already in use" errors if sessions aren't closed properly.

**Best practices:**

1. Always call `browser_close` when done with browser automation
2. Before starting new automation, try `browser_tabs` with `action: 'list'` to check session state
3. If you get "Browser is already in use" error, the profile is locked

**Recovery steps for locked sessions:**

1. First try `browser_close` - may work even if other commands fail
2. If that fails, manually close Chrome windows opened by Playwright
3. As last resort, delete the lock: `Remove-Item -Recurse "$env:LOCALAPPDATA\ms-playwright\mcp-chrome-*" -Force`
4. The user may need to restart Claude Code if the MCP server is stuck

**To prevent tab accumulation:**

- Don't call `browser_navigate` repeatedly without closing - reuse the existing tab
- Use `browser_tabs` with `action: 'select'` to switch to existing tabs instead of creating new ones
- Close tabs you're done with using `browser_tabs` with `action: 'close'`

### Visual Change Self-Evaluation

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

### Feature Testing with Playwright MCP

**IMPORTANT:** After implementing new features, use Playwright MCP tools to test them interactively before presenting to the user. This provides additional automated testing beyond unit tests.

**Testing workflow:**

1. **Start dev server** - Ensure `npm run dev` is running on port 3000
2. **Navigate to feature** - Use `browser_navigate` to go to the relevant page
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

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run with UI mode for debugging
npx playwright test --ui

# Run specific test file
npx playwright test homepage.spec.ts
```

### Branch Naming Convention

**IMPORTANT:** Use full prefixes, not abbreviated ones. CI enforces these exact prefixes:

- `feature/` (new features) - NOT `feat/`
- `fix/` (bug fixes)
- `bugfix/` (bug fixes - alternative)
- `hotfix/` (critical production fixes)
- `docs/` (documentation only)
- `refactor/` (code refactoring)
- `test/` (test additions)
- `chore/` (maintenance tasks)

Example: `feature/add-user-dashboard`

### Pull Request Workflow

After creating a PR, automatically monitor CI status using the GitHub check-runs API:

```bash
# Get PR head SHA first, then check runs
curl -s "https://api.github.com/repos/andrew-tucker-razorvision/EFT-Tracker/commits/{SHA}/check-runs" | jq -r '.check_runs[] | "\(.status) \(.conclusion // "pending") - \(.name)"'
```

1. Get the PR's head commit SHA from `mcp__github__get_pull_request`
2. Use curl with the check-runs API (NOT `mcp__github__get_pull_request_status` - that uses the old status API which doesn't work with GitHub Actions)
3. If any check has `status: "in_progress"` or `"queued"`, check again after ~60 seconds
4. When all checks complete, notify the user with:
   - Final status (success/failure)
   - Link to the PR
   - If failed, which checks failed
5. If checks pass and PR is ready, ask if user wants to merge

## Code Quality Guidelines

### TODO/FIXME Policy

- Before committing, scan for TODO/FIXME comments
- For each TODO: Create a GitHub issue and reference it (e.g., `TODO #123: description`)
- FIXMEs must be resolved before merging - they indicate broken code
- Use `it.skip()` for tests that need fixing, with a linked issue

### PR Best Practices

- Keep PRs under 500 lines when possible
- Split large features into logical chunks:
  - Backend/API changes first
  - Frontend components second
  - Tests can be separate or included
- One PR = one logical change
- Always fill out the PR template sections
- **Issue linking:** Put each issue on its own line for auto-close to work:
  ```
  Closes #101
  Closes #102
  ```
  NOT: `Closes #101, #102` (comma-separated won't auto-close)

### Pre-Commit Checklist

Before creating a commit or PR:

1. Run `npm test` - all tests pass
2. Run `npm run lint` - no lint errors
3. Scan for new TODO/FIXME comments - create issues if needed
4. Check PR size - consider splitting if >500 lines
5. Write meaningful commit message with context
6. Include test coverage for new functionality
