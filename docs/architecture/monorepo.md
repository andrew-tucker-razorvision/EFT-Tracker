# Monorepo Architecture

This document describes the structure and usage of the EFT-Tracker pnpm monorepo.

## Directory Structure

```
eft-tracker-monorepo/
├── apps/
│   ├── web/                    # Next.js web application
│   │   ├── src/
│   │   │   ├── app/           # Next.js App Router
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── lib/           # Utilities and services
│   │   │   └── types/         # Type definitions
│   │   ├── prisma/            # Database schema
│   │   ├── public/            # Static assets
│   │   ├── package.json       # Web app dependencies
│   │   └── tsconfig.json      # Web app TypeScript config
│   │
│   └── companion/              # Tauri v2 desktop app
│       ├── src/               # React source code
│       ├── src-tauri/         # Tauri Rust backend
│       ├── package.json       # Companion dependencies
│       └── tsconfig.json      # Companion TypeScript config
│
├── packages/
│   ├── types/                 # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── index.ts      # Main exports
│   │   │   ├── quest.ts      # Quest domain types
│   │   │   └── api.ts        # API contract types
│   │   └── package.json
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── formatters.ts # Formatting functions
│   │   │   ├── validators.ts # Zod schemas
│   │   │   └── constants.ts  # Domain constants
│   │   └── package.json
│   │
│   ├── tsconfig/              # Centralized TypeScript configs
│   │   ├── base.json         # Base compiler options
│   │   ├── nextjs.json       # Next.js-specific
│   │   ├── react.json        # React/Vite-specific
│   │   └── package.json
│   │
│   ├── theme/                 # Design system tokens
│   │   ├── src/
│   │   │   ├── colors.ts
│   │   │   ├── spacing.ts
│   │   │   └── tailwind.config.js
│   │   └── package.json
│   │
│   ├── ui/                    # Shared React components
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   └── package.json
│   │
│   └── hooks/                 # Shared React hooks
│       ├── src/
│       │   ├── useDebounce.ts
│       │   ├── useLocalStorage.ts
│       │   └── useAsync.ts
│       └── package.json
│
├── docs/                       # Documentation
├── .github/                    # GitHub Actions workflows
├── pnpm-workspace.yaml        # Workspace configuration
├── pnpm-lock.yaml             # Dependency lock file
├── package.json               # Root workspace config
└── MONOREPO.md               # Setup and commands guide
```

## Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Defines which directories are workspace packages.

### Root package.json

```json
{
  "name": "eft-tracker-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "pnpm --filter @eft-tracker/web dev",
    "build": "pnpm --filter @eft-tracker/web build",
    "test": "vitest run",
    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check"
  }
}
```

## Apps

### apps/web - Next.js Web Application

