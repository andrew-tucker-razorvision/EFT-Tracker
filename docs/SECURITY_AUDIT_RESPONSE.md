# Security Audit Response: Hosting & Rate Limiting

**Question from Solution Architect:**

> "How are you hosting the site? Do you have limits set in place in case you get bombarded by web crawlers or other nefarious actors?"

## Current Hosting Architecture

### Production Stack

**Application Hosting:** Coolify (Self-hosted PaaS)

- Self-hosted deployment platform on your own infrastructure
- Auto-deployment from `master` branch via GitHub webhooks
- Zero-downtime deployments with health checks
- Runs in Docker containers

**Database:** Neon PostgreSQL (Serverless)

- Tier: Free (with limits)
- 100 CU-hours compute/month
- 0.5 GB storage
- 5 GB network transfer/month
- Connection pooling via `-pooler` endpoints (critical for handling concurrent requests)

**Domain & SSL:**

- Custom domain configuration (via Coolify)
- SSL/TLS certificates (Let's Encrypt via Coolify)

**Monitoring:**

- Sentry (Error tracking & performance monitoring)
- Pino structured logging
- Health check endpoint (`/api/health`)

## ✅ Security Measures IN PLACE

### 1. Rate Limiting (IMPLEMENTED)

**Implementation:** Custom in-memory rate limiter (`src/lib/rate-limit.ts`)

**Current Limits:**

```typescript
AUTH_LOGIN: {
  limit: 5,          // 5 attempts
  window: 15 minutes // per 15 minutes
}

AUTH_REGISTER: {
  limit: 3,          // 3 attempts
  window: 1 hour     // per hour
}

API_GENERAL: {
  limit: 30,         // 30 requests
  window: 1 minute   // per minute
}
```

**Protected Endpoints:**

- ✅ `/api/auth/register` - Registration rate limiting
- ✅ `/api/auth/[...nextauth]` - Login rate limiting
- ⚠️ Other API routes - Need to verify coverage

**Rate Limit Headers:**

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 2025-12-12T23:00:00Z
Retry-After: 300
```

**IP Detection:**
Supports multiple proxy headers in priority order:

1. `x-forwarded-for` (most common)
2. `x-real-ip` (nginx)
3. `cf-connecting-ip` (Cloudflare)
4. Fallback to 'unknown'

### 2. Input Validation (IMPLEMENTED)

**Framework:** Zod schema validation on all endpoints

- Email format validation
- Password strength requirements (min 8 chars)
- SQL injection protection via Prisma ORM (parameterized queries)
- XSS protection via React (auto-escaping)

### 3. Authentication Security

**NextAuth.js:**

- Secure session management
- HTTP-only cookies
- CSRF protection
- Secure password hashing (bcryptjs)

### 4. Database Security

**Neon PostgreSQL:**

- Connection pooling (prevents connection exhaustion)
- SSL/TLS encryption (`sslmode=require`)
- Automatic backups
- Branch-based isolation (development/staging/production)

### 5. Monitoring & Logging

**Sentry:**

- Real-time error tracking
- Performance monitoring
- Alert thresholds configured

**Pino Logging:**

- Structured JSON logs
- Request/response logging
- Error stack traces

## ⚠️ GAPS & RECOMMENDATIONS

### Critical Gaps

#### 1. **Single Server Rate Limiting** (High Priority)

**Issue:** Current rate limiter is in-memory and won't work across multiple Coolify instances.

**Impact:**

- If you scale to 2+ servers, each has separate rate limit counters
- Attacker can bypass limits by hitting different servers

**Solution Options:**

**Option A: Redis-based Rate Limiting** (Recommended)

```typescript
// Use @upstash/ratelimit with Upstash Redis (serverless)
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
});
```

**Cost:** Upstash Free tier: 10,000 requests/day

**Option B: Keep in-memory (if staying single-server)**

- Document scaling limitation
- Add monitoring to detect when scaling is needed

**Recommendation:** Implement Redis-based rate limiting before scaling beyond 1 server.

---

#### 2. **No DDoS Protection** (High Priority)

**Issue:** Direct server exposure without CDN or DDoS mitigation.

**Current Exposure:**

- Coolify exposes port 80/443 directly to internet
- No traffic filtering before hitting application
- Single server can be overwhelmed

**Solution: Add Cloudflare (Free Tier)**

**Benefits:**

- DDoS protection (layer 3-7)
- Bot detection & challenge
- CDN caching (reduces server load)
- Rate limiting at edge (additional layer)
- SSL/TLS termination
- Analytics

**Implementation:**

1. Point DNS to Cloudflare
2. Enable "Under Attack" mode when needed
3. Configure Page Rules for caching
4. Enable Bot Fight Mode (free)

**Cost:** $0/month (Free tier sufficient for most traffic)

**Alternative:** CloudFront + AWS WAF (if you need AWS ecosystem)

---

#### 3. **No Bot Protection** (Medium Priority)

**Issue:** No CAPTCHA on registration/login forms.

**Attack Vectors:**

- Automated account creation
- Credential stuffing attacks
- Form spam

**Solution: Add CAPTCHA**

**Options:**

- **hCaptcha** (privacy-focused, free)
- **Turnstile** (Cloudflare's CAPTCHA, free)
- **reCAPTCHA v3** (Google, free)

**Implementation Points:**

- Registration form (always)
- Login form (after 2 failed attempts)
- API endpoints (optional, for programmatic access)

---

#### 4. **Limited API Coverage** (Medium Priority)

**Issue:** Rate limiting only on auth endpoints, other API routes may be unprotected.

**Action Needed:**

- Audit all API routes in `src/app/api/`
- Apply appropriate rate limits
- Document which endpoints are public vs authenticated

**Example Unprotected Routes:**

```typescript
// Need to verify these have rate limiting:
/api/quests       - Quest data fetching
/api/progress     - User progress updates
/api/health       - Health check (intentionally unlimited)
```

---

#### 5. **Database Connection Limits** (Low Priority - Monitor)

**Current State:**

- Neon pooler handles connection pooling
- Free tier has connection limits (not documented)

**Recommendation:**

- Monitor Neon dashboard for connection usage
- Set up alerts for approaching limits
- Document upgrade path if limits are hit

---

#### 6. **No WAF (Web Application Firewall)** (Medium Priority)

**Issue:** No protection against common web exploits.

**What WAF Provides:**

- SQL injection detection
- XSS attack blocking
- Path traversal prevention
- OWASP Top 10 protection

**Solutions:**

- **Cloudflare WAF** (Free managed rules)
- **AWS WAF** (if using AWS)
- **ModSecurity** (open source, requires setup)

---

## Comparison: Current vs. Recommended

| Security Layer    | Current State            | Recommended                 | Priority |
| ----------------- | ------------------------ | --------------------------- | -------- |
| Rate Limiting     | ✅ In-memory (auth only) | Redis-based (all endpoints) | High     |
| DDoS Protection   | ❌ None                  | Cloudflare Free             | High     |
| Bot Protection    | ❌ None                  | hCaptcha/Turnstile          | Medium   |
| WAF               | ❌ None                  | Cloudflare WAF              | Medium   |
| API Rate Limiting | ⚠️ Partial coverage      | Full coverage               | Medium   |
| Database Limits   | ✅ Pooling enabled       | Add monitoring              | Low      |
| CDN               | ❌ None                  | Cloudflare/CloudFront       | Medium   |

---

## GitHub Issues Created

The following issues have been created to track implementation:

- **#228** - Migrate to Redis-based rate limiting for scalability (High Priority)
- **#229** - Add Cloudflare for DDoS protection and CDN (High Priority)
- **#230** - Add CAPTCHA to authentication forms (Medium Priority)
- **#231** - Audit and expand API route rate limiting coverage (Medium Priority)
- **#232** - Implement load testing for security and performance validation (Medium Priority)

## Immediate Action Items

### Quick Wins (Can be done today)

1. **Add Cloudflare** (30 minutes) - See #229
   - Point DNS to Cloudflare
   - Enable proxy mode
   - Enable Bot Fight Mode
   - Result: DDoS + bot protection + CDN

2. **Audit API Rate Limiting** (1 hour) - See #231
   - List all `/api/*` routes
   - Apply rate limiting where missing
   - Document coverage

3. **Add Monitoring Alerts** (30 minutes)
   - Sentry: Alert on >100 errors/hour
   - Sentry: Alert on >5s p95 latency
   - Neon: Monitor connection usage

### Medium-term (This week)

4. **Implement Redis Rate Limiting** (2-3 hours) - See #228
   - Set up Upstash Redis (free tier)
   - Migrate rate limiter to use Redis
   - Test across multiple servers

5. **Add CAPTCHA** (2-3 hours) - See #230
   - Install hCaptcha or Turnstile
   - Add to registration form
   - Add to login after failures

### Long-term (Next sprint)

6. **Load Testing** (4 hours) - See #232
   - Use k6 or Artillery
   - Test rate limits under load
   - Identify bottlenecks
   - Document capacity limits

7. **Security Audit** (Ongoing)
   - Regular dependency updates (`npm audit`)
   - Penetration testing
   - Review Sentry security alerts

---

## Cost Summary

| Service         | Tier        | Monthly Cost      | Purpose          |
| --------------- | ----------- | ----------------- | ---------------- |
| Coolify         | Self-hosted | $0 (+ VPS cost)   | App hosting      |
| Neon PostgreSQL | Free        | $0                | Database         |
| Cloudflare      | Free        | $0                | DDoS + CDN + WAF |
| Upstash Redis   | Free        | $0 (10k req/day)  | Rate limiting    |
| hCaptcha        | Free        | $0                | Bot protection   |
| Sentry          | Free        | $0 (5k errors/mo) | Monitoring       |
| **Total**       |             | **$0/month**      | (excluding VPS)  |

**Note:** All recommendations use free tiers sufficient for early-stage traffic.

---

## Architecture Diagram

### Current (Simplified)

```
Internet → Coolify Server → Next.js App → Neon PostgreSQL
         (no CDN/WAF)        (in-memory rate limit)
```

### Recommended

```
Internet → Cloudflare (CDN/DDoS/WAF/Bot Protection)
         → Coolify Server → Next.js App → Neon PostgreSQL
                            ↓                    ↑
                         Upstash Redis    (connection pooling)
                      (distributed rate limit)
```

---

## Summary for Solution Architect

**Current Security Posture:** ⚠️ **Moderate**

**Strengths:**

- ✅ Rate limiting on authentication endpoints
- ✅ Input validation with Zod
- ✅ Secure password hashing
- ✅ Connection pooling on database
- ✅ Error monitoring with Sentry

**Weaknesses:**

- ❌ No DDoS protection
- ❌ No bot prevention (CAPTCHA)
- ❌ Single-server rate limiting (won't scale)
- ⚠️ Partial API rate limit coverage

**Recommended Next Steps:**

1. **Immediate:** Add Cloudflare (free, 30 min setup)
2. **This week:** Migrate to Redis-based rate limiting
3. **This week:** Add CAPTCHA to auth forms
4. **Ongoing:** Audit and expand API rate limiting

**Can the current setup handle a traffic spike?**

- **Small spike (2-3x normal):** ✅ Yes, with rate limiting
- **Large spike (10x+ or DDoS):** ❌ No, needs Cloudflare
- **Bot attack:** ❌ No, needs CAPTCHA

**Risk Level:** Medium - Adequate for early traffic, needs hardening before scale

---

## Questions for Solution Architect

1. What's your target traffic volume? (requests/day, concurrent users)
2. Do you anticipate any high-profile launches that could attract attacks?
3. Are you planning to scale beyond one Coolify server?
4. What's your tolerance for downtime during an attack?
5. Do you need geographic distribution (multi-region)?

---

**Document Version:** 1.0
**Last Updated:** 2025-12-12
**Prepared By:** Development Team
**Reviewed By:** [Pending]
