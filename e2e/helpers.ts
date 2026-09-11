import { expect, type Page } from '@playwright/test'

// ── Lab constants ─────────────────────────────────────────────────────────────
// Empresa Disney · dos proyectos canon:
//   - "Toy Story" — todos los paquetes (boost + portfolio + legal)
//   - "Test Boost Only" — solo paquete boost_assessment (para testear estado preview)
// Seed en e2e/fixtures/seed.sql
export const LAB_COMPANY_ID           = '0b83042d-414e-4d4c-8c83-3a469affbfb3'
export const LAB_PROJECT_ID           = 'e2058bff-9759-465d-ae4d-df79fdf23815'  // Toy Story
export const LAB_PROJECT_BOOST_ONLY   = 'd1a2b3c4-e5f6-4a1b-9c8d-7e6f5a4b3c2d'  // Test Boost Only
export const LAB_SECOND_COMPANY_ID    = '9f648a7e-4d12-4a29-bf18-2750cde3ed7f'
export const LAB_SECOND_PROJECT_ID    = '57d8a20c-a87f-4e17-a8ac-3426d071e762'

export const USERS = {
  superadmin: {
    email:    process.env.E2E_SUPERADMIN_EMAIL    ?? 'superadmin@test.dev',
    password: process.env.E2E_SUPERADMIN_PASSWORD ?? 'Temporal',
  },
  consultor: {
    email:    process.env.E2E_CONSULTANT_EMAIL    ?? 'consultant@test.dev',
    password: process.env.E2E_CONSULTANT_PASSWORD ?? 'Temporal',
  },
  editor: {
    email:    process.env.E2E_CLIENT_EDITOR_EMAIL    ?? 'editor@test.dev',
    password: process.env.E2E_CLIENT_EDITOR_PASSWORD ?? 'Temporal',
  },
  viewer: {
    email:    process.env.E2E_CLIENT_VIEWER_EMAIL    ?? 'viewer@test.dev',
    password: process.env.E2E_CLIENT_VIEWER_PASSWORD ?? 'Temporal',
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
  const persistProject = ([pid, companyId]: [string, string]) => {
    // Formato interno de zustand/middleware/persist v1.
    // La app actual usa lean-active-project; lean-active-engagement queda
    // como compatibilidad para rutas/tests legacy.
    const state = { activeProjectId: pid, activeEngagementId: pid, activeCompanyId: companyId }
    localStorage.setItem(
      'lean-active-project',
      JSON.stringify({ state, version: 1 }),
    )
    localStorage.setItem(
      'lean-active-engagement',
      JSON.stringify({ state, version: 1 }),
    )
  }

  await page.addInitScript(persistProject, [projectId, LAB_COMPANY_ID])
  await page.evaluate(persistProject, [projectId, LAB_COMPANY_ID])
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
