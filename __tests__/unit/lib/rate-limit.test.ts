/**
 * Unit Tests - Rate Limiting Utility
 *
 * Tests the rate limiting functionality including:
 * - Basic rate limiting logic
 * - Time window expiration
 * - IP extraction from various headers
 * - Predefined rate limit configurations
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  rateLimit,
  getClientIp,
  RATE_LIMITS,
  type RateLimitConfig,
} from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // Clear rate limit store between tests by using a fresh identifier
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests under the limit", () => {
    const config: RateLimitConfig = { limit: 3, window: 60000 };
    const identifier = "test-user-1";

    const result1 = rateLimit(identifier, config);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = rateLimit(identifier, config);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = rateLimit(identifier, config);
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("should block requests over the limit", () => {
    const config: RateLimitConfig = { limit: 2, window: 60000 };
    const identifier = "test-user-2";

    rateLimit(identifier, config);
    rateLimit(identifier, config);

    const result = rateLimit(identifier, config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should reset after time window expires", () => {
    const config: RateLimitConfig = { limit: 2, window: 60000 };
    const identifier = "test-user-3";

    // Use up the limit
    rateLimit(identifier, config);
    const result1 = rateLimit(identifier, config);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(0);

    // Next request should be blocked
    const result2 = rateLimit(identifier, config);
    expect(result2.success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(60001);

    // Should be allowed again
    const result3 = rateLimit(identifier, config);
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(1);
  });

  it("should track different identifiers separately", () => {
    const config: RateLimitConfig = { limit: 1, window: 60000 };

    const result1 = rateLimit("user-a", config);
    const result2 = rateLimit("user-b", config);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it("should return correct reset timestamp", () => {
    const config: RateLimitConfig = { limit: 1, window: 60000 };
    const identifier = "test-user-4";
    const startTime = Date.now();

    const result = rateLimit(identifier, config);

    expect(result.reset).toBeGreaterThanOrEqual(startTime + config.window);
    expect(result.reset).toBeLessThanOrEqual(startTime + config.window + 100);
  });

  it("should return correct limit in response", () => {
    const config: RateLimitConfig = { limit: 5, window: 60000 };
    const identifier = "test-user-5";

    const result = rateLimit(identifier, config);

    expect(result.limit).toBe(5);
  });

  it("should handle immediate consecutive requests", () => {
    const config: RateLimitConfig = { limit: 3, window: 60000 };
    const identifier = "test-user-6";

    const results = [
      rateLimit(identifier, config),
      rateLimit(identifier, config),
      rateLimit(identifier, config),
      rateLimit(identifier, config),
    ];

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(true);
    expect(results[2].success).toBe(true);
    expect(results[3].success).toBe(false);
  });
});

describe("getClientIp", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-forwarded-for": "203.0.113.1, 70.41.3.18, 150.172.238.178",
      },
    });

    expect(getClientIp(request)).toBe("203.0.113.1");
  });

  it("should extract IP from x-real-ip header", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-real-ip": "192.168.1.1",
      },
    });

    expect(getClientIp(request)).toBe("192.168.1.1");
  });

  it("should extract IP from cf-connecting-ip header", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "cf-connecting-ip": "104.16.123.45",
      },
    });

    expect(getClientIp(request)).toBe("104.16.123.45");
  });

  it("should prioritize x-forwarded-for over other headers", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-forwarded-for": "203.0.113.1",
        "x-real-ip": "192.168.1.1",
        "cf-connecting-ip": "104.16.123.45",
      },
    });

    expect(getClientIp(request)).toBe("203.0.113.1");
  });

  it("should trim whitespace from IP addresses", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-forwarded-for": "  203.0.113.1  ",
      },
    });

    expect(getClientIp(request)).toBe("203.0.113.1");
  });

  it('should return "unknown" when no IP headers present', () => {
    const request = new Request("http://localhost:3000");

    expect(getClientIp(request)).toBe("unknown");
  });

  it("should handle IPv6 addresses", () => {
    const request = new Request("http://localhost:3000", {
      headers: {
        "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      },
    });

    expect(getClientIp(request)).toBe(
      "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
    );
  });
});

describe("RATE_LIMITS constants", () => {
  it("should have AUTH_LOGIN configuration", () => {
    expect(RATE_LIMITS.AUTH_LOGIN).toEqual({
      limit: 5,
      window: 15 * 60 * 1000,
    });
  });

  it("should have AUTH_REGISTER configuration", () => {
    expect(RATE_LIMITS.AUTH_REGISTER).toEqual({
      limit: 3,
      window: 60 * 60 * 1000,
    });
  });

  it("should have API_GENERAL configuration", () => {
    expect(RATE_LIMITS.API_GENERAL).toEqual({
      limit: 30,
      window: 60 * 1000,
    });
  });

  it("should have stricter limits for auth operations", () => {
    expect(RATE_LIMITS.AUTH_REGISTER.limit).toBeLessThan(
      RATE_LIMITS.AUTH_LOGIN.limit
    );
    expect(RATE_LIMITS.AUTH_LOGIN.limit).toBeLessThan(
      RATE_LIMITS.API_GENERAL.limit
    );
  });

  it("should have longer time windows for sensitive operations", () => {
    expect(RATE_LIMITS.AUTH_REGISTER.window).toBeGreaterThan(
      RATE_LIMITS.AUTH_LOGIN.window
    );
    expect(RATE_LIMITS.AUTH_LOGIN.window).toBeGreaterThan(
      RATE_LIMITS.API_GENERAL.window
    );
  });
});
