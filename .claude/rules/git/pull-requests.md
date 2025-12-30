# Pull Request Workflow

## Monitoring CI Status

After creating a PR, automatically monitor CI status using the GitHub check-runs API:

```bash
# Get PR head SHA first, then check runs
curl -s "https://api.github.com/repos/tuckerandrew21/EFT-Tracker/commits/{SHA}/check-runs" | jq -r '.check_runs[] | "\(.status) \(.conclusion // "pending") - \(.name)"'
```

1. Get the PR's head commit SHA from `mcp__github__get_pull_request`
2. Use curl with the check-runs API (NOT `mcp__github__get_pull_request_status` - that uses the old status API which doesn't work with GitHub Actions)
3. If any check has `status: "in_progress"` or `"queued"`, check again after ~60 seconds
4. When all checks complete, notify with:
   - Final status (success/failure)
   - Link to the PR
   - If failed, which checks failed
5. If checks pass and PR is ready, ask if user wants to merge

## PR Best Practices

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
