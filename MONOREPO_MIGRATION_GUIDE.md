# EFT-Tracker Monorepo Migration - Execution Guide

**Status:** Ready to Execute
**Estimated Time:** 8-12 days (realistic)
**Risk Level:** High (Phase 3 is critically high)
**Prerequisites:** Git Bash, 2-3 weeks buffer time

---

## ⚠️ PHASE 0: SECURITY FIX (DO THIS FIRST!)

**Duration:** 10 minutes
**Risk:** None
**Status:** ⬜ Not Started

### Step 0.1: Remove .env from Git

```bash
# Verify you're on the feature branch
git branch

# Remove .env from git
git rm .env
git commit -m "security: Remove committed .env with live credentials"
```

**Checklist:**

- [ ] Confirmed on feature branch: `feature/tauri-v2-auto-updater`
- [ ] Ran `git rm .env`
- [ ] Committed with security message
- [ ] File no longer tracked by git

---

### Step 0.2: Update .gitignore

```bash
# Check if .env is already in .gitignore
grep "^\.env$" .gitignore

# If not found, add it
echo ".env" >> .gitignore

# Commit
git add .gitignore
git commit -m "chore: Ensure .env is gitignored"
```

**Checklist:**

- [ ] `.env` entry exists in .gitignore
- [ ] Committed .gitignore changes

---

### Step 0.3: Push Immediately

```bash
git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] Pushed to remote
- [ ] Verified on GitHub that .env is removed

---

### Step 0.4: Rotate Compromised Secrets (Within 24 Hours)

**Sentry Auth Token (CRITICAL):**

1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Find token ending in `...83ea`
3. Click "Revoke"
4. Create new token with same permissions
5. Update in Coolify environment variables

**Neon Database Password (Less Critical):**

1. Go to Neon dashboard
2. Reset database password
3. Update `DATABASE_URL` in Coolify
4. Test connection

**Checklist:**

- [ ] Sentry token rotated
- [ ] New token updated in Coolify
- [ ] Database password rotated (optional but recommended)
- [ ] Verified app still works in production

---

## 📋 PRE-MIGRATION CHECKLIST

**Before starting Phase 1, verify:**

- [ ] Git Bash is working (`mv --version`, `rm --version`, `grep --version`)
- [ ] On feature branch: `feature/tauri-v2-auto-updater`
- [ ] No uncommitted changes: `git status`
- [ ] All tests pass: `npm test`
- [ ] App runs: `npm run dev`
- [ ] Created rollback tag: `git tag pre-monorepo-$(date +%Y%m%d)`
- [ ] Have 2-3 weeks buffer time (no hard deadlines)

---

## 🧹 PHASE 1: CLEANUP (DEBLOAT)

**Duration:** 1 day
**Risk:** MEDIUM (due to .env audit)
**Status:** ⬜ Not Started

### Step 1.1: Delete Docker Files

```bash
# Delete Docker infrastructure
rm Dockerfile
rm Dockerfile.dev
rm docker-compose.yml
rm .dockerignore
rm -rf .devcontainer/

# Verify deleted
git status
```

**Checklist:**

- [ ] All Docker files deleted
- [ ] `.devcontainer/` directory removed
- [ ] Files staged for commit

---

### Step 1.2: Delete Playwright Files

```bash
# Delete Playwright config
rm playwright.config.ts

# Delete E2E test directories
rm -rf __tests__/e2e/
rm -rf __tests__/smoke/

# Delete Playwright artifacts
rm -rf test-results/
rm -rf playwright-report/

# Verify deleted
git status
```

**Checklist:**

- [ ] `playwright.config.ts` deleted
- [ ] `__tests__/e2e/` deleted
- [ ] `__tests__/smoke/` deleted
- [ ] `test-results/` deleted
- [ ] `playwright-report/` deleted

---

### Step 1.3: Delete Root Clutter

```bash
# Delete executables
rm k6.exe

# Delete sensitive files
rm SENTRY_CREDENTIALS.txt

# Delete temporary docs (will move to docs/companion-app/)
rm AUTO_UPDATER_TEST_REPORT.md
rm TAURI_V2_REFERENCE.md
rm TAURI_RELEASE_CHECKLIST.md

# Verify deleted
git status
```

**Checklist:**

- [ ] `k6.exe` deleted (65MB freed!)
- [ ] `SENTRY_CREDENTIALS.txt` deleted
- [ ] Temporary doc files deleted

---

### Step 1.4: Move Docs to Proper Location

```bash
# Create docs/companion-app directory if it doesn't exist
mkdir -p docs/companion-app

# Move Tauri docs (that we just deleted - they should be moved, not deleted)
# CORRECTION: Don't delete these in Step 1.3, move them here instead!
mv TAURI_V2_REFERENCE.md docs/companion-app/v2-reference.md
mv TAURI_RELEASE_CHECKLIST.md docs/companion-app/release-checklist.md
mv AUTO_UPDATER_TEST_REPORT.md docs/companion-app/updater-testing.md

# Verify moved
ls docs/companion-app/
```

**Checklist:**

- [ ] `docs/companion-app/` directory created
- [ ] Docs moved with new names
- [ ] Files exist in new location

**NOTE:** Skip Step 1.3 deletions for these 3 files, do this step instead!

---

### Step 1.5: Update .gitignore

```bash
# Add new ignore patterns
cat >> .gitignore << 'EOF'

# Build artifacts
k6.exe
*.exe

# Credentials
*CREDENTIALS*.txt
*secrets*.txt

# Test artifacts
test-results/
playwright-report/

# Local config
.coolify-url
EOF

# Verify added
tail -15 .gitignore
```

**Checklist:**

- [ ] New patterns added to .gitignore
- [ ] File looks correct

---

### Step 1.6: Consolidate Test Directories

```bash
# Move test/ contents to __tests__/
mv test/fixtures/ __tests__/fixtures/
mv test/mocks/ __tests__/mocks/
mv test/setup-tests.ts __tests__/setup/setup-tests.ts

# Create setup directory if needed
mkdir -p __tests__/setup

# Delete empty test/ directory
rmdir test/

# Verify structure
ls -la __tests__/
```

**Checklist:**

- [ ] `__tests__/fixtures/` exists with files
- [ ] `__tests__/mocks/` exists with files
- [ ] `__tests__/setup/setup-tests.ts` exists
- [ ] `test/` directory removed

---

### Step 1.7: Update Test Imports

**Files to update:**

- All test files in `__tests__/integration/`
- All test files in `__tests__/unit/`
- `vitest.config.ts`

**Find files that need updating:**

```bash
grep -r "from '@/test/" __tests__/ || echo "No imports found"
grep -r "from '../test/" __tests__/ || echo "No imports found"
```

**Update pattern:**

- `from '@/test/fixtures/quests'` → `from '@/__tests__/fixtures/quests'`
- `from '../test/mocks/handlers'` → `from '@/__tests__/mocks/handlers'`

**Checklist:**

- [ ] Searched for old test imports
- [ ] Updated all imports in test files
- [ ] Updated vitest.config.ts if needed

---

### Step 1.8: Update package.json

```bash
# Open in editor
code package.json  # or nano, vim, etc.
```

**Remove these scripts:**

```json
"test:e2e": "playwright test",
```

**Remove these devDependencies:**

```json
"@playwright/test": "^1.57.0"
```

**Move to devDependencies (if in dependencies):**

```json
"pino-pretty": "^13.1.3"
```

**Checklist:**

- [ ] Removed `test:e2e` script
- [ ] Removed `@playwright/test` from devDependencies
- [ ] Moved `pino-pretty` to devDependencies (if needed)
- [ ] Saved file

---

### Step 1.9: Uninstall Unused Dependencies

```bash
# Uninstall Playwright
npm uninstall @playwright/test

