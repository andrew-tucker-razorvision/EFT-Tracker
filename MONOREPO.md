# EFT-Tracker Monorepo Guide

## Overview

EFT-Tracker is organized as a pnpm monorepo with multiple apps and shared packages:

```
eft-tracker-monorepo/
├── apps/
│   ├── web/           # Next.js web application
│   └── companion/     # Tauri v2 desktop companion app
├── packages/
│   ├── types/         # Shared TypeScript type definitions
│   ├── utils/         # Shared utility functions
│   └── tsconfig/      # Centralized TypeScript configurations
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

## Quick Start

### Installation

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Development

```bash
# Run web app dev server (port 3000 or next available)
pnpm dev

# Run companion app dev server
pnpm dev:companion

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check all apps
pnpm type-check

# Lint all apps
pnpm lint
```

### Building

```bash
# Build web app
pnpm build

# Build companion app
pnpm build:companion
```

## Workspace Structure

### apps/web

Next.js web application for quest tracking.

**Key directories:**
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities and services
- `src/types/` - Type definitions (re-exports from @eft-tracker/types)
- `prisma/` - Database schema and migrations

**Scripts:**
```bash
pnpm --filter @eft-tracker/web dev          # Start dev server
pnpm --filter @eft-tracker/web build        # Build production bundle
pnpm --filter @eft-tracker/web lint         # Run ESLint
pnpm --filter @eft-tracker/web type-check   # Type check
pnpm --filter @eft-tracker/web test         # Run tests
```

**Environment:**
- `NEXTAUTH_URL` - Authentication URL (default: http://localhost:3000)
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth secret for session encryption

### apps/companion

Tauri v2 desktop application for automatic quest sync.

**Key directories:**
- `src/` - React source code
- `src-tauri/` - Tauri Rust backend
- `tests/` - E2E tests

**Scripts:**
```bash
pnpm --filter @eft-tracker/companion dev           # Start dev (Tauri + Vite)
pnpm --filter @eft-tracker/companion tauri:build   # Build production app
pnpm --filter @eft-tracker/companion lint          # Run ESLint
pnpm --filter @eft-tracker/companion type-check    # Type check
pnpm --filter @eft-tracker/companion test          # Run tests
```

### packages/types

**@eft-tracker/types** - Shared TypeScript type definitions

```typescript
// quest.ts - Domain types
import type { Quest, QuestStatus, Trader } from "@eft-tracker/types";

// api.ts - API contract types
import { linkSchema, syncSchema } from "@eft-tracker/types";
import type { SyncRequest, SyncResponse } from "@eft-tracker/types";
```

**Exports:**
- `./` - All types and schemas
- `./quest` - Quest domain types
- `./api` - API contract types and Zod schemas

### packages/utils

**@eft-tracker/utils** - Shared utility functions

```typescript
import { formatDate, capitalize } from "@eft-tracker/utils";
import { questStatusSchema, validateQuestStatus } from "@eft-tracker/utils";
import { TRADERS, QUEST_STATUSES } from "@eft-tracker/utils";
```

**Modules:**
- `formatters.ts` - Date/string formatting
- `validators.ts` - Zod schemas and validation
- `constants.ts` - Domain constants

### packages/tsconfig

**@eft-tracker/tsconfig** - Centralized TypeScript configurations

Shared TypeScript configs for consistency:
- `base.json` - Base compiler options
- `nextjs.json` - Next.js-specific settings
- `react.json` - React/Vite settings

**Usage:**
```json
// apps/web/tsconfig.json
{
  "extends": "../../packages/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@eft-tracker/types": ["../../packages/types/src"],
      "@eft-tracker/utils": ["../../packages/utils/src"],
      "@eft-tracker/theme": ["../../packages/theme/src"],
      "@eft-tracker/ui": ["../../packages/ui/src"],
      "@eft-tracker/hooks": ["../../packages/hooks/src"]
    }
  }
}
```

### packages/theme

**@eft-tracker/theme** - Design system tokens and Tailwind config

Centralized design tokens for consistent styling:

- Color palettes (primary, gray, status colors)
- Spacing, typography, breakpoints
- Border radius, shadows, z-index scales
- Animation durations and easing functions
- Tailwind CSS configuration

```typescript
import { colors, spacing } from '@eft-tracker/theme';
import config from '@eft-tracker/theme/tailwind';
```

### packages/ui

**@eft-tracker/ui** - Shared React components

Building blocks for consistent UIs:

- `Button` - Primary, secondary, ghost, danger variants
- `Card` - Container with header, title, content, footer
- `Badge` - Status badges and labels

All components use Tailwind CSS and follow the theme design system.

```typescript
import { Button, Card, Badge } from '@eft-tracker/ui';
```

### packages/hooks

**@eft-tracker/hooks** - Custom React hooks

Common patterns and utilities:

- `useDebounce` - Debounce value changes
- `useLocalStorage` - Sync state with localStorage
- `useAsync` - Manage async operations with loading/error states

```typescript
import { useDebounce, useLocalStorage, useAsync } from '@eft-tracker/hooks';
```

## Common Workflows

### Adding a new feature to the web app

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes in apps/web/
# 3. Run tests
pnpm test

# 4. Check types
pnpm type-check

# 5. Lint
pnpm lint

# 6. Create PR targeting master
git push -u origin feature/my-feature
gh pr create --base master
```

