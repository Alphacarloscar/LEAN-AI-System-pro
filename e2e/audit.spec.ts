// ============================================================
// E2E — Audit Trail Integration Tests
//
// Certifica que las interacciones reales del usuario disparan
// la traza de auditoría inmutable a través del stack completo:
//
//   UI action  →  makeAuditable proxy  →  fireAuditLog()
//              →  Edge Function log-audit-event
//              →  audit_logs INSERT (verified via network intercept)
//
// Arquitectura del sistema auditado (ADR-017):
//   — makeAuditable wraps service methods with a Proxy
//   — fireAuditLog() invokes supabase.functions.invoke('log-audit-event')
//   — The Edge Function validates JWT, strips client-supplied identity fields,
//     and inserts with service_role (bypassing RLS)
//   — The client NEVER sends user_id/user_email/user_role — server extracts them
//
// Fixture de referencia: e2e/fixtures/seed.sql
//   — Company: Disney   (0b83042d-414e-4d4c-8c83-3a469affbfb3)
//   — Project: Toy Story (e2058bff-9759-465d-ae4d-df79fdf23815)
//   — consultor@test.dev → role: consultant
//
// Patrones de estabilidad aplicados:
//   — page.waitForResponse() ancla cada aserción a una respuesta HTTP real
//   — La promesa se registra ANTES de la acción que la dispara, eliminando
//     la race condition clásica "espero respuesta de algo que ya pasó"
//   — Todos los timeouts son explícitos; ninguno depende de sleep()
//   — afterEach limpia el interviewee creado para dejar el seed intacto
// ============================================================

import { test, expect, type Page, type Request, type Response } from '@playwright/test'
import { login, selectEngagement, waitForStoreReady, LAB_PROJECT_ID, USERS } from './helpers'

// ── Constantes del entorno E2E ─────────────────────────────────────────────

// URL pattern de la Edge Function — funciona tanto en local (Docker Supabase)
// como en Supabase Cloud, ya que la URL base la resuelve el cliente Supabase
// internamente. La intercepción se hace por sufijo de ruta.
const EDGE_FN_PATTERN = /\/functions\/v1\/log-audit-event/

// Timeout para detectar que la request a la Edge Function fue ENVIADA y respondida.
// Con EdgeRuntime.waitUntil() la función responde en cold_start + auth.getUser().
// Cold-start Deno en Supabase Cloud puede llegar a 60s; auth añade 1-5s adicionales.
// 90s da margen suficiente incluso en el peor caso de arranque en frío en CI.
const EDGE_FN_TIMEOUT = 90_000

// Nombre del servicio auditado que aparecerá en el campo service_name del log.
// Definido en src/services/t1.service.ts línea 230: makeAuditable(_impl, 'services.t1')
const SERVICE_NAME = 'services.t1'

// Método específico que dispara la creación de un entrevistado — el store llama
// upsertAllScoresForInterviewee (no upsertT1Score individual) al añadir uno nuevo.
// fetchT1Data también lleva service_name='services.t1', por eso filtramos también por method.
const WRITE_METHOD = 'upsertAllScoresForInterviewee'

// Datos del entrevistado de prueba — nombre suficientemente único para poder
// buscarlo en logs y limpiarlo en afterEach sin colisionar con el seed.
const TEST_INTERVIEWEE = {
  name:       'E2E-AuditBot',
  role:       'QA Automation',
  department: 'IT',
  // type se usa como referencia semántica del perfil esperado; el selector
  // en fillAndSubmitNewIntervieweeModal usa /IT/i directamente por ser más robusto.
  // IMPORTANTE: el nombre debe coincidir exactamente con TEST_INTERVIEWEE en global-teardown.ts
  type:       'it' as const,
} as const

// ── Helpers locales ────────────────────────────────────────────────────────

/**
 * Navega a T1. La ruta requiere /:engagementId desde App.tsx (path="t1/:engagementId").
 * Usamos LAB_PROJECT_ID directamente en la URL para que el route match sea correcto.
 */
