# Tauri Release Verification Checklist

This checklist verifies the complete auto-update workflow is working correctly.

## Pre-Release Setup

- [ ] Public key extracted from `TAURI_PRIVATE_KEY` secret
- [ ] Public key added to `apps/companion/src-tauri/tauri.conf.json`
- [ ] Failed tag deleted: `git tag -d tauri-v0.1.0 && git push origin :refs/tags/tauri-v0.1.0`

## Release v0.1.0 Build

```bash
./scripts/release-tauri.sh 0.1.0
./scripts/wait-for-build.sh
./scripts/publish-release.sh
```

### Verification Steps

1. **GitHub Actions Build**
   - [ ] Workflow starts automatically when tag is pushed
   - [ ] Workflow completes without errors (check logs if failed)
   - [ ] Build succeeds on Windows platform

2. **Release Assets**
   - [ ] Go to: https://github.com/tuckerandrew21/EFT-Tracker/releases
   - [ ] Find `tauri-v0.1.0` release
   - [ ] Files present:
     - [ ] `EFT-Tracker-Companion_0.1.0_x64_en-US.msi`
     - [ ] `EFT-Tracker-Companion_0.1.0_x64-setup.exe` (optional)
     - [ ] `latest.json`

3. **Verify latest.json**

   ```bash
   curl -L https://github.com/tuckerandrew21/EFT-Tracker/releases/download/tauri-v0.1.0/latest.json
   ```

   Should contain:
   - [ ] `"version": "0.1.0"`
   - [ ] `"platforms"` with Windows entry
   - [ ] `"signature"` (base64 encoded)

## Manual Installation Testing

1. **Download and Install**

   ```bash
   gh release download tauri-v0.1.0 --pattern '*.msi'
   start "EFT-Tracker-Companion_0.1.0_x64_en-US.msi"
   ```

2. **Post-Installation Verification**
   - [ ] Installer runs without errors
   - [ ] App launches successfully
   - [ ] System tray icon appears
   - [ ] Window title shows "EFT Tracker Companion"
   - [ ] Close button hides app to tray (not quit)
   - [ ] App can be reopened from tray

## Release v0.1.1 - Update Test

1. **Prepare Update**
   - [ ] Make a visible change (e.g., update window title in `tauri.conf.json`)
   - [ ] Commit locally (not pushed yet)

2. **Create Release**

   ```bash
   ./scripts/release-tauri.sh 0.1.1
   ./scripts/wait-for-build.sh
   ./scripts/publish-release.sh
   ```

3. **Build Verification**
   - [ ] GitHub Actions builds successfully
   - [ ] Release assets created
   - [ ] `latest.json` shows version 0.1.1

## Auto-Update Testing

1. **Launch v0.1.0 App**
   - [ ] App starts (already installed from earlier)
   - [ ] Check logs for update check (see below)

2. **Wait for Update Detection**
   - [ ] App checks for updates on startup
   - [ ] Dialog appears: "A new version of EFT Tracker Companion is available"
   - [ ] Dialog shows version 0.1.1

3. **Install Update**
   - [ ] Click "Install" button
   - [ ] Download progress appears
   - [ ] Installation completes
   - [ ] App relaunches automatically

4. **Verify v0.1.1**
   - [ ] App is now running v0.1.1
   - [ ] Visible change is present (e.g., new window title)
   - [ ] All features still work
   - [ ] No errors in console

## Troubleshooting

### Update Dialog Doesn't Appear

1. Check app logs:

   ```
   %APPDATA%/com.eft-tracker.companion/logs/
   ```

2. Verify configuration:
   - Public key in `tauri.conf.json` is correct
   - `latest.json` is accessible at endpoint
   - Version in `latest.json` is newer than installed

3. Manual check:
   ```bash
   curl https://github.com/.../releases/latest/download/latest.json
   ```

### Build Fails

Check GitHub Actions logs:

```bash
gh run view --log
```

Common issues:

- Node dependencies not in sync
- Rust compilation errors
- Missing Tauri features

### Signature Verification Fails

- Public/private key mismatch
- Regenerate keys if needed
- Verify `TAURI_PRIVATE_KEY` secret is correct in GitHub

## Success Criteria

✅ **Auto-update is working when:**

- v0.1.0 installs without errors
- v0.1.0 detects v0.1.1 is available
- Update installs without user intervention needed
- App relaunches to v0.1.1 automatically
- All features work in updated version
- No errors in logs

## Next Steps After Success

1. Delete test versions (optional):

   ```bash
   gh release delete tauri-v0.1.0 tauri-v0.1.1
   ```

2. Start normal release cycle:
   - Create feature branches
   - Test thoroughly
   - Release v0.1.0 (or higher) when ready
   - Users will auto-update

---

**Note:** These versions are for testing only. For production, use semantic versioning and meaningful version numbers.
