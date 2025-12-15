import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke Test Configuration
 *
 * Purpose: Fast post-deployment validation (<2 min total)
 * Runs against: Production URL (https://learntotarkov.com)
 * Triggered by: GitHub workflow after deployment
 *
 * Key differences from main E2E config:
 * - Faster timeouts (10s vs 30s)
 * - More aggressive retries (2 vs 0)
 * - Parallel execution (3 workers)
 * - Production URL default
 */
export default defineConfig({
  testDir: "./",
  testMatch: "**/*.spec.ts",

  // Fast timeouts for smoke tests
  timeout: 10_000, // 10s per test (vs 30s for E2E)
  expect: {
    timeout: 5_000, // 5s for assertions
  },

  // Retry flaky checks in production
  fullyParallel: true,
  retries: 2, // Retry twice on failure

  // Parallel execution for speed
  workers: 3,

  // Minimal reporter for CI
  reporter: [["list"], ["html", { outputFolder: "smoke-test-results/report" }]],

  use: {
    // Production URL (can be overridden via env var)
    baseURL: process.env.SMOKE_TEST_URL || "https://learntotarkov.com",

    // Fast timeouts
    actionTimeout: 5_000,
    navigationTimeout: 10_000,

    // Capture on failure only
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Output directory
  outputDir: "smoke-test-results/artifacts",
});
