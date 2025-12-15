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

### Local Environment Best Practices

**Environment Configuration:**

1. **Use `.env.local` for local overrides** - Never commit this file
   - Set `NEXTAUTH_URL` to match your dev server (e.g., `http://localhost:3000`)
   - Use `DATABASE_URL_DEVELOP` for local development database
   - Keep secrets and API keys here, not in `.env`

2. **Port flexibility** - The dev server will auto-assign an available port
   - If 3000 is taken, Next.js will suggest 3001, 3002, etc.
   - Update `NEXTAUTH_URL` in `.env.local` to match the actual port
   - Example: `NEXTAUTH_URL=http://localhost:3001`

3. **Clean restarts** - When switching branches or after pulling changes:

   ```bash
   rm -rf .next && npx prisma generate && npm run dev
   ```

4. **Database branches** - Use separate databases for different workflows:
   - Local feature work: Personal dev database or local PostgreSQL
   - Testing develop branch: `DATABASE_URL_DEVELOP` (Neon development branch)
   - Never use production database locally

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

### Branch Workflow

**Current Strategy: Direct to Master (Active Development Phase)**

This project uses a simplified workflow during active development for faster iteration:

```text
feature/* → master → production (Coolify auto-deploy)
```

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

- ✅ **Re-enabled in CI** (Dec 15, 2025) after achieving 100% stability
- Runs on every PR via `.github/workflows/ci.yml`
- 3 critical path tests covering quest interactions and focus mode
- ~16 second runtime with 2 workers in parallel
- Uses robust modal dismissal to prevent flakiness
- See: [\_\_tests\_\_/e2e/quest-workflow.spec.ts](__tests__/e2e/quest-workflow.spec.ts)

**Key E2E Testing Insight:**
The biggest source of E2E flakiness was the welcome modal not being dismissed properly, blocking ReactFlow from rendering. Always ensure modals are fully dismissed (wait for `hidden` state) before proceeding with tests.

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

## Deployment

### Auto-Deployment from GitHub to Coolify

**Setup completed:** The repository is configured for automatic deployment to production when code is merged to `master`.

**How it works:**

1. Code is merged to `master` branch (via PR after CI checks pass)
2. GitHub sends a webhook to Coolify with HMAC-SHA256 signature
3. Coolify validates the webhook signature for security
4. Deployment is automatically queued and executed:
   - Clones repository at the specific commit SHA
   - Builds Docker image using multi-stage Dockerfile
   - Runs healthcheck on new container
   - Performs rolling update (zero downtime)
   - Removes old container after new one is healthy

**Webhook configuration:**

- **URL:** `http://95.217.155.28:8000/webhooks/source/github/events/manual`
- **Secret:** Stored in both GitHub webhook settings and Coolify configuration
- **Events:** Push events only (triggers on merge to master)
- **Content-Type:** application/json

**Deployment timing:**

- Docker build: ~2 minutes
- Healthcheck wait: ~30 seconds
- Total deployment time: ~3 minutes from merge to live

**Monitoring deployments:**

- View deployment logs in Coolify: `http://95.217.155.28:8000/`
- Navigate to: Projects → EFT-Tracker → Deployments
- Each deployment shows: commit SHA, trigger type (Webhook/Manual), status, logs

**Manual deployment:**

If needed, you can trigger a manual deployment from the Coolify dashboard using the "Redeploy" button.

**Production URL:** `https://learntotarkov.com`

## Model Selection (Cost Optimization)

**Goal:** Reduce Claude API costs by 35% while maintaining code quality.

### Quick Decision Framework

Before starting any task:

```
□ Is it security/auth/database schema? → SONNET
□ Is it >500 LOC or >3 files? → SONNET
□ Is error message clear OR scope well-defined? → HAIKU
□ Otherwise → Default to HAIKU, escalate if needed
```

### Use Haiku (Target: 75-80% of tasks)

- Bug fixes with clear error messages
- Unit test writing
- Integration test writing
- File operations (search, read, edit)
- Documentation updates
- Simple features (<300 LOC)
- Git operations
- Code review (<500 lines)
- Single-file refactoring

### Use Sonnet (Target: 20-25% of tasks)

