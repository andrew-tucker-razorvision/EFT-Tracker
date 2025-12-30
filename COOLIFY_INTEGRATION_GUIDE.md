# Coolify HTTP API Integration - Implementation Guide

## What Was Accomplished

Successfully implemented Coolify HTTP REST API integration to replace SSH-based deployment monitoring. The implementation was merged to master on 2025-12-16 and automatically deployed to production via Coolify webhook.

### Implementation Details

**Files Created:**
- `packages/utils/src/coolify-api.ts` - TypeScript HTTP API client with Bearer token authentication
  - `CoolifyAPIClient` class with methods: `testConnection()`, `getDeployment()`, `listDeployments()`
  - Singleton pattern via `getCoolifyAPIClient()` function
  - Type-safe interfaces for API responses

- `apps/web/src/app/api/deployment/logs/route.ts` - GET endpoint for deployment logs
  - Query param: `deploymentId=<uuid>`
  - Returns: deployment logs, status, commit info, timestamp

- `apps/web/src/app/api/deployment/status/route.ts` - GET endpoint for deployment status
  - Query param: `deploymentId=<uuid>`
  - Returns: full deployment object with status, URLs, timestamps

- `docs/coolify-deployment.md` - Complete technical documentation (270+ lines)
  - Setup instructions, API examples, troubleshooting guide
  - Security notes for token management
  - API reference with status values and error codes

**Files Modified:**
- `.env.template` - Added HTTP API and deprecated SSH configuration examples
- `packages/utils/src/index.ts` - Exported new API client
- `CLAUDE.md` - Added pre-commit checklist and quick reference
- `packages/utils/src/coolify-ssh.ts` - Marked with `@deprecated` comment
- `scripts/tools/coolify-ssh.sh` - Updated with deprecation notice

**Environment Variables (in `.env.local`):**
```bash
COOLIFY_API_URL=http://95.217.155.28:8000/api/v1
COOLIFY_API_TOKEN=1|CWgPXdPwfIOsBmLy1gYhR4ZR8Z69RWjbFwH39Wj4c8d373ff
```

### Benefits

✅ No SSH key management complexity
✅ Works reliably on Windows (no PATH/SSH issues)
✅ Bearer token authentication with scoped permissions
✅ Type-safe TypeScript implementation
✅ Standard REST patterns consistent with codebase
✅ Comprehensive error handling and validation
✅ Future-agent ready documentation

### CI/CD Status

All checks passed before merge:
- ✅ Lint & Format (SUCCESS)
- ✅ Tests (SUCCESS)
- ✅ Security Audit (SUCCESS)
- ✅ Dependency Review (SUCCESS)
- ✅ Build (SUCCESS)
- ✅ All PR validation checks (SUCCESS)

PR #283 merged with squash to master on 2025-12-16 at 18:22:31 UTC.

## Deployment Status

**Application Status:** `running:healthy`
**Last Online:** 2025-12-16 18:26:21 UTC
**URL:** https://learntotarkov.com

### Next Steps & Known Issues

1. **Verify API Endpoints Work**
   - Test the new endpoints with actual deployment UUIDs
   - Command: `curl "http://localhost:3000/api/deployment/status?deploymentId=<uuid>"`
   - See `docs/coolify-deployment.md` for full examples

2. **Monitor First Deployment**
   - Watch the application dashboard to confirm new code is running
   - Check for any deployment errors in Coolify UI
   - The build was triggered automatically via GitHub webhook

3. **API Token Security**
   - Token is stored in `.env.local` (never committed)
   - Currently using read-only permissions (recommended)
   - Plan periodic token rotation (monthly recommended)
   - Create separate tokens for staging/production if needed

## Pre-Commit Workflow (Future Agents)

**CRITICAL:** Always run these checks locally before committing:

```bash
# 1. Format with Prettier
npx prettier --write <files-changed>

# 2. Lint
npm run lint

# 3. Type check
npm run typecheck

# 4. Run tests (optional but recommended)
npm test

# 5. Build (optional but recommended)
npm run build
```

Prettier formatting failures are the most common CI blocker. Run it before every commit to avoid this.

See `CLAUDE.md` section "Pre-Commit Checklist" for more details.

## API Usage Examples

### Get Deployment Status
```typescript
import { getCoolifyAPIClient } from '@eft-tracker/utils';

const client = getCoolifyAPIClient();
const deployment = await client.getDeployment('ogo0gkc8488sccwgocwkc8gw');
console.log(`Status: ${deployment.status}`);
console.log(`URL: ${deployment.deployment_url}`);
```

### API Endpoint (Backend)
```bash
GET /api/deployment/status?deploymentId=<uuid>
```

Response:
```json
{
  "deploymentId": "ogo0gkc8488sccwgocwkc8gw",
  "status": "finished",
  "applicationName": "EFT-Tracker",
  "commit": "abc123def456",
  "commitMessage": "feat: Add new feature",
  "deploymentUrl": "https://learntotarkov.com",
  "createdAt": "2025-12-16T11:00:00.000Z",
  "updatedAt": "2025-12-16T11:05:00.000Z",
  "timestamp": "2025-12-16T11:05:30.000Z"
}
```

## SSH Access (Deprecated - Fallback Only)

The SSH implementation is kept for backward compatibility but should NOT be used for new code:

- **File:** `packages/utils/src/coolify-ssh.ts`
- **Status:** @deprecated - use HTTP API instead
- **Reason:** SSH key management is complex, doesn't work well on Windows, and the HTTP API is more reliable

If SSH access becomes necessary as a temporary fallback:
1. See `docs/coolify-deployment.md` section "Alternative: SSH Access (Deprecated)"
2. Generate ED25519 key in Coolify UI without passphrase
3. Add to `.env.local` (never commit)

## Troubleshooting

**API Connection Failed:**
- Verify `COOLIFY_API_URL=http://95.217.155.28:8000/api/v1`
- Verify `COOLIFY_API_TOKEN` is in `.env.local`
- Test with: `curl -H "Authorization: Bearer <token>" http://95.217.155.28:8000/api/v1/version`

**Deployment Not Found (404):**
- Verify you have the deployment UUID (not app ID)
- Confirm deployment exists in Coolify UI
- Check token permissions are "read-only" at minimum

**Invalid Token (401):**
- Regenerate token in Coolify UI
- Copy new token to `.env.local`
- Restart dev server
- See `docs/coolify-deployment.md` for full troubleshooting

## Documentation References

- **Complete API Docs:** `docs/coolify-deployment.md`
- **Quick Reference:** `CLAUDE.md` sections "Coolify Deployment Monitoring API" and "Pre-Commit Checklist"
- **API Client Code:** `packages/utils/src/coolify-api.ts`
- **API Routes:** `apps/web/src/app/api/deployment/*.ts`
- **Configuration:** `.env.template` (Coolify Deployment Monitoring section)

## Future Enhancements

Potential improvements for future implementation:
- Cache deployment status to reduce API calls
- Implement real-time deployment notifications (webhook from Coolify)
- Add deployment history view in UI
- Implement log streaming for live deployment monitoring
- Add deployment filtering/search capabilities
- Integrate with Sentry for error tracking during deployments

---

**Implementation Date:** 2025-12-16
**Merged By:** tuckerandrew21
**PR:** #283
**Status:** Production (running:healthy)
