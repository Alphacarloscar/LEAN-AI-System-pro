# ADR-025 — Modo awaitable de auditoría para E2E

**Estado:** Aceptado  
**Fecha:** 2026-06-30  
**Área:** Audit trail / Testing E2E  
**Relacionado:** ADR-017 (audit trail fire-and-forget)

## Contexto

`makeAuditable` usa el patrón fire-and-forget para invocar la Edge Function
`log-audit-event`: `fireAuditLog` envuelve la Promise en un IIFE void que
no se expone al caller. Esto cumple ADR-017: un fallo en el log nunca
interrumpe la acción legítima del usuario.

En tests E2E, `afterEach` navega a `/` inmediatamente tras la acción bajo
prueba. Si el Proxy ya devolvió el control (el upsert T1 completó) pero la
Edge Function aún no terminó el INSERT en `audit_logs`, Playwright cancela
la página y la request HTTP se corta. Resultado: 480 filas en
`t1_dimension_scores`, 0 filas en `audit_logs` — 100% reproducible en CI.

## Decisión

Se añade un modo awaitable opt-in activado exclusivamente en E2E mediante
una variable de ventana inyectada por Playwright antes de cada test:

```ts
// e2e/audit.spec.ts — beforeEach
await page.addInitScript(() => {
  window.__E2E_AWAIT_AUDIT__ = true
})
```

`makeAuditable` lee `globalThis.__E2E_AWAIT_AUDIT__` en los dos callbacks
del `.then()` (éxito y error). Si está activo, llama a
`fireAuditLogAwaitable` (nueva exportación de `auditClient.ts`) y espera
a que el INSERT complete antes de devolver. Si no está activo, comportamiento
de producción: `fireAuditLog` fire-and-forget.

```ts
// makeAuditable.ts — rama éxito
if ((globalThis as Record<string, unknown>)['__E2E_AWAIT_AUDIT__'] === true) {
  await fireAuditLogAwaitable(entry).catch((err) => reportError('audit.write', err))
} else {
  fireAuditLog(entry)
}
```

## Consecuencias

**Positivas:**
- Los tests E2E pueden verificar que `audit_logs` recibió filas reales.
- El código de producción no cambia su comportamiento ni su rendimiento.
- El flag solo existe en el contexto del browser de test — nunca en PRO/PRE.

**Negativas / trade-offs:**
- `fireAuditLogAwaitable` lanza si la Edge Function devuelve error. El
  `.catch(() => reportError(...))` en `makeAuditable` lo atrapa y reporta
  sin interrumpir el caller — compatible con ADR-010.
- Los callbacks del `.then()` pasan a ser `async`, lo que hace que la
  Promise devuelta al caller sea `Promise<Promise<unknown>>` en modo E2E.
  JavaScript aplana automáticamente Promises anidadas, por lo que el
  comportamiento observable es idéntico.
- Si `__E2E_AWAIT_AUDIT__` no se inyecta (test sin `addInitScript`), el
  comportamiento es exactamente el de producción.

## Alternativas descartadas

- **`import.meta.env.MODE === 'test'`**: contaminaría el bundle de producción
  con código de test; además el MODE en Vite E2E no es `'test'` sino
  `'production'` al servir la app real.
- **Flag en `import.meta.env.VITE_E2E`**: requiere variable de entorno en CI
  que cambiaría el bundle — viola el principio de builds idénticos PRE/PRO.
