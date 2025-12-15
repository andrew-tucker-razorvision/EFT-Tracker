/**
 * Critical UI Smoke Tests
 *
 * Purpose: Validate essential pages load without errors
 * Runtime target: <45 seconds total
 * Tests: 5 UI page load checks
 *
 * These tests ensure core user-facing pages render after deployment.
 * They don't test interactions - just that pages load successfully.
 */

import { test, expect } from "@playwright/test";

test.describe("Critical Page Loads", () => {
  test("Homepage (/) loads without errors", async ({ page }) => {
    // Navigate to homepage
    const response = await page.goto("/");

    // Should return 200 OK
    expect(response?.status()).toBe(200);

    // Should have title
    await expect(page).toHaveTitle(/EFT Quest Tracker/i);

    // Should not have React/Next.js errors
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    // Wait a moment for any errors to appear
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test("Quests page (/quests) loads and renders", async ({ page }) => {
    // Navigate to quests page
    const response = await page.goto("/quests");

    // Should return 200 OK
    expect(response?.status()).toBe(200);

    // Should have title
    await expect(page).toHaveTitle(/Quest/i);

    // Should render quest-related UI elements
    // (Filter bar, view mode toggles, or quest nodes)
    const hasFilterBar = await page
      .getByPlaceholder(/search/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const hasViewToggles = await page
      .getByRole("button", { name: /traders|levels|maps/i })
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // At least one should be visible
    expect(hasFilterBar || hasViewToggles).toBeTruthy();
  });

  test("Quest tree renders nodes", async ({ page }) => {
    await page.goto("/quests");

    // Wait for network to settle
    await page.waitForLoadState("networkidle");

    // Ensure we're in tree view (click Traders button if needed)
    const tradersButton = page
      .getByRole("button", { name: /traders/i })
      .first();
    if (await tradersButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tradersButton.click();
      await page.waitForTimeout(500);
    }

    // Should render quest nodes or tree viewport
    const hasReactFlow = await page
      .locator(".react-flow__viewport")
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const hasQuestCards = await page
      .locator('[data-testid*="quest"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Should render some form of quest display
    expect(hasReactFlow || hasQuestCards).toBeTruthy();
  });

  test("Navigation links work", async ({ page }) => {
    await page.goto("/");

    // Find and click Quests navigation link
    const questsLink = page.getByRole("link", { name: /quests/i });
    await expect(questsLink).toBeVisible();

    await questsLink.click();

    // Should navigate to /quests
    await expect(page).toHaveURL(/\/quests/);
  });

  test("No console errors on page load", async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Load the main quests page
    await page.goto("/quests");
    await page.waitForLoadState("networkidle");

    // Filter out expected/ignorable errors
    const criticalErrors = consoleErrors.filter((error) => {
      // Ignore known non-critical errors
      if (error.includes("favicon")) return false;
      if (error.includes("source map")) return false;
      return true;
    });

    // Should have no critical console errors
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Responsive Layout", () => {
  test("Mobile viewport loads correctly", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const response = await page.goto("/quests");
    expect(response?.status()).toBe(200);

    // Should render mobile-specific elements
    const hasToggleMenu = await page
      .getByRole("button", { name: /toggle menu|menu/i })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const hasFilters = await page
      .getByRole("button", { name: /filters/i })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    // Mobile UI should be present
    expect(hasToggleMenu || hasFilters).toBeTruthy();
  });

  test("Desktop viewport loads correctly", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    const response = await page.goto("/quests");
    expect(response?.status()).toBe(200);

    // Desktop should show full filter bar
    const hasSearchInput = await page
      .getByPlaceholder(/search/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(hasSearchInput).toBeTruthy();
  });
});
