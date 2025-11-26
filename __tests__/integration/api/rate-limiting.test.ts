/**
 * Integration Tests - Rate Limiting
 *
 * Tests that rate limiting is properly applied to API endpoints
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST as RegisterPOST } from "@/app/api/auth/register/route";

// Mock dependencies but NOT rate-limit (we want to test it)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(() => Promise.resolve(null)),
      create: vi.fn((data) =>
        Promise.resolve({
          id: "test-user-id",
          email: data.data.email,
          name: data.data.name,
          password: data.data.password,
          emailVerified: null,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(() => Promise.resolve("hashed_password")),
  },
}));

describe("Rate Limiting - Registration Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers to control time in tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow requests within rate limit", async () => {
    const createRequest = (email: string) =>
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.1",
        },
        body: JSON.stringify({
          email,
          password: "password123",
          name: "Test User",
        }),
      });

    // First request should succeed
    const response1 = await RegisterPOST(createRequest("test1@example.com"));
    expect(response1.status).toBe(201);

    // Second request should succeed
    const response2 = await RegisterPOST(createRequest("test2@example.com"));
    expect(response2.status).toBe(201);

    // Third request should succeed (limit is 3 per hour)
    const response3 = await RegisterPOST(createRequest("test3@example.com"));
    expect(response3.status).toBe(201);
  });

  it("should block requests exceeding rate limit", async () => {
    const createRequest = (email: string) =>
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.2",
        },
        body: JSON.stringify({
          email,
          password: "password123",
          name: "Test User",
        }),
      });

    // Use up the rate limit (3 requests)
    await RegisterPOST(createRequest("test1@example.com"));
    await RegisterPOST(createRequest("test2@example.com"));
    await RegisterPOST(createRequest("test3@example.com"));

    // Fourth request should be rate limited
    const response = await RegisterPOST(createRequest("test4@example.com"));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain("Too many registration attempts");
  });

  it("should include rate limit headers in 429 response", async () => {
    const createRequest = () =>
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.3",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

    // Exhaust rate limit
    await RegisterPOST(createRequest());
    await RegisterPOST(createRequest());
    await RegisterPOST(createRequest());

    // Get rate limited response
    const response = await RegisterPOST(createRequest());

    expect(response.headers.get("X-RateLimit-Limit")).toBe("3");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.has("X-RateLimit-Reset")).toBe(true);
    expect(response.headers.has("Retry-After")).toBe(true);
  });

  it("should track rate limits per IP address", async () => {
    const createRequest = (ip: string, email: string) =>
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify({
          email,
          password: "password123",
        }),
      });

    // IP 1: Use up rate limit
    await RegisterPOST(createRequest("192.168.1.4", "test1@example.com"));
    await RegisterPOST(createRequest("192.168.1.4", "test2@example.com"));
    await RegisterPOST(createRequest("192.168.1.4", "test3@example.com"));

    const response1 = await RegisterPOST(
      createRequest("192.168.1.4", "test4@example.com")
    );
    expect(response1.status).toBe(429);

    // IP 2: Should still be allowed
    const response2 = await RegisterPOST(
      createRequest("192.168.1.5", "test5@example.com")
    );
    expect(response2.status).toBe(201);
  });

  it("should reset rate limit after time window expires", async () => {
    const createRequest = () =>
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.6",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

    // Exhaust rate limit
    await RegisterPOST(createRequest());
    await RegisterPOST(createRequest());
    await RegisterPOST(createRequest());

    // Should be blocked
    const response1 = await RegisterPOST(createRequest());
    expect(response1.status).toBe(429);

    // Advance time past the 1-hour window (3600001ms)
    vi.advanceTimersByTime(3600001);

    // Should be allowed again
    const response2 = await RegisterPOST(createRequest());
    expect(response2.status).toBe(201);
  });

  it("should handle requests without IP headers", async () => {
    const createRequest = () =>
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // No IP headers
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

    // Should still apply rate limiting using "unknown" as identifier
    const response1 = await RegisterPOST(createRequest());
    expect(response1.status).toBe(201);

    const response2 = await RegisterPOST(createRequest());
    expect(response2.status).toBe(201);

    const response3 = await RegisterPOST(createRequest());
    expect(response3.status).toBe(201);

    const response4 = await RegisterPOST(createRequest());
    expect(response4.status).toBe(429);
  });

  it("should apply rate limiting before other validations", async () => {
    const createRequest = () =>
      new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "192.168.1.7",
        },
        body: JSON.stringify({
          email: "invalid-email", // Invalid email
          password: "short", // Invalid password
        }),
      });

    // Exhaust rate limit with invalid data
    await RegisterPOST(createRequest());
    await RegisterPOST(createRequest());
    await RegisterPOST(createRequest());

    // Should get rate limit error, not validation error
    const response = await RegisterPOST(createRequest());
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain("Too many registration attempts");
    expect(data.error).not.toContain("Invalid email");
  });
});
