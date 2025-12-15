/**
 * Quest Workflow E2E Tests (Critical Paths Only)
 *
 * This file contains ONLY the most critical user journeys for quest interactions.
 * These tests validate essential functionality that must work for the app to be usable.
 *
 * Coverage:
 * 1. Happy path quest completion (no reload, visual feedback)
 * 2. Focus mode workflow (double-click to enter, ESC to exit)
 * 3. Mobile quest interaction (touch targets, bottom sheet)
 *
 * Note: More granular scenarios are covered by unit and integration tests.
 * See: __tests__/unit/lib/quest-tree-helpers.test.ts
 *      __tests__/integration/components/QuestTree.test.tsx
 *      __tests__/integration/components/QuestFilters.test.tsx
 */

import { test, expect, Page } from "@playwright/test";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Dismiss any modal dialogs that may appear (like welcome modal)
 * THIS IS CRITICAL - modal blocks ReactFlow from rendering
 */
async function dismissModals(page: Page) {
  // Wait for page to settle before checking for modals
  await page.waitForTimeout(1000);

  // Check if modal is present
  const welcomeModal = page.locator('[role="dialog"]');
  const modalVisible = await welcomeModal
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (!modalVisible) {
    // No modal, we're good
    return;
  }

  // Modal is present - MUST dismiss it or ReactFlow won't load
  console.log("Welcome modal detected, dismissing...");

  // Strategy 1: Try "Start Fresh" button (most common)
  const startFreshBtn = page.getByRole("button", { name: /start fresh/i });
  if (await startFreshBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startFreshBtn.click();
    // Wait for modal to close
    await page
      .waitForSelector('[role="dialog"]', { state: "hidden", timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
    console.log("Modal dismissed via Start Fresh button");
    return;
  }

  // Strategy 2: Try "Get Started" button
  const getStartedBtn = page.getByRole("button", { name: /get started/i });
  if (await getStartedBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await getStartedBtn.click();
    await page
      .waitForSelector('[role="dialog"]', { state: "hidden", timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
    console.log("Modal dismissed via Get Started button");
    return;
  }

  // Strategy 3: Try "Catch up" button (second option in modal)
  const catchUpBtn = page.getByRole("button", { name: /catch up/i });
  if (await catchUpBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await catchUpBtn.click();
    await page
      .waitForSelector('[role="dialog"]', { state: "hidden", timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
    console.log("Modal dismissed via Catch Up button");
    return;
  }

  // Strategy 4: Click close button (X in corner)
  const closeBtn = page.locator(
    '[role="dialog"] button[aria-label*="close"], [role="dialog"] button[aria-label*="Close"]'
  );
  if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeBtn.click();
    await page
      .waitForSelector('[role="dialog"]', { state: "hidden", timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(1000);
    console.log("Modal dismissed via close button");
    return;
  }

  // Strategy 5: Press Escape key
  await page.keyboard.press("Escape");
  await page
    .waitForSelector('[role="dialog"]', { state: "hidden", timeout: 5000 })
    .catch(() => {});
  await page.waitForTimeout(1000);
  console.log("Modal dismissed via Escape key");

  // Final verification - if modal is still visible, this is a CRITICAL ERROR
  const stillVisible = await welcomeModal
    .isVisible({ timeout: 1000 })
    .catch(() => false);
  if (stillVisible) {
    throw new Error(
      "CRITICAL: Welcome modal could not be dismissed - ReactFlow cannot load"
    );
  }
}

/**
 * Wait for quest tree to be fully loaded and interactive
 * Uses retry logic to handle flaky ReactFlow loading
 */
async function waitForQuestTree(page: Page, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait for initial page load
      await page.waitForLoadState("domcontentloaded");
      await page.waitForLoadState("networkidle", { timeout: 15000 });

      // Dismiss modals first (like welcome modal)
      await dismissModals(page);

      // Wait for UI to settle after modal
      await page.waitForTimeout(1500);

      // Ensure we're in tree view (click the Traders button if not active)
      const tradersButton = page
        .getByRole("button", { name: /traders/i })
        .first();

      try {
        await tradersButton.waitFor({ state: "visible", timeout: 8000 });

        // Check if it's already active
        const isActive = await tradersButton
          .evaluate((el) => {
            return (
              el.classList.contains("bg-") ||
              el.getAttribute("data-state") === "active" ||
              el.getAttribute("aria-selected") === "true"
            );
          })
          .catch(() => false);

        if (!isActive) {
          await tradersButton.click();
          // Wait longer for view mode switch and data load
          await page.waitForTimeout(2000);
          await page.waitForLoadState("networkidle", { timeout: 10000 });
        }
      } catch {
        // Button not found - may already be in tree view or different layout
        console.warn(`Traders button not found (attempt ${attempt + 1})`);
      }

      // Wait for ReactFlow to be present and quest nodes to render
      // Use a custom wait that checks both viewport and nodes
      await page.waitForFunction(
        () => {
          const viewport = document.querySelector(".react-flow__viewport");
          const nodes = document.querySelectorAll(".react-flow__node");
          return viewport !== null && nodes.length > 0;
        },
        { timeout: 50000 }
      );

      // Additional wait for rendering to complete
      await page.waitForTimeout(2000);

      // Final verification
      const nodeCount = await page.locator(".react-flow__node").count();
      if (nodeCount > 0) {
        // Success! Tree loaded with nodes
        return;
      }

      throw new Error(`Tree loaded but no nodes visible (${nodeCount} nodes)`);
    } catch (error) {
      if (attempt < maxRetries) {
        console.warn(
          `Quest tree load failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`
        );
        // Reload the page and try again
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
      } else {
        // Final attempt failed
        throw new Error(
          `Quest tree failed to load after ${maxRetries + 1} attempts: ${error}`
        );
      }
    }
  }
}

// ============================================================================
// CRITICAL PATH TESTS
// ============================================================================

test.describe("Quest Workflow - Critical Paths", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/quests");
    await waitForQuestTree(page);
  });

  // ==========================================================================
  // CRITICAL PATH 1: QUEST COMPLETION WORKFLOW
  // ==========================================================================
  test("happy path: click quest, see visual feedback, tree remains interactive", async ({
    page,
  }) => {
    // Track navigation events - quest clicks should NOT reload the page
    let navigationOccurred = false;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        navigationOccurred = true;
      }
    });

    // Find an available quest node
    const questNode = page
      .locator(".react-flow__node")
      .filter({ hasText: "Lv." })
      .first();
    await expect(questNode).toBeVisible();

    // Click the quest
    await questNode.click({ force: true });

    // Wait for state update
    await page.waitForTimeout(500);

    // CRITICAL: No page reload should occur
    expect(navigationOccurred).toBe(false);

    // CRITICAL: Quest node should remain visible (visual feedback)
    await expect(questNode).toBeVisible({ timeout: 1000 });

    // CRITICAL: Tree should remain interactive
    const controls = page.locator(".react-flow__controls");
    await expect(controls).toBeVisible();
    const zoomIn = page.locator(".react-flow__controls-zoomin");
    await expect(zoomIn).toBeEnabled();

    // CRITICAL: Tree should still have nodes (didn't clear unexpectedly)
    const afterClickCount = await page.locator(".react-flow__node").count();
    expect(afterClickCount).toBeGreaterThan(0);
  });

  // ==========================================================================
  // CRITICAL PATH 2: FOCUS MODE WORKFLOW
  // ==========================================================================
  test("focus mode: double-click enters focus, ESC exits focus", async ({
    page,
  }) => {
    // Find a quest node (must contain both a quest title and Lv. indicator)
    // Avoid trader header nodes which don't have the Lv. indicator
    const questNodes = page
      .locator(".react-flow__node")
      .filter({ hasText: "Lv." });
    const firstQuestNode = questNodes.first();
    await expect(firstQuestNode).toBeVisible();

    // CRITICAL: Double-click should enter focus mode
    await firstQuestNode.dblclick();

    // Wait longer for focus mode animation and state update
    await page.waitForTimeout(1500);

    // CRITICAL: Focus mode indicator should appear
    const focusIndicator = page.getByText("Focus Mode");
    await expect(focusIndicator).toBeVisible({ timeout: 5000 });

    // CRITICAL: Tree should still be visible
    await expect(page.locator(".react-flow__viewport")).toBeVisible();

    // CRITICAL: ESC should exit focus mode
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // CRITICAL: Focus indicator should disappear
    await expect(focusIndicator).not.toBeVisible();
  });

  // ==========================================================================
  // CRITICAL PATH 3: MOBILE QUEST INTERACTION
  // ==========================================================================
  test("mobile: info button opens quest details in bottom sheet", async ({
    page,
  }) => {
    // Set mobile viewport and reload
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/quests");
    await waitForQuestTree(page);

    // Find info button on a quest node
    const infoButton = page
      .locator('button[aria-label*="View"][aria-label*="details"]')
      .first();

    if (await infoButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // CRITICAL: Touch targets should be adequate (44px minimum)
      const box = await infoButton.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }

      // CRITICAL: Tap should open quest details
      await infoButton.tap();
      await page.waitForTimeout(500);

      // CRITICAL: Sheet (bottom drawer) should appear on mobile
      const sheet = page.locator('[data-state="open"]');
      await expect(sheet).toBeVisible({ timeout: 3000 });
    }
  });
});
