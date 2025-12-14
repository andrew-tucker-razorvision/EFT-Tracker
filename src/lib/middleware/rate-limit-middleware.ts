/**
 * Rate limit middleware for Next.js API routes
 * Wraps route handlers with rate limiting logic
 */

import { NextResponse } from "next/server";
import {
  rateLimit,
  getClientIp,
  type RateLimitConfig,
  type RateLimitResult,
} from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Wraps an API route handler with rate limiting
 * @param handler - The Next.js API route handler to protect
 * @param config - Rate limit configuration
 * @returns Protected handler that enforces rate limits
 *
 * @example
 * ```typescript
 * import { withRateLimit } from "@/lib/middleware/rate-limit-middleware";
 * import { RATE_LIMITS } from "@/lib/rate-limit";
 *
 * async function handleGET(req: Request) {
 *   // Your logic here
 *   return NextResponse.json({ data: "..." });
 * }
 *
 * export const GET = withRateLimit(handleGET, RATE_LIMITS.API_DATA_READ);
 * ```
 */
export function withRateLimit(
  handler: (req: Request) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: Request): Promise<NextResponse> => {
    const clientIp = getClientIp(req);

    // Check if IP is in whitelist (excluded from rate limiting)
    const whitelist =
      process.env.RATE_LIMIT_WHITELIST?.split(",").map((ip) => ip.trim()) || [];
    if (whitelist.includes(clientIp)) {
      logger.debug(
        { clientIp, path: new URL(req.url).pathname },
        "IP whitelisted, skipping rate limit"
      );
      return handler(req);
    }

    const result: RateLimitResult = await rateLimit(clientIp, config);

    // Add rate limit headers to response
    const headers = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": new Date(result.reset).toISOString(),
    };

    if (!result.success) {
      // Log rate limit violation
      logger.warn({
        msg: "Rate limit exceeded",
        clientIp,
        limit: result.limit,
        path: new URL(req.url).pathname,
      });

      // Calculate retry-after in seconds
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    // Execute the handler and add rate limit headers
    try {
      const response = await handler(req);

      // Add rate limit headers to successful response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      // Re-throw error with rate limit headers
      logger.error({
        msg: "Error in rate-limited handler",
        error,
        path: new URL(req.url).pathname,
      });
      throw error;
    }
  };
}

/**
 * Helper to check if user is authenticated before rate limiting
 * Allows higher limits for authenticated users
 */
export function withAuthAwareRateLimit(
  handler: (req: Request) => Promise<NextResponse>,
  authenticatedConfig: RateLimitConfig,
  unauthenticatedConfig: RateLimitConfig
) {
  return async (req: Request): Promise<NextResponse> => {
    // Check for session/auth token
    // Note: This is a simplified check. Adjust based on your auth implementation
    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");
    const hasSessionCookie = cookieHeader?.includes("next-auth.session-token");

    const isAuthenticated = !!(authHeader || hasSessionCookie);
    const config = isAuthenticated
      ? authenticatedConfig
      : unauthenticatedConfig;

    return withRateLimit(handler, config)(req);
  };
}