# Check if tw-animate-css is used
grep -r "tw-animate-css" src/ || echo "Not found - safe to remove"
# If not found:
npm uninstall tw-animate-css

# Check if next-themes is used
grep -r "next-themes" src/ || echo "Not found - safe to remove"
# If not found:
npm uninstall next-themes

# Verify package.json updated
git diff package.json
```

**Checklist:**

- [ ] `@playwright/test` uninstalled
- [ ] `tw-animate-css` uninstalled (if unused)
- [ ] `next-themes` uninstalled (if unused)
- [ ] `package-lock.json` updated

---

### Step 1.10: Update GitHub Workflows

```bash
# Open ci.yml
code .github/workflows/ci.yml
```

**Remove E2E test job** (if it exists)

**Checklist:**

- [ ] Removed E2E test job from ci.yml
- [ ] Workflow file saved

---

### Step 1.11: Test Phase 1 Changes

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Run type check
npm run typecheck

# Build app
npm run build

# Start dev server
npm run dev
# Visit http://localhost:3000 - verify it works
```

**Checklist:**

- [ ] `npm install` succeeded
- [ ] `npm test` passed (all unit + integration tests)
- [ ] `npm run lint` passed
- [ ] `npm run typecheck` passed
- [ ] `npm run build` succeeded
- [ ] `npm run dev` started successfully
- [ ] App loads in browser with no errors

---

### Step 1.12: Commit Phase 1

```bash
# Stage all changes
git add -A

# Commit
git commit -m "chore: Remove Docker and Playwright, consolidate project structure

- Remove Docker infrastructure (Dockerfile, docker-compose, .devcontainer)
- Remove Playwright E2E tests (replaced by Vitest integration tests)
- Delete root clutter (k6.exe, credentials, temp docs)
- Move Tauri docs to docs/companion-app/
- Consolidate test/ directory into __tests__/
- Update .gitignore for build artifacts and credentials
- Uninstall unused dependencies (@playwright/test, etc.)

Disk space saved: ~50-60MB
Files removed: ~25+
Dependencies removed: 3-5 packages"

# Push
git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] All changes committed
- [ ] Pushed to remote
- [ ] Verified on GitHub

---

### Phase 1 Complete! 🎉

**Expected outcomes:**

- ✅ Disk space saved: ~50-60MB
- ✅ Files removed: ~25
- ✅ Dependencies removed: 3-5
- ✅ Tests still passing
- ✅ App still working

---

## 🗑️ PHASE 2: TAURI CONSOLIDATION

**Duration:** Half day
**Risk:** LOW
**Status:** ⬜ Not Started

### Step 2.1: Delete src-tauri/ Directory

```bash
# Delete entire Tauri v1 implementation
rm -rf src-tauri/

# Verify deleted
git status
```

**Checklist:**

- [ ] `src-tauri/` directory deleted
- [ ] Staged for commit

---

### Step 2.2: Delete Related Configuration Files

```bash
# Delete Tauri-specific configs
rm next.config.tauri.ts
rm .env.tauri

# Verify deleted
git status
```

**Checklist:**

- [ ] `next.config.tauri.ts` deleted
- [ ] `.env.tauri` deleted

---

### Step 2.3: Update package.json

```bash
# Open in editor
code package.json
```

**Remove these scripts:**

```json
"tauri": "tauri",
"tauri:dev": "tauri dev",
"tauri:build": "tauri build",
"build:tauri": "cross-env TAURI_BUILD=true NEXT_PUBLIC_API_URL=https://learntotarkov.com next build"
```

**Remove from devDependencies:**

```json
"@tauri-apps/cli": "^1.6.3"
```

**Keep in dependencies** (used by companion app):

```json
"@tauri-apps/api": "^2.9.1"
```

**Checklist:**

- [ ] Removed Tauri scripts
- [ ] Removed `@tauri-apps/cli` v1
- [ ] Kept `@tauri-apps/api` v2
- [ ] Saved file

---

### Step 2.4: Uninstall Tauri v1 CLI

```bash
npm uninstall @tauri-apps/cli

# Verify package.json
git diff package.json
```

**Checklist:**

- [ ] Tauri v1 CLI uninstalled
- [ ] package-lock.json updated

---

### Step 2.5: Update next.config.ts

```bash
# Open next.config.ts
code next.config.ts
```

**Remove any Tauri-specific output configuration:**

- Remove conditional logic for `process.env.TAURI`
- Keep `output: "standalone"` (needed for Coolify)

**Checklist:**

- [ ] Removed Tauri-specific config
- [ ] Kept standalone output
- [ ] Saved file

---

### Step 2.6: Update Documentation

```bash
# Open README.md
code README.md
```

**Update architecture description:**

- Remove desktop app installation instructions
- Clarify: Web app (browser-only) + Companion app (desktop overlay)
- Update architecture diagram if present

**Checklist:**

- [ ] README.md updated
- [ ] No references to desktop wrapper
- [ ] Companion app clearly explained

---

### Step 2.7: Test Phase 2 Changes

```bash
# Install dependencies
npm install

# Verify no Tauri v1 references
grep -r "src-tauri" . --exclude-dir=node_modules || echo "None found - good!"

# Run tests
npm test

# Build app
npm run build

# Start dev server
npm run dev
```

**Checklist:**

- [ ] `npm install` succeeded
- [ ] No broken imports referencing `src-tauri/`
- [ ] `npm run dev` works (no Tauri build attempts)
- [ ] Tests pass
- [ ] Build succeeds

---

### Step 2.8: Verify Companion App Still Works

```bash
# Navigate to companion app
cd companion-app

# Install dependencies
npm install

# Build Tauri app (test build)
npm run tauri:build

# Back to root
cd ..
```

**Checklist:**

- [ ] Companion app dependencies installed
- [ ] Companion app builds successfully
- [ ] No errors referencing removed files

---

### Step 2.9: Commit Phase 2

```bash
# Stage all changes
git add -A

# Commit
git commit -m "chore: Remove unused Tauri v1 implementation

- Delete src-tauri/ directory (61 lines of Rust, unused)
- Remove next.config.tauri.ts (duplicate config)
- Remove .env.tauri (Tauri-specific env)
- Remove Tauri v1 scripts from package.json
- Uninstall @tauri-apps/cli v1 (keep v2 API for companion)
- Update documentation to clarify architecture

Disk space saved: ~1GB (Tauri v1 build artifacts)
Clarity gained: Single Tauri implementation (companion app only)"

# Push
git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] All changes committed
- [ ] Pushed to remote
- [ ] Verified on GitHub

