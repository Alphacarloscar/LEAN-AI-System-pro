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

// Las rutas de la app y su título esperado en sidebar/header
const TOOL_ROUTES = [
  { path: '/',               label: 'home'            },
  { path: '/t1',             label: 'T1'              },
  { path: '/t2',             label: 'T2'              },
  { path: '/t3',             label: 'T3'              },
  { path: '/t4',             label: 'T4'              },
  { path: '/t5',             label: 'T5'              },
  { path: '/t6',             label: 'T6'              },
  { path: '/t7',             label: 'T7'              },
  { path: '/t8',             label: 'T8'              },
  { path: '/t9',             label: 'T9'              },
  { path: '/t11',            label: 'T11'             },
  { path: '/t12',            label: 'T12'             },
  { path: '/company-profile', label: 'company-profile' },
]

test.describe('Navegación — todas las rutas', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!DEV_PASSWORD, 'E2E_PASSWORD no configurado')
    await login(page)
  })

  test('el dashboard principal (/) carga sin error', async ({ page }) => {
    await page.goto('/')
    await expect(page).not.toHaveURL(/login/)
    // Verifica que el layout principal está renderizado (sidebar o header)
    await expect(page.locator('header').first()).toBeVisible({ timeout: 8_000 })
  })

  for (const { path, label } of TOOL_ROUTES.filter((r) => r.path !== '/')) {
    test(`${path} — carga sin error (sin consola de crash)`, async ({ page }) => {
      // Captura errores JavaScript en la página
      const jsErrors: string[] = []
      page.on('pageerror', (err) => jsErrors.push(err.message))

      await page.goto(path)
      await expect(page).not.toHaveURL(/login/)

      // Espera a que el contenido principal esté visible
      await expect(page.locator('main, [role="main"], #root > div').first()).toBeVisible({
        timeout: 10_000,
      })

      // No debe haber errores JavaScript de crash (tipo "Cannot read properties of undefined")
      const crashErrors = jsErrors.filter((e) =>
        e.includes('Cannot read') || e.includes('is not a function') || e.includes('is undefined'),
      )
      expect(crashErrors, `Errores JS en ${path}: ${crashErrors.join(', ')}`).toHaveLength(0)
    })
  }

  test('rutas inexistentes redirigen al home', async ({ page }) => {
    await page.goto('/ruta-que-no-existe')
    await expect(page).not.toHaveURL(/ruta-que-no-existe/)
  })
})

test.describe('Navegación — rutas públicas', () => {
  test('/login carga sin autenticación', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/login/)
    await expect(page.locator('input[autocomplete="email"]')).toBeVisible()
  })

  test('/ sin autenticación redirige a /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })

  test('/t1 sin autenticación redirige a /login', async ({ page }) => {
    await page.goto('/t1')
    await expect(page).toHaveURL(/login/, { timeout: 5_000 })
  })
})
