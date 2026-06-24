// ============================================================
// Audit Logging — Tipos de datos centrales
//
// AuditLogInsert define el contrato exacto con la tabla audit_logs.
// Cuando la tabla exista en Supabase, reemplazar esta interfaz por:
//   Database['public']['Tables']['audit_logs']['Insert']
// ============================================================

import type { Json } from '@/types'

export type AuditStatus = 'success' | 'error'

/**
 * Payload enviado a la tabla `audit_logs`.
 * Diseñado para ser compatible con el Insert type de Supabase
 * una vez que la tabla exista en la BD.
 */
export interface AuditLogInsert {
  // ── Quién ────────────────────────────────────────────────────
  user_id:    string | null
  user_email: string | null
  user_role:  string | null

  // ── Qué (servicio + método interceptado) ─────────────────────
  service_name: string   // ej: 'companies', 'projects', 't1'
  method_name:  string   // ej: 'createCompany', 'upsertT1Score'

  // ── Entrada ──────────────────────────────────────────────────
  args_payload: Json     // argumentos serializados con campos sensibles redactados

  // ── Salida ───────────────────────────────────────────────────
  status:           AuditStatus
  response_payload: Json | null  // respuesta truncada si supera MAX_RESPONSE_BYTES
  error_message:    string | null
  error_stack:      string | null

  // ── Rendimiento ──────────────────────────────────────────────
  duration_ms: number

  // ── Contexto del recurso ─────────────────────────────────────
  resource_id: string | null  // UUID extraído del primer argumento si aplica

  // ── Trazabilidad forense ──────────────────────────────────────
  // UUID generado una vez por acción de usuario en la UI y propagado
  // a todos los logs derivados de esa misma interacción.
  // Permite reconstruir el grafo completo de una acción:
  //   SELECT * FROM audit_logs WHERE correlation_id = $1 ORDER BY created_at
  correlation_id?: string | null

  // ── Metadatos extensibles ────────────────────────────────────
  // Campo libre para enriquecer el log sin alterar el esquema.
  // Usar AuditAIMetadata para llamadas a Edge Functions de IA.
  metadata: Json
}

/** Row completa que devuelve Supabase tras el INSERT */
export interface AuditLogRow extends AuditLogInsert {
  id:         string
  created_at: string
}

/**
 * Estructura recomendada para el campo `metadata` en llamadas de IA.
 * Permite correlacionar logs de auditoría con ejecuciones de herramientas.
 *
 * `correlation_id` se pasa aquí para agrupar una ráfaga de llamadas de UI
 * en un ID compartido — el Proxy lo lee desde esta closure en lugar de un
 * estado global de módulo (que causaría race conditions en Promise.all).
 * El valor va a la columna `audit_logs.correlation_id`, NO al JSONB metadata.
 */
export interface AuditAIMetadata {
  tool_code?:      string          // 'T1' ... 'T12'
  engagement_id?:  string          // proyecto activo; fallback automático a localStorage
  company_id?:     string
  prompt_tokens?:  number
  model?:          string
  correlation_id?: string | null   // ID de acción UI compuesta — pasa al Proxy, no al JSONB
  [key: string]:   unknown         // extensible sin romper el tipo
}

/** Contexto de usuario que el Proxy captura en cada intercepción */
export interface AuditUserContext {
  user_id:    string
  user_email: string
  user_role:  string
}

/**
 * Fila de la tabla `audit_access_logs` — meta-auditoría de accesos
 * al historial por parte del superadmin.
 * Solo el superadmin puede leer esta tabla (RLS).
 * Ningún usuario puede insertar directamente: solo la función
 * log_audit_access() SECURITY DEFINER lo hace desde el servidor.
 */
export interface AuditAccessLogRow {
  id:             string
  accessed_at:    string
  user_id:        string
  user_email:     string | null
  user_role:      string | null
  query_filters:  Json
  rows_returned:  number | null
}
