# Tauri Setup Guide

This guide covers the one-time setup needed for Tauri development and releases.

## Auto-Updater Setup

The Tauri auto-updater requires cryptographic keys to sign releases and verify updates.

### 1. Generate Updater Keys

Run this command **once** to generate public/private key pair:

```bash
cd apps/companion/src-tauri
cargo tauri signer generate -w ~/.tauri/eft-tracker.key
```

This will output:

- **Public key**: Copy this to `apps/companion/src-tauri/tauri.conf.json` → `tauri.updater.pubkey`
- **Private key**: Saved to `~/.tauri/eft-tracker.key` (keep this secret!)

**⚠️ IMPORTANT:**

- Store the private key securely
- Never commit the private key to Git
- You'll need it to sign all future releases

### 2. Update Tauri Configuration

Edit `apps/companion/src-tauri/tauri.conf.json`:

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/tuckerandrew21/EFT-Tracker/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

Replace `YOUR_PUBLIC_KEY_HERE` with the public key from step 1.

### 3. Add GitHub Secrets

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

1. **TAURI_PRIVATE_KEY**
   - Value: Full content of `~/.tauri/eft-tracker.key`
   - Used to sign releases

2. **TAURI_KEY_PASSWORD** (if you set a password)
   - Value: The password you used when generating the key
   - Leave empty if you didn't set a password

### 4. Test the Setup

To verify everything is configured correctly:

1. Create a test tag:

   ```bash
   git tag tauri-v0.1.0-test
   git push origin tauri-v0.1.0-test
   ```

2. Check GitHub Actions:
   - Go to: https://github.com/tuckerandrew21/EFT-Tracker/actions
   - Verify the "Release Tauri App" workflow runs
   - Check that it builds MSI and NSIS installers
   - Verify a draft release is created

3. Clean up:
   ```bash
   git tag -d tauri-v0.1.0-test
   git push origin :refs/tags/tauri-v0.1.0-test
   ```

## Development Workflow

### Running Locally

```bash
# From repository root
pnpm dev:companion

# Or be explicit
pnpm --filter @eft-tracker/companion tauri:dev
```

This starts the dev server on `http://localhost:1420` with the Tauri app window connected.

### Building for Production

```bash
pnpm build:companion

# Or:
pnpm --filter @eft-tracker/companion tauri:build
```

Output files:

- `apps/companion/src-tauri/target/release/bundle/msi/EFT-Quest-Tracker_*.msi`
- `apps/companion/src-tauri/target/release/bundle/nsis/EFT-Quest-Tracker_*-setup.exe`

## Creating a Release

### 1. Update Version Numbers

Update the version in these files:

- `apps/companion/package.json`
- `apps/companion/src-tauri/tauri.conf.json`
- `apps/companion/src-tauri/Cargo.toml`

Example: `0.1.0` → `0.2.0`

**Or use the automated script:**

```bash
./scripts/release-tauri.sh 0.2.0 "Release description"
```

### 2. Commit and Tag

```bash
git add .
git commit -m "chore: bump version to 0.2.0"
git tag tauri-v0.2.0
git push origin feature/your-branch
git push origin tauri-v0.2.0
```

### 3. GitHub Actions Builds

The push will trigger GitHub Actions to:

1. Build Windows installers (MSI + NSIS)
2. Sign them with `TAURI_PRIVATE_KEY`
3. Create a draft GitHub Release
4. Upload installers as release assets
5. Generate `latest.json` for auto-updater

### 4. Publish Release

1. Go to: https://github.com/tuckerandrew21/EFT-Tracker/releases
2. Find the draft release
3. Review the release notes
4. Click "Publish release"

### 5. Auto-Updates

After publishing:

- New users download from GitHub Releases
- Existing users get auto-update notifications
- Updates install automatically on next launch

## Troubleshooting

### "Invalid signature" error

**Cause**: Public key in `tauri.conf.json` doesn't match private key in GitHub Secrets

**Fix**:

1. Regenerate keys: `cargo tauri signer generate`
2. Update public key in `tauri.conf.json`
3. Update `TAURI_PRIVATE_KEY` in GitHub Secrets

### Build fails: "target not found"

**Cause**: Rust toolchain out of date

**Fix**:

```bash
rustup update stable
```

### Updater doesn't check for updates

**Cause**: `updater.active` is false or endpoint URL is wrong

**Fix**:

1. Check `apps/companion/src-tauri/tauri.conf.json`:

   ```json
   {
     "tauri": {
       "updater": {
         "active": true,
         "endpoints": ["https://github.com/.../latest.json"]
       }
     }
   }
   ```

2. Verify endpoint URL returns valid JSON:
   ```bash
   curl https://github.com/tuckerandrew21/EFT-Tracker/releases/latest/download/latest.json
   ```

### MSI installer blocked by Windows Defender

**Cause**: Unsigned installer (code signing certificate required for production)

**Temporary fix**: Right-click installer → Properties → Unblock

**Permanent fix**: Purchase code signing certificate ($100-$400/year) and sign installers

## Security Best Practices

1. **Never commit private keys**
   - Add `~/.tauri/*.key` to `.gitignore`
   - Store backups in secure password manager

2. **Rotate keys if compromised**
   - Generate new key pair
   - Update GitHub Secrets
   - Release new version with new public key
   - Old versions won't auto-update (by design)

3. **Test updates before releasing**
   - Always create draft releases first
   - Test installation on clean Windows VM
   - Verify auto-update works before publishing

4. **Monitor GitHub Actions logs**
   - Check for failed builds
   - Verify signatures are valid
   - Ensure `latest.json` is generated

## Resources

- [Tauri Updater Documentation](https://tauri.app/v1/guides/distribution/updater)
- [Tauri Signing Guide](https://tauri.app/v1/guides/distribution/sign-windows)
- [GitHub Actions for Tauri](https://github.com/tauri-apps/tauri-action)
- [Implementation Plan](./COMPANION_APP_IMPLEMENTATION.md)
