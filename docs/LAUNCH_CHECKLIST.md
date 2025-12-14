# Production Launch Checklist

Comprehensive pre-launch validation checklist for EFT Quest Tracker production deployment.

**Last Updated:** 2025-12-14
**Production URL:** https://learntotarkov.com

---

## Infrastructure Verification

### Domain & SSL

- [x] Domain (learntotarkov.com) resolves correctly
- [x] SSL certificate valid and active
- [x] SSL certificate auto-renewal configured
- [x] HTTPS enforces redirect from HTTP
- [ ] Verify SSL grade (A+ on SSL Labs)

**Verification:**

```bash
# Check DNS resolution
nslookup learntotarkov.com

# Check SSL certificate
curl -I https://learntotarkov.com | grep -i strict-transport-security

# SSL Labs test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=learntotarkov.com
```

### Hosting & Deployment

- [x] Hetzner VPS running and accessible
- [x] Coolify installed and configured
- [x] Docker containers healthy
- [x] Auto-deployment from GitHub webhook configured
- [x] Webhook signature validation enabled
- [ ] Health check endpoint responding consistently

**Verification:**

```bash
# Health check
curl https://learntotarkov.com/api/health

# Check webhook in Coolify dashboard
# Navigate to: Projects → EFT-Tracker → Settings → Webhooks
```

### CDN & Caching

- [x] Cloudflare CDN active
- [x] DNS proxied through Cloudflare (orange cloud)
- [x] Cloudflare cache rules configured
- [x] Static assets cached appropriately
- [ ] Verify cache hit rates in Cloudflare Analytics

**Verification:**

```bash
# Check CF-Cache-Status header
curl -I https://learntotarkov.com/quests | grep -i cf-cache

# Check Cloudflare Analytics for cache hit rate (should be >80%)
```

### Database

- [x] Neon production database accessible
- [x] Connection pooling configured (Prisma)
- [x] All migrations applied
- [x] Database backups configured (Neon auto-backups)
- [ ] Verify backup recovery process
- [ ] Connection pool stable under load

**Verification:**

```bash
# Test database connection
npx prisma db execute --stdin <<< "SELECT 1"

# Check Neon dashboard for:
# - Backup schedule (automatic)
# - Connection pool utilization
# - Query performance
```

---

## Application Verification

### Core Functionality

- [x] Homepage loads successfully
- [x] Quest tracker page functional
- [x] User registration works
- [x] Email/password login works
- [x] OAuth login (Google/Discord) works
- [x] Quest progress saving works
- [x] Quest progress syncing works
- [x] Catch-up feature works
- [ ] All filters working correctly
- [ ] Search functionality works
- [ ] Keyboard shortcuts functional

**Manual Testing:**

1. Visit https://learntotarkov.com
2. Create test account
3. Track 5-10 quests
4. Verify sync indicator shows "Synced"
5. Logout and login - verify progress persists
6. Test all filters (trader, map, status, level)
7. Test search with various queries
8. Test keyboard shortcuts (/, Enter, Space, F)

### Authentication Security

- [x] CAPTCHA (Cloudflare Turnstile) configured
- [x] CAPTCHA appears on registration
- [x] CAPTCHA verification works server-side
- [x] Rate limiting active on auth endpoints
- [x] Password hashing with bcrypt
- [x] Session cookies secure and httpOnly
- [ ] Test rate limiting enforcement
- [ ] Test CAPTCHA with VPN/proxy

**Verification:**

```bash
# Test rate limiting (should get 429 after 5 requests)
for i in {1..10}; do
  curl -X POST https://learntotarkov.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com","password":"password123"}'
  echo ""
done
```

### Error Handling

- [x] Sentry error tracking configured
- [x] Sentry receiving errors (test with intentional error)
- [ ] Error messages user-friendly
- [ ] No stack traces exposed to users
- [ ] 404 page custom and helpful
- [ ] 500 page custom and helpful

**Verification:**

