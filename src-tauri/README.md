# EFT Quest Tracker - Tauri Companion App

This directory contains the Tauri desktop companion app for EFT Quest Tracker.

## Architecture

**Thin Client Design:**

- Static HTML/CSS/JS bundled in app (~10-20MB)
- Calls production API at `https://learntotarkov.com/api/*` for all data
- No local server required
- System tray integration
- Auto-updates via GitHub Releases

## Development

### Prerequisites

- Rust 1.60+ (already installed)
- Node.js 18+ (already installed)
- WebView2 (pre-installed on Windows 10/11)

### Running in Dev Mode

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Tauri app (points to localhost:3000)
npm run tauri:dev
```

The Tauri app will launch and connect to the Next.js dev server at `http://localhost:3000`.

### Building for Production

```bash
# Build static export + Tauri app
npm run tauri:build
```

Output files:

- `src-tauri/target/release/bundle/msi/EFT-Quest-Tracker_*.msi`
- `src-tauri/target/release/bundle/nsis/EFT-Quest-Tracker_*-setup.exe`

## Project Structure

```
src-tauri/
├── src/
│   └── main.rs          # Rust backend (system tray, window management)
├── icons/               # App icons (various sizes)
├── Cargo.toml           # Rust dependencies
├── tauri.conf.json      # Tauri configuration
└── build.rs             # Build script
```

## Features

### System Tray

- **Left-click tray icon**: Show/focus window
- **Right-click tray icon**: Show menu
- **Menu options**:
  - Show - Restore window
  - Hide - Minimize to tray
  - Quit - Exit application

### Window Behavior

- Close button hides to tray (doesn't quit)
- Window size: 1280x800 (min 800x600)
- Resizable and maximizable

### Auto-Updater

_(To be implemented in Phase 4)_

- Checks for updates on startup
- Downloads and installs from GitHub Releases
- Automatic relaunch after update

## API Integration

The companion app uses a thin client architecture:

**Frontend:** [src/lib/api/tauri-client.ts](../../src/lib/api/tauri-client.ts)

- Detects Tauri environment via `__TAURI__` in window
- Routes all API calls to `https://learntotarkov.com`
- Uses `credentials: 'include'` for cookie-based auth

**Authentication:** [src/lib/auth/tauri-auth.ts](../../src/lib/auth/tauri-auth.ts)

- OAuth flows open in system browser
- App polls for session status after OAuth
- Session persists across app restarts

**CORS:** [next.config.ts](../../next.config.ts)

- Server allows `tauri://localhost` origin
- Credentials enabled for cross-origin requests

## Configuration

### Environment Variables

Create `.env.local` (not committed):

```bash
NEXT_PUBLIC_API_URL=https://learntotarkov.com
```

### Tauri Config

See [tauri.conf.json](./tauri.conf.json) for:

- Window settings
- Bundle configuration
- Security allowlist
- System tray settings
- Auto-updater settings (when enabled)

## Building for Release

1. Update version in:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`

2. Commit changes:

   ```bash
   git add .
   git commit -m "chore: bump version to X.Y.Z"
   ```

3. Create tag and push:

   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

4. GitHub Actions will automatically:
   - Build Windows installers (MSI + NSIS)
   - Create GitHub Release
   - Upload installers as assets
   - Generate `latest.json` for auto-updater

## Troubleshooting

### "Browser is already in use" error

The Tauri dev server may leave processes running. Kill them:

```bash
# Windows
taskkill /F /IM eft-quest-tracker.exe

# Or delete the lock file
Remove-Item -Recurse "$env:LOCALAPPDATA\ms-playwright\mcp-chrome-*" -Force
```

### Build fails with "target not found"

Ensure Rust is up to date:

```bash
rustup update stable
```

### Icons not showing

Regenerate icons from source:

```bash
cargo tauri icon path/to/source-icon.png
```

## Resources

- [Tauri Documentation](https://tauri.app/v1/)
- [Tauri + Next.js Guide](https://tauri.app/v1/guides/getting-started/setup/next-js)
- [Implementation Plan](../../docs/COMPANION_APP_IMPLEMENTATION.md)
