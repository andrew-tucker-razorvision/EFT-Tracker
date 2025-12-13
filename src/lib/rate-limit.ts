/**
 * Simple in-memory rate limiting utility
 * For production with multiple servers, consider using Redis-backed solution like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the window
   */
  limit: number;
  /**
   * Time window in milliseconds
   */
  window: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.window,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    reset: entry.resetAt,
  };
}

/**
 * Get client IP address from request headers
 * Handles various proxy headers in correct priority order
 */
export function getClientIp(request: Request): string {
  // Try various headers in priority order
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list, take the first (original client)
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Fallback to 'unknown' if no IP found
  return "unknown";
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  /**
   * 5 attempts per 15 minutes for login
   */
  AUTH_LOGIN: {
    limit: 5,
    window: 15 * 60 * 1000, // 15 minutes
  },
  /**
   * 3 attempts per hour for registration
   */
  AUTH_REGISTER: {
    limit: 3,
    window: 60 * 60 * 1000, // 1 hour
  },
  /**
   * 30 requests per minute for general API routes
   */
  API_GENERAL: {
    limit: 30,
    window: 60 * 1000, // 1 minute
  },
  /**
   * 60 requests per minute for data read operations (GET)
   */
  API_DATA_READ: {
    limit: 60,
    window: 60 * 1000, // 1 minute
  },
  /**
   * 50 requests per minute for data write operations (POST/PUT/DELETE)
   */
  API_DATA_WRITE: {
    limit: 50,
    window: 60 * 1000, // 1 minute
  },
  /**
   * 100 requests per minute for authenticated users
   */
  API_AUTHENTICATED: {
    limit: 100,
    window: 60 * 1000, // 1 minute
  },
  /**
   * 20 requests per minute for search operations
   */
  API_SEARCH: {
    limit: 20,
    window: 60 * 1000, // 1 minute
  },
  /**
   * 30 requests per minute for companion app API
   */
  API_COMPANION: {
    limit: 30,
    window: 60 * 1000, // 1 minute
  },
} as const;
