import { defineConfig, devices } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = dirname(fileURLToPath(import.meta.url));
const testingRoot = resolve(configDirectory, '../FinLease Testing');

export default defineConfig({
  testDir: resolve(configDirectory, 'e2e'),
  outputDir: resolve(testingRoot, 'playwright-test-results'),
  reporter: [
    ['list'],
    ['html', { outputFolder: resolve(testingRoot, 'playwright-report'), open: 'never' }],
  ],
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'on',
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    cwd: configDirectory,
    url: 'http://127.0.0.1:4173/login',
    reuseExistingServer: true,
    timeout: 120000,
  },
});