---

### Phase 2 Complete! 🎉

**Expected outcomes:**

- ✅ Disk space saved: ~1GB
- ✅ Tauri v1 removed entirely
- ✅ Companion app (Tauri v2) still works
- ✅ Confusion eliminated

---

## 🏗️ PHASE 3: MONOREPO STRUCTURE MIGRATION

**Duration:** 3-4 days
**Risk:** CRITICALLY HIGH
**Status:** ⬜ Not Started

⚠️ **WARNING: This is the point of no return! Create rollback tag:**

```bash
git tag pre-monorepo-$(date +%Y%m%d)
git push origin pre-monorepo-$(date +%Y%m%d)
```

**Checklist:**

- [ ] Rollback tag created
- [ ] Tag pushed to remote

---

### PHASE 3A: Foundation (1 day)

### Step 3A.1: Install pnpm

```bash
# Install pnpm globally
npm install -g pnpm@latest

# Verify installation
pnpm --version  # Should be 9.x or higher
```

**Checklist:**

- [ ] pnpm installed globally
- [ ] Version 9.x or higher

---

### Step 3A.2: Create Workspace Configuration

```bash
# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Verify created
cat pnpm-workspace.yaml
```

**Checklist:**

- [ ] `pnpm-workspace.yaml` created
- [ ] Contains correct package patterns

---

### Step 3A.3: Import npm Lock File

```bash
# Convert package-lock.json to pnpm-lock.yaml
pnpm import

# Verify created
ls -la pnpm-lock.yaml
```

**Checklist:**

- [ ] `pnpm-lock.yaml` generated
- [ ] File size > 100KB (should be large)

---

### Step 3A.4: Test pnpm Installation

```bash
# Install dependencies with pnpm
pnpm install

# Verify app still works
pnpm run dev
# Visit http://localhost:3000
```

**Checklist:**

- [ ] `pnpm install` succeeded
- [ ] `node_modules/` populated
- [ ] App runs with `pnpm run dev`
- [ ] No errors in browser

---

### Step 3A.5: Create Directory Structure

```bash
# Create apps directories
mkdir -p apps/web
mkdir -p apps/companion

# Create packages directories
mkdir -p packages/types/src
mkdir -p packages/utils/src
mkdir -p packages/tsconfig

# Verify structure
tree -L 2 apps packages  # or use ls -R
```

**Checklist:**

- [ ] `apps/web/` created
- [ ] `apps/companion/` created
- [ ] `packages/types/src/` created
- [ ] `packages/utils/src/` created
- [ ] `packages/tsconfig/` created

---

### Step 3A.6: Commit Phase 3A

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml apps/ packages/
git commit -m "chore: Initialize pnpm workspace and create monorepo structure

- Install pnpm and convert package-lock.json
- Create pnpm-workspace.yaml
- Create apps/ and packages/ directory structure
- Verify pnpm install works"

git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] Foundation committed
- [ ] Pushed to remote

---

### PHASE 3B: Move Apps (1 day)

⚠️ **CRITICAL:** After this step, imports will be broken until Phase 3D is complete!

### Step 3B.1: Move Web App Source

```bash
# Move src/ to apps/web/src/ (single operation - app is already inside src!)
mv src apps/web/src

# Verify moved
ls apps/web/src/
```

**Checklist:**

- [ ] `apps/web/src/` exists with all files
- [ ] `src/` directory gone from root

---

### Step 3B.2: Move Web App Public Assets

```bash
# Move public/
mv public apps/web/public

# Verify moved
ls apps/web/public/
```

**Checklist:**

- [ ] `apps/web/public/` exists
- [ ] `public/` gone from root

---

### Step 3B.3: Move Web App Configs

```bash
# Move Next.js config
mv next.config.ts apps/web/

# Move PostCSS config (NOT tailwind.config.ts - doesn't exist!)
mv postcss.config.mjs apps/web/

# Move TypeScript config
mv tsconfig.json apps/web/

# Move ESLint config
mv eslint.config.mjs apps/web/

# Move shadcn/ui config
mv components.json apps/web/

# Verify moved
ls apps/web/*.{ts,mjs,json}
```

**Checklist:**

- [ ] `apps/web/next.config.ts` exists
- [ ] `apps/web/postcss.config.mjs` exists
- [ ] `apps/web/tsconfig.json` exists
- [ ] `apps/web/eslint.config.mjs` exists
- [ ] `apps/web/components.json` exists
- [ ] Config files gone from root

---

### Step 3B.4: Move Prisma

```bash
# Move Prisma directory
mv prisma apps/web/prisma

# Move prisma.config.ts (if it exists and is used)
mv prisma.config.ts apps/web/ 2>/dev/null || echo "File doesn't exist"

# Verify moved
ls apps/web/prisma/
```

**Checklist:**

- [ ] `apps/web/prisma/` exists
- [ ] `prisma.config.ts` moved (if existed)
- [ ] `prisma/` gone from root

---

### Step 3B.5: Move Sentry Configs

```bash
# Move Sentry configuration files
mv sentry.client.config.ts apps/web/
mv sentry.edge.config.ts apps/web/
mv sentry.server.config.ts apps/web/

# Verify moved
ls apps/web/sentry*.ts
```

**Checklist:**

- [ ] All 3 Sentry config files moved
- [ ] Files gone from root

---

### Step 3B.6: Move instrumentation.ts

```bash
# Move Next.js instrumentation file
mv instrumentation.ts apps/web/ 2>/dev/null || echo "File doesn't exist"

# Verify
ls apps/web/instrumentation.ts 2>/dev/null || echo "Didn't exist"
```

**Checklist:**

- [ ] `instrumentation.ts` moved (if existed)

---

### Step 3B.7: Copy Environment Template

```bash
# Copy .env.template to web app
cp .env.template apps/web/.env.template

# Verify copied (original stays at root too)
ls apps/web/.env.template
ls .env.template
```

**Checklist:**

- [ ] `apps/web/.env.template` exists
- [ ] Root `.env.template` still exists

---

### Step 3B.8: Move Companion App

```bash
# Move entire companion-app to apps/companion
mv companion-app apps/companion

# Verify moved
ls apps/companion/
```

**Checklist:**

- [ ] `apps/companion/` exists with all files
- [ ] `companion-app/` gone from root

---

### Step 3B.9: Move Updater Utilities (IMPORTANT!)

```bash
# Create lib directory in companion
mkdir -p apps/companion/src/lib

# Move updater from web to companion
mv apps/web/src/lib/updater apps/companion/src/lib/

# Verify moved
ls apps/companion/src/lib/updater/
```

**Checklist:**

- [ ] `apps/companion/src/lib/updater/` exists
- [ ] Updater gone from web app

---

### Step 3B.10: Create Web App package.json

