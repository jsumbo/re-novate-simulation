import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    headless: true,
    video: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
