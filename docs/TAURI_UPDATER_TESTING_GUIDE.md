# Tauri Auto-Updater Testing Guide

**Last Updated:** 2025-12-15
**Status:** Ready for first release testing

This guide walks you through manually testing the Tauri auto-updater from start to finish.

---

## Prerequisites

✅ **Already Completed:**

- [x] Updater feature added to Cargo.toml
- [x] Signing keys generated and stored
- [x] GitHub Secrets configured (TAURI_PRIVATE_KEY, TAURI_KEY_PASSWORD)
- [x] tauri.conf.json configured with public key
- [x] Update check integrated into app startup
- [x] GitHub Actions workflow ready
- [x] Unit tests passing (8/8)

**What You Need:**

- Windows machine for testing (physical or VM)
- Admin privileges to install .msi files
- ~30 minutes for first test cycle

---

## Overview: Testing Strategy

We'll create two releases to test the full update cycle:

1. **Version 0.1.0** - Initial release (baseline)
2. **Version 0.1.1** - Update release (triggers updater)

The test validates:

- Installation works correctly
- App detects available updates
- Update downloads and installs
- App relaunches with new version

---

## Phase 1: Prepare Version 0.1.0

### Step 1.1: Update Version Numbers

Update version in **three files**:

**File 1: `src-tauri/Cargo.toml`**

```toml
[package]
version = "0.1.0"
```

**File 2: `src-tauri/tauri.conf.json`**

```json
{
  "package": {
    "version": "0.1.0"
  }
}
```

**File 3: `package.json`**

```json
{
  "version": "0.1.0"
}
```

### Step 1.2: Commit and Tag

```bash
git add -A
git commit -m "chore: Release v0.1.0 - Initial Tauri release"
git tag tauri-v0.1.0
git push origin test/re-enable-e2e-when-ready
git push origin tauri-v0.1.0
```

**⚠️ Important:** Use `tauri-v*` prefix (not just `v*`) to match workflow trigger.

### Step 1.3: Monitor GitHub Actions Build

**Option A: Via GitHub CLI**

```bash
# Get the workflow run ID
gh run list --workflow=release-tauri.yml --limit 1

# Watch the build (replace RUN_ID)
gh run watch <RUN_ID>
```

**Option B: Via Web Browser**

1. Go to: https://github.com/tuckerandrew21/EFT-Tracker/actions
2. Click on "Release Tauri App" workflow
3. Watch the build progress

**Expected Duration:** 5-10 minutes

**What's Happening:**

- Installing Node.js and Rust
- Running `npm ci` to install dependencies
- Running `npm run build:tauri` to create static export
- Building Windows MSI and NSIS installers
- Signing artifacts with your private key
- Generating `latest.json` manifest
- Creating draft release

### Step 1.4: Publish Draft Release

Once the build completes:

1. Go to: https://github.com/tuckerandrew21/EFT-Tracker/releases
2. Click on the **draft release** for `tauri-v0.1.0`
3. Review the assets (should include):
   - `EFT-Quest-Tracker_0.1.0_x64_en-US.msi`
   - `EFT-Quest-Tracker_0.1.0_x64-setup.exe` (NSIS)
   - `latest.json`
4. Click **"Publish release"**

**⚠️ Critical:** Do NOT mark as pre-release. The updater only checks "latest" releases.

---

## Phase 2: Test Version 0.1.0 Installation

### Step 2.1: Download Installer

From the published release page:

1. Download `EFT-Quest-Tracker_0.1.0_x64_en-US.msi`
2. Save to Downloads folder

### Step 2.2: Install Application

1. Double-click the `.msi` file
2. Follow the installer wizard:
   - Click "Next"
   - Accept license (if prompted)
   - Choose install location (or keep default)
   - Click "Install"
   - Click "Finish"

**Expected Results:**

