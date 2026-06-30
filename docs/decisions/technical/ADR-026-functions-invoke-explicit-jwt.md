# ADR-026 — Toda llamada a supabase.functions.invoke() debe pasar Authorization JWT explícitamente

**Estado:** Aceptado  
**Fecha:** 2026-06-30  
**Área:** Edge Functions / Autenticación  
**Relacionado:** ADR-017 (audit trail), ADR-025 (audit test-mode)

## Contexto

`supabase-js` v2 envía el `anon key` en el header `Authorization` por defecto
al llamar a `supabase.functions.invoke()`, incluso cuando el usuario está
autenticado y hay una sesión activa con `access_token` válido.

Las Edge Functions que llaman a `supabase.auth.getUser()` para identificar
al caller reciben `{ user: null }` cuando el header contiene el anon key →
devuelven `401 "Invalid token"` o `403 "Unauthorized"`.

**Síntoma confirmado en producción:**
- `log-audit-event`: 0 filas en `audit_logs` a pesar de que el upsert T1
  completaba con éxito. Los logs de Invocations en Supabase Dashboard
  mostraban `role: "anon"` en el JWT payload → 401 sistemático.
- El bug afectaba silenciosamente a todas las Edge Functions del proyecto
  que dependen de la identidad del caller.

## Decisión

**Toda llamada a `supabase.functions.invoke()` en este proyecto debe leer el
`access_token` de la sesión activa y pasarlo explícitamente:**

```ts
const { data: { session } } = await supabase.auth.getSession()
if (!session?.access_token) {
  // abortar o manejar el caso sin sesión
  return
}

const { error } = await supabase.functions.invoke('nombre-funcion', {
  body: payload,
  headers: { Authorization: `Bearer ${session.access_token}` },
})
```

El helper `getAuthHeader()` en `auditClient.ts` encapsula este patrón para
el audit trail. Para otros servicios, replicar el patrón inline.

## Helper compartido

`src/lib/getAuthHeader.ts` encapsula el patrón — importar desde ahí en todos los call sites:

```ts
import { getAuthHeader } from '@/lib/getAuthHeader'

const headers = await getAuthHeader()
if (!headers) throw new Error('[<context>] Sesión expirada — vuelve a iniciar sesión')
await supabase.functions.invoke('<fn>', { body, headers })
```

Para el audit trail (fire-and-forget), si no hay sesión se descarta silenciosamente en lugar de lanzar.

## Call sites auditados — 4/4 ✅

| Archivo | Función invocada | Edge Fn verifica caller | Estado |
|---|---|---|---|
| `src/lib/audit/auditClient.ts` | `log-audit-event` | ✅ `getUser()` | ✅ Corregido |
| `src/hooks/useEdgeFunctionInvoke.ts` | `ai-recommend` | ✅ `getUser()` línea 749 | ✅ Corregido |
| `src/services/companies.service.ts` | `invite-user` | ✅ `getUser()` línea 41 | ✅ Corregido |
| `src/services/companies.service.ts` | `delete-user` | ✅ `getUser()` línea 42 | ✅ Corregido |

Auditoría server-side: las 3 Edge Functions verifican `getUser()` y devuelven 401 si falla — sin vulnerabilidades de autenticación.

## Consecuencias

**Positivas:**
- La Edge Function recibe el JWT del usuario autenticado → `getUser()` resuelve correctamente.
- `audit_logs` empieza a recibir filas en producción.
- El patrón centralizado en `getAuthHeader.ts` es fácil de auditar con `grep "getAuthHeader"`.
- `ai-recommend`, `invite-user` y `delete-user` dejan de fallar silenciosamente con anon key.

**Negativas / trade-offs:**
- Requiere `await getAuthHeader()` antes de cada invoke — latencia mínima (~0ms si la sesión está en memoria).
- Si no hay sesión activa, el audit se descarta; los otros servicios lanzan error visible al usuario.

## Alternativas descartadas

- **Confiar en supabase-js para propagar el token**: no funciona en v2 para
  `functions.invoke()` en el contexto de este proyecto.
- **Pasar el token en el body**: violaría ADR-017 (el servidor extrae la
  identidad del JWT, no del body) y expondría el token como dato de aplicación.
