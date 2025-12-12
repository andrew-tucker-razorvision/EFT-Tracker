# Staying Within Sentry Free Tier

## Free Tier Limits

- **5,000 errors/month** - Error events captured
- **5M spans/month** - Performance tracing data points
- **50 replays/month** - Session replay recordings
- **5GB logs/month** - Log ingestion (if enabled)
- **1 uptime monitor** - Uptime checks
- **1 cron monitor** - Scheduled job monitoring

## Current Configuration

### Error Monitoring

- **Production**: All errors are captured (up to 5,000/month)
- **Development**: All errors captured (doesn't count toward quota)
- **Filtered errors**: Browser extensions, network errors, common quirks

### Performance Tracing

- **Production**: 10% sample rate (1 in 10 requests traced)
  - With 10% sampling, supports ~50M requests/month before hitting 5M span limit
- **Development**: 100% sample rate (doesn't count toward quota)

### Session Replay

- **Random sessions**: Disabled (was 1%, now 0%)
- **Error sessions**: 50% of errors get replays in production
  - With 5,000 error limit, max 2,500 replays from errors
  - Safely under 50 replay limit due to conservative error handling

## Monitoring Usage

### Check Your Usage Dashboard

1. Go to: https://tucker-corp.sentry.io/settings/billing/overview/
2. View current month's consumption:
   - Errors consumed
   - Spans consumed
   - Replays consumed
3. Set up alerts when approaching limits

### Set Spend Notifications

1. Go to: https://tucker-corp.sentry.io/settings/billing/overview/
2. Enable "Spend notifications"
3. Set threshold at 80% of free tier limits

## Strategies to Stay Under Limits

### 1. Error Rate Control

- **Ignore non-actionable errors**: Already configured for browser extensions, network failures
- **Fix errors quickly**: Each unique error creates many events
- **Use rate limiting**: Sentry automatically rate limits repeated errors

### 2. Trace Sampling

- **Current**: 10% in production (good for free tier)
- **If hitting limits**: Reduce to 5% (`tracesSampleRate: 0.05`)
- **What to monitor**: High-traffic endpoints may need lower sampling

### 3. Session Replay

- **Current**: Only 50% of errors captured
- **Conservative approach**: Random session sampling disabled
- **On-demand**: Enable manually for debugging specific issues

### 4. Development vs Production

- **Development**: Full tracing enabled, doesn't count toward quota
- **Production**: Conservative sampling, counts toward quota
- **Testing**: Use `NODE_ENV=development` for testing to avoid quota usage

## What to Do If Approaching Limits

### Option 1: Adjust Sampling Rates

Edit [sentry.client.config.ts](../sentry.client.config.ts):

```typescript
// Reduce trace sampling to 5%
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

// Reduce error replay sampling to 25%
replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.25 : 1.0,
```

### Option 2: Use Inbound Filters

Go to: https://tucker-corp.sentry.io/settings/eft-tracker-production/filters/

Add filters for:

- Specific error messages you don't need
- Certain browsers (e.g., IE11)
- Localhost/testing traffic

### Option 3: Environment-Based Filtering

Only enable Sentry in production:

```typescript
// In sentry.*.config.ts
enabled: process.env.NODE_ENV === "production",
```

### Option 4: Upgrade (Last Resort)

- **Team plan**: $26/month for 50K errors + 5M spans
- **Only if**: App has significant production traffic

## Recommended Alerts

### Set Up Issue Alerts

Create alerts for:

1. **High error rate**: >100 errors/hour
2. **New error types**: First occurrence of new errors
3. **Performance degradation**: Response time >2s

### Quota Alerts

Monitor via email:

1. 50% quota consumed
2. 80% quota consumed
3. 100% quota consumed

## Cost-Free Alternatives

For development and staging:

- Use `LOG_LEVEL=debug` with Pino for detailed logging
- Run Playwright E2E tests to catch errors before production
- Use browser DevTools for client-side debugging

## Monthly Review Checklist

At the end of each month:

- [ ] Review Sentry usage dashboard
- [ ] Check if any errors are consuming large % of quota
- [ ] Verify sampling rates are appropriate for traffic
- [ ] Update filters for any new non-actionable errors
- [ ] Document any patterns or issues discovered

## Current Project Status

- **Organization**: tucker-corp
- **Project**: eft-tracker-production
- **Dashboard**: https://tucker-corp.sentry.io/issues/
- **Billing**: https://tucker-corp.sentry.io/settings/billing/overview/

## Additional Resources

- [Sentry Pricing](https://sentry.io/pricing/)
- [Managing Your Event Stream](https://docs.sentry.io/product/accounts/quotas/manage-event-stream-guide/)
- [Sampling Strategies](https://docs.sentry.io/platforms/javascript/configuration/sampling/)
- [Spike Protection](https://docs.sentry.io/product/accounts/quotas/#spike-protection)
