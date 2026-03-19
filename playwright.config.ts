import { defineConfig, devices } from '@playwright/test';

import { e2eEnv } from './tests/e2e/support/env';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/e2e/setup/global.setup.ts',
  globalTeardown: './tests/e2e/setup/global.teardown.ts',
  use: {
    baseURL: e2eEnv.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup-auth',
      testMatch: /.*auth\.setup\.ts/,
    },
    {
      name: 'desktop-chromium',
      dependencies: ['setup-auth'],
      testIgnore: /.*auth\.setup\.ts/,
      grepInvert: /@mobile/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'mobile-chromium',
      dependencies: ['setup-auth'],
      testIgnore: /.*auth\.setup\.ts/,
      grep: /@mobile/,
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
  webServer: {
    command: 'npm start',
    port: 3001,
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      REACT_APP_API_BASE_URL: e2eEnv.apiBaseUrl,
    },
  },
});
