# Account Migration Plan: Work → Personal Ownership

## Executive Summary

Migrate all EFT-Tracker infrastructure from work account (`andrew.tucker@razorvision.net` / `andrew-tucker-razorvision`) to personal account (`tuckerandrew21@gmail.com`) to ensure project ownership independence.

**Current State:**
- **GitHub**: Work account owns repository (`andrew-tucker-razorvision/EFT-Tracker`)
- **Infrastructure**: Split between work and personal accounts
- **Risk**: Work account access loss = potential loss of GitHub repository

**Goal:**
- Transfer complete ownership to personal account
- Zero production downtime acceptable (1-2 hour window)
- Maintain all git history, issues, PRs, and stars

---

## Phase 1: Service Ownership Verification

Before migration, verify which account controls each service.

### Services to Verify

| Service | Expected Owner | Verification Method | Priority |
|---------|---------------|---------------------|----------|
| Domain Registrar | Personal | Log into registrar dashboard | **CRITICAL** |
| Cloudflare | Personal | Log into cloudflare.com | **CRITICAL** |
| Neon Database | Personal | Log into console.neon.tech | **CRITICAL** |
| Upstash Redis | Personal | Log into console.upstash.com | High |
| Resend Email | Personal | Log into resend.com | Medium |
| UptimeRobot | Personal | Log into uptimerobot.com | Low |

### Verification Steps

1. **Domain Registrar (learntotarkov.com)**
   - Log into domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Verify account email is `tuckerandrew21@gmail.com`
   - Document registrar name for future reference
   - Check domain expiration date

2. **Cloudflare**
   - Log into cloudflare.com
   - Verify `learntotarkov.com` is in your account
   - Confirm account email is personal
   - Document: Are nameservers already pointing to Cloudflare?

3. **Neon Database**
   - Log into console.neon.tech
   - Verify production database is in your account
   - Check connection string matches `.env` file
   - Document: Database name, region, plan tier

4. **Upstash Redis**
   - Log into console.upstash.com
   - Verify `deciding-doberman-56759` database exists
   - Confirm account email is personal
   - Document: Current usage stats

5. **Resend Email Service**
   - Log into resend.com
   - Check if `learntotarkov.com` domain is verified
   - Verify account email is personal
   - Document: Current plan tier, monthly email quota

6. **UptimeRobot Monitoring**
   - Log into uptimerobot.com
   - Check if monitors exist for `learntotarkov.com`
   - Verify account email is personal
   - Document: Monitor URLs, check intervals

**Deliverable:** Completed verification checklist with ownership status for each service.

---

## Phase 2: GitHub Repository Transfer

Transfer repository from work account to personal account while preserving all history and metadata.

### Prerequisites

- ✅ You confirmed you have a personal GitHub account
- ✅ **Personal GitHub username:** `tuckerandrew21`
- ✅ **Admin access confirmed:** You have access to Danger Zone in repository settings

### Transfer Steps

#### Step 1: Prepare Personal GitHub Account

1. **Personal GitHub Account Details**
   - Username: `tuckerandrew21`
   - Email: `tuckerandrew21@gmail.com`
   - 2FA enabled: Recommended to enable before transfer

2. **Create Personal Access Token (PAT)**
   - Go to: Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Name: "EFT-Tracker Admin"
   - Expiration: 1 year
   - Permissions:
     - Repository: Read and write (Administration, Contents, Issues, Pull requests)
     - Webhooks: Read and write
   - Save token securely in `~/.claude/.env` as `GITHUB_PERSONAL_TOKEN`

#### Step 2: Transfer Repository (via GitHub UI)

**Recommended Method:** Use GitHub's built-in transfer feature

1. **Initiate Transfer (from work account)**
   - Log into `andrew-tucker-razorvision` account
   - Navigate to: `https://github.com/andrew-tucker-razorvision/EFT-Tracker`
   - Go to: Settings → General → Danger Zone → Transfer ownership
   - Enter new owner: `tuckerandrew21`
   - Confirm transfer

2. **Accept Transfer (from personal account)**
   - Check email at `tuckerandrew21@gmail.com`
   - Click confirmation link
   - Accept repository transfer

3. **Verify Transfer Success**
   - Repository URL changes to: `https://github.com/tuckerandrew21/EFT-Tracker`
   - GitHub automatically creates redirect from old URL
   - All issues, PRs, stars, watchers preserved
   - All branches and tags intact

