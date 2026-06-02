import { test, expect } from '@playwright/test'

const DEV_EMAIL    = process.env.E2E_EMAIL    ?? 'david.baquero@consultoriaalpha.com'
const DEV_PASSWORD = process.env.E2E_PASSWORD ?? ''

// Helper: hace login y espera a estar en la app
async function login(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(DEV_EMAIL)
  await page.getByLabel(/contraseña|password/i).fill(DEV_PASSWORD)
  await page.getByRole('button', { name: /entrar|login|iniciar/i }).click()
  await expect(page).not.toHaveURL(/login/, { timeout: 8_000 })
}

test.describe('Proyectos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('lista de proyectos visible tras login', async ({ page }) => {
    // Debe aparecer algún elemento de la lista de proyectos
    const projectList = page.locator('[data-testid="project-list"], [data-testid="project-card"], h2, h3').first()
    await expect(projectList).toBeVisible({ timeout: 6_000 })
  })

  test('puede crear un proyecto nuevo', async ({ page }) => {
    // Buscar botón de crear proyecto
    const createBtn = page.getByRole('button', { name: /nuevo proyecto|crear proyecto|new project/i })
    await expect(createBtn).toBeVisible({ timeout: 4_000 })
    await createBtn.click()

    // Rellenar nombre del proyecto
    const nameInput = page.getByPlaceholder(/nombre|name/i).first()
    await expect(nameInput).toBeVisible({ timeout: 3_000 })

    const testProjectName = `E2E Test ${Date.now()}`
    await nameInput.fill(testProjectName)

    // Confirmar creación
    await page.getByRole('button', { name: /crear|crear proyecto|confirmar|save/i }).last().click()

    // El proyecto debe aparecer en la lista
    await expect(page.getByText(testProjectName)).toBeVisible({ timeout: 6_000 })
  })

  test('navegar a un proyecto abre el panel de herramientas', async ({ page }) => {
    // Clic en el primer proyecto disponible
    const firstProject = page.locator('[data-testid="project-card"], .project-card, [role="listitem"]').first()
    await expect(firstProject).toBeVisible({ timeout: 5_000 })
    await firstProject.click()

    // Debe verse alguna herramienta T1-T13
    const toolPanel = page.locator('[data-testid="tool-panel"], nav, aside').first()
    await expect(toolPanel).toBeVisible({ timeout: 5_000 })
  })
})