```bash
# Create apps/web/package.json
cat > apps/web/package.json << 'EOF'
{
  "name": "@eft-tracker/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@auth/prisma-adapter": "^2.11.1",
    "@marsidev/react-turnstile": "^1.4.0",
    "@prisma/adapter-pg": "^7.0.0",
    "@prisma/client": "^7.0.0",
    "@prisma/extension-accelerate": "2.0.2",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@sentry/nextjs": "^10.30.0",
    "@upstash/ratelimit": "^2.0.7",
    "@upstash/redis": "^1.35.8",
    "@xyflow/react": "^12.9.3",
    "bcryptjs": "^3.0.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "dagre": "^0.8.5",
    "lucide-react": "^0.554.0",
    "next": "16.0.10",
    "next-auth": "^5.0.0-beta.30",
    "pg": "^8.16.3",
    "pino": "^10.1.0",
    "prisma": "^7.0.0",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.4.0",
    "zod": "^4.1.13",
    "@eft-tracker/types": "workspace:*",
    "@eft-tracker/utils": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "eslint": "^9.17.0",
    "eslint-config-next": "^16.0.4",
    "typescript": "^5.8.3",
    "pino-pretty": "^13.1.3"
  }
}
EOF

# Verify created
cat apps/web/package.json
```

**Checklist:**

- [ ] `apps/web/package.json` created
- [ ] Contains workspace dependencies

---

### Step 3B.11: Update Companion App package.json

```bash
# Open companion package.json
code apps/companion/package.json
```

**Update name and add workspace dependencies:**

```json
{
  "name": "@eft-tracker/companion",
  "version": "0.1.5",
  "private": true,
  // ... keep existing fields ...
  "dependencies": {
    // ... keep existing dependencies ...
    "@eft-tracker/types": "workspace:*",
    "@eft-tracker/utils": "workspace:*"
  }
}
```

**Checklist:**

- [ ] Name changed to `@eft-tracker/companion`
- [ ] Workspace dependencies added
- [ ] File saved

---

### Step 3B.12: Commit Phase 3B

```bash
git add -A
git commit -m "refactor: Move apps to monorepo structure

- Move src/ to apps/web/src/
- Move all web configs to apps/web/
- Move Prisma to apps/web/prisma/
- Move Sentry configs to apps/web/
- Move companion-app to apps/companion/
- Move updater utilities to companion app
- Create workspace package.json files

⚠️ WARNING: Imports are broken until Phase 3D!"

git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] Phase 3B committed
- [ ] Pushed to remote

---

### PHASE 3C: Create Shared Packages (Half day)

### Step 3C.1: Create Types Package

```bash
# Create package.json
cat > packages/types/package.json << 'EOF'
{
  "name": "@eft-tracker/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./quest": "./src/quest.ts",
    "./api": "./src/api.ts"
  }
}
EOF

# Verify
cat packages/types/package.json
```

**Checklist:**

- [ ] `packages/types/package.json` created

---

### Step 3C.2: Extract Quest Types

**Read the source files first:**

```bash
# Check what's in the types directory
ls apps/web/src/types/
cat apps/web/src/types/index.ts
cat apps/web/src/types/api-contracts.ts
```

**Then extract based on what you find.**

**For now, create placeholder:**

```bash
cat > packages/types/src/index.ts << 'EOF'
// Shared types will be extracted here
export * from './quest';
export * from './api';
EOF

cat > packages/types/src/quest.ts << 'EOF'
// Quest-related types extracted from apps/web/src/types/index.ts
export interface Quest {
  // Types will be extracted from web app
}
EOF

cat > packages/types/src/api.ts << 'EOF'
// API contract types extracted from apps/web/src/types/api-contracts.ts
export const QuestResponseSchema = {};
EOF
```

**Checklist:**

- [ ] `packages/types/src/index.ts` created
- [ ] `packages/types/src/quest.ts` created
- [ ] `packages/types/src/api.ts` created
- [ ] Note: Actual extraction done in Phase 3D

---

### Step 3C.3: Create Types tsconfig

```bash
cat > packages/types/tsconfig.json << 'EOF'
{
  "extends": "../tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF
```

**Checklist:**

- [ ] `packages/types/tsconfig.json` created

---

### Step 3C.4: Create Utils Package

```bash
cat > packages/utils/package.json << 'EOF'
{
  "name": "@eft-tracker/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^4.1.13",
    "@eft-tracker/types": "workspace:*"
  }
}
EOF
```

**Checklist:**

- [ ] `packages/utils/package.json` created

---

### Step 3C.5: Create Utils Source Files

```bash
cat > packages/utils/src/index.ts << 'EOF'
// Shared utilities
export * from './validators';
export * from './formatters';
export * from './constants';
EOF

cat > packages/utils/src/validators.ts << 'EOF'
// Validation utilities (to be extracted)
export const questFilterSchema = {};
EOF

cat > packages/utils/src/formatters.ts << 'EOF'
// Formatting utilities
export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}
EOF

cat > packages/utils/src/constants.ts << 'EOF'
// Constants (to be extracted from web app)
export const TRADERS = [] as const;
export const QUEST_STATUSES = [] as const;
EOF
```

**Checklist:**

- [ ] `packages/utils/src/` files created

---

### Step 3C.6: Create Utils tsconfig

```bash
cat > packages/utils/tsconfig.json << 'EOF'
{
  "extends": "../tsconfig/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF
```

**Checklist:**

- [ ] `packages/utils/tsconfig.json` created

---

### Step 3C.7: Create Shared TypeScript Configs

```bash
# Base config
cat > packages/tsconfig/base.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true
  }
}
EOF

# Next.js config
cat > packages/tsconfig/nextjs.json << 'EOF'
{
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  }
}
EOF

# React config
cat > packages/tsconfig/react.json << 'EOF'
{
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "jsx": "react-jsx",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  }
}
EOF

# Package.json
cat > packages/tsconfig/package.json << 'EOF'
{
  "name": "@eft-tracker/tsconfig",
  "version": "0.0.0",
  "private": true
}
EOF
```

**Checklist:**

- [ ] All tsconfig files created
- [ ] `packages/tsconfig/package.json` created

---

### Step 3C.8: Commit Phase 3C

```bash
git add packages/
git commit -m "refactor: Create shared packages (types, utils, tsconfig)

- Create @eft-tracker/types package structure
- Create @eft-tracker/utils package structure
- Create @eft-tracker/tsconfig shared configs
- Add placeholder files (actual extraction in Phase 3D)"

git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] Phase 3C committed
- [ ] Pushed to remote

---

### PHASE 3D: Update Imports & Fix (1-2 days)

⚠️ **This is the most complex phase - take your time!**

### Step 3D.1: Update Web App tsconfig.json

```bash
code apps/web/tsconfig.json
```

**Replace with:**

```json
{
  "extends": "../../packages/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@eft-tracker/types": ["../../packages/types/src"],
      "@eft-tracker/utils": ["../../packages/utils/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Checklist:**

- [ ] Extends shared config
- [ ] Paths configured
- [ ] Saved

---

### Step 3D.2: Update Companion App tsconfig.json

```bash
code apps/companion/tsconfig.json
```

**Add workspace paths:**

```json
{
  "extends": "../../packages/tsconfig/react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@eft-tracker/types": ["../../packages/types/src"],
      "@eft-tracker/utils": ["../../packages/utils/src"]
    }
  }
}
```

**Checklist:**

- [ ] Extends shared config
- [ ] Paths configured
- [ ] Saved

---

### Step 3D.3: Update Sentry Config Imports

**Edit each Sentry config file in `apps/web/`:**

```bash
# Check current imports
grep "from './src" apps/web/sentry*.ts

