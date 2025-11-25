# Universal Dev Container
# Base image with common development tools
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install additional system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    jq \
    unzip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally (runs as vscode user via postCreateCommand)
# The actual installation happens in setup.sh to ensure proper user context

# Set working directory
WORKDIR /workspaces

# Default command
CMD ["sleep", "infinity"]
