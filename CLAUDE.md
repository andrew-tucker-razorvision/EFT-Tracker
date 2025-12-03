# EFT-Tracker Project Notes

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

**Note:** This project's E2E tests use the Playwright test runner (`npx playwright test`), which is separate from the MCP tools. The MCP tools are for ad-hoc browser automation during development.

**Screenshot Cleanup:** When taking screenshots during development debugging (stored in `.playwright-mcp/`), remember to delete them when closing the related issue or PR. These are temporary files and should not accumulate in the working directory.

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
