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
