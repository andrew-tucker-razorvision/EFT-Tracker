import { test, expect } from "@playwright/test";

/**
 * E2E tests for Companion Token Flow
 *
 * Tests the complete token generation and management flow:
 * 1. Web UI - Generate companion tokens from settings
 * 2. Web UI - View and revoke tokens
 * 3. API - Token validation and sync
 */

test.describe("Companion Token Flow - Web UI", () => {
  // Use a test user for this test
  let testUserEmail: string;
  let testUserPassword: string;

  test.beforeAll(() => {
    // These should be set in CI environment or use test database
    testUserEmail = process.env.TEST_USER_EMAIL || "test@example.com";
    testUserPassword = process.env.TEST_USER_PASSWORD || "TestPassword123!";
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('input[type="email"]', testUserEmail);
    await page.fill('input[type="password"]', testUserPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to quests page
    await page.waitForURL("/quests", { timeout: 15000 });
  });

  test("should navigate to companion app settings", async ({ page }) => {
    // Navigate to settings
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // Find and click Companion App tab
    const companionTab = page.locator('text="Companion App"');
    await expect(companionTab).toBeVisible();
    await companionTab.click();

    // Should see companion token section
    const tokenSection = page.locator('text="Companion App Tokens"');
    await expect(tokenSection).toBeVisible();
  });

  test("should generate a new companion token", async ({ page }) => {
    await page.goto("/settings");
    await page.click('text="Companion App"');

    // Click Generate New Token button
    const generateButton = page.locator(
      'button:has-text("Generate New Token")'
    );
    await generateButton.click();

    // Should show device name input dialog/modal
    await page.waitForSelector('input[placeholder*="device"]', {
      timeout: 5000,
    });

    // Enter device name
    await page.fill('input[placeholder*="device"]', "Test Device E2E");

    // Submit the form
    await page.click('button[type="submit"]');

    // Should show the token ONCE in a modal/dialog
    await page.waitForSelector("text=/cmp_[a-f0-9]{32}/", { timeout: 10000 });

    // Token should be displayed and copyable
    const tokenDisplay = page.locator("text=/cmp_[a-f0-9]{32}/");
    await expect(tokenDisplay).toBeVisible();

    // Should have a copy button
    const copyButton = page.locator('button:has-text("Copy")');
    await expect(copyButton).toBeVisible();

    // Close the modal
    await page.click('button:has-text("Done")');

    // Token should now appear in the active tokens list
    const tokenListItem = page.locator('text="Test Device E2E"');
    await expect(tokenListItem).toBeVisible();
  });

  test("should enforce 5-device limit", async ({ page }) => {
    await page.goto("/settings");
    await page.click('text="Companion App"');

    // Try to generate 6 tokens (assuming clean state, this might need adjustment)
    for (let i = 1; i <= 6; i++) {
      const generateButton = page.locator(
        'button:has-text("Generate New Token")'
      );

      // If button is disabled, we've hit the limit
      if ((await generateButton.isDisabled()) && i <= 5) {
        // Shouldn't be disabled before 5
        throw new Error(`Button disabled at ${i} tokens, expected at 6`);
      }

      if (i === 6) {
        // 6th attempt should show error or button should be disabled
        if (await generateButton.isEnabled()) {
          await generateButton.click();
          await page.fill('input[placeholder*="device"]', `Device ${i}`);
          await page.click('button[type="submit"]');

          // Should show error message
          const errorMessage = page.locator(
            "text=/Maximum.*5.*active tokens/i"
          );
          await expect(errorMessage).toBeVisible({ timeout: 5000 });
          return;
        } else {
          // Button disabled is also acceptable
          expect(await generateButton.isDisabled()).toBe(true);
          return;
        }
      }

      // Generate tokens 1-5
      await generateButton.click();
      await page.fill('input[placeholder*="device"]', `Device ${i}`);
      await page.click('button[type="submit"]');

      // Wait for token to be generated
      await page.waitForSelector("text=/cmp_/", { timeout: 10000 });
      await page.click('button:has-text("Done")');

      // Wait a bit between requests to avoid rate limiting
      await page.waitForTimeout(1000);
    }
  });

  test("should display active tokens with metadata", async ({ page }) => {
    await page.goto("/settings");
    await page.click('text="Companion App"');

    // Should show list of active tokens
    const tokenList = page
      .locator('[data-testid="companion-tokens-list"]')
      .or(page.locator('text="Active Tokens"'));
    await expect(tokenList).toBeVisible();

    // Check for token metadata
    const deviceName = page.locator('text="Test Device E2E"').first();
    if (await deviceName.isVisible()) {
      // Should show last used time
      const lastUsed = page
        .locator("text=/Last used:/")
        .or(page.locator("text=/Never/"));
      await expect(lastUsed).toBeVisible();

      // Should show created date
      const created = page.locator("text=/Created:/");
      await expect(created).toBeVisible();
    }
  });

  test("should revoke a companion token", async ({ page }) => {
    await page.goto("/settings");
    await page.click('text="Companion App"');

    // Find a token and revoke it
    const revokeButton = page.locator('button:has-text("Revoke")').first();

    if (await revokeButton.isVisible()) {
      // Get the device name before revoking
      const parentCard = revokeButton.locator("..");
      const deviceNameText = await parentCard.textContent();

      // Click revoke
      await revokeButton.click();

      // Should show confirmation dialog
      const confirmDialog = page.locator("text=/Are you sure/i");
      if (await confirmDialog.isVisible()) {
        await page.click('button:has-text("Confirm")');
      }

      // Wait for the token to be removed
      await page.waitForTimeout(1000);

      // Token should be removed from the list or marked as revoked
      const tokenGone = !(await page
        .locator(`text="${deviceNameText}"`)
        .isVisible());
      expect(tokenGone).toBeTruthy();
    }
  });

  test("should show token last used timestamp after validation", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.click('text="Companion App"');

    // Generate a token
    await page.click('button:has-text("Generate New Token")');
    await page.fill('input[placeholder*="device"]', "Last Used Test Device");
    await page.click('button[type="submit"]');

    // Copy the token
    const tokenText = await page
      .locator("text=/cmp_[a-f0-9]{32}/")
      .textContent();
    const token = tokenText?.match(/cmp_[a-f0-9]{32}/)?.[0];
    expect(token).toBeTruthy();

    await page.click('button:has-text("Done")');

    // Make an API call to /api/companion/status to update lastSeen
    const response = await page.request.post("/api/companion/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    // Refresh the settings page
    await page.reload();
    await page.click('text="Companion App"');

    // Check that "Last used" is no longer "Never"
    const lastUsedDevice = page.locator('text="Last Used Test Device"');
    const parentCard = lastUsedDevice.locator("..");
    const lastUsedText = await parentCard.textContent();

    expect(lastUsedText).not.toContain("Never");
    expect(lastUsedText).toMatch(/Last used:.*ago|seconds|minutes|hours/i);
  });
});

test.describe("Companion Token API", () => {
  let companionToken: string;

  test("POST /api/companion/link - should generate valid token", async ({
    page,
  }) => {
    // Need to be authenticated via web session
    await page.goto("/login");
    await page.fill(
      'input[type="email"]',
      process.env.TEST_USER_EMAIL || "test@example.com"
    );
    await page.fill(
      'input[type="password"]',
      process.env.TEST_USER_PASSWORD || "TestPassword123!"
    );
    await page.click('button[type="submit"]');
    await page.waitForURL("/quests", { timeout: 15000 });

    // Use page context to make authenticated request
    const response = await page.request.post("/api/companion/link", {
      data: {
        deviceName: "API Test Device",
        gameMode: "PVP",
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.token).toMatch(/^cmp_[a-f0-9]{32}$/);
    expect(data.deviceName).toBe("API Test Device");
    expect(data.createdAt).toBeTruthy();

    companionToken = data.token;
  });

  test("POST /api/companion/status - should validate token and return user info", async ({
    request,
  }) => {
    // Use the token from previous test
    if (!companionToken) {
      test.skip();
    }

    const response = await request.post("/api/companion/status", {
      headers: {
        Authorization: `Bearer ${companionToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.valid).toBe(true);
    expect(data.userId).toBeTruthy();
    expect(data.userName).toBeTruthy();
    expect(data.stats).toBeTruthy();
    expect(data.stats.completed).toBeGreaterThanOrEqual(0);
    expect(data.stats.inProgress).toBeGreaterThanOrEqual(0);
    expect(data.stats.available).toBeGreaterThanOrEqual(0);
    expect(data.stats.locked).toBeGreaterThanOrEqual(0);
  });

  test("POST /api/companion/status - should reject invalid token", async ({
    request,
  }) => {
    const response = await request.post("/api/companion/status", {
      headers: {
        Authorization: "Bearer cmp_invalid_token_12345678901234567890",
      },
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.valid).toBe(false);
    expect(data.error).toBeTruthy();
  });

  test("POST /api/companion/sync - should sync quest events", async ({
    request,
  }) => {
    if (!companionToken) {
      test.skip();
    }

    const response = await request.post("/api/companion/sync", {
      headers: {
        Authorization: `Bearer ${companionToken}`,
      },
      data: {
        events: [
          {
            questId: "5936d90786f7742b1420ba5b", // Sample quest ID
            status: "STARTED",
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.synced).toBeGreaterThanOrEqual(0);
    expect(data.stats).toBeTruthy();
  });

  test("POST /api/companion/sync - should reject invalid quest IDs", async ({
    request,
  }) => {
    if (!companionToken) {
      test.skip();
    }

    const response = await request.post("/api/companion/sync", {
      headers: {
        Authorization: `Bearer ${companionToken}`,
      },
      data: {
        events: [
          {
            questId: "invalid_quest_id_123",
            status: "FINISHED",
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    // Should return error for invalid quest
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });

  test("DELETE /api/companion/unlink - should revoke token", async ({
    request,
    page,
  }) => {
    if (!companionToken) {
      test.skip();
    }

    // Need authenticated session
    await page.goto("/login");
    await page.fill(
      'input[type="email"]',
      process.env.TEST_USER_EMAIL || "test@example.com"
    );
    await page.fill(
      'input[type="password"]',
      process.env.TEST_USER_PASSWORD || "TestPassword123!"
    );
    await page.click('button[type="submit"]');
    await page.waitForURL("/quests", { timeout: 15000 });

    // Get the token ID from the list endpoint
    const listResponse = await page.request.get("/api/companion/link");
    const tokens = await listResponse.json();
    const apiTestToken = (
      tokens as Array<{ id: string; deviceName: string }>
    ).find((t) => t.deviceName === "API Test Device");

    if (apiTestToken) {
      const response = await page.request.delete("/api/companion/unlink", {
        data: {
          tokenId: apiTestToken.id,
        },
      });

      expect(response.ok()).toBeTruthy();

      // Token should now be invalid
      const statusResponse = await request.post("/api/companion/status", {
        headers: {
          Authorization: `Bearer ${companionToken}`,
        },
      });

      expect(statusResponse.status()).toBe(401);
    }
  });
});
