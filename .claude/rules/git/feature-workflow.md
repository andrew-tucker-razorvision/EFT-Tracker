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

## Parallel Work with Git Worktrees

**When working on multiple features simultaneously**, use worktrees instead of stashing:

```bash
# Create a worktree for a second feature (from master)
git worktree add ../EFT-Tracker-feature-name feature/feature-name

# Or create worktree with new branch in one command
git worktree add -b fix/bug-name ../EFT-Tracker-bug-name master

# List active worktrees
git worktree list

# Remove worktree when done (after merging PR)
git worktree remove ../EFT-Tracker-feature-name
```

**Workflow:**

1. Keep main repo on your primary feature branch
2. Create worktree for secondary work: `git worktree add ../EFT-Tracker-<name> <branch>`
3. Open each folder in its own VS Code window
4. Work independently - no stashing, no conflicts
5. After PR merges, clean up: `git worktree remove ../EFT-Tracker-<name>`

**Naming convention:** `../EFT-Tracker-<short-description>` keeps worktrees adjacent to main repo.

**Why worktrees over stashing:**

- No risk of applying stash to wrong branch
- Both features visible simultaneously
- Independent Claude Code sessions per worktree
- Clean separation of concerns

## Edge Cases

**Already on a feature branch with unrelated uncommitted work:**

- Stash the unrelated work
- Create new branch from master
- Complete new work
- Return and restore stashed work

**Multiple small tasks in one session:**

- Each distinct body of work gets its own branch
- Don't batch unrelated changes into one PR