**What Transfers:**
- ✅ All commit history
- ✅ All branches (master, feature branches)
- ✅ All issues and PRs
- ✅ Stars and watchers
- ✅ GitHub Actions workflows
- ✅ Branch protection rules
- ⚠️ GitHub Secrets (will need to be recreated)

**What Needs Manual Migration:**
- ❌ GitHub Secrets (see Step 3)
- ❌ Webhook configurations (see Step 4)

#### Step 3: Migrate GitHub Secrets

After transfer, recreate secrets in the new repository:

1. **Navigate to Secrets**
   - Go to: Settings → Secrets and variables → Actions

2. **Recreate Required Secrets**
   - `TAURI_PRIVATE_KEY` - Copy from old repo or regenerate
   - `TAURI_KEY_PASSWORD` - Copy from old repo
   - Note: `GITHUB_TOKEN` is auto-generated, no action needed

3. **Verify Secrets**
   - Run a test workflow to ensure secrets work
   - Check CI/CD pipeline status

#### Step 4: Update Webhook Configuration

The Coolify webhook needs to point to the new repository URL.

1. **Update GitHub Webhook**
   - Go to: Settings → Webhooks
   - Find webhook pointing to Coolify: `http://95.217.155.28:8000/webhooks/source/github/events/manual`
   - Verify webhook still works (GitHub should auto-update)
   - Test webhook: Recent Deliveries → Redeliver

2. **Update Coolify Configuration**
   - Log into Coolify: `http://95.217.155.28:8000`
   - Navigate to: EFT-Tracker application → Source
   - Update repository URL: `https://github.com/tuckerandrew21/EFT-Tracker.git`
   - Verify webhook secret matches
   - Save configuration

3. **Test Deployment**
   - Make a small commit to test branch
   - Verify webhook triggers Coolify deployment
   - Check deployment logs for errors

#### Step 5: Regenerate GitHub Personal Access Token

The current token in `~/.claude/.env` was generated from the work account and will eventually stop working.

1. **Generate New Token from Personal Account**
   - Log into personal GitHub account (`tuckerandrew21`)
   - Go to: Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click: Generate new token (classic)
   - Name: "EFT-Tracker Personal"
   - Expiration: 1 year
   - Scopes:
     - ✓ repo (Full control of private repositories)
     - ✓ workflow (Update GitHub Actions workflows)
     - ✓ admin:repo_hook (Full control of repository hooks)
   - Generate token and copy immediately

2. **Update Stored Credentials**
   - Open `C:\Users\tucke\.claude\.env`
   - Replace `GITHUB_TOKEN` value with new token
   - Save file securely

3. **Update GitHub CLI Authentication**
   ```bash
   # Logout of work account
   gh auth logout

   # Login with personal account
   gh auth login
   # Choose: GitHub.com
   # Choose: HTTPS
   # Paste the new personal access token when prompted

   # Verify
   gh auth status
   # Should show: Logged in to github.com as tuckerandrew21
   ```

#### Step 6: Update Local Git Configuration

Update local git configuration to use personal account for commits.

1. **Update Git Remote**
   ```bash
   cd c:\Users\tucke\Repositories\EFT-Tracker
   git remote set-url origin https://github.com/tuckerandrew21/EFT-Tracker.git
   git remote -v  # Verify change
   ```

2. **Update Git User Configuration**
   ```bash
   # Set personal email for this repository
   git config user.name "Andrew Tucker"
   git config user.email "tuckerandrew21@gmail.com"

   # Verify
   git config --list | grep user
   ```

3. **Test Git Operations**
   ```bash
   # Create test branch
   git checkout -b test/verify-personal-account

   # Make test commit
   echo "# Test" >> TEST.md
   git add TEST.md
   git commit -m "test: Verify personal account ownership"

   # Push to new remote
   git push -u origin test/verify-personal-account

   # Verify on GitHub - commit should show personal account
   # Delete test branch
   git checkout master
   git branch -D test/verify-personal-account
   git push origin --delete test/verify-personal-account
   ```

4. **Update Global Git Config (Optional)**

   If you want personal email as default for all repos:
   ```bash
   git config --global user.email "tuckerandrew21@gmail.com"
   git config --global user.name "Andrew Tucker"
   ```

