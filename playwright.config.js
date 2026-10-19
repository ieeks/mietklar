import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: true, forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, workers: process.env.CI ? 2 : undefined,
  timeout: 30000, globalTimeout: 240000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173/mietklar/', locale: 'de-AT', timezoneId: 'Europe/Vienna', actionTimeout: 10000,
    viewport: { width: 390, height: 844 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [ { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit', isMobile: true, hasTouch: true } } ],
  webServer: { command: 'node scripts/serve.mjs', url: 'http://127.0.0.1:4173/mietklar/', reuseExistingServer: !process.env.CI }
});
