import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for tgui E2E tests
 *
 * Note: tgui runs inside BYOND's embedded browser, so true E2E testing requires
 * a running game server. These tests focus on testing the chargen workflow
 * against a dev server or static build.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory (moved outside interfaces to avoid webpack bundling)
  testDir: './packages/tgui/__tests__/shadowrun-e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [['html', { open: 'never' }], ['list']],

  // Shared settings for all the projects
  use: {
    // Base URL for navigation - points to tgui dev server
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run tgui dev server before starting the tests (optional)
  // Uncomment if you want tests to auto-start the dev server
  // webServer: {
  //   command: 'npm run tgui:dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
