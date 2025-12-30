# Contributing to EFT-Tracker

Thank you for your interest in contributing to EFT-Tracker! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Monorepo Workflow](#monorepo-workflow)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Getting Help](#getting-help)

## Code of Conduct

This project follows our [Code of Conduct](docs/guides/CODE_OF_CONDUCT.md). By participating, you agree to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Git** - Version control
- **GitHub account** - For pull requests
- **Node.js 22.12.0+** - [Download](https://nodejs.org/)
- **pnpm 9+** - Install with: `npm install -g pnpm`
- **PostgreSQL** - Local or [Neon](https://neon.tech/) (for development)
- **GitHub CLI** (optional but recommended) - For automation
- **Code editor** - VS Code, Vim, etc.

### Initial Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:

   ```bash
   git clone https://github.com/your-username/EFT-Tracker.git
   cd EFT-Tracker
   ```

3. **Add upstream remote**:

   ```bash
   git remote add upstream https://github.com/tuckerandrew21/EFT-Tracker.git
   ```

4. **Install dependencies** (monorepo workspaces):

   ```bash
   pnpm install
   ```

5. **Set up environment** (see [QUICKSTART.md](QUICKSTART.md)):

   ```bash
   cp .env.template .env.local
   # Edit .env.local with your database URL and auth secret
   ```

6. **Initialize database**:

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes** - Fix issues in the web app, companion app, or shared packages
- ✨ **New features** - Add new quest tracking features, UI improvements, or desktop app enhancements
- 📚 **Documentation** - Improve guides, add examples, fix typos
- 🧪 **Tests** - Add unit, integration, or E2E tests
- 💡 **Ideas** - Suggest improvements via issues

### Finding Something to Work On

- Browse [open issues](https://github.com/tuckerandrew21/EFT-Tracker/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Check the [GitHub project](https://github.com/users/tuckerandrew21/projects/1) for planned work
- Propose new ideas by opening an issue first

## Monorepo Workflow

EFT-Tracker is organized as a **pnpm monorepo** with multiple apps and shared packages.

### Project Structure

```text
eft-tracker-monorepo/
├── apps/
│   ├── web/            # Next.js web app (main application)
│   └── companion/      # Tauri v2 desktop companion app
├── packages/
│   ├── types/          # Shared TypeScript types
│   ├── utils/          # Shared utilities
│   ├── tsconfig/       # Shared TypeScript configs
│   ├── theme/          # Design system tokens
│   ├── ui/            # Shared React components
│   └── hooks/         # Shared React hooks
└── docs/              # Documentation
```

### Working on Different Parts

**Web app (apps/web/):**

```bash
# Run dev server
pnpm dev

# Or be explicit
pnpm --filter @eft-tracker/web dev
```

**Companion app (apps/companion/):**

```bash
# Run Tauri dev
pnpm dev:companion

# Or be explicit
pnpm --filter @eft-tracker/companion dev
```

**Shared packages (packages/\*):**

```bash
# Changes to shared packages are automatically reflected in apps
# No special build step needed - just modify the files

# Run type-check to verify changes
pnpm type-check
```

### Running Common Commands

```bash
# Run tests for all workspaces
pnpm test

# Type check all workspaces
pnpm type-check

# Lint all workspaces
pnpm lint

# Build web app
pnpm build

# Build companion app
pnpm build:companion

# Add dependency to web app
pnpm --filter @eft-tracker/web add lodash

# Add dependency to shared package
pnpm --filter @eft-tracker/types add zod
```

### Importing Shared Code

When using types or utilities in the apps:

```typescript
// From shared types package
import type { Quest } from "@eft-tracker/types";

// From shared utils package
import { formatDate } from "@eft-tracker/utils";

// From web app (backward compatible)
import type { Quest } from "@/types";
```

## Development Workflow

### 1. Create a Branch

Always create a feature branch from `master`:

```bash
git checkout master
git pull upstream master
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**

- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `bugfix/` - Bug fixes (alternative)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

See [docs/guides/BRANCH_STRATEGY.md](docs/guides/BRANCH_STRATEGY.md) for complete guidelines.

### 2. Make Your Changes

- Follow the [Coding Standards](docs/guides/CODING_STANDARDS.md)
- Keep changes focused and atomic
- Write clear, descriptive commit messages
- Test your changes thoroughly

### 3. Commit Your Changes

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
git commit -m "feat: add new MCP server configuration"
git commit -m "fix: correct broken link in README"
git commit -m "docs: improve quick start instructions"
```

**Commit types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Formatting, no code change
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 4. Keep Your Branch Updated

Regularly sync with upstream:

```bash
git fetch upstream
git rebase upstream/master
```

### 5. Run Validation Before Pushing

```bash
# Type check
pnpm type-check

# Lint and format
pnpm lint

# Run tests
pnpm test

# Build web app
pnpm build

# Build companion app (optional)
pnpm build:companion
```

### 6. Push Your Changes

```bash
git push origin feature/your-feature-name
```

## Pull Request Process

### Before Submitting

- [ ] Changes are focused on a single concern
- [ ] Code follows project coding standards
- [ ] Tests are passing: `pnpm test`
- [ ] Type check passes: `pnpm type-check`
- [ ] Lint passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow conventional format
- [ ] Branch is up to date with `master`

### Submitting a Pull Request

1. **Push your branch** to your fork
2. **Open a pull request** targeting `master` on GitHub
3. **Fill out the PR template** completely
4. **Link related issues** (e.g., "Closes #123" or "Fixes #123")
5. **Request review** from maintainers
6. **Monitor CI checks** - all must pass before merge

### PR Title and Description

**Title format:**

```
feat: add new quest filter feature
fix: resolve database migration error
docs: update monorepo contribution guide
```

**Description should include:**

- What problem does this solve?
- How does it solve the problem?
- Are there any side effects or breaking changes?
- Link to related issues/designs
- Testing notes (if applicable)

### Review Process

- Maintainers will review your PR within 1-3 business days
- Address any requested changes promptly
- Keep the conversation focused and respectful
- Once approved, a maintainer will merge your PR

### After Merging

- Delete your feature branch (locally and on GitHub)
- Update your local master branch:

  ```bash
  git checkout master
  git pull upstream master
  ```

## Testing

### Running Tests Locally

Before submitting a PR, run all tests locally:

```bash
# Unit and integration tests
pnpm test

# Watch mode for development
pnpm test:watch

# UI mode for interactive testing
pnpm test:ui

# Specific test file
pnpm test -- __tests__/unit/my-feature.test.ts
```

### Test Coverage

- **Unit Tests** - Pure functions, utilities, business logic
- **Integration Tests** - React components with mocked APIs
- **E2E Tests** - Critical user journeys (run via CI)

See [MONOREPO.md](MONOREPO.md#testing) for testing details.

### Type Safety

```bash
# Check for TypeScript errors
pnpm type-check

# Regenerate Prisma types (after schema changes)
pnpm db:generate
```

### Code Quality

```bash
# Check linting and formatting
pnpm lint

# Auto-fix linting and formatting issues
pnpm lint --fix
```

## Coding Standards

Follow the standards in [docs/guides/CODING_STANDARDS.md](docs/guides/CODING_STANDARDS.md).

**Quick checklist:**

- Use TypeScript for all new code
- Follow ESLint rules (auto-fixed by pre-commit hook)
- Write tests for new functionality
- Use descriptive variable/function names
- Keep functions small and focused
- Add JSDoc comments for public APIs
- Import from shared packages when possible

### Web App Standards (Next.js)

- Use App Router (not Pages Router)
- Place components in `apps/web/src/components/`
- Use TypeScript for all files
- Utilize shared types from `@eft-tracker/types`
- Keep components functional and export default

### Shared Package Standards

- Export from `src/index.ts`
- Include TypeScript types
- Add JSDoc comments
- Create re-export in appropriate files
- Add to monorepo `exports` in package.json

### Companion App Standards (Tauri)

- Use React for UI
- Organize Rust code in `src-tauri/`
- Update auto-updater version when releasing
- Test on Windows and macOS before merging

## Documentation

See [docs/guides/DOCUMENTATION_GUIDELINES.md](docs/guides/DOCUMENTATION_GUIDELINES.md) for documentation standards.

**Quick checklist:**

- Use GitHub-flavored Markdown
- Keep lines under 120 characters
- Include code examples
- Add table of contents for long files
- Update related documentation
- Test all code examples

## Getting Help

### Quick Resources

- **Getting started:** [QUICKSTART.md](QUICKSTART.md) - Get running in 5 minutes
- **Monorepo guide:** [MONOREPO.md](MONOREPO.md) - Workspace structure and commands
- **Architecture:** [docs/architecture/monorepo.md](docs/architecture/monorepo.md) - System design
- **Documentation:** [docs/](docs/) - All project documentation
- **Coding standards:** [docs/guides/CODING_STANDARDS.md](docs/guides/CODING_STANDARDS.md) - Code guidelines

### Questions and Support

- **Setup problems:** Check [QUICKSTART.md](QUICKSTART.md) first
- **Development questions:** See [MONOREPO.md](MONOREPO.md)
- **General questions:** [Open a discussion](https://github.com/tuckerandrew21/EFT-Tracker/discussions)
- **Bugs or issues:** [Open an issue](https://github.com/tuckerandrew21/EFT-Tracker/issues)
- **Security issues:** See [docs/security/SECURITY.md](docs/security/SECURITY.md)

### Communication

- Be respectful and constructive
- Provide context and details
- Search existing issues before creating new ones
- Use appropriate labels on issues
- Mention related issues in PRs

## Recognition

Thank you for contributing! Contributors will be:

- Mentioned in commit messages and PR history
- Recognized in release notes
- Credited in project documentation

---

**Questions?** Open an issue or discussion. We're here to help! 🙌

For more details, see [MONOREPO.md](MONOREPO.md) or the full [documentation](docs/)
