#!/bin/bash
# Check production dependencies to ensure devDependencies aren't included in builds
# This prevents bloat and security issues from test tools being deployed
#
# Usage:
#   bash scripts/check-prod-deps.sh          # Quick audit
#   bash scripts/check-prod-deps.sh --strict # Fail on any suspicious packages

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
STRICT=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --strict)
      STRICT=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--strict]"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Production Dependency Audit${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

cd "$PROJECT_ROOT"

# List of packages that should NEVER be in production
FORBIDDEN_PACKAGES=(
  "@playwright/test"
  "@vitest/browser-playwright"
  "@testing-library/jest-dom"
  "@testing-library/react"
  "@testing-library/user-event"
  "vitest"
  "vitest/config"
  "@vitest/ui"
  "@vitest/coverage-v8"
  "prettier"
  "eslint"
  "lint-staged"
  "husky"
  "ts-node"
  "tsx"
  "nodemon"
  "msw"
  "jest"
  "@testing-library"
)

echo -e "${YELLOW}Checking for forbidden packages in production build...${NC}"
echo ""

# Get production dependencies
PROD_OUTPUT=$(pnpm list --prod 2>&1)

# Save to temp file for analysis
TEMP_FILE="/tmp/prod-deps-$$.txt"
echo "$PROD_OUTPUT" > "$TEMP_FILE"

# Check each forbidden package
FOUND_FORBIDDEN=0
for PACKAGE in "${FORBIDDEN_PACKAGES[@]}"; do
  if grep -q "$PACKAGE" "$TEMP_FILE"; then
    if [ "$FOUND_FORBIDDEN" -eq 0 ]; then
      echo -e "${RED}✗ Forbidden packages found in production:${NC}"
      FOUND_FORBIDDEN=1
    fi
    echo -e "${RED}  • $PACKAGE${NC}"
  fi
done

if [ "$FOUND_FORBIDDEN" -eq 1 ]; then
  echo ""
  if [ "$STRICT" = true ]; then
    echo -e "${RED}STRICT MODE: Failing due to forbidden packages in production${NC}"
    rm -f "$TEMP_FILE"
    exit 1
  else
    echo -e "${YELLOW}⚠ These packages should be in devDependencies, not production${NC}"
    echo "   If you're seeing this, check:"
    echo "   1. pnpm-lock.yaml for dependency tree issues"
    echo "   2. package.json for misplaced dependencies"
    echo "   3. Ensure --frozen-lockfile is used in nixpacks.toml"
    echo ""
  fi
fi

# Count and display production dependencies
PROD_COUNT=$(echo "$PROD_OUTPUT" | grep -E "^[a-zA-Z@]" | wc -l)
echo -e "${GREEN}✓ Production dependency check complete${NC}"
echo "  Total production packages: $PROD_COUNT"
echo ""

# Show key production packages
echo -e "${BLUE}Key Production Dependencies:${NC}"
echo "$PROD_OUTPUT" | grep -E "(prisma|next|react|axios|lodash|date-fns)" | head -10 || true
echo ""

# Recommendations
echo -e "${BLUE}Recommendations:${NC}"
echo "  1. Keep devDependencies minimal and properly marked"
echo "  2. Use 'pnpm list --prod' to verify before deployment"
echo "  3. Avoid installing optional dependencies in production"
echo "  4. Regular audits prevent surprise package bloat"
echo ""

rm -f "$TEMP_FILE"

if [ "$FOUND_FORBIDDEN" -eq 0 ]; then
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  ✓ Production dependencies look clean${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
fi
