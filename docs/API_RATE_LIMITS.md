# API Rate Limiting

This document describes the rate limiting implementation for the EFT-Tracker API.

## Overview

Rate limiting has been implemented across all API routes to protect against abuse, bot traffic, and denial of service attacks. The implementation uses an in-memory rate limiter with configurable limits per endpoint.

## Rate Limit Middleware

A reusable middleware wrapper is available at `src/lib/middleware/rate-limit-middleware.ts`:

```typescript
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const GET = withRateLimit(handleGET, RATE_LIMITS.API_DATA_READ);
```

## Rate Limit Configurations

The following rate limit configurations are available in `src/lib/rate-limit.ts`:

| Configuration       | Limit        | Window     | Use Case                                 |
| ------------------- | ------------ | ---------- | ---------------------------------------- |
| `AUTH_LOGIN`        | 5 requests   | 15 minutes | Login attempts                           |
| `AUTH_REGISTER`     | 3 requests   | 1 hour     | Registration attempts                    |
| `API_GENERAL`       | 30 requests  | 1 minute   | General API endpoints                    |
| `API_DATA_READ`     | 60 requests  | 1 minute   | GET endpoints (read operations)          |
| `API_DATA_WRITE`    | 10 requests  | 1 minute   | POST/PUT/DELETE/PATCH (write operations) |
| `API_AUTHENTICATED` | 100 requests | 1 minute   | Authenticated user endpoints             |
| `API_SEARCH`        | 20 requests  | 1 minute   | Search operations                        |
| `API_COMPANION`     | 30 requests  | 1 minute   | Companion app API                        |

## Protected Endpoints

### Quest Management

- **GET /api/quests** - `API_DATA_READ` (60/min)
- **GET /api/progress** - `API_AUTHENTICATED` (100/min)
- **POST /api/progress** - `API_DATA_WRITE` (10/min)
- **DELETE /api/progress** - `API_DATA_WRITE` (10/min)
- **GET /api/progress/[questId]** - `API_AUTHENTICATED` (100/min) _inline_
- **PATCH /api/progress/[questId]** - `API_DATA_WRITE` (10/min) _inline_

### Trader Management

- **GET /api/traders** - `API_DATA_READ` (60/min)

### User Management

- **GET /api/user** - `API_AUTHENTICATED` (100/min)
- **PATCH /api/user** - `API_DATA_WRITE` (10/min)

### Authentication

- **POST /api/auth/register** - `AUTH_REGISTER` (3/hour) _inline_

### Companion App

- **GET /api/companion/status** - `API_COMPANION` (30/min)
- **GET /api/companion/link** - `API_AUTHENTICATED` (100/min)
- **POST /api/companion/link** - `API_DATA_WRITE` (10/min)
- **POST /api/companion/unlink** - `API_DATA_WRITE` (10/min)
- **DELETE /api/companion/unlink** - `API_DATA_WRITE` (10/min)

## Rate Limit Headers

All rate-limited responses include the following headers:

- `X-RateLimit-Limit` - Maximum requests allowed in the window
- `X-RateLimit-Remaining` - Remaining requests in the current window
- `X-RateLimit-Reset` - ISO 8601 timestamp when the limit resets

When rate limit is exceeded (HTTP 429):

- `Retry-After` - Seconds until the limit resets

## Implementation Patterns

### Using Middleware (Recommended)

For standard routes without dynamic params:

```typescript
import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
import { RATE_LIMITS } from "@/lib/rate-limit";

async function handleGET(request: Request) {
  // Your logic here
}

export const GET = withRateLimit(handleGET, RATE_LIMITS.API_DATA_READ);
```

### Inline Rate Limiting

For routes with dynamic parameters or custom requirements:

```typescript
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ questId: string }> }
) {
  // Apply rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = rateLimit(clientIp, RATE_LIMITS.API_DATA_WRITE);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
          "Retry-After": Math.ceil(
            (rateLimitResult.reset - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  // Your logic here
}
```

## Limitations

### Single-Server Only

The current implementation uses in-memory storage, which means:

- Rate limits are per-server instance
- Limits don't scale across multiple servers
- Limits reset on server restart

**Future Improvement**: Migrate to Redis-based rate limiting for distributed systems (See [Issue #228](https://github.com/tuckerandrew21/EFT-Tracker/issues/228))

### IP Detection

IP addresses are extracted from proxy headers in this order:

1. `x-forwarded-for` (first IP in list)
2. `x-real-ip`
3. `cf-connecting-ip` (Cloudflare)
4. Falls back to `"unknown"` if none found

## Testing

Rate limiting can be tested using the integration tests in `__tests__/integration/api/rate-limiting.test.ts`.

Example test:

```typescript
it("should enforce rate limits", async () => {
  const request = new Request("http://localhost:3000/api/quests");

  // Make requests up to limit
  for (let i = 0; i < 60; i++) {
    const response = await GET(request);
    expect(response.status).toBe(200);
  }

  // Next request should be rate limited
  const response = await GET(request);
  expect(response.status).toBe(429);
});
```

## Future Improvements

1. **Redis-based rate limiting** ([#228](https://github.com/tuckerandrew21/EFT-Tracker/issues/228)) - For multi-server scaling
2. **Cloudflare integration** ([#229](https://github.com/tuckerandrew21/EFT-Tracker/issues/229)) - DDoS protection at CDN level
3. **CAPTCHA for auth** ([#230](https://github.com/tuckerandrew21/EFT-Tracker/issues/230)) - Additional bot protection
4. **Load testing** ([#232](https://github.com/tuckerandrew21/EFT-Tracker/issues/232)) - Validate limits under load