1. Check Sentry dashboard for recent errors
2. Trigger test error: Visit /api/test-error (if exists)
3. Visit non-existent page: https://learntotarkov.com/nonexistent
4. Check that error pages don't expose internals

---

## Security Validation

### Security Headers

- [x] Strict-Transport-Security configured
- [x] X-Frame-Options configured
- [x] X-Content-Type-Options configured
- [x] Referrer-Policy configured
- [x] Permissions-Policy configured
- [x] Content-Security-Policy configured
- [ ] Verify all headers in production

**Verification:**

```bash
# Check all security headers
curl -I https://learntotarkov.com | grep -E "Strict-Transport|X-Frame|X-Content|Referrer|Permissions|Content-Security"

# Or use securityheaders.com
# Visit: https://securityheaders.com/?q=learntotarkov.com
# Target: A grade or higher
```

### Rate Limiting

- [x] Rate limiting configured on API routes
- [x] Rate limits enforced on auth endpoints
- [x] Rate limit headers returned (X-RateLimit-\*)
- [ ] Test rate limit enforcement
- [ ] Verify retry-after header on 429

**Test Cases:**

- Auth endpoints: 5 requests/minute
- API data read: 100 requests/minute
- API data write: 30 requests/minute

### Environment & Secrets

- [x] All environment variables validated (env.ts)
- [x] No secrets in git history
- [x] No secrets in client-side code
- [x] Database credentials secure
- [x] OAuth secrets secure
- [x] Sentry DSN not sensitive (public DSN)
- [ ] Verify no .env files committed

**Verification:**

```bash
# Check git history for secrets
git log --all --full-history --source --pretty=format: -- .env .env.local .env.production | grep -E "PASSWORD|SECRET|KEY" || echo "No secrets found"

# Verify client bundle doesn't contain secrets
# Check browser DevTools → Sources → webpack bundle
```

### OWASP Security Scan

- [ ] Run OWASP ZAP baseline scan
- [ ] No HIGH or CRITICAL vulnerabilities
- [ ] MEDIUM vulnerabilities assessed and accepted
- [ ] SQL injection tests passed
- [ ] XSS tests passed
- [ ] CSRF protection verified

**Scan Commands:**

```bash
# OWASP ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://learntotarkov.com -r zap-report.html

# Review report for critical/high issues
```

### Authentication Security Tests

- [ ] Brute force protection works (rate limiting)
- [ ] Password requirements enforced (min 8 chars)
- [ ] Session timeout configured
- [ ] Cannot access authenticated routes without login
- [ ] Cannot hijack other user's sessions
- [ ] OAuth callback validation works

---

## Performance Validation

### Response Times

- [ ] Homepage loads in < 2 seconds (cold cache)
- [ ] Homepage loads in < 500ms (warm cache)
- [ ] /quests page loads in < 3 seconds
- [ ] API endpoints p95 < 500ms
- [ ] Database queries p95 < 100ms

**Load Testing:**

```bash
# Install Apache Bench
# sudo apt-get install apache2-utils

# Test homepage (100 requests, 10 concurrent)
ab -n 100 -c 10 https://learntotarkov.com/

# Test API endpoint
ab -n 100 -c 10 https://learntotarkov.com/api/quests

# Check results for:
# - Time per request (mean)
# - Time per request (mean, across all concurrent requests)
# - 95th percentile < 500ms
```

### Database Performance

- [ ] Connection pool utilization < 80%
- [ ] Query performance acceptable (check Neon dashboard)
- [ ] No slow queries (> 1 second)
- [ ] No connection pool exhaustion under load

**Verification:**

```bash
# Check Neon dashboard:
# - Monitoring → Connection pool
# - Monitoring → Query performance
# - Look for slow queries or connection spikes
```

### Memory & Resource Usage

- [ ] No memory leaks after 24-hour test
- [ ] CPU usage stable under load
- [ ] Container restart count low (< 3 in 24 hours)
- [ ] Disk space adequate (> 20% free)

**Verification:**

