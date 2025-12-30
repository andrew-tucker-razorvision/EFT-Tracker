# Quick Start Guide - EFT-Tracker

Get the EFT Quest Tracker running locally in **5 minutes**.

## Prerequisites (Already Installed?)

- **Node.js 22.12.0+** - [Download](https://nodejs.org/)
- **pnpm 9+** - Install with: `npm install -g pnpm`
- **Git** - [Download](https://git-scm.com/)
- **PostgreSQL** - Local or [Neon](https://neon.tech/) (free tier available)

## Step 1: Clone Repository (1 minute)

```bash
git clone https://github.com/tuckerandrew21/EFT-Tracker.git
cd EFT-Tracker
```

## Step 2: Install Dependencies (1 minute)

```bash
# Install all workspace packages (web app, companion app, shared utilities)
pnpm install
```

## Step 3: Set Up Environment (1 minute)

```bash
# Copy environment template
cp .env.template .env.local

# Edit with your values (database URL, auth secret, etc.)
code .env.local  # or nano, vim, your editor
```

**Required variables:**

| Variable       | Value                               |
| -------------- | ----------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string        |
| `AUTH_SECRET`  | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000`             |

**Example:**

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/eft_tracker"
AUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Step 4: Initialize Database (1 minute)

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push

# (Optional) Seed sample quest data
pnpm --filter @eft-tracker/web run db:seed
```

## Step 5: Start Development (1 minute)

```bash
# Terminal 1: Web App
pnpm dev
# Opens on http://localhost:3000 (or next available port)

# Terminal 2 (Optional): Desktop Companion App
pnpm dev:companion
```

## Done

The app is running. Visit [http://localhost:3000](http://localhost:3000) and:

1. Create an account
2. Start tracking quests
3. View quest dependencies
4. Complete quests and track progress

## Common Commands

```bash
# Development
pnpm dev                 # Run web app
pnpm dev:companion      # Run desktop app

# Building
pnpm build              # Build web app for production
pnpm build:companion    # Build desktop app

# Testing
pnpm test               # Run all tests
pnpm test:watch        # Run tests with auto-reload
pnpm test:ui           # Run tests with UI

# Quality Checks
pnpm type-check        # TypeScript validation
pnpm lint              # ESLint + Prettier
pnpm lint --fix        # Auto-fix lint issues

# Database
pnpm db:generate       # Generate Prisma types
pnpm db:push           # Apply schema changes
pnpm db:studio         # Open Prisma Studio GUI
```

## Project Structure

```
eft-tracker-monorepo/
├── apps/
│   ├── web/            # Next.js web app (main quest tracker)
│   └── companion/      # Tauri v2 desktop overlay app
├── packages/
│   ├── types/          # Shared types (@eft-tracker/types)
│   ├── utils/          # Shared utilities (@eft-tracker/utils)
│   ├── tsconfig/       # Shared TypeScript configs
│   ├── theme/          # Design system tokens
│   ├── ui/            # Shared UI components
│   └── hooks/         # Shared React hooks
└── docs/              # Documentation
```

## Troubleshooting

### "pnpm: command not found"

```bash
npm install -g pnpm
```

### "Module not found: @eft-tracker/types"

```bash
pnpm install  # Rebuild workspace links
```

### Database connection error

```bash
# Verify DATABASE_URL in .env.local
# Format: postgresql://user:password@host:port/dbname

# Test connection
psql your-database-url-here
```

### Port 3000 already in use

The dev server will automatically use the next available port (3001, 3002, etc.). Check the console output for the actual URL.

### "Prisma Client not generated"

```bash
pnpm db:generate
```

### Build fails with TypeScript errors

```bash
pnpm type-check    # See detailed errors
pnpm lint --fix    # Auto-fix linting
pnpm build         # Try again
```

## Environment Setup Options

### Local PostgreSQL

```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Windows (installer): https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql

# Connection string:
postgresql://localhost:5432/eft_tracker
```

### Neon (Recommended - Free)

1. Go to [https://neon.tech](https://neon.tech)
2. Create free account
3. Create project
4. Copy connection string to `DATABASE_URL` in `.env.local`
5. Done! ✨

## Database GUI

View and edit data visually:

```bash
pnpm db:studio
# Opens http://localhost:5555
```

## Documentation

- **[MONOREPO.md](MONOREPO.md)** - Full workspace guide
- **[docs/architecture/monorepo.md](docs/architecture/monorepo.md)** - Architecture details
- **[docs/architecture/migration-guide.md](docs/architecture/migration-guide.md)** - Migration notes
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute
- **[README.md](README.md)** - Main documentation

## Common Issues & Solutions

| Issue                     | Solution                                         |
| ------------------------- | ------------------------------------------------ |
| Database connection fails | Check `DATABASE_URL` format in `.env.local`      |
| Port already in use       | Dev server uses next available (3001, 3002, ...) |
| Module not found errors   | Run `pnpm install` to rebuild links              |
| TypeScript errors         | Run `pnpm type-check` to see details             |
| Tests fail                | Run `pnpm test -- --clearCache`                  |

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
pnpm test
pnpm type-check
pnpm lint

# Commit and push
git add .
git commit -m "feat: description of changes"
git push -u origin feature/your-feature-name

# Create pull request
gh pr create --base master
```

## Next Steps

1. ✅ **Get running** - Follow steps 1-5 above
2. 📖 **Read docs** - Check [MONOREPO.md](MONOREPO.md)
3. 🧪 **Run tests** - `pnpm test` to verify everything works
4. 🔧 **Start coding** - Create a feature branch and contribute!

---

**Total Setup Time:** 5 minutes ⚡

**Need help?** See [CONTRIBUTING.md](CONTRIBUTING.md) or open an issue on [GitHub](https://github.com/tuckerandrew21/EFT-Tracker/issues)
