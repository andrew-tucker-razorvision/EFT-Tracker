/**
 * Rate limiting utility with Upstash Redis backend
 *
 * Uses Upstash Redis for distributed rate limiting across multiple server instances.
 * Falls back to in-memory rate limiting if Upstash credentials are not configured.
 *
 * For production deployments with multiple instances, configure Upstash Redis:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "./env";
import { logger } from "./logger";

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

// ============================================================================
// Upstash Redis Rate Limiter (Distributed)
// ============================================================================

let upstashRateLimiter: Ratelimit | null = null;

function getUpstashRateLimiter(config: RateLimitConfig): Ratelimit | null {
  // Return existing instance if config matches
  if (upstashRateLimiter) {
    return upstashRateLimiter;
  }

  // Check if Upstash credentials are configured
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  try {
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    upstashRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.window}ms`),
      analytics: true,
      prefix: "eft-tracker:ratelimit",
    });

    logger.info(
      {
        url: env.UPSTASH_REDIS_REST_URL,
        limit: config.limit,
        window: config.window,
      },
      "Upstash rate limiter initialized"
    );

    return upstashRateLimiter;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to initialize Upstash rate limiter, falling back to in-memory"
    );
    return null;
  }
}

async function rateLimitWithUpstash(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getUpstashRateLimiter(config);

  if (!limiter) {
    // Fallback to in-memory
    return rateLimitInMemory(identifier, config);
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        identifier,
      },
      "Upstash rate limit check failed, falling back to in-memory"
    );

    // Fallback to in-memory on error
    return rateLimitInMemory(identifier, config);
  }
}

// ============================================================================
// In-Memory Rate Limiter (Fallback)
// ============================================================================

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

function rateLimitInMemory(
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

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if a request should be rate limited
 *
 * Uses Upstash Redis for distributed rate limiting if configured,
 * otherwise falls back to in-memory rate limiting.
 *
 * @param identifier - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimitWithUpstash(identifier, config);
}

/**
 * Get client IP address from request headers
 * Handles various proxy headers in correct priority order
 */
export function getClientIp(request: Request): string {
  // Cloudflare (highest priority - most trustworthy)
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Standard forwarded header
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list, take the first (original client)
    return forwarded.split(",")[0].trim();
  }

  // Real IP header (used by some proxies)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
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