- Security-critical code (auth, rate limiting, validation)
- Database schema changes
- Complex features (>500 LOC)
- Architectural decisions
- E2E test debugging
- Performance optimization
- Ambiguous problem analysis

### Quality Gates

Before shipping any Haiku work:

- ✅ All tests pass (unit, integration)
- ✅ Lint/format checks clean
- ✅ Type checking passes
- ✅ No console errors in dev

**Detailed guidelines:** See [.claude/HAIKU_GUIDE.md](.claude/HAIKU_GUIDE.md)

**Tracking log:** See [.claude/HAIKU_LOG.md](.claude/HAIKU_LOG.md)

---

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

## Testing Philosophy

### Test Pyramid

This project follows a proper test pyramid with distinct boundaries:

```
        /\
       /E2\     E2E (2%) - Critical user journeys only
      /----\
     / INT  \   Integration (49%) - Components with mocked APIs
    /--------\
   /   UNIT   \ Unit (49%) - Pure functions, calculations
  /------------\
```

**Current Test Distribution:** 49% Unit : 49% Integration : 2% E2E (✅ Healthy!)

### When to Use Each Test Type

#### Unit Tests (\_\_tests\_\_/unit/)

**Use for:** Pure functions, calculations, utilities, business logic

**Examples:**

- Transform parsing (`parseZoomFromTransform`)
- Node positioning calculations (`calculateNodeHeight`)
- Touch target size validation
- Utility functions (rate limiting, string formatting)

**Characteristics:**

- Fast (<100ms per test)
- No external dependencies
- No browser, no API calls, no database
- Test edge cases exhaustively

**Run with:** `npm test -- __tests__/unit/`

#### Integration Tests (\_\_tests\_\_/integration/)

**Use for:** React components, API routes with mocked dependencies, multi-component interactions

**Examples:**

- `QuestTree` component with mocked ReactFlow
- `QuestFilters` with mocked API calls
- API routes with MSW handlers
- Contract verification tests

**Characteristics:**

- Medium speed (<500ms per test)
- Mock external dependencies (APIs, databases)
- Test component behavior, not implementation
- Use MSW for API mocking
- Use React Testing Library for component tests

**Run with:** `npm test -- __tests__/integration/`

#### E2E Tests (\_\_tests\_\_/e2e/)

**Use for:** ONLY critical user journeys that MUST work for app to be usable

**Examples:**

- ✅ Login → complete quest → verify progress saved
- ✅ Double-click quest → enter focus mode → ESC exits
- ❌ Filter by trader (use integration test instead)
- ❌ Verify quest count (use unit/integration test)

**Critical Rules:**

- Maximum 3-5 E2E tests total
- Each test must represent a complete user journey
- Keep tests under 150 lines each
- Use helper functions for common operations
- **ALWAYS dismiss modals properly** - wait for `hidden` state

**Run with:** `npx playwright test`

#### Smoke Tests (\_\_tests\_\_/smoke/)

**Use for:** Post-deployment validation in production

**Examples:**

- Critical API endpoints return 200
- Homepage loads without errors
- Authentication flow accessible
- No console errors on page load

**Characteristics:**

- Very fast (<2 min total)
- Run against production URL
- Triggered by deployment webhook
- Creates GitHub issue on failure

**Run with:** `npx playwright test --config=__tests__/smoke/smoke.config.ts`

### API Contract Testing

Use TypeScript + Zod for compile-time and runtime type safety:

1. Define schemas in [src/types/api-contracts.ts](src/types/api-contracts.ts)
2. Import schemas in both API routes and MSW handlers
3. Create contract verification tests in `__tests__/integration/api/contracts/`
4. TypeScript catches type mismatches at compile time
5. Zod validates request/response shapes at runtime

**No need for heavy contract testing tools** (Pact, Dredd) - TypeScript type-sharing is sufficient for monolithic apps.

### Pre-Commit Checklist

Before creating a commit or PR:

1. Run `npm test` - all tests pass
2. Run `npm run lint` - no lint errors
3. Scan for new TODO/FIXME comments - create issues if needed
4. Check PR size - consider splitting if >500 lines
5. Write meaningful commit message with context
6. Include test coverage for new functionality
7. **New features:** Add appropriate test coverage at the right level (prefer unit/integration over E2E)
