# Documentation Index

Comprehensive documentation for the EFT-Tracker project - a pnpm monorepo for quest tracking across multiple apps.

## 🚀 Quick Start

New to EFT-Tracker? Start here:

- **[QUICKSTART.md](../QUICKSTART.md)** - Get running in 5 minutes
- **[MONOREPO.md](../MONOREPO.md)** - Full workspace structure and commands
- **[architecture/migration-guide.md](architecture/migration-guide.md)** - What changed from old structure

## 📚 Documentation Structure

### 🏗️ Architecture

Monorepo structure and design:

- **[architecture/monorepo.md](architecture/monorepo.md)** - Workspace structure, packages, apps, and workflows
- **[architecture/migration-guide.md](architecture/migration-guide.md)** - Migration from single-app to monorepo
- **[../MONOREPO.md](../MONOREPO.md)** - Setup, commands, and common workflows

### 🎯 Apps & Packages

Documentation for specific workspaces:

- **apps/web/** - Next.js web application (see [../README.md](../README.md))
- **apps/companion/** - Tauri v2 desktop companion app
- **packages/types/** - Shared TypeScript type definitions
- **packages/utils/** - Shared utility functions
- **packages/tsconfig/** - Centralized TypeScript configs
- **packages/theme/** - Design system tokens
- **packages/ui/** - Shared React components
- **packages/hooks/** - Shared React hooks

### 📖 Development Guides

Best practices and standards:

- **[guides/BRANCH_STRATEGY.md](guides/BRANCH_STRATEGY.md)** - Git workflow and branch naming
- **[guides/CODING_STANDARDS.md](guides/CODING_STANDARDS.md)** - Code quality guidelines
- **[guides/CODE_OF_CONDUCT.md](guides/CODE_OF_CONDUCT.md)** - Community guidelines
- **[guides/DOCUMENTATION_GUIDELINES.md](guides/DOCUMENTATION_GUIDELINES.md)** - Documentation best practices

### 🚀 Deployment

Production deployment and operations:

- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Deployment procedures
- **[coolify-deployment.md](coolify-deployment.md)** - Coolify deployment monitoring API
- **[LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md)** - Pre-launch validation
- **[LAUNCH_VALIDATION.md](LAUNCH_VALIDATION.md)** - Launch validation steps

### 🗄️ Database

Database management and migrations:

- **[DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md)** - Prisma migrations and schema changes
- **[DATABASE_BRANCHING.md](DATABASE_BRANCHING.md)** - Database branching strategy (Neon)
- **[DATABASE_BACKUPS.md](DATABASE_BACKUPS.md)** - Backup and recovery procedures

### 🔒 Security

Security policies and best practices:

- **[security/SECURITY.md](security/SECURITY.md)** - Security policy and reporting
- **[INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md)** - Incident response procedures

### 🔌 Integrations

Third-party service setup:

- **[integrations/MCP_SETUP.md](integrations/MCP_SETUP.md)** - Model Context Protocol servers
- **[SENTRY_SETUP.md](SENTRY_SETUP.md)** - Error tracking configuration
- **[CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)** - CDN and DNS setup
- **[CI_CD_SETUP.md](CI_CD_SETUP.md)** - GitHub Actions and automation

### 📊 API & Testing

API documentation and testing guides:

- **[API.md](API.md)** - API routes and endpoints
- **[API_RATE_LIMITS.md](API_RATE_LIMITS.md)** - Rate limiting configuration
- **[LOAD_TEST_RESULTS.md](LOAD_TEST_RESULTS.md)** - Performance testing results

## 🔍 Quick Links

### For New Contributors

1. **Setup:** [QUICKSTART.md](../QUICKSTART.md) - Get running locally
2. **Learn:** [MONOREPO.md](../MONOREPO.md) - Understand the structure
3. **Code:** [guides/CODING_STANDARDS.md](guides/CODING_STANDARDS.md) - Code quality standards
4. **Workflow:** [guides/BRANCH_STRATEGY.md](guides/BRANCH_STRATEGY.md) - Git workflow

### For Current Developers

1. **Status:** [../README.md](../README.md) - Project overview
2. **Commands:** [../MONOREPO.md](../MONOREPO.md) - Common pnpm commands
3. **Standards:** [guides/CODING_STANDARDS.md](guides/CODING_STANDARDS.md) - Code guidelines
4. **Testing:** [LOAD_TEST_RESULTS.md](LOAD_TEST_RESULTS.md) - Performance benchmarks

### For Deployers

1. **Deployment:** [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Deploy to production
2. **Monitoring:** [coolify-deployment.md](coolify-deployment.md) - Monitor deployments
3. **Checklist:** [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) - Pre-launch validation
4. **Incidents:** [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) - Handle incidents

### For DevOps

1. **CI/CD:** [CI_CD_SETUP.md](CI_CD_SETUP.md) - GitHub Actions workflows
2. **Database:** [DATABASE_MIGRATIONS.md](DATABASE_MIGRATIONS.md) - Schema management
3. **Backups:** [DATABASE_BACKUPS.md](DATABASE_BACKUPS.md) - Backup procedures
4. **Security:** [security/SECURITY.md](security/SECURITY.md) - Security policies

## 📂 Document Organization

```text
docs/
├── architecture/          # System design and structure
│   ├── monorepo.md       # Workspace structure
│   └── migration-guide.md # Migration documentation
├── guides/               # Best practices
├── integrations/         # Third-party services
├── security/             # Security policies
├── getting-started/      # Onboarding docs
├── plans/                # Project plans
├── API.md               # API documentation
├── DATABASE_*.md        # Database guides
├── CI_CD_SETUP.md       # Automation setup
└── PRODUCTION_DEPLOYMENT.md
```

## 💡 Navigation Tips

- **New to the project?** Start with [QUICKSTART.md](../QUICKSTART.md)
- **Need to deploy?** See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- **Writing code?** Check [guides/CODING_STANDARDS.md](guides/CODING_STANDARDS.md)
- **Contributing?** Read [guides/CODE_OF_CONDUCT.md](guides/CODE_OF_CONDUCT.md)
- **Monorepo commands?** See [../MONOREPO.md](../MONOREPO.md)

---

**Need help?** Check the main [README.md](../README.md) or open an [issue](https://github.com/tuckerandrew21/EFT-Tracker/issues)
