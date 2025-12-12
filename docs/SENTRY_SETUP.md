# Sentry Error Monitoring Setup Guide

This guide walks through setting up Sentry for error monitoring and performance tracking in the EFT Tracker application.

## Overview

Sentry provides:

- **Error Tracking**: Automatic capture of unhandled exceptions
- **Performance Monitoring**: Track slow API routes, database queries, and page loads
- **Session Replay**: Record user sessions when errors occur
- **Source Maps**: View actual source code in stack traces
- **PII Redaction**: Automatically strip sensitive data from error reports

## Prerequisites

- Sentry account (free tier: 5,000 errors/month)
- Access to production deployment environment

## Step 1: Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and sign up or log in
2. Create a new organization (if you don't have one)
3. Create a new project:
   - Platform: **Next.js**
   - Project name: `eft-tracker-production`
   - Team: Select your team or create one

4. After creation, Sentry will show you a **DSN** (Data Source Name)
   - Format: `https://<key>@<org>.ingest.sentry.io/<project-id>`
   - Save this for later

## Step 2: (Optional) Create Staging Project

For better separation between environments:

1. Create another project: `eft-tracker-staging`
2. Save the staging DSN separately
3. Use different DSNs in staging vs production environments

## Step 3: Generate Auth Token

For uploading source maps during builds:

1. Go to [Settings → Account → API → Auth Tokens](https://sentry.io/settings/account/api/auth-tokens/)
2. Click **Create New Token**
3. Name: `eft-tracker-source-maps`
4. Scopes: Select:
   - `project:read`
   - `project:releases`
   - `org:read`
5. Click **Create Token**
6. Copy the token (you won't see it again!)

## Step 4: Configure Environment Variables

Add these to your `.env` file (or deployment platform):

```bash
# Sentry DSN - Required for error tracking
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project-id>

# Public DSN - Same as SENTRY_DSN (exposed to browser)
NEXT_PUBLIC_SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project-id>

# Organization slug - Find in Sentry Settings → General
SENTRY_ORG=your-org-slug

# Project slug - Find in Project Settings → General
SENTRY_PROJECT=eft-tracker-production

# Auth Token - Only needed for production builds and CI/CD
SENTRY_AUTH_TOKEN=your-auth-token
```

**Important Notes:**

- `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` should have the **same value**
- `SENTRY_AUTH_TOKEN` is only needed for production builds (not local development)
- Never commit `.env` files with real values

## Step 5: Verify Configuration

### Local Development Test

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000/api/sentry-test
3. Check your Sentry dashboard for the test error
4. You should see:
   - A test message
   - A test error with stack trace

**Note:** The test endpoint should be removed or protected before production deployment.

### Production Test

After deploying to production:

1. Visit `https://learntotarkov.com/api/sentry-test`
2. Check Sentry dashboard for production errors
3. Verify source maps are working (you should see TypeScript source, not compiled JS)

## Step 6: Configure Alerts (Recommended)

Set up email/Slack notifications for critical errors:

1. Go to Project Settings → Alerts
2. Click **Create Alert**
3. Choose template: "Send a notification for new issues"
4. Configure:
   - Action Interval: 30 minutes (prevents spam)
   - Environment: production
   - Issue Category: Error
5. Add notification channel (Email or Slack)

**Recommended Alerts:**

- **High Priority Errors**: Errors affecting >10 users/hour
- **New Errors**: First occurrence of any error
- **Database Errors**: Prisma connection failures
- **Authentication Errors**: Login/session issues

## Configuration Files

The following files have been created/modified for Sentry:

### Created Files

- `sentry.client.config.ts` - Browser-side error tracking
- `sentry.server.config.ts` - Server-side error tracking (Node.js)
- `sentry.edge.config.ts` - Edge runtime error tracking (middleware)
- `instrumentation.ts` - Loads Sentry based on runtime
- `src/app/global-error.tsx` - Root-level error handler
- `src/app/api/sentry-test/route.ts` - Test endpoint (remove in production)

### Modified Files

- `next.config.ts` - Wrapped with `withSentryConfig()`
- `.env.template` - Added Sentry environment variables
- `src/lib/env.ts` - Added Zod validation for Sentry vars

## Features Configured

### PII Redaction

Automatically removes sensitive data:

- Passwords, tokens, API keys
- Email addresses
- Authorization headers
- Cookies
- Database connection strings

### Performance Monitoring

Tracks:

- API route response times
- Database query duration (Prisma integration)
- Page load times
- Client-side navigation

### Sample Rates

**Development:**

- Traces: 100% (all requests tracked)
- Replays: 0% (disabled)

**Production:**

- Traces: 10% (sample 1 in 10 requests)
- Replays: 1% (sample 1 in 100 sessions)
- Error Replays: 100% (always record when errors occur)

### Ignored Errors

Filters out noise:

- Browser extension errors
- Network timeouts
- Ad blocker interference
- Expected database connection errors during shutdown

## Cost Optimization

Free tier limits: **5,000 errors/month**

To stay within limits:

1. **Filter noisy errors** - Update `ignoreErrors` in config files
2. **Sample performance traces** - Only 10% in production
3. **Limit session replays** - Only 1% + errors
4. **Set alert thresholds** - Group similar errors together
5. **Archive resolved issues** - Clean up old issues monthly

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN is correct: `echo $SENTRY_DSN`
2. Verify environment: Check Sentry dashboard filters
3. Test with `/api/sentry-test` endpoint
4. Check browser console for Sentry SDK errors
5. Verify `instrumentation.ts` is being loaded

### Source Maps Not Working

1. Verify `SENTRY_AUTH_TOKEN` is set in production
2. Check build logs for "Uploading source maps" message
3. Ensure `widenClientFileUpload: true` in `next.config.ts`
4. Verify auth token has correct scopes

### High Error Volume

1. Check for infinite loops or retry logic
2. Review `ignoreErrors` configuration
3. Implement error sampling:
   ```typescript
   beforeSend(event, hint) {
     // Sample 50% of errors
     return Math.random() < 0.5 ? event : null;
   }
   ```

## Next Steps

1. ✅ Complete this setup guide
2. ✅ Test error tracking with `/api/sentry-test`
3. ⬜ Set up Slack/email alerts
4. ⬜ Review first week of errors
5. ⬜ Tune `ignoreErrors` based on noise
6. ⬜ Remove test endpoint before production deployment

## References

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/platforms/javascript/guides/nextjs/performance/)
- [Session Replay Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/session-replay/)
- [PII Data Scrubbing](https://docs.sentry.io/platforms/javascript/guides/nextjs/data-management/sensitive-data/)
