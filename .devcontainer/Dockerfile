# Universal Dev Container
# Base image with common development tools
# Pinned to ubuntu-24.04 for stability and security
FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install additional system dependencies
# hadolint ignore=DL3008
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    jq \
    unzip \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally (runs as vscode user via postCreateCommand)
# The actual installation happens in setup.sh to ensure proper user context

# Set working directory
WORKDIR /workspaces

# Default command
CMD ["sleep", "infinity"]
