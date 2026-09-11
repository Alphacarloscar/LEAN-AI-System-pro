import { test, expect, type Page } from '@playwright/test'
import { LAB_COMPANY_ID, LAB_PROJECT_ID, selectEngagement, USERS as HELPER_USERS } from './helpers'

const USERS = {
  superadmin: { email: HELPER_USERS.superadmin.email, password: HELPER_USERS.superadmin.password },
  consultant: { email: HELPER_USERS.consultor.email, password: HELPER_USERS.consultor.password },
  client_editor: { email: HELPER_USERS.editor.email, password: HELPER_USERS.editor.password },
  client_viewer: { email: HELPER_USERS.viewer.email, password: HELPER_USERS.viewer.password },
}

const ADMIN_ROUTES_UNDER_GUARD = [
  '/admin',
  '/admin/companies',
  '/admin/users',
  '/admin/projects',
  `/admin/companies/${LAB_COMPANY_ID}`,
  `/admin/companies/${LAB_COMPANY_ID}/projects/${LAB_PROJECT_ID}`,
  '/admin/users/user-1',
] as const

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[autocomplete="email"]').fill(email)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
}

async function expectAdminRouteAllowed(page: Page, path: string) {
  await page.goto(path)
  await expect(page).not.toHaveURL(/\/login/)
  await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 8_000 })
}

async function expectAdminRouteDenied(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('body')).toBeVisible({ timeout: 5_000 })
  await expect(page).toHaveURL(/\/evaluation/, { timeout: 8_000 })
  await expect(page).not.toHaveURL(/\/admin/)
}

async function openCompanyProfile(page: Page) {
  await selectEngagement(page)
  await page.goto('/company-profile', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: /Perfil de Empresa/i })).toBeVisible({ timeout: 15_000 })
}

test.describe('Rol: superadmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.superadmin.email, USERS.superadmin.password)
  })

  test('puede acceder al panel de administracion y subrutas admin reales', async ({ page }) => {
    for (const path of ADMIN_ROUTES_UNDER_GUARD.slice(0, 6)) {
      await expectAdminRouteAllowed(page, path)
    }
  })

  test('puede acceder al dashboard funcional', async ({ page }) => {
    await page.goto('/evaluation')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('header').first()).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Rol: consultant', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.consultant.email, USERS.consultant.password)
  })

  test('puede acceder al dashboard funcional', async ({ page }) => {
    await page.goto('/evaluation')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('header').first()).toBeVisible({ timeout: 8_000 })
  })

  test('NO puede acceder a /admin ni a sus subrutas', async ({ page }) => {
    for (const path of ADMIN_ROUTES_UNDER_GUARD) {
      await expectAdminRouteDenied(page, path)
    }
  })

  test('abre el selector de proyectos con proyectos asignados o empty-state explícito', async ({ page }) => {
    await page.goto('/evaluation')
    const projectSelector = page.getByRole('button', { name: /selector de proyecto/i })
    await expect(projectSelector).toBeVisible({ timeout: 8_000 })

    await projectSelector.click()
    const dropdown = page.locator('div[class*="absolute"][class*="w-64"][class*="z-50"]')
    await expect(dropdown).toBeVisible({ timeout: 5_000 })

    const toyStory = dropdown.getByText('Toy Story', { exact: false })
    const blancanieves = dropdown.getByText('Blancanieves', { exact: false })
    const hasExpectedProject =
      await toyStory.isVisible({ timeout: 3_000 }).catch(() => false) ||
      await blancanieves.isVisible({ timeout: 3_000 }).catch(() => false)
    const hasEmptyState = await dropdown
      .getByText(/sin proyectos disponibles/i)
      .isVisible({ timeout: 1_000 })
      .catch(() => false)

    expect(
      hasExpectedProject || hasEmptyState,
      'El selector debe mostrar proyectos asignados o el empty-state explicito',
    ).toBe(true)
  })
})

test.describe('Rol: client_editor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.client_editor.email, USERS.client_editor.password)
  })

  test('puede acceder al dashboard funcional', async ({ page }) => {
    await page.goto('/evaluation')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('header').first()).toBeVisible({ timeout: 8_000 })
  })

  test('NO puede acceder a /admin ni a sus subrutas', async ({ page }) => {
    for (const path of ADMIN_ROUTES_UNDER_GUARD) {
      await expectAdminRouteDenied(page, path)
    }
  })

  test('no ve acciones contractuales en Perfil Empresa', async ({ page }) => {
    await openCompanyProfile(page)

    await page.getByRole('button', { name: /^Planes$/i }).click()
    await expect(page.getByRole('button', { name: /guardar planes/i })).toHaveCount(0)
  })
})

test.describe('Rol: client_viewer', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.client_viewer.email, USERS.client_viewer.password)
  })

  test('puede acceder al dashboard funcional', async ({ page }) => {
    await page.goto('/evaluation')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('header').first()).toBeVisible({ timeout: 8_000 })
  })

  test('la UI mantiene el estado de solo lectura', async ({ page }) => {
    await openCompanyProfile(page)

    await expect(page.getByRole('button', { name: /guardar empresa/i })).toHaveCount(0)
    await page.getByRole('button', { name: /^Proyectos$/i }).click()
    await expect(page.getByRole('button', { name: /crear proyecto/i })).toHaveCount(0)
  })

  test('NO puede acceder a /admin ni a sus subrutas', async ({ page }) => {
    for (const path of ADMIN_ROUTES_UNDER_GUARD) {
      await expectAdminRouteDenied(page, path)
    }
  })

  test('no ve acciones editables en Perfil Empresa', async ({ page }) => {
    await openCompanyProfile(page)

    await expect(page.getByRole('button', { name: /guardar empresa/i })).toHaveCount(0)

    await page.getByRole('button', { name: /^Proyectos$/i }).click()
    await expect(page.getByRole('button', { name: /crear proyecto/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^editar$/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^eliminar$/i })).toHaveCount(0)
  })
})
