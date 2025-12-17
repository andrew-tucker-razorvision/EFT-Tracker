#!/bin/bash
# Automated Tauri Release Script
# Usage: ./scripts/release-tauri.sh 0.1.0 "Release notes here"

set -e

VERSION=$1
NOTES=$2

if [ -z "$VERSION" ]; then
  echo "Error: Version required"
  echo "Usage: ./scripts/release-tauri.sh 0.1.0 \"Release notes\""
  exit 1
fi

echo "🚀 Creating Tauri release v${VERSION}"

# Validate apps/companion directory exists
if [ ! -d "apps/companion/src-tauri" ]; then
  echo "❌ Error: apps/companion/src-tauri directory not found"
  echo "Please run this script from the root of the EFT-Tracker repository"
  exit 1
fi

# Step 1: Update version numbers
echo "📝 Updating version numbers..."
# Update only the package version in Cargo.toml (first occurrence after [package])
sed -i "/^\[package\]/,/^\[/ s/^version = \"[^\"]*\"/version = \"${VERSION}\"/" apps/companion/src-tauri/Cargo.toml
# Update tauri.conf.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" apps/companion/src-tauri/tauri.conf.json
# Update package.json
sed -i "0,/\"version\": \"[^\"]*\"/ s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" apps/companion/package.json

# Step 2: Commit changes
echo "💾 Committing changes..."
git add apps/companion/src-tauri/Cargo.toml apps/companion/src-tauri/tauri.conf.json apps/companion/package.json
git commit -m "chore: Release v${VERSION}" || echo "No changes to commit"

# Step 3: Create and push tag
echo "🏷️  Creating tag tauri-v${VERSION}..."
git tag "tauri-v${VERSION}"
git push origin HEAD
git push origin "tauri-v${VERSION}"

echo "✅ Release tag created!"
echo "📦 GitHub Actions is now building the release..."
echo ""
echo "Next steps:"
echo "1. Monitor build: gh run watch \$(gh run list --workflow=release-tauri.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
echo "2. Once complete, run: ./scripts/publish-release.sh ${VERSION}"