**Purpose:** Main quest tracking application (https://learntotarkov.com)

**Technology:**

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth.js

**Key Directories:**

- `src/app/` - Pages and API routes
- `src/components/` - React components
- `src/hooks/` - Custom hooks
- `src/lib/` - Services and utilities
- `src/types/` - Type definitions (re-exports from @eft-tracker/types)
- `prisma/` - Database schema and migrations

**Development:**

```bash
pnpm --filter @eft-tracker/web dev
# or
pnpm dev
```

**Production Build:**

```bash
pnpm --filter @eft-tracker/web build
# or
pnpm build
```

**Environment Variables:**

- `NEXTAUTH_URL` - Auth callback URL
- `DATABASE_URL` - PostgreSQL connection
- `AUTH_SECRET` - NextAuth secret

### apps/companion - Tauri v2 Desktop App

**Purpose:** Desktop overlay for quest tracking while playing

**Technology:**

- Tauri v2 (Rust backend)
- Vite (React bundler)
- React 19
- TypeScript
- Auto-updater plugin

**Key Directories:**

- `src/` - React components
- `src-tauri/` - Rust backend code
- `src-tauri/tauri.conf.json` - Tauri configuration

**Development:**

```bash
pnpm --filter @eft-tracker/companion dev
# or
pnpm dev:companion
```

**Production Build:**

```bash
pnpm --filter @eft-tracker/companion tauri:build
# or
pnpm build:companion
```

## Packages

### packages/types - Shared TypeScript Types

**Purpose:** Single source of truth for data types and API contracts

**Exports:**

```typescript
// Domain types
import type { Quest, QuestStatus, Trader } from "@eft-tracker/types/quest";

// API contracts
import { syncSchema } from "@eft-tracker/types/api";
import type { SyncRequest, SyncResponse } from "@eft-tracker/types/api";
```

**Files:**

- `src/index.ts` - Main entry point (re-exports all)
- `src/quest.ts` - Quest domain types
- `src/api.ts` - API contract types and Zod schemas

### packages/utils - Shared Utilities

**Purpose:** Reusable functions and constants used by multiple apps

**Exports:**

```typescript
import { formatDate, capitalize } from "@eft-tracker/utils";
import { questStatusSchema } from "@eft-tracker/utils";
import { TRADERS, QUEST_STATUSES } from "@eft-tracker/utils";
```

**Modules:**

- `formatters.ts` - Date/string formatting
- `validators.ts` - Zod validation schemas
- `constants.ts` - Domain constants (traders, statuses, etc.)

### packages/tsconfig - Shared TypeScript Configurations

**Purpose:** Centralized TypeScript configuration for consistency

**Files:**

- `base.json` - Base compiler options for all apps
- `nextjs.json` - Next.js-specific settings
- `react.json` - React/Vite-specific settings

**Usage:**

```json
{
  "extends": "../../packages/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@eft-tracker/types": ["../../packages/types/src"]
    }
  }
}
```

### packages/theme - Design System

**Purpose:** Centralized design tokens and Tailwind configuration

**Exports:**

```typescript
import { colors, spacing } from "@eft-tracker/theme";
import tailwindConfig from "@eft-tracker/theme/tailwind.config.js";
```

### packages/ui - Shared React Components

**Purpose:** Reusable UI components for consistency

**Components:**

- `Button` - With variants (primary, secondary, ghost, danger)
- `Card` - Container with header, content, footer
- `Badge` - Status badges and labels

### packages/hooks - Shared React Hooks

**Purpose:** Common patterns for state management and side effects

**Hooks:**

- `useDebounce` - Debounce value changes
- `useLocalStorage` - Sync state with localStorage
- `useAsync` - Manage async operations

## Monorepo Workflows

### Installing Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Add dependency to specific workspace
pnpm --filter @eft-tracker/web add lodash

# Add dev dependency
pnpm --filter @eft-tracker/web add -D @types/lodash

# Remove dependency
pnpm --filter @eft-tracker/web remove lodash
```

### Running Scripts

```bash
# Run in root (applies to web app by default)
pnpm dev
pnpm build
pnpm test
pnpm lint

# Run in specific app
pnpm --filter @eft-tracker/web dev
pnpm --filter @eft-tracker/companion tauri:build

# Run in all workspaces
pnpm -r lint
pnpm -r test

# Run in matching pattern
pnpm --filter "./apps/*" build
pnpm --filter "./packages/*" test
```

### Type Checking

```bash
# Check all workspaces
pnpm type-check

# Check specific app
pnpm --filter @eft-tracker/web type-check
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test -- __tests__/unit/my-test.test.ts

# Run tests in UI mode
pnpm test:ui
```

### Building

```bash
# Build web app (Next.js)
pnpm build
pnpm --filter @eft-tracker/web build

# Build companion app (Tauri executable)
pnpm build:companion
pnpm --filter @eft-tracker/companion tauri:build

# Build all
pnpm -r build
```

## Import Paths

### Path Aliases

Each app has path aliases defined in `tsconfig.json`:

| Alias                | Resolves To                    |
| -------------------- | ------------------------------ |
| `@/`                 | `apps/web/src/` (web app only) |
| `@eft-tracker/types` | `packages/types/src/`          |
| `@eft-tracker/utils` | `packages/utils/src/`          |
| `@eft-tracker/theme` | `packages/theme/src/`          |
| `@eft-tracker/ui`    | `packages/ui/src/`             |
| `@eft-tracker/hooks` | `packages/hooks/src/`          |

### Backward Compatibility

Web app maintains old import paths via re-exports:

```typescript
// Old paths (still work)
import type { Quest } from "@/types";
import { formatDate } from "@/lib/utils";

// New paths (recommended for shared code)
import type { Quest } from "@eft-tracker/types";
import { formatDate } from "@eft-tracker/utils";
```

## CI/CD Pipeline

Configured in `.github/workflows/ci.yml`:

1. **Lint** - ESLint and Prettier for all apps
2. **Type Check** - TypeScript validation
3. **Test** - Unit and integration tests
4. **Build** - Production builds for all apps
5. **Security** - npm audit and secret scanning

All jobs:

- Use pnpm with `--frozen-lockfile`
- Cache dependencies for speed
- Run in parallel when possible

## Development Workflow

### Starting Development

```bash
# Terminal 1: Web app
pnpm dev
# Runs on http://localhost:3000 (or next available port)

# Terminal 2: Companion app (optional)
pnpm dev:companion
```

### Making Changes

1. **Web app changes:** Modify `apps/web/src/`
2. **Shared code:** Modify `packages/types/` or `packages/utils/`
3. **Companion app:** Modify `apps/companion/src/`

### Testing

```bash
# Run tests for all changes
pnpm test

# Run specific test file
pnpm test -- __tests__/unit/my-feature.test.ts

# Watch mode during development
pnpm test:watch
```

### Database Operations

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Open Prisma Studio
pnpm db:studio
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit
git add .
git commit -m "feat: description"

# Push and create PR
git push -u origin feature/my-feature
gh pr create --base master
```

## Performance Characteristics

### Disk Space

- Single `node_modules/` at root with symlinks
- Packages linked from workspace packages
- Result: ~300MB vs ~1.2GB for separate installs

### Installation Speed

- pnpm's content-addressable storage
- Shared dependency deduplication
- Result: ~30s vs ~90s for npm

### Build Performance

- Incremental builds
- Shared TypeScript configs
- Result: 20-30% faster CI/CD with pnpm cache

## Troubleshooting

### Module not found errors

```bash
# Rebuild workspace links
pnpm install

# Clear caches and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm store prune
pnpm install
```

### TypeScript errors after changes

```bash
# Regenerate Prisma client
pnpm db:generate

# Clear TypeScript cache
pnpm type-check
```

### Build fails

```bash
# Clean all artifacts
pnpm -r run clean
rm -rf .next apps/web/.next

# Rebuild
pnpm install
pnpm build
```

### Dependency resolution issues

```bash
# Update lock file
pnpm install

# Check for version conflicts
pnpm list --depth=0
```

## Resources

- [pnpm Documentation](https://pnpm.io/)
- [Workspace Documentation](https://pnpm.io/workspaces)
- [Next.js Documentation](https://nextjs.org/)
- [Tauri Documentation](https://tauri.app/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

For questions or issues, refer to [MONOREPO.md](../MONOREPO.md) in the root or open an issue on GitHub.
