# Tauri Companion App - Phase 5: Testing & Release

This guide covers the final phase of the Tauri companion app implementation: generating signing keys, testing builds, and creating the first release.

## Prerequisites

- ✅ Phases 1-4 completed and merged to master
- ✅ Rust toolchain installed
- ✅ Windows development environment
- ✅ GitHub repository access with permissions to add secrets

## Step 1: Generate Signing Keys

Tauri uses cryptographic signatures to verify updates are authentic and haven't been tampered with.

### Generate the key pair:

```bash
npx tauri signer generate -w src-tauri/tauri.key
```

**You will be prompted for a password.** Choose a strong password and **save it securely** - you'll need it for:

1. Adding to GitHub Secrets (TAURI_KEY_PASSWORD)
2. Future manual builds

### Output:

The command will generate:

- `src-tauri/tauri.key` - Private key (DO NOT COMMIT)
- `src-tauri/tauri.key.pub` - Public key (will be committed)
- Console output with the private key string

**IMPORTANT:** Copy the entire private key output (including the header/footer lines). You'll need this for GitHub Secrets.

### Add to .gitignore:

Verify that `src-tauri/tauri.key` is ignored:

```bash
# Should already be in .gitignore
echo "src-tauri/tauri.key" >> .gitignore
```

## Step 2: Add GitHub Secrets

Navigate to: `https://github.com/tuckerandrew21/EFT-Tracker/settings/secrets/actions`

### Add two secrets:

1. **TAURI_PRIVATE_KEY**
   - Value: The entire private key output from Step 1 (multi-line string)
   - Example format:
     ```
     -----BEGIN PRIVATE KEY-----
     dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5
     ...
     -----END PRIVATE KEY-----
     ```

2. **TAURI_KEY_PASSWORD**
   - Value: The password you chose when generating the key
   - Keep this simple but secure

## Step 3: Update tauri.conf.json

Add the public key to enable update verification:

```bash
# Read the public key
cat src-tauri/tauri.key.pub
```

Edit `src-tauri/tauri.conf.json` and add the public key to the updater section:

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/tuckerandrew21/EFT-Tracker/releases/latest/download/latest.json"
      ],
      "dialog": false,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

Replace `YOUR_PUBLIC_KEY_HERE` with the content from `src-tauri/tauri.key.pub`.

**Commit the changes:**

```bash
git add src-tauri/tauri.conf.json src-tauri/tauri.key.pub
git commit -m "feat: Add Tauri update verification public key"
git push origin master
```

## Step 4: Test Local Build

Before creating a release, test the build locally:

```bash
# Clean build
npm run build:tauri

# Then build the Tauri app
npm run tauri:build
```

**Build time:** ~5-10 minutes for first build (Rust compilation)

### Build artifacts location:

```
src-tauri/target/release/bundle/
├── msi/              # Windows MSI installer
│   └── EFT Quest Tracker_0.1.0_x64_en-US.msi
└── nsis/             # NSIS installer
    └── EFT Quest Tracker_0.1.0_x64-setup.exe
```

## Step 5: Test the Installer

### On your development machine:

1. Close any running instances of the app
2. Run the MSI installer:
   ```bash
   start src-tauri/target/release/bundle/msi/*.msi
   ```
3. Follow the installation wizard
4. Launch the app from the Start Menu or Desktop

### Verify functionality:

