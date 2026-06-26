import { expect, type Page } from '@playwright/test'

// ── Lab constants ─────────────────────────────────────────────────────────────
// Empresa Disney · proyecto canon "Toy Story"
// Seed en e2e/fixtures/seed.sql
export const LAB_COMPANY_ID  = '0b83042d-414e-4d4c-8c83-3a469affbfb3'
export const LAB_PROJECT_ID  = 'e2058bff-9759-465d-ae4d-df79fdf23815'

export const USERS = {
  superadmin: {
    email:    process.env.E2E_SUPERADMIN_EMAIL    ?? 'superadmin@test.dev',
    password: process.env.E2E_SUPERADMIN_PASSWORD ?? 'temporal',
  },
  consultor: {
    email:    process.env.E2E_CONSULTANT_EMAIL    ?? 'consultor@test.dev',
    password: process.env.E2E_CONSULTANT_PASSWORD ?? 'temporal',
  },
  editor: {
    email:    process.env.E2E_CLIENT_EDITOR_EMAIL    ?? 'editor@test.dev',
    password: process.env.E2E_CLIENT_EDITOR_PASSWORD ?? 'temporal',
  },
  viewer: {
    email:    process.env.E2E_CLIENT_VIEWER_EMAIL    ?? 'viewer@test.dev',
    password: process.env.E2E_CLIENT_VIEWER_PASSWORD ?? 'temporal',
  },
} as const

// ── login ─────────────────────────────────────────────────────────────────────
export async function login(
  page: Page,
  email    = USERS.consultor.email,
  password = USERS.consultor.password,
): Promise<void> {
  await page.goto('/login')
  await page.locator('input[autocomplete="email"]').fill(email)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 12_000 })
}

// ── selectEngagement ──────────────────────────────────────────────────────────
// Inyecta el projectId en el localStorage de Zustand (clave lean-active-engagement)
// antes de navegar a la ruta de la herramienta.
// Llámalo DESPUÉS de login() y ANTES de page.goto('/t1/:engagementId').
//
// Flujo recomendado en beforeEach:
//   await login(page)
//   await selectEngagement(page)                        // inyecta Toy Story
//   await page.goto(`/t1/${LAB_PROJECT_ID}`)            // ruta con engagementId
//   await waitForStoreReady(page, 'T1')                 // espera a que el store cargue
export async function selectEngagement(
  page:      Page,
  projectId: string = LAB_PROJECT_ID,
): Promise<void> {
  await page.evaluate((pid) => {
    // Formato interno de zustand/middleware/persist v1
    localStorage.setItem(
      'lean-active-engagement',
      JSON.stringify({ state: { activeEngagementId: pid }, version: 1 }),
    )
  }, projectId)
}

// ── waitForStoreReady ─────────────────────────────────────────────────────────
// Espera a que el debug panel del store muestre "ready" para el tool indicado,
// o a que el indicador de carga ("Cargando...") desaparezca del DOM.
// Útil en beforeEach para garantizar que los datos están antes de que corran
// las assertions del test.
// Timeout generoso (20s) por latencia del Docker local.
export async function waitForStoreReady(
  page:    Page,
  loadingText = 'Cargando',
  timeoutMs   = 20_000,
): Promise<void> {
  await page.waitForFunction(
    (text: string) => !document.body.textContent?.includes(text),
    loadingText,
    { timeout: timeoutMs },
  ).catch(() => {
    // Silencia el timeout: si el texto no apareció, el store nunca entró en
    // estado loading (ruta de demostración o datos ya en caché).
  })
}
