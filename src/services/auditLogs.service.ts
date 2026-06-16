// ============================================================
// AuditLogs Service — acceso privilegiado al historial de auditoría
//
// Este servicio es el ÚNICO punto de acceso permitido a la tabla
// audit_logs desde la aplicación (ADR-011: no imports directos de
// Supabase en Views/Stores).
//
// Acceso vía RPC SECURITY DEFINER (ADR-019):
//   Toda consulta al historial de auditoría pasa obligatoriamente por
//   la función PostgreSQL get_audit_logs(filters jsonb), que:
//     1. Verifica server-side que el llamante es superadmin.
//     2. Inserta en audit_access_logs ANTES de ejecutar el SELECT
//        (traza inmutable: imposible leer sin quedar registrado).
//     3. Retorna las filas filtradas.
//
//   La meta-auditoría ya NO se gestiona desde TypeScript: eliminada la
//   función emitMetaAuditLog() que existía antes de ADR-019. La traza
//   es ahora una invariante del motor de base de datos, no de la capa
//   de servicio — no puede esquivarse desde el SQL Editor ni PostgREST.
//
// Tablas accedidas:
//   - audit_logs          (solo vía RPC get_audit_logs — superadmin)
//   - audit_access_logs   (solo lectura superadmin; escritura solo SECURITY DEFINER)
//
// Relacionado: ADR-017, ADR-018, ADR-019,
//              migration 20260615_005_correlation_meta_audit.sql,
//              migration 20260615_006_get_audit_logs_secure.sql
// ============================================================

import { supabase }    from '@/lib/supabase'
import { reportError } from '@/lib/reportError'
import type { AuditLogRow, AuditAccessLogRow } from '@/lib/audit'

// Cast temporal hasta que database.types.ts incluya las nuevas tablas.
// Ver DEBT-018 para el plan de eliminación de este cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as any

// ── Filtros públicos ──────────────────────────────────────────────────────

export interface AuditLogQueryFilters {
  userId?:        string
  serviceName?:   string
  status?:        'success' | 'error'
  fromDate?:      string   // ISO 8601
  toDate?:        string   // ISO 8601
  correlationId?: string   // agrupa todos los logs de una misma acción UI
  limit?:         number   // default 500, max 1000
}

// ── Consulta principal ────────────────────────────────────────────────────

/**
 * Consulta el historial de auditoría a través de la función SECURITY DEFINER
 * get_audit_logs(). La función verifica que el llamante es superadmin y
 * registra el acceso en audit_access_logs de forma atómica e inmutable
 * antes de retornar los datos.
 *
 * No emite meta-audit desde TypeScript: esa responsabilidad fue movida
 * a la capa de base de datos (ADR-019) para garantizar la traza incluso
 * si el acceso se realiza directamente vía SQL Editor o PostgREST.
 *
 * @throws Error con prefijo [AuditLogs] si Supabase o la función DB falla.
 */
export async function queryAuditLogs(
  filters: AuditLogQueryFilters = {},
): Promise<AuditLogRow[]> {
  const { data, error } = await db.rpc('get_audit_logs', {
    filters: filters as unknown as Record<string, unknown>,
  })

  if (error != null) {
    reportError(
      'auditLogs.queryAuditLogs',
      new Error(`[AuditLogs] get_audit_logs RPC: ${(error as { message: string }).message}`),
    )
    throw new Error(`[AuditLogs] queryAuditLogs: ${(error as { message: string }).message}`)
  }

  return (data ?? []) as AuditLogRow[]
}

// ── Meta-auditoría — lectura ──────────────────────────────────────────────

/**
 * Devuelve el registro de accesos al historial (quién consultó los logs y cuándo).
 * Solo el superadmin puede leer esta tabla (reforzado por RLS en audit_access_logs).
 *
 * Esta consulta NO genera un nuevo meta-audit entry para evitar recursión.
 *
 * @throws Error con prefijo [AuditLogs] si Supabase falla.
 */
export async function getAuditAccessLogs(limit = 200): Promise<AuditAccessLogRow[]> {
  const { data, error } = await db
    .from('audit_access_logs')
    .select('*')
    .order('accessed_at', { ascending: false })
    .limit(Math.min(limit, 1_000))

  if (error != null) {
    throw new Error(`[AuditLogs] getAuditAccessLogs: ${(error as { message: string }).message}`)
  }

  return (data ?? []) as AuditAccessLogRow[]
}
