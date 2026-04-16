import { defineConfig } from '@playwright/test';

/**
 * Playwright config for standalone wizard smoke tests.
 * Serves the public/ directory via python3 http.server on port 9222.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'standalone-wizard-smoke.spec.ts',
  timeout: 120_000,
  retries: 1,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:9222',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 9222 --directory public',
    port: 9222,
    reuseExistingServer: true,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-standalone' }],
  ],
});
