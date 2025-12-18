# Post-Deployment Verification

This document describes how to verify that deployments to production are successful and that critical functionality is working correctly.

## Quick Start

After merging to `master` and the deployment completes (~3 minutes):

```bash
# Trigger smoke tests
gh workflow run smoke-tests.yml

# Check results
gh run list --workflow=smoke-tests.yml --limit 1
```

## Smoke Tests

### What Are Smoke Tests?

Smoke tests are lightweight, quick tests that verify critical user journeys work correctly in production. They run AFTER deployment completes and take approximately 1-2 minutes.

**Key characteristics:**
- Fast execution (<2 minutes total)
- Read-only operations (no data mutations)
- Focus on critical paths only
- Non-blocking (failures don't affect deployed code)
- Automated issue creation on failure

### Coverage

The smoke test suite includes 5 critical path tests:

1. **Homepage loads** - Verifies React app renders without errors
2. **Health check passes** - Confirms `/api/health` returns "healthy" status
3. **Quests API functional** - Ensures `/api/quests` returns quest data
4. **Authentication accessible** - Verifies `/api/auth/signin` page loads
5. **Static assets** - Confirms JS/CSS bundles load correctly

### Running Smoke Tests

#### Manual Trigger (Recommended)

After deployment completes:

```bash
gh workflow run smoke-tests.yml
```

View results:
```bash
gh run list --workflow=smoke-tests.yml --limit 5
```

View specific run details:
```bash
gh run view <run-id>
```

Download test results:
```bash
gh run download <run-id> -n smoke-test-results
```

#### Manual Testing Locally

To test against production environment:

```bash
SMOKE_TEST_URL=https://learntotarkov.com \
  npx playwright test --config=__tests__/smoke/smoke.config.ts
```

To test against development environment:

```bash
SMOKE_TEST_URL=http://localhost:3000 \
  npx playwright test --config=__tests__/smoke/smoke.config.ts
```

### Interpreting Results

#### ✅ All Tests Pass

- Deployment successful
- Critical functionality verified
- Production ready

#### ❌ Tests Fail

1. **Check GitHub issue** - Automatic issue created with test details
2. **Review test output** - See which specific tests failed
3. **Investigate** - Determine if issue is:
   - Code-related (requires rollback)
   - Environmental (network, DB, etc.)
   - Transient (retry tests)
4. **Take action**:
   - If critical: Consider rollback
   - If minor: Create follow-up issue
   - If transient: Re-run tests

### Automatic Failure Handling

When smoke tests fail:

1. ❌ GitHub Action fails
2. 📋 GitHub issue created with:
   - Failure timestamp
   - Link to test run
   - Recommendation to consider rollback
3. 🏷️ Issues tagged: `deployment`, `urgent`
4. 📦 Test results uploaded as artifacts (7-day retention)

## Health Check Endpoint

### Purpose

The `/api/health` endpoint provides real-time health status of the application and its dependencies.

### Endpoint Details

**URL:** `https://learntotarkov.com/api/health`

**Method:** GET

**Response Format:**
```json
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2025-12-17T21:15:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 45
    }
  }
}
```

**Status Values:**
- `healthy` - All systems operational
- `degraded` - Systems working but with performance issues (DB >1000ms)
- `unhealthy` - Critical systems failing (DB timeout or error)

**HTTP Status Codes:**
- `200 OK` - Application is healthy
- `503 Service Unavailable` - Application is unhealthy

### Manual Checks

```bash
# Get health status
curl https://learntotarkov.com/api/health | jq

# Pretty print with status code
curl -w "\nStatus: %{http_code}\n" https://learntotarkov.com/api/health | jq
```

### Monitoring

The health check is used by:

- **Docker** - Container restart policy
- **Coolify** - Zero-downtime deployment verification
- **Smoke tests** - Production deployment validation
- **UptimeRobot** - External 24/7 monitoring (future)

## Deployment Workflow

### Timeline

1. **0:00** - Code merged to `master`
2. **0:00** - GitHub webhook sent to Coolify
3. **0:30** - Docker build completes
4. **2:30** - New container healthy, old container removed
5. **3:00** - **→ Run smoke tests here** (`gh workflow run smoke-tests.yml`)
6. **5:00** - Smoke tests complete, results available

### When to Run Smoke Tests

**Best practice:** Run immediately after deployment completes

```bash
# Check deployment status in Coolify dashboard
# Then manually trigger smoke tests
gh workflow run smoke-tests.yml
```

### Deployment Success Checklist

- [ ] PR merged to `master`
- [ ] GitHub Actions CI checks pass
- [ ] Coolify deployment completes (~3 min)
- [ ] Smoke tests triggered and pass
- [ ] No critical errors in production logs
- [ ] Users report normal functionality

## Troubleshooting

### Smoke Tests Won't Run

**Issue:** Workflow file exists but tests don't run

**Solution:**
1. Verify test files exist:
   ```bash
   ls -la __tests__/smoke/
   # Should show: smoke.config.ts, critical-paths.spec.ts
   ```
2. Check workflow configuration:
   ```bash
   cat .github/workflows/smoke-tests.yml
   ```

### Tests Fail with "Cannot reach URL"

**Issue:** Tests can't connect to production

**Possible causes:**
- Deployment not yet complete
- DNS propagation delay
- Firewall/network issue

**Solution:**
- Wait 30 seconds and retry
- Verify site loads manually: https://learntotarkov.com
- Check Coolify deployment logs

### Tests Fail with "Element not found"

**Issue:** Specific test assertion fails

**Possible causes:**
- UI changes between test and deployment
- Page load timeout
- Selector changed

**Solution:**
1. Review test output for specific failure
2. Manually test the page
3. Check code changes in deployment
4. Update selectors if UI changed

### Tests Fail with "API returns error"

**Issue:** API endpoint fails or returns unexpected data

**Possible causes:**
- Database connection issue
- API route not deployed
- Data validation change

**Solution:**
1. Check health endpoint: `curl https://learntotarkov.com/api/health`
2. Review Coolify deployment logs
3. Check application error logs
4. Verify database connectivity

## Future Enhancements

### Phase 2: Automated Triggering

- Configure Coolify webhook to trigger smoke tests automatically
- Eliminate manual trigger step
- Real-time alerts on deployment success/failure

### Phase 3: External Monitoring

- Enable UptimeRobot monitoring (24/7 external checks)
- Slack notifications on failures
- Performance metrics and budgets

### Phase 4: Extended Coverage

- Visual regression testing (screenshot comparison)
- Performance benchmarks (page load times)
- Companion app verification (auto-update flow)

## Related Documentation

- [Incident Response Guide](INCIDENT_RESPONSE.md) - How to handle production incidents
- [Deployment Auto-Update](`.claude/rules/deployment/coolify-auto.md`) - Automated deployment setup
- [Testing Philosophy](CLAUDE.md#testing-philosophy) - Overall testing strategy

## Support

For issues or questions:

1. Check this document first
2. Review GitHub issue created by failed smoke test
3. Check Coolify deployment logs
4. Review application logs in production
5. Create a new GitHub issue if problem persists