# They likely say: from './src/lib/env'
# Update to: from './lib/env'
```

**For each file (`sentry.client.config.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts`):**

- Change `from './src/lib/env'` → `from './lib/env'`
- Change `from './src/X'` → `from './X'`

**Checklist:**

- [ ] Updated `sentry.client.config.ts`
- [ ] Updated `sentry.edge.config.ts`
- [ ] Updated `sentry.server.config.ts`

---

### Step 3D.4: Update instrumentation.ts Imports (if exists)

```bash
# Check if file exists and has imports
cat apps/web/instrumentation.ts 2>/dev/null | grep "from"

# Update any './src/' imports to './'
```

**Checklist:**

- [ ] Updated instrumentation.ts (if exists)

---

### Step 3D.5: Find Files That Need Import Updates

```bash
# Find all imports that reference old paths
grep -r "from '@/types/" apps/web/src/ | wc -l
grep -r "from '@/lib/utils'" apps/web/src/ | wc -l
grep -r "from '@/test/" apps/ | wc -l

# This shows how many files need updating
```

**Checklist:**

- [ ] Counted files needing updates
- [ ] Note the number for tracking

---

### Step 3D.6: Update Root Configuration Files

**Update root `package.json`:**

```bash
code package.json
```

**Replace with:**

```json
{
  "name": "eft-tracker-monorepo",
  "version": "0.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "pnpm --filter @eft-tracker/web dev",
    "dev:companion": "pnpm --filter @eft-tracker/companion tauri:dev",
    "build": "pnpm --filter @eft-tracker/web build",
    "build:companion": "pnpm --filter @eft-tracker/companion tauri:build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check",
    "clean": "pnpm -r clean && rm -rf node_modules",
    "db:push": "pnpm --filter @eft-tracker/web prisma db push",
    "db:studio": "pnpm --filter @eft-tracker/web prisma studio",
    "db:generate": "pnpm --filter @eft-tracker/web prisma generate",
    "prepare": "husky"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@vitest/ui": "^3.0.3",
    "prettier": "^3.4.2",
    "typescript": "^5.8.3",
    "vitest": "^3.0.3",
    "husky": "^9.1.7",
    "lint-staged": "^16.2.7"
  }
}
```

**Update `vitest.config.ts`:**

```bash
code vitest.config.ts
```

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["__tests__/setup/setup-tests.ts"],
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "apps", "packages"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["apps/web/src/**"],
      exclude: [
        "apps/web/src/app/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mocks/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": "/apps/web/src",
      "@eft-tracker/types": "/packages/types/src",
      "@eft-tracker/utils": "/packages/utils/src",
    },
  },
});
```

**Checklist:**

- [ ] Root `package.json` updated
- [ ] `vitest.config.ts` updated
- [ ] Files saved

---

### Step 3D.7: Install Workspace Dependencies

```bash
# Install all dependencies
pnpm install

# This will:
# - Install dependencies for all workspaces
# - Create symlinks between workspace packages
# - Generate new pnpm-lock.yaml
```

**Checklist:**

- [ ] `pnpm install` succeeded
- [ ] All workspaces have node_modules
- [ ] Workspace symlinks created

---

### Step 3D.8: Update Imports - Batch 1 (Type Imports)

**Strategy:** Update in small batches, test after each batch.

**Find all type imports:**

```bash
grep -r "from '@/types" apps/web/src/ --files-with-matches > /tmp/type-import-files.txt
cat /tmp/type-import-files.txt
```

**For EACH file in the list:**

1. Open in editor
2. Replace `from '@/types/X'` → `from '@eft-tracker/types/X'`
3. Save

**Or use sed (risky!):**

```bash
# Backup first
cp -r apps/web/src apps/web/src.backup

# Replace type imports
find apps/web/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/types/|from '@eft-tracker/types/|g" {} +

# Verify changes
git diff apps/web/src/ | head -50
```

**Checklist:**

- [ ] All type imports updated
- [ ] Changes reviewed
- [ ] No accidental replacements

---

### Step 3D.9: Run Type Check After Batch 1

```bash
pnpm run type-check
```

**If errors:**

- Fix import paths
- Check that types exist in packages/types
- May need to extract actual types (currently placeholders!)

**Checklist:**

- [ ] Type check passes (or shows expected errors)
- [ ] No "module not found" for types

---

### Step 3D.10: Update Imports - Batch 2 (Util Imports)

```bash
grep -r "from '@/lib/utils'" apps/web/src/ --files-with-matches

# Replace util imports
find apps/web/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/lib/utils'|from '@eft-tracker/utils'|g" {} +
```

**Checklist:**

- [ ] All util imports updated

---

### Step 3D.11: Update Imports - Batch 3 (Test Imports)

```bash
# Update test imports
grep -r "from '@/test/" __tests__/ --files-with-matches

find __tests__ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i "s|from '@/test/|from '@/__tests__/|g" {} +
```

**Checklist:**

- [ ] Test imports updated

---

### Step 3D.12: Update Husky Hooks

```bash
# Check what's in husky hooks
cat .husky/pre-commit

# If it references npm, change to pnpm
# If it references specific paths, update them
```

**Checklist:**

- [ ] Husky hooks checked
- [ ] Updated npm → pnpm (if needed)

---

### Step 3D.13: Update lint-staged Config

**In root `package.json`, find `lint-staged` section and update:**

```json
"lint-staged": {
  "apps/web/**/*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "apps/companion/**/*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "packages/**/*.ts": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
```

**Checklist:**

- [ ] lint-staged config updated for monorepo paths

---

### Step 3D.14: Test Everything

```bash
# Type check
pnpm run type-check

# Lint
pnpm run lint

# Build web app
pnpm run build

# Run tests
pnpm test

# Start dev server
pnpm dev
# Visit http://localhost:3000
```

**Expected at this stage:**

- Type check may have errors (types are placeholders)
- Build may fail (imports not fully resolved)
- Tests may fail (fixtures/mocks not updated)
- Dev server may not start (broken imports)

**This is NORMAL - we'll fix in Phase 3E!**

**Checklist:**

- [ ] Ran all checks
- [ ] Documented errors
- [ ] Ready for Phase 3E (fixes)

---

### Step 3D.15: Commit Phase 3D (Even if Broken)

```bash
git add -A
git commit -m "refactor: Update tsconfig and imports for monorepo

- Update web and companion tsconfig.json with workspace paths
- Update Sentry config imports
- Replace type imports: @/types → @eft-tracker/types
- Replace util imports: @/lib/utils → @eft-tracker/utils
- Replace test imports: @/test → @/__tests__
- Update root package.json with workspace scripts
- Update vitest.config.ts for monorepo paths
- Update lint-staged for workspace paths

⚠️ WARNING: May not build yet - actual type/util extraction in Phase 3E!"

git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] Phase 3D committed
- [ ] Pushed to remote

---

### PHASE 3E: Final Integration (Half day)

**Goal:** Fix all broken imports by extracting actual types/utils.

### Step 3E.1: Extract Actual Types

```bash
# Read the web app types
cat apps/web/src/types/index.ts
cat apps/web/src/types/api-contracts.ts
```

**Copy the SHARED types (those used by companion too) to packages/types/src/**

**Example:**

```typescript
// packages/types/src/quest.ts
export interface Quest {
  // Copy from apps/web/src/types/index.ts
}

