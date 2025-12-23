# Feature Branch Workflow

## CRITICAL: Branch First, Code Second

**Before making ANY edits on a new body of work:**

1. Check current branch: `git branch --show-current`
2. Check for uncommitted changes: `git status`
3. If on wrong branch or have unrelated changes:
   - Stash unrelated work: `git stash push -m "WIP: description"`
   - Switch to master: `git checkout master && git pull`
   - Create feature branch: `git checkout -b <type>/<description>`

## When This Applies

A "new body of work" includes:

- New features or enhancements
- Bug fixes
- Refactoring efforts
- Documentation updates
- Configuration changes (including .claude/ files)

## Branch Naming

Use full prefixes (CI enforces these):

- `feature/` - New features
- `fix/` or `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Test additions

## Workflow

```bash
# 1. Before ANY new work, check state
git status
git branch --show-current

# 2. If changes exist for different work, stash them
git stash push -m "WIP: previous work description"

# 3. Start fresh from master
git checkout master && git pull origin master

# 4. Create dedicated branch
git checkout -b feature/your-feature-name

# 5. Now safe to make edits
# ... do your work ...

# 6. Commit and push
git add <files>
git commit -m "feat: description"
git push -u origin feature/your-feature-name

# 7. Restore previous work if needed
git checkout previous-branch
git stash pop
```

## Edge Cases

**Already on a feature branch with unrelated uncommitted work:**

- Stash the unrelated work
- Create new branch from master
- Complete new work
- Return and restore stashed work

**Multiple small tasks in one session:**

- Each distinct body of work gets its own branch
- Don't batch unrelated changes into one PR
