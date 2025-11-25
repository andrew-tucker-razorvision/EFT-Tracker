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
- PostgreSQL database (local or hosted)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/andrew-tucker-razorvision/EFT-Tracker.git
cd EFT-Tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and auth secrets

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Development with VS Code Dev Containers (Recommended)

The easiest way to get started is using the VS Code Dev Container, which provides a pre-configured development environment with all tools installed.

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [VS Code](https://code.visualstudio.com/)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [1Password CLI](https://developer.1password.com/docs/cli) (for secret management)

#### Quick Start
1. Clone the repository
2. Generate `.env` file on your host:
   ```bash
   op inject -i .env.template -o .env
   ```
3. Open in VS Code
4. Click "Reopen in Container" when prompted (or use Command Palette: "Dev Containers: Reopen in Container")
5. Wait for container setup to complete (~2-3 minutes first time)
6. Start coding! All dependencies and tools are pre-installed.

#### What's Included
- Node.js LTS, TypeScript, ESLint, Prettier
- 1Password CLI for secure secret management
- Claude Code AI assistant
- GitHub CLI
- Persistent bash history and command history
- Isolated `node_modules` (prevents WSL2 binary conflicts)

See [.devcontainer/README.md](.devcontainer/README.md) for detailed configuration and troubleshooting.

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

| Type | Location | Description |
|------|----------|-------------|
| Unit | `__tests__/unit/` | Hooks, utilities, pure functions |
| Component | `__tests__/unit/components/` | React component rendering & interactions |
| Integration | `__tests__/integration/api/` | API endpoint tests with mocked database |
| E2E | `__tests__/e2e/` | Browser automation tests |

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT

---

**Created by:** Andrew Tucker
**Project Board:** [GitHub Project](https://github.com/users/andrew-tucker-razorvision/projects/4/views/1)
