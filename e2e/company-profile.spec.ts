import { test, expect } from '@playwright/test'
import { login, selectEngagement } from './helpers'

test.describe('Company Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await login(page)
    await selectEngagement(page)
    await page.goto('/company-profile', { waitUntil: 'domcontentloaded' })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /Perfil de Empresa/i })).toBeVisible({ timeout: 15_000 })
  })

  test('la vista carga sin crash', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await page.goto('/company-profile')
    await expect(page).not.toHaveURL(/login/)

    const crashErrors = jsErrors.filter((error) =>
      error.includes('Cannot read') || error.includes('is not a function'),
    )
    expect(crashErrors).toHaveLength(0)
  })

  test('muestra los tabs actuales de Perfil Empresa', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Empresa$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Organizaci.n$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Planes$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Proyectos$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Proyecto$/i })).toHaveCount(0)
  })

  test('tab Empresa muestra campos y guardado para consultant', async ({ page }) => {
    await page.getByRole('button', { name: /^Empresa$/i }).click()

    await expect(page.getByText(/Datos de la empresa/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: /guardar empresa/i })).toBeVisible({ timeout: 10_000 })
  })

  test('tabs Organizacion, Planes y Proyectos son accesibles', async ({ page }) => {
    await page.getByRole('button', { name: /^Organizaci.n$/i }).click()
    await expect(page.getByText(/Departamentos/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Personas', { exact: true })).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: /^Planes$/i }).click()
    await expect(page.getByText(/Planes contratados/i)).toBeVisible({ timeout: 5_000 })

    await page.getByRole('button', { name: /^Proyectos$/i }).click()
    await expect(page.getByText(/Proyectos de la empresa/i)).toBeVisible({ timeout: 5_000 })
  })
})