---

## Phase 3: Documentation Updates

Update all documentation references from work account to personal account.

### Files to Update

1. **`.github/CODEOWNERS`**
   - Change: `@andrew-tucker-razorvision` → `@tuckerandrew21`

2. **`CLAUDE.md`** (if contains account references)
   - Search for: `andrew.tucker@razorvision.net`
   - Replace with: `tuckerandrew21@gmail.com`
   - Search for: `andrew-tucker-razorvision`
   - Replace with: `tuckerandrew21`

3. **`README.md`** (if contains contributor badges)
   - Update GitHub profile links
   - Update repository URLs

4. **`.github/workflows/*.yml`** (CI/CD configs)
   - Verify no hardcoded work account references
   - Update repository URLs if hardcoded

5. **`docs/` directory**
   - Search all docs for work email/username
   - Replace with personal account details

### Commit Pattern

```bash
git checkout -b chore/update-account-references
# Make all documentation changes
git add .
git commit -m "chore: Update account references to personal account"
git push -u origin chore/update-account-references
# Create PR and merge
```

---

## Phase 4: Access Cleanup

Remove work account access and verify personal account has full control.

### GitHub Access

1. **Verify Personal Account Permissions**
   - Role: Owner
   - Can create/delete branches: ✓
   - Can modify settings: ✓
   - Can manage webhooks: ✓
   - Can manage secrets: ✓

2. **Remove Work Account Collaborator Access**
   - Go to: Settings → Collaborators
   - Remove `andrew-tucker-razorvision` if listed
   - Note: If work account is the owner, this happens automatically after transfer

3. **Verify Branch Protection Rules**
   - Go to: Settings → Branches
   - Check `master` branch protection
   - Ensure personal account isn't blocked by restrictions

### Local Credential Updates

1. **Update GitHub CLI**
   ```bash
   # Logout of work account
   gh auth logout

   # Login with personal account
   gh auth login
   # Choose: GitHub.com
   # Choose: HTTPS
   # Authenticate via browser with personal account
   ```

2. **Update Git Credential Manager**
   ```powershell
   # Clear stored credentials
   git credential-manager-core erase
   # Next git push will prompt for new credentials
   ```

3. **Update `~/.claude/.env`**
   - Replace `GITHUB_TOKEN` with personal account token
   - Verify other credentials don't reference work account

### Service Access Verification

For each service verified in Phase 1, confirm:

1. **Personal account is the only admin**
2. **Work account does not have access**
3. **API tokens are generated from personal account**

---

## Phase 5: Testing & Verification

Comprehensive testing to ensure migration is complete and successful.

### GitHub Functionality

- [ ] Repository accessible at new URL
- [ ] Old URL redirects to new URL
- [ ] Can push commits from local machine
- [ ] CI/CD workflows run successfully
- [ ] Issues and PRs are accessible
- [ ] Branch protection rules work
- [ ] Webhooks trigger correctly

### Deployment Pipeline

- [ ] Coolify receives webhook from GitHub
- [ ] Deployment builds successfully
- [ ] Production site updates at `https://learntotarkov.com`
- [ ] No errors in Coolify logs
- [ ] Health check passes post-deployment

### Infrastructure Access

- [ ] Can access Coolify dashboard
- [ ] Can access Neon database console
- [ ] Can access Cloudflare dashboard
- [ ] Can access Upstash console
- [ ] Can access domain registrar
- [ ] Can access all other services

### Local Development

- [ ] `git clone` works with new URL
- [ ] `git push` works with personal credentials
- [ ] Commits show personal account author
- [ ] `gh` CLI uses personal account
- [ ] `.env.local` has correct credentials

---

## Critical Files Reference

| File Path | Purpose | Change Required |
|-----------|---------|-----------------|
| `.git/config` | Git remote URL | Update origin URL |
| `.github/CODEOWNERS` | Code review assignments | Update username |
| `~/.claude/.env` | Credentials storage | Update GITHUB_TOKEN |
| `.env` (local) | Local dev env vars | Verify no work refs |
| `CLAUDE.md` | Project docs | Update account refs |

---

## Rollback Plan

If migration fails or issues arise:

1. **GitHub Transfer Reversal**
   - Work account can re-transfer repository back
   - All history preserved during reversal
   - Downtime: ~15 minutes

