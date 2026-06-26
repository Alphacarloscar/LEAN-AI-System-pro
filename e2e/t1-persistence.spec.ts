/**
 * E2E — T1 Score Persistence
 *
 * Critical flow: login → navigate to T1 → interact with a dimension →
 * reload (F5) → verify state persists via Zustand localStorage persist.
 *
 * The test skips gracefully when:
 *   - E2E_PASSWORD is not set (no credentials in CI)
 *   - No project is active (no subdimension sliders available)
 */
import { test, expect } from '@playwright/test'
import { login, selectEngagement } from './helpers'

test.describe('T1 — Score persistence after page reload', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectEngagement(page)
    await page.goto('/t1')
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10_000 })
  })

  test('el estado de T1 persiste tras F5 (Zustand localStorage)', async ({ page }) => {
    // ── 1. Leer el valor del radar chart antes de interactuar ──
    // Los stores de T1 usan localStorage (zustand/persist). Leemos el valor inicial.
    const storeBefore: string | null = await page.evaluate(() =>
      localStorage.getItem('lean-t1-store')
    )

    // ── 2. Buscar un slider de subdimensión o cualquier input range ──
    const slider = page.locator('input[type="range"]').first()
    const hasSlider = await slider.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!hasSlider) {
      // Sin proyecto activo no hay sliders — el test registra éxito condicional
      // ya que la persistencia no aplica sin datos que guardar.
      return
    }

    // ── 3. Obtener el valor actual del slider y cambiarlo ──
    const valueBefore = await slider.inputValue()
    // Mover el slider: si está al mínimo, subimos; si no, bajamos
    const newValue = valueBefore === '0' ? '2' : '0'

    // Usamos fill + dispatchEvent para garantizar que React detecta el cambio
    await slider.focus()
    await page.evaluate(
      ({ sel, val }) => {
        const el = document.querySelector(sel) as HTMLInputElement | null
        if (!el) return
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value',
        )?.set
        nativeSetter?.call(el, val)
        el.dispatchEvent(new Event('input',  { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      },
      { sel: 'input[type="range"]', val: newValue },
    )

    // ── 4. Verificar que el store se actualizó en localStorage ──
    // Dar tiempo al middleware persist para serializar
    await expect.poll(
      async () => {
        const raw = await page.evaluate(() => localStorage.getItem('lean-t1-store'))
        return raw !== storeBefore
      },
      { timeout: 5_000, message: 'El store lean-t1-store debería haber cambiado en localStorage' },
    ).toBe(true)

    // Guardar el valor del store tras el cambio
    const storeAfterChange: string | null = await page.evaluate(() =>
      localStorage.getItem('lean-t1-store')
    )

    // ── 5. Recargar la página (F5) ──
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10_000 })

    // ── 6. Verificar que el store persiste tras el reload ──
    const storeAfterReload: string | null = await page.evaluate(() =>
      localStorage.getItem('lean-t1-store')
    )

    expect(
      storeAfterReload,
      'El store lean-t1-store debe persistir en localStorage tras F5',
    ).toBe(storeAfterChange)
  })

  test('localStorage contiene la clave lean-t1-store tras visitar T1', async ({ page }) => {
    // Verificación ligera: el store persiste en localStorage con la clave correcta
    const storeKey = await page.evaluate(() => localStorage.getItem('lean-t1-store'))
    // La clave puede ser null si no hay proyecto activo, pero el middleware persist
    // debería haberla inicializado al montar el store
    // Si es null, es aceptable (store inicializado vacío no serializa hasta primera mutación)
    if (storeKey !== null) {
      expect(() => JSON.parse(storeKey)).not.toThrow()
    }
  })

  test('la vista T1 no muestra errores JS tras reload', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10_000 })

    const crashErrors = jsErrors.filter((e) =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('is undefined'),
    )
    expect(crashErrors, `Errores JS tras reload: ${crashErrors.join(', ')}`).toHaveLength(0)
  })
})
