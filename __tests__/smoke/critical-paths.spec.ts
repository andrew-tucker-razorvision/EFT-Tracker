import { test, expect } from '@playwright/test';

test.describe('Production Smoke Tests', () => {
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/EFT.*Tracker/i);
    // Verify React rendered (not just static HTML)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Health check endpoint is healthy', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    expect(health.status).toBe('healthy');
    expect(health.checks.database.status).toBe('healthy');
  });

  test('Quests API returns data', async ({ request }) => {
    const response = await request.get('/api/quests');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
  });

  test('Authentication page accessible', async ({ page }) => {
    await page.goto('/api/auth/signin');
    await expect(page.locator('body')).toContainText(/sign in/i);
  });

  test('Static assets load correctly', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Check for Next.js bundles
    const scripts = await page.locator('script[src]').count();
    expect(scripts).toBeGreaterThan(0);

    // Check for CSS
    const styles = await page.locator('link[rel="stylesheet"]').count();
    expect(styles).toBeGreaterThan(0);
  });
});