2. **Git Remote Reversion**
   ```bash
   git remote set-url origin https://github.com/andrew-tucker-razorvision/EFT-Tracker.git
   ```

3. **Coolify Configuration Reversion**
   - Update repository URL back to work account
   - Re-verify webhook configuration

4. **Credential Reversion**
   - Restore work account credentials from backup

---

## Post-Migration Checklist

After completing all phases:

- [ ] All services verified as personal account ownership
- [ ] GitHub repository transferred successfully
- [ ] Local git configuration updated
- [ ] Documentation updated
- [ ] Work account access removed
- [ ] All tests passing
- [ ] Deployment pipeline working
- [ ] Credentials backed up securely
- [ ] Migration documented in project history

---

## Security Recommendations

Post-migration security improvements:

1. **Enable 2FA on All Services**
   - GitHub (personal account)
   - Cloudflare
   - Neon
   - Upstash
   - Domain registrar

2. **Rotate Sensitive Credentials**
   - GitHub Personal Access Tokens
   - Coolify API token
   - Database passwords
   - Upstash Redis token
   - Resend API key

3. **Backup Critical Information**
   - Store all credentials in password manager
   - Document recovery email addresses
   - Save 2FA backup codes securely

4. **Set Up Account Recovery**
   - Add recovery email to each service
   - Add recovery phone number where available
   - Document account security questions

---

## Timeline Estimate

| Phase | Duration | Can Start After | Downtime |
|-------|----------|----------------|----------|
| Phase 1: Verification | 30 min | Immediately | None |
| Phase 2: GitHub Transfer | 45 min | Phase 1 | None |
| Phase 3: Documentation | 30 min | Phase 2 | None |
| Phase 4: Access Cleanup | 20 min | Phase 3 | None |
| Phase 5: Testing | 30 min | Phase 4 | None |
| **Total** | **~2.5 hours** | - | **None** |

**Note:** Actual downtime may be 0 minutes if webhook and deployment continue working during transfer.

---

## Migration Summary

**Confirmed Details:**
- ✅ Personal GitHub username: `tuckerandrew21`
- ✅ Scope: Only EFT-Tracker repository needs migration
- ✅ Access policy: Complete separation - remove work account entirely after transfer
- ✅ Downtime tolerance: 1-2 hours acceptable (likely zero actual downtime)

**Service Ownership Confirmed:**
- ✅ Coolify: `tuckerandrew21@gmail.com`
- ✅ Neon Database: Personal account
- ✅ Resend: Personal account
- ✅ Upstash Redis: Personal account
- ✅ Cloudflare: Personal account (also domain registrar)
- ✅ Hetzner VPS: Personal account
- ✅ GitHub admin access: Confirmed (can see Danger Zone)

**Required Migration Tasks:**
1. ⚠️ **GitHub Personal Access Token**: Current token in `~/.claude/.env` is from work account
   - Must regenerate from personal account (`tuckerandrew21`) after repository transfer
   - Update `GITHUB_TOKEN` in `~/.claude/.env`
   - Update GitHub CLI authentication: `gh auth login`

**Optional Pre-Migration Tasks:**
1. Enable 2FA on personal GitHub account (recommended for security)

---

## GitHub Issues Tracking

This migration will be tracked via GitHub Epic and individual issues:

- **Epic**: Account Migration - Work to Personal Ownership
- **Issues**:
  1. Transfer GitHub repository ownership
  2. Regenerate GitHub personal access token
  3. Update local git configuration
  4. Update documentation references
  5. Clean up work account access
  6. Comprehensive migration testing

See `.github/ISSUE_TEMPLATE/` for issue templates.

---

## Ready to Execute

**✅ All pre-migration questions answered!**

You have complete control of your infrastructure:
- **GitHub**: Admin access confirmed, can transfer immediately
- **Infrastructure**: All services (Coolify, Neon, Upstash, Resend, Cloudflare, Hetzner) on personal account
- **Domain**: Registered with Cloudflare on personal account
- **Risk Level**: **VERY LOW** - You own everything except the GitHub repository

**Estimated Migration Time:**
- Repository transfer: ~10 minutes
- Token regeneration: ~10 minutes
- Local configuration: ~15 minutes
- Documentation updates: ~20 minutes
- Testing: ~15 minutes
- **Total: ~70 minutes with zero downtime**
