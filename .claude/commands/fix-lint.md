# Fix Lint

Quickly fix lint and formatting issues.

## Instructions

1. **Run ESLint with auto-fix:**

   ```bash
   npm run lint -- --fix
   ```

2. **Run Prettier:**

   ```bash
   npx prettier --write .
   ```

3. **Show what changed:**

   ```bash
   git diff --stat
   ```

4. **Report results:**
   - Number of files modified
   - Summary of changes
   - Any remaining issues that couldn't be auto-fixed

5. **Offer to commit** if there are changes:
   - Suggested message: `chore: Fix lint and formatting`
   - Only commit if user confirms
