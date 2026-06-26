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

// El dropdown usa `absolute` + `w-64` + `z-50` (el DebugPanel usa `fixed` + `z-[9999]`).
function projectDropdown(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  return page.locator('div[class*="absolute"][class*="w-64"][class*="z-50"]')
}

async function openProjectDropdown(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  await page.locator('header').getByRole('button').first().click()
  await expect(projectDropdown(page)).toBeVisible({ timeout: 5_000 })
}

// Selecciona el valor de un <select> controlado por React disparando el evento nativo.
// Playwright.selectOption() no siempre activa el onChange sintético de React.
async function reactSelect(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  selector: string,
  optionIndex: number,
) {
  await page.evaluate(
    ({ sel, idx }) => {
      const el = document.querySelector(sel) as HTMLSelectElement | null
      if (!el || el.options.length <= idx) return
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype, 'value',
      )?.set
      nativeSetter?.call(el, el.options[idx].value)
      el.dispatchEvent(new Event('input',  { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { sel: selector, idx: optionIndex },
  )
}

test.describe('Proyectos', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!DEV_PASSWORD, 'E2E_PASSWORD no configurado')
    await login(page)
  })

  test('header carga con el selector de proyectos', async ({ page }) => {
    await expect(page.locator('header').getByRole('button').first()).toBeVisible()
  })

  test('dropdown muestra "Nuevo proyecto"', async ({ page }) => {
    await openProjectDropdown(page)
    await expect(projectDropdown(page).getByText('Nuevo proyecto')).toBeVisible()
  })

  test('puede seleccionar un proyecto desde el dropdown', async ({ page }) => {
    await openProjectDropdown(page)

    const dropdown = projectDropdown(page)
    // Obtener el nombre del primer proyecto desde el span.truncate
    const nameSpans = dropdown.locator('span[class*="truncate"]')
    const count = await nameSpans.count()

    if (count === 0) {
      // Sin proyectos en el entorno DEV — test considerado exitoso (nada que seleccionar).
      return
    }

    const projectName = ((await nameSpans.first().textContent()) ?? '').trim()

    // Clic en el botón que contiene ese texto (hasText es más simple que has: locator)
    await dropdown.locator('button').filter({ hasText: projectName }).first().click()

    // El trigger del selector muestra el nombre
    await expect(
      page.locator('header').getByRole('button').first()
    ).toContainText(projectName.slice(0, 15), { timeout: 5_000 })
  })

  test('puede crear un proyecto nuevo', async ({ page }) => {
    await openProjectDropdown(page)
    await projectDropdown(page).getByText('Nuevo proyecto').click()

    const nameInput = page.getByPlaceholder('Nombre del proyecto...')
    await expect(nameInput).toBeVisible({ timeout: 3_000 })

    const testName = `GOBY_TEST_${Date.now()}`
    await nameInput.fill(testName)

    // Para superadmin: seleccionar empresa con el native setter de React
    const companySelect = page.locator('select').first()
    const hasSelect = await companySelect.isVisible({ timeout: 2_000 }).catch(() => false)
    if (hasSelect) {
      // Esperar a que carguen las opciones (la primera es el placeholder vacío)
      await expect(companySelect.locator('option').nth(1)).toBeAttached({ timeout: 8_000 })
      await reactSelect(page, 'select', 1)
      await expect(page.getByRole('button', { name: 'Crear proyecto' })).toBeEnabled({ timeout: 3_000 })
    }

    await page.getByRole('button', { name: 'Crear proyecto' }).click()

    await expect(
      page.locator('header').getByRole('button').first()
    ).toContainText(testName.slice(0, 15), { timeout: 8_000 })
  })
})
