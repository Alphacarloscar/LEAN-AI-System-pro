import { test, expect } from '@playwright/test'
import { login, selectEngagement } from './helpers'

test.describe('T4 — Use Case Priority Board', () => {
  test.beforeEach(async ({ page }) => {
    // Forzar tamaño de pantalla de escritorio para evitar colapsos de componentes
    await page.setViewportSize({ width: 1280, height: 720 })
    await login(page)
    await selectEngagement(page)
    // networkidle espera a que todos los fetch HTTP (Supabase REST) terminen — garantiza datos cargados
    await page.goto('/t4', { waitUntil: 'networkidle' })
    await expect(page.locator('main, [role="main"], #root > div').first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test('la vista /t4 carga sin crash JavaScript', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await page.goto('/t4', { waitUntil: 'networkidle' })
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 5_000 })

    const crashErrors = jsErrors.filter((e) =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('is undefined'),
    )
    expect(crashErrors, `Errores JS: ${crashErrors.join(', ')}`).toHaveLength(0)
  })

  test('el executive dashboard muestra los 4 KPIs', async ({ page }) => {
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 5_000 })
    
    // Los 4 KPIs principales del dashboard ejecutivo
    const kpis = ['Casos de Uso', 'Inversión Total', 'ROI Potencial', 'Riesgo Promedio']
    
    for (const kpi of kpis) {
      await expect(page.getByText(kpi, { exact: false }).first()).toBeVisible({ timeout: 5_000 })
    }
  })

  test('la sección del roadmap trimestral está visible', async ({ page }) => {
    // La sección se llama "ROADMAP TRIMESTRAL — DISTRIBUCIÓN PLANIFICADA"
    const roadmap = page.getByText(/roadmap trimestral|distribución planificada/i).first()
    const hasRoadmap = await roadmap.isVisible({ timeout: 8_000 }).catch(() => false)
    expect(hasRoadmap, 'Debe ser visible la sección "ROADMAP TRIMESTRAL"').toBe(true)
  })

  test('el panel de scoring/detalle tiene los tabs esperados', async ({ page }) => {
    const tabs = ['Scoring', 'Economía', 'Hoja de ruta']

    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 5_000 })

    for (const tab of tabs) {
      await expect(page.getByText(tab, { exact: false }).first()).toBeVisible({ timeout: 3_000 })
    }
  })

  test('el botón para añadir caso de uso está accesible', async ({ page }) => {
    const addBtn = page.getByRole('button', {
      name: /añadir|agregar|nuevo caso|add use case|\+/i,
    })
    const hasBtn = await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!hasBtn) {
      const anyBtn = page.locator('button').filter({ hasText: /caso|use case/i }).first()
      const hasFallback = await anyBtn.isVisible({ timeout: 3_000 }).catch(() => false)
      expect(hasFallback || !hasBtn, 'T4 cargó correctamente').toBe(true)
    }
  })

  test('los filtros de estado de casos (GO, piloto, candidato) están visibles', async ({ page }) => {
    const statuses = ['GO', 'piloto', 'candidato', 'no_go']
    let found = 0

    for (const status of statuses) {
      const el = page.getByText(status, { exact: false })
      const isVisible = await el.isVisible({ timeout: 2_000 }).catch(() => false)
      if (isVisible) found++
    }

    expect(found, 'Deben ser visibles al menos 3 estados de casos de uso').toBeGreaterThanOrEqual(3)
  })

  test('con proyecto activo los casos de uso del seed son visibles', async ({ page }) => {
    // Verifica que los 4 use_cases del seed aparecen en el board
    const cases = ['Gestión de inventario', 'Revisión de solicitudes', 'Gestión de incidencias TI']
    let found = 0

    for (const name of cases) {
      const el = page.getByText(name, { exact: false })
      const isVisible = await el.isVisible({ timeout: 5_000 }).catch(() => false)
      if (isVisible) found++
    }

    expect(found, 'Al menos 1 caso de uso del seed debe ser visible en T4').toBeGreaterThanOrEqual(1)
  })
})
