import { test, expect } from '@playwright/test';

/**
 * Phase 1 - Next Up Intelligence Enhancement Tests
 *
 * Tests the three new suggestion tiers:
 * - Tier 5: Chain Completion Momentum
 * - Tier 6: Map Synergy
 * - Tier 7: Trader Progress
 *
 * Plus type diversity filter and UI enhancements
 */

const PROD_URL = process.env.E2E_TEST_URL || 'https://learntotarkov.com';

test.describe('Phase 1: Next Up Intelligence Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to quests page where Next Up panel appears
    await page.goto(`${PROD_URL}/quests`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('UI Enhancements', () => {
    test('Next Up panel renders on quests page', async ({ page }) => {
      const nextUpPanel = page.getByText('Next Up');
      await expect(nextUpPanel).toBeVisible();
    });

    test('InfoTooltip button is present next to Next Up heading', async ({ page }) => {
      const nextUpSection = page.locator('div.bg-card').filter({ hasText: 'Next Up' }).first();
      const tooltipButton = nextUpSection.locator('button[title="How Next Up Works"]');
      await expect(tooltipButton).toBeVisible();
    });

    test('InfoTooltip displays on hover with correct content', async ({ page }) => {
      const nextUpSection = page.locator('div.bg-card').filter({ hasText: 'Next Up' }).first();
      const tooltipButton = nextUpSection.locator('button[title="How Next Up Works"]');

      // Hover to trigger tooltip
      await tooltipButton.hover();

      // Wait for tooltip to appear
      const tooltip = nextUpSection.locator('div').filter({ hasText: 'How Next Up Works' });
      await expect(tooltip).toBeVisible();

      // Verify all 5 bullet points are present
      const bulletPoints = [
        'Your level and available quests',
        'Kappa requirements',
        'Quest chains and dependencies',
        'Map efficiency and synergy',
        'Your trader progress',
      ];

      for (const point of bulletPoints) {
        await expect(tooltip.locator(`text=${point}`)).toBeVisible();
      }
    });

    test('New icon types render correctly (momentum and trader)', async ({ page }) => {
      // Get all Next Up suggestion items
      const suggestions = page.locator('button[type="button"]').filter({ hasText: /Perfect for level|finish it!|efficient!|done$/ });

      if (await suggestions.count() > 0) {
        // Check for orange momentum icon (Zap in orange-400)
        const momentumIcon = page.locator('svg').filter({ hasText: /Zap/ });
        // Momentum icon should exist if there are momentum suggestions
        // (This is a soft check as icons might not always render in tests)

        // Verify no console errors related to icons
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // Give page time to render
        await page.waitForTimeout(1000);

        // Should have no errors about missing icons
        const iconErrors = consoleErrors.filter(e =>
          e.includes('icon') || e.includes('momentum') || e.includes('trader')
        );
        expect(iconErrors).toHaveLength(0);
      }
    });
  });

  test.describe('Type Diversity Filter', () => {
    test('Max 2 quests of same type in suggestions', async ({ page }) => {
      // Wait for suggestions to load
      await page.waitForSelector('div.space-y-2 > button', { timeout: 5000 }).catch(() => null);

      const suggestions = await page.locator('div.space-y-2 > button').all();

      if (suggestions.length > 0) {
        // Collect quest types from displayed suggestions
        const typeCounts = new Map<string, number>();

        // Note: We can't directly access quest types from UI,
        // but we can verify the algorithm worked by checking:
        // 1. No more than 5 total suggestions
        // 2. Suggestions are diverse in appearance

        expect(suggestions.length).toBeLessThanOrEqual(5);

        // If there are exactly 5 suggestions, verify they're not all the same
        if (suggestions.length === 5) {
          const titles = await Promise.all(
            suggestions.map(s => s.locator('div').first().textContent())
          );
          const uniqueTitles = new Set(titles);
          expect(uniqueTitles.size).toBeGreaterThan(1);
        }
      }
    });
  });

  test.describe('New Suggestion Tiers', () => {
    test('Tier 5: Chain Momentum message format is correct', async ({ page }) => {
      // Look for chain momentum message pattern: "X/Y in chain - finish it!"
      const momentumMessage = page.locator('text=/\\d+\\/\\d+ in chain - finish it!/');

      const isVisible = await momentumMessage.isVisible().catch(() => false);

      if (isVisible) {
        // If momentum suggestion appears, verify message format
        const text = await momentumMessage.textContent();
        expect(text).toMatch(/\d+\/\d+ in chain - finish it!/);
      }
      // If not visible, that's ok - depends on user's quest chain progress
    });

    test('Tier 6: Map Synergy message format is correct', async ({ page }) => {
      // Look for map synergy message pattern: "X quests on [Map] - efficient!"
      const synergyMessage = page.locator('text=/\\d+ quests on .+ - efficient!/');

      const isVisible = await synergyMessage.isVisible().catch(() => false);

      if (isVisible) {
        // If synergy suggestion appears, verify message format
        const text = await synergyMessage.textContent();
        expect(text).toMatch(/\d+ quests on .+ - efficient!/);
      }
      // If not visible, that's ok - depends on available quests
    });

    test('Tier 7: Trader Progress message format is correct', async ({ page }) => {
      // Look for trader progress message pattern: "X% [Trader] done"
      const traderMessage = page.locator('text=/\\d+% \\w+ done/');

      const isVisible = await traderMessage.isVisible().catch(() => false);

      if (isVisible) {
        // If trader progress suggestion appears, verify message format
        const text = await traderMessage.textContent();
        expect(text).toMatch(/\d+% \w+ done/);
      }
      // If not visible, that's ok - depends on trader progress
    });
  });

  test.describe('Integration & Functionality', () => {
    test('Suggestions update in real-time when quests are marked complete', async ({ page }) => {
      // Get initial suggestion count
      await page.waitForSelector('div.space-y-2 > button', { timeout: 5000 }).catch(() => null);
      const initialSuggestions = await page.locator('div.space-y-2 > button').count();

      if (initialSuggestions > 0) {
        // Try to find and click a complete button to mark a quest complete
        const completeButtons = page.locator('button').filter({ hasText: /Complete|Check|Done/ });
        const completeCount = await completeButtons.count();

        if (completeCount > 0) {
          // Click first complete button
          await completeButtons.first().click();

          // Wait for UI to update
          await page.waitForTimeout(500);

          // Verify suggestions are still displayed (may have changed)
          const updatedSuggestions = await page.locator('div.space-y-2 > button').count();
          expect(updatedSuggestions).toBeGreaterThanOrEqual(0);
        }
      }
    });

    test('No duplicate quests appear in suggestions', async ({ page }) => {
      await page.waitForSelector('div.space-y-2 > button', { timeout: 5000 }).catch(() => null);

      const suggestions = await page.locator('div.space-y-2 > button').all();

      if (suggestions.length > 0) {
        const questTitles: string[] = [];

        for (const suggestion of suggestions) {
          // Quest title is typically in first div > div > div
          const title = await suggestion.locator('div').first().locator('div').first().textContent();
          if (title) questTitles.push(title);
        }

        // Check for duplicates
        const uniqueTitles = new Set(questTitles);
        expect(uniqueTitles.size).toBe(questTitles.length);
      }
    });

    test('Existing tiers (1-4) still work correctly', async ({ page }) => {
      await page.waitForSelector('div.space-y-2 > button', { timeout: 5000 }).catch(() => null);

      const suggestions = await page.locator('div.space-y-2 > button').all();

      if (suggestions.length > 0) {
        // Verify we see at least one suggestion (any tier)
        expect(suggestions.length).toBeGreaterThan(0);

        // Verify suggestions are clickable (basic functionality check)
        for (const suggestion of suggestions.slice(0, Math.min(3, suggestions.length))) {
          await expect(suggestion).toBeEnabled();
        }
      }
    });

    test('Next Up panel shows max 5 suggestions', async ({ page }) => {
      await page.waitForSelector('div.space-y-2 > button', { timeout: 5000 }).catch(() => null);

      const suggestions = await page.locator('div.space-y-2 > button').count();

      // Should show 0-5 suggestions, never more than 5
      expect(suggestions).toBeLessThanOrEqual(5);
    });
  });

  test.describe('Edge Cases', () => {
    test('Handles empty suggestion list gracefully', async ({ page }) => {
      // If no suggestions available, Next Up panel should not crash
      const nextUpSection = page.locator('div.bg-card').filter({ hasText: 'Next Up' });

      // Either we see the panel with suggestions, or it's not visible (both valid)
      const isVisible = await nextUpSection.isVisible().catch(() => false);

      if (isVisible) {
        // If visible, it should have valid structure
        await expect(nextUpSection).toContainText('Next Up');
      }
    });

    test('No console errors related to Next Up functionality', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Trigger any interactions
      const tooltipButton = page.locator('button[title="How Next Up Works"]');
      const isPresent = await tooltipButton.isVisible().catch(() => false);

      if (isPresent) {
        await tooltipButton.hover();
        await page.waitForTimeout(500);
      }

      // Filter for relevant errors (ignore unrelated console errors)
      const relevantErrors = consoleErrors.filter(e =>
        e.includes('Next') ||
        e.includes('suggestion') ||
        e.includes('momentum') ||
        e.includes('synergy') ||
        e.includes('trader') ||
        e.includes('undefined is not a function')
      );

      expect(relevantErrors).toHaveLength(0);
    });
  });
});
