/**
 * Capa 3 — Radares Globales de Arquitectura
 *
 * Radar 1: Anti-Ametralladora (Debounce Guard)
 *   Garantiza que ningún campo de texto dispara PATCH/POST por cada pulsación.
 *   Cubre tres pantallas con distintos patrones de guardado:
 *   - T1: textarea de evidencia con debounce real de 800 ms en el store.
 *   - T4: input kpiPrincipal con estado local (guardado explícito por botón).
 *   - CompanyProfile: inputs con updateField de Zustand (estado local, sin auto-save).
 *   Umbral: > 1 PATCH/POST durante la ventana de tecleo → fallo con identificación del infractor.
 *
 * Radar 2: Rastreador de Fugas de PostgREST (Leak Guard)
 *   Garantiza que errores internos de Supabase/PostgreSQL nunca llegan sin sanitizar
 *   a la consola del navegador o al manejador de errores de página.
 */

import { test, expect, type Page, type Request } from '@playwright/test'
import { login, selectEngagement, waitForStoreReady } from './helpers'

// ── Constantes ────────────────────────────────────────────────────────────────

function isSupabaseMutation(url: string, method: string): boolean {
  return (method === 'PATCH' || method === 'POST') && url.includes('/rest/v1/')
}

/**
 * Firmas que delatan errores crudos de PostgREST/PostgreSQL filtrándose al front-end.
 * Ninguna debe aparecer en console.error/warn ni en pageerror si el front sanitiza bien.
 */
const POSTGREST_LEAK_SIGNATURES: string[] = [
  'PGRST',               // Códigos de error PostgREST (PGRST116, PGRST301, …)
  '42P01',               // undefined_table
  '42501',               // insufficient_privilege
  '23503',               // foreign_key_violation
  'row-level security',  // Texto de RLS violation en PostgreSQL
  'violates row-level',
  'PostgREST',           // Nombre del servidor en mensajes de error
  'relation "',          // "relation \"tabla\" does not exist"
  '"hint":',             // Estructura JSON cruda de error de PostgREST
  '"details":',          // Idem
  'syntax error at',     // Error de parseo SQL expuesto
  'invalid input syntax', // Error de tipo de dato expuesto
]

/** Cadena larga para activar el anti-patrón: dispara por cada letra si no hay debounce */
const TYPING_TEST_STRING = 'Control de calidad automatizado para GOBY'

/**
 * Delay entre pulsaciones (ms).
 * Debe ser MENOR que cualquier debounce razonable (300-800 ms) para que, durante el
 * tecleo, un campo correctamente debounced no lance ninguna petición.
 * Con 50 ms/char y 41 chars el bloque de typing dura ~2 s.
 */
const KEYSTROKE_DELAY_MS = 50

/**
 * Ventana de comprobación tras el último carácter (ms).
 * Deliberadamente menor que cualquier debounce razonable (< 200 ms):
 * solo capturamos peticiones lanzadas DURANTE el tecleo, no la petición
 * legítima que dispararía el debounce después de la pausa.
 */
const CHECK_WINDOW_AFTER_TYPING_MS = 150

/** Umbral: más de esta cantidad de PATCH/POST durante el tecleo = fallo */
const MUTATION_THRESHOLD = 1

// ── Definición de pantallas con su lógica de apertura de campos ───────────────

interface ScreenConfig {
  label: string
  path: string
  /** Pasos específicos de cada pantalla para exponer inputs de texto antes de testear */
  openTextFields: (page: Page) => Promise<void>
}

