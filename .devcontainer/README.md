# Dev Container Setup

This dev container provides a complete development environment for the EFT-Tracker project.

## Features

- **Node.js LTS** - Latest Long-Term Support version
- **1Password CLI** - Secret management integration
- **Claude Code** - AI-powered development assistant
- **GitHub CLI** - GitHub integration from the terminal
- **Zsh** - Enhanced shell with better defaults
- **Global Tools** - TypeScript, ts-node, Prettier, ESLint

## Architecture

### Volume Mounts

The container uses Docker volumes for performance and cross-platform compatibility:

1. **Command History Volume** (`devcontainer-bashhistory`)
   - Persists bash/zsh command history across container rebuilds
   - Mounted at: `/commandhistory`

2. **Node Modules Volume** (`eft-tracker-node-modules`)
   - Stores npm dependencies separately from the workspace
   - Prevents Windows binary conflicts in WSL2
   - Mounted at: `/workspaces/EFT-Tracker/node_modules`
   - **Important**: This volume is Linux-specific and isolated from your host

### Why Volume Mounts?

**Problem**: When using WSL2 with bind mounts, Windows-specific binaries (`.node` files) from the host system get mounted into the Linux container, causing I/O errors and build failures.

**Solution**: By mounting `node_modules` as a named volume, npm installs Linux-compatible binaries directly in the container, while your source code remains editable on the host.

## Setup Process

### Lifecycle Scripts

1. **postCreateCommand** (`.devcontainer/setup.sh`)
   - Runs once when the container is first created
   - Installs 1Password CLI, Claude Code, and global npm packages
   - Installs project dependencies into the volume
   - Creates helper scripts

2. **postStartCommand** (`.devcontainer/inject-secrets.sh`)
   - Runs every time the container starts
   - Checks for `.env` file presence
   - Provides instructions if secrets are missing

### Secret Management

Secrets are managed using 1Password CLI with secret references:

1. **On Host (Windows)**: Generate `.env` before opening container
   ```powershell
   op inject -i .env.template -o .env
   ```

2. **In Container**: Use `refresh-secrets` helper
   ```bash
   op signin
   refresh-secrets
   ```

**Note**: 1Password desktop app integration doesn't work in containers, so initial `.env` generation must happen on the host.

## Port Forwarding

The following ports are automatically forwarded:
- `3000` - Next.js development server
- `5000` - Alternative dev server
- `8000` - API/backend services
- `8080` - Additional services

## Installed Extensions

- **Claude Code** - AI pair programming
- **Prettier** - Code formatting
- **ESLint** - JavaScript/TypeScript linting
- **Tailwind CSS IntelliSense** - Tailwind CSS autocomplete

## Environment Variables

Required environment variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://...

# MCP Servers
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
BRAVE_API_KEY=BSA...
```

See [.env.template](.env.template) for the complete list with 1Password references.

## Common Issues

### "Cannot find module '../lightningcss.linux-x64-gnu.node'"

**Cause**: Windows binaries from host mounted into Linux container

**Fix**: Already resolved by the `node_modules` volume mount. If you see this error:
1. Rebuild the container to apply the volume mount
2. The setup script will reinstall dependencies with Linux binaries

### "No accounts configured for 1Password CLI"

**Cause**: 1Password desktop integration doesn't work in containers

**Fix**: Either:
- Generate `.env` on your Windows host before opening the container
- Or, sign in manually with `op signin` and use `refresh-secrets`

### Slow npm install

**Cause**: Volume mounts can be slower than native filesystem

**Fix**: This is expected behavior. The first install takes longer, but subsequent installs use npm's cache.

## Performance Optimization

The container is optimized for:
- ✅ Fast source code editing (bind mount to host)
- ✅ Linux-compatible builds (isolated node_modules)
- ✅ Persistent bash history
- ✅ Cached npm packages (global npm cache)

## Rebuilding the Container

To rebuild with a clean slate:

```bash
# In VS Code
> Dev Containers: Rebuild Container

# Or rebuild without cache
> Dev Containers: Rebuild Container Without Cache
```

**Note**: Named volumes persist across rebuilds, so you won't lose:
- Bash history
- Node modules (unless you delete the volume)

## Deleting Volumes

To completely reset:

```bash
docker volume rm eft-tracker-node-modules
docker volume rm devcontainer-bashhistory
```

Then rebuild the container.
