# ADR-027 — Intercepción de Edge Functions en E2E con page.route()

**Status:** ACCEPTED
**Date:** 2026-07-02
**Proposed by:** Carlos Sánchez (Alpha Consulting)
**Approved by:** Carlos Sánchez — 2026-07-02
**Supersedes:** —
**Superseded by:** —

---

## Context

Los tests E2E de auditoría (`e2e/audit.spec.ts`) necesitan verificar que:
1. La llamada HTTP a `log-audit-event` se disparó con el body correcto (`service_name`, `method_name`).
2. La Edge Function respondió `{ success: true }` con HTTP 200.

`log-audit-event` usa `EdgeRuntime.waitUntil()`: responde HTTP 200 en ~200 ms (solo `auth.getUser()` + validación de body); el INSERT en `audit_logs` se ejecuta en background. El cliente (`supabase.functions.invoke()`) recibe la respuesta y libera la Promise en ~200 ms.

Se probaron tres mecanismos Playwright antes de llegar a la solución definitiva. Los tres fallaron por razones relacionadas con cómo CDP expone los datos de red al browser headless:

**Mecanismo A — `page.on('request') + WeakSet + page.waitForResponse()`**
`res.request()` en el callback de `waitForResponse` devuelve una instancia de objeto **distinta** al `Request` capturado en `page.on('request', ...)` bajo Chromium headless cuando la respuesta cruza una barrera CORS. `WeakSet.has(res.request())` siempre devuelve `false` → timeout.

**Mecanismo B — `page.waitForRequest() + req.response()`**
Playwright captura el request correctamente, pero `req.response()` devuelve `null`. Causa: CDP registra el request como "abortado" — porque `supabase.functions.invoke()` es fire-and-forget a nivel de SDK y Chromium marca el ciclo de vida del request cerrado antes de emitir el evento de respuesta a la capa Playwright.

**Mecanismo C — `page.waitForResponse() + res.request().postDataJSON()`**
`page.waitForResponse()` recibe el evento CDP `Network.responseReceived`. Ese evento **no incluye el body del request**. `res.request().postDataJSON()` devuelve `null` dentro del callback de `waitForResponse` → el predicado de filtro siempre devuelve `false` → timeout de 90 s.

## Decision

Usar `page.route()` + `route.fetch()` para interceptar y verificar las llamadas a la Edge Function `log-audit-event`.

```ts
function prepareAuditResponseWatcher(
  page:        Page,
  serviceName: string,
  methodName:  string,
): () => Promise<APIResponse> {
  let resolve!: (r: APIResponse) => void
  let reject!:  (e: Error) => void
  const resPromise = new Promise<APIResponse>((res, rej) => { resolve = res; reject = rej })

  void page.route(EDGE_FN_PATTERN, async (route) => {
    const req = route.request()
    if (req.method() !== 'POST') { await route.continue(); return }
    try {
      const body = (req.postDataJSON() ?? {}) as Record<string, unknown>
      if (body.service_name === serviceName && body.method_name === methodName) {
        const response = await route.fetch()   // llamada HTTP real al servidor
        resolve(response)
        await route.fulfill({ response })      // permite que el browser reciba la respuesta
        return
      }
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)))
      try { await route.abort() } catch { /* ignorar */ }
      return
    }
    await route.continue()
  })

  return () => resPromise
}
```

**Por qué funciona:** `page.route()` intercepta el request **antes** de que el browser lo envíe a la red. En ese contexto (antes de que CDP transfiera el control al stack de red), `req.postDataJSON()` tiene acceso completo al body del request. `route.fetch()` realiza la llamada HTTP real y devuelve una `APIResponse` Playwright con `.status()` y `.json()` completos. El test no modifica ni bloquea la request — la transparencia es total para el código bajo prueba.

La Promise `resPromise` se registra **antes** de cualquier acción del usuario, eliminando la race condition clásica "espero una respuesta de algo que ya ocurrió".

## Alternatives considered

| Option | Pros | Cons | Why rejected |
|--------|------|------|--------------|
| **`page.route() + route.fetch()`** | Acceso al body antes de enviar; respuesta HTTP real; sin race condition | Requiere `void` handler asíncrono; ruta queda registrada para toda la página | — (elegida) |
| WeakSet + waitForResponse | Parecía correcto conceptualmente | `res.request()` es instancia distinta al Request capturado (Chromium headless CORS) | FAILED — WeakSet.has() siempre false |
| waitForRequest + req.response() | Sencillo | `req.response()` devuelve `null` (fire-and-forget SDK marca request como abortado) | FAILED — null response |
| waitForResponse + postDataJSON() | Acceso directo a la respuesta | CDP Network.responseReceived no incluye body del request; postDataJSON() → null | FAILED — predicado siempre false, timeout 90 s |
| Consultar audit_logs via API REST | Verifica persistencia real en DB | Requiere credenciales de servicio en E2E; introduce dependencia de datos; no verifica la llamada HTTP en sí | Fuera de alcance de los tests de red |

## Consequences

### Positive
- Tests 1 y 5 de `audit.spec.ts` pasan de forma determinista: la respuesta HTTP real (`status: 200`, `body: { success: true }`) queda verificada.
- El mecanismo es agnóstico al cold-start del servidor: `page.route()` intercepta en el cliente; `route.fetch()` espera la respuesta real con el timeout configurado (`EDGE_FN_TIMEOUT = 90_000`).
- Los mecanismos descartados y sus causas raíz quedan documentados en el comentario del helper en `e2e/audit.spec.ts:131-151` — evita que futuros mantenedores repitan los intentos fallidos.

### Negative / Trade-offs accepted
- `page.route()` registra la ruta para **toda la página** durante la vida del test. Requests a `log-audit-event` de otras llamadas (no relacionadas con el método bajo prueba) pasarán por el handler y serán ignoradas vía `route.continue()`. Sin coste observable dado que los tests auditan un único método por test.
- El `void` en `void page.route(...)` descarta la Promise que registra la ruta. Esto es intencional: la ruta queda activa hasta que la página se cierra. Si se hiciera `await`, el código subsiguiente no esperaría el registro (la ruta ya está activa), pero el `void` hace explícita la intencionalidad.

### Constraints introduced
- Cualquier test E2E que necesite verificar el body **y** la respuesta de `log-audit-event` debe usar `prepareAuditResponseWatcher`. No usar `waitForResponse` + `postDataJSON()` para filtrar — siempre devuelve `null` en el callback de response (CDP no incluye request body en `Network.responseReceived`).
- Si en el futuro la Edge Function devuelve algo distinto de `{ success: true }` en la respuesta inmediata (el `ok()` de `index.ts`), los tests 1 y 5 fallarán — lo cual es correcto: el cambio de contrato debe actualizar los tests.

---

## Regla derivada para futuros tests de Edge Functions

> Cuando necesites verificar el body del request **y** la respuesta HTTP de una Edge Function en Playwright:
> 1. Usa `page.route(urlPattern, async (route) => { ... })` registrado ANTES de la acción del usuario.
> 2. Dentro del handler: `req.postDataJSON()` para filtrar por body; `route.fetch()` para obtener la respuesta real; `route.fulfill({ response })` para no bloquear el browser.
> 3. NO uses `waitForResponse + res.request().postDataJSON()` — CDP no incluye el body del request en el evento de respuesta.
> 4. NO uses `waitForRequest + req.response()` — devuelve `null` con SDKs que hacen fire-and-forget del fetch.

---
*AI-Ready Repository System v2.1.0 — docs/decisions/technical/*
