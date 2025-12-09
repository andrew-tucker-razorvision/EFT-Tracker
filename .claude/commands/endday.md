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

### 7. Check for TODO/FIXME in today's changes

```bash
git diff HEAD~5 --name-only 2>/dev/null | xargs grep -l "TODO\|FIXME" 2>/dev/null
```

Report any files with new TODO/FIXME comments that may need GitHub issues created.

### 8. Check for .env files staged

```bash
git diff --cached --name-only | grep -E "\.env" 2>/dev/null
```

Security check - warn if any .env files are about to be committed.

### 9. Check for merge conflicts in progress

```bash
git status | grep -i "unmerged\|both modified" 2>/dev/null
```

### 10. Check for large files staged

```bash
git diff --cached --stat 2>/dev/null | grep -E "[0-9]{4,}\s*(insertions|deletions)"
```

Warn if any files have 1000+ line changes - may indicate accidental staging.

### 11. Close any open Playwright browser sessions

```bash
# Check for Playwright MCP browser processes
tasklist /FI "IMAGENAME eq chrome.exe" /FI "WINDOWTITLE eq *playwright*" 2>/dev/null
```

If browser sessions are open, close them with `browser_close` MCP tool.

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
  ✅ Killed dev server on port 3000

TODO/FIXME Comments: [count files]
  ⚠️ Files with TODO/FIXME - consider creating issues

Staged .env Files: [none / list]
  🚨 SECURITY: .env files should not be committed!

Merge Conflicts: [none / in progress]
  ⚠️ Unresolved merge conflicts detected

Large Changes: [none / files]
  ⚠️ Large file changes detected - verify intentional

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

### Close Playwright browser sessions

Always call `mcp__playwright__browser_close` to clean up any open browser sessions.

## Actions to Offer

Based on findings, offer relevant actions:

1. **If uncommitted changes:** "Would you like to commit these changes?"
2. **If unpushed commits:** "Would you like to push now?"
3. **If PR ready to merge:** "Would you like to merge PR #X?"
4. **If on feature branch with no changes:** "Would you like to switch back to master?"
5. **If TODO/FIXME found:** "Would you like me to create GitHub issues for these TODOs?"
6. **If .env staged:** "Would you like me to unstage the .env files?"
7. **If merge conflicts:** "Would you like help resolving the merge conflicts?"
