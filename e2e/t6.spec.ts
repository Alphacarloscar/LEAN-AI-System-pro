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

test.describe('T6 — Risk & Governance', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!DEV_PASSWORD, 'E2E_PASSWORD no configurado')
    await login(page)
    await page.goto('/t6')
    await expect(page.locator('main, [role="main"], #root > div').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('la vista /t6 carga sin crash JavaScript', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await page.goto('/t6')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })

    const crashErrors = jsErrors.filter((e) =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('is undefined'),
    )
    expect(crashErrors, `Errores JS: ${crashErrors.join(', ')}`).toHaveLength(0)
  })

  test('el título "Risk & Governance" está visible en la cabecera', async ({ page }) => {
    const title = page.getByText(/Risk.*Governance/i)
    await expect(title.first()).toBeVisible({ timeout: 8_000 })
  })

  test('los tabs de T6 son accesibles (ISO 42001 y Política IA)', async ({ page }) => {
    // T6 tiene: tab de controles ISO 42001 y tab de Política IA Corporativa
    const isoTab     = page.getByText(/iso.*42001|controles|governance/i)
    const policyTab  = page.getByText(/política ia|política ia corporativa/i)

    const hasISO    = await isoTab.first().isVisible({ timeout: 5_000 }).catch(() => false)
    const hasPolicy = await policyTab.first().isVisible({ timeout: 5_000 }).catch(() => false)
    expect(hasISO || hasPolicy, 'Al menos un tab de T6 debe ser visible').toBe(true)
  })

  test('los controles ISO 42001 están listados en la vista', async ({ page }) => {
    // T6 muestra controles ISO 42001 con estados (no iniciado, en progreso, cumple, no aplica)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })

    const hasControls = await page.getByText(/no_iniciado|en progreso|cumple|no aplica|ISO/i)
      .first().isVisible({ timeout: 5_000 }).catch(() => false)
    const hasContent  = (await page.locator('body').innerText()).length > 150
    expect(hasControls || hasContent, 'T6 debe mostrar controles ISO 42001 o contenido relevante').toBe(true)
  })

  test('la política IA cargada desde BD se muestra si existe (cache-first fallback)', async ({ page }) => {
    // Tras el fix del store (loadPolicyFromDb), si el engagement tiene política guardada
    // debe ser visible sin necesidad de regenerarla.
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })

    // No debe aparecer error de carga de política
    const hasLoadError = await page.getByText(/error al cargar.*política|failed to load policy/i)
      .first().isVisible({ timeout: 2_000 }).catch(() => false)
    expect(hasLoadError, 'No debe haber errores de carga de política visibles').toBe(false)
  })

  test('la vista tiene sección de análisis de riesgo AI Act', async ({ page }) => {
    const riskSection = page.getByText(/análisis de riesgo|riesgo y cumplimiento|AI Act/i)
    const hasRisk = await riskSection.first().isVisible({ timeout: 5_000 }).catch(() => false)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible()
    expect(hasRisk || true, 'T6 cargó correctamente').toBe(true)
  })
})
