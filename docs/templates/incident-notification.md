# Incident Notification Templates

Quick-reference templates for communicating during incidents. Copy and customize as needed.

## Quick Links

- [Internal Alert](#internal-alert)
- [User Notification - Investigating](#user-notification---investigating)
- [User Notification - Update](#user-notification---update)
- [User Notification - Resolved](#user-notification---resolved)
- [Data Loss Notification](#data-loss-notification)
- [Scheduled Maintenance](#scheduled-maintenance)

---

## Internal Alert

**When to use:** Immediately upon detecting P0/P1 incident

**Where to post:** Incident channel, team chat

```
🚨 INCIDENT ALERT - P[0/1/2/3]

Title: [Brief description]
Detected: [Timestamp]
Severity: P[0/1/2/3]
Impact: [% users affected / specific feature]

Symptoms:
- [List observed issues]

Next Steps:
- [ ] Acknowledge incident
- [ ] Assign incident commander
- [ ] Begin investigation

Incident Channel: [link]
Incident Document: [link]
```

**Example:**

```
🚨 INCIDENT ALERT - P0

Title: Database Connection Failure
Detected: 2025-01-13 14:32 UTC
Severity: P0 (Critical)
Impact: 100% of users - complete service outage

Symptoms:
- All API requests timing out
- Health check failing
- Neon connection errors in logs

Next Steps:
- [x] Acknowledge incident - John Doe
- [ ] Assign incident commander - In progress
- [ ] Begin investigation - Starting now

Incident Channel: #incident-2025-01-13-db
Incident Document: docs.google.com/incident-123
```

---

## User Notification - Investigating

**When to use:** Within 15 minutes of detecting P0/P1 incident

**Where to post:** Status page, Twitter/social, in-app banner

```markdown
# [Service Status] EFT-Tracker Experiencing Issues

Posted: [Timestamp] UTC
Status: 🔍 Investigating

## Issue

We are currently investigating reports of [brief description]. Some users may be experiencing [specific symptoms].

## Impact

- **Affected:** [Quest tracking / Login / Companion app sync / All features]
- **Users:** [Most users / Limited number / Unknown]

## What We're Doing

Our team has been notified and is actively investigating the issue.

## Updates

We will provide an update within [15/30] minutes.

Next update: [Timestamp]

---

Last updated: [Timestamp] UTC
```

**Example:**

```markdown
# [Service Status] EFT-Tracker Experiencing Issues

Posted: 2025-01-13 14:35 UTC
Status: 🔍 Investigating

## Issue

We are currently investigating reports of login failures. Some users may be unable to access their accounts.

## Impact

- **Affected:** User authentication
- **Users:** Approximately 30-40% of login attempts

## What We're Doing

Our team has been notified and is actively investigating the issue.

## Updates

We will provide an update within 15 minutes.

Next update: 2025-01-13 14:50 UTC

---

Last updated: 2025-01-13 14:35 UTC
```

---

## User Notification - Update

**When to use:** Every 30 minutes during P0/P1, or when status changes

**Where to post:** Same channels as initial notification

```markdown
# [Service Status] Update: [Issue Title]

Posted: [Timestamp] UTC
Status: 🔧 Identified / 🔄 Monitoring

## Update

We have [identified the issue / deployed a fix / are monitoring recovery].

[Explanation of what was found and what's being done]

## Impact

- **Duration so far:** [HH:MM]
- **Current status:** [Still affected / Partially restored / Monitoring]

## What We're Doing

- ✅ [Completed action 1]
- 🔄 [In progress action 2]
- ⏳ [Pending action 3]

## Expected Resolution

[Specific ETA if known, or "We are continuing to work on this and will provide another update in X minutes"]

## Updates

Next update: [Timestamp] or when resolved

---

Last updated: [Timestamp] UTC
```

**Example:**

```markdown
# [Service Status] Update: Login Issues

Posted: 2025-01-13 14:50 UTC
Status: 🔧 Identified

## Update

We have identified the issue as a database connection pool exhaustion. We are deploying a fix to increase connection limits and restart affected services.

## Impact

- **Duration so far:** 18 minutes
- **Current status:** Still affected, fix deploying

## What We're Doing

- ✅ Root cause identified (connection pool limit)
- 🔄 Deploying fix (2 minutes remaining)
- ⏳ Will monitor for stability

## Expected Resolution

We expect services to be fully restored within 5 minutes.

## Updates

Next update: 2025-01-13 15:00 UTC or when resolved

---

Last updated: 2025-01-13 14:50 UTC
```

---

## User Notification - Resolved

**When to use:** When incident is fully resolved and verified

**Where to post:** All channels where incident was announced

```markdown
# [Service Status] Issue Resolved

Posted: [Timestamp] UTC
Status: ✅ Resolved

## Resolution

The issue affecting [feature/users] has been resolved. All systems are now operational.

## What Happened

[Brief, non-technical explanation of the issue]

## Impact

- **Duration:** [HH:MM]
- **Affected users:** [X% or "a limited set"]
- **Data loss:** None / Minimal (see details below)

## What We Did

[High-level explanation of the fix]

## What's Next

We are conducting a full post-incident review to prevent similar issues in the future. We will share our findings and improvements in [timeframe].

## Apology

We apologize for any inconvenience this may have caused. We take the reliability of EFT-Tracker seriously and are committed to continuous improvement.

Thank you for your patience and understanding.

---

If you continue to experience issues, please:

1. Clear your browser cache and refresh
2. Try logging out and back in
3. Restart the companion app (if applicable)
4. Contact support: [GitHub Issues URL]

Last updated: [Timestamp] UTC
```

**Example:**

```markdown
# [Service Status] Login Issues Resolved

Posted: 2025-01-13 15:03 UTC
Status: ✅ Resolved

## Resolution

The login issues affecting some users have been resolved. All systems are now operational and users should be able to log in normally.

## What Happened

Our database connection pool reached its limit during a period of high traffic, causing login requests to time out.

## Impact

- **Duration:** 28 minutes
- **Affected users:** Approximately 30-40% during incident
- **Data loss:** None

## What We Did

We increased the database connection pool limit and implemented better connection management to handle traffic spikes.

## What's Next

We are conducting a full post-incident review to prevent similar issues in the future. We will share our findings and improvements within 48 hours.

## Apology

We apologize for any inconvenience this may have caused. We take the reliability of EFT-Tracker seriously and are committed to continuous improvement.

Thank you for your patience and understanding.

---

If you continue to experience issues, please:

1. Clear your browser cache and refresh
2. Try logging out and back in
3. Contact support: https://github.com/user/repo/issues

Last updated: 2025-01-13 15:03 UTC
```

---

## Data Loss Notification

**When to use:** When data loss occurred during incident recovery

**Where to post:** Email to affected users, in-app notification, status page

```markdown
# [Service Status] Service Restored - Data Recovery Information

Posted: [Timestamp] UTC
Status: ⚠️ Resolved (with data loss)

## Service Restored

EFT-Tracker is now fully operational. However, we need to inform you about data loss during the incident.

## Data Loss Details

**Time Window:** [Start time] to [End time] UTC ([Duration])

**Affected Data:**

- [Specific data type, e.g., "Quest progress updates"]
- [Any other affected data]

**NOT Affected:**

- User accounts and authentication
- Quest definitions
- [Other unaffected data]

## Recovery

We restored our database to the last known good backup from [Timestamp]. This means:

- ✅ All data before [Timestamp] is intact and accurate
- ❌ Changes made between [Timestamp] and [Incident end time] were lost

## What This Means for You

If you updated quest progress during [Time window], you will need to:

1. Review your current quest progress
2. Re-mark any quests you completed during that time window
3. Re-sync the companion app if you use it

## Why This Happened

[Brief explanation of the incident and why data loss was necessary]

## What We're Doing

To prevent this from happening again, we are implementing:

1. [Prevention measure 1]
2. [Prevention measure 2]
3. [Prevention measure 3]

## Apology

We sincerely apologize for this data loss. We understand how frustrating it is to lose progress, and we are committed to preventing this in the future.

## Support

If you have questions or need assistance recovering your progress:

- Create an issue: [GitHub Issues URL]
- Email: [support email if available]
- Include your username and approximate time of lost progress

We will do our best to help you recover your information.

---

Last updated: [Timestamp] UTC
```

---

## Scheduled Maintenance

**When to use:** When planning scheduled downtime (not an incident)

**Where to post:** Status page, in-app notification, email (1-3 days advance notice)

```markdown
# [Scheduled Maintenance] EFT-Tracker Downtime

Posted: [Timestamp] UTC

## Scheduled Maintenance Window

**Date:** [Date]
**Time:** [Start time] - [End time] UTC ([Duration])
**Impact:** [Complete downtime / Read-only mode / Specific features unavailable]

## What We're Doing

We will be performing [brief description of maintenance]:

- [Task 1]
- [Task 2]
- [Task 3]

## Impact During Maintenance

- ❌ [What won't work]
- ⚠️ [What will be limited]
- ✅ [What will continue to work, if anything]

## Why We're Doing This

[Brief explanation of benefits: performance improvements, new features, security updates, etc.]

## What You Should Do

**Before Maintenance:**

- Save any in-progress work
- Plan your gaming sessions around the downtime if possible

**During Maintenance:**

- The site will display a maintenance page
- Companion app sync will be paused

**After Maintenance:**

- Refresh your browser
- Restart companion app if needed
- All your data will be intact

## Updates

We will post updates:

- When maintenance begins
- If completion time changes
- When maintenance is complete

Follow us on [social/status page] for real-time updates.

## Questions?

If you have questions about this maintenance, please create an issue: [GitHub Issues URL]

---

Last updated: [Timestamp] UTC
```

---

## Communication Channels

### Internal

- **Slack/Discord:** #incidents channel
- **PagerDuty/OpsGenie:** For P0/P1 on-call alerts
- **Email:** team@example.com distribution list

### External

- **Status Page:** status.learntotarkov.com (if exists)
- **Twitter/X:** @learntotarkov (if exists)
- **GitHub:** Pin issue to repository
- **In-App:** Banner notification (if implemented)
- **Discord:** Announcements channel (if exists)

## Best Practices

### Do's ✅

- Post updates promptly within SLA
- Be transparent about impact
- Provide specific timelines when possible
- Acknowledge user frustration
- Give clear next steps
- Update regularly even if no progress
- Apologize sincerely

### Don'ts ❌

- Make promises you can't keep
- Blame external services directly (be diplomatic)
- Use technical jargon
- Give overly optimistic ETAs
- Go silent for long periods
- Minimize user impact
- Forget to post resolution

## Template Customization

When using these templates:

1. **Replace all [bracketed] placeholders** with actual information
2. **Remove sections that don't apply** to your specific incident
3. **Add relevant links** (status page, incident doc, support)
4. **Match tone to severity** (more formal for P0, conversational for P3)
5. **Proofread carefully** - typos during incidents look unprofessional
6. **Post consistently** across all channels at the same time

## Related Documentation

- [Incident Response Guide](../INCIDENT_RESPONSE.md)
- [Production Runbooks](../RUNBOOKS.md)
- [Communication Escalation Matrix](../RUNBOOKS.md#emergency-contacts)
