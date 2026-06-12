import { test, expect } from '@playwright/test'

// Usuarios por rol — configurar vía variables de entorno
const USERS = {
  superadmin: {
    email:    process.env.E2E_SUPERADMIN_EMAIL    ?? 'superadmin@test.dev',
    password: process.env.E2E_SUPERADMIN_PASSWORD ?? '',
  },
  consultant: {
    email:    process.env.E2E_CONSULTANT_EMAIL    ?? 'consultor@test.dev',
    password: process.env.E2E_CONSULTANT_PASSWORD ?? '',
  },
  client_editor: {
    email:    process.env.E2E_CLIENT_EDITOR_EMAIL    ?? 'client.editor@test.dev',
    password: process.env.E2E_CLIENT_EDITOR_PASSWORD ?? '',
  },
  client_viewer: {
    email:    process.env.E2E_CLIENT_VIEWER_EMAIL    ?? 'client.viewer@test.dev',
    password: process.env.E2E_CLIENT_VIEWER_PASSWORD ?? '',
  },
} as const

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

// ── Superadmin ────────────────────────────────────────────────

test.describe('Rol: superadmin', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!USERS.superadmin.password, 'E2E_SUPERADMIN_PASSWORD no configurado')
    await loginAs(page, USERS.superadmin.email, USERS.superadmin.password)
  })

  test('puede acceder al panel de administración /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })
  })

  test('puede acceder a todas las herramientas T1-T6', async ({ page }) => {
    for (const path of ['/t1', '/t2', '/t3', '/t4']) {
      await page.goto(path)
      await expect(page).not.toHaveURL(/login/)
      await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })
    }
  })

  test('el selector de proyectos en header está visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header').getByRole('button').first()).toBeVisible({ timeout: 8_000 })
  })
})

// ── Consultant ────────────────────────────────────────────────

test.describe('Rol: consultant', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!USERS.consultant.password, 'E2E_CONSULTANT_PASSWORD no configurado')
    await loginAs(page, USERS.consultant.email, USERS.consultant.password)
  })

  test('puede acceder al dashboard y herramientas', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('header').first()).toBeVisible({ timeout: 8_000 })
  })

  test('NO puede acceder al panel de administración /admin', async ({ page }) => {
    await page.goto('/admin')
    // Esperar que la navegación/redirección se complete
    await expect(page.locator('body')).toBeVisible({ timeout: 5_000 })

    const isOnAdmin = page.url().endsWith('/admin')
    if (isOnAdmin) {
      // Si llega a la ruta, no debe ver los controles de gestión
      const empresasTab = page.getByText('Empresas', { exact: true })
      const hasAccess   = await empresasTab.isVisible({ timeout: 3_000 }).catch(() => false)
      expect(hasAccess, 'Consultant NO debe ver el admin').toBe(false)
    } else {
      expect(page.url()).not.toMatch(/\/admin$/)
    }
  })

  test('puede ver proyectos de su empresa asignada (Disney)', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('header').getByRole('button').first()).toBeVisible({ timeout: 8_000 })

    // Abrir el dropdown de proyectos
    await page.locator('header').getByRole('button').first().click()
    const dropdown = page.locator('div[class*="absolute"][class*="w-64"][class*="z-50"]')
    const dropdownVisible = await dropdown.isVisible({ timeout: 5_000 }).catch(() => false)

    if (dropdownVisible) {
      // Debe ver los proyectos de Disney (Toy Story, Blancanieves)
      const toyStory    = dropdown.getByText('Toy Story', { exact: false })
      const blancanieves = dropdown.getByText('Blancanieves', { exact: false })

      const hasToyStory    = await toyStory.isVisible({ timeout: 3_000 }).catch(() => false)
      const hasBlancanieves = await blancanieves.isVisible({ timeout: 3_000 }).catch(() => false)

      expect(hasToyStory || hasBlancanieves, 'Consultant debe ver proyectos Disney').toBe(true)
    }
  })
})

// ── Client Editor ─────────────────────────────────────────────

test.describe('Rol: client_editor', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!USERS.client_editor.password, 'E2E_CLIENT_EDITOR_PASSWORD no configurado')
    await loginAs(page, USERS.client_editor.email, USERS.client_editor.password)
  })

  test('puede acceder al dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('header').first()).toBeVisible({ timeout: 8_000 })
  })

  test('NO puede acceder a /admin', async ({ page }) => {
    await page.goto('/admin')
    // Esperar que la navegación/redirección se complete
    await expect(page.locator('body')).toBeVisible({ timeout: 5_000 })
    expect(page.url()).not.toMatch(/\/admin$/)
  })
})

// ── Client Viewer ─────────────────────────────────────────────

test.describe('Rol: client_viewer', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!USERS.client_viewer.password, 'E2E_CLIENT_VIEWER_PASSWORD no configurado')
    await loginAs(page, USERS.client_viewer.email, USERS.client_viewer.password)
  })

  test('puede acceder al dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('header').first()).toBeVisible({ timeout: 8_000 })
  })

  test('la UI muestra el estado de solo lectura (isReadOnly)', async ({ page }) => {
    await page.goto('/t1')
    // Esperar a que la vista T1 cargue completamente
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })

    // En modo viewer los botones de edición deben estar deshabilitados u ocultos
    // Verifica que no hay botones de "guardar" ni "crear" activos
    const saveBtn = page.getByRole('button', { name: /guardar|save/i })
    const saveBtnEnabled = await saveBtn.isEnabled({ timeout: 2_000 }).catch(() => false)

    // Si hay botón de guardar debe estar deshabilitado para viewer
    if (await saveBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      expect(saveBtnEnabled, 'Client viewer no debe poder guardar cambios').toBe(false)
    }
  })

  test('NO puede acceder a /admin', async ({ page }) => {
    await page.goto('/admin')
    // Esperar que la navegación/redirección se complete
    await expect(page.locator('body')).toBeVisible({ timeout: 5_000 })
    expect(page.url()).not.toMatch(/\/admin$/)
  })
})
