import { test, expect, type Page } from '@playwright/test'
import { LAB_COMPANY_ID, LAB_PROJECT_ID, LAB_SECOND_PROJECT_ID, USERS } from './helpers'

const SUPERADMIN_EMAIL = process.env.E2E_SUPERADMIN_EMAIL ?? USERS.superadmin.email
const SUPERADMIN_PASSWORD = process.env.E2E_SUPERADMIN_PASSWORD ?? ''

const ROLE_FIXTURES = {
  consultant: {
    email: process.env.E2E_CONSULTANT_EMAIL ?? USERS.consultor.email,
    password: process.env.E2E_CONSULTANT_PASSWORD ?? '',
  },
  client_editor: {
    email: process.env.E2E_CLIENT_EDITOR_EMAIL ?? USERS.editor.email,
    password: process.env.E2E_CLIENT_EDITOR_PASSWORD ?? '',
  },
  client_viewer: {
    email: process.env.E2E_CLIENT_VIEWER_EMAIL ?? USERS.viewer.email,
    password: process.env.E2E_CLIENT_VIEWER_PASSWORD ?? '',
  },
} as const

const ADMIN_SUBROUTES = [
  '/admin',
  '/admin/companies',
  '/admin/users',
  '/admin/projects',
  `/admin/companies/${LAB_COMPANY_ID}`,
  `/admin/companies/${LAB_COMPANY_ID}/projects/${LAB_PROJECT_ID}`,
] as const

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[autocomplete="email"]').fill(email)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 10_000 })
}

async function openSidebar(page: Page) {
  await page.locator('button[aria-label*="Abrir"], button[aria-expanded="false"]').first().click()
}

async function expectAdminDenied(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('body')).toBeVisible({ timeout: 5_000 })
  await expect(page).toHaveURL(/\/evaluation/, { timeout: 8_000 })
  await expect(page).not.toHaveURL(/\/admin/)
}

test.describe('Admin Panel - acceso superadmin', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!SUPERADMIN_PASSWORD, 'E2E_SUPERADMIN_PASSWORD no configurado')
    await loginAs(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD)
  })

  for (const path of ADMIN_SUBROUTES) {
    test(`superadmin puede abrir ${path}`, async ({ page }) => {
      const jsErrors: string[] = []
      page.on('pageerror', (err) => jsErrors.push(err.message))

      await page.goto(path)
      await expect(page).not.toHaveURL(/\/login/)
      await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 12_000 })

      const crashErrors = jsErrors.filter((message) =>
        message.includes('Cannot read') ||
        message.includes('is not a function') ||
        message.includes('is undefined'),
      )
      expect(crashErrors, `Errores JS en ${path}: ${crashErrors.join(', ')}`).toHaveLength(0)
    })
  }

  test('detalle de proyecto muestra el nombre real de empresa en breadcrumb', async ({ page }) => {
    await page.goto(`/admin/companies/${LAB_COMPANY_ID}/projects/${LAB_PROJECT_ID}`)

    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i })
    await expect(breadcrumb).toContainText(/Administraci.n/)
    await expect(breadcrumb).toContainText('Empresas')
    await expect(breadcrumb.getByRole('link', { name: 'DISNEY' })).toHaveAttribute(
      'href',
      `/admin/companies/${LAB_COMPANY_ID}`,
    )
    await expect(breadcrumb).toContainText('Toy Story')
    await expect(breadcrumb.getByRole('link', { name: /^Empresa$/ })).toHaveCount(0)
  })

  test('bloquea detalle de proyecto cuando projectId pertenece a otra empresa', async ({ page }) => {
    await page.goto(`/admin/companies/${LAB_COMPANY_ID}/projects/${LAB_SECOND_PROJECT_ID}`)

    await expect(page.getByText(/no pertenece a la empresa/i)).toBeVisible({ timeout: 12_000 })
    await expect(page.getByRole('button', { name: /agregar miembro/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /editar configuraci/i })).toHaveCount(0)
    await expect(page.getByText('Road Runner')).toHaveCount(0)
    await expect(page.getByText('consultant@test.dev')).toHaveCount(0)
  })

  test('superadmin ve el botón Administración en el sidebar y navega a /admin', async ({ page }) => {
    await page.goto('/evaluation')
    await openSidebar(page)

    const adminButton = page.getByRole('button', { name: /administraci/i }).first()
    await expect(adminButton).toBeVisible({ timeout: 5_000 })

    await adminButton.click()
    await expect(page).toHaveURL(/\/admin$/, { timeout: 5_000 })
  })
})

test.describe('Admin Panel - acceso denegado a roles no-superadmin', () => {
  for (const [role, credentials] of Object.entries(ROLE_FIXTURES)) {
    test.describe(role, () => {
      test.beforeEach(async ({ page }) => {
        test.skip(!credentials.password, `Password E2E no configurado para ${role}`)
        await loginAs(page, credentials.email, credentials.password)
      })

      test('no ve el botón Administración en el sidebar', async ({ page }) => {
        await page.goto('/evaluation')
        await openSidebar(page)

        await expect(page.getByRole('button', { name: /administraci/i })).toHaveCount(0)
      })

      test('no puede abrir directamente ninguna subruta /admin/**', async ({ page }) => {
        for (const path of ADMIN_SUBROUTES) {
          await expectAdminDenied(page, path)
        }
      })
    })
  }
})
