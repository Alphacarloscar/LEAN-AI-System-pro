// ============================================================
// Audit Business Events — Capa de eventos de negocio explícitos
//
// Eventos que se registran SIEMPRE, independientemente del modo intensivo.
// Reutiliza fireAuditLog internamente, pasando service_name='business'
// y enriqueciendo con event_type/entity_type/company_id/project_id.
//
// Patrón: llamar a fireBusinessAuditEvent() después de una acción
// en el servicio (login, logout, cambio de estado, etc.)
// ============================================================

import { fireAuditLog } from './auditClient'
import type { AuditLogInsert } from './types'
import type { Json } from '@/types'

export interface BusinessAuditEventInput {
  event_type: string           // ej: 'user.login', 'project.status_changed'
  entity_type: string          // ej: 'user', 'project', 'company'
  entity_id: string            // UUID del recurso afectado (user_id, project_id, etc.)
  company_id?: string | null
  project_id?: string | null
  payload: Record<string, unknown>  // ya enmascarado por el caller
  metadata?: Record<string, unknown>
}

/**
 * Dispara un evento de auditoría de negocio.
 * Se registra SIEMPRE (mode intensivo no lo gatea).
 *
 * Internamente:
 *   - service_name: 'business'
 *   - method_name: event_type (para reutilizar la índice de RPC)
 *   - resource_id: entity_id (compatibilidad con schema existente)
 *   - event_type, entity_type, company_id, project_id: se pasan al insert
 *
 * No propaga excepciones — fallo en log no interrumpe la acción de usuario (ADR-010).
 */
export function fireBusinessAuditEvent(event: BusinessAuditEventInput): void {
  const entry: Omit<AuditLogInsert, 'id' | 'created_at' | 'user_id' | 'user_email' | 'user_role'> = {
    service_name: 'business',
    method_name: event.event_type,
    args_payload: event.payload as Json,
    status: 'success',
    response_payload: null,
    error_message: null,
    error_stack: null,
    duration_ms: 0,
    resource_id: event.entity_id,
    correlation_id: null,
    metadata: (event.metadata ?? {}) as Json,
  }

  // Estos campos no existen en AuditLogInsert (tipo generado),
  // así que los pasamos fuera de la estructura formal y confiamos
  // en que la Edge Function log-audit-event los aceptará en el body.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(entry as any).event_type = event.event_type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(entry as any).entity_type = event.entity_type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(entry as any).company_id = event.company_id ?? null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(entry as any).project_id = event.project_id ?? null

  fireAuditLog(entry)
}
