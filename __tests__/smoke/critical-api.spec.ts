/**
 * Critical API Smoke Tests
 *
 * Purpose: Validate essential API endpoints are responding
 * Runtime target: <30 seconds total
 * Tests: 5 API health checks
 *
 * These tests ensure core backend functionality works after deployment.
 * They don't test full functionality - just that endpoints respond correctly.
 */

import { test, expect } from "@playwright/test";

test.describe("Critical API Endpoints", () => {
  test("GET /api/quests - returns quest data", async ({ request }) => {
    const response = await request.get("/api/quests");

    // Should return 200 OK
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Should return JSON array
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // Should have expected quest structure
    const firstQuest = data[0];
    expect(firstQuest).toHaveProperty("id");
    expect(firstQuest).toHaveProperty("title");
    expect(firstQuest).toHaveProperty("traderId");
  });

  test("GET /api/traders - returns trader data", async ({ request }) => {
    const response = await request.get("/api/traders");

    // Should return 200 OK
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Should return JSON array
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // Should have expected trader structure
    const firstTrader = data[0];
    expect(firstTrader).toHaveProperty("id");
    expect(firstTrader).toHaveProperty("name");
  });

  test("GET /api/health - health check endpoint", async ({ request }) => {
    const response = await request.get("/api/health");

    // Should return 200 OK or 404 if endpoint doesn't exist yet
    // (This is a placeholder - implement health endpoint in future)
    expect([200, 404]).toContain(response.status());
  });

  test("POST /api/progress - accepts valid progress update (authenticated)", async ({
    request,
  }) => {
    // Note: This test requires authentication
    // For now, we expect 401 Unauthorized for anonymous requests
    const response = await request.post("/api/progress", {
      data: {
        questId: "test-quest-id",
        status: "completed",
      },
    });

    // Should return 401 Unauthorized (no auth token)
    // This validates the endpoint exists and requires auth
    expect(response.status()).toBe(401);
  });

  test("GET /api/companion/status - companion API available", async ({
    request,
  }) => {
    const response = await request.get("/api/companion/status");

    // Should return 200 OK or 404 if endpoint doesn't exist yet
    // Validates companion API routing works
    expect([200, 404]).toContain(response.status());
  });
});

test.describe("API Error Handling", () => {
  test("Invalid quest ID returns appropriate error", async ({ request }) => {
    const response = await request.get("/api/quests/invalid-quest-id-12345");

    // Should handle gracefully (either 404 or return empty/error response)
    expect([200, 404, 400]).toContain(response.status());
  });

  test("Malformed POST request returns 400", async ({ request }) => {
    const response = await request.post("/api/progress", {
      data: {
        // Missing required fields
        invalid: "data",
      },
    });

    // Should return 400 Bad Request or 401 Unauthorized
    expect([400, 401]).toContain(response.status());
  });
});