- [ ] App launches successfully
- [ ] System tray icon appears
- [ ] Left-click tray icon shows/focuses window
- [ ] Right-click tray icon shows menu (Show/Hide/Quit)
- [ ] Close button hides to tray (doesn't quit)
- [ ] Quit from tray menu exits the app
- [ ] App displays the quest tracker UI
- [ ] Network requests go to https://learntotarkov.com

### Check for errors:

Look for console errors or network failures. The app should function identically to the web version.

## Step 6: Create First Release

Once local testing passes, create the first release tag to trigger GitHub Actions:

```bash
# Create and push the release tag
git tag -a tauri-v0.1.0 -m "Release v0.1.0 - Initial Tauri companion app"
git push origin tauri-v0.1.0
```

### Monitor the GitHub Actions workflow:

```bash
# Watch the workflow run
gh run watch
```

Or visit: `https://github.com/tuckerandrew21/EFT-Tracker/actions`

**Build time:** ~3-5 minutes

### What happens:

1. GitHub Actions checks out the code
2. Installs Node.js and Rust
3. Runs `npm run build:tauri` to build Next.js static export
4. Runs `npm run tauri:build` to build Windows installers
5. Signs the installers with TAURI_PRIVATE_KEY
6. Creates a draft release with:
   - MSI installer
   - NSIS installer
   - Update manifest (latest.json)
   - Signatures for verification

## Step 7: Publish the Release

1. Go to: `https://github.com/tuckerandrew21/EFT-Tracker/releases`
2. Find the draft release for `tauri-v0.1.0`
3. Review the release notes
4. Click **"Publish release"**

### The release will include:

- `EFT.Quest.Tracker_0.1.0_x64_en-US.msi` - MSI installer
- `EFT.Quest.Tracker_0.1.0_x64_en-US.msi.sig` - MSI signature
- `EFT.Quest.Tracker_0.1.0_x64-setup.exe` - NSIS installer
- `EFT.Quest.Tracker_0.1.0_x64-setup.exe.sig` - NSIS signature
- `latest.json` - Update manifest with version info and download URLs

## Step 8: Test Auto-Update (Optional)

To test the auto-updater:

1. Install the v0.1.0 release
2. Make a small change (e.g., update version to 0.1.1)
3. Create a new release tag: `tauri-v0.1.1`
4. Launch the v0.1.0 app
5. The app should detect the update and prompt to install

**Note:** This requires having published v0.1.1, so this is optional for now.

## Troubleshooting

### Build fails with "Rust not found"

Install Rust:

```bash
winget install --id Rustlang.Rustup
```

### Build fails with "WebView2 not found"

Install WebView2 Runtime:

```bash
winget install Microsoft.EdgeWebView2Runtime
```

### "Failed to sign" error in GitHub Actions

Check that:

- TAURI_PRIVATE_KEY is set correctly (including header/footer lines)
- TAURI_KEY_PASSWORD matches the password from key generation
- Both secrets are available to the repository

### Installer runs but app won't start

Check Event Viewer (Windows Logs → Application) for crash details. Common issues:

- Missing WebView2 Runtime
- Antivirus blocking the app
- Corrupted installation (try NSIS installer instead of MSI)

### App starts but API calls fail

Check browser console (F12) for errors. Common issues:

- CORS headers not configured (should be fixed in next.config.ts)
- Production API is down
- Network firewall blocking requests

## Success Criteria

Phase 5 is complete when:

- [x] Signing keys generated and stored securely
- [x] GitHub Secrets configured (TAURI_PRIVATE_KEY, TAURI_KEY_PASSWORD)
- [x] Public key added to tauri.conf.json
- [x] Local build succeeds and produces installers
- [x] Manual installation and testing passes all checks
- [x] GitHub Actions workflow builds successfully
- [x] Draft release is created automatically
- [x] Release is published with all artifacts
- [ ] Auto-update tested (optional, requires second release)

## Next Steps

After Phase 5:

1. **Announce the release** - Share download link with users
2. **Monitor feedback** - Watch for bug reports and feature requests
3. **Plan updates** - Schedule regular releases for new features
4. **Iterate** - Add features like:
   - Auto-update on startup
   - Desktop notifications for quest completions
   - Custom window icons from brand assets
   - Keyboard shortcuts for common actions

## Additional Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Tauri Updater Guide](https://tauri.app/v1/guides/distribution/updater)
- [GitHub Actions for Tauri](https://github.com/tauri-apps/tauri-action)
- [Code Signing on Windows](https://tauri.app/v1/guides/building/windows)
