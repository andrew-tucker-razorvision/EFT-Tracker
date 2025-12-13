# UptimeRobot Monitoring Setup Guide

## Overview

UptimeRobot provides free uptime monitoring with 5-minute check intervals. This guide walks through setting up monitoring for all critical EFT-Tracker endpoints.

## Prerequisites

- Production site deployed at `https://learntotarkov.com`
- Enhanced health check endpoint implemented (#198)
- UptimeRobot account (free tier)

## Free Tier Limits

- **50 monitors** - More than enough for our needs
- **5-minute check intervals** - Standard for uptime monitoring
- **2-month log retention** - Sufficient for tracking patterns
- **Email/SMS/Slack/webhook alerts** - Flexible notification options
- **Public status pages** - Optional for transparency

## Step 1: Create UptimeRobot Account

1. Go to: https://uptimerobot.com/signUp
2. Sign up with your email
3. Verify email address
4. Complete account setup

## Step 2: Configure Notification Channels

### Email Alerts (Required)

1. Go to **My Settings** → **Alert Contacts**
2. Email should be auto-added from your account
3. Enable alerts for:
   - Down events
   - Up events (recovery)
   - SSL certificate expiration warnings

### Slack Alerts (Optional)

1. In Slack, go to your workspace settings
2. Navigate to **Apps** → **Manage** → **Custom Integrations**
3. Click **Incoming Webhooks** → **Add to Slack**
4. Choose channel (e.g., `#alerts` or `#production`)
5. Copy the Webhook URL
6. In UptimeRobot:
   - Go to **My Settings** → **Alert Contacts**
   - Click **Add Alert Contact**
   - Select **Slack**
   - Paste Webhook URL
   - Test integration

## Step 3: Create Monitors

### Monitor 1: Health Check (Critical)

**Purpose:** Verify application and database health

**Configuration:**

- **Monitor Type:** HTTP(s)
- **Friendly Name:** `EFT Tracker - Health Check`
- **URL:** `https://learntotarkov.com/api/health`
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds
- **Monitor Type:** Keyword
- **Keyword:** `healthy`
- **Keyword Type:** Exists
- **Alert When:** Keyword not found OR HTTP error
- **HTTP Method:** GET

**Why keyword monitoring?**

- Ensures response body is valid JSON with `status: "healthy"`
- Detects issues even if server returns 200 but with error content
- More reliable than status code alone

**Create:**

1. Dashboard → **Add New Monitor**
2. Fill in configuration above
3. Click **Create Monitor**

### Monitor 2: Homepage

**Purpose:** Verify site is accessible

**Configuration:**

- **Monitor Type:** HTTP(s)
- **Friendly Name:** `EFT Tracker - Homepage`
- **URL:** `https://learntotarkov.com/`
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds
- **HTTP Method:** GET

### Monitor 3: Authentication Endpoint

**Purpose:** Verify auth system is functional

**Configuration:**

- **Monitor Type:** HTTP(s)
- **Friendly Name:** `EFT Tracker - Auth`
- **URL:** `https://learntotarkov.com/api/auth/signin`
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds
- **HTTP Method:** GET

### Monitor 4: Quests API

**Purpose:** Verify main feature API is working

**Configuration:**

- **Monitor Type:** HTTP(s)
- **Friendly Name:** `EFT Tracker - Quests API`
- **URL:** `https://learntotarkov.com/api/quests`
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds
- **HTTP Method:** GET

### Monitor 5: Companion Version API

**Purpose:** Verify companion app integration

**Configuration:**

- **Monitor Type:** HTTP(s)
- **Friendly Name:** `EFT Tracker - Companion Version`
- **URL:** `https://learntotarkov.com/api/companion/version`
- **Monitoring Interval:** 5 minutes
- **Monitor Timeout:** 30 seconds
- **HTTP Method:** GET

## Step 4: Configure Alert Settings

### Global Alert Settings

1. Go to **My Settings** → **Alert Settings**
2. Configure:
   - **Alert Threshold:** 2 consecutive failures (10 minutes)
   - **Re-alert if unacknowledged:** 15 minutes
   - **Send "back online" notification:** Yes

### Per-Monitor Alerts

For each monitor:

1. Click monitor → **Edit**
2. Scroll to **Alert Contacts to Notify**
3. Select alert contacts (email, Slack, etc.)
4. Click **Save**

## Step 5: Create Maintenance Windows

Use maintenance windows to avoid false alerts during deployments.

1. Go to **My Settings** → **Maintenance Windows**
2. Click **Add Maintenance Window**
3. Configure:
   - **Type:** Once
   - **Start Time:** Deployment time
   - **Duration:** 30 minutes (typical deployment time)
   - **Affected Monitors:** All monitors
4. Repeat for scheduled maintenance

**Tips:**

- Create maintenance window BEFORE deploying
- Better to over-estimate duration than under-estimate
- Can also create recurring windows for regular maintenance

## Step 6: Test Alert System

### Test Downtime Alert

1. Temporarily disable health check (comment out in code):
   ```typescript
   // In src/app/api/health/route.ts
   export async function GET() {
     return NextResponse.json({ status: "error" }, { status: 503 });
   }
   ```
2. Deploy to staging or production
3. Wait 10 minutes (2 consecutive failures)
4. Verify alert received via email/Slack
5. Revert changes and deploy fix
6. Verify "back online" notification

### Test Keyword Alert

1. Temporarily change health check response:
   ```typescript
   return NextResponse.json({ status: "degraded" }); // Remove "healthy"
   ```
2. Deploy
3. Wait 10 minutes
4. Verify keyword alert received
5. Revert and deploy fix

## Step 7: Dashboard and Reporting

### View Status

1. Go to **Dashboard** in UptimeRobot
2. See all monitors at a glance:
   - Green: Up
   - Red: Down
   - Yellow: Paused or maintenance

### Check Uptime Percentage

1. Click any monitor
2. View uptime stats:
   - Last 24 hours
   - Last 7 days
   - Last 30 days
   - All time

### Download Reports

1. Click monitor → **Logs**
2. Click **Export**
3. Choose format (CSV, JSON)
4. Select date range
5. Download

## Public Status Page (Optional)

Create a public status page for transparency:

1. Go to **Status Pages**
2. Click **Add New Status Page**
3. Configure:
   - **Page Name:** EFT Tracker Status
   - **Monitors:** Select all monitors
   - **Custom Domain:** status.learntotarkov.com (optional)
4. Click **Create Status Page**
5. Share URL with users

**Benefits:**

- Transparency during outages
- Reduces support tickets ("Is the site down?")
- Shows reliability metrics

## Integration with Other Services

### Sentry Integration

When UptimeRobot detects downtime, correlate with Sentry errors:

1. Check UptimeRobot alert time
2. Go to Sentry dashboard: https://tucker-corp.sentry.io/issues/
3. Filter by time range matching downtime
4. Investigate errors that occurred during outage

### PagerDuty Integration (Optional)

For on-call alerts:

1. Create PagerDuty account
2. Get PagerDuty integration URL
3. In UptimeRobot:
   - **My Settings** → **Alert Contacts**
   - **Add Alert Contact** → **Webhook**
   - Paste PagerDuty URL
4. Configure escalation policies in PagerDuty

## Maintenance Best Practices

### Regular Review

**Weekly:**

- Check dashboard for any anomalies
- Review response times for degradation
- Verify all monitors are active

**Monthly:**

- Review uptime percentages
- Identify patterns (time of day, day of week)
- Adjust alert thresholds if needed
- Check for false positives

### Uptime SLA Target

**Goal:** 99.9% uptime (Three Nines)

- Allows: ~43 minutes downtime per month
- Achievable with proper monitoring and quick response

**Current Status:**

- Track actual uptime in UptimeRobot dashboard
- Document major outages in `docs/INCIDENTS.md`

## Troubleshooting

### False Positives

**Problem:** Alerts for brief blips

**Solution:**

- Increase alert threshold to 3 failures (15 minutes)
- Check if issue is regional (UptimeRobot data center)
- Use multiple monitoring locations

### Missing Alerts

**Problem:** Not receiving alerts

**Solution:**

1. Check **My Settings** → **Alert Contacts**
2. Verify contact is enabled
3. Check spam folder for email alerts
4. Test contact with **Send Test Notification**

### Slow Response Times

**Problem:** Monitors show 200 OK but slow response

**Solution:**

1. Enable **Response Time** monitoring
2. Set threshold: Alert if >2 seconds
3. Investigate database performance
4. Check Sentry for performance issues

## Cost Considerations

**Free Tier:**

- Covers all current needs (5 monitors)
- 5-minute intervals sufficient for production
- Email alerts included

**Paid Tier ($7/month):**

- Only needed if:
  - Need <5 minute intervals (1-minute checks)
  - Need >50 monitors
  - Need advanced reporting
  - Need SMS alerts

**Recommendation:** Start with free tier, upgrade only if needed.

## Security Notes

1. **No authentication required:** Health check is public
2. **No sensitive data:** Monitor URLs are safe to expose
3. **API keys:** Keep UptimeRobot API key private if using API
4. **Webhook URLs:** Keep Slack webhook URLs secure

## Next Steps After Setup

1. ✅ Create UptimeRobot account
2. ✅ Configure 5 critical monitors
3. ✅ Set up email/Slack alerts
4. ✅ Test alert delivery
5. Document any custom configurations in this file
6. Add UptimeRobot status to project README (optional)
7. Set up PagerDuty for on-call rotation (optional)

## Related Documentation

- [Health Check Implementation](../src/app/api/health/route.ts)
- [Issue #198: Enhanced Health Check](./ISSUE_198_WRITEUP.md)
- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Sentry Free Tier Guide](./SENTRY_FREE_TIER.md)

## UptimeRobot Dashboard URL

After setup, bookmark: https://uptimerobot.com/dashboard
