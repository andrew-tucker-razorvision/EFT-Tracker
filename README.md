# EFT Quest Tracker

A web application to track your Escape from Tarkov quest progress across all traders, with dependency visualization and wiki integration.

## Features

- **Quest Progress Tracking** - Mark quests as not started, in progress, or completed
- **Trader Organization** - View quests organized by trader (Prapor, Therapist, Skier, Peacekeeper, Mechanic, Ragman, Jaeger, Fence, Lightkeeper)
- **Dependency Visualization** - See quest prerequisites and what unlocks after completion
- **Wiki Integration** - Direct links to the Tarkov Wiki for quest details, objectives, and rewards
- **User Accounts** - Sign up/login to save your progress across devices
- **Filter & Search** - Find quests by name, trader, status, or level requirement

## User Documentation

New to EFT Quest Tracker? Check out our comprehensive guides:

- **[Getting Started Guide](docs/user-guide/getting-started.md)** - Set up your account and start tracking quests
- **[Quest Tracking Tutorial](docs/user-guide/quest-tracking.md)** - Master all features and keyboard shortcuts
- **[Companion App Guide](docs/user-guide/companion-app.md)** - Learn about the desktop overlay (coming soon)
- **[Troubleshooting](docs/user-guide/troubleshooting.md)** - Fix common issues
- **[FAQ](docs/user-guide/faq.md)** - Answers to frequently asked questions

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Hosting**: Vercel (app), Supabase/Neon (database)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted via [Neon](https://neon.tech), [Supabase](https://supabase.com), etc.)
- **pnpm** (v10+) - [Installation guide](https://pnpm.io/installation)

### Local Development (Recommended)

```bash
# Clone the repository
git clone https://github.com/tuckerandrew21/EFT-Tracker.git
cd EFT-Tracker

# Install pnpm (if not already installed)
npm install -g pnpm

# Install dependencies (monorepo workspaces)
pnpm install

# Set up environment variables
cp .env.template .env.local
# Edit .env.local with your database URL and auth secrets:
#   DATABASE_URL - PostgreSQL connection string
#   AUTH_SECRET - Generate with: openssl rand -base64 32
#   NEXTAUTH_URL - Your dev server URL (e.g., http://localhost:3000)

# Run database migrations and seed data (web app)
pnpm --filter @eft-tracker/web run db:push
pnpm --filter @eft-tracker/web run db:seed

# Start development server
pnpm dev
```

The dev server will start on an available port (typically 3000). Check the console output for the actual URL.

For detailed information about the monorepo structure, see [MONOREPO.md](MONOREPO.md).

### Alternative: VS Code Dev Containers

> **Note:** Dev containers provide a consistent environment but can have authentication and performance issues. Local development is recommended for most users.

If you prefer a containerized environment:

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop) and [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Generate `.env` file: `cp .env.template .env` (fill in values)
3. Open in VS Code and click "Reopen in Container"

See [docs/DEV_CONTAINER_SETUP.md](docs/DEV_CONTAINER_SETUP.md) for full dev container setup guide.

## Docker Deployment

### Development Container

The dev container is optimized for cross-platform development with:

- **Security**: Pinned base image (`ubuntu-24.04`), version-locked packages, GPG verification
- **Performance**: Volume mounts for node_modules (prevents cross-platform binary issues)
- **Tooling**: Pre-configured VS Code extensions and CLI tools

### Production Container

Deploy to any container orchestrator with the production-ready Dockerfile:

```bash
# Build production image
docker build -t eft-tracker:latest .

# Run production container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  eft-tracker:latest
```

#### Production Features

- **Multi-stage build**: Optimized image size (~150MB with Alpine Linux)
- **Security**: Non-root user, minimal attack surface
- **Health checks**: Built-in endpoint at `/api/health`
- **Orchestration ready**: Works with Kubernetes, ECS, Docker Compose

See [docs/PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) for comprehensive deployment guide including:

- Container registry setup
- Kubernetes manifests
- AWS ECS task definitions
- Environment variable configuration
- Security best practices
- Monitoring and troubleshooting

### Security Scanning

Automated security scanning runs on every PR and weekly via GitHub Actions:

- **Trivy**: Vulnerability scanning for container images
- **Hadolint**: Dockerfile best practices linting
- Results integrated with GitHub Security tab

## Project Structure

This is a **pnpm monorepo** with the following structure:

```
EFT-Tracker/
├── apps/
│   ├── web/                      # Next.js web application
│   │   ├── src/
│   │   │   ├── app/             # Next.js App Router pages & API routes
│   │   │   ├── components/      # React components
│   │   │   ├── lib/             # Utilities and helpers
│   │   │   └── types/           # TypeScript types (re-exports from @eft-tracker/types)
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Database schema
│   │   ├── public/              # Static assets
│   │   └── package.json
│   │
│   └── companion/                # Tauri v2 desktop app
│       ├── src/                 # React components
│       ├── src-tauri/           # Rust backend
│       ├── tests/               # E2E tests
│       └── package.json
│
├── packages/
│   ├── types/                    # @eft-tracker/types - Shared TypeScript types
│   │   ├── src/
│   │   │   ├── quest.ts         # Quest domain types
│   │   │   ├── api.ts           # API contract types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── utils/                    # @eft-tracker/utils - Shared utilities
│   │   ├── src/
│   │   │   ├── formatters.ts    # Date/string formatting
│   │   │   ├── validators.ts    # Validation schemas
│   │   │   ├── constants.ts     # Domain constants
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── tsconfig/                 # @eft-tracker/tsconfig - Shared TypeScript configs
│       ├── base.json
│       ├── nextjs.json
│       ├── react.json
│       └── package.json
│
├── __tests__/                    # Root test directory
│   ├── unit/                     # Unit tests (hooks, utilities)
│   ├── integration/              # Component & API integration tests
│   ├── fixtures/                 # Test fixtures
│   ├── mocks/                    # MSW handlers
│   └── setup/                    # Test setup files
│
├── .github/workflows/            # GitHub Actions CI/CD
├── docs/                         # Documentation
├── pnpm-workspace.yaml           # Monorepo configuration
├── pnpm-lock.yaml                # Dependency lock file
├── MONOREPO.md                   # Monorepo developer guide
└── package.json                  # Root workspace configuration
```

See [MONOREPO.md](MONOREPO.md) for detailed information about the monorepo structure and workspace commands.

## Testing

The project uses **Vitest** for testing with **React Testing Library** for component tests.

### Running Tests

```bash
# Run all tests (monorepo)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage

# Run specific test type
pnpm test -- __tests__/unit/
pnpm test -- __tests__/integration/

# Run web app tests only
pnpm --filter @eft-tracker/web run test

# Run companion app tests only
pnpm --filter @eft-tracker/companion run test
```

### Test Structure

| Type        | Location                     | Description                              |
| ----------- | ---------------------------- | ---------------------------------------- |
| Unit        | `__tests__/unit/`            | Hooks, utilities, pure functions         |
| Component   | `__tests__/unit/components/` | React component rendering & interactions |
| Integration | `__tests__/integration/api/` | API endpoint tests with mocked database  |
| E2E         | `__tests__/e2e/`             | Browser automation tests                 |

### Test Configuration

- **Framework**: Vitest (v4.x)
- **React Testing**: @testing-library/react
- **Mocking**: Vitest mocks for Prisma, bcryptjs, NextAuth
- **Coverage Provider**: V8

### Coverage Goals

- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

### Visual Regression Baselines

Visual baselines for responsive design testing are stored in:

- `.claude/qa/baselines/desktop/` - Desktop (1280x720)
- `.claude/qa/baselines/tablet/` - Tablet (768x1024)
- `.claude/qa/baselines/mobile/` - Mobile (375x667)

### Claude Code Integration

Use the `/run-qa` slash command to execute the full test suite with detailed output.

## Data Sources

Quest data sourced from the [Escape from Tarkov Wiki](https://escapefromtarkov.fandom.com/wiki/Quests).

## CI/CD Pipeline

This project uses a comprehensive CI/CD pipeline with GitHub Actions, including:

- Automated testing and linting on every PR (using pnpm workspaces)
- Security scanning (pnpm audit, secret scanning with TruffleHog)
- Branch protection and quality gates
- Conventional commit enforcement
- E2E tests with Playwright on `master` branch
- Per-workspace lint and type-check jobs

### Monorepo-Aware Pipeline

The CI/CD pipeline is configured to handle the pnpm monorepo structure:

```bash
# Each app gets separate lint and type-check jobs
pnpm --filter @eft-tracker/web run lint
pnpm --filter @eft-tracker/companion run lint

# Tests run across all apps
pnpm run test

# Builds are per-app
pnpm --filter @eft-tracker/web run build

# Security audits the entire dependency tree
pnpm audit --prod --audit-level=high
```

### Branch Workflow

This project uses a simplified `master` workflow for active development:

```text
feature/* → master → production
```

- **Development**: Create feature branches from `master` and PR back to `master`
- **CI checks**: All PRs run lint, type-check, tests, build, and security audits
- **Production deployment**: Merging to `master` triggers automatic deployment to Coolify
- **E2E testing**: Runs locally before PR; CI runs include optional E2E validation
- **Hotfixes**: Use `hotfix/` prefix, same workflow as features

See [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md) for complete setup guide and replication instructions.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT

---

**Created by:** Andrew Tucker
**Project Board:** [GitHub Project](https://github.com/users/tuckerandrew21/projects/4/views/1)
