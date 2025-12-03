# New Day Startup

Start a fresh development session by checking project status and suggesting high-impact work.

## Steps

1. **Sync with master**
   - Stash any uncommitted changes
   - Pull latest from origin/master
   - Report any stashed changes

2. **Check open items**
   - List open PRs (yours and others)
   - List open issues
   - Check for any failed CI runs on master

3. **Review recent activity**
   - Show last 5 commits to understand recent changes
   - Check if there are any TODO/FIXME comments that need attention

4. **Suggest high-impact work**
   Based on the project state, suggest 3-5 high-impact tasks to work on. Consider:
   - Open issues labeled "bug" or "high priority"
   - Incomplete features that are partially implemented
   - Technical debt or code quality improvements
   - Missing tests for critical paths
   - Performance optimizations
   - UX improvements based on the current UI state

## Output Format

Provide a concise summary:

```
## Project Status
- Branch: master (up to date / X commits behind)
- Open PRs: X
- Open Issues: X
- Recent commits: [brief summary]

## Open Items
[List PRs and issues]

## Suggested Focus Areas
1. [High impact task] - [why it matters]
2. [High impact task] - [why it matters]
3. [High impact task] - [why it matters]
```

Keep suggestions actionable and specific to this codebase.