async function goToT1AndWait(page: Page): Promise<void> {
  // 'domcontentloaded' en lugar de 'networkidle' para no consumir budget de test
  // esperando que terminen todas las llamadas API iniciales (fetchT1Data, profiles, etc.)
  // La visibilidad del ToolHeader + waitForStoreReady garantizan que el componente está listo.
  await page.goto(`/t1/${LAB_PROJECT_ID}`, { waitUntil: 'domcontentloaded' })
  // Espera al ToolHeader real de T1View (title="AI Readiness Assessment"),
  // no al card del dashboard T10 que también tiene ese texto.
  await expect(
    page.locator('header').getByText('AI Readiness Assessment').first(),
  ).toBeVisible({ timeout: 20_000 })
  await waitForStoreReady(page)
}

/**
 * Registra waitForRequest ANTES de la acción del usuario.
 * Devuelve { request } — solo la promise de request.
 *
 * Los tests que necesitan verificar la response (tests 1 y 5) registran su
 * propio waitForResponse localmente con timeout extendido (120s).
 * No se registra responsePromise aquí para evitar "Error: page.waitForResponse:
 * Test ended." en los tests que no consumen la response: cuando afterEach navega
 * a '/' antes de que llegue la respuesta, Playwright cancela la promise pendiente
 * lanzando ese error en todos los tests que no la awaiten.
 *
 * Uso:
 *   const { request } = prepareAuditWatcher(page, SERVICE_NAME, WRITE_METHOD)
 *   await fillAndSubmitNewIntervieweeModal(page)
 *   await request()
 *
 *   — Timeout 90s cubre cold-start Deno + RLS check + INSERT en Supabase Cloud CI.
 */
function prepareAuditWatcher(
  page:        Page,
  serviceName: string,
  methodName:  string,
): { request: () => Promise<Request> } {
  const matcher = (url: string, body: Record<string, unknown>) =>
    EDGE_FN_PATTERN.test(url) &&
    body.service_name === serviceName &&
    body.method_name === methodName

  // Promise registrada ANTES de cualquier acción del usuario para evitar race condition.
  const requestPromise = page.waitForRequest(
    (req) => {
      if (req.method() !== 'POST') return false
      try {
        return matcher(req.url(), (req.postDataJSON() ?? {}) as Record<string, unknown>)
      } catch { return false }
    },
    { timeout: EDGE_FN_TIMEOUT },
  )

  return {
    request: () => requestPromise,
  }
}

/**
 * Registra waitForResponse para los tests que necesitan verificar la respuesta
 * del servidor (tests 1 y 5). Debe llamarse ANTES de la acción del usuario.
 *
 * BUG FIX (2026-06-30): el filtro NO puede parsear req.postDataJSON() dentro
 * del callback de waitForResponse — en algunos backends (Deno Edge Functions
 * vía Supabase), el body del request no está disponible en ese contexto,
 * aunque SÍ lo esté en page.on('request'). Como consecuencia, el filtro
 * devolvía false para TODA response y timeouteaba a 90s (tests audit:253 y :419).
 *
 * Solución: escuchar page.on('request') para trackear las requests que matchean
 * el filtro (donde postDataJSON SÍ funciona), guardarlas en un Set, y hacer el
 * filtro de waitForResponse por REFERENCIA de objeto contra ese Set. Sin
 * re-parsing del body en el callback de response — solo set.has(res.request()).
 */
function prepareAuditResponseWatcher(
  page:        Page,
  serviceName: string,
  methodName:  string,
): () => Promise<Response> {
  // Set de requests que matchean el filtro. Se puebla en el evento 'request'
  // (donde postDataJSON() es fiable) y se consulta en el callback de response
  // por referencia de objeto — evitando re-parseo poco fiable.
  const matchingRequests = new WeakSet<Request>()

  const onRequest = (req: Request) => {
    if (req.method() !== 'POST') return
    if (!EDGE_FN_PATTERN.test(req.url())) return
    try {
      const body = (req.postDataJSON() ?? {}) as Record<string, unknown>
      if (body.service_name === serviceName && body.method_name === methodName) {
        matchingRequests.add(req)
      }
    } catch { /* body no-JSON u otro error — ignorar, no matchea */ }
  }
  page.on('request', onRequest)

  const responsePromise = page.waitForResponse(
    (res) => matchingRequests.has(res.request()),
    { timeout: EDGE_FN_TIMEOUT },
  ).finally(() => {
    page.off('request', onRequest)
  })

  return () => responsePromise
}

