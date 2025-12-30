# Start Day

Start a fresh development session by syncing, checking project health, and suggesting high-impact work.

## Steps

Run checks in parallel where possible for speed.

### 1. Sync with master

```bash
# Check for uncommitted changes first
git status --porcelain

# Stash if needed (report what was stashed)
git stash list

# Fetch and check sync status
git fetch origin
git status -sb

# Check for unpushed commits
git log origin/master..HEAD --oneline 2>/dev/null

# Pull latest
git pull origin master
```

Report:

- Any uncommitted changes (offer to stash)
- Any unpushed commits (warn - these should be pushed)
- Untracked files that may need attention (ignore `node_modules`, `.next`, etc.)

### 2. Health checks (run in parallel)

#### CI Status on master

```bash
# Get latest commit SHA on master
SHA=$(git rev-parse origin/master)

# Check GitHub Actions status
curl -s "https://api.github.com/repos/tuckerandrew21/EFT-Tracker/commits/$SHA/check-runs" | jq -r '.check_runs[] | "\(.status) \(.conclusion // "pending") - \(.name)"'
```

#### Quick test run

```bash
npm test 2>&1 | tail -20
```

Report pass/fail count. If tests fail, flag as high priority to fix.

#### Dependency check

```bash
npm outdated --depth=0 2>/dev/null | head -10
```

Flag any major version updates or security-related packages.

### 3. Check open items

#### Open PRs

Use `mcp__github__list_pull_requests` with state=open.

For each PR, check CI status and report:

- PR number, title, author
- CI status (passing/failing/pending)
- How long it's been open

#### Open Issues

Use `mcp__github__list_issues` with state=open.

**Exclude deferred items** (see Deferred Items section below).

#### Stale branches

```bash
# Branches not updated in 7+ days (excluding master)
git for-each-ref --sort=-committerdate --format='%(refname:short) %(committerdate:relative)' refs/heads/ | grep -v master | head -10
```

### 4. Yesterday's context

#### Recent commits by me

```bash
git log --author="$(git config user.name)" --since="3 days ago" --oneline --no-merges | head -10
```

#### Open branches

```bash
git branch --list | grep -v master
```

#### Current work detection

Check if there's a `PLAN.md` or similar planning file that indicates work in progress.

### 5. Smart suggestions

Generate 3-5 high-impact tasks based on:

#### Priority order:

1. **Failing tests** - Must fix before other work
2. **Failed CI on master** - Blocking all PRs
3. **Open bugs** - Issues labeled "bug"
4. **Draft/stale PRs** - Finish what's started
5. **Unintegrated components** - Code written but not used

#### Scan for unintegrated components

```bash
# Find React components that aren't imported anywhere
for file in $(find src/components -name "*.tsx" -type f); do
  component=$(basename "$file" .tsx)
  if ! grep -r "import.*$component" src/ --include="*.tsx" --include="*.ts" | grep -v "$file" > /dev/null 2>&1; then
    echo "Unintegrated: $component"
  fi
done
```

#### Check for incomplete features

Look for:

- Components with `// TODO` comments
- API routes without corresponding UI
- Recent commits mentioning "WIP" or "partial"

#### Companion app sync check

If web app has changes that might affect companion app:

```bash
# Check if API routes changed recently
git diff --name-only HEAD~10 | grep "src/app/api/companion"
```

## Deferred Items

The following items are intentionally deferred and should be **excluded from the Open Issues list**:

- **#104** (E2E tests) - Disabled to reduce CI costs during active development. Will re-enable before v1.0 release.

When listing open issues, filter out these issue numbers and adjust the count accordingly.

## Output Format

```
## Start Day Summary

### Sync Status
- Branch: master
- Status: Up to date / X commits behind / X unpushed commits
- Uncommitted: [none / X files]
- Untracked: [none / list notable files]

### Health Checks
- CI (master): Passing / Failing
- Tests: X passed, X failed
- Dependencies: [up to date / X outdated]

### Open Items
| Type | # | Status |
|------|---|--------|
| PRs  | X | [details] |
| Issues | X | [details] |

### Yesterday's Context
Last worked on: [branch/feature name]
Recent commits:
- [commit message]
- [commit message]

### Suggested Focus Areas
1. [High impact task] - [why it matters]
2. [High impact task] - [why it matters]
3. [High impact task] - [why it matters]

### Dev Environment
- Server: Running on http://localhost:3000
- Cache: Cleared (.next removed, Prisma regenerated)

### Quick Actions
- [ ] Push unpushed commits
- [ ] Review PR #X (CI passed)
- [ ] Fix failing test in X
```

## Automatic Actions

### Start local dev environment

After all checks complete, automatically start the local development environment:

```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# If in use, kill the process (get PID from netstat output)
# cmd /c "taskkill /F /PID <PID>"

# Clear Next.js cache and regenerate Prisma client
rm -rf .next && npx prisma generate

# Start dev server in background
npm run dev
```

**Important:** Always use port 3000. Never use alternative ports as this causes NextAuth callback issues.

After starting, verify the server is running by waiting a few seconds and checking:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "starting..."
```

### Offer to push unpushed commits

If there are unpushed commits, ask: "You have X unpushed commits. Push now?"

### Offer to run tests

If tests haven't been run recently, offer to run the full suite.

### Clean up stale branches

If there are branches >30 days old, offer to delete them.
