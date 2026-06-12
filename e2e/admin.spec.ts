import { test, expect } from '@playwright/test'

// Usuario superadmin (necesario para acceder al panel de admin)
const SUPERADMIN_EMAIL    = process.env.E2E_SUPERADMIN_EMAIL    ?? 'superadmin@test.dev'
const SUPERADMIN_PASSWORD = process.env.E2E_SUPERADMIN_PASSWORD ?? ''

// Usuario con rol no-admin para probar que NO puede acceder
const REGULAR_EMAIL    = process.env.E2E_EMAIL    ?? 'david.baquero@consultoriaalpha.com'
const REGULAR_PASSWORD = process.env.E2E_PASSWORD ?? ''

async function loginAs(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  email: string,
  password: string,
) {
  await page.goto('/login')
  await page.locator('input[autocomplete="email"]').fill(email)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).not.toHaveURL(/login/, { timeout: 10_000 })
}

test.describe('Admin Panel — acceso superadmin', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!SUPERADMIN_PASSWORD, 'E2E_SUPERADMIN_PASSWORD no configurado')
    await loginAs(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD)
  })

  test('la vista /admin carga sin crash', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await page.goto('/admin')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })

    const crashErrors = jsErrors.filter((e) =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('is undefined'),
    )
    expect(crashErrors, `Errores JS en /admin: ${crashErrors.join(', ')}`).toHaveLength(0)
  })

  test('muestra los 3 tabs: Empresas, Usuarios, Proyectos', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })

    const tabLabels = ['Empresas', 'Usuarios', 'Proyectos']
    for (const label of tabLabels) {
      const tab = page.getByText(label, { exact: false }).first()
      await expect(tab).toBeVisible({ timeout: 5_000 })
    }
  })

  test('tab Empresas muestra al menos una empresa', async ({ page }) => {
    await page.goto('/admin')
    // Esperar a que el panel cargue completamente (AdminLoadingScreen → contenido real)
    await expect(page.getByText('Panel de administración')).toBeVisible({ timeout: 12_000 })

    const empresasTab = page.getByRole('tab', { name: /empresas/i })
      .or(page.locator('button').filter({ hasText: /empresas/i }).first())
    const tabExists = await empresasTab.isVisible({ timeout: 3_000 }).catch(() => false)
    if (tabExists) await empresasTab.click()

    // Esperar heading "Empresas registradas" y verificar que la lista no está vacía
    await expect(page.getByText(/empresas registradas/i).first()).toBeVisible({ timeout: 8_000 })
    const isEmpty = await page.getByText('Sin empresas todavía.').isVisible({ timeout: 1_000 }).catch(() => false)
    expect(isEmpty, 'Debe haber al menos una empresa en la lista').toBe(false)
  })

  test('tab Usuarios muestra al menos un usuario', async ({ page }) => {
    await page.goto('/admin')
    // Los tabs solo aparecen tras cargar datos (AdminLoadingScreen no los tiene)
    const usuariosTabBtn = page.locator('button').filter({ hasText: /^Usuarios$/ })
    await expect(usuariosTabBtn.first()).toBeVisible({ timeout: 15_000 })
    await usuariosTabBtn.first().click()

    // UsersTab usa divs, no <table>. Esperar heading y verificar lista no vacía
    await expect(page.getByText(/usuarios registrados/i).first()).toBeVisible({ timeout: 8_000 })
    const isEmpty = await page.getByText('Sin usuarios registrados.').isVisible({ timeout: 1_000 }).catch(() => false)
    expect(isEmpty, 'Debe haber al menos un usuario en la lista').toBe(false)
  })

  test('el botón de crear empresa está visible', async ({ page }) => {
    await page.goto('/admin')
    // Esperar que carguen los tabs reales (la pantalla de carga no los incluye)
    await expect(page.locator('button').filter({ hasText: /^Empresas$/ }).first()).toBeVisible({ timeout: 15_000 })

    // Por defecto se muestra el tab Empresas con el formulario de creación
    const createBtn = page.getByRole('button', { name: /^Crear$/ })
    const hasBtn = await createBtn.first().isVisible({ timeout: 8_000 }).catch(() => false)
    expect(hasBtn, 'Debe haber un botón para crear empresa').toBe(true)
  })

  test('el botón de invitar usuario está visible', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })

    const inviteBtn = page.getByRole('button', {
      name: /invitar|nuevo usuario|invite user|\+/i,
    })
    const hasBtn = await inviteBtn.isVisible({ timeout: 5_000 }).catch(() => false)
    // El botón puede estar en el tab de usuarios — intentar navegar a él
    if (!hasBtn) {
      const usuariosTab = page.locator('button').filter({ hasText: /usuarios/i }).first()
      const tabExists = await usuariosTab.isVisible({ timeout: 2_000 }).catch(() => false)
      if (tabExists) {
        await usuariosTab.click()
        const inviteBtnAfterNav = page.getByRole('button', { name: /invitar|enviar|invite|\+/i })
        const hasBtnAfter = await inviteBtnAfterNav.isVisible({ timeout: 3_000 }).catch(() => false)
        expect(hasBtnAfter, 'Debe haber un botón de invitar usuario').toBe(true)
      }
    }
  })
})

test.describe('Admin Panel — acceso denegado a roles no-superadmin', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!REGULAR_PASSWORD, 'E2E_PASSWORD no configurado')
    await loginAs(page, REGULAR_EMAIL, REGULAR_PASSWORD)
  })

  test('usuario no-superadmin no puede ver /admin (redirige o muestra 403)', async ({ page }) => {
    await page.goto('/admin')
    // Esperar que la navegación se complete (redirige o carga vacío)
    await expect(page.locator('body')).toBeVisible({ timeout: 5_000 })

    // Debe redirigir al home o mostrar un estado vacío/error
    const isOnAdmin = page.url().endsWith('/admin')
    if (isOnAdmin) {
      // Si llega a /admin, no debe ver los tabs de gestión
      const empresasTab = page.getByText('Empresas', { exact: true })
      const hasAccess = await empresasTab.isVisible({ timeout: 3_000 }).catch(() => false)
      expect(hasAccess, 'Un usuario no-superadmin NO debe ver los tabs del admin').toBe(false)
    } else {
      // Fue redirigido — correcto
      expect(page.url()).not.toMatch(/\/admin$/)
    }
  })
})
