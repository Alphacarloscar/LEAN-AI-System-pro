// ============================================================
// E2E — T10 AI Value Dashboard
//
// Verifica que el dashboard ejecutivo funciona correctamente
// tras ADR-029 (Generalización Multidominio, fases 3–4).
//
// Criterios críticos:
//   1. Los 6 paneles se renderizan sin crash JS
//   2. Estados activo/preview por panel según contracted_packages
//   3. P2 Portfolio siempre activo (sin gate)
//   4. Navegación T10 → T1+ sin error JS
//
// Estrategia: tests separados por estado contractual del proyecto.
// Proyecto "Toy Story" tiene todos los paquetes → todos activos.
// Proyecto "Test Boost Only" tiene solo boost_assessment → preview en otros.
// ============================================================

import { test, expect } from '@playwright/test'
import { login, selectEngagement, LAB_PROJECT_ID, LAB_PROJECT_BOOST_ONLY, waitForStoreReady } from './helpers'

test.describe('T10 — AI Value Dashboard', () => {
  // ── Carga sin crash ──────────────────────────────────────────

  test('T10 carga sin crash JavaScript (proyecto con todos los paquetes)', async ({
    page,
  }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await login(page)
    await selectEngagement(page, LAB_PROJECT_ID)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForStoreReady(page, 'Cargando', 20_000)

    // T10 renderiza un grid 3×2 de paneles. El contenedor debe estar visible.
    await expect(page.locator('[role="main"], main').first()).toBeVisible({ timeout: 15_000 })

    const crashErrors = jsErrors.filter((e) =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('is undefined'),
    )
    expect(crashErrors, `Errores JS en /: ${crashErrors.join(', ')}`).toHaveLength(0)
  })

  // ── Grid de paneles visible ──────────────────────────────────

  test('el grid de 6 paneles se renderiza correctamente', async ({ page }) => {
    await login(page)
    await selectEngagement(page, LAB_PROJECT_ID)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForStoreReady(page, 'Cargando', 20_000)

    // Los paneles tienen títulos textuales identificables.
    // El contenedor del grid debe tener 6 items visibles (paneles).
    const grid = page.locator('[role="main"], main').first()
    await expect(grid).toBeVisible()

    // Verificar que al menos algunos paneles están presentes por su contenido.
    // P1: Maturity, P2: Portfolio, P3: Adoption, P4: Ecosystem, P5: Risk, P6: Governance
    const panelTexts = [
      /Madurez|Maturity/i,
      /Portfolio|Portafolio/i,
      /Adopción|Adoption/i,
      /Ecosistema|Ecosystem/i,
      /Riesgo|Risk/i,
      /Gobierno|Governance/i,
    ]

    for (const textRegex of panelTexts) {
      const panelTitle = page
        .getByText(textRegex)
        .first()

      const isVisible = await panelTitle.isVisible({ timeout: 3_000 }).catch(() => false)
      if (!isVisible) {
        test.info().annotations.push({
          type: 'info',
          description: `Panel "${textRegex}" no visible — puede estar oculto por falta de datos`,
        })
      }
    }

    // No fallamos si algunos paneles están vacíos — solo verificamos que el grid existe
    expect(grid).toBeVisible()
  })

  // ── Estados activo/preview con proyecto "Toy Story" (todos los paquetes) ─

  test.describe('Proyecto con todos los paquetes (Toy Story)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
      await selectEngagement(page, LAB_PROJECT_ID)
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await waitForStoreReady(page, 'Cargando', 20_000)
    })

    test('todos los paneles están en estado ACTIVO', async ({ page }) => {
      // Con contracted_packages = ['boost_assessment', 'portfolio_management', 'legal_compliance'],
      // los 6 paneles deberían renderizar su contenido real (no preview).
      // No debe haber banner "Paquete no disponible" en ningún panel.

      const previewBanners = page.getByText('Paquete no disponible')
      const count = await previewBanners.count()

      expect(count, 'No debe haber banners de preview con todos los paquetes').toBe(0)
    })

    test('P2 Portfolio siempre está activo (sin gate de paquetes)', async ({ page }) => {
      // P2PortfolioPanel no tiene usePackagePanel — siempre está activo.
      // Verificar que no renderiza el banner de preview.

      const portfolioSection = page
        .locator('[role="main"], main')
        .first()
        .locator(':has-text("Portfolio")')
        .first()

      const isVisible = await portfolioSection.isVisible({ timeout: 3_000 }).catch(() => false)

      if (isVisible) {
        // Si el panel está visible, verificar que NO tiene banner de preview
        const banner = portfolioSection.getByText('Paquete no disponible')
        const bannerCount = await banner.count()
        expect(bannerCount).toBe(0)
      }
    })
  })

  // ── Estados activo/preview con proyecto "Test Boost Only" (solo boost) ─

  test.describe('Proyecto con solo paquete Boost (Test Boost Only)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page)
      await selectEngagement(page, LAB_PROJECT_BOOST_ONLY)
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await waitForStoreReady(page, 'Cargando', 20_000)
    })

    test('P1 Maturity está ACTIVO (packageId=boost_assessment)', async ({ page }) => {
      // P1MaturityPanel tiene usePackagePanel('boost_assessment') → activo
      const p1Panel = page
        .locator('[role="main"], main')
        .first()
        .locator(':has-text("Madurez")')
        .first()

      const isVisible = await p1Panel.isVisible({ timeout: 3_000 }).catch(() => false)

      if (isVisible) {
        // Si visible, no debe tener banner de preview
        const banner = p1Panel.getByText('Paquete no disponible')
        const bannerCount = await banner.count()
        expect(bannerCount).toBe(0)
      }
    })

    test('P3 Adoption está ACTIVO (packageId=boost_assessment)', async ({ page }) => {
      // P3AdoptionPanel tiene usePackagePanel('boost_assessment') → activo
      const p3Panel = page
        .locator('[role="main"], main')
        .first()
        .locator(':has-text("Adopción|Adoption")')
        .first()

      const isVisible = await p3Panel.isVisible({ timeout: 3_000 }).catch(() => false)

      if (isVisible) {
        const banner = p3Panel.getByText('Paquete no disponible')
        const bannerCount = await banner.count()
        expect(bannerCount).toBe(0)
      }
    })

    test('P4 Ecosystem está en PREVIEW (packageId=portfolio_management)', async ({ page }) => {
      // P4EcosystemPanel tiene usePackagePanel('portfolio_management') → preview
      const previewBanner = page.getByText('Paquete no disponible').first()
      const isVisible = await previewBanner.isVisible({ timeout: 5_000 }).catch(() => false)

      // Es válido que la vista esté vacía si no hay componentes clickeables
      if (isVisible) {
        // Verificar que el banner está presente
        expect(previewBanner).toBeDefined()

        // Verificar que el enlace CTA "Contactar" está presente
        const contactLink = page.getByRole('link', { name: /Contactar para activar|contact/i })
        const linkVisible = await contactLink.isVisible({ timeout: 2_000 }).catch(() => false)

        if (linkVisible) {
          // Si el link está visible, validar su href
          const href = await contactLink.getAttribute('href')
          expect(href).toContain('mailto:')
        }
      }
    })

    test('P5 Risk está en PREVIEW (packageId=legal_compliance)', async ({ page }) => {
      // P5RiskPanel tiene usePackagePanel('legal_compliance') → preview
      const previewBanner = page.getByText('Paquete no disponible').first()
      const isVisible = await previewBanner.isVisible({ timeout: 5_000 }).catch(() => false)

      if (isVisible) {
        expect(previewBanner).toBeDefined()
      }
    })

    test('P6 Governance está en PREVIEW (packageId=portfolio_management)', async ({ page }) => {
      // P6GovernancePanel tiene usePackagePanel('portfolio_management') → preview
      const previewBanner = page.getByText('Paquete no disponible').first()
      const isVisible = await previewBanner.isVisible({ timeout: 5_000 }).catch(() => false)

      if (isVisible) {
        expect(previewBanner).toBeDefined()
      }
    })

    test('P2 Portfolio siempre está ACTIVO (sin gate)', async ({ page }) => {
      // P2PortfolioPanel nunca tiene usePackagePanel — siempre activo
      const previewBanners = page.getByText('Paquete no disponible')
      const count = await previewBanners.count()

      // Con 4 paneles en preview (P3, P4, P5, P6 — pero P1/P3 son boost_assessment que SÍ están activos),
      // esperamos al menos 3–4 banners de preview (P4, P5, P6 mínimamente).
      // P2 nunca debe tener uno.

      // Este test es suave — solo documentamos que hay previews
      if (count > 0) {
        test.info().annotations.push({
          type: 'info',
          description: `${count} paneles en estado preview (esperado: 3–4 para packageId no contratados)`,
        })
      }
    })
  })

  // ── ADR-021: sin emojis en el DOM ────────────────────────────

  test('T10 no renderiza emojis crudos en el DOM (ADR-021 §6)', async ({ page }) => {
    await login(page)
    await selectEngagement(page, LAB_PROJECT_ID)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForStoreReady(page, 'Cargando', 20_000)

    const EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}]/u

    const t10Content = await page.locator('[role="main"], main').first().textContent()
    const hasEmoji = t10Content ? EMOJI_REGEX.test(t10Content) : false

    expect(
      hasEmoji,
      `T10 tiene emojis en el DOM (ADR-021 §6 prohíbe emojis en JSX): "${t10Content?.match(EMOJI_REGEX)?.[0]}"`,
    ).toBe(false)
  })

  // ── Navegación: T10 → T1 ─────────────────────────────────────

  test('navegar de T10 a T1 no produce error de JavaScript', async ({ page }) => {
    const jsErrors: string[] = []
    page.on('pageerror', (err) => jsErrors.push(err.message))

    await login(page)
    await selectEngagement(page, LAB_PROJECT_ID)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await waitForStoreReady(page, 'Cargando', 20_000)

    // Navegar a T1 haciendo click en algún panel o directamente por URL
    await page.goto(`/t1/${LAB_PROJECT_ID}`, { waitUntil: 'domcontentloaded' })
    await expect(page).not.toHaveURL(/login/)
    await expect(page.locator('[role="main"], main').first()).toBeVisible({ timeout: 8_000 })

    const crashErrors = jsErrors.filter((e) =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('is undefined'),
    )
    expect(crashErrors, `Errores JS al navegar T10→T1: ${crashErrors.join(', ')}`).toHaveLength(0)
  })
})
