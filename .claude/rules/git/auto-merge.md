# Auto-Merge (Temporary)

**Status:** ENABLED for fast iteration during active development.

## How It Works

When a PR is created targeting `master`:
1. All required CI checks run
2. Once all checks pass, the PR is automatically squash-merged
3. The source branch is deleted

## Workflow File

`.github/workflows/auto-merge.yml`

## When to Disable

Disable auto-merge when:
- [ ] Team size > 3 developers
- [ ] Production SLA requirements established
- [ ] User base reaches critical mass
- [ ] Code review becomes essential for quality

To disable: Delete or rename `.github/workflows/auto-merge.yml`
