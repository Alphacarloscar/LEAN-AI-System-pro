import { test, expect } from '@playwright/test'

const DEV_EMAIL    = process.env.E2E_EMAIL    ?? 'david.baquero@consultoriaalpha.com'
const DEV_PASSWORD = process.env.E2E_PASSWORD ?? ''

test.describe('Autenticación', () => {
  test('login correcto redirige al dashboard', async ({ page }) => {
    await page.goto('/')

    // La app redirige al login si no hay sesión
    await expect(page).toHaveURL(/login/)

    await page.getByLabel(/email/i).fill(DEV_EMAIL)
    await page.getByLabel(/contraseña|password/i).fill(DEV_PASSWORD)
    await page.getByRole('button', { name: /entrar|login|iniciar/i }).click()

    // Tras login debe aparecer la lista de proyectos o el dashboard
    await expect(page).not.toHaveURL(/login/, { timeout: 8_000 })
  })

  test('credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/contraseña|password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /entrar|login|iniciar/i }).click()

    // Debe aparecer un mensaje de error visible
    await expect(
      page.locator('[role="alert"], .error, [data-testid="auth-error"]').first()
    ).toBeVisible({ timeout: 6_000 })
  })

  test('página de login tiene título correcto', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/LEAN|Alpha/i)
  })
})
