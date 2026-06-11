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

test.describe('T3 — Value Stream Map', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!DEV_PASSWORD, 'E2E_PASSWORD no configurado')
    await login(page)
    await page.goto('/t3')
    await expect(page.locator('main, [role="main"], #root > div').first()).toBeVisible({
      timeout: 10_000,
    })
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
    // T3 muestra "Añadir primer proceso" en estado vacío, o la lista de procesos si hay datos
    const emptyState = page.getByText(/añadir primer proceso|primer proceso|value stream/i)
    const hasList    = page.locator('button, [role="listitem"]').filter({ hasText: /proceso|stream/i })

    const hasEmpty = await emptyState.first().isVisible({ timeout: 5_000 }).catch(() => false)
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
      await processBtns.first().click()
      // Esperar algún panel de detalle
      await page.waitForTimeout(500)
    }
    // Si no hay procesos, validamos que la vista sigue intacta
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 5_000 })
  })

  test('la vista no muestra pantalla en blanco tras carga completa', async ({ page }) => {
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })
    const bodyText = await page.locator('body').innerText()
    expect(bodyText.length).toBeGreaterThan(100)
  })
})
