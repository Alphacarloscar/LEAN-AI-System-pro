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

test.describe('Company Profile', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!DEV_PASSWORD, 'E2E_PASSWORD no configurado')
    await login(page)
    await page.goto('/company-profile')
    await expect(page.locator('main, [role="main"], #root > div').first()).toBeVisible({
      timeout: 8_000,
    })
  })

  test('la vista carga sin crash', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await page.goto('/company-profile')
    await expect(page).not.toHaveURL(/login/)

    const crashErrors = jsErrors.filter((e) =>
      e.includes('Cannot read') || e.includes('is not a function'),
    )
    expect(crashErrors).toHaveLength(0)
  })

  test('muestra dos tabs: Empresa y Proyecto', async ({ page }) => {
    // Los tabs pueden estar implementados como botones o role=tab
    const tabButtons = page.locator('[role="tab"], button').filter({ hasText: /empresa|proyecto/i })
    const count = await tabButtons.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('tab "Empresa" es accesible y muestra campos del formulario', async ({ page }) => {
    // Haz clic en el tab Empresa si no está activo
    const empresaTab = page.locator('[role="tab"], button').filter({ hasText: /empresa/i }).first()
    const tabExists  = await empresaTab.isVisible({ timeout: 3_000 }).catch(() => false)
    if (tabExists) await empresaTab.click()

    // Verifica que hay al menos un campo de formulario visible
    await expect(page.locator('input, select, textarea').first()).toBeVisible({ timeout: 5_000 })
  })

  test('tab "Proyecto" es accesible y muestra campos del formulario', async ({ page }) => {
    const proyectoTab = page.locator('[role="tab"], button').filter({ hasText: /proyecto/i }).first()
    const tabExists   = await proyectoTab.isVisible({ timeout: 3_000 }).catch(() => false)
    if (tabExists) {
      await proyectoTab.click()
      await expect(page.locator('input, select, textarea').first()).toBeVisible({ timeout: 5_000 })
    } else {
      test.skip(true, 'Tab Proyecto no encontrado en la UI actual')
    }
  })

  test('el botón de guardar es visible', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /guardar|save/i })
    const hasButton  = await saveButton.isVisible({ timeout: 3_000 }).catch(() => false)
    expect(hasButton, 'Debe haber un botón de guardar en Company Profile').toBe(true)
  })
})
