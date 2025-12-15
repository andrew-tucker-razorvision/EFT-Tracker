# EFT Quest Tracker - Companion App Implementation Plan

**Architecture:** Tauri + Remote Backend (Thin Client)
**Estimated Effort:** 8-10 hours
**Target Platform:** Windows (initial release)

---

## Architecture Overview

### Design Decision: Thin Client

The companion app will be a **thin client** that:

- Loads static HTML/CSS/JS assets locally (bundled in the app)
- Calls the production API at `https://learntotarkov.com/api/*` for all data
- Uses existing authentication flow (no local server needed)
- Updates via GitHub Releases with Tauri's auto-updater

**Benefits:**

- Small bundle size (~10-20MB vs 200MB for Electron)
- No dual architecture maintenance
- Always uses latest API features
- Simpler authentication (reuses production OAuth)
- Faster startup time

**Trade-offs:**

- Requires internet connection (acceptable - web app does too)
- API latency vs local (mitigated with optimistic UI)

---

## Project Structure

```
EFT-Tracker/
├── src/                    # Existing Next.js app
├── src-tauri/             # NEW: Tauri Rust backend
│   ├── src/
│   │   └── main.rs        # Window management, system tray
│   ├── icons/             # App icons (multiple sizes)
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── next.config.tauri.ts   # NEW: Static export config
├── public/                # Static assets (bundled in app)
└── package.json           # Add Tauri scripts
```

---

## Implementation Steps

### Phase 1: Setup & Configuration (1-2 hours)

#### 1.1 Install Tauri Prerequisites

**Windows Requirements:**

```bash
# Install Rust
winget install --id Rustlang.Rust.MSVC

# Install WebView2 (usually pre-installed on Windows 10/11)
# Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

# Verify installation
rustc --version
cargo --version
```

#### 1.2 Initialize Tauri Project

```bash
# Install Tauri CLI
npm install --save-dev @tauri-apps/cli

# Initialize Tauri (interactive prompts)
npm run tauri init

# Prompts:
# - App name: EFT Quest Tracker
# - Window title: EFT Quest Tracker
# - Web assets location: ../out
# - Dev server URL: http://localhost:3000
# - Frontend dev command: npm run dev
# - Frontend build command: npm run build:tauri
```

#### 1.3 Create Static Export Configuration

**File:** `next.config.tauri.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Static HTML export for Tauri

  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },

  // Disable trailing slashes for consistent routing
  trailingSlash: true,

  // Asset prefix for production builds
  assetPrefix: process.env.NODE_ENV === "production" ? undefined : "",

  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_API_URL: "https://learntotarkov.com",
  },
};

export default nextConfig;
```

#### 1.4 Add Build Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:tauri": "next build -c next.config.tauri.ts",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

### Phase 2: Tauri Backend Configuration (2-3 hours)

#### 2.1 Configure Tauri Settings

**File:** `src-tauri/tauri.conf.json`

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build:tauri",
    "devPath": "http://localhost:3000",
    "distDir": "../out"
  },
  "package": {
    "productName": "EFT Quest Tracker",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "all": false,
        "open": true
      },
      "window": {
        "all": false,
        "close": true,
        "hide": true,
        "show": true,
        "maximize": true,
        "minimize": true,
        "unmaximize": true,
        "unminimize": true,
        "startDragging": true
      },
      "notification": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "targets": ["msi", "nsis"],
      "identifier": "com.eft-tracker.app",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "security": {
      "csp": null
    },
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/andrew-tucker-razorvision/EFT-Tracker/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "TO_BE_GENERATED"
    },
    "windows": [
      {
        "fullscreen": false,
        "resizable": true,
        "title": "EFT Quest Tracker",
        "width": 1280,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ],
    "systemTray": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true,
      "menuOnLeftClick": false
    }
  }
}
```

#### 2.2 Implement Rust Backend

**File:** `src-tauri/src/main.rs`

```rust
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent};
use tauri::{Manager, WindowEvent};

