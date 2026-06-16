// ============================================================
// makeAuditable — Proxy de auditoría genérico y type-safe
//
// Uso:
//   import * as companiesService from '@/services/companies.service'
//   import { makeAuditable }     from '@/lib/audit'
//
//   export const auditableCompanies = makeAuditable(companiesService, 'companies')
//   // auditableCompanies tiene el mismo tipo que companiesService — autocompletado intacto.
//
// Garantías:
//   - El tipado TypeScript del servicio original se preserva 100% (T → T).
//   - Solo instrumenta funciones cuyo retorno sea una Promise (async-safe).
//     Getters síncronos, utilidades y constantes pasan sin modificar.
//   - Un fallo en el log jamás interrumpe la acción legítima del usuario.
//   - El error original siempre se re-lanza para no alterar el flujo de la UI.
//   - Si args o response se truncan, metadata recibe response_truncated:true
//     para que los auditores puedan identificar entradas incompletas (ADR-017).
// ============================================================

import { fireAuditLog }                           from './auditClient'
import type { AuditLogInsert, AuditAIMetadata } from './types'
import type { Json }            from '@/types'

// ── Utilidades internas ────────────────────────────────────────────────────

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Devuelve el UUID del recurso afectado si está en el primer argumento. */
function extractResourceId(args: unknown[]): string | null {
  if (!args.length) return null
  const first = args[0]
  if (typeof first === 'string' && UUID_PATTERN.test(first)) return first
  if (typeof first === 'object' && first !== null && 'id' in first) {
    const id = (first as Record<string, unknown>).id
    if (typeof id === 'string' && UUID_PATTERN.test(id)) return id
  }
  return null
}

/**
 * Redacta campos sensibles recursivamente para que no lleguen a la BD de logs.
 * Se aplica ANTES de serializar, no después.
 */
const REDACTED_KEYS = new Set([
  'password', 'token', 'secret', 'apikey', 'api_key',
  'authorization', 'access_token', 'refresh_token', 'service_role_key',
])

function maskSensitive(value: unknown, depth = 0): unknown {
  if (depth > 10 || typeof value !== 'object' || value === null) return value
  if (Array.isArray(value)) return value.map(v => maskSensitive(v, depth + 1))
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      REDACTED_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : maskSensitive(v, depth + 1),
    ]),
  )
}

const MAX_RESPONSE_CHARS = 4_000

/**
 * Serializa de forma segura y, si `truncate` está activo y el resultado supera
 * MAX_RESPONSE_CHARS, devuelve un objeto centinela con `_truncated:true`.
 *
 * Devuelve `{ json, truncated }` para que el caller pueda propagar la señal de
 * truncación al campo `metadata` del log (requerimiento de auditoría — ADR-017).
 */
function safeSerialize(
  value: unknown,
  truncate = false,
): { json: Json; truncated: boolean } {
  try {
    const str = JSON.stringify(maskSensitive(value), (_key, val) =>
      typeof val === 'bigint' ? val.toString() : val,
    )
    if (truncate && str.length > MAX_RESPONSE_CHARS) {
      return {
        json:      { _truncated: true, _preview: str.slice(0, MAX_RESPONSE_CHARS) } as unknown as Json,
        truncated: true,
      }
    }
    return { json: JSON.parse(str) as Json, truncated: false }
  } catch {
    return { json: '[unserializable]' as unknown as Json, truncated: false }
  }
}

// ── Engagement ID desde localStorage ──────────────────────────────────────
//
// Zustand persist guarda el estado en 'lean-active-engagement'.
// Leer aquí en call-time (no en creación del proxy) garantiza que el valor
// esté disponible incluso tras un refresh del navegador, una vez que el
// middleware de persist ha hidratado el store.
//
// Formato del item: { state: { activeEngagementId: string | null }, version: number }
const ENGAGEMENT_STORAGE_KEY = 'lean-active-engagement'

function readEngagementIdFromStorage(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(ENGAGEMENT_STORAGE_KEY)
    if (raw == null) return null
    const stored = JSON.parse(raw) as { state?: { activeEngagementId?: unknown } }
    const id = stored?.state?.activeEngagementId
    return typeof id === 'string' && id.length > 0 ? id : null
  } catch {
    return null
  }
}

// ── Proxy factory ─────────────────────────────────────────────────────────

/**
 * Envuelve un objeto de servicio con un Proxy que intercepta exclusivamente
 * métodos asíncronos (los que devuelven una Promise) para registrar
 * automáticamente entradas, salidas y errores en `audit_logs`.
 *
 * Los métodos síncronos, getters y propiedades no-función pasan
 * directamente sin ningún wrapping, preservando su naturaleza síncrona
 * y evitando side-effects inesperados en el caller.
 *
 * @param service         Objeto de servicio a instrumentar (namespace import o plain object).
 * @param serviceName     Nombre descriptivo que aparecerá en el campo `service_name` del log.
 * @param defaultMetadata Metadatos adicionales incluidos en cada log de este servicio.
 *                        Útil para enriquecer servicios de IA con tool_code, company_id, etc.
 *
 * @returns El mismo objeto `service` con el tipo `T` exacto — autocompletado y tipos intactos.
 */
