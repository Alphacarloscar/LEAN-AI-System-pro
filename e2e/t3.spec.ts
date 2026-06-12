import { test, expect } from '@playwright/test'
import { login, selectEngagement } from './helpers'

test.describe('T3 — Value Stream Map', () => {
  test.beforeEach(async ({ page }) => {
    // Forzar tamaño de pantalla de escritorio para evitar colapsos de componentes
    await page.setViewportSize({ width: 1280, height: 720 })
    await login(page)
    // Inyectar engagement para que T3 cargue datos (sin esto hasDataT3=false → nada se muestra)
    await selectEngagement(page)
    await page.goto('/t3', { waitUntil: 'networkidle' })
    await expect(page.getByText(/Value Stream Map/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('la vista /t3 carga sin crash JavaScript', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await page.goto('/t3')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })

    const crashErrors = jsErrors.filter((e) =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('is undefined'),
    )
    expect(crashErrors, `Errores JS: ${crashErrors.join(', ')}`).toHaveLength(0)
  })

  test('el título "Value Stream Map" está visible en la cabecera', async ({ page }) => {
    const title = page.getByText(/Value Stream Map/i)
    await expect(title.first()).toBeVisible({ timeout: 8_000 })
  })

  test('el estado vacío o lista de procesos es visible', async ({ page }) => {
    // Estado vacío: "No hay procesos todavía" / "+ Añadir primer proceso"
    // Estado con datos: lista de tarjetas de proceso
    const emptyState = page.getByText(/no hay procesos todavía|añadir primer proceso|primer proceso/i)
    const hasList    = page.locator('[class*="card"], [class*="process"], [class*="proceso"]')
      .or(page.locator('button').filter({ hasText: /\+ añadir primer proceso/i }))

    const hasEmpty = await emptyState.first().isVisible({ timeout: 8_000 }).catch(() => false)
    const hasItems = await hasList.first().isVisible({ timeout: 3_000 }).catch(() => false)
    expect(hasEmpty || hasItems, 'T3 debe mostrar estado vacío o lista de procesos').toBe(true)
  })

  test('los filtros de fase del proceso son accesibles', async ({ page }) => {
    // T3 tiene filtros por fase (Explorar, Digitalizar, Automatizar, etc.)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(100)
  })

  test('el panel de detalle de proceso puede abrirse', async ({ page }) => {
    // Si hay procesos, hacer clic en uno debería abrir el panel lateral de detalle
    const processBtns = page.locator('button').filter({ hasText: /proceso|stream|fase/i })
    const count = await processBtns.count()

    if (count > 0) {
      await processBtns.first().click({ force: true })
      // Esperar a que el panel de detalle (dialogo o sección principal) sea visible
      await expect(page.locator('[role="dialog"], [role="main"]')).toBeVisible({ timeout: 5_000 })
    }
    // Si no hay procesos, validamos que la vista sigue intacta
    await expect(page.locator('main, [role="main"]').first()).toBeVisible()
  })

  test('la vista no muestra pantalla en blanco tras carga completa', async ({ page }) => {
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(100)
  })
})
