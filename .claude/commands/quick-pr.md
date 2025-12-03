# Quick PR

Create a PR quickly with sensible defaults.

## Instructions

1. **Verify branch** - Ensure not on master/main

   ```bash
   git branch --show-current
   ```

2. **Run quality checks**

   ```bash
   npm run lint && npm test
   ```

3. **If checks pass:**
   - Push the branch: `git push -u origin <branch>`
   - Generate PR title from branch name (e.g., `feature/add-login` -> `feat: Add login`)
   - Create PR with `gh pr create`
   - **Important:** When linking issues, put each on its own line:
     ```
     Closes #101
     Closes #102
     ```
     NOT: `Closes #101, #102` (comma-separated won't auto-close)

4. **Monitor CI:**
   - Get PR number and head SHA
   - Check CI status using check-runs API
   - Report when complete

## Branch to Title Mapping

| Branch Prefix | PR Title Prefix |
| ------------- | --------------- |
| feature/      | feat:           |
| fix/          | fix:            |
| bugfix/       | fix:            |
| hotfix/       | fix:            |
| docs/         | docs:           |
| refactor/     | refactor:       |
| test/         | test:           |
| chore/        | chore:          |

## Output

Report:

- PR URL
- CI status (pending/pass/fail)
- Any failing checks
