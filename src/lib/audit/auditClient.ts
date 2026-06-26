// ============================================================
// Audit Client — escritor fire-and-forget hacia Supabase
//
// Garantías de diseño:
//   1. NUNCA propaga excepciones al caller — su propio try/catch lo aisla.
//   2. Usa el cliente supabase existente (no crea conexión nueva).
//   3. Fallos de red, RLS o caída de Supabase se reportan siempre vía
//      reportError('audit.write', err) — ADR-010 prohíbe el silenciamiento.
//
// Nota de tipos: audit_logs no está en database.types.ts (tabla pendiente de
// migración SQL — ADR-017). Se castea a SupabaseClient sin genérico para que
// el insert acepte la tabla sin error de tipo. El cast se elimina en cuanto
// database.types.ts se regenere con la nueva tabla.
// ============================================================

import { supabase }            from '@/lib/supabase'
import { reportError }         from '@/lib/reportError'
import type { AuditLogInsert } from './types'

// El cliente solo envía los datos del evento. El contexto de usuario (id, email, rol)
// se añade de forma segura en la Edge Function 'log-audit-event'.
type AuditLogEntry = Omit<AuditLogInsert, 'id' | 'created_at' | 'user_id' | 'user_email' | 'user_role'>;

/**
 * Inserta un registro de auditoría de forma asíncrona sin bloquear al caller.
 * Patrón fire-and-forget: el IIFE async tiene su propio try/catch
 * y no devuelve la Promise al exterior.
 *
 * Esta función enriquece automáticamente el log con la información del
 * usuario de la sesión activa (ID, email, rol). (DEPRECATED: Ahora gestionado por la Edge Function).
 */
export function fireAuditLog(entry: AuditLogEntry): void {
  void (async () => {
    try {
      // En lugar de una inserción directa (bloqueada por RLS), invocamos una Edge Function segura.
      // La Edge Function se encarga de añadir el contexto de usuario (id, email, rol).
      const { error } = await supabase.functions.invoke('log-audit-event', {
        body: entry,
      })

      if (error != null) {
        reportError('audit.write', new Error(`[AuditLog] Invoke failed: ${error.message}`))
      }
    } catch (err) {
      reportError('audit.write', err)
    }
  })()
}