```bash
# Check Coolify dashboard:
# - Resources → CPU usage
# - Resources → Memory usage
# - Logs → Container restarts

# Or SSH to VPS:
ssh root@95.217.155.28
docker stats
df -h
```

### CDN Performance

- [ ] Static assets served from CDN
- [ ] Cache hit rate > 80%
- [ ] Assets have far-future expiry headers
- [ ] Cloudflare Analytics shows fast performance

**Verification:**

```bash
# Check CF-Cache-Status on static assets
curl -I https://learntotarkov.com/_next/static/some-file.js | grep CF-Cache-Status

# Should be: HIT (cached) for most requests
```

---

## Monitoring & Alerting

### Error Tracking

- [x] Sentry configured and receiving errors
- [x] Sentry alerts configured for critical errors
- [x] Sentry performance monitoring enabled
- [ ] Test Sentry alerting (trigger test error)
- [ ] Verify alert notifications reach team

**Verification:**

1. Go to Sentry dashboard
2. Trigger test error in app
3. Verify error appears in Sentry
4. Check alert configuration: Settings → Alerts

### Uptime Monitoring

- [x] UptimeRobot monitoring configured
- [x] Monitoring 5+ endpoints
- [x] Alert notifications configured
- [ ] Test uptime alerting (disable app temporarily)
- [ ] Verify alerts sent via email/Slack

**Monitored Endpoints:**

- Homepage: https://learntotarkov.com
- Quests page: https://learntotarkov.com/quests
- API health: https://learntotarkov.com/api/health
- Authentication: https://learntotarkov.com/login
- Registration: https://learntotarkov.com/register

### Logging

- [x] Structured logging configured (Pino)
- [x] Log levels appropriate (info/warn/error)
- [x] Sensitive data not logged
- [ ] Logs accessible via Coolify dashboard
- [ ] Log retention configured (Coolify default: 7 days)

**Verification:**

```bash
# Check logs in Coolify:
# Navigate to: EFT-Tracker → Logs

# Verify logs are structured JSON
# Verify no passwords or tokens logged
```

---

## Documentation Verification

### User Documentation

- [x] Getting started guide published
- [x] Quest tracking tutorial complete
- [x] Troubleshooting guide available
- [x] FAQ with 20+ questions
- [x] Companion app guide (coming soon note)
- [ ] Documentation linked from website
- [ ] Documentation tested by non-technical user

**Verification:**

- Visit https://learntotarkov.com
- Check for "Help" or "Docs" link
- Navigate through all user guides
- Verify links work and content is clear

### Operational Documentation

- [x] Production deployment runbook
- [x] Incident response procedures
- [x] Database backup/restore procedures
- [x] Database migration procedures
- [x] Rollback procedures documented
- [ ] Team familiar with runbooks

**Verification:**

- Review docs/RUNBOOKS.md
- Review docs/INCIDENT_RESPONSE.md
- Review docs/DATABASE_BACKUPS.md
- Walk through runbooks with team

---

## Pre-Launch Testing

### Beta Testing Plan

- [ ] Identify 5-10 beta testers
- [ ] Send beta tester invitations
- [ ] Provide beta testing instructions
- [ ] Create feedback form (Google Forms/Typeform)
- [ ] Monitor for bugs during beta period (1 week)
- [ ] Address critical bugs before launch
- [ ] Collect and prioritize feedback

**Beta Tester Criteria:**

- Active Tarkov players
- Various experience levels
- Mix of technical/non-technical users
- Available for 1-week testing period

### Internal Team Testing

- [ ] Full regression test by team
- [ ] Test all user workflows
- [ ] Test error scenarios
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Test with slow network conditions
- [ ] Verify all features work as expected

**Testing Checklist:**

1. User registration (email, Google, Discord)
2. Quest tracking (mark complete, in progress)
3. Filters (trader, map, status, level)
4. Search functionality
5. Catch-up feature
6. Focus mode
7. Keyboard shortcuts
8. Progress syncing
9. Mobile experience
10. Logout and session persistence