const SCREENS: ScreenConfig[] = [
  {
    label: 'T1 (AI Readiness — evidencia con debounce 800 ms)',
    path: '/t1',
    openTextFields: async (page) => {
      // T1 muestra DimensionCards colapsadas por defecto (isCollapsed=true).
      // Flujo: 1) expandir la primera dimensión → 2) click en "Añadir nota"
      // para revelar el textarea de evidencia debounced a 800 ms.

      // 1. Expandir la primera dimension card — su cabecera es un button full-width
      //    que contiene el número de dimensión (D1, D2...) en un span font-mono.
      const dimHeader = page
        .locator('button')
        .filter({ hasText: /Estrategia|Datos|Tecnología|Talento|Procesos|Gobernanza/i })
        .first()
      if (await dimHeader.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await dimHeader.click()
        await page.waitForTimeout(500)
      }

      // 2. Click en "Añadir nota" para mostrar el textarea de evidencia
      const noteBtn = page
        .locator('button')
        .filter({ hasText: /añadir nota|editar nota/i })
        .first()
      if (await noteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await noteBtn.click()
        await page.waitForTimeout(400)
      }
    },
  },
  {
    label: 'T4 (Economics — kpiPrincipal con estado local)',
    path: '/t4',
    openTextFields: async (page) => {
      // T4 muestra los inputs de texto del Economics tab al activar el modo edición
      // dentro de un caso de uso. Flujo: click en caso de uso → tab Economía → Editar.
      const caseCard = page
        .getByText(/gestión de inventario|revisión de solicitudes|gestión de incidencias/i)
        .first()
      const cardVisible = await caseCard.isVisible({ timeout: 5_000 }).catch(() => false)
      if (!cardVisible) return

      await caseCard.click()
      await page.waitForTimeout(600)

      const econTab = page.getByText(/economía/i, { exact: false }).first()
      if (await econTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await econTab.click()
        await page.waitForTimeout(400)
      }

      // Busca el botón de edición dentro del panel de detalle (lápiz o texto "Editar")
      const editBtn = page
        .locator('button')
        .filter({ hasText: /editar/i })
        .first()
      if (await editBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await editBtn.click()
        await page.waitForTimeout(400)
      }
    },
  },
  {
    label: 'CompanyProfile (Proyecto — inputs con updateField Zustand)',
    path: '/company-profile',
    openTextFields: async (page) => {
      // CompanyProfile tiene inputs de texto visibles en el tab "Proyecto".
      // Hace click en el tab si no es el activo por defecto.
      const proyectoTab = page.getByText('Proyecto', { exact: true }).first()
      if (await proyectoTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await proyectoTab.click()
        await page.waitForTimeout(400)
      }
    },
  },
]

// ── Radar 1: Debounce Guard ───────────────────────────────────────────────────

test.describe('Radar 1 — Anti-Ametralladora: Debounce Guard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await selectEngagement(page)
  })

  for (const screen of SCREENS) {
    test(`${screen.label} — ningún campo de texto dispara PATCH/POST por cada tecla`, async ({
      page,
    }) => {
      await page.goto(screen.path, { waitUntil: 'networkidle' })
      await waitForStoreReady(page)

      // Ejecuta la lógica de apertura específica de esta pantalla
      await screen.openTextFields(page)

      // Selectores de inputs de texto libre (excluye range, radio, checkbox, hidden, number)
      const TEXT_INPUT_SELECTOR = [
        'input[type="text"]',
        'input[type="search"]',
        'input[type="email"]',
        'input:not([type])',
        'textarea',
      ].join(', ')

      await page.waitForTimeout(500) // Espera render tras la apertura de campos

      const inputLocator = page.locator(TEXT_INPUT_SELECTOR).filter({ visible: true })
      const inputCount = await inputLocator.count()

      // Skip graceful: la pantalla o la apertura no expusieron inputs de texto
      if (inputCount === 0) {
        test.skip(
          true,
          `${screen.label}: no se encontraron inputs de texto visibles — ` +
            'la apertura de campo puede requerir interacción adicional en esta sesión',
        )
        return
      }

      const violations: string[] = []
      const fieldsToTest = Math.min(inputCount, 2) // máximo 2 campos por pantalla

      for (let idx = 0; idx < fieldsToTest; idx++) {
        const input = inputLocator.nth(idx)
        const editable = await input.isEditable().catch(() => false)
        if (!editable) continue

        let mutationsDuringTyping = 0
        let lastMutationUrl = ''

        // Interceptor activo SÓLO durante el bloque de tecleo de este campo
        const onRequest = (req: Request) => {
          if (isSupabaseMutation(req.url(), req.method())) {
            mutationsDuringTyping++
            lastMutationUrl = req.url()
          }
        }
        page.on('request', onRequest)

        // Selecciona todo el texto previo y escribe la cadena de prueba carácter a carácter
        await input.click({ clickCount: 3 })
        await input.pressSequentially(TYPING_TEST_STRING, { delay: KEYSTROKE_DELAY_MS })

        // Ventana de captura: espera CHECK_WINDOW ms sin que el debounce se dispare
        await page.waitForTimeout(CHECK_WINDOW_AFTER_TYPING_MS)

        page.off('request', onRequest)

        if (mutationsDuringTyping > MUTATION_THRESHOLD) {
          const fieldId =
            (await input.getAttribute('id')) ??
            (await input.getAttribute('name')) ??
            (await input.getAttribute('placeholder')) ??
            `input[${idx}]`

          violations.push(
            `🔴 Campo "${fieldId}" en ${screen.path}: ` +
              `${mutationsDuringTyping} peticiones PATCH/POST durante el tecleo ` +
              `(umbral: ${MUTATION_THRESHOLD}) — URL infractora: ${lastMutationUrl}`,
          )
        }
      }

      expect(
        violations,
        `Campos sin debounce detectados en ${screen.label}:\n${violations.join('\n')}`,
      ).toHaveLength(0)
    })
  }
})

