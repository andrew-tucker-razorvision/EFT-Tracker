# Session Context - EFT Quest Tracker

**Last Updated:** 2025-11-26

## Project Overview

**EFT Quest Tracker** - A web app to track Escape from Tarkov quest progress across all traders with dependency visualization and wiki integration.

### Core Features

1. Quest progress tracking (not started / in progress / completed)
2. Trader-organized views (Prapor, Therapist, Skier, Peacekeeper, Mechanic, Ragman, Jaeger, Fence, Lightkeeper)
3. Quest dependency visualization
4. Wiki integration (links to Tarkov Wiki)
5. User authentication (save progress)
6. Filter/search by name, trader, status, level

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Framework | Next.js 16 (App Router)          |
| Language  | TypeScript                       |
| Styling   | Tailwind CSS, shadcn/ui          |
| Database  | PostgreSQL (Neon)                |
| ORM       | Prisma                           |
| Auth      | NextAuth.js v5.0.0-beta.30       |
| Hosting   | Vercel (planned)                 |

## Environment Variables

**IMPORTANT:** The following environment variables are available and should be used:

- **GITHUB_PERSONAL_ACCESS_TOKEN**: GitHub PAT for API access (already set in environment)
  - Use with GitHub MCP tools: `mcp__github__*`
  - Required for creating issues, PRs, and other GitHub operations
  - Token is already configured - DO NOT ask user for it

## MCP Servers Configured

| Server       | Status               | Notes                                    |
| ------------ | -------------------- | ---------------------------------------- |
| GitHub       | ✅ Working           | Uses GITHUB_PERSONAL_ACCESS_TOKEN env var |
| Context7     | ✅ Working           |                                          |
| Brave Search | ✅ Working           |                                          |
| Playwright   | ✅ Working           |                                          |
| Memory       | ✅ Tested & Working  |                                          |
| Git          | ✅ Working           |                                          |
| Filesystem   | ✅ Working           |                                          |
| Docker       | ✅ Ready             |                                          |
| SQLite       | ✅ Ready             |                                          |
| Postgres     | ✅ Configured (Neon) |                                          |

## Memory MCP Workflow

The Memory MCP server persists knowledge across Claude Code sessions using a graph-based approach.

### Storage Configuration

**Storage Location:** `.claude/memory.jsonl` (in workspace)

- Configured via `MEMORY_FILE_PATH` environment variable in `.mcp.json`
- Stored in workspace, gitignored to prevent accidental commits
- Survives Claude Code restarts and devcontainer rebuilds
- **Manual sync needed:** Copy/backup this file to sync across computers

### Available Operations

1. **Create Entities** - Store project components, features, or concepts
   ```typescript
   mcp__memory__create_entities({
     entities: [{
       name: "Component Name",
       entityType: "Feature|Bug|Task|Decision",
       observations: ["key fact 1", "key fact 2"]
     }]
   })
   ```

2. **Create Relations** - Link entities together
   ```typescript
   mcp__memory__create_relations({
     relations: [{
       from: "Entity A",
       to: "Entity B",
       relationType: "implements|depends-on|fixes|relates-to"
     }]
   })
   ```

3. **Search Nodes** - Find entities by keyword
   ```typescript
   mcp__memory__search_nodes({ query: "authentication" })
   ```

4. **Read Graph** - View entire knowledge graph
   ```typescript
   mcp__memory__read_graph()
   ```

### What to Store

**DO Store:**
- Major architectural decisions and rationale
- Complex features and their implementations
- Known bugs and workarounds
- Security considerations
- Third-party integrations
- Important file locations and purposes

**DON'T Store:**
- Temporary debugging info
- Simple one-off tasks
- Information already in code comments
- Frequently changing data

### Current Memory State

- **EFT-Tracker** (Project) - Main project entity with tech stack info
- **Authentication System** (Feature) - NextAuth.js v5 implementation details

## Project Links

- **Repo:** https://github.com/andrew-tucker-razorvision/EFT-Tracker
- **Project Board:** https://github.com/users/andrew-tucker-razorvision/projects/4/views/1
- **Data Source:** https://escapefromtarkov.fandom.com/wiki/Quests

## Current Status

### Completed
- [x] Repository created and made public
- [x] MCP servers configured and tested
- [x] Next.js 16 project initialized
- [x] Database schema designed and migrated
- [x] Quest data imported (from Wiki API)
- [x] User authentication implemented (NextAuth.js v5)
- [x] Quest tracking UI built
- [x] Quest tree visualization implemented
- [x] Rate limiting added for security
- [x] CI/CD pipeline configured (GitHub Actions)

### In Progress
- [ ] Issue #55: CORS configuration (optional)

### Recent Commits
- `939b498` - Added rate limiting for auth endpoints
- `27dd6b1` - Added AUTH_SECRET configuration
- `e865b0a` - Fixed CodeQL warnings
- `124ede9` - Fixed Prisma client generation in CI

## Security Features

- **Authentication**: NextAuth.js v5 with bcrypt password hashing
- **Rate Limiting**:
  - Login: 5 attempts per 15 minutes
  - Registration: 3 attempts per hour
- **Environment Variables**: 1Password secret references
- **Database**: SSL-required PostgreSQL connection

## Notes

- Linux environment (WSL2 in devcontainer)
- Using GitHub MCP for issue management
- Quest data sourced from Tarkov Wiki API
- Repository: https://github.com/andrew-tucker-razorvision/EFT-Tracker
