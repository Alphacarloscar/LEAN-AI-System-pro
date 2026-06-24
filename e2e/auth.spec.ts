import { test, expect } from '@playwright/test'

const DEV_EMAIL    = process.env.E2E_EMAIL    ?? 'david.baquero@consultoriaalpha.com'
const DEV_PASSWORD = process.env.E2E_PASSWORD ?? ''

// Selectores derivados de LoginView.tsx:
//   - Email: input[autocomplete="email"]  (Field con autoComplete="email")
//   - Password: input[autocomplete="current-password"]
//   - Submit: button[type="submit"] con texto "Acceder"
//   - Error: div.bg-red-50 > p.text-red-600

test.describe('Autenticación', () => {
  test('página de login carga y muestra el formulario', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/GOBY/i)

    // Los inputs deben estar visibles
    await expect(page.locator('input[autocomplete="email"]')).toBeVisible()
    await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto('/login')

    await page.locator('input[autocomplete="email"]').fill('wrong@example.com')
    await page.locator('input[autocomplete="current-password"]').fill('wrongpassword123')
    await page.locator('button[type="submit"]').click()

    // El error aparece en un div.bg-red-50 con un <p> de texto rojo
    await expect(
      page.locator('.bg-red-50 .text-red-600').first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('login correcto redirige fuera de /login', async ({ page }) => {
    test.skip(!DEV_PASSWORD, 'E2E_PASSWORD no configurado — saltar test de login real')

    await page.goto('/login')

    await page.locator('input[autocomplete="email"]').fill(DEV_EMAIL)
    await page.locator('input[autocomplete="current-password"]').fill(DEV_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page).not.toHaveURL(/login/, { timeout: 10_000 })
  })
})
