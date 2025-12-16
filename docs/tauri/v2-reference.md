# Tauri v2 Comprehensive Reference Guide

_Compiled from official Tauri v2 documentation (https://v2.tauri.app)_

## Table of Contents

1. [Getting Started](#getting-started)
2. [Configuration](#configuration)
3. [Plugin System](#plugin-system)
4. [Updater Plugin](#updater-plugin)
5. [Shell Plugin](#shell-plugin)
6. [IPC and Commands](#ipc-and-commands)
7. [Building & Deployment](#building--deployment)
8. [Security](#security)
9. [Development Workflow](#development-workflow)
10. [Common Patterns](#common-patterns)

---

## Getting Started

### What is Tauri?

Tauri is a framework for building tiny, fast binaries for all major desktop and mobile platforms. It combines:

- **Any frontend framework** (React, Vue, Svelte, Angular, etc.) that compiles to HTML, JavaScript, and CSS
- **Backend logic** in Rust, Swift, or Kotlin
- **System integration** using native web renderers instead of bundling a browser

### Three Main Advantages

#### 1. Secure Foundation

- Built on Rust with memory, thread, and type-safety benefits
- Security audits for major and minor releases
- Covers core code and upstream dependencies
- **Reference**: [Tauri Security Policy](https://github.com/tauri-apps/tauri/security/policy)

#### 2. Smaller App Size

- Leverages OS webview (no browser engine bundling)
- Minimal applications can be **<600KB**
- Compared to Electron: 100-300MB vs 600KB

#### 3. Flexible Architecture

- Frontend-agnostic (any framework works)
- JavaScript ↔ Rust via `invoke()` function
- Swift/Kotlin bindings for native platform features
- Uses TAO (window creation) and WRY (webview rendering)

### Prerequisites

#### System Requirements by OS

**Windows:**

- Windows 7 and later
- WebView2 pre-installed on Windows 10 v1803+
- Microsoft C++ Build Tools
- Rust (installed via rustup with MSVC toolchain)

**macOS:**

- Catalina (10.15) and later
- Xcode (full IDE, not Command Line Tools)
- Rust via rustup

**Linux:**

- Distribution support: Debian, Arch, Fedora, Gentoo, openSUSE, Alpine, NixOS
- Distribution-specific development packages
- Rust via rustup

#### Required Software

**Rust** (mandatory):

```bash
# Install via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Verify
rustc --version
cargo --version
```

**Node.js** (only needed if using JavaScript frontend):

- Install LTS version from nodejs.org
- Used for frontend framework development

#### Mobile Development (Optional)

**Android:**

- Android Studio
- Set JAVA_HOME environment variable
- SDK Manager with platform tools
- Add rustup targets: `rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android`

**iOS (macOS only):**

- Xcode
- Homebrew
- Add rustup targets: `rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim`
- Install Cocoapods: `sudo gem install cocoapods`

### Creating Your First App

#### Using create-tauri-app (Recommended)

```bash
# Bash/Fish (Linux/macOS)
sh <(curl https://create.tauri.app/sh)

# PowerShell (Windows)
irm https://create.tauri.app/ps | iex

# npm/yarn/pnpm/bun
npm create tauri-app@latest
yarn create tauri-app
pnpm create tauri-app
bun create tauri-app
```

#### Installation Prompts

You'll be asked to configure:

- Project name
- Bundle identifier (reverse domain notation, e.g., `com.company.appname`)
- Frontend language (TypeScript or JavaScript)
- Package manager (pnpm, yarn, npm, bun)
- UI template and flavor

#### Getting Your App Running

```bash
cd tauri-app
npm install
npm run tauri dev
```

The CLI will:

1. Compile Rust backend
2. Start frontend dev server
3. Open application window
4. Enable hot-reload for both frontend and Rust changes

**First run note**: Initial build may take several minutes as it downloads and compiles dependencies.

#### Manual Setup (For Existing Projects)

```bash
# Install Tauri CLI
npm install --save-dev @tauri-apps/cli

# Initialize in your project root
npm run tauri init

# Follow prompts to configure:
# - App name
# - Window title
# - Dev server URL (e.g., http://localhost:5173)
# - Frontend distribution path (if not using dev server)
```

### Project Structure

```
tauri-app/
├── src/                        # Frontend source
│   ├── index.html
│   ├── main.ts
│   └── styles.css
│
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── main.rs            # Desktop entry point
│   │   ├── lib.rs             # Shared Rust code & mobile entry
│   │   └── commands.rs        # Exposed commands
│   │
│   ├── capabilities/           # Security capability files
│   │   └── default.json
│   │
│   ├── icons/                  # App icons
│   │   ├── icon.png
│   │   ├── icon.icns (macOS)
│   │   └── icon.ico (Windows)
│   │
│   ├── tauri.conf.json        # Main Tauri config
│   ├── Cargo.toml             # Rust dependencies
│   └── build.rs               # Build script
│
├── package.json
├── vite.config.ts             # Frontend build config
└── tsconfig.json
```

**Key File Functions:**

- **tauri.conf.json**: Central configuration for app ID, windows, security, plugins, build settings
- **Cargo.toml**: Rust dependencies and project metadata
- **capabilities/**: Define which Tauri commands are allowed (security model)
- **src-tauri/src/main.rs**: Typically unchanged; uses `tauri::generate_context!()` macro
- **src-tauri/src/lib.rs**: Platform-agnostic Rust code; mobile entry point

---

## Configuration

### tauri.conf.json Structure

The configuration file is the central hub for customizing your Tauri application.

#### File Location

`src-tauri/tauri.conf.json`

#### Format Support

- JSON (default)
- JSON5 (enable `config-json5` feature)
- TOML (enable `config-toml` feature)

#### Platform-Specific Overrides

Create separate files for platform-specific configuration:

- `tauri.conf.windows.json`
- `tauri.conf.macos.json`
- `tauri.conf.linux.json`

### Configuration Schema

#### Top-Level Fields

```json
{
  "productName": "My Awesome App", // Display name (required)
  "version": "1.0.0", // SemVer or path to package.json
  "identifier": "com.company.myapp", // Reverse domain notation (required)
  "mainBinaryName": "myapp", // Override compiled binary name (optional)
  "app": {}, // App configuration
  "build": {}, // Build configuration
  "bundle": {}, // Bundling configuration
  "plugins": {} // Plugin configurations
}
```

#### Required Fields Explanation

**identifier**:

- Reverse domain notation format (e.g., `com.company.myapp`)
- Must contain only alphanumeric characters, hyphens, and periods
- Used for app bundle ID across all platforms
- Cannot be changed after release (affects auto-update)

**productName**:

- Display name shown to users
- Used in window titles and installer names

**version**:

- Semantic versioning (e.g., "1.0.0", "2.1.0-beta")
- Can reference `package.json`: `"../package.json"`
- Must be updated for releases

### App Configuration

The `app` object controls windows, security, and system integration.

```json
{
  "app": {
    "windows": [
      {
        "title": "My App",
        "width": 800,
        "height": 600,
        "minWidth": 400,
        "minHeight": 300,
        "fullscreen": false,
        "visible": true,
        "resizable": true,
        "maximizable": true,
        "minimizable": true,
        "closable": true,
        "focus": true,
        "decorations": true
      }
    ],
    "security": {
      "csp": "default-src 'self'",
      "capabilities": []
    },
    "tray": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true,
      "showMenuOnLeftClick": true,
      "tooltip": "My App"
    }
  }
}
```

**Windows Array**:

- Create multiple windows via multiple entries
- Each window can have different properties
- First window opens on app start

**Security Object**:

- `csp`: Content Security Policy header
- `capabilities`: Array of capability file paths

**Tray Object** (optional):

- Configure system tray integration
- Show/hide app via tray icon
- Platform-specific behavior

### Build Configuration

Controls development and build processes.

```json
{
  "build": {
    "devUrl": "http://localhost:5173", // Dev server URL for dev mode
    "frontendDist": "../dist", // Built frontend path for production
    "beforeDevCommand": "npm run dev", // Pre-dev setup command
    "beforeBuildCommand": "npm run build", // Pre-build setup command
    "devPath": ".", // Dev path (deprecated)
    "withGlobalTauri": false // Expose tauri globally in frontend
  }
}
```

**devUrl**:

- Frontend dev server URL used in dev mode
- Tauri will reload when frontend changes
- Example: Vite default is `http://localhost:5173`

**frontendDist**:

- Path to built frontend assets in production
- Relative to `src-tauri` directory
- Must contain `index.html`

**beforeDevCommand**:

- Command executed before dev server starts
- Useful for starting external services
- Example: `"npm run dev"` for frontend

**beforeBuildCommand**:

- Command executed before production build
- Typically: `"npm run build"` to compile frontend

### Bundle Configuration

Platform-specific packaging options.

```json
{
  "bundle": {
    "active": true,
    "icon": ["icons/icon.png"],
    "targets": ["app"],
    "macos": {
      "minimumSystemVersion": "10.15"
    },
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "signingIdentity": null,
      "timestampUrl": ""
    },
    "linux": {
      "deb": {},
      "appimage": {}
    }
  }
}
```

**Platform-Specific Targets**:

**Linux**: AppImage, Debian (.deb), RPM, Snapcraft, AUR, Flatpak

**macOS**: DMG, App Bundle (for App Store)

**Windows**: NSIS installer, Microsoft Store

### Plugin Configuration

Plugins are configured under the `plugins` object.

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://api.example.com/updates"],
      "pubkey": "your-public-key",
      "dialog": true,
      "windows": {
        "installMode": "passive"
      }
    },
    "shell": {
      "scope": [
        {
          "allow": ["open"],
          "deny": []
        }
      ]
    }
  }
}
```

Each plugin has specific configuration requirements (see Plugin sections below).

---

## Plugin System

### Overview

Tauri's core doesn't include every feature. Instead, it provides a plugin mechanism to extend functionality. As the framework matures, useful plugins are maintained by the Tauri team in the plugins workspace.

**Key Principle**: "the Tauri core does not contain features not needed by everyone. Instead it offers a mechanism to add external functionalities into a Tauri application called plugins."

### Plugin Structure

A complete plugin consists of:

**Rust Cargo Crate**:

- Core implementation
- Commands and event handlers
- State management

**NPM Package** (optional):

- JavaScript API bindings
- TypeScript type definitions
- Higher-level abstractions

**Android Library** (optional):

- Kotlin/Java code
- Native Android integration

**Swift Package** (optional):

- Swift code
- iOS integration

### Naming Convention

**Rust crates**: `tauri-plugin-{name}`

- Example: `tauri-plugin-updater`

**NPM packages**: `@scope-name/plugin-{name}`

- Scoped names recommended for organization
- Example: `@tauri-apps/plugin-updater`

### Plugin Lifecycle Hooks

Plugins can intercept five key lifecycle events:

#### 1. Setup

Triggered during app initialization.

```rust
#[cfg(desktop)]
pub fn setup_desktop(app: &AppHandle) {
    // Initialize state
    // Register listeners
    // Setup resources
}
```

**Use for**:

- Initialize plugin state
- Register mobile components
- Prepare resources

#### 2. On Navigation

Triggered when webview navigates.

```rust
pub fn on_navigation(url: &str, _router: &str) {
    // Validate URL
    // Log navigation
}
```

**Use for**:

- Track navigation
- Validate destinations
- Security checks

#### 3. On Webview Ready

Triggered after window creation and webview ready.

```rust
pub fn on_webview_ready(webview: &Webview) {
    // Execute initialization scripts
    // Setup listeners
}
```

**Use for**:

- Initialize frontend bridge
- Execute setup scripts
- Configure event listeners

#### 4. On Event

Triggered during window/app event loop.

```rust
pub fn on_event(event: &Event) {
    match event {
        Event::WindowEvent { .. } => { }
        Event::AppEvent { .. } => { }
        _ => {}
    }
}
```

**Use for**:

- Handle window events
- React to app lifecycle
- Manage state changes

#### 5. On Drop

Triggered during plugin destruction (app shutdown).

```rust
impl Drop for MyPlugin {
    fn drop(&mut self) {
        // Cleanup resources
        // Save state
        // Disconnect services
    }
}
```

**Use for**:

- Clean resources
- Save state
- Disconnect connections

### Command System

Commands bridge Rust and JavaScript/TypeScript.

#### Rust Implementation

```rust
use tauri::{AppHandle, Webview, State};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct MyResponse {
    pub message: String,
}

#[tauri::command]
pub async fn my_command(
    app: AppHandle,                    // App handle (dependency injection)
    query: String,                     // Arguments
    state: State<'_, MyPluginState>,   // Shared state access
) -> Result<MyResponse, String> {
    // Async operation - non-blocking
    let result = process_query(&query).await?;

    Ok(MyResponse {
        message: result,
    })
}
```

#### JavaScript/TypeScript Usage

```typescript
import { invoke } from "@tauri-apps/api/core";

interface MyResponse {
  message: string;
}

// Call the command
const response = await invoke<MyResponse>("my_command", {
  query: "search term",
});

console.log(response.message);
```

### Command Arguments and Return Values

**Arguments**:

- Passed as JSON objects
- JavaScript uses camelCase → converted to snake_case in Rust
- Must implement `serde::Deserialize`

**Return Values**:

- Must implement `serde::Serialize`
- Wrapped in `Result<T, String>` for error handling
- Can be async (`async fn`)

#### Advanced Dependency Injection

```rust
#[tauri::command]
pub async fn advanced_command(
    app: AppHandle,              // Full app handle
    window: Window,              // Specific window
    state: State<SharedState>,   // Access state
    webview: &Webview,           // Webview reference
) -> Result<String, String> {
    // Can inject multiple dependencies
    Ok("success".to_string())
}
```

Available injectables:

- `AppHandle` - App reference
- `Window` - Window reference
- `State<T>` - Access managed state
- `Webview` - Webview reference

### Permission Model

All commands require explicit permissions for security.

#### Permission System

```json
// capabilities/default.json
{
  "version": 1,
  "identifier": "default",
  "description": "Default capability",
  "windows": ["main"],
  "permissions": ["shell:allow-execute", "shell:allow-open", "core:default"]
}
```

#### Permission Scopes

**Allow/Deny**:

```json
{
  "allow": ["shell:allow-execute"],
  "deny": []
}
```

**Scoped Permissions** (with restrictions):

```json
{
  "allow": [
    {
      "shell": {
        "execute": {
          "scope": ["echo", "ls"] // Only allow these commands
        }
      }
    }
  ]
}
```

#### Permission Sets

Group related permissions for easier management:

```json
{
  "default-web-api": ["core:default", "window:default"],
  "shell": ["shell:allow-execute", "shell:allow-open"]
}
```

### Using Plugins

#### Installation

```bash
npm run tauri add plugin-name
# or
npm install @tauri-apps/plugin-plugin-name
cargo add @tauri-apps/plugin-plugin-name
```

#### Rust Registration

```rust
// src-tauri/src/main.rs
use tauri_plugin_plugin_name::PluginBuilder;

fn main() {
    tauri::Builder::default()
        .plugin(PluginBuilder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### Frontend Usage

```typescript
import { invoke } from "@tauri-apps/api/core";
import { MyApi } from "@tauri-apps/plugin-plugin-name";

// Direct invoke
const result = await invoke("plugin_command");

// Or plugin API (if provided)
const api = new MyApi();
await api.method();
```

---

## Updater Plugin

### Overview

The Updater plugin enables automatic application updates with cryptographic signature verification.

**Important**: "Tauri's updater needs a signature to verify that the update is from a trusted source. This cannot be disabled."

### Installation

```bash
npm run tauri add updater
# or
npm install @tauri-apps/plugin-updater
cargo add tauri-plugin-updater
```

### Key Setup Requirements

#### 1. Generate Signing Keys

```bash
npm run tauri signer generate
# or if tauri CLI installed globally
tauri signer generate
```

This creates:

- `tauri-key.pem` - **Private key (KEEP SECRET)**
- `tauri-key.pem.pub` - Public key (include in config)

**Security**:

- Add `tauri-key.pem` to `.gitignore`
- Set via `TAURI_SIGNING_PRIVATE_KEY` environment variable during builds
- Never commit private key

#### 2. Configuration

```json
{
  "build": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://api.example.com/updates/{{current_version}}/{{target}}/{{arch}}"
      ],
      "pubkey": "paste-your-public-key-here",
      "dialog": true,
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

### Configuration Options

**endpoints** (required):

- Array of URLs to check for updates
- Supports variable interpolation:
  - `{{current_version}}` - Current app version
  - `{{target}}` - Platform (e.g., "windows", "macos", "linux")
  - `{{arch}}` - Architecture (e.g., "x86_64", "aarch64")

**pubkey** (required):

- Your public key from `tauri-key.pem.pub`
- Base64 encoded

**dialog**:

- Show update notification dialog
- Default: true

**windows.installMode**:

- `passive` - Install silently on exit
- `active` - Prompt user to install

### Update File Formats

#### Static JSON Format

Host a `latest.json` file:

```json
{
  "version": "1.1.0",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2025-01-15T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "signature-string-here",
      "url": "https://example.com/MyApp-1.1.0.exe"
    },
    "macos-aarch64": {
      "signature": "signature-string-here",
      "url": "https://example.com/MyApp-1.1.0.dmg"
    },
    "linux-x86_64": {
      "signature": "signature-string-here",
      "url": "https://example.com/MyApp-1.1.0.AppImage"
    }
  }
}
```

**Platform Keys Format**: `{OS}-{ARCH}`

- Windows: `windows-x86_64`, `windows-aarch64`
- macOS: `macos-aarch64`, `macos-x86_64`
- Linux: `linux-x86_64`, `linux-aarch64`

#### Dynamic Server Response

**When update available (200 OK)**:

```json
{
  "version": "1.1.0",
  "signature": "signature-string-here",
  "url": "https://example.com/MyApp-1.1.0.exe",
  "notes": "New version available",
  "date": "2025-01-15T12:00:00Z"
}
```

**When no update available (204 No Content)**:

- Empty response body
- Triggers `tauri > check` hook with `upToDate: true`

### API Usage

#### TypeScript/JavaScript

```typescript
import { check, install } from "@tauri-apps/plugin-updater";

// Check for updates
const { shouldUpdate, manifest } = await check();

if (shouldUpdate) {
  console.log(`Update available: ${manifest?.version}`);

  // Download update
  let downloaded = 0;
  let contentLength = 0;

  const unlisten = await manifest?.downloadProgress((progress) => {
    downloaded = progress.chunkSize;
    contentLength = progress.contentLength;
    console.log(`Downloaded ${downloaded} of ${contentLength}`);
  });

  // Install update
  await install();

  // Restart app
  await relaunch();
}
```

#### Rust

```rust
use tauri_plugin_updater::UpdateExt;

pub async fn check_updates(app: tauri::AppHandle) {
    match app.updater().check().await {
        Ok(update) => {
            if update.is_update_available() {
                println!("Update available: {}", update.latest_version());

                let _ = update.download_and_install().await;
                let _ = app.restart();
            }
        }
        Err(e) => eprintln!("Update check failed: {}", e),
    }
}
```

### Signature Generation

#### For Static Bundles

When `createUpdaterArtifacts: true`, Tauri generates signature files:

```bash
npm run tauri build -- --sign
```

Creates:

- Application bundle (e.g., `.exe`, `.dmg`, `.AppImage`)
- `.sig` file containing the signature

**Environment Variable**:

```bash
# Must be set before build
export TAURI_SIGNING_PRIVATE_KEY=$(cat tauri-key.pem)
npm run tauri build
```

### Common Update Patterns

#### Pattern 1: Check on Startup

```typescript
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/api/process";

export async function initializeUpdates() {
  const { shouldUpdate, manifest } = await check();

  if (shouldUpdate) {
    // Notify user or update automatically
    await manifest?.install();
    await relaunch();
  }
}

// Call in app initialization
initializeUpdates();
```

#### Pattern 2: Manual Update Check with UI

```typescript
import { check, install } from "@tauri-apps/plugin-updater";

export async function updateApp() {
  try {
    const { shouldUpdate, manifest } = await check();

    if (!shouldUpdate) {
      console.log("App is up to date");
      return;
    }

    // Show progress UI
    const unlisten = await manifest?.downloadProgress((progress) => {
      updateProgressBar((progress.chunkSize / progress.contentLength) * 100);
    });

    // Download and install
    await manifest?.downloadAndInstall();

    unlisten?.();

    // Prompt restart
    showRestartDialog();
  } catch (error) {
    console.error("Update failed:", error);
  }
}
```

#### Pattern 3: Scheduled Background Updates

```typescript
import { check, install } from "@tauri-apps/plugin-updater";

export function setupBackgroundUpdates() {
  // Check for updates every hour
  setInterval(
    async () => {
      const { shouldUpdate, manifest } = await check();

      if (shouldUpdate) {
        // Silently download and install
        await manifest?.downloadAndInstall();
      }
    },
    60 * 60 * 1000
  );
}
```

### Common Mistakes to Avoid

1. **Not protecting private key** - Use environment variables, never commit
2. **Mismatched signatures** - Ensure key used for signing matches public key in config
3. **Incorrect platform names** - Use `{OS}-{ARCH}` format exactly
4. **Not testing locally** - Test update flow before production deployment
5. **Version comparison issues** - Ensure versions follow semantic versioning
6. **Not setting CSP for signature verification** - May block verification requests

---

## Shell Plugin

### Overview

The Shell plugin enables spawning and managing child processes, and opening URLs/URIs.

**Important**: For accessing current process (exit, restart), use the Process plugin instead.

### Installation

```bash
npm run tauri add shell
```

### Core Functionality

- Execute shell commands
- Manage processes (kill, terminate)
- Read stdout/stderr
- Write to stdin
- Open URLs and URIs

### Platform Support

| Platform | Support Level       |
| -------- | ------------------- |
| Windows  | Full                |
| macOS    | Full                |
| Linux    | Full                |
| Android  | `open` command only |
| iOS      | `open` command only |

### Usage

#### TypeScript/JavaScript

```typescript
import { Command } from "@tauri-apps/plugin-shell";

// Execute shell command
const output = await Command.create("exec-sh", [
  "-c",
  'echo "Hello"',
]).execute();
console.log(output.stdout);

// Execute system command
const result = await Command.create("ls", ["-la"]).execute();
console.log(result.code); // Exit code
console.log(result.stdout); // Standard output
console.log(result.stderr); // Standard error

// Kill a process
const child = new Command("long-running-process");
child.spawn();
// Later...
child.kill();
```

#### Rust

```rust
use tauri_plugin_shell::ShellExt;

pub async fn execute_command(app: tauri::AppHandle) {
    let output = app
        .shell()
        .execute_command('ls', None)
        .output()
        .await;

    match output {
        Ok(output) => {
            println!("Exit code: {}", output.status.code());
            println!("stdout: {}", String::from_utf8_lossy(&output.stdout));
        }
        Err(e) => eprintln!("Command failed: {}", e),
    }
}
```

### Command Configuration

```typescript
const command = Command.create("ls", ["-la", "/tmp"])
  .withCwd("/home/user")
  .withEnv("MY_VAR", "value");

const output = await command.execute();
```

**Options**:

- `withCwd(path)` - Set working directory
- `withEnv(key, value)` - Set environment variables
- `execute()` - Run and wait for completion
- `spawn()` - Run in background
- `kill()` - Terminate process

### Opening URLs/URIs

```typescript
import { open } from "@tauri-apps/plugin-shell";

// Open URL in default browser
await open("https://example.com");

// Open URI schemes
await open("mailto:user@example.com");
await open("tel:+1234567890");
await open("sms:+1234567890");
```

### Security Model

All shell commands require explicit permissions.

#### Default Permission

Only `allow-open` is granted by default (safe for URLs).

#### Dangerous Permissions

```json
{
  "capabilities": [
    {
      "allow": [
        {
          "shell": {
            "execute": {
              "scope": ["echo", "ls", "cat"] // Whitelist specific commands
            }
          }
        }
      ]
    }
  ]
}
```

#### Best Practices

1. **Use whitelist scope** - Never allow all commands
2. **Validate input** - Sanitize command arguments
3. **Use least privilege** - Only enable needed commands
4. **Avoid user input in commands** - Use arguments array instead of shell string

---

## IPC and Commands

### Inter-Process Communication

Tauri implements **Asynchronous Message Passing** for backend-frontend communication.

**Key Advantage**: Recipients can reject or discard suspicious requests, enabling better security than shared memory.

### Two IPC Primitives

#### 1. Commands (Recommended)

Type-safe function calls with arguments and return values.

**Characteristics**:

- Synchronous or asynchronous
- Type-safe (TypeScript + Rust types match)
- Request/response pattern
- Error handling via Result type

**Rust Implementation**:

```rust
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[tauri::command]
pub async fn fetch_data(id: u32) -> Result<String, String> {
    // Async operation
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

    if id > 0 {
        Ok(format!("Data for ID: {}", id))
    } else {
        Err("Invalid ID".to_string())
    }
}

// Register in main.rs
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![greet, fetch_data])
    .run(tauri::generate_context!())
```

**Frontend Usage**:

```typescript
import { invoke } from "@tauri-apps/api/core";

// Call synchronous command
const greeting = await invoke<string>("greet", { name: "World" });

// Call asynchronous command with error handling
try {
  const data = await invoke<string>("fetch_data", { id: 123 });
  console.log(data);
} catch (error) {
  console.error("Command failed:", error);
}
```

#### 2. Events (One-Way Messaging)

Fire-and-forget messaging without expecting responses.

**Characteristics**:

- One-way communication
- No response expected
- Less type-safe (JSON-based)
- Good for lifecycle events and state changes

**Rust - Emit to Frontend**:

```rust
#[tauri::command]
pub fn notify_frontend(app_handle: tauri::AppHandle) {
    app_handle.emit_all("event-name", json!({"message": "Hello"}))
        .expect("Failed to emit event");
}

// Or emit to specific window
if let Some(window) = app_handle.get_window("main") {
    window.emit("event-name", json!({"data": "value"})).ok();
}
```

**Frontend - Listen**:

```typescript
import { listen, emit } from "@tauri-apps/api/event";

// Listen for events
const unlisten = await listen("event-name", (event) => {
  console.log("Received:", event.payload);
});

// Emit event to backend
await emit("frontend-event", { key: "value" });

// Stop listening (cleanup)
unlisten();
```

### Advanced Command Features

#### Dependency Injection

```rust
#[tauri::command]
pub async fn advanced(
    app: tauri::AppHandle,        // App instance
    window: tauri::Window,         // Window reference
    state: tauri::State<MyState>,  // Shared state
) -> Result<String, String> {
    // Access app, window, and state
    Ok("Done".to_string())
}
```

#### Progress Callbacks (Channels)

```rust
use tauri::ipc::Channel;

#[tauri::command]
pub async fn long_operation(
    on_progress: Channel<f32>,  // Channel for progress
) -> Result<String, String> {
    for i in 0..10 {
        on_progress.send(i as f32 / 10.0).ok();
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    }
    Ok("Complete".to_string())
}
```

**Frontend**:

```typescript
import { invoke } from "@tauri-apps/api/core";

const onProgress = new Channel<number>();
onProgress.onmessage = (value) => {
  updateProgressBar(value);
};

await invoke("long_operation", { on_progress: onProgress });
```

#### Serialize/Deserialize Custom Types

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct QueryOptions {
    #[serde(rename = "searchTerm")]  // Map JS camelCase to snake_case
    pub search_term: String,
    pub limit: u32,
}

#[derive(Serialize, Deserialize)]
pub struct QueryResult {
    pub id: u32,
    pub title: String,
}

#[tauri::command]
pub async fn query(options: QueryOptions) -> Result<Vec<QueryResult>, String> {
    // Process with type safety
    Ok(vec![])
}
```

### Security Considerations

#### Command Permissions

All commands must have explicit permissions in capabilities:

```json
{
  "permissions": ["core:default", "shell:allow-execute"]
}
```

#### Input Validation

Always validate inputs from the frontend:

```rust
#[tauri::command]
pub fn process_user_input(input: String) -> Result<String, String> {
    // Validate length
    if input.len() > 1000 {
        return Err("Input too long".to_string());
    }

    // Sanitize/validate format
    if !input.chars().all(|c| c.is_alphanumeric() || c == ' ') {
        return Err("Invalid characters".to_string());
    }

    Ok(format!("Processed: {}", input))
}
```

---

## Building & Deployment

### Build Process

#### Development Build

```bash
npm run tauri dev
```

Executes:

1. Frontend dev server starts (e.g., Vite)
2. Rust backend compiles
3. Application window opens
4. Frontend and Rust changes trigger hot-reload

#### Production Build

```bash
npm run tauri build
```

Or with specific options:

```bash
# Build without bundling (just compile)
npm run tauri build -- --no-bundle

# Build specific bundle types
npm run tauri bundle -- --bundles app,dmg
```

Executes:

1. `beforeBuildCommand` (build frontend)
2. Frontend minification and optimization
3. Rust compilation in release mode
4. App bundling for target platform
5. Code signing (if configured)

### Version Management

Configure version in `tauri.conf.json`:

```json
{
  "version": "1.0.0"
}
```

Or reference `package.json`:

```json
{
  "version": "../package.json"
}
```

### Code Signing

Code signing validates your identity as the app provider.

#### macOS Signing

```bash
# Set environment variables
export APPLE_CERTIFICATE=$(cat ~/apple-cert.p8)
export APPLE_CERTIFICATE_PASSWORD="your-password"
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAM_ID)"

npm run tauri build
```

#### Windows Signing

```bash
export SIGN_PARAMS="-f path/to/cert.pfx -p password"

npm run tauri build
```

#### Linux

Linux packages typically don't require signing but can use GPG signatures.

### Platform-Specific Builds

Build only for specific platforms:

```bash
# macOS (only on macOS)
npm run tauri build -- --target universal-apple-darwin

# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc

# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

### Distribution Channels

#### Linux

**AppImage**: Single binary, works on most distributions

```bash
npm run tauri build -- --bundles appimage
```

**Debian (.deb)**: Package for Debian-based systems

```bash
npm run tauri build -- --bundles deb
```

**Others**: RPM, Snapcraft, AUR, Flatpak

#### macOS

**DMG**: Direct download and install

```bash
npm run tauri build -- --bundles dmg
```

**App Store**: Special bundle for Apple App Store

- Requires code signing and App Store credentials
- Different bundle format

#### Windows

**NSIS Installer**: Standard .exe installer

```bash
npm run tauri build -- --bundles nsis
```

**Microsoft Store**: UWP app package

- Requires Microsoft Store registration

### Application Size Optimization

#### Cargo Profile Configuration

Add to `Cargo.toml`:

```toml
[profile.release]
codegen-units = 1        # Better optimization
lto = true               # Link-time optimization
opt-level = "s"          # Optimize for size
panic = "abort"          # Remove unwinding overhead
strip = true             # Remove debug symbols
```

This can reduce size by 50% or more.

#### Remove Unused Commands

In `tauri.conf.json`:

```json
{
  "build": {
    "removeUnusedCommands": true
  }
}
```

This analyzes capability files and strips unused commands from the binary.

**Requirements**: Tauri v2.4+ (including tauri-build, tauri-plugin, tauri-cli)

**Best Practice**: Define capabilities with only the commands your app needs, never use catch-all permissions.

---

## Security

### Content Security Policy (CSP)

CSP restricts which resources can be loaded and from where.

#### Default CSP

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'"
    }
  }
}
```

This only allows resources from your app (`'self'`).

#### Common CSP Policies

```json
{
  "csp": "default-src 'self'; img-src 'self' https://cdn.example.com"
}
```

**Directives**:

- `default-src` - Fallback for all resource types
- `img-src` - Image sources
- `script-src` - JavaScript sources
- `style-src` - Stylesheet sources
- `font-src` - Font sources
- `connect-src` - Fetch/WebSocket/EventSource sources

### Capabilities and Permissions

Capabilities define which Tauri commands and system APIs are available.

#### Example Capability File

Create `src-tauri/capabilities/default.json`:

```json
{
  "version": 1,
  "identifier": "default",
  "description": "Default capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "shell:allow-execute",
    "updater:default"
  ]
}
```

#### Windows

```json
{
  "windows": ["main", "about"] // These windows can use this capability
}
```

Specify which windows have access, or omit for all windows.

#### Scoped Permissions

Restrict commands to specific arguments:

```json
{
  "permissions": [
    {
      "shell": {
        "execute": {
          "scope": ["echo", "ls"] // Only these commands allowed
        }
      }
    }
  ]
}
```

#### Permission Sets

Group related permissions:

```json
{
  "default": ["core:default", "window:default"],
  "dangerous": ["shell:allow-execute"]
}
```

### Best Practices

1. **Principle of Least Privilege** - Only enable permissions needed
2. **Input Validation** - Always validate frontend input in Rust
3. **Use Scoped Permissions** - Never allow all commands
4. **CSP Headers** - Keep CSP restrictive
5. **Audit Capabilities** - Review permissions regularly
6. **Minimize Attack Surface** - Remove unused plugins and commands

---

## Development Workflow

### Setting Up Development Environment

#### 1. Prerequisites

Ensure all prerequisites are installed (Rust, Node.js, platform-specific tools).

#### 2. Create Project

```bash
npm create tauri-app@latest
cd your-app
```

#### 3. Install Dependencies

```bash
npm install
```

#### 4. Start Development Server

```bash
npm run tauri dev
```

### Development Server

#### devUrl Configuration

In `tauri.conf.json`:

```json
{
  "build": {
    "devUrl": "http://localhost:5173"
  }
}
```

This tells Tauri where your frontend dev server is running.

#### Frontend Development Server

Each framework has different dev servers:

**Vite** (React, Vue, Svelte, etc.):

```bash
npm run dev
# Starts on http://localhost:5173
```

**Next.js**:

```bash
npm run dev
# Starts on http://localhost:3000
```

**Angular**:

```bash
npm start
# Starts on http://localhost:4200
```

#### Hot-Reload

Both frontend and Rust changes trigger hot-reload:

- **Frontend changes**: Reload automatically via dev server
- **Rust changes**: Recompile backend and reload window

### Debugging

#### Desktop Debugging

**DevTools Access**:

- Right-click in window → Inspect
- Windows/Linux: Ctrl+Shift+I
- macOS: Cmd+Option+I

**Console Inspection**:

```rust
// In Rust
println!("Debug message: {:?}", value);
```

```typescript
// In Frontend
console.log("Debug message:", value);
```

#### Mobile Debugging

**iOS** (via Safari):

1. Enable Web Inspector on device
2. Open Safari on Mac
3. Develop menu → Select device/page

**Android** (via Chrome):

1. Connect device via USB
2. Open `chrome://inspect` in Chrome
3. Select app and inspect

### Testing

#### Unit Tests

```bash
npm test
# Runs frontend tests
```

#### Integration Tests

Test Rust backend:

```bash
cd src-tauri
cargo test
```

#### E2E Tests

Using Playwright or similar:

```bash
npm run test:e2e
```

### Version Control

#### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "feat: description"

# Push and create PR
git push origin feature/your-feature
```

#### Files to Ignore

Add to `.gitignore`:

```
src-tauri/target/
.next/
dist/
node_modules/
src-tauri/tauri-key.pem        # Private signing key
.env.local                       # Local environment
*.pem                            # Certificates
*.key                            # Keys
```

#### Important Files to Commit

- `src-tauri/Cargo.lock` - Lock dependencies
- `tauri.conf.json` - Configuration
- `capabilities/` - Security definitions

### Building for Release

#### Local Release Build

```bash
npm run tauri build
```

Creates platform-specific installers:

- Windows: `.exe` in `src-tauri/target/release/bundle/nsis/`
- macOS: `.dmg` in `src-tauri/target/release/bundle/dmg/`
- Linux: `.AppImage` in `src-tauri/target/release/bundle/appimage/`

#### With Code Signing

Set environment variables before building:

```bash
export TAURI_SIGNING_PRIVATE_KEY=$(cat tauri-key.pem)
npm run tauri build
```

---

## Common Patterns

### Pattern 1: Tray Application (Minimize to Tray)

**Configuration**:

```json
{
  "app": {
    "windows": [
      {
        "title": "My App",
        "width": 800,
        "height": 600
      }
    ],
    "tray": {
      "iconPath": "icons/icon.png",
      "tooltip": "My App"
    }
  }
}
```

**Frontend**:

```typescript
import { appWindow } from "@tauri-apps/api/window";

async function minimizeToTray() {
  if (await appWindow.isVisible()) {
    await appWindow.hide();
  } else {
    await appWindow.show();
    await appWindow.setFocus();
  }
}
```

### Pattern 2: Multi-Window Application

**Create Additional Windows**:

```rust
use tauri::WindowUrl;

#[tauri::command]
pub fn open_settings_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    let url = WindowUrl::App("settings.html".into());

    tauri::window::WindowBuilder::new(&app_handle, "settings", url)
        .title("Settings")
        .width(400.0)
        .height(300.0)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}
```

**Frontend**:

```typescript
import { invoke } from "@tauri-apps/api/core";
import { appWindow } from "@tauri-apps/api/window";

// Open settings window
await invoke("open_settings_window");

// Get all windows
const windows = appWindow.appWindow.manager.appWindows;
```

### Pattern 3: Share State Between Windows

**Rust Backend**:

```rust
use std::sync::{Arc, Mutex};

struct AppState {
    data: Arc<Mutex<String>>,
}

#[tauri::command]
pub async fn get_shared_state(state: tauri::State<'_, AppState>) -> Result<String, String> {
    let data = state.data.lock()
        .map_err(|_| "Lock failed".to_string())?;
    Ok(data.clone())
}

#[tauri::command]
pub async fn set_shared_state(
    state: tauri::State<'_, AppState>,
    value: String,
) -> Result<(), String> {
    let mut data = state.data.lock()
        .map_err(|_| "Lock failed".to_string())?;
    *data = value;
    Ok(())
}

// In main.rs
tauri::Builder::default()
    .manage(AppState {
        data: Arc::new(Mutex::new(String::new())),
    })
    .invoke_handler(tauri::generate_handler![get_shared_state, set_shared_state])
    .run(tauri::generate_context!())
```

### Pattern 4: Application Settings Persistence

**Rust - Store Settings**:

```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,
    pub language: String,
    pub window_width: f64,
    pub window_height: f64,
}

#[tauri::command]
pub async fn save_settings(
    app_handle: tauri::AppHandle,
    settings: AppSettings,
) -> Result<(), String> {
    let config_dir = app_handle.path_resolver()
        .app_config_dir()
        .ok_or("No config dir")?;

    std::fs::create_dir_all(&config_dir)
        .map_err(|e| e.to_string())?;

    let path = config_dir.join("settings.json");
    let json = serde_json::to_string(&settings)
        .map_err(|e| e.to_string())?;

    std::fs::write(path, json)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn load_settings(
    app_handle: tauri::AppHandle,
) -> Result<AppSettings, String> {
    let config_dir = app_handle.path_resolver()
        .app_config_dir()
        .ok_or("No config dir")?;

    let path = config_dir.join("settings.json");

    if !path.exists() {
        return Ok(AppSettings::default());
    }

    let json = std::fs::read_to_string(path)
        .map_err(|e| e.to_string())?;

    serde_json::from_str(&json)
        .map_err(|e| e.to_string())
}
```

### Pattern 5: File Dialog with Rust Backend

**Frontend**:

```typescript
import { open, save } from "@tauri-apps/api/dialog";

async function selectFile() {
  const file = await open({
    multiple: false,
    filters: [
      {
        name: "JSON",
        extensions: ["json"],
      },
    ],
  });

  if (file) {
    // Send to backend
    const contents = await invoke("process_file", { path: file });
  }
}

async function saveFile() {
  const path = await save({
    defaultPath: "config.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });

  if (path) {
    await invoke("save_config", { path, data: {} });
  }
}
```

### Pattern 6: Long-Running Background Task

**Rust**:

```rust
use tokio::sync::Mutex as TokioMutex;
use std::sync::Arc;

struct TaskHandle {
    cancel: Arc<TokioMutex<bool>>,
}

#[tauri::command]
pub async fn start_background_task(
    app: tauri::AppHandle,
) -> Result<(), String> {
    let cancel = Arc::new(TokioMutex::new(false));
    let cancel_clone = cancel.clone();

    tokio::spawn(async move {
        loop {
            // Check if should cancel
            if *cancel_clone.lock().await {
                break;
            }

            // Do work
            println!("Working...");

            // Emit progress to frontend
            app.emit_all("task-progress", json!({"percent": 50}))
                .ok();

            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn cancel_background_task() -> Result<(), String> {
    // Signal cancellation
    Ok(())
}
```

**Frontend**:

```typescript
import { listen, emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

await invoke("start_background_task");

const unlisten = await listen("task-progress", (event) => {
  const { percent } = event.payload as any;
  updateProgressBar(percent);
});

// When done
unlisten();
await invoke("cancel_background_task");
```

### Pattern 7: System Tray with Menu

**Configuration**:

```json
{
  "app": {
    "tray": {
      "iconPath": "icons/icon.png",
      "tooltip": "My App",
      "showMenuOnLeftClick": false
    }
  }
}
```

**Frontend**:

```typescript
import { TrayIcon } from "@tauri-apps/api/tray";

async function setupTray() {
  const tray = new TrayIcon({
    tooltip: "My App",
    icon: "icons/icon.png",
    action: async (e) => {
      if (e.type === "Click") {
        // Show/hide window
      }
    },
  });

  await tray.set_menu([
    { label: "Settings", event: "open-settings" },
    { label: "About", event: "open-about" },
    { label: "Quit", event: "quit" },
  ]);
}
```

---

## Frontend Framework Integration

### Vite + React

Most common setup:

```bash
npm create vite@latest -- --template react
# OR
npm create tauri-app@latest (select React + Vite)
```

**Configuration** in `tauri.conf.json`:

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  }
}
```

### Vue + Vite

```bash
npm create tauri-app@latest (select Vue + Vite)
```

Similar configuration to React.

### Svelte + Vite

```bash
npm create tauri-app@latest (select Svelte + Vite)
```

### Next.js

Requires special configuration (not SSR-compatible):

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:3000",
    "frontendDist": ".next"
  }
}
```

**Key Limitation**: Must export static pages; avoid SSR.

### Angular

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm start",
    "devUrl": "http://localhost:4200",
    "frontendDist": "dist/your-app"
  }
}
```

---

## Key Takeaways

1. **Tauri = Tiny, Fast, Secure Binaries** - Use OS webview for 600KB apps
2. **Type-Safe IPC** - Commands bridge Rust and JavaScript with type safety
3. **Permissions First** - Always use specific, scoped permissions
4. **Signature Required** - Updater plugin needs cryptographic verification
5. **Flexible Frontend** - Works with any framework that produces static HTML/CSS/JS
6. **Cross-Platform** - Single codebase for Windows, macOS, Linux, Android, iOS
7. **Development First** - Hot-reload works for both frontend and Rust changes
8. **Size Matters** - Use Cargo profile and `removeUnusedCommands` for optimization

---

## References

- Official Documentation: https://v2.tauri.app
- GitHub Repository: https://github.com/tauri-apps/tauri
- Plugins Workspace: https://github.com/tauri-apps/plugins-workspace
- Security Policy: https://github.com/tauri-apps/tauri/security/policy
- Tauri 2.0 Audit Report: https://github.com/tauri-apps/tauri/blob/dev/audits/Radically_Open_Security-v2-report.pdf
