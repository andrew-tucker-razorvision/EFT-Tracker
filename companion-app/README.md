# ⚠️ DEPRECATED: Standalone Companion App

## Status

This directory has been **deprecated** as of December 17, 2025.

## Migration Required

The companion app has moved to the monorepo structure:

- ❌ **Old location:** `/companion-app/` (this directory)
- ✅ **New location:** `/apps/companion/` (monorepo-integrated)

## Why the Change?

Monorepo benefits:

- Shared types via `@eft-tracker/types` workspace
- Shared utilities via `@eft-tracker/utils` workspace
- Single source of truth
- 75% disk space reduction with pnpm hard links

## Commands Changed

**OLD (don't use):**

```bash
cd companion-app
npm run tauri:dev
```

**NEW (use these):**

```bash
pnpm dev:companion
# Or: pnpm --filter @eft-tracker/companion tauri:dev
```

## Timeline

- **Deprecated:** December 17, 2025
- **Planned Removal:** March 17, 2026 (90 days)

After March 17, 2026, this directory will be permanently deleted.

## Need Help?

See: `apps/companion/README.md`