export interface Trader {
  // Copy from apps/web/src/types/index.ts
}
```

**Keep auth-related types in web app only!**

**Checklist:**

- [ ] Quest types extracted
- [ ] Trader types extracted
- [ ] API contract types extracted
- [ ] Auth types left in web app
- [ ] `packages/types/src/index.ts` exports all types

---

### Step 3E.2: Extract Actual Utils

```bash
# Check what's in web app utils
cat apps/web/src/lib/utils.ts | wc -l  # Only 169 bytes!
```

**Extract PURE functions to packages/utils/src/**

**Example:**

```typescript
// packages/utils/src/constants.ts
export const TRADERS = [
  "Prapor",
  "Therapist",
  "Fence",
  "Skier",
  "Peacekeeper",
  "Mechanic",
  "Ragman",
  "Jaeger",
] as const;
export const QUEST_STATUSES = ["locked", "active", "completed"] as const;
```

**Keep server-specific utils in web app!**

**Checklist:**

- [ ] Constants extracted
- [ ] Pure formatters extracted (if any)
- [ ] Server utils left in web app
- [ ] `packages/utils/src/index.ts` exports all

---

### Step 3E.3: Run Type Check

```bash
pnpm run type-check
```

**Fix any remaining import errors.**

**Checklist:**

- [ ] Type check passes with zero errors

---

### Step 3E.4: Run Linter

```bash
pnpm run lint
```

**Fix any linting errors.**

**Checklist:**

- [ ] Linter passes

---

### Step 3E.5: Run Tests

```bash
pnpm test
```

**Fix any test failures:**

- Update fixture imports
- Update mock imports
- Fix test setup paths

**Checklist:**

- [ ] All tests pass

---

### Step 3E.6: Build Web App

```bash
pnpm run build
```

**Fix any build errors.**

**Checklist:**

- [ ] Build succeeds
- [ ] `.next/` directory created
- [ ] No build errors

---

### Step 3E.7: Build Companion App

```bash
pnpm run build:companion
```

**Fix any build errors.**

**Checklist:**

- [ ] Companion build succeeds
- [ ] Executable created

---

### Step 3E.8: Start Dev Servers

```bash
# Terminal 1: Web app
pnpm dev

# Terminal 2: Companion app
pnpm dev:companion
```

**Test:**

- [ ] Web app loads in browser (http://localhost:3000)
- [ ] No console errors
- [ ] Can navigate pages
- [ ] Companion app launches
- [ ] No runtime errors

**Checklist:**

- [ ] Both apps run successfully

---

### Step 3E.9: Test Database Operations

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```

**Checklist:**

- [ ] Prisma client generated
- [ ] Schema pushed successfully
- [ ] Prisma Studio opens

---

### Step 3E.10: Commit Phase 3E

```bash
git add -A
git commit -m "refactor: Extract actual types and utils, finalize monorepo

- Extract Quest, Trader types to packages/types
- Extract constants to packages/utils
- Fix all import errors
- All tests passing
- Both apps building successfully
- Database operations working

✅ Monorepo migration complete!"

git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] Phase 3E committed
- [ ] Pushed to remote

---

### Phase 3 Complete! 🎉🎉🎉

**Expected outcomes:**

- ✅ Disk space saved: ~75% (1.2GB → ~300MB)
- ✅ Install time: 2-3x faster
- ✅ Shared packages working
- ✅ Both apps building and running
- ✅ All tests passing

**Checkpoint:** Take a break! This was the hardest phase.

---

## 🔄 PHASE 4: CI/CD OPTIMIZATION

**Duration:** 1 day
**Risk:** MEDIUM
**Status:** ⬜ Not Started

### Step 4.1: Update Main CI Workflow

```bash
code .github/workflows/ci.yml
```

**Replace with:**

```yaml
name: CI

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linters
        run: pnpm run lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm run type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

  build:
    name: Build Web App
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm --filter @eft-tracker/web prisma generate

      - name: Build
        run: pnpm run build
        env:
          SKIP_ENV_VALIDATION: true
```

**Checklist:**

- [ ] Workflow updated for pnpm
- [ ] Uses workspace filters
- [ ] pnpm cache configured
- [ ] File saved

---

### Step 4.2: Update Companion App Workflow

```bash
code .github/workflows/companion-app.yml
```

**Update paths from `companion-app/` to `apps/companion/`:**

- Change all path filters
- Update build commands to use workspace filters
- Add pnpm setup

**Example changes:**

```yaml
paths:
  - "apps/companion/**"
  - "packages/**"

# Build command:
run: pnpm --filter @eft-tracker/companion tauri:build
```

**Checklist:**

- [ ] Paths updated
- [ ] pnpm setup added
- [ ] Build commands use workspace filters
- [ ] File saved

---

### Step 4.3: Remove Obsolete Workflows

```bash
# Delete smoke tests (Playwright removed)
rm .github/workflows/smoke-tests.yml

# Delete container security (Docker removed)
rm .github/workflows/container-security.yml

# Verify deleted
git status
```

**Checklist:**

- [ ] `smoke-tests.yml` deleted
- [ ] `container-security.yml` deleted

---

### Step 4.4: Update pr-checks.yml (If It Exists)

```bash
# Check size
wc -l .github/workflows/pr-checks.yml

# If it's large (>1000 lines), review it
code .github/workflows/pr-checks.yml
```

**Option 1:** Update for pnpm and keep
**Option 2:** Merge functionality into ci.yml and delete

**Decision:** Your call based on what checks it does.

**Checklist:**

- [ ] pr-checks.yml reviewed
- [ ] Decision made (keep or merge)
- [ ] Implemented decision

---

### Step 4.5: Test CI Workflow Locally

```bash
# Simulate CI workflow
pnpm install --frozen-lockfile
pnpm run lint
pnpm run type-check
pnpm test
pnpm --filter @eft-tracker/web prisma generate
pnpm run build
```

**Checklist:**

- [ ] All CI steps pass locally

---

### Step 4.6: Commit Phase 4

```bash
git add .github/
git commit -m "ci: Update workflows for monorepo structure

- Update ci.yml for pnpm and workspace filters
- Update companion-app.yml for new paths
- Remove smoke-tests.yml (Playwright removed)
- Remove container-security.yml (Docker removed)
- Add pnpm caching to all workflows

CI time reduction: ~20-30% with pnpm cache"

git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] Phase 4 committed
- [ ] Pushed to remote

---

### Step 4.7: Create Test PR to Verify CI

```bash
# Create PR
gh pr create --base master --title "test(ci): Verify CI workflows work" --body "Testing CI workflows after monorepo migration. Will close without merging."

# Wait for CI to run
# Check all workflows pass
# Close PR
gh pr close <PR_NUMBER>
```

**Checklist:**

- [ ] Test PR created
- [ ] All CI checks passed
- [ ] PR closed

