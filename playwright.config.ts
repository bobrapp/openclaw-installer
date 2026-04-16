import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5000',
    headless: true,
  },
  webServer: {
    command: 'NODE_ENV=production node dist/index.cjs',
    port: 5000,
    reuseExistingServer: true,
  },
});
