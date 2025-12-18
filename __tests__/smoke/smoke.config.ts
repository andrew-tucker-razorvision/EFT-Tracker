import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30000, // 30s per test
  fullyParallel: true,
  workers: 3, // Run tests in parallel
  reporter: [
    ['list'],
    ['html', { outputFolder: 'smoke-test-results/report' }],
    ['json', { outputFile: 'smoke-test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.SMOKE_TEST_URL || 'https://learntotarkov.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