fn main() {
    // System tray setup
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        let window = app.get_window("main").unwrap();
                        window.show().unwrap();
                    }
                    "hide" => {
                        let window = app.get_window("main").unwrap();
                        window.hide().unwrap();
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .on_window_event(|event| match event.event() {
            WindowEvent::CloseRequested { api, .. } => {
                // Hide instead of close
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**File:** `src-tauri/Cargo.toml`

```toml
[package]
name = "eft-quest-tracker"
version = "1.0.0"
description = "EFT Quest Tracker Companion App"
authors = ["Tucker Blackwell"]
license = "MIT"
repository = "https://github.com/andrew-tucker-razorvision/EFT-Tracker"
edition = "2021"

[build-dependencies]
tauri-build = { version = "1.5", features = [] }

[dependencies]
tauri = { version = "1.5", features = ["system-tray", "notification", "updater"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

---

### Phase 3: Frontend Adaptation (2-3 hours)

#### 3.1 API Client Configuration

**File:** `src/lib/api/client.ts`

```typescript
// Detect if running in Tauri
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

// API base URL
const API_BASE_URL = isTauri
  ? process.env.NEXT_PUBLIC_API_URL || "https://learntotarkov.com"
  : ""; // Use relative URLs in web version

export const apiClient = {
  get: async (path: string) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include", // Send cookies for auth
    });
    return response.json();
  },

  post: async (path: string, data: unknown) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // ... other methods
};
```

#### 3.2 Authentication Handling

**File:** `src/lib/auth/tauri-auth.ts`

```typescript
import { apiClient } from "../api/client";

/**
 * Open external browser for OAuth (Tauri only)
 */
export async function openOAuthWindow(provider: "google" | "discord") {
  const { open } = await import("@tauri-apps/api/shell");
  const authUrl = `https://learntotarkov.com/api/auth/signin/${provider}`;
  await open(authUrl);
}

/**
 * Check authentication status
 */
export async function checkAuthStatus() {
  try {
    const session = await apiClient.get("/api/auth/session");
    return session.user ? session : null;
  } catch (error) {
    return null;
  }
}
```

#### 3.3 Tauri-Specific Components

**File:** `src/components/TauriWrapper.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { checkAuthStatus } from '@/lib/auth/tauri-auth';

export function TauriWrapper({ children }: { children: React.ReactNode }) {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI__' in window);
  }, []);

  if (!isTauri) {
    return <>{children}</>;
  }

  return (
    <div className="tauri-app">
      {/* Custom window controls for Tauri */}
      <div className="window-controls">
        {/* Minimize, maximize, close buttons */}
      </div>
      {children}
    </div>
  );
}
```

---

### Phase 4: Auto-Updater Setup (1 hour)

#### 4.1 Generate Updater Keys

```bash
# Generate public/private key pair
cd src-tauri
cargo tauri signer generate -w ~/.tauri/eft-tracker.key

# Copy public key to tauri.conf.json
# Store private key securely (needed for signing releases)
```

#### 4.2 GitHub Actions Workflow

**File:** `.github/workflows/release-tauri.yml`

```yaml
name: Release Tauri App

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        platform: [windows-latest]

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
          TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: "EFT Quest Tracker v__VERSION__"
          releaseBody: "See the assets to download and install this version."
          releaseDraft: true
          prerelease: false
```

#### 4.3 Update Check Implementation

**File:** `src/lib/updater/check-updates.ts`

```typescript
import { checkUpdate, installUpdate } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";

