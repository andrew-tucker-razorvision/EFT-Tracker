# CI/CD Pipeline Setup Guide

Complete guide for setting up a production-ready CI/CD pipeline with GitHub Actions, including quality gates, security scanning, and best practices.

## Table of Contents

- [Overview](#overview)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Repository Settings](#repository-settings)
- [Security Features](#security-features)
- [Replication Guide](#replication-guide)

---

## Overview

This repository uses a comprehensive CI/CD pipeline with:

- **Automated testing** on every PR
- **Code quality checks** (linting, formatting, type checking)
- **Security scanning** (CodeQL, Dependabot, Dependency Review)
- **Branch protection** (no direct pushes to main/master)
- **Automated PR validation** (titles, branch names, size checks)

**Key Principles:**

1. All changes go through pull requests
2. All checks must pass before merging
3. Clean, linear git history (squash merging)
4. Automated security updates
5. No bypassing rules (even for admins)

---

## GitHub Actions Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** Pull requests and pushes to master

**Jobs:**

1. **Lint & Format** - ESLint and Prettier checks
2. **Type Check** - TypeScript type checking
3. **Test** - Unit, integration, and component tests with Vitest
4. **Security Audit** - npm audit (non-blocking, informational)
5. **Dependency Review** - Scans for vulnerable dependencies (requires Dependency Graph enabled)
6. **Build** - Next.js production build
7. **E2E Tests** - Playwright end-to-end tests
8. **CI Success** - Summary check (required for branch protection)

**Key Configuration:**

```yaml
# No continue-on-error for critical checks
# Parallel job execution for speed
# Caching for node_modules and build artifacts
```

### 2. PR Checks Workflow (`.github/workflows/pr-checks.yml`)

**Triggers:** Pull request events (opened, synchronize, reopened, edited)

**Permissions Required:**

```yaml
permissions:
  contents: read
  pull-requests: write # For auto-commenting
  issues: write # For auto-labeling
```

**Checks:**

1. **Validate PR Title** - Enforces conventional commit format
2. **Check PR Size** - Warns on large PRs (>500 lines)
3. **Check Merge Conflicts** - Ensures no conflicts with base branch
4. **Check for TODOs** - Finds and reports TODO/FIXME comments
5. **Check Branch Name** - Validates branch naming convention
6. **Check Sensitive Files** - Prevents committing .env files and large files
7. **Auto Label PR** - Automatically labels based on changed files

### 3. CodeQL Workflow (`.github/workflows/codeql.yml`)

**Triggers:** Pull requests, pushes to master, weekly schedule

**Purpose:** Security vulnerability scanning for code

### 4. Container Security (`.github/workflows/container-security.yml`)

**Purpose:** Docker image scanning with Trivy and Hadolint

---

## E2E Test Status (Active Development Phase)

### Current State

E2E tests are **temporarily disabled** in CI (`.github/workflows/ci.yml` line 170):

```yaml
e2e:
  if: false # Disabled during active development
```

### Rationale

- Faster CI feedback during rapid iteration
- Tests are not yet stable (flaky timeouts)
- Local testing preferred during active dev
- Small team can coordinate deployment safety

### Running E2E Tests Locally

```bash
# Start dev server
npm run dev
# Note the port (usually 3001)

# Run tests in another terminal
NEXTAUTH_URL=http://localhost:3001 npx playwright test

# Run with UI for debugging
NEXTAUTH_URL=http://localhost:3001 npx playwright test --ui
```

### Re-enablement Plan

E2E tests will be re-enabled when:

1. Login timeout issues resolved (increase from 10s to 15s) ✅
2. Quest tree viewport loading stabilized
3. All tests pass consistently (3 consecutive runs)
4. Test suite completes in <5 minutes
5. Team agrees it's the right time

**To re-enable:**

```yaml
e2e:
  if: true # or remove the if condition entirely
```

---

## Repository Settings

### Branch Protection Rules

**Settings → Branches → Add rule for `master` (or `main`)**

#### Required Settings:

- ✅ **Require a pull request before merging**
  - ❌ Do not require approvals (for solo dev)
  - ✅ Dismiss stale pull request approvals when new commits are pushed

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Add required checks:
    - `Validate PR Title`
    - `Check Branch Name`
    - `Lint & Format`
    - `Test (20)`
    - `Build`
    - `E2E Tests`
    - `CI Success`

- ✅ **Require conversation resolution before merging**

- ✅ **Require linear history**

- ✅ **Do not allow bypassing the above settings**
  - This applies rules to administrators too

### Pull Request Settings

**Settings → General → Pull Requests**

- ✅ **Allow squash merging**
  - Default message: "Pull request title and description"
- ❌ **Allow merge commits** (disabled for clean history)
- ✅ **Allow rebase merging** (optional)
- ✅ **Automatically delete head branches**
- ✅ **Allow auto-merge**

### Actions Settings

**Settings → Actions → General**

- **Fork pull request workflows:**
  - ✅ Require approval for first-time contributors

- **Workflow permissions:**
  - ✅ Read repository contents and packages permissions
  - ✅ Allow GitHub Actions to create and approve pull requests (for Dependabot)

---

## Security Features

### 1. Dependency Graph

**Settings → Security → Code security and analysis**

- ✅ **Dependency graph** - Tracks dependencies
- ✅ **Dependabot alerts** - Alerts for vulnerable dependencies
- ✅ **Dependabot security updates** - Auto-creates PRs for security fixes
- ✅ **Dependabot version updates** - Auto-creates PRs for version updates
- ✅ **Grouped security updates** - Combines multiple updates into one PR

**Why:** Proactive security monitoring and automated patching

### 2. CodeQL Analysis

**Settings → Security → Code security and analysis**

- ✅ **CodeQL analysis** - Automated security scanning

**Configuration:** `.github/workflows/codeql.yml`

**Scans for:** SQL injection, XSS, command injection, and other OWASP Top 10 vulnerabilities

### 3. CODEOWNERS File

**File:** `.github/CODEOWNERS`

**Purpose:** Defines code ownership for automatic review assignments

**Example:**

```
# Default owner for everything
* @your-username

# Critical paths
/.github/ @your-username
/prisma/ @your-username
```

---

## Replication Guide

Follow these steps to replicate this setup in a new project:

### Step 1: Copy Workflow Files

Copy these files to your new repository:

```bash
.github/workflows/ci.yml
.github/workflows/pr-checks.yml
.github/workflows/codeql.yml
.github/workflows/container-security.yml  # Optional
.github/labeler.yml                        # For auto-labeling
.github/CODEOWNERS                         # Update usernames
```

**Update in each file:**

- Node.js version (if different)
- Test commands
- Build commands
- Package manager (npm/pnpm/yarn)

### Step 2: Enable Security Features

Go to **Settings → Security → Code security and analysis**

1. Enable **Dependency graph**
2. Enable **Dependabot alerts**
3. Enable **Dependabot security updates**
4. Enable **Dependabot version updates**
5. Enable **Grouped security updates**
6. Enable **CodeQL analysis**

### Step 3: Configure Branch Protection

Go to **Settings → Branches → Add branch protection rule**

1. Branch name pattern: `master` or `main`
2. Check all settings listed in [Branch Protection Rules](#branch-protection-rules) section above
3. Add all required status checks (they'll appear after first PR)
4. Save the rule

### Step 4: Configure Pull Request Settings

Go to **Settings → General → Pull Requests**

1. ✅ Allow squash merging
2. ❌ Disable merge commits
3. ✅ Automatically delete head branches
4. ✅ Allow auto-merge
5. Save changes

### Step 5: Configure Actions Permissions

Go to **Settings → Actions → General**

1. Set fork PR workflows: "Require approval for first-time contributors"
2. Set workflow permissions: "Read repository contents"
3. ✅ Allow GitHub Actions to create and approve pull requests
4. Save

### Step 6: Update CODEOWNERS

Edit `.github/CODEOWNERS`:

```bash
# Replace with your GitHub username
* @your-username

# Update critical paths for your project
/.github/ @your-username
/src/lib/auth.ts @your-username
```

### Step 7: Test the Setup

1. Create a feature branch: `git checkout -b feature/test-ci`
2. Make a small change
3. Push and create a PR
4. Verify all checks run and pass
5. Verify branch protection prevents direct pushes to master
6. Merge the PR to confirm squash merging works
7. Verify branch auto-deletion

---

## Branch Naming Convention

**Required prefixes:**

- `feature/` - New features
- `fix/` or `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions
- `chore/` - Maintenance tasks

**Examples:**

- `feature/add-user-dashboard`
- `fix/login-validation-error`
- `docs/update-readme`

---

## Commit Message Convention

**Format:** `type: Description starting with uppercase`

**Types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks
- `perf:` - Performance improvements
- `ci:` - CI/CD changes
- `build:` - Build system changes
- `revert:` - Revert previous commit

**Examples:**

- `feat: Add user authentication`
- `fix: Resolve login validation error`
- `docs: Update installation instructions`

---

## Workflow Customization

### Adding Custom Checks

To add a new check to `ci.yml`:

```yaml
custom-check:
  name: Custom Check
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
    - run: npm ci
    - run: npm run custom-command
```

### Adjusting PR Size Threshold

Edit `.github/workflows/pr-checks.yml`:

```yaml
# Change from 500 to your preferred limit
if [ $TOTAL -gt 500 ]; then
```

### Excluding Paths from Workflows

Add to any workflow:

```yaml
on:
  pull_request:
    paths-ignore:
      - "docs/**"
      - "*.md"
```

---

## Troubleshooting

### Check Failing: "Dependency Review not supported"

**Solution:** Enable Dependency Graph in repository settings

### Branch Protection: "Required status check not found"

**Solution:** Status checks must run at least once before they can be added as required. Create a test PR first.

### CodeQL Scanning Errors

**Solution:** Ensure `codeql.yml` has correct language configuration and sufficient permissions

### Dependabot PRs Not Created

**Solution:**

1. Check Dependabot is enabled in security settings
2. Verify `.github/dependabot.yml` configuration exists
3. Check Actions permissions allow PR creation

---

## Maintenance

### Regular Tasks

1. **Review Dependabot PRs** - Merge security updates promptly
2. **Monitor workflow run times** - Optimize slow checks
3. **Update workflow actions** - Keep GitHub Actions up to date
4. **Review TODO comments** - Address or create issues for them

### Updating Node.js Version

Update in all workflow files:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20 # Update this
```

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Last Updated:** 2025-11-26
**Tested With:** Next.js 16, Node.js 20, TypeScript 5