---

### Phase 4 Complete! 🎉

**Expected outcomes:**

- ✅ CI time reduced by 20-30%
- ✅ All workflows use pnpm
- ✅ Workflows validated on test PR

---

## 📝 PHASE 5: DOCUMENTATION & FINAL POLISH

**Duration:** 1 day
**Risk:** LOW
**Status:** ⬜ Not Started

### Step 5.1: Update Root README.md

```bash
code README.md
```

**Add/update these sections:**

- Architecture overview (monorepo structure)
- Tech stack (mention pnpm workspaces)
- Prerequisites (pnpm 9+, Node 20+)
- Quick start (pnpm commands)
- Workspace commands reference
- Project structure

**Use the examples from the plan file (Phase 5.1).**

**Checklist:**

- [ ] README.md updated
- [ ] All pnpm commands correct
- [ ] Structure diagram accurate

---

### Step 5.2: Create docs/architecture/monorepo.md

```bash
mkdir -p docs/architecture
code docs/architecture/monorepo.md
```

**Content:** See plan file Phase 5.2 for full template.

**Checklist:**

- [ ] Monorepo guide created
- [ ] Workspace layout documented
- [ ] Common commands included

---

### Step 5.3: Create docs/architecture/migration-guide.md

```bash
code docs/architecture/migration-guide.md
```

**Document:**

- Date of migration
- What changed (before/after structure)
- Breaking changes (import paths, package manager)
- For contributors (setup instructions)

**Use plan file Phase 5.3 template.**

**Checklist:**

- [ ] Migration guide created
- [ ] Breaking changes documented
- [ ] Contributor instructions clear

---

### Step 5.4: Update CONTRIBUTING.md

```bash
code CONTRIBUTING.md
```

**Add monorepo workflow section:**

- Workspace commands
- Working on web app
- Working on companion app
- Adding dependencies
- Creating shared packages
- Testing

**Use plan file Phase 5.4 template.**

**Checklist:**

- [ ] CONTRIBUTING.md updated
- [ ] Monorepo workflow documented

---

### Step 5.5: Create QUICKSTART.md

```bash
code QUICKSTART.md
```

**Quick 5-minute setup guide:**

- Prerequisites
- Clone and install
- Environment setup
- Database setup
- Start development

**Use plan file Phase 5.5 template.**

**Checklist:**

- [ ] QUICKSTART.md created
- [ ] Works for new contributors

---

### Step 5.6: Reorganize docs/ Directory

```bash
# Create subdirectories
mkdir -p docs/web-app
mkdir -p docs/companion-app

# Move web-app docs
mv docs/SENTRY_*.md docs/web-app/ 2>/dev/null || true
mv docs/UPSTASH_SETUP.md docs/web-app/ 2>/dev/null || true
mv docs/CLOUDFLARE_SETUP.md docs/web-app/ 2>/dev/null || true
mv docs/DATABASE_*.md docs/web-app/ 2>/dev/null || true
mv docs/API*.md docs/web-app/ 2>/dev/null || true

# Move companion-app docs
mv docs/TAURI_*.md docs/companion-app/ 2>/dev/null || true
mv docs/COMPANION_*.md docs/companion-app/ 2>/dev/null || true

# Move architecture docs
mv docs/REPOSITORY_STRUCTURE.md docs/architecture/ 2>/dev/null || true

# Verify structure
tree docs/ -L 2  # or ls -R docs/
```

**Checklist:**

- [ ] docs/web-app/ created with files
- [ ] docs/companion-app/ created with files
- [ ] docs/architecture/ has structure docs
- [ ] Existing subdirectories preserved

---

### Step 5.7: Update docs/README.md (Index)

```bash
code docs/README.md
```

**Update with new structure:**

- Getting Started (Quick Start, Contributing, Migration Guide)
- Architecture (Monorepo, Repository Structure, Tech Stack)
- Web App docs link
- Companion App docs link
- Testing, Deployment, etc.

**Use plan file Phase 5.6 template.**

**Checklist:**

- [ ] docs/README.md updated
- [ ] Links to all major docs
- [ ] Structure reflects new organization

---

### Step 5.8: Update CLAUDE.md (If Exists)

```bash
code CLAUDE.md
```

**Add monorepo section:**

- pnpm commands
- Workspace structure
- Import paths
- Common pitfalls

**Use plan file Phase 5.8 template.**

**Checklist:**

- [ ] CLAUDE.md updated (if exists)
- [ ] Monorepo notes added

---

### Step 5.9: Commit Phase 5

```bash
git add -A
git commit -m "docs: Update documentation for monorepo structure

- Update README.md with monorepo architecture
- Create docs/architecture/monorepo.md guide
- Create docs/architecture/migration-guide.md
- Update CONTRIBUTING.md with workspace workflows
- Create QUICKSTART.md for new contributors
- Reorganize docs/ by app (web-app, companion-app)
- Update docs/README.md index
- Update CLAUDE.md with monorepo notes

All documentation now reflects monorepo structure."

git push origin feature/tauri-v2-auto-updater
```

**Checklist:**

- [ ] Phase 5 committed
- [ ] Pushed to remote

---

### Phase 5 Complete! 🎉

**Expected outcomes:**

- ✅ All documentation updated
- ✅ Contributor onboarding improved
- ✅ Migration notes captured

---

## ✅ FINAL VALIDATION

**Run the complete validation suite:**

### Validation Step 1: Clean Install

```bash
# Delete everything
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -f pnpm-lock.yaml

# Fresh install
pnpm install

# Verify installs in under 60 seconds
```

**Checklist:**

- [ ] Install completed
- [ ] Install time < 60s
- [ ] All workspaces have node_modules

---

### Validation Step 2: Type Check

```bash
pnpm run type-check
```

**Checklist:**

- [ ] Zero TypeScript errors

---

### Validation Step 3: Lint

```bash
pnpm run lint
```

**Checklist:**

- [ ] Zero lint errors

---

### Validation Step 4: Test

```bash
pnpm test
```

**Checklist:**

- [ ] All tests pass
- [ ] No failing tests

---

### Validation Step 5: Build Web App

```bash
pnpm run build
```

**Checklist:**

- [ ] Build succeeds
- [ ] Output in `apps/web/.next/`
- [ ] No build errors

---

### Validation Step 6: Build Companion App

```bash
pnpm run build:companion
```

**Checklist:**

- [ ] Build succeeds for all platforms
- [ ] Executable created
- [ ] No build errors

---

### Validation Step 7: Start Web App

```bash
pnpm dev
```

**Test:**

- Visit http://localhost:3000
- Login/signup
- View quest tree
- Complete a quest
- Verify data persists

**Checklist:**

- [ ] Web app starts
- [ ] No console errors
- [ ] All features work
- [ ] Data persists

---

### Validation Step 8: Start Companion App

```bash
pnpm dev:companion
```

**Test:**

- App launches
- Settings accessible
- No crashes

**Checklist:**

- [ ] Companion launches
- [ ] UI loads correctly
- [ ] No errors

---

### Validation Step 9: Database Operations

```bash
pnpm db:push
pnpm db:studio
```

**Checklist:**