export function makeAuditable<T extends Record<string, unknown>>(
  service: T,
  serviceName: string,
  defaultMetadata: Partial<AuditAIMetadata> = {},
): T {
  return new Proxy(service, {
    get(target, prop: string | symbol): unknown {
      // Symbols (Symbol.iterator, Symbol.toPrimitive, etc.) se delegan sin modificar.
      if (typeof prop === 'symbol') return Reflect.get(target, prop)

      const original = target[prop as keyof T]

      // Propiedades no-función (constantes, tipos exportados) pasan sin tocar.
      if (typeof original !== 'function') return original

      // Wrapper NO async: llamamos al original primero y comprobamos si devuelve
      // una Promise antes de instrumentar.  Esto garantiza que los métodos
      // síncronos nunca quedan envueltos en una Promise implícita.
      return function (...args: unknown[]): unknown {
        const startedAt = performance.now()
        const raw       = (original as (...a: unknown[]) => unknown)(...args)

        // ── Método síncrono: pass-through sin auditar ──────────────────────
        if (raw == null || typeof (raw as Promise<unknown>).then !== 'function') {
          return raw
        }

        // ── Método asíncrono: instrumentar la Promise ─────────────────────
        //
        // ctx, correlationId y enrichedMeta se capturan sincrónicamente aquí.
        //
        // RACE-CONDITION FIX: correlationId ya NO proviene de un estado global
        // de módulo. Viene de defaultMetadata.correlation_id, que es una
        // propiedad de la closure de esta instancia del Proxy. Cada instancia
        // de makeAuditable tiene su propio defaultMetadata independiente.
        // Dos Promise.all() paralelas con proxies distintos nunca comparten ni
        // sobreescriben el mismo valor.
        //
        // project_id: preferencia explícita en defaultMetadata; si no está,
        // se lee de localStorage en call-time (disponible tras hydration).
        const correlationId = (defaultMetadata.correlation_id as string | null | undefined) ?? null
        const engagementId = (defaultMetadata.engagement_id as string | undefined)
          ?? readEngagementIdFromStorage()

        // Construir metadata JSONB:
        //   - correlation_id se excluye (va a su propia columna en la BD)
        //   - engagement_id se enriquece desde localStorage si no fue explícito
        const { correlation_id: _omit, ...baseMetadata } = defaultMetadata as Record<string, unknown>
        const enrichedMeta: Record<string, unknown> = engagementId != null
          ? { ...baseMetadata, engagement_id: engagementId }
          : { ...baseMetadata }

        return (raw as Promise<unknown>).then(
          // ── Éxito ──────────────────────────────────────────────────────
          (response) => {
            const duration_ms    = Math.round(performance.now() - startedAt)
            const argsResult     = safeSerialize(args, true)
            const responseResult = safeSerialize(response, true)
            const anyTruncated   = argsResult.truncated || responseResult.truncated

            // El contexto de usuario (id, email, rol) se añade en la Edge Function.
            const entry: Omit<AuditLogInsert, 'id' | 'created_at' | 'user_id' | 'user_email' | 'user_role'> = {
              service_name:     serviceName,
              method_name:      prop as string,
              args_payload:     argsResult.json,
              status:           'success',
              response_payload: responseResult.json,
              error_message:    null,
              error_stack:      null,
              duration_ms,
              resource_id:      extractResourceId(args),
              correlation_id:   correlationId,
              metadata:         safeSerialize(
                anyTruncated
                  ? { ...enrichedMeta, response_truncated: true }
                  : enrichedMeta,
              ).json,
            }

            fireAuditLog(entry)
            return response
          },

          // ── Error ───────────────────────────────────────────────────────
          (error) => {
            const duration_ms = Math.round(performance.now() - startedAt)
            const errObj      = error instanceof Error ? error : new Error(String(error))
            const argsResult  = safeSerialize(args, true)

            // El contexto de usuario (id, email, rol) se añade en la Edge Function.
            const entry: Omit<AuditLogInsert, 'id' | 'created_at' | 'user_id' | 'user_email' | 'user_role'> = {
              service_name:     serviceName,
              method_name:      prop as string,
              args_payload:     argsResult.json,
              status:           'error',
              response_payload: null,
              error_message:    errObj.message,
              error_stack:      errObj.stack ?? null,
              duration_ms,
              resource_id:      extractResourceId(args),
              correlation_id:   correlationId,
              metadata:         safeSerialize(
                argsResult.truncated
                  ? { ...enrichedMeta, response_truncated: true }
                  : enrichedMeta,
              ).json,
            }

            fireAuditLog(entry)

            // Re-lanza SIEMPRE — el Proxy es transparente para la UI y los stores.
            throw error
          },
        )
      }
    },
  }) as T
}