/**
 * Abre el modal de nueva entrevista, rellena el formulario y hace click en
 * "Crear entrevista". Devuelve sin esperar la respuesta de red — el caller
 * ya tiene la Promise registrada con waitForAuditResponse().
 */
async function fillAndSubmitNewIntervieweeModal(page: Page): Promise<void> {
  // El botón CTA del ToolHeader solo aparece si el usuario no es read-only.
  // consultor@test.dev tiene rol 'consultant' → tiene acceso de escritura.
  const addBtn = page.getByRole('button', { name: /nueva entrevista/i })
  await expect(addBtn).toBeVisible({ timeout: 8_000 })
  await addBtn.click()

  // Modal "Nueva entrevista" — esperamos el título del modal para confirmar apertura
  await expect(page.getByText('Nueva entrevista').first()).toBeVisible({ timeout: 5_000 })

  await page.locator('#new-interviewee-name').fill(TEST_INTERVIEWEE.name)
  await page.locator('#new-interviewee-role').fill(TEST_INTERVIEWEE.role)

  // Departamento: el select aparece cuando hay departamentos cargados del seed.
  // Si aún no cargaron, el campo es un input de texto libre (fallback del componente).
  //
  // BUG FIX (2026-06-30): antes leíamos tagName una única vez y podíamos pillar
  // un estado transitorio: el elemento se detecta como <input>, se llama fill(),
  // y en ese instante el DOM cambia a <select> ("element was detached from the
  // DOM, retrying" + fallo). Ahora esperamos activamente (con polling real vía
  // waitFor, NO isVisible — isVisible no espera, solo comprueba en el instante)
  // a que el SELECTOR ESPECÍFICO 'select#…' aparezca visible hasta 3s; solo
  // caemos al input si el select no llega a aparecer en ese plazo.
  const deptSelectVersion = page.locator('select#new-interviewee-dept')
  const isSelect = await deptSelectVersion
    .waitFor({ state: 'visible', timeout: 3_000 })
    .then(() => true)
    .catch(() => false)

  if (isSelect) {
    await deptSelectVersion.selectOption({ label: TEST_INTERVIEWEE.department })
  } else {
    const deptInput = page.locator('input#new-interviewee-dept')
    await deptInput.waitFor({ state: 'visible', timeout: 3_000 })
    await deptInput.fill(TEST_INTERVIEWEE.department)
  }

  // Perfil: el SegmentedControl de IT/Negocio — selecciona IT
  const itOption = page.getByRole('radio', { name: /IT/i })
    .or(page.locator('[aria-label="Perfil del entrevistado"]').getByText(/IT/i))
  const hasRadio = await itOption.isVisible({ timeout: 2_000 }).catch(() => false)
  if (hasRadio) await itOption.click()

  await page.getByRole('button', { name: /crear entrevista/i }).click()
}

