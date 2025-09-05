import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const PORT = Number(process.env.PORT || 3000);

const config: PlaywrightTestConfig = {
  testDir: 'e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retry-with-trace',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
};

export default config;

