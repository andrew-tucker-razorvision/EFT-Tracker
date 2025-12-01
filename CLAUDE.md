# EFT-Tracker Project Notes

## Development Workflow

### After Pushing Code

Always clear the Next.js cache after pushing code to ensure changes are visible:

```bash
rm -rf .next && npx prisma generate
```

Then restart the dev server:

```bash
npm run dev
```

### Database Schema Changes

After modifying `prisma/schema.prisma`, sync to remote database:

```bash
npx prisma db push
```

## Tech Stack

- Next.js 16 with Turbopack
- Prisma ORM with PostgreSQL (Neon)
- NextAuth for authentication
- Tailwind CSS for styling

### Pull Request Workflow

After creating a PR, automatically monitor CI status using the GitHub check-runs API:

```bash
# Get PR head SHA first, then check runs
curl -s "https://api.github.com/repos/andrew-tucker-razorvision/EFT-Tracker/commits/{SHA}/check-runs" | jq -r '.check_runs[] | "\(.status) \(.conclusion // "pending") - \(.name)"'
```

1. Get the PR's head commit SHA from `mcp__github__get_pull_request`
2. Use curl with the check-runs API (NOT `mcp__github__get_pull_request_status` - that uses the old status API which doesn't work with GitHub Actions)
3. If any check has `status: "in_progress"` or `"queued"`, check again after ~60 seconds
4. When all checks complete, notify the user with:
   - Final status (success/failure)
   - Link to the PR
   - If failed, which checks failed
5. If checks pass and PR is ready, ask if user wants to merge
