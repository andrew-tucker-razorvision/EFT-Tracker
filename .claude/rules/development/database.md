# Database Schema Changes

After modifying `prisma/schema.prisma`, sync to remote database:

```bash
npx prisma db push
```

This applies your schema changes to the connected database and generates the Prisma client.

**Note:** Always review your schema changes carefully before pushing, as some changes may result in data loss in development databases.

## Quest Data Scripts

Two scripts exist for managing quest data:

### `prisma/seed.ts` - Full Reset (DESTRUCTIVE)

WARNING: Deletes ALL user progress!

Use only for:

- Fresh development database setup
- Complete data reset when progress doesn't matter

```bash
npx tsx prisma/seed.ts
```

### `prisma/update-quests.ts` - Safe Update (PRESERVES PROGRESS)

RECOMMENDED for production updates.

Use for:

- Updating quest metadata (title, level, location, etc.)
- Adding new quests from tarkov.dev API
- Refreshing objectives and dependencies

```bash
npx tsx prisma/update-quests.ts
```

This script preserves all `QuestProgress` records while updating quest data.
