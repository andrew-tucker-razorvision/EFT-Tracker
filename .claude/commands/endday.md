# End Day

Check for open items that need to be closed out before leaving for the day.

## Instructions

Run all checks in parallel, then report a summary.

### 1. Check for uncommitted changes

```bash
git status --porcelain
```

### 2. Check for unpushed commits

```bash
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null
```

### 3. Check current branch

```bash
git branch --show-current
```

If not on master, warn that work may be in progress.

### 4. Check for open PRs by me

```bash
gh pr list --state open --author @me
```

For each open PR, check CI status and report if any are ready to merge.

### 5. Check for stashed changes

```bash
git stash list
```

### 6. Check for running dev servers

```bash
netstat -ano | findstr :3000
```

## Output Format

```
🌙 End of Day Checklist
───────────────────────

Branch: [current branch]
  ⚠️ Not on master - you have work in progress

Uncommitted Changes: [none / list]
  ⚠️ You have uncommitted work

Unpushed Commits: [count]
  ⚠️ Push your commits or they'll be lost

Open PRs: [count]
  ✅ PR #123 - CI passed, ready to merge
  ⏳ PR #124 - CI still running
  ❌ PR #125 - CI failed

Stashed Changes: [count]
  ⚠️ You have stashed work that may be forgotten

Dev Server: [running / stopped]
  ⚠️ Dev server still running on port 3000

───────────────────────
Summary: [X items need attention / All clear!]
```

## Automatic Actions

### Kill dev server (if running)

On Windows:

```bash
# Get PID from netstat output and kill it
powershell -Command "Stop-Process -Id <PID> -Force"
```

On Unix/Mac:

```bash
lsof -ti:3000 | xargs kill -9
```

**Always kill the dev server automatically** - there's no reason to leave it running overnight.

## Actions to Offer

Based on findings, offer relevant actions:

1. **If uncommitted changes:** "Would you like to commit these changes?"
2. **If unpushed commits:** "Would you like to push now?"
3. **If PR ready to merge:** "Would you like to merge PR #X?"
4. **If on feature branch with no changes:** "Would you like to switch back to master?"
