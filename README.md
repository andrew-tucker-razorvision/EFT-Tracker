# EFT Quest Tracker

A web application to track your Escape from Tarkov quest progress across all traders, with dependency visualization and wiki integration.

## Features

- **Quest Progress Tracking** - Mark quests as not started, in progress, or completed
- **Trader Organization** - View quests organized by trader (Prapor, Therapist, Skier, Peacekeeper, Mechanic, Ragman, Jaeger, Fence, Lightkeeper)
- **Dependency Visualization** - See quest prerequisites and what unlocks after completion
- **Wiki Integration** - Direct links to the Tarkov Wiki for quest details, objectives, and rewards
- **User Accounts** - Sign up/login to save your progress across devices
- **Filter & Search** - Find quests by name, trader, status, or level requirement

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Hosting**: Vercel (app), Supabase/Neon (database)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted via [Neon](https://neon.tech), [Supabase](https://supabase.com), etc.)
- npm or pnpm

### Local Development (Recommended)

```bash
# Clone the repository
git clone https://github.com/andrew-tucker-razorvision/EFT-Tracker.git
cd EFT-Tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.template .env
# Edit .env with your database URL and auth secrets:
#   DATABASE_URL - PostgreSQL connection string
#   AUTH_SECRET - Generate with: openssl rand -base64 32
#   NEXTAUTH_URL - http://localhost:3000 for local dev

# Run database migrations and seed data
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

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

```
EFT-Tracker/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and helpers
│   └── types/            # TypeScript types
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
├── __tests__/            # Test files
│   ├── unit/             # Unit tests (hooks, utilities)
│   ├── components/       # Component tests
│   ├── integration/      # API integration tests
│   └── e2e/              # End-to-end tests
└── docs/                 # Documentation
```

## Testing

The project uses **Vitest** for testing with **React Testing Library** for component tests.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test type
npm test -- --testPathPattern="__tests__/unit"
npm test -- --testPathPattern="__tests__/components"
npm test -- --testPathPattern="__tests__/integration"
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

- Automated testing and linting on every PR
- Security scanning (CodeQL, Dependabot)
- Branch protection and quality gates
- Conventional commit enforcement

See [docs/CI_CD_SETUP.md](docs/CI_CD_SETUP.md) for complete setup guide and replication instructions.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT

---

**Created by:** Andrew Tucker
**Project Board:** [GitHub Project](https://github.com/users/andrew-tucker-razorvision/projects/4/views/1)
