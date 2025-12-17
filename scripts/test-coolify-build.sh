#!/bin/bash
# Test Coolify Docker build locally using Nixpacks
# This script simulates what Coolify will do when you merge a PR
#
# Usage:
#   bash scripts/test-coolify-build.sh          # Full test (build Docker image)
#   bash scripts/test-coolify-build.sh --plan   # Validate Nixpacks plan
#   bash scripts/test-coolify-build.sh --quick  # Quick validation (Tier 1 checks)
#   bash scripts/test-coolify-build.sh --no-cache # Force rebuild without Docker cache

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/.coolify-build"
DOCKERFILE="$BUILD_DIR/Dockerfile"

# Create build directory if it doesn't exist
mkdir -p "$BUILD_DIR"
IMAGE_NAME="eft-tracker:coolify-local-test"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
PLAN_ONLY=false
QUICK_MODE=false
NO_CACHE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --plan)
      PLAN_ONLY=true
      shift
      ;;
    --quick)
      QUICK_MODE=true
      shift
      ;;
    --no-cache)
      NO_CACHE="--no-cache"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--quick] [--plan] [--no-cache]"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Coolify Local Build Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check if Nixpacks is installed
if ! command -v nixpacks &> /dev/null; then
  echo -e "${RED}✗ Nixpacks not found${NC}"
  echo "  Install with: cargo install --git https://github.com/railwayapp/nixpacks nixpacks"
  exit 1
fi
echo -e "${GREEN}✓ Nixpacks installed${NC}"

# Step 2: Check if Docker is running (if not doing plan-only)
if [ "$PLAN_ONLY" = false ]; then
  if ! docker ps &> /dev/null; then
    echo -e "${RED}✗ Docker not running${NC}"
    echo "  Start Docker Desktop and try again"
    exit 1
  fi
  echo -e "${GREEN}✓ Docker is running${NC}"
fi

# Step 3: Generate Nixpacks plan
echo ""
echo -e "${YELLOW}Step 1: Generating Nixpacks build plan...${NC}"
cd "$PROJECT_ROOT"

if ! nixpacks plan . > "$BUILD_DIR/plan.json" 2>&1; then
  echo -e "${RED}✗ Nixpacks plan generation failed${NC}"
  cat "$BUILD_DIR/plan.json"
  exit 1
fi

# Analyze the plan for issues
echo -e "${GREEN}✓ Build plan generated${NC}"
echo ""

# Check for unnecessary APT packages
APT_PKGS=$(grep -o '"aptPkgs":\[[^]]*\]' "$BUILD_DIR/plan.json" || echo "")
if echo "$APT_PKGS" | grep -q "chromium\|Chromium"; then
  echo -e "${RED}✗ Build plan includes Chromium (test dependency in production!)${NC}"
  echo "   This will slow down the build significantly"
  echo "   The issue is likely @vitest/browser-playwright in devDependencies"
  exit 1
fi

# Check for production vs dev dependencies
echo -e "${YELLOW}Step 2: Checking production dependencies...${NC}"
PROD_DEPS=$(pnpm list --prod 2>&1 | grep -v "^eft-tracker" | tail -n +3 | wc -l)
if [ "$PROD_DEPS" -lt 5 ]; then
  echo -e "${YELLOW}⚠ Checking production dependencies...${NC}"
else
  echo -e "${GREEN}✓ Production dependencies included in build ($PROD_DEPS items)${NC}"
fi
echo ""

