---
name: security-auth
description: >
  Authentication and security patterns for EFT-Tracker using NextAuth.
  Covers password reset, session management, CSRF protection, and security reviews.
  Activates when user mentions: auth, authentication, password, NextAuth,
  session, security, login, logout, CSRF, rate limit, token, JWT.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Security & Authentication Skill

## Model Selection

**Security-critical code requires Sonnet** (not Haiku) due to:

- High risk of vulnerabilities
- Complex attack vectors
- Need for thorough validation

## NextAuth Configuration

### Session Configuration

```typescript
// Secure session settings
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // HTTPS only in production
      },
    },
  },
};
```

### Protected Routes

```typescript
// Server-side protection
import { getServerSession } from "next-auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... protected logic
}
```

## Password Security

### Hashing

Always use bcrypt with sufficient rounds:

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12; // Minimum 10, 12 recommended

// Hash password
const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Verify password
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### Password Reset Flow

1. User requests reset (email)
2. Generate secure token (`crypto.randomBytes(32)`)
3. Store hashed token with expiration (1 hour max)
4. Send reset link via email
5. Validate token on reset page
6. Hash new password, invalidate token

**Critical:**

- Never log tokens
- Rate limit reset requests
- Invalidate all sessions on password change

## OWASP Top 10 Checklist

### 1. Injection

- [ ] Use parameterized queries (Prisma handles this)
- [ ] Validate all user input with Zod
- [ ] Never concatenate SQL strings

### 2. Broken Authentication

- [ ] Strong password requirements
- [ ] Rate limit login attempts
- [ ] Secure session management
- [ ] Password hashing (bcrypt 12+ rounds)

### 3. Sensitive Data Exposure

- [ ] HTTPS everywhere
- [ ] Encrypt sensitive data at rest
- [ ] No secrets in code/logs
- [ ] Secure cookie flags

### 4. XXE (XML External Entities)

- [ ] Disable XML external entity processing
- [ ] Use JSON instead of XML where possible

### 5. Broken Access Control

- [ ] Verify authorization on every request
- [ ] Deny by default
- [ ] Log access control failures

### 6. Security Misconfiguration

- [ ] Remove default credentials
- [ ] Disable unnecessary features
- [ ] Keep dependencies updated

### 7. XSS (Cross-Site Scripting)

- [ ] Never use `dangerouslySetInnerHTML`
- [ ] Escape user output
- [ ] Content Security Policy headers

### 8. Insecure Deserialization

- [ ] Validate serialized data
- [ ] Use type-safe serialization

### 9. Using Components with Known Vulnerabilities

- [ ] Run `npm audit` regularly
- [ ] Update dependencies
- [ ] Monitor security advisories

### 10. Insufficient Logging & Monitoring

- [ ] Log security events
- [ ] Monitor for anomalies
- [ ] Alerting on suspicious activity

## Rate Limiting

### API Route Rate Limiting

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  // ... handle request
}
```

### Sensitive Endpoint Limits

| Endpoint | Limit | Window |
| -------- | ----- | ------ |
| Login | 5 attempts | 15 min |
| Password reset | 3 requests | 1 hour |
| API general | 100 requests | 1 min |
| Registration | 3 accounts | 1 hour |

## Input Validation

Always validate with Zod:

```typescript
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const resetSchema = z.object({
  email: z.string().email(),
});

const newPasswordSchema = z.object({
  token: z.string().min(32),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number"),
});
```

## Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
];
```

## Security Review Checklist

### Before PR

- [ ] No hardcoded secrets
- [ ] All inputs validated
- [ ] Authorization checks in place
- [ ] Sensitive operations rate limited
- [ ] Error messages don't leak info
- [ ] Logs don't contain sensitive data

### Critical Code Patterns

**Never do:**

```typescript
// BAD - Hardcoded secret
const API_KEY = "sk-1234567890";

// BAD - SQL injection risk
const query = `SELECT * FROM users WHERE id = ${userId}`;

// BAD - XSS risk
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;

// BAD - Timing attack vulnerability
if (token === storedToken) {
  /* ... */
}
```

**Always do:**

```typescript
// GOOD - Environment variable
const API_KEY = process.env.API_KEY;

// GOOD - Parameterized (Prisma)
const user = await prisma.user.findUnique({ where: { id: userId } });

// GOOD - Escaped output
return <div>{userInput}</div>;

// GOOD - Constant-time comparison
import { timingSafeEqual } from "crypto";
if (timingSafeEqual(Buffer.from(token), Buffer.from(storedToken))) {
  /* ... */
}
```

## Environment Variables

**Required for auth:**

- `NEXTAUTH_SECRET` - Random 32+ char string
- `NEXTAUTH_URL` - Full URL of app
- `RESEND_API_KEY` - For password reset emails

**Never commit:**

- `.env` files with real values
- API keys or tokens
- Database credentials