- [ ] Schema pushed successfully
- [ ] Prisma Studio opens
- [ ] Can view data

---

### Validation Step 10: Git Hooks

```bash
# Make a small change
echo "# test" >> README.md

# Try to commit (hooks should run)
git add README.md
git commit -m "test: Verify hooks work"

# Reset if successful
git reset HEAD~1
git restore README.md
```

**Checklist:**

- [ ] Pre-commit hook ran
- [ ] Lint-staged executed
- [ ] Hooks working correctly

---

## 🚀 MERGE TO MASTER

**Once ALL validations pass:**

### Step M.1: Create PR

```bash
gh pr create \
  --base master \
  --title "refactor: Migrate to pnpm monorepo structure" \
  --body "$(cat << 'EOF'
## Summary

Complete monorepo migration using pnpm workspaces.

## Changes

### Phase 0: Security
- ✅ Removed committed .env file with live credentials
- ✅ Rotated Sentry auth token
- ✅ Updated .gitignore

### Phase 1: Cleanup
- ✅ Removed Docker infrastructure
- ✅ Removed Playwright E2E tests
- ✅ Deleted root clutter (k6.exe, credentials)
- ✅ Consolidated test directories
- ✅ Removed 5 unused dependencies

### Phase 2: Tauri Consolidation
- ✅ Removed src-tauri/ (Tauri v1)
- ✅ Kept apps/companion (Tauri v2)
- ✅ Removed duplicate configs

### Phase 3: Monorepo Structure
- ✅ Installed pnpm workspaces
- ✅ Created apps/ and packages/ structure
- ✅ Moved web app to apps/web/
- ✅ Moved companion to apps/companion/
- ✅ Created shared packages (@eft-tracker/types, @eft-tracker/utils, @eft-tracker/tsconfig)
- ✅ Updated all imports
- ✅ Both apps building successfully

### Phase 4: CI/CD
- ✅ Updated workflows for pnpm
- ✅ Added pnpm caching
- ✅ Removed obsolete workflows

### Phase 5: Documentation
- ✅ Updated README.md
- ✅ Created migration guide
- ✅ Updated CONTRIBUTING.md
- ✅ Reorganized docs/

## Impact

**Performance:**
- ✅ Disk space: 1.2GB → 300MB (75% reduction)
- ✅ Install time: ~90s → ~30s (3x faster)
- ✅ CI time: 20-30% faster with pnpm cache

**Developer Experience:**
- ✅ Clear separation of concerns (apps vs packages)
- ✅ Shared code properly organized
- ✅ Type-safe workspace dependencies
- ✅ Unified tooling with pnpm

**Code Quality:**
- ✅ All tests passing (49% unit, 49% integration)
- ✅ Zero TypeScript errors
- ✅ Zero lint errors
- ✅ Both apps building successfully

## Testing

- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ Web app builds and runs
- ✅ Companion app builds for all platforms
- ✅ Database operations working
- ✅ Git hooks functioning
- ✅ CI workflows passing

## Rollback Plan

If issues arise: `git reset --hard pre-monorepo-YYYYMMDD`

Closes #XXX (if there was an issue)
EOF
)"
```

**Checklist:**

- [ ] PR created
- [ ] All CI checks passing

---

### Step M.2: Wait for CI

**Monitor CI checks:**

- Lint
- Type check
- Tests
- Build

**Checklist:**

- [ ] All checks passed

---

### Step M.3: Merge PR

```bash
# Merge via GitHub UI or:
gh pr merge --squash --auto

# Or merge locally:
git checkout master
git merge --no-ff feature/tauri-v2-auto-updater -m "refactor: Migrate to pnpm monorepo structure"
git push origin master
```

**Checklist:**

- [ ] PR merged to master
- [ ] Master branch updated

---

### Step M.4: Monitor Production Deployment

**Watch Coolify:**

- Deployment starts automatically
- Docker build completes (~2 min)
- Healthcheck passes
- Rolling update succeeds

**Checklist:**

- [ ] Deployment succeeded
- [ ] Production URL loads: https://learntotarkov.com
- [ ] No errors in production

---

### Step M.5: Test Production

**Test critical paths:**

- Login/signup
- View quest tree
- Complete a quest
- Data persists

**Checklist:**

- [ ] Production works correctly
- [ ] No Sentry errors
- [ ] All features functional

---

### Step M.6: Clean Up

```bash
# Delete feature branch
git branch -d feature/tauri-v2-auto-updater
git push origin --delete feature/tauri-v2-auto-updater

# Keep rollback tag for 30 days
# (Don't delete pre-monorepo-YYYYMMDD tag yet!)
```

**Checklist:**

- [ ] Feature branch deleted
- [ ] Rollback tag preserved

---

## 🎉 MIGRATION COMPLETE!

### Success Criteria Checklist

**Technical:**

- [x] All CI checks pass
- [x] Web app deploys to production
- [x] Companion app builds for all platforms
- [x] pnpm install < 60s
- [x] Disk space: node_modules < 300MB
- [x] No TypeScript errors
- [x] No lint errors
- [x] All tests pass

**User-Facing:**

- [x] Production site works
- [x] Users can login/signup
- [x] Quest tracking functions
- [x] Data persists
- [x] No Sentry errors
- [x] Companion app installs

**Developer Experience:**

- [x] Install is faster
- [x] Hot reload works
- [x] IDE autocomplete works
- [x] Commands are clear
- [x] Documentation is complete

---

## 📊 FINAL METRICS

**Disk Space:**

- Before: ~1.2GB
- After: ~300MB
- Savings: **75%**

**Install Time:**

- Before: ~90 seconds (npm)
- After: ~30 seconds (pnpm)
- Improvement: **3x faster**

**Files:**

- Deleted: ~50 files
- Created: ~25 files
- Modified: ~200 files

**Dependencies:**

- Removed: 7 packages
- Organized: Shared across workspaces

**CI Time:**

- Improvement: **20-30% faster** with pnpm cache

---

## 🔥 TROUBLESHOOTING

### Issue: "pnpm: command not found"

```bash
npm install -g pnpm
```

### Issue: "Module not found: @eft-tracker/types"

```bash
pnpm install  # Reinstall to fix workspace links
```

### Issue: "Prisma Client not generated"

```bash
pnpm db:generate
```

### Issue: Build fails after migration

```bash
# Check for import errors
pnpm run type-check

# Check logs
pnpm run build 2>&1 | tee build.log
```

### Issue: Tests fail

```bash
# Check test imports
grep -r "from '@/test" __tests__/

# Update test setup
cat __tests__/setup/setup-tests.ts
```

### Issue: Production deployment fails

1. Check Coolify logs
2. Verify Docker build
3. Check environment variables
4. Rollback if needed: `git reset --hard pre-monorepo-YYYYMMDD`

---

## 📞 GETTING HELP

If stuck:

1. Check TROUBLESHOOTING section above
2. Review migration guide: `docs/architecture/migration-guide.md`
3. Check monorepo docs: `docs/architecture/monorepo.md`
4. Create GitHub issue with:
   - What phase you're on
   - Error messages
   - What you've tried

---

**END OF GUIDE**

Good luck! 🚀