export async function checkForUpdates() {
  try {
    const { shouldUpdate, manifest } = await checkUpdate();

    if (shouldUpdate) {
      const shouldInstall = window.confirm(
        `Update available: ${manifest?.version}\n\nInstall now?`
      );

      if (shouldInstall) {
        await installUpdate();
        await relaunch();
      }
    }
  } catch (error) {
    console.error("Update check failed:", error);
  }
}
```

---

### Phase 5: Icons & Branding (30 minutes)

#### 5.1 Generate App Icons

**Required Sizes:**

- `32x32.png` - Tray icon
- `128x128.png` - Installer icon
- `128x128@2x.png` - Retina display
- `icon.ico` - Windows executable
- `icon.icns` - macOS (future)

**Tools:**

- Use existing logo from `public/` directory
- Generate with: https://tauri.app/v1/guides/features/icons/
- Or manually with Photoshop/GIMP

**Command:**

```bash
npm install -g @tauri-apps/cli
cargo tauri icon path/to/source-icon.png
```

This auto-generates all required sizes in `src-tauri/icons/`.

---

### Phase 6: Testing & Debugging (1-2 hours)

#### 6.1 Local Development

```bash
# Start dev server
npm run tauri:dev

# This will:
# 1. Start Next.js dev server on localhost:3000
# 2. Open Tauri window pointing to localhost:3000
# 3. Hot-reload on code changes
```

#### 6.2 Test Checklist

- [ ] App launches without errors
- [ ] Authentication flow works (OAuth redirects to browser)
- [ ] Quest data loads from production API
- [ ] Mark quest complete → syncs to server
- [ ] System tray icon appears and menu works
- [ ] Minimize to tray instead of closing
- [ ] Window restores from tray
- [ ] Update check works (test with mock server)
- [ ] App persists session across restarts

#### 6.3 Debug Tools

```rust
// Enable DevTools in Tauri (src-tauri/tauri.conf.json)
{
  "tauri": {
    "allowlist": {
      "all": false,
      "devtools": true  // Add this for debugging
    }
  }
}
```

Open DevTools: Right-click in app → Inspect Element

---

### Phase 7: Build & Release (1 hour)

#### 7.1 Build Production App

```bash
# Build for Windows
npm run tauri:build

# Output:
# src-tauri/target/release/bundle/msi/EFT-Quest-Tracker_1.0.0_x64_en-US.msi
# src-tauri/target/release/bundle/nsis/EFT-Quest-Tracker_1.0.0_x64-setup.exe
```

#### 7.2 Test Installer

1. Install MSI on clean Windows VM
2. Verify app launches
3. Test authentication
4. Test system tray
5. Uninstall cleanly

#### 7.3 Create GitHub Release

```bash
# Tag version
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions workflow will:
# 1. Build Windows installer
# 2. Sign with Tauri private key
# 3. Create GitHub Release
# 4. Upload .msi and .exe files
# 5. Generate latest.json for auto-updater
```

#### 7.4 Release Assets

**GitHub Release should include:**

- `EFT-Quest-Tracker_1.0.0_x64_en-US.msi` (Windows Installer)
- `EFT-Quest-Tracker_1.0.0_x64-setup.exe` (NSIS Installer)
- `latest.json` (Auto-updater manifest)
- `CHANGELOG.md` (Release notes)

---

## Configuration Changes Needed

### 1. Next.js Config (Dual Mode)

The app needs to support BOTH web and desktop builds. Create two configs:

- `next.config.ts` - Existing config for web deployment (keep as-is)
- `next.config.tauri.ts` - New config for static export (Tauri)

Build scripts determine which config to use.

### 2. Environment Variables

**For Tauri builds, set:**

```bash
NEXT_PUBLIC_API_URL=https://learntotarkov.com
```

**Add to `.env.local`** (not committed):

```
TAURI_PRIVATE_KEY=path/to/private.key
TAURI_KEY_PASSWORD=your_password
```

**Add to GitHub Secrets:**

- `TAURI_PRIVATE_KEY` (content of private key file)
- `TAURI_KEY_PASSWORD` (encryption password)

### 3. CORS Configuration

**File:** `src/middleware.ts`

```typescript
// Add CORS headers for Tauri app
if (request.headers.get("sec-fetch-site") === "cross-site") {
  headers.set("Access-Control-Allow-Origin", "tauri://localhost");
  headers.set("Access-Control-Allow-Credentials", "true");
}
```

**File:** `next.config.ts`

```typescript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'tauri://localhost' },
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
      ],
    },
  ];
},
```

---

## Development Workflow

### Local Development

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Tauri app (points to localhost:3000)
npm run tauri:dev
```

