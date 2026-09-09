import { defineConfig, devices } from '@playwright/test'

const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:5173'
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000'

/**
 * Levanta la API y el frontend contra el Postgres de `docker-compose.yml` (`npm run db:up` primero).
 * `reuseExistingServer` deja usar un `npm run dev` que ya esté corriendo en desarrollo local.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run dev:api',
      cwd: '../..',
      url: API_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'npm run dev:web',
      cwd: '../..',
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})