// ── Radar 2: PostgREST Leak Guard ─────────────────────────────────────────────

test.describe('Radar 2 — Rastreador de Fugas: PostgREST Leak Guard', () => {
  test('interacciones en T1 y T4 no filtran errores crudos de PostgREST a la consola', async ({
    page,
  }) => {
    const leaks: string[] = []

    // ── Listener global de consola — activo durante TODO el test ──────────────
    page.on('console', (msg) => {
      if (msg.type() !== 'error' && msg.type() !== 'warning' && msg.type() !== 'warn') return

      const text = msg.text()
      for (const sig of POSTGREST_LEAK_SIGNATURES) {
        if (text.includes(sig)) {
          leaks.push(`[console.${msg.type()}] Firma "${sig}" detectada → ${text.slice(0, 300)}`)
          break
        }
      }
    })

    // ── Listener de errores de página no capturados ────────────────────────────
    page.on('pageerror', (err) => {
      const msg = err.message
      for (const sig of POSTGREST_LEAK_SIGNATURES) {
        if (msg.includes(sig)) {
          leaks.push(`[pageerror] Firma "${sig}" detectada → ${msg.slice(0, 300)}`)
          break
        }
      }
    })

    await login(page)
    await selectEngagement(page)

    // ── Bloque T1: interacciones con sliders, selects y botones de dimensión ──
    await page.goto('/t1', { waitUntil: 'networkidle' })
    await waitForStoreReady(page)

    // Interacción 1: Click en botones de criterios/expansión de subdimensiones
    const dimensionBtns = page
      .locator('[class*="dimension"] button, [class*="card"] button')
      .filter({ visible: true })
    const dimBtnCount = await dimensionBtns.count()
    for (let i = 0; i < Math.min(2, dimBtnCount); i++) {
      await dimensionBtns.nth(i).click().catch(() => {})
      await page.waitForTimeout(350)
    }

    // Interacción 2: Manipulación de slider de scoring (input[type=range])
    const rangeInputs = page.locator('input[type="range"]').filter({ visible: true })
    if (await rangeInputs.count().then((c) => c > 0)) {
      await rangeInputs.first().evaluate((el: HTMLInputElement) => {
        const mid = ((Number(el.max) - Number(el.min)) / 2 + Number(el.min)).toString()
        el.value = mid
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
      })
      await page.waitForTimeout(350)
    }

    // Interacción 3: Selects de valoración si los hay
    const t1Selects = page.locator('select').filter({ visible: true })
    if (await t1Selects.count().then((c) => c > 0)) {
      await t1Selects.first().selectOption({ index: 1 }).catch(() => {})
      await page.waitForTimeout(350)
    }

    // ── Bloque T4: interacciones con filtros de estado y cards ─────────────────
    await page.goto('/t4', { waitUntil: 'networkidle' })
    await waitForStoreReady(page)

    // Interacción 4: Filtros de estado (GO / piloto / candidato / no_go)
    const statusFilters = page
      .locator('button')
      .filter({ hasText: /^(go|piloto|candidato|no_go|no go)$/i })
      .filter({ visible: true })
    const filterCount = await statusFilters.count()
    if (filterCount > 0) {
      await statusFilters.first().click().catch(() => {})
      await page.waitForTimeout(350)
      await statusFilters.first().click().catch(() => {}) // desactiva el filtro
      await page.waitForTimeout(250)
    }

    // Interacción 5: Selectores de estado en tarjetas de casos de uso
    const t4Selects = page.locator('select').filter({ visible: true })
    if (await t4Selects.count().then((c) => c > 0)) {
      await t4Selects.first().selectOption({ index: 1 }).catch(() => {})
      await page.waitForTimeout(350)
    }

    // Interacción 6: Click en el primer caso de uso visible (abre panel de detalle)
    const useCaseText = page
      .getByText(/gestión de inventario|revisión de solicitudes/i)
      .first()
    if (await useCaseText.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await useCaseText.click().catch(() => {})
      await page.waitForTimeout(500)
    }

    // Espera final para que cualquier output asíncrono de consola llegue
    await page.waitForTimeout(600)

    expect(
      leaks,
      `Fugas de PostgREST detectadas en T1/T4:\n\n${leaks.join('\n\n')}` +
        '\n\n→ Estos errores deben ser capturados en el service layer y convertidos ' +
        'en mensajes de usuario antes de llegar a la consola del navegador.',
    ).toHaveLength(0)
  })
})
