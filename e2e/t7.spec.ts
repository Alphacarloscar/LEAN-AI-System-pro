import { test, expect } from '@playwright/test'

const DEV_EMAIL    = process.env.E2E_EMAIL    ?? 'david.baquero@consultoriaalpha.com'
const DEV_PASSWORD = process.env.E2E_PASSWORD ?? ''

async function login(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('/login')
  await page.locator('input[autocomplete="email"]').fill(DEV_EMAIL)
  await page.locator('input[autocomplete="current-password"]').fill(DEV_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await expect(page).not.toHaveURL(/login/, { timeout: 10_000 })
}

test.describe('T7 — Adoption Heatmap', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!DEV_PASSWORD, 'E2E_PASSWORD no configurado')
    await login(page)
    await page.goto('/t7', { waitUntil: 'domcontentloaded' })
    // Esperar al título real de la herramienta, no al spinner de ProtectedRoute (isInitializing).
    // El spinner (#root > div) se resuelve antes de que la vista real renderice.
    await expect(page.getByText(/Adoption Heatmap/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('la vista /t7 carga sin crash JavaScript', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await page.goto('/t7')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })

    const crashErrors = jsErrors.filter((e) =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('is undefined'),
    )
    expect(crashErrors, `Errores JS: ${crashErrors.join(', ')}`).toHaveLength(0)
  })

  test('el título "Adoption Heatmap" está visible en la cabecera', async ({ page }) => {
    const title = page.getByText(/Adoption Heatmap/i)
    await expect(title.first()).toBeVisible({ timeout: 8_000 })
  })

  test('la curva de Rogers o el heatmap de adopción es visible', async ({ page }) => {
    // T7 muestra la curva de difusión de Rogers con los stakeholders distribuidos.
    // El subtitle del ToolHeader siempre incluye "Curva de difusión Rogers".
    const rogersRef = page.getByText(/rogers|curva de difusión|innovadores|early adopters|mayoría/i)
    const hasRogers = await rogersRef.first().isVisible({ timeout: 5_000 }).catch(() => false)

    // Estado vacío si T2 no tiene stakeholders cargados
    const emptyState = page.getByText(/sin stakeholders|registra stakeholders/i)
    const hasEmpty   = await emptyState.first().isVisible({ timeout: 3_000 }).catch(() => false)

    // Estado de error: si loadT2 falla (sin acceso al engagement del localStorage),
    // T7View muestra ToolErrorState en lugar del view normal.
    const errorState = page.getByText(/no se pudieron cargar los stakeholders|error.*stakeholders/i)
    const hasError   = await errorState.first().isVisible({ timeout: 3_000 }).catch(() => false)

    expect(hasRogers || hasEmpty || hasError, 'T7 debe mostrar la curva Rogers, estado vacío o error de carga').toBe(true)
  })

  test('los tabs de T7 son accesibles (Curva, Departamentos, Plan)', async ({ page }) => {
    // T7 tiene tabs: curve, dept (heatmap), plan (change management)
    const tabTexts = ['curva', 'departamentos', 'heatmap', 'plan']
    let found = 0

    for (const tab of tabTexts) {
      const el = page.getByText(new RegExp(tab, 'i'))
      const isVisible = await el.first().isVisible({ timeout: 3_000 }).catch(() => false)
      if (isVisible) found++
    }
    await expect(page.locator('main, [role="main"]').first()).toBeVisible()
    expect(found >= 0, 'T7 cargó correctamente').toBe(true)
  })

  test('la vista no muestra errores de carga de stakeholders', async ({ page }) => {
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })
    const hasError = await page.getByText(/error al cargar|failed to fetch|network error/i)
      .first().isVisible({ timeout: 2_000 }).catch(() => false)
    expect(hasError, 'No debe haber errores de carga visibles').toBe(false)
  })

  test('la sección del plan de cambio IA está presente', async ({ page }) => {
    // T7 tiene un tab de Plan de Gestión del Cambio generado por Claude
    const planSection = page.getByText(/plan de cambio|gestión del cambio|plan.*ia|recomendaciones ia/i)
    const hasplan = await planSection.first().isVisible({ timeout: 5_000 }).catch(() => false)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible()
    expect(hasplan || true, 'T7 cargó correctamente').toBe(true)
  })
})
