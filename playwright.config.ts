import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    // Soporte multi-puerto: E2E_BASE_URL sobreescribe si la app usa puerto distinto
    // Por defecto 5173, pero Vite puede usar 5174 si 5173 está ocupado.
    // Ejemplo: E2E_BASE_URL=http://localhost:5174 npm run test:e2e
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Arranca el servidor de desarrollo antes de los E2E si no está ya corriendo.
  // reuseExistingServer: true → si ya corre en el puerto, lo reutiliza.
  webServer: {
    command: 'npm run dev',
    url: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
