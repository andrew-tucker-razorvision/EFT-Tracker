# EFT Tracker Companion

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Platform](https://img.shields.io/badge/platform-windows-blue)
![Version](https://img.shields.io/badge/version-0.1.5-blue)

## Overview

EFT Tracker Companion is a lightweight Windows desktop application that automatically syncs your Escape from Tarkov quest progress with [Learn to Tarkov](https://learntotarkov.com). It runs in the system tray and monitors your game logs in real-time.

**Key Features:**

- 🎮 Automatic quest progress detection from game logs
- 🔄 Real-time sync to Learn to Tarkov account
- 📍 System tray integration (minimal UI footprint)
- ⚙️ Auto-launch on Windows startup
- 🔐 Secure token-based authentication
- 📥 Built-in auto-updater with digital signatures

**Binary Size:** 2.7 MB (standalone Windows executable)

## Quick Start

### Prerequisites

- Windows 10 or 11
- WebView2 (auto-installed if missing)
- Node.js 20+ (development only)
- Rust stable (development only)

### Installation

1. Download the latest installer from [GitHub Releases](https://github.com/andrew-tucker-razorvision/EFT-Tracker/releases)
2. Run the `.msi` or `.nsis` installer
3. Launch from Start Menu or system tray
4. Link your Learn to Tarkov account (first run)
5. Configure your EFT installation path if needed

### Development

```bash
# From repository root
pnpm dev:companion

# Or be explicit
pnpm --filter @eft-tracker/companion tauri:dev
```

This starts the dev server on `http://localhost:1420` and opens the Tauri window.

### Building

```bash
# Development build
pnpm build:companion

# Production build (signed, auto-updater enabled)
pnpm --filter @eft-tracker/companion tauri:build

# Output: apps/companion/src-tauri/target/release/bundle/
```

## Project Structure

```
apps/companion/
├── src/                          # React frontend
│   ├── components/               # UI components (LinkAccount, SettingsPanel, etc.)
│   ├── hooks/                    # React hooks (useStore, useSync, etc.)
│   ├── App.tsx                   # Main component
│   └── main.tsx                  # Entry point
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs              # Tauri window setup, menu handling
│   │   ├── eft_detector.rs      # EFT installation detection
│   │   ├── log_watcher.rs       # Game log monitoring
│   │   └── sync_manager.rs      # API sync logic
│   ├── tauri.conf.json          # Tauri app config
│   └── Cargo.toml               # Rust dependencies
├── dist/                         # Compiled frontend (auto-generated on build)
└── package.json                 # Node.js dependencies
```

## Architecture

### Thin Client Model

Unlike bundling the entire web app, the companion uses a **thin client architecture**:

```
┌─────────────────────────────────────┐
│     Companion App (Windows)         │
│                                     │
│  ┌──────────────────────────────┐   │
│  │   React UI (Settings, etc.)  │   │
│  └──────────────────────────────┘   │
│              ↓ (Rust Commands)       │
│  ┌──────────────────────────────┐   │
│  │   Tauri Bridge               │   │
│  │  - Log watching              │   │
│  │  - EFT detection             │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
           ↓ (HTTPS)
┌─────────────────────────────────────┐
│   Learn to Tarkov API               │
│   (prod: learntotarkov.com)         │
│                                     │
│  - Authenticate user                │
│  - Fetch quest data                 │
│  - Sync progress                    │
└─────────────────────────────────────┘
```

**Benefits:**

- ✅ Minimal binary size (2.7 MB vs 100+ MB with bundled web app)
- ✅ Always uses latest API and data
- ✅ No web app maintenance in companion repo
- ✅ Reduced attack surface

### Auto-Updater

The companion includes an integrated auto-updater powered by Tauri's `tauri-plugin-updater`:

1. **Check on Startup**: App checks GitHub releases endpoint on each launch
2. **Download**: If newer version available, downloads signed update file
3. **Verify**: Cryptographically verifies signature before installing
4. **Install**: Runs installer and restarts app automatically
5. **Seamless**: User sees update prompt; rest is automatic

Configuration: [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) lines 54-61

## Shared Packages

The companion uses workspace dependencies for type safety and code reuse:

```typescript
// Import types from shared package
import type { Quest, QuestStatus } from "@eft-tracker/types";

// Import utilities
import { formatDate, parseJSON } from "@eft-tracker/utils";
```

**Available packages:**

| Package              | Purpose                         | Location          |
| -------------------- | ------------------------------- | ----------------- |
| `@eft-tracker/types` | TypeScript type definitions     | `packages/types/` |
| `@eft-tracker/utils` | Utilities (parsing, formatting) | `packages/utils/` |

**Monorepo structure:**

```
pnpm-workspace.yaml       # Defines workspace
├── apps/
│   ├── web/              # Web dashboard
│   ├── companion/        # ← This app
│   └── ...
├── packages/
│   ├── types/            # Shared types
│   ├── utils/            # Shared utilities
│   └── ...
```

## Development Workflow

### Running Development Server

```bash
# Terminal 1: Start dev server
pnpm dev:companion

# Terminal 2: In separate window, tail Tauri logs
tail -f ~/.local/share/eft-tracker-companion/logs/app.log
```

Dev server runs on `http://localhost:1420` with hot module reloading.

### Making Changes

**Frontend changes:**

1. Edit React component in `src/components/`
2. Save - HMR applies change automatically
3. Verify in dev window
4. Test: `pnpm --filter @eft-tracker/companion test`

**Backend changes:**

1. Edit Rust code in `src-tauri/src/`
2. Dev server automatically rebuilds
3. Test: `cd apps/companion/src-tauri && cargo test`

### Debugging

**Frontend debugging:**

- DevTools: `Ctrl+Shift+I` in dev window (Tauri dev mode)
- Console logs appear in dev window
- React DevTools available in dev mode

**Backend debugging:**

- Logs: Check `~/.local/share/eft-tracker-companion/logs/app.log`
- RUST_LOG env var: `RUST_LOG=debug pnpm dev:companion` for verbose logs
- Rust unit tests: `cd src-tauri && cargo test`

**Local database:**

- Settings stored in: `~/.local/share/eft-tracker-companion/store.json`
- Can manually edit for testing

### Building for Distribution

```bash
# Production build with code signing
./scripts/release-tauri.sh 0.1.6 "Bug fixes and improvements"

# Or manually:
pnpm --filter @eft-tracker/companion tauri:build

# Outputs:
# - Windows MSI: src-tauri/target/release/bundle/msi/
# - Windows NSIS: src-tauri/target/release/bundle/nsis/
```

## Testing

### Frontend Unit Tests

```bash
# Run all tests
pnpm --filter @eft-tracker/companion test

# Watch mode
pnpm --filter @eft-tracker/companion test:watch

# Coverage report
pnpm --filter @eft-tracker/companion test:coverage
```

**Test location:** `src/**/*.test.tsx`

**Currently tested:**

- ✅ Toast component
- ✅ Settings persistence
- ✅ Token validation

**Coverage target:** >40% (current: 5%)

### Backend Unit Tests

```bash
cd apps/companion/src-tauri
cargo test

# Run specific test
cargo test test_eft_path_detection
```

**Test location:** `src-tauri/src/**/*.rs` (inline `#[cfg(test)]` modules)

**Currently tested:**

- ✅ EFT installation detection (5 tests)
- ✅ Log file parsing (8 tests)
- ✅ API response handling (10 tests)
- ✅ Settings management (5 tests)

### End-to-End Tests

```bash
# Start app in test mode
pnpm --filter @eft-tracker/companion test:e2e

# Or with UI
npx playwright test --ui
```

**Test location:** `__tests__/e2e/companion.spec.ts`

**Coverage:**

- ✅ Authentication flow
- ✅ Settings panel interactions
- ✅ System tray behavior

### Performance Baseline

**Measured (v0.1.5):**

| Metric       | Target  | Actual | Status  |
| ------------ | ------- | ------ | ------- |
| Binary size  | <20 MB  | 2.7 MB | ✅ PASS |
| Startup time | <3s     | 1.8s   | ✅ PASS |
| Idle memory  | <150 MB | 87 MB  | ✅ PASS |

See: `docs/tauri/PERFORMANCE_BASELINE.md`

## Troubleshooting

### Common Issues

**Error: "WebView2 not found"**

WebView2 is required for Tauri apps on Windows. Install it:

```
https://developer.microsoft.com/microsoft-edge/webview2/
```

**Error: "Port 1420 already in use"**

Dev server is trying to use an occupied port:

```bash
# Kill process using port 1420
npx kill-port 1420

# Or manually specify a different port
VITE_PORT=1421 pnpm dev:companion
```

**Error: "EFT installation not detected"**

The app couldn't find your Escape from Tarkov installation. Manually configure it:

1. Open Settings (gear icon in app)
2. Enter your EFT installation path (e.g., `C:\Battlestate Games\EFT`)
3. Click "Save"

**Error: "Failed to sync progress"**

Check your internet connection and Learn to Tarkov account status. Logs are in:

```
Windows: %APPDATA%\eft-tracker-companion\logs\
```

**App won't start on boot**

Auto-start may be disabled in Windows Settings:

```
Settings → Apps → Startup → EFT Tracker Companion (toggle ON)
```

### Getting Help

1. Check app logs: `%APPDATA%\eft-tracker-companion\logs\app.log`
2. Search existing [GitHub Issues](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)
3. File a new issue with:
   - Windows version
   - Error message or unexpected behavior
   - App version (visible in Settings)
   - Relevant log lines

## Release Process

### Version Management

Versions follow semantic versioning:

- **Patch** (0.1.X): Bug fixes, small improvements
- **Minor** (0.X.0): New features
- **Major** (X.0.0): Breaking changes (not currently in use)

**Current version:** 0.1.5

### Creating a Release

```bash
# From repository root
./scripts/release-tauri.sh 0.1.6 "Add new feature"

# Steps performed automatically:
# 1. Bump versions in Cargo.toml, tauri.conf.json, package.json
# 2. Create git tag tauri-v0.1.6
# 3. Push to remote (triggers GitHub Actions)
# 4. GitHub Actions builds and signs release
# 5. Companion auto-updater downloads update
```

See: `scripts/release-tauri.sh` for full details

### Release Checklist

- [ ] All PRs merged to `master`
- [ ] All tests passing in CI
- [ ] Manual testing completed
- [ ] Release notes prepared
- [ ] Run `./scripts/release-tauri.sh X.Y.Z "Notes"`
- [ ] Verify GitHub Actions build succeeds
- [ ] Verify installers download and install correctly
- [ ] Announce release in project channels

### Auto-Update Verification

After releasing a new version:

1. Install the **previous** version
2. Launch the app
3. Update prompt should appear within 5-10 seconds
4. Click "Update"
5. App restarts with new version
6. Verify app still functions normally

See: `docs/tauri/e2e-autoupdate-verification.md`

## File Locations

### Configuration Files

| File              | Location          | Purpose               |
| ----------------- | ----------------- | --------------------- |
| `tauri.conf.json` | `src-tauri/`      | Tauri app settings    |
| `package.json`    | `apps/companion/` | Node.js deps          |
| `Cargo.toml`      | `src-tauri/`      | Rust deps             |
| `vite.config.ts`  | `apps/companion/` | Frontend build config |

### Runtime Locations

| Item       | Windows Path                                 |
| ---------- | -------------------------------------------- |
| App data   | `%APPDATA%\eft-tracker-companion\`           |
| Settings   | `%APPDATA%\eft-tracker-companion\store.json` |
| Logs       | `%APPDATA%\eft-tracker-companion\logs\`      |
| App itself | `%ProgramFiles%\EFT Tracker Companion\`      |

## References

### Documentation

- [Tauri Setup Guide](../../docs/TAURI_SETUP.md) - Development environment
- [Testing Guide](./docs/TESTING.md) - Test framework overview
- [Performance Baseline](../../docs/tauri/PERFORMANCE_BASELINE.md) - Performance metrics
- [Release Checklist](../../docs/tauri/release-checklist.md) - Release process

### External Links

- [Tauri Documentation](https://tauri.app/) - Framework docs
- [React Documentation](https://react.dev/) - Frontend framework
- [Rust Book](https://doc.rust-lang.org/book/) - Rust language

### GitHub Links

- [Main Repository](https://github.com/andrew-tucker-razorvision/EFT-Tracker)
- [Releases Page](https://github.com/andrew-tucker-razorvision/EFT-Tracker/releases)
- [Issues & Discussions](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues)

## Support

### Reporting Bugs

Found an issue? [Open a GitHub Issue](https://github.com/andrew-tucker-razorvision/EFT-Tracker/issues/new) with:

1. **Title**: Clear, one-line description
2. **Description**: What happened vs. what you expected
3. **Steps to reproduce**: How to make it happen again
4. **Environment**: Windows version, app version, relevant settings
5. **Logs**: Paste relevant lines from app logs

### Feature Requests

Have an idea? [Open a GitHub Discussion](https://github.com/andrew-tucker-razorvision/EFT-Tracker/discussions) or file an issue with label `enhancement`.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT License - See [LICENSE](../../LICENSE) file

---

**Need help?** Check the [Troubleshooting](#troubleshooting) section or open a GitHub Issue.

Last updated: December 17, 2025
