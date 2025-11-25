#!/bin/bash
# setup.sh - Runs once when container is created
set -e

echo "=========================================="
echo "Setting up development environment..."
echo "=========================================="

# Install 1Password CLI with GPG verification
echo "Installing 1Password CLI..."
# Download and verify GPG key
curl -sS https://downloads.1password.com/linux/keys/1password.asc | sudo gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg

# Verify the GPG key fingerprint (3FEF9748469ADBE15DA7CA80AC2D62742012EA22)
EXPECTED_FINGERPRINT="3FEF9748469ADBE15DA7CA80AC2D62742012EA22"
ACTUAL_FINGERPRINT=$(gpg --no-default-keyring --keyring /usr/share/keyrings/1password-archive-keyring.gpg --fingerprint | grep -oP '(?<=\s{2})[A-F0-9]{40}' | tr -d ' ')
if [ "$ACTUAL_FINGERPRINT" != "$EXPECTED_FINGERPRINT" ]; then
    echo "ERROR: 1Password GPG key fingerprint mismatch!"
    echo "Expected: $EXPECTED_FINGERPRINT"
    echo "Got: $ACTUAL_FINGERPRINT"
    exit 1
fi

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/amd64 stable main" | sudo tee /etc/apt/sources.list.d/1password.list
sudo apt-get update && sudo apt-get install -y 1password-cli

# Install Claude Code
echo "Installing Claude Code..."
npm install -g @anthropic-ai/claude-code@latest

# Install common global npm packages with version constraints
echo "Installing global npm packages..."
npm install -g typescript@5 ts-node@10 prettier@3 eslint@9

# Fix permissions and create command history persistence
sudo mkdir -p /commandhistory
sudo chown vscode:vscode /commandhistory
touch /commandhistory/.bash_history

# Add history persistence to bashrc
echo 'export HISTFILE=/commandhistory/.bash_history' >> ~/.bashrc
echo 'export PROMPT_COMMAND="history -a; $PROMPT_COMMAND"' >> ~/.bashrc

# Install project dependencies (node_modules is now on a volume)
echo "Installing project dependencies..."
npm install

# Create refresh-secrets helper
sudo tee /usr/local/bin/refresh-secrets > /dev/null << 'INNEREOF'
#!/bin/bash
if [ -f ".env.template" ]; then
    echo "Refreshing secrets from 1Password..."
    op inject -i .env.template -o .env
    echo "Done! Secrets written to .env"
else
    echo "No .env.template found in current directory"
fi
INNEREOF
sudo chmod +x /usr/local/bin/refresh-secrets

echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run 'op signin' to authenticate with 1Password"
echo "2. Run 'refresh-secrets' to inject secrets from .env.template"
echo "3. Start coding!"