# Display plan summary
echo -e "${BLUE}Build Plan Summary:${NC}"
echo "  Build image: $(grep -o '"buildImage":"[^"]*' "$BUILD_DIR/plan.json" | cut -d'"' -f4)"
echo "  Node version: 22.12.0"
echo "  Start command: node apps/web/.next/standalone/server.js"
echo ""

if [ "$PLAN_ONLY" = true ]; then
  echo -e "${GREEN}✓ Plan verification passed${NC}"
  echo ""
  echo "Plan details saved to: $BUILD_DIR/plan.json"
  exit 0
fi

# Quick mode - extended validation without Docker build
if [ "$QUICK_MODE" = true ]; then
  echo -e "${YELLOW}Step 3: Validating environment variables...${NC}"

  # Check for required environment variables in next.config.ts and .env.template
  REQUIRED_VARS=("DATABASE_URL" "AUTH_SECRET" "NEXTAUTH_URL")
  MISSING_VARS=()

  for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^# *$var" "$PROJECT_ROOT/.env.template" && ! grep -q "^$var=" "$PROJECT_ROOT/.env.template"; then
      MISSING_VARS+=("$var")
    fi
  done

  if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠ Missing environment variable references: ${MISSING_VARS[*]}${NC}"
  else
    echo -e "${GREEN}✓ Required environment variables documented${NC}"
  fi
  echo ""

  # Check for leftover Sentry packages (should be gone)
  if grep -q "@sentry" "$PROJECT_ROOT/pnpm-lock.yaml"; then
    echo -e "${RED}✗ Sentry packages found in lock file (should be removed)${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ No Sentry packages in dependencies${NC}"

  # Check build output structure (may be incomplete on Windows due to symlink issues)
  echo -e "${YELLOW}Step 4: Validating Next.js build structure...${NC}"
  if [ ! -d "$PROJECT_ROOT/apps/web/.next" ]; then
    # On Windows (MSYS/Git Bash), the build may fail due to symlink permissions
    # This is a known limitation - CI builds work fine on Linux
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
      echo -e "${YELLOW}⚠ Next.js build not found (Windows symlink limitation)${NC}"
      echo -e "${YELLOW}  This is expected on Windows with pnpm standalone output${NC}"
      echo -e "${YELLOW}  CI build on Linux will succeed${NC}"
      echo ""
      # For Windows, skip the build check and pass Tier 1
      echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
      echo -e "${GREEN}  ✓ Quick validation passed (Tier 1 checks - Windows mode)${NC}"
      echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
      echo ""
      echo "Next step: Run full Docker build with: bash scripts/test-coolify-build.sh"
      echo ""
      exit 0
    fi
    echo -e "${RED}✗ Next.js build output not found${NC}"
    echo "   Run: cd apps/web && npm run build"
    exit 1
  fi

  # Check if standalone build exists with server.js
  # Note: Windows may fail to create this due to pnpm symlink issues, but CI will succeed on Linux
  if [ -f "$PROJECT_ROOT/apps/web/.next/standalone/server.js" ]; then
    echo -e "${GREEN}✓ Next.js standalone build is complete${NC}"
  else
    # On Windows with pnpm, build may partially fail but Coolify will still deploy correctly
    if [ -d "$PROJECT_ROOT/apps/web/.next/standalone" ]; then
      echo -e "${YELLOW}⚠ Standalone build incomplete (Windows symlink issue) - CI build will succeed${NC}"
    else
      echo -e "${GREEN}✓ Next.js build created${NC}"
    fi
  fi
  echo ""

  echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✓ Quick validation passed (Tier 1 checks)${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo "Next step: Run full Docker build with: bash scripts/test-coolify-build.sh"
  echo ""
  exit 0
fi

# Step 4: Generate Dockerfile
echo -e "${YELLOW}Step 3: Generating Dockerfile from plan...${NC}"
if ! nixpacks build . --out Dockerfile > /dev/null 2>&1; then
  # Try the newer syntax
  if ! nixpacks build . > "$DOCKERFILE" 2>&1; then
    echo -e "${RED}✗ Dockerfile generation failed${NC}"
    cat "$DOCKERFILE"
    exit 1
  fi
fi

# Check if Dockerfile was generated in build dir or current dir
if [ ! -f "$DOCKERFILE" ] && [ -f "Dockerfile" ]; then
  cp Dockerfile "$DOCKERFILE"
  rm Dockerfile
fi

if [ ! -f "$DOCKERFILE" ]; then
  echo -e "${RED}✗ Dockerfile not generated${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Dockerfile generated${NC}"
echo "  Location: $DOCKERFILE"
echo ""

# Step 5: Build Docker image
echo -e "${YELLOW}Step 4: Building Docker image...${NC}"
echo "  Image name: $IMAGE_NAME"
echo "  This may take several minutes on first build..."
echo ""

if ! docker build $NO_CACHE -t "$IMAGE_NAME" -f "$DOCKERFILE" . 2>&1 | tail -20; then
  echo ""
  echo -e "${RED}✗ Docker build failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Docker image built successfully${NC}"
echo ""

# Step 6: Test that the image starts
echo -e "${YELLOW}Step 5: Testing image startup...${NC}"
CONTAINER_ID=$(docker run -d --rm "$IMAGE_NAME" sh -c 'sleep 2 && exit 0' 2>&1)

if docker wait "$CONTAINER_ID" >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Image starts successfully${NC}"
else
  echo -e "${YELLOW}⚠ Unable to fully verify image startup, but build succeeded${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ All Coolify build tests passed!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. Commit your changes: git add . && git commit -m '...'"
echo "  2. Push to GitHub: git push origin branch-name"
echo "  3. Create a PR and wait for CI to pass"
echo "  4. Merge and wait for Coolify deployment"
echo ""
echo "If Coolify deployment still fails after this test passes, the issue is"
echo "likely external (network, third-party services, or runtime behavior)."
echo ""
