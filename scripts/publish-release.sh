#!/bin/bash
# Publish Tauri draft release
# Usage: ./scripts/publish-release.sh 0.1.0

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Error: Version required"
  echo "Usage: ./scripts/publish-release.sh 0.1.0"
  exit 1
fi

TAG="tauri-v${VERSION}"

echo "📦 Publishing release ${TAG}..."

# Get the draft release ID
RELEASE_ID=$(gh release view "$TAG" --json id --jq '.id' 2>/dev/null || echo "")

if [ -z "$RELEASE_ID" ]; then
  echo "❌ No draft release found for ${TAG}"
  echo "Make sure the GitHub Actions workflow completed successfully."
  exit 1
fi

# Publish the release
gh release edit "$TAG" --draft=false

echo "✅ Release ${TAG} published!"
echo "🔗 View at: https://github.com/tuckerandrew21/EFT-Tracker/releases/tag/${TAG}"
echo ""
echo "📥 Download installer:"
echo "gh release download ${TAG} --pattern '*.msi'"