// ═══════════════════════════════════════════════════════════════════════════
// Suite principal
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Audit Trail — integración E2E', () => {

  test.setTimeout(120_000)

  // ── Warm-up de la Edge Function ───────────────────────────────────────
  // Supabase Edge Functions (Deno) sufren cold-start de hasta 60s en CI.
  // Un POST dummy antes de la suite hace que el runtime arranque y quede
  // caliente para los tests reales. El 401/400 de respuesta es esperado
  // (no enviamos JWT válido) — lo importante es que el runtime se inicie.
  test.beforeAll(async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const anonKey     = process.env.VITE_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) return   // entorno local sin vars → skip silencioso
    const warmupUrl = `${supabaseUrl}/functions/v1/log-audit-event`
    await request.post(warmupUrl, {
      headers: { 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
      data:    { _warmup: true },
      timeout: 90_000,
    }).catch(() => { /* cold-start puede devolver error — es esperado */ })
  })

  test.beforeEach(async ({ page }) => {
    // Activa el modo awaitable de makeAuditable: el Proxy esperará a que el
    // INSERT en audit_logs complete antes de devolver el control al caller.
    // Sin esto, afterEach navega a '/' antes de que la Edge Function termine
    // → 0 filas en audit_logs aunque el upsert T1 haya tenido éxito (ADR-017 §test-mode).
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>)['__E2E_AWAIT_AUDIT__'] = true
    })
    await login(page, USERS.consultor.email, USERS.consultor.password)
    await selectEngagement(page, LAB_PROJECT_ID)
    await goToT1AndWait(page)
  })

  // ── afterEach: reset del store entre tests ────────────────────────────
  // Navega fuera de T1 para que Zustand descarte el estado cargado.
  // La limpieza real de filas E2E-AuditBot en t1_dimension_scores
  // ocurre en global-teardown.ts al finalizar toda la suite.
  test.afterEach(async ({ page }) => {
    await page.goto('/').catch(() => { /* ignorar errores de navegación en afterEach */ })
  })

  // ── Test 1: La Edge Function recibe la llamada ────────────────────────
  //
  // Verifica que la cadena makeAuditable → fireAuditLog → Edge Function
  // se activa cuando el usuario crea un entrevistado nuevo.
  // Este es el test más importante: garantiza que la traza llega a la red.

  test('crear entrevistado dispara la llamada HTTP a log-audit-event', async ({ page }) => {
    // Ambas promises registradas ANTES de la acción para evitar race con afterEach.
    const { request }  = prepareAuditWatcher(page, SERVICE_NAME, WRITE_METHOD)
    const awaitResponse = prepareAuditResponseWatcher(page, SERVICE_NAME, WRITE_METHOD)

    await fillAndSubmitNewIntervieweeModal(page)

    await request()   // confirma que la request fue enviada
    const auditResponse = await awaitResponse()

    expect(
      auditResponse?.status(),
      'La Edge Function debe responder 200 OK — cualquier otro código indica fallo server-side',
    ).toBe(200)
  })

  // ── Test 2: El payload de red tiene el shape correcto ─────────────────
  //
  // Intercepta el body enviado al Edge Function y verifica que los campos
  // mandatorios del contrato AuditLogInsert están presentes y bien formados.
  // Nota: user_id/user_email/user_role NO deben estar en el payload del cliente
  // (el servidor los añade desde el JWT — ADR-017 §seguridad).

  test('el payload enviado a log-audit-event cumple el contrato AuditLogInsert', async ({ page }) => {
    let capturedRequestBody: Record<string, unknown> | null = null

    // Capturamos SOLO el body de la llamada de escritura (service+method exactos).
    // fetchT1Data también tiene service_name='services.t1' y llegaría antes del submit.
    page.on('request', (req) => {
      if (EDGE_FN_PATTERN.test(req.url()) && req.method() === 'POST') {
        try {
          const body = (req.postDataJSON() ?? {}) as Record<string, unknown>
          if (body.service_name === SERVICE_NAME && body.method_name === WRITE_METHOD) {
            capturedRequestBody = body
          }
        } catch {
          // body no-JSON — dejar null para que la aserción falle con mensaje claro
        }
      }
    })

    const { request } = prepareAuditWatcher(page, SERVICE_NAME, WRITE_METHOD)
    await fillAndSubmitNewIntervieweeModal(page)
    await request()

    expect(capturedRequestBody, 'El body de la request no fue capturado').not.toBeNull()

    const body = capturedRequestBody!

    // ── Campos obligatorios del contrato ────────────────────────────────
    expect(typeof body.service_name, 'service_name debe ser string').toBe('string')
    expect(body.service_name, 'service_name debe identificar el servicio T1').toBe(SERVICE_NAME)

    expect(typeof body.method_name, 'method_name debe ser string').toBe('string')
    expect(
      body.method_name,
      'method_name debe ser el método de servicio invocado (upsertAllScoresForInterviewee)',
    ).toBe('upsertAllScoresForInterviewee')

    expect(
      body.status === 'success' || body.status === 'error',
      `status debe ser "success" o "error", recibido: ${String(body.status)}`,
    ).toBe(true)

    expect(typeof body.duration_ms, 'duration_ms debe ser número').toBe('number')
    expect(body.duration_ms as number, 'duration_ms debe ser no negativo').toBeGreaterThanOrEqual(0)

    // ── Seguridad: el cliente NO debe enviar campos de identidad ─────────
    // Si alguno de estos campos viaja en el payload, la Edge Function los
    // ignora, pero su presencia indica un bug en makeAuditable (ADR-017).
    expect(
      body.user_id,
      'SECURITY: user_id no debe viajar en el payload del cliente',
    ).toBeUndefined()
    expect(
      body.user_email,
      'SECURITY: user_email no debe viajar en el payload del cliente',
    ).toBeUndefined()
    expect(
      body.user_role,
      'SECURITY: user_role no debe viajar en el payload del cliente',
    ).toBeUndefined()
  })

  // ── Test 3: args_payload contiene los datos del nuevo entrevistado ───
  //
  // Verifica que makeAuditable serializa correctamente los argumentos
  // pasados al método de servicio. Esto garantiza trazabilidad forense:
  // un auditor puede reconstruir qué datos se intentaron persistir.

  test('args_payload refleja los datos del entrevistado creado', async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null

    page.on('request', (req) => {
      if (EDGE_FN_PATTERN.test(req.url()) && req.method() === 'POST') {
        try {
          const body = (req.postDataJSON() ?? {}) as Record<string, unknown>
          if (body.service_name === SERVICE_NAME && body.method_name === WRITE_METHOD) {
            capturedBody = body
          }
        } catch { /* ignorar */ }
      }
    })

    const { request } = prepareAuditWatcher(page, SERVICE_NAME, WRITE_METHOD)
    await fillAndSubmitNewIntervieweeModal(page)
    await request()

    expect(capturedBody, 'El body de la request debe haber sido capturado').not.toBeNull()

    // args_payload: makeAuditable serializa el spread `...args` del wrapper.
    // Como JSON puede llegar como array ([{...}]) u objeto ({0:{...}}) dependiendo
    // del entorno de serialización — buscamos el nombre del entrevistado en la
    // representación JSON completa del payload, que es la garantía que importa
    // para trazabilidad forense independientemente de la estructura exacta.
    const argsJson = JSON.stringify(capturedBody!.args_payload)
    expect(
      argsJson.includes(TEST_INTERVIEWEE.name),
      `El nombre "${TEST_INTERVIEWEE.name}" debe aparecer en args_payload. Payload recibido: ${argsJson.slice(0, 200)}`,
    ).toBe(true)
  })

  // ── Test 4: engagement_id viaja en metadata desde localStorage ────────
  //
  // makeAuditable lee el engagement activo de localStorage en call-time
  // (no en creación del proxy) y lo inyecta en metadata.engagement_id.
  // Este test verifica que el mecanismo funciona end-to-end en el browser real,
  // no solo en el entorno de unit tests con localStorage mockeado.

  test('metadata.engagement_id contiene el proyecto activo del seed', async ({ page }) => {
    let capturedBody: Record<string, unknown> | null = null

    page.on('request', (req) => {
      if (EDGE_FN_PATTERN.test(req.url()) && req.method() === 'POST') {
        try {
          const body = (req.postDataJSON() ?? {}) as Record<string, unknown>
          if (body.service_name === SERVICE_NAME && body.method_name === WRITE_METHOD) {
            capturedBody = body
          }
        } catch { /* ignorar */ }
      }
    })

    const { request } = prepareAuditWatcher(page, SERVICE_NAME, WRITE_METHOD)
    await fillAndSubmitNewIntervieweeModal(page)
    await request()

    expect(capturedBody).not.toBeNull()

    const metadata = capturedBody!.metadata as Record<string, unknown> | null | undefined

    // metadata puede ser null si makeAuditable no inyectó engagement_id — la aserción
    // distingue entre "metadata existe sin engagement_id" y "metadata no existe".
    expect(metadata, 'El campo metadata debe estar presente en el payload').not.toBeNull()
    expect(
      (metadata as Record<string, unknown>).engagement_id,
      `metadata.engagement_id debe ser el proyecto Toy Story (${LAB_PROJECT_ID})`,
    ).toBe(LAB_PROJECT_ID)
  })

  // ── Test 5: La Edge Function devuelve { success: true, logged: true } ─
  //
  // Verifica el contrato de respuesta del servidor. Si el INSERT falla
  // (RLS, schema drift, constraint violation), la Edge Function devuelve
  // { success: false, error: "..." } con HTTP 500.

  test('la Edge Function confirma la inserción con { success: true }', async ({ page }) => {
    const { request }   = prepareAuditWatcher(page, SERVICE_NAME, WRITE_METHOD)
    const awaitResponse = prepareAuditResponseWatcher(page, SERVICE_NAME, WRITE_METHOD)
    await fillAndSubmitNewIntervieweeModal(page)
    await request()

    const res = await awaitResponse()

    expect(res?.status()).toBe(200)

    let responseBody: Record<string, unknown>
    try {
      responseBody = await res!.json() as Record<string, unknown>
    } catch {
      throw new Error('La Edge Function no devolvió JSON válido')
    }

    expect(
      responseBody.success,
      `La Edge Function reportó fallo: ${JSON.stringify(responseBody)}`,
    ).toBe(true)

    expect(
      responseBody.logged,
      'La Edge Function debe confirmar la inserción con logged: true',
    ).toBe(true)
  })

  // ── Test 6: La acción del usuario no queda bloqueada por el log ────────
  //
  // makeAuditable es fire-and-forget: si la Edge Function tarda o falla,
  // la UI no debe congelarse ni mostrar error al usuario.
  // Verifica que el entrevistado aparece en la lista tras crear,
  // independientemente de lo que haga el sistema de auditoría.

  test('el sistema de auditoría no bloquea la acción del usuario', async ({ page }) => {
    // No necesitamos esperar el audit response — queremos verificar que
    // la UI responde sin bloqueo. Registramos el listener solo para
    // capturar si hay un error de red, pero no esperamos la respuesta.
    let auditCallFailed = false
    page.on('response', (res) => {
      if (EDGE_FN_PATTERN.test(res.url()) && res.status() >= 500) {
        auditCallFailed = true
      }
    })

    await fillAndSubmitNewIntervieweeModal(page)

    // El modal debe cerrarse — detectamos cierre por la desaparición del botón de submit,
    // no por el texto del título que también aparece en el botón CTA del ToolHeader.
    await expect(
      page.getByRole('button', { name: /crear entrevista/i }),
    ).not.toBeVisible({ timeout: 8_000 })

    // El nuevo entrevistado debe aparecer en la UI — el store actualizó el estado
    await expect(
      page.getByText(TEST_INTERVIEWEE.name, { exact: false }).first(),
    ).toBeVisible({ timeout: 10_000 })

    // Registrar si el audit falló (informativo — no hace fallar el test ya que
    // el comportamiento esperado es que el usuario NO sea afectado por el fallo)
    if (auditCallFailed) {
      console.warn('[audit.spec] La Edge Function devolvió 5xx — el log falló pero la UI siguió funcionando ✓')
    }
  })

  // ── Test 7: La Authorization header viaja con el JWT del usuario ───────
  //
  // La Edge Function rechaza requests sin Authorization (HTTP 401).
  // Verifica que fireAuditLog() envía el JWT de Supabase, lo que garantiza
  // que el servidor puede verificar la identidad del caller.

  test('la request a log-audit-event incluye el header Authorization con JWT', async ({ page }) => {
    let capturedAuthHeader: string | null = null

    // Filtramos por service+method para que la captura del header ocurra exactamente
    // en la request de escritura (no en fetchT1Data que se dispara al montar la vista).
    // El JWT es el mismo para todas las requests del usuario en la sesión.
    page.on('request', (req) => {
      if (EDGE_FN_PATTERN.test(req.url()) && req.method() === 'POST') {
        try {
          const body = (req.postDataJSON() ?? {}) as Record<string, unknown>
          if (body.service_name === SERVICE_NAME && body.method_name === WRITE_METHOD) {
            capturedAuthHeader = req.headers()['authorization'] ?? null
          }
        } catch { /* ignorar */ }
      }
    })

    const { request } = prepareAuditWatcher(page, SERVICE_NAME, WRITE_METHOD)
    await fillAndSubmitNewIntervieweeModal(page)
    await request()

    expect(
      capturedAuthHeader,
      'La request debe incluir el header Authorization',
    ).not.toBeNull()

    expect(
      capturedAuthHeader!.startsWith('Bearer '),
      `El header Authorization debe tener formato "Bearer <jwt>", recibido: ${capturedAuthHeader!.slice(0, 30)}…`,
    ).toBe(true)

    // El token debe ser un JWT con formato header.payload.signature
    const parts = capturedAuthHeader!.replace('Bearer ', '').split('.')
    expect(
      parts.length,
      'El JWT debe tener exactamente 3 partes (header.payload.signature)',
    ).toBe(3)
  })

  // ── Test 8: status es "success" cuando la operación DB tiene éxito ─────
  //
  // Verifica que makeAuditable registra "success" cuando el método de
  // servicio resuelve correctamente. Es la contraparte del test de error
  // que cubren los unit tests de makeAuditable.test.ts.

  test('status en el payload es "success" cuando el servicio resuelve', async ({ page }) => {
    let capturedStatus: unknown = null

    page.on('request', (req) => {
      if (EDGE_FN_PATTERN.test(req.url()) && req.method() === 'POST') {
        try {
          const body = (req.postDataJSON() ?? {}) as Record<string, unknown>
          if (body.service_name === SERVICE_NAME && body.method_name === WRITE_METHOD) {
            capturedStatus = body.status
          }
        } catch { /* ignorar */ }
      }
    })

    const { request } = prepareAuditWatcher(page, SERVICE_NAME, WRITE_METHOD)
    await fillAndSubmitNewIntervieweeModal(page)
    await request()

    expect(
      capturedStatus,
      'status debe ser "success" — si es "error", el UPSERT a Supabase falló',
    ).toBe('success')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Suite secundaria: resistencia a fallos del sistema de auditoría
// ═══════════════════════════════════════════════════════════════════════════
//
// Verifica la garantía fundamental de ADR-017:
//   "Un fallo en el log jamás interrumpe la acción legítima del usuario."
//
// No requiere que la Edge Function esté disponible — simula su ausencia
// bloqueando las requests a la Edge Function con page.route().

test.describe('Audit Trail — garantía de no-bloqueo ante fallos de red', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, USERS.consultor.email, USERS.consultor.password)
    await selectEngagement(page, LAB_PROJECT_ID)
    await goToT1AndWait(page)
  })

  test('la UI completa la acción aunque la Edge Function de auditoría no responda', async ({ page }) => {
    // Simular que la Edge Function de auditoría falla (503 Service Unavailable)
    await page.route(EDGE_FN_PATTERN, (route) => {
      void route.fulfill({ status: 503, body: JSON.stringify({ error: 'Service Unavailable' }) })
    })

    await fillAndSubmitNewIntervieweeModal(page)

    // La acción debe completarse: el botón de submit desaparece al cerrar el modal.
    // No usamos el texto "Nueva entrevista" porque también aparece en el botón CTA del header.
    await expect(
      page.getByRole('button', { name: /crear entrevista/i }),
    ).not.toBeVisible({ timeout: 8_000 })

    await expect(
      page.getByText(TEST_INTERVIEWEE.name, { exact: false }).first(),
    ).toBeVisible({ timeout: 10_000 })
  })
})
