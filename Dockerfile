# Production Dockerfile for EFT-Tracker (Monorepo)
# Multi-stage build for optimized image size and security

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies for native modules and pnpm
# hadolint ignore=DL3018
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm

# Copy pnpm configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package files (root and workspaces)
COPY package.json ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Copy Prisma schema (needed for postinstall script)
COPY prisma ./prisma/
COPY apps/web/prisma ./apps/web/prisma/

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile && \
    pnpm store prune

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
# hadolint ignore=DL3018
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy application code
COPY . .

# Generate Prisma Client for web app
RUN pnpm --filter @eft-tracker/web run prisma:generate

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN pnpm --filter @eft-tracker/web run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
# hadolint ignore=DL3018
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
