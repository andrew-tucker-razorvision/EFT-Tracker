# Production Dockerfile for EFT-Tracker (pnpm Monorepo)
# Multi-stage build for optimized image size and security

# Stage 1: Builder (merged deps + build)
FROM node:22.12.0-alpine AS builder
WORKDIR /app

# Install dependencies for native modules and pnpm
# hadolint ignore=DL3018
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm

# Copy pnpm configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace (root + all packages)
# IMPORTANT: Use explicit paths, not globs - Docker COPY globs don't preserve directory structure
COPY package.json ./
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/theme/package.json ./packages/theme/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/
COPY apps/companion/package.json ./apps/companion/
COPY apps/web/package.json ./apps/web/

# Copy Prisma schemas (needed for postinstall)
COPY prisma ./prisma/
COPY apps/web/prisma ./apps/web/prisma/

# Copy source code (BEFORE install so workspace is complete)
COPY apps ./apps
COPY packages ./packages

# Install all dependencies with complete workspace structure
RUN pnpm install --frozen-lockfile && \
    pnpm store prune

# Generate Prisma Client
RUN pnpm --filter @eft-tracker/web run prisma:generate

# Build Next.js with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN pnpm --filter @eft-tracker/web run build

# Verify build artifacts exist
RUN ls -la /app/apps/web/.next/standalone || (echo "ERROR: standalone output not found" && exit 1)
RUN ls -la /app/apps/web/.next/static || (echo "ERROR: static output not found" && exit 1)

# Stage 3: Runner (Production)
FROM node:22.12.0-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
# hadolint ignore=DL3018
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy production files from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
# Note: Prisma client is already included in standalone output, no need to copy separately

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
# In monorepo standalone builds, Next.js preserves the directory structure
CMD ["node", "apps/web/server.js"]
