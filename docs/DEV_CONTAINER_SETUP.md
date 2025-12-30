# Dev Container Setup Guide

Complete guide for setting up the VS Code Dev Container environment on a new device. This development environment is pre-configured with all tools, extensions, and optimizations needed for the EFT-Tracker project.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Secret Management](#secret-management)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Replication Guide](#replication-guide)

---

## Overview

This dev container provides a complete, reproducible development environment with:

- **Node.js LTS** - Latest long-term support version
- **1Password CLI** - Secure secret management
- **Claude Code** - AI-powered development assistant
- **GitHub CLI** - GitHub integration from terminal
- **Global Tools** - TypeScript, ts-node, Prettier, ESLint
- **VS Code Extensions** - Pre-configured for optimal development

**Key Benefits:**

1. Consistent environment across all devices
2. Eliminates "works on my machine" issues
3. Fast onboarding (2-3 minutes)
4. Isolated dependencies (no conflicts with host system)
5. Cross-platform compatibility (Windows, Mac, Linux)

---

## Prerequisites

### Required Software

1. **Docker Desktop**
   - **Windows**: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
   - **Mac**: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
   - **Linux**: [Install Docker Engine](https://docs.docker.com/engine/install/)

   **System Requirements:**
   - Windows: WSL2 enabled, Windows 10/11 Pro
   - Mac: macOS 10.15+
   - RAM: 8GB minimum, 16GB recommended
   - Disk: 10GB free space

2. **VS Code**
   - [Download Visual Studio Code](https://code.visualstudio.com/)
   - Version 1.80 or higher recommended

3. **Dev Containers Extension**
   - Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - Or search "Dev Containers" in VS Code extensions

4. **1Password CLI** (for secret management)
   - [Download 1Password CLI](https://developer.1password.com/docs/cli/get-started/)
   - Version 2.0+ required
   - Must be signed into your 1Password account

5. **Git**
   - Pre-installed on Mac/Linux
   - Windows: [Download Git for Windows](https://git-scm.com/download/win)

### Verification

Before proceeding, verify installations:

```bash
# Docker
docker --version
# Should output: Docker version 24.0.0 or higher

# Docker is running
docker ps
# Should show empty list (no error)

# 1Password CLI
op --version
# Should output: 2.x.x or higher

# 1Password signed in
op whoami
# Should show your account info

# Git
git --version
# Should output: git version 2.x.x
```

---

## Initial Setup

### Step 1: Clone the Repository

```bash
# Choose a location for your project
cd ~/projects  # or C:\Users\YourName\projects on Windows

# Clone the repository
git clone https://github.com/tuckerandrew21/EFT-Tracker.git
cd EFT-Tracker
```

### Step 2: Generate Environment Variables

**IMPORTANT**: This must be done **before** opening the container.

The project uses 1Password CLI to inject secrets from your vault:

```bash
# On Windows (PowerShell)
op inject -i .env.template -o .env

# On Mac/Linux (bash/zsh)
op inject -i .env.template -o .env
```

**What this does:**

- Reads `.env.template` with 1Password references (e.g., `op://DevSecrets/Github/PAT`)
- Fetches actual secrets from your 1Password vault
- Generates `.env` file with real values

**Required 1Password Items:**

You need these items in your 1Password vault (in the "DevSecrets" vault):

| Item Name       | Fields Required | Description                             |
| --------------- | --------------- | --------------------------------------- |
| **Github**      | `PAT`           | GitHub Personal Access Token            |
| **BraveSearch** | `api-key`       | Brave Search API key                    |
| **EFT-Tracker** | `DATABASE_URL`  | PostgreSQL connection string (Neon)     |
| **EFT-Tracker** | `AUTH_SECRET`   | NextAuth.js secret (32-byte random)     |
| **EFT-Tracker** | `NEXTAUTH_URL`  | App URL (e.g., `http://localhost:3000`) |

**Creating Auth Secret:**

```bash
# Generate a secure AUTH_SECRET
openssl rand -base64 32

# Add this to your 1Password vault under EFT-Tracker/AUTH_SECRET
```

### Step 3: Open in VS Code

```bash
# Open the project in VS Code
code .
```

### Step 4: Reopen in Container

When VS Code opens, you'll see a notification in the bottom-right:

> **Folder contains a Dev Container configuration file. Reopen folder to develop in a container?**

Click **"Reopen in Container"**

**Or manually via Command Palette:**

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type: "Dev Containers: Reopen in Container"
3. Press Enter

### Step 5: Wait for Setup (First Time Only)

The first time takes 2-3 minutes. You'll see:

1. **Building container** (~30 seconds)
   - Pulls base Ubuntu image
   - Installs system packages

2. **Starting container** (~10 seconds)
   - Creates named volumes
   - Mounts your workspace

3. **Running postCreateCommand** (~2 minutes)
   - Installs 1Password CLI
   - Installs Claude Code
   - Runs `npm install`
   - Creates helper scripts

**Progress**: Watch the terminal output at the bottom of VS Code

### Step 6: Verify Setup

Once complete, verify everything works:

```bash
# Check Node.js
node --version
# Should output: v20.x.x (LTS)

# Check Claude Code
claude --version
# Should output: @anthropic-ai/claude-code version

# Check 1Password CLI
op --version
# Should output: 2.x.x

# Check GitHub CLI
gh --version
# Should output: gh version 2.x.x

# Check project dependencies
npm ls next
# Should show Next.js installed
```

### Step 7: Start Development

```bash
# Start the development server
npm run dev

# Open browser to http://localhost:3000
```

**You're ready to code!** 🎉

---

## Secret Management

### Understanding the System

**Problem**: Storing secrets in code is insecure. Environment variables can leak.

**Solution**: 1Password CLI with secret references

### How It Works

1. **`.env.template`** - Contains 1Password references (safe to commit)

   ```bash
   DATABASE_URL=op://DevSecrets/EFT-Tracker/DATABASE_URL
   ```

2. **`.env`** - Contains actual secrets (NEVER commit, in `.gitignore`)

   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/db
   ```

3. **1Password CLI** - Bridges the gap by fetching secrets from your vault

### Refreshing Secrets

If secrets change in 1Password, refresh them:

**From Host Machine (Recommended):**

```bash
# On Windows/Mac/Linux host
op inject -i .env.template -o .env

# Then restart the container
# VS Code Command Palette > "Dev Containers: Rebuild Container"
```

**From Inside Container:**

```bash
# Sign in to 1Password (if not already)
op signin

# Use the helper script
refresh-secrets

# Restart any running processes (like npm run dev)
```

### Adding New Secrets

1. **Add to 1Password vault:**
   - Create/update item in "DevSecrets" vault
   - Add field with secret value

2. **Update `.env.template`:**

   ```bash
   # Add reference
   NEW_SECRET=op://DevSecrets/ItemName/field-name
   ```

3. **Regenerate `.env`:**

   ```bash
   op inject -i .env.template -o .env
   ```

4. **Restart container** to load new variables

---

## Architecture

### Container Structure

```
Host Machine (Your Computer)
├── Project Files (bind mount) ← Edit here with VS Code
│   ├── src/
│   ├── .devcontainer/
│   └── .env ← Generated on host
│
Container (Ubuntu 24.04)
├── /workspaces/EFT-Tracker/ ← Workspace root
│   ├── node_modules/ ← VOLUME (isolated)
│   └── ... (your source code)
├── /commandhistory/ ← VOLUME (persistent bash history)
└── /usr/local/bin/
    ├── op (1Password CLI)
    ├── claude (Claude Code)
    └── gh (GitHub CLI)
```

### Named Volumes Explained

**Why volumes?** They solve cross-platform binary compatibility issues.

#### 1. `eft-tracker-node-modules` Volume

**Problem**:

- On Windows with WSL2, `node_modules` from host contains Windows binaries
- When mounted into Linux container, these fail with errors like:
  ```
  Cannot find module '../lightningcss.linux-x64-gnu.node'
  ```

**Solution**:

- Mount `node_modules` as a Docker volume
- npm installs Linux binaries directly in container
- Source code stays on host (editable with VS Code)

**Benefits**:

- ✅ Linux-compatible binaries
- ✅ No cross-platform conflicts
- ✅ Fast npm operations
- ✅ Persists across container rebuilds

#### 2. `devcontainer-bashhistory` Volume

**Purpose**: Persist command history across container rebuilds

**What it stores**:

- `.bash_history`
- `.zsh_history`
- Command autocomplete data

**Why it matters**: You won't lose your command history when rebuilding

### Port Forwarding

These ports are automatically forwarded from container to host:

| Port | Service             | Access                |
| ---- | ------------------- | --------------------- |
| 3000 | Next.js dev server  | http://localhost:3000 |
| 5000 | Alternative dev     | http://localhost:5000 |
| 8000 | API services        | http://localhost:8000 |
| 8080 | Additional services | http://localhost:8080 |

**Accessing from host**: Just open `http://localhost:3000` in your browser

### Lifecycle Scripts

#### postCreateCommand (`setup.sh`)

**When**: Runs once when container is first created

**What it does**:

```bash
1. Install 1Password CLI (v2.30.0)
2. Install Claude Code globally
3. Create helper scripts (refresh-secrets, etc.)
4. Run npm install (into the volume)
5. Generate Prisma client
6. Display setup completion message
```

#### postStartCommand (`inject-secrets.sh`)

**When**: Runs every time container starts

**What it does**:

```bash
1. Check if .env exists
2. If missing, display instructions
3. If present, confirm secrets are loaded
```

### File System Layout

```
/workspaces/EFT-Tracker/
├── src/                    # Your source code (editable)
├── node_modules/           # VOLUME (read-only from host perspective)
├── .env                    # Secrets (generated on host)
├── .devcontainer/          # Container configuration
│   ├── devcontainer.json   # VS Code config
│   ├── Dockerfile          # Container image
│   ├── setup.sh            # First-time setup
│   └── inject-secrets.sh   # Startup script
├── package.json            # Dependencies
└── ...
```

---

## Troubleshooting

### Problem: "Folder does not contain a dev container"

**Symptoms**: VS Code doesn't offer to reopen in container

**Cause**: `.devcontainer/devcontainer.json` not found or invalid

**Fix**:

```bash
# Verify file exists
ls -la .devcontainer/devcontainer.json

# Validate JSON syntax
cat .devcontainer/devcontainer.json | jq .

# If missing, check git status
git status
# May need to checkout the file
git checkout .devcontainer/devcontainer.json
```

### Problem: "Cannot find module '../lightningcss.linux-x64-gnu.node'"

**Symptoms**: Build or dev server fails with binary module error

**Cause**: Windows binaries mounted from host (volume mount not working)

**Fix**:

```bash
# 1. Rebuild container
VS Code Command Palette > "Dev Containers: Rebuild Container"

# 2. Verify volume mount
docker volume ls | grep eft-tracker-node-modules
# Should show the volume

# 3. Check if volume is mounted
docker inspect <container-id> | grep Mounts -A 20
# Should show node_modules volume

# 4. Force clean install
docker volume rm eft-tracker-node-modules
# Then rebuild container
```

### Problem: "No accounts configured for 1Password CLI"

**Symptoms**: `op whoami` fails, `refresh-secrets` doesn't work

**Cause**: 1Password desktop integration doesn't work in containers

**Fix**:

**Option 1** (Recommended): Generate `.env` on host

```bash
# Exit container, run on host machine
exit
op inject -i .env.template -o .env

# Then reopen in container
```

**Option 2**: Sign in manually inside container

```bash
# In container terminal
op signin --account your-account.1password.com

# Enter credentials
# Then run refresh-secrets
```

### Problem: "Failed to fetch metadata from 1Password"

**Symptoms**: `op inject` command fails

**Cause**:

- Not signed into 1Password CLI
- 1Password desktop app not running
- Incorrect vault/item names in `.env.template`

**Fix**:

```bash
# Check 1Password status
op whoami

# If not signed in
op signin

# Check desktop app is running
# Windows: Check system tray
# Mac: Check menu bar
# Linux: Start 1Password app

# Verify item exists
op item list --vault DevSecrets
# Look for your items (Github, BraveSearch, EFT-Tracker)

# Test specific reference
op read "op://DevSecrets/Github/PAT"
# Should output your token
```

### Problem: Container build fails

**Symptoms**: Error during "Building container" phase

**Common Causes & Fixes**:

1. **Docker not running**

   ```bash
   # Windows: Start Docker Desktop
   # Check status
   docker ps
   ```

2. **Insufficient disk space**

   ```bash
   # Check Docker disk usage
   docker system df

   # Clean up if needed
   docker system prune -a
   ```

3. **Network issues (can't pull base image)**

   ```bash
   # Test Docker Hub connection
   docker pull mcr.microsoft.com/devcontainers/base:ubuntu-24.04

   # If behind proxy, configure Docker proxy settings
   ```

4. **Dockerfile syntax error**
   ```bash
   # Validate Dockerfile
   docker build -f .devcontainer/Dockerfile .
   ```

### Problem: Slow npm install

**Symptoms**: First-time setup takes 5+ minutes on npm install

**Cause**: Volume mounts are slower than native filesystem (this is normal)

**Optimization**:

```bash
# This is expected behavior
# Subsequent installs will be faster (npm cache)

# To speed up slightly, use npm ci (clean install)
npm ci

# Or use faster package manager (optional)
npm install -g pnpm
pnpm install
```

### Problem: "Port 3000 already in use"

**Symptoms**: `npm run dev` fails with EADDRINUSE

**Cause**: Another process using port 3000

**Fix**:

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Problem: VS Code extensions not installing

**Symptoms**: Claude Code, Prettier, ESLint not available

**Cause**: Extensions failed to install during container creation

**Fix**:

```bash
# Rebuild container
VS Code Command Palette > "Dev Containers: Rebuild Container Without Cache"

# Or manually install
# Open Extensions panel (Ctrl+Shift+X)
# Search for:
# - anthropic.claude-code
# - esbenp.prettier-vscode
# - dbaeumer.vscode-eslint
# - bradlc.vscode-tailwindcss
```

### Problem: Changes to source code not reflecting

**Symptoms**: Edit files, but changes don't show in running app

**Cause**: Hot reload not working, or editing wrong copy

**Fix**:

```bash
# Verify you're editing inside the container
# Check terminal prompt should show container name

# Restart dev server
# Stop with Ctrl+C, then
npm run dev

# Check file is actually changed
cat path/to/file.ts
```

---

## Replication Guide

Follow these steps to replicate this dev container setup in a **new project**:

### Step 1: Copy Dev Container Files

Copy these files to your new project:

```bash
# From EFT-Tracker to your new project
cp -r .devcontainer/ /path/to/new-project/
cp .env.template /path/to/new-project/
```

**Files copied**:

```
.devcontainer/
├── devcontainer.json    # VS Code dev container config
├── Dockerfile           # Container image definition
├── setup.sh             # First-time setup script
├── inject-secrets.sh    # Startup secrets check
├── POST_SETUP_NOTES.md  # Post-setup instructions (optional)
└── README.md            # Dev container documentation
```

### Step 2: Update devcontainer.json

Edit `.devcontainer/devcontainer.json`:

```json
{
  "name": "Your-Project-Name Dev Container", // Update name

  "mounts": [
    "source=devcontainer-bashhistory,target=/commandhistory,type=volume",
    // Update volume name to match your project
    "source=your-project-node-modules,target=/workspaces/Your-Project-Name/node_modules,type=volume"
  ],

  // Update port forwarding if needed
  "forwardPorts": [3000, 5000, 8000, 8080],

  // Add/remove extensions as needed
  "customizations": {
    "vscode": {
      "extensions": [
        "anthropic.claude-code",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint"
        // Add project-specific extensions
      ]
    }
  }
}
```

### Step 3: Update setup.sh

Edit `.devcontainer/setup.sh` if your project needs different setup:

```bash
# Line 6-7: Update project name in echo
echo "🚀 Setting up Your Project Name..."

# Line 30-35: Customize npm install step
echo "📦 Installing dependencies..."
npm ci  # or pnpm install, yarn install

# Add project-specific setup
# Examples:
# - Generate Prisma client
# - Run database migrations
# - Build TypeScript types
# - Download assets
```

### Step 4: Create .env.template

Create `.env.template` for your project's secrets:

```bash
# Example template structure
# MCP Server Credentials (if using)
GITHUB_PERSONAL_ACCESS_TOKEN=op://DevSecrets/Github/PAT

# Project-Specific Variables
DATABASE_URL=op://DevSecrets/YourProject/DATABASE_URL
API_KEY=op://DevSecrets/YourProject/API_KEY
# Add your secrets here
```

**Best Practices**:

- Use 1Password references format: `op://VaultName/ItemName/field-name`
- Group secrets logically (Database, Auth, External APIs, etc.)
- Add comments explaining each variable
- Keep this file in git (it's safe, contains no actual secrets)

### Step 5: Update .gitignore

Ensure secrets and volumes are gitignored:

```bash
# Environment variables
.env
.env.local
.env.*.local

# Dev container volumes
node_modules/
```

### Step 6: Update Documentation

Update your project's README with dev container instructions:

```markdown
## Development Environment

This project uses VS Code Dev Containers for a consistent development environment.

### Prerequisites

- Docker Desktop
- VS Code with Dev Containers extension
- 1Password CLI

### Quick Start

1. Clone the repository
2. Generate secrets: `op inject -i .env.template -o .env`
3. Open in VS Code: `code .`
4. Click "Reopen in Container" when prompted
5. Wait for setup to complete (~2-3 minutes first time)
6. Start developing!

See [docs/DEV_CONTAINER_SETUP.md](docs/DEV_CONTAINER_SETUP.md) for detailed setup guide.
```

### Step 7: Customize Dockerfile (Optional)

If your project needs additional tools, edit `.devcontainer/Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

ENV DEBIAN_FRONTEND=noninteractive

# Add project-specific system packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    jq \
    unzip \
    build-essential \
    # Add your packages here
    postgresql-client \
    redis-tools \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspaces

CMD ["sleep", "infinity"]
```

### Step 8: Test the Setup

Test on a different machine or clean environment:

```bash
# 1. Clone the new project
git clone https://github.com/you/your-project.git
cd your-project

# 2. Generate secrets
op inject -i .env.template -o .env

# 3. Open in VS Code
code .

# 4. Reopen in container
# (Click notification or use Command Palette)

# 5. Verify setup
node --version
npm ls
# Run project-specific verification

# 6. Start development
npm run dev
```

### Step 9: Document Project-Specific Steps

Create or update `docs/DEV_CONTAINER_SETUP.md` with:

- Project-specific prerequisites
- Required 1Password vault items
- Environment variable descriptions
- Database setup instructions
- Common issues specific to your project

---

## Advanced Configuration

### Adding VS Code Extensions

Edit `.devcontainer/devcontainer.json`:

```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "anthropic.claude-code",
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss",
        // Add more extensions
        "prisma.prisma",
        "ms-azuretools.vscode-docker",
        "eamodio.gitlens"
      ]
    }
  }
}
```

### Adding System Packages

Edit `.devcontainer/Dockerfile`:

```dockerfile
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    jq \
    unzip \
    build-essential \
    # Add new packages
    postgresql-client \
    redis-tools \
    python3 \
    && rm -rf /var/lib/apt/lists/*
```

### Adding Global npm Packages

Edit `.devcontainer/setup.sh`:

```bash
# Install global tools
npm install -g \
  typescript \
  ts-node \
  @anthropic-ai/claude-code \
  prettier \
  eslint \
  # Add your global packages
  vercel \
  pm2
```

### Custom Shell Configuration

Add to `.devcontainer/setup.sh`:

```bash
# Custom bash aliases
cat >> ~/.bashrc << 'EOF'
alias ll='ls -lah'
alias gs='git status'
alias gp='git push'
alias gc='git commit'
alias dev='npm run dev'
EOF
```

### Mounting Additional Volumes

Edit `.devcontainer/devcontainer.json`:

```json
{
  "mounts": [
    "source=devcontainer-bashhistory,target=/commandhistory,type=volume",
    "source=project-node-modules,target=/workspaces/Project/node_modules,type=volume",
    // Add custom volumes
    "source=project-cache,target=/workspaces/Project/.next,type=volume"
  ]
}
```

---

## Performance Tips

### 1. Use named volumes for generated files

Mount build artifacts as volumes for faster operations:

```json
{
  "mounts": [
    "source=project-node-modules,target=/workspaces/Project/node_modules,type=volume",
    "source=project-next-cache,target=/workspaces/Project/.next,type=volume",
    "source=project-turbo-cache,target=/workspaces/Project/.turbo,type=volume"
  ]
}
```

### 2. Limit file watching

Add to `next.config.js` or similar:

```javascript
module.exports = {
  // Reduce file watching overhead
  experimental: {
    // WSL2 specific optimization
    fsCache: true,
  },
};
```

### 3. Use npm ci instead of npm install

In `.devcontainer/setup.sh`:

```bash
# Faster, cleaner installs
npm ci
```

### 4. Enable Docker BuildKit

In Docker Desktop settings or `.docker/config.json`:

```json
{
  "features": {
    "buildkit": true
  }
}
```

### 5. Allocate more resources to Docker

**Docker Desktop Settings**:

- **CPU**: 4+ cores
- **RAM**: 8GB+ (12GB recommended for large projects)
- **Disk**: 60GB+
- **Swap**: 2GB

---

## Security Best Practices

### 1. Never commit .env files

Verify `.gitignore`:

```bash
# Check .env is gitignored
git check-ignore .env
# Should output: .env

# If not, add to .gitignore
echo ".env" >> .gitignore
```

### 2. Use 1Password CLI, not environment files

**Bad**:

```bash
# Storing secrets in git
echo "DATABASE_URL=postgresql://..." > .env.production
git add .env.production
```

**Good**:

```bash
# Using 1Password references
# .env.template
DATABASE_URL=op://DevSecrets/Project/DATABASE_URL
```

### 3. Rotate secrets regularly

```bash
# 1. Generate new secret
openssl rand -base64 32

# 2. Update in 1Password vault

# 3. Regenerate .env
op inject -i .env.template -o .env

# 4. Restart services
```

### 4. Use separate vaults for different environments

```bash
# Development secrets
DATABASE_URL=op://DevSecrets/Project/DATABASE_URL_DEV

# Production secrets (different vault)
DATABASE_URL=op://ProdSecrets/Project/DATABASE_URL_PROD
```

### 5. Audit container security

```bash
# Scan Docker image for vulnerabilities
docker scan <image-name>

# Check for security updates
docker pull mcr.microsoft.com/devcontainers/base:ubuntu-24.04
```

---

## Maintenance

### Updating Base Image

```bash
# 1. Pull latest base image
docker pull mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# 2. Rebuild container
VS Code Command Palette > "Dev Containers: Rebuild Container"
```

### Updating Dependencies

```bash
# Inside container
npm update

# Check for outdated packages
npm outdated

# Update specific package
npm install <package>@latest
```

### Cleaning Up Volumes

```bash
# List volumes
docker volume ls

# Remove specific volume (will delete node_modules!)
docker volume rm eft-tracker-node-modules

# Remove all unused volumes
docker volume prune
```

### Backing Up Configuration

```bash
# Backup dev container config
tar -czf devcontainer-backup.tar.gz .devcontainer/

# Restore on another machine
tar -xzf devcontainer-backup.tar.gz
```

---

## References

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [1Password CLI Documentation](https://developer.1password.com/docs/cli/)
- [Dev Container Features](https://containers.dev/features)
- [DevContainer Specification](https://containers.dev/implementors/spec/)

---

**Last Updated:** 2025-11-26
**Tested With:** Docker Desktop 4.25+, VS Code 1.85+, WSL2 (Windows), macOS 14+