### Sharing code between apps

1. **Extract to shared package** (packages/types/ or packages/utils/)
2. **Import in apps:**
   ```typescript
   // In apps/web/src/
   import { MyType } from "@eft-tracker/types";

   // In apps/companion/src/
   import { myFunction } from "@eft-tracker/utils";
   ```

### Updating dependencies

```bash
# Add dependency to specific workspace
pnpm --filter @eft-tracker/web add lodash

# Add dev dependency
pnpm --filter @eft-tracker/web add -D @types/lodash

# Update pnpm-lock.yaml
pnpm install
```

### Running commands in specific apps

```bash
# Run in web app only
pnpm --filter @eft-tracker/web build

# Run in all apps
pnpm -r build

# Run recursively in matching packages
pnpm --filter ./apps/* run test
```

## CI/CD Pipeline

The GitHub Actions workflow (`ci.yml`) runs:

1. **Lint** - ESLint and Prettier checks for all apps
2. **Type Check** - TypeScript validation for all apps
3. **Test** - Unit and integration tests
4. **Build** - Production builds
5. **Security** - npm audit and secret scanning
6. **E2E Tests** - Optional Playwright tests (locally only)

All jobs use pnpm with `--frozen-lockfile` for reproducible builds.

## Import Paths

### Backward Compatibility

All existing imports continue to work:

```typescript
// Old import path (still works)
import type { Quest } from "@/types";

// New shared package
import type { Quest } from "@eft-tracker/types";
```

The web app's `src/types/index.ts` re-exports from the shared package for backward compatibility.

### Path Aliases

| Alias | Resolves to |
|-------|------------|
| `@/` | `apps/web/src/` |
| `@eft-tracker/types` | `packages/types/src/` |
| `@eft-tracker/utils` | `packages/utils/src/` |

Configured in:
- `vitest.config.ts` (test resolution)
- `apps/web/tsconfig.json` (web app)
- `apps/companion/tsconfig.json` (companion app)

## Performance & Optimization

### pnpm Benefits

- **Disk space**: Shared dependency linking (vs npm's duplication)
- **Installation speed**: Efficient content-addressable storage
- **Lock file**: Deterministic builds with `pnpm-lock.yaml`

### Workspace Benefits

- **Shared dependencies**: Single instance of all packages
- **Type sharing**: Direct TypeScript imports between apps
- **Monolithic development**: One git repo, coordinated releases
- **Code reuse**: Shared utilities and types

## Troubleshooting

### Module resolution errors

```bash
# Rebuild monorepo links
pnpm install

# Clear caches
rm -rf node_modules
pnpm store prune
pnpm install
```

### Type checking fails

```bash
# Generate TypeScript definitions
pnpm --filter @eft-tracker/web run prisma:generate

# Regenerate types
pnpm --filter @eft-tracker/web run type-check
```

### Tests failing after changes

```bash
# Clear test cache
pnpm test -- --clearCache

# Run specific test
pnpm test -- __tests__/unit/my-test.test.ts
```

### Build fails

```bash
# Clean build artifacts
pnpm -r run clean

# Rebuild from scratch
pnpm install
pnpm build
```

## Future Enhancements

Completed and planned improvements to the monorepo:

- [x] Common theme/styling (`packages/theme/`) - Design system tokens and Tailwind config
- [x] UI component library (`packages/ui/`) - Button, Card, Badge components
- [x] Shared React hooks (`packages/hooks/`) - useDebounce, useLocalStorage, useAsync
- [ ] Testing utilities (`packages/test-utils/`) - Test setup helpers, fixtures, factories
- [ ] API client (`packages/api-client/`) - Type-safe API client with proper typing
- [ ] E2E shared test helpers (`packages/e2e-utils/`) - Playwright helpers and page objects

## Resources

- [pnpm Documentation](https://pnpm.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tauri Documentation](https://tauri.app/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Git Workflow

```bash
# Feature branch
git checkout -b feature/description

# Make changes, test, commit
git add .
git commit -m "feat: description

Details about changes"

# Push and create PR
git push -u origin feature/description
gh pr create --base master

# After review/approval, merge triggers deployment
# to production via Coolify webhook
```

---

For questions or issues, refer to the main README.md or open an issue on GitHub.
