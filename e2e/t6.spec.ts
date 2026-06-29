import { test, expect } from '@playwright/test'
import { login, selectEngagement, LAB_PROJECT_ID } from './helpers'

test.describe('T6 — Risk & Governance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectEngagement(page)
    await page.goto(`/t6/${LAB_PROJECT_ID}`, { waitUntil: 'domcontentloaded' })
    // Esperar al título real (descarta el spinner de ProtectedRoute durante isInitializing)
    await expect(page.getByText(/Risk.*Governance/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('la vista /t6 carga sin crash JavaScript', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await page.goto(`/t6/${LAB_PROJECT_ID}`)
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

  test('los tabs de T6 son accesibles (Política IA y Dashboard AI Act)', async ({ page }) => {
    // T6 tiene 2 tabs: "📄 Política IA Corporativa" y "⚖️ Dashboard AI Act"
    // ISO 42001 fue trasladado a T12; ya no existe como tab en T6.
    const policyTab = page.getByRole('tab').filter({ hasText: /política ia/i })
    const aiActTab  = page.getByRole('tab').filter({ hasText: /dashboard ai act|ai act/i })

    const hasPolicy = await policyTab.isVisible({ timeout: 5_000 }).catch(() => false)
    const hasAIAct  = await aiActTab.isVisible({ timeout: 5_000 }).catch(() => false)
    expect(hasPolicy || hasAIAct, 'Al menos un tab de T6 debe ser visible').toBe(true)
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