- App installs to `C:\Program Files\EFT Quest Tracker\`
- Desktop shortcut created (optional)
- Start Menu entry added

### Step 2.3: Launch and Verify

**Launch the app:**

- From Start Menu: Search "EFT Quest Tracker"
- Or from Desktop shortcut

**Verify functionality:**

- [ ] App window opens without errors
- [ ] Console shows: "Checking for updates..."
- [ ] Console shows: "No updates available" (expected - no v0.1.1 yet)
- [ ] System tray icon appears in taskbar notification area
- [ ] App can be minimized to tray
- [ ] App can be restored from tray

**Check version:**

- Open DevTools (if enabled): `Ctrl+Shift+I` or right-click → Inspect
- Look for version in About section (if implemented)
- Or check installed program version in Windows Settings → Apps

### Step 2.4: Test System Tray

**Left-click tray icon:**

- [ ] Window shows/focuses

**Right-click tray icon:**

- [ ] Context menu appears with:
  - Show
  - Hide
  - Quit

**Close button (X):**

- [ ] App hides to tray instead of quitting

**Quit from menu:**

- [ ] App closes completely

---

## Phase 3: Create Update (Version 0.1.1)

### Step 3.1: Make a Small Change

Make a visible change so you can confirm the update installed.

**Example: Add version indicator**

Edit `src/components/header.tsx` (or any visible component):

```tsx
{
  /* Add near the top of the header */
}
<span className="text-xs text-muted-foreground">v0.1.1</span>;
```

### Step 3.2: Update Version Numbers

Update the same three files from Phase 1:

**`src-tauri/Cargo.toml`:**

```toml
version = "0.1.1"
```

**`src-tauri/tauri.conf.json`:**

```json
"version": "0.1.1"
```

**`package.json`:**

```json
"version": "0.1.1"
```

### Step 3.3: Commit and Tag

```bash
git add -A
git commit -m "chore: Release v0.1.1 - Test updater"
git tag tauri-v0.1.1
git push origin test/re-enable-e2e-when-ready
git push origin tauri-v0.1.1
```

### Step 3.4: Wait for Build and Publish

Repeat the same process from Phase 1:

1. Monitor GitHub Actions build
2. Wait for completion (~5-10 min)
3. Publish the draft release

---

## Phase 4: Test Auto-Update Flow

### Step 4.1: Launch v0.1.0

**Important:** Make sure v0.1.0 is still installed (don't uninstall it).

1. Launch the app (v0.1.0)
2. Watch the console output

**Expected Console Output:**

```
Checking for updates...
Update available: 0.1.1
```

### Step 4.2: Confirm Update Dialog

**A dialog should appear with:**

- Current version: 0.1.0
- New version: 0.1.1
- Prompt: "Would you like to install the update now?"

**Click "OK" to proceed.**

### Step 4.3: Download Progress

**Expected behavior:**

- Console shows: "Downloading and installing update..."
- Download happens in background
- Progress may or may not be visible (depends on implementation)

**This can take 30-60 seconds** depending on connection speed.

### Step 4.4: Installation Prompt

After download completes, another dialog appears:

**Message:**
"Update installed successfully! The app will now restart to apply the update."

**Click "OK"**

### Step 4.5: Verify Update

**App should:**

1. Close automatically
2. Relaunch with new version

**Verification checklist:**

- [ ] App relaunches automatically
- [ ] Window shows the change you made (e.g., "v0.1.1" text)
- [ ] Console shows: "Checking for updates..."
- [ ] Console shows: "No updates available" (correct - already on latest)
- [ ] All functionality still works (system tray, etc.)

---

## Phase 5: Negative Tests

### Test 5.1: Decline Update

1. Create another release (v0.1.2) using same process
2. Launch v0.1.1 app
3. When update prompt appears, click **"Cancel"**

**Expected:**

- [ ] Update not downloaded
- [ ] App continues running on v0.1.1
- [ ] No errors in console

### Test 5.2: Decline Relaunch

1. Launch v0.1.1 app again
2. Click "OK" to download update
3. When relaunch prompt appears, click **"Cancel"**

**Expected:**

- [ ] Update is downloaded and installed
- [ ] App does NOT relaunch
- [ ] App continues running on v0.1.1
- [ ] Next launch should detect already-installed update

### Test 5.3: No Internet Connection

1. Disconnect from internet
2. Launch app
3. Check console output

**Expected:**

- [ ] Console shows: "Checking for updates..."
- [ ] Console shows: "Update check failed: [error]"
- [ ] App continues running normally
- [ ] No crash or hang

---

## Troubleshooting

### Issue: "Browser is already in use"

**Cause:** Playwright MCP left a Chrome session open.

**Fix:**

```bash
Remove-Item -Recurse "$env:LOCALAPPDATA\ms-playwright\mcp-chrome-*" -Force
```

Or manually close Chrome windows with "Playwright" in title.

### Issue: Update dialog doesn't appear

**Checklist:**

1. Verify latest.json exists in the release assets
2. Check endpoint URL in tauri.conf.json is correct
3. Open DevTools and check console for errors
4. Verify public key in tauri.conf.json matches the one used for signing

**Debug:**

```typescript
// Temporarily add to src/lib/updater/check-updates.ts
console.log("Update check result:", update);
```

### Issue: "Signature verification failed"

**Causes:**

- Public key mismatch
- Private key changed between releases
- Corrupted download

**Fix:**

1. Verify public key in tauri.conf.json
2. Ensure TAURI_PRIVATE_KEY secret hasn't changed
3. Re-download the installer

### Issue: App doesn't relaunch

**Expected on Windows:** The app must fully exit before installation can proceed. This is a Windows limitation.

**Workaround:** Manual relaunch is acceptable. The update is still installed.

### Issue: Installer doesn't run

**Causes:**

- Antivirus blocking unsigned installer
- SmartScreen filter

**Fixes:**

1. Click "More info" on SmartScreen dialog
2. Click "Run anyway"
3. For production, consider code signing certificate

---

## Validation Checklist

After completing all phases, confirm:

### Configuration

- [ ] Updater enabled in tauri.conf.json
- [ ] Public key correctly configured
- [ ] Endpoint URL points to GitHub releases
- [ ] GitHub Secrets configured (TAURI_PRIVATE_KEY, TAURI_KEY_PASSWORD)

### Build System

- [ ] GitHub Actions workflow runs successfully
- [ ] Workflow generates MSI and NSIS installers
- [ ] Workflow signs artifacts
- [ ] Workflow creates latest.json
- [ ] Draft releases created automatically

### Functionality

- [ ] v0.1.0 installs without errors
- [ ] App launches and runs correctly
- [ ] System tray works as expected
- [ ] v0.1.1 update detected when available
- [ ] Update downloads successfully
- [ ] Update installs without errors
- [ ] App relaunches with new version
- [ ] Can decline update installation
- [ ] Can decline app relaunch
- [ ] Network errors handled gracefully

### Edge Cases

- [ ] Works without internet connection
- [ ] Multiple updates in sequence work
- [ ] Already-installed update doesn't re-download
- [ ] No update available handled correctly

---

## Production Readiness

Once all tests pass, you're ready for production releases:

### Before First Production Release:

1. **Update version to 1.0.0** in all three files
2. **Write release notes** in GitHub Release description
3. **Consider code signing certificate** (recommended for production)
4. **Update documentation** with installation instructions
5. **Test on clean VM** without dev tools installed

### Release Process (Ongoing):

1. Increment version numbers (follow semver)
2. Update CHANGELOG.md
3. Commit, tag, and push
4. Wait for GitHub Actions build
5. Test draft release on staging if available
6. Publish release
7. Announce to users

---

## Security Notes

**Signing Keys:**

- Keep `~/.tauri/eft-tracker.key` secure and backed up
- Never commit signing keys to git
- Store TAURI_KEY_PASSWORD in password manager
- Losing keys means users can't update (must reinstall)

**GitHub Secrets:**

- Rotate if compromised
- Regenerate keys if needed (requires all users to reinstall)
- Only repository maintainers should have access

**Updater Endpoint:**

- Always use HTTPS (enforced in production builds)
- Signature verification prevents MITM attacks
- Updates can't be installed without valid signature

---

## Additional Resources

**Tauri Documentation:**

- [Auto-Updater Guide](https://v2.tauri.app/plugin/updater/)
- [GitHub Actions Setup](https://v2.tauri.app/distribute/pipelines/github/)

**Project Files:**

- Configuration: `src-tauri/tauri.conf.json`
- Workflow: `.github/workflows/release-tauri.yml`
- Update Logic: `src/lib/updater/check-updates.ts`
- Tests: `__tests__/unit/lib/updater/check-updates.test.ts`

**Monitoring:**

- GitHub Actions: https://github.com/tuckerandrew21/EFT-Tracker/actions
- Releases: https://github.com/tuckerandrew21/EFT-Tracker/releases

---

## Support

If you encounter issues not covered in this guide:

1. Check console output for error messages
2. Review GitHub Actions logs for build failures
3. Verify all configuration files match this guide
4. Consult Tauri documentation for advanced scenarios
5. Open issue in repository for project-specific problems

---

**Next Step:** Start with Phase 1 when ready to test!
