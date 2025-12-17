# Monorepo Migration Guide

**Migration Date:** December 2025
**Status:** Complete - All phases live
**Risk Level:** Low (completed and validated)

## Overview

EFT-Tracker was migrated from a single-app structure to a **pnpm monorepo** with shared packages and multiple apps. This migration improves developer experience, reduces disk space, and speeds up installation.

## What Changed

### Before Migration

```
eft-tracker/
├── src/                 # Web app code
├── public/
├── prisma/
├── package.json
├── tsconfig.json
├── next.config.ts
├── companion-app/       # Desktop app (deprecated - use apps/companion/)
├── src-tauri/          # Old Tauri v1 (unused)
└── Dockerfile          # Docker config (removed)
```

### After Migration

```
eft-tracker-monorepo/
├── apps/
│   ├── web/            # Next.js web app
│   │   ├── src/
│   │   ├── prisma/
│   │   └── package.json
│   └── companion/      # Tauri v2 desktop app
│       ├── src/
│       └── package.json
├── packages/
│   ├── types/          # Shared type definitions
│   ├── utils/          # Shared utilities
│   ├── tsconfig/       # Shared TS configs
│   ├── theme/          # Design system
│   ├── ui/            # Shared components
│   └── hooks/         # Shared React hooks
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── package.json        # Root workspace config
```

## Breaking Changes for Developers

### 1. Package Manager Changed: npm → pnpm

**Old:**

```bash
npm install
npm run dev
```

**New:**

```bash
pnpm install
pnpm dev
```

### 2. Directory Structure

**Old import paths (still work via re-exports):**

```typescript
import type { Quest } from "@/types";
import { formatDate } from "@/lib/utils";
```

**New shared package imports (recommended):**

```typescript
import type { Quest } from "@eft-tracker/types";
import { formatDate } from "@eft-tracker/utils";
```

### 3. Workspace Commands

Many operations now use workspace filters:

```bash
# Old: Run in root
npm run dev

# New: More explicit
pnpm dev                    # Runs web app by default
pnpm dev:companion         # Runs companion app
pnpm --filter @eft-tracker/web dev    # Explicit

# Web app specific
pnpm --filter @eft-tracker/web build
pnpm --filter @eft-tracker/web test

# Companion app specific
pnpm --filter @eft-tracker/companion tauri:build
```

### 4. Database Operations

```bash
# Old: Run from root
npm run prisma generate

# New: Specify the app (only web app has Prisma)
pnpm --filter @eft-tracker/web prisma generate
pnpm db:generate          # Convenience alias
```

### 5. Dependencies

Shared code is now in separate packages with their own `package.json`:

```
packages/types/package.json
packages/utils/package.json
packages/tsconfig/package.json
packages/theme/package.json
packages/ui/package.json
packages/hooks/package.json
```

## Configuration Changes

### TypeScript Paths

All apps now use tsconfig inheritance:

```json
// apps/web/tsconfig.json
{
  "extends": "../../packages/tsconfig/nextjs.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@eft-tracker/types": ["../../packages/types/src"],
      "@eft-tracker/utils": ["../../packages/utils/src"]
    }
  }
}
```

### ESLint/Prettier

Root configuration now applies to all apps:

```bash
pnpm run lint    # Checks apps/web and apps/companion
pnpm run format  # Formats all code
```

### GitHub Actions

Workflows updated to use pnpm and workspace filters:

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9

- name: Build web app
  run: pnpm --filter @eft-tracker/web build

- name: Build companion app
  run: pnpm --filter @eft-tracker/companion tauri:build
```

## Performance Improvements

### Disk Space

- **Before:** ~1.2GB
- **After:** ~300MB
- **Savings:** 75%

### Installation Speed

- **Before:** ~90 seconds (npm)
- **After:** ~30 seconds (pnpm)
- **Improvement:** 3x faster

### CI/CD Time

- **Improvement:** 20-30% faster with pnpm cache

## Phases Completed

### Phase 0: Security ✅

- Removed `.env` from git history
- Rotated Sentry auth token
- Updated `.gitignore`

### Phase 1: Cleanup ✅

- Removed Docker infrastructure
- Removed Playwright E2E tests (replaced by Vitest)
- Consolidated test directories
- Removed 5 unused dependencies

### Phase 2: Tauri Consolidation ✅

- Removed unused `src-tauri/` (Tauri v1)
- Kept `apps/companion/` (Tauri v2)
- Removed duplicate configs

### Phase 3: Monorepo Structure ✅

- Installed pnpm workspaces
- Created `apps/` and `packages/` structure
- Moved web app to `apps/web/`
- Moved companion to `apps/companion/`
- Created shared packages
- Updated all imports

### Phase 4: CI/CD Optimization ✅

- Updated workflows for pnpm
- Added pnpm caching
- Removed obsolete workflows

### Phase 5: Documentation ✅

- Updated README.md
- Created migration guide (this file)
- Updated CONTRIBUTING.md
- Created QUICKSTART.md
- Organized docs/

## Rollback Plan

If major issues arise, a rollback tag was created before the migration:

```bash
git reset --hard pre-monorepo-20251217
```

However, this should not be necessary as all phases have been validated and deployed to production.

## For New Contributors

1. **Install pnpm** (if not already): `npm install -g pnpm`
2. **Clone and install:** `git clone ... && cd EFT-Tracker && pnpm install`
3. **Read:** [QUICKSTART.md](../QUICKSTART.md) for setup
4. **Read:** [MONOREPO.md](monorepo.md) for structure overview
5. **Check:** [../CONTRIBUTING.md](../CONTRIBUTING.md) for workflow

## Common Tasks

### Adding a dependency to web app

```bash
pnpm --filter @eft-tracker/web add lodash
```

### Adding a shared type

```bash
# 1. Add to packages/types/src/
# 2. Export from packages/types/src/index.ts
# 3. Import in apps/web and apps/companion
```

### Creating a new feature

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes (in apps/web/src/ or packages/)

# 3. Run tests
pnpm test

# 4. Commit and push
git push -u origin feature/my-feature

# 5. Create PR to master
gh pr create --base master
```

## Troubleshooting

### "pnpm: command not found"

```bash
npm install -g pnpm
```

### "Module not found: @eft-tracker/types"

```bash
pnpm install  # Reinstall workspace links
```

### Build fails after pulling changes

```bash
# Clean and reinstall
rm -rf node_modules apps/*/node_modules
pnpm install
pnpm build
```

### Tests fail with import errors

```bash
# Regenerate type definitions
pnpm db:generate

# Clear test cache
pnpm test -- --clearCache
```

## Resources

- [MONOREPO.md](monorepo.md) - Workspace structure and commands
- [QUICKSTART.md](../QUICKSTART.md) - 5-minute setup guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Workflow and guidelines
- [pnpm Documentation](https://pnpm.io/)

---

**Questions?** Check the main [README.md](../README.md) or open an issue on GitHub.
