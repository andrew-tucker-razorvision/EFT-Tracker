# New Local Development Server

Kill all node processes, generate Prisma client, remove .next cache, and start a fresh dev server.

## Steps

1. Kill all running node processes using `taskkill /F /IM node.exe`
2. Remove the `.next` folder from `apps/web`
3. Run `pnpm --filter @eft-tracker/web run prisma:generate`
4. Start the dev server with `npm run dev`

Report the localhost URL when the server is ready.