### Building for Production

```bash
# Build static export + Tauri app
npm run tauri:build
```

### Creating a Release

```bash
# 1. Update version in package.json and src-tauri/tauri.conf.json
# 2. Commit changes
git add .
git commit -m "chore: bump version to 1.0.0"

# 3. Create tag
git tag v1.0.0
git push origin v1.0.0

# 4. GitHub Actions builds and creates release automatically
```

---

## Estimated Timeline

| Phase     | Task                  | Time           |
| --------- | --------------------- | -------------- |
| 1         | Setup & Configuration | 1-2 hours      |
| 2         | Tauri Backend Config  | 2-3 hours      |
| 3         | Frontend Adaptation   | 2-3 hours      |
| 4         | Auto-Updater Setup    | 1 hour         |
| 5         | Icons & Branding      | 30 minutes     |
| 6         | Testing & Debugging   | 1-2 hours      |
| 7         | Build & Release       | 1 hour         |
| **Total** |                       | **8-10 hours** |

---

## Success Criteria

### Functional Requirements

- ✅ App launches and displays quest tracker UI
- ✅ Authentication works (OAuth via external browser)
- ✅ Quest data loads from production API
- ✅ Progress syncs to server correctly
- ✅ System tray icon with show/hide menu
- ✅ App minimizes to tray instead of closing
- ✅ Auto-updater checks for new versions on startup
- ✅ Updates install and relaunch automatically

### Technical Requirements

- ✅ Bundle size < 20MB
- ✅ Startup time < 3 seconds
- ✅ Memory usage < 150MB at idle
- ✅ No console errors in production build
- ✅ Installer works on Windows 10/11
- ✅ Uninstaller removes all files cleanly

### User Experience

- ✅ Window is resizable with minimum size
- ✅ Window position persists across restarts
- ✅ Keyboard shortcuts work (same as web app)
- ✅ Copy/paste works in all input fields
- ✅ External links open in default browser

---

## Future Enhancements

### Phase 8 (Future)

- [ ] Linux support (AppImage, .deb, .rpm)
- [ ] macOS support (.dmg, .app)
- [ ] Custom hotkey to show/hide window (e.g., Ctrl+Shift+E)
- [ ] Offline mode with local caching
- [ ] Desktop notifications for quest unlocks
- [ ] In-game overlay mode (borderless, always-on-top)

### Phase 9 (Future)

- [ ] Voice commands for hands-free tracking
- [ ] Game detection (auto-launch when Tarkov starts)
- [ ] Raid timer and extract countdown
- [ ] Team quest coordination (multiplayer sync)

---

## Troubleshooting

### Common Issues

**Issue:** `Error: Target directory out/index.html not found`
**Solution:** Run `npm run build:tauri` before `tauri build`

**Issue:** `OAuth redirect doesn't work`
**Solution:** Ensure production API allows `tauri://localhost` as OAuth callback

**Issue:** `Update check fails`
**Solution:** Verify `latest.json` is uploaded to GitHub Releases

**Issue:** `Window won't close`
**Solution:** Expected behavior - app minimizes to tray. Use tray menu → Quit

**Issue:** `Installer blocked by Windows Defender`
**Solution:** Code signing required for production (future task)

---

## References

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri + Next.js Guide](https://tauri.app/v1/guides/getting-started/setup/next-js)
- [Tauri Updater](https://tauri.app/v1/guides/distribution/updater)
- [GitHub Actions for Tauri](https://github.com/tauri-apps/tauri-action)

---

**Ready to implement?** Follow phases 1-7 sequentially. Each phase builds on the previous one.