---

## Launch Day Preparation

### Communication Plan

- [ ] Draft launch announcement
- [ ] Prepare social media posts (Twitter, Reddit)
- [ ] Create screenshots/GIFs for announcement
- [ ] Notify beta testers of public launch
- [ ] Post in Tarkov community Discord servers (with permission)

**Announcement Template:**

```
🚀 EFT Quest Tracker is now live!

Track your Escape from Tarkov quest progress with:
✅ Visual quest dependency trees
✅ Progress syncing across devices
✅ Filters by trader, map, and level
✅ Kappa container tracking
✅ 100% free and open-source

Try it now: https://learntotarkov.com

[Screenshot/GIF]
```

### Launch Timing

- [ ] Schedule launch for weekday (avoid Friday)
- [ ] Launch during business hours (9am-3pm EST)
- [ ] Avoid holidays and major game updates
- [ ] Team available for monitoring post-launch
- [ ] Plan for 4-8 hour monitoring window

**Recommended:**

- Tuesday or Wednesday
- 10am EST (when team is fresh)
- Avoid Tarkov wipe days (high traffic risk)

### Post-Launch Monitoring

- [ ] Monitor Sentry for errors (first 4 hours)
- [ ] Monitor UptimeRobot for downtime
- [ ] Monitor Coolify for resource usage
- [ ] Monitor Cloudflare for traffic spikes
- [ ] Monitor Neon for database issues
- [ ] Check user feedback channels
- [ ] Respond to early user questions

**Monitoring Dashboard URLs:**

- Sentry: [Your Sentry URL]
- UptimeRobot: https://uptimerobot.com/dashboard
- Coolify: http://95.217.155.28:8000
- Cloudflare: https://dash.cloudflare.com
- Neon: https://console.neon.tech

---

## Rollback Plan

### When to Rollback

Rollback if any of these occur in first 24 hours:

- P0 bug: Data loss or corruption
- P0 bug: Complete site outage (> 5 minutes)
- P1 bug: Authentication completely broken
- P1 bug: Quest tracking completely broken
- Database corruption or unrecoverable errors

### Rollback Procedure

```bash
# In Coolify dashboard:
1. Go to EFT-Tracker → Deployments
2. Find previous successful deployment
3. Click "Redeploy" on previous version
4. Wait 2-3 minutes for rollback
5. Verify site works: https://learntotarkov.com

# Database rollback (if needed):
1. Go to Neon dashboard
2. Navigate to Backups
3. Restore from point-in-time before deployment
4. Update DATABASE_URL in Coolify env vars
5. Restart application
```

**Post-Rollback:**

1. Notify users via status page/social media
2. Investigate root cause
3. Fix issue in development
4. Re-test thoroughly
5. Re-deploy when ready

---

## Final Sign-Off

Before launch, all checklist items must be completed or explicitly accepted as risks.

**Sign-Off:**

- [ ] Infrastructure: All checks passed
- [ ] Application: All core functionality working
- [ ] Security: No HIGH/CRITICAL issues
- [ ] Performance: Meets SLAs
- [ ] Monitoring: All systems operational
- [ ] Documentation: Complete and accessible
- [ ] Team: Confident in launch readiness

**Launch Decision:**

- [ ] GO for launch
- [ ] NO-GO (reasons documented)

**Signed:** **\*\*\*\***\_\_\_**\*\*\*\***
**Date:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## Post-Launch Checklist

After successful launch:

- [ ] Monitor for 4-8 hours post-launch
- [ ] Address any immediate issues
- [ ] Collect user feedback
- [ ] Thank beta testers
- [ ] Update README status to "Production"
- [ ] Celebrate with team! 🎉

**30-Day Post-Launch Review:**

- [ ] Review error rates (target: < 1% error rate)
- [ ] Review performance metrics
- [ ] Review user feedback and feature requests
- [ ] Prioritize next iteration improvements
- [ ] Update documentation based on user questions
