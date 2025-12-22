# Protected Branches

## Master Branch

**IMPORTANT:** The `master` branch is protected. You cannot push directly to it.

All changes to master must go through a Pull Request:

1. Create a feature/fix/refactor branch
2. Push the branch to origin
3. Create a PR targeting master
4. Wait for CI checks to pass (6 required status checks)
5. Merge via GitHub UI or `gh pr merge`

```bash
# Wrong - will be rejected
git push origin master

# Correct workflow
git checkout -b feature/my-change
git push -u origin feature/my-change
gh pr create --base master
```
