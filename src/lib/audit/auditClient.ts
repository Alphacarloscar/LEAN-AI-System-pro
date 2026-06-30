// ============================================================
// Audit Client — escritor fire-and-forget hacia Supabase
//
// Garantías de diseño:
//   1. NUNCA propaga excepciones al caller — su propio try/catch lo aisla.
//   2. Usa el cliente supabase existente (no crea conexión nueva).
//   3. Fallos de red, RLS o caída de Supabase se reportan siempre vía
//      reportError('audit.write', err) — ADR-010 prohíbe el silenciamiento.
//
// FIX (2026-06-30 — ADR-026): supabase.functions.invoke() no propaga el
// JWT del usuario autenticado automáticamente → enviaba el anon key →
// Edge Function getUser() recibía { user: null } → 401 "Invalid token".
// Ahora leemos el access_token de la sesión activa y lo pasamos en el
// header Authorization explícitamente. Si no hay sesión activa, el audit
// se descarta (un audit sin usuario es inválido por diseño — ADR-017).
// ============================================================

import { supabase }            from '@/lib/supabase'
import { reportError }         from '@/lib/reportError'
import type { AuditLogInsert } from './types'

// El cliente solo envía los datos del evento. El contexto de usuario (id, email, rol)
// se añade de forma segura en la Edge Function 'log-audit-event'.
type AuditLogEntry = Omit<AuditLogInsert, 'id' | 'created_at' | 'user_id' | 'user_email' | 'user_role'>

/** Obtiene el Authorization header con el JWT de la sesión activa.
 *  Devuelve null si no hay sesión — el caller debe abortar el audit. */
async function getAuthHeader(): Promise<{ Authorization: string } | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  return { Authorization: `Bearer ${session.access_token}` }
}

/**
 * Inserta un registro de auditoría de forma asíncrona sin bloquear al caller.
 * Patrón fire-and-forget: el IIFE async tiene su propio try/catch
 * y no devuelve la Promise al exterior.
 */
export function fireAuditLog(entry: AuditLogEntry): void {
  void (async () => {
    try {
      const headers = await getAuthHeader()
      // Sin sesión activa el audit no tiene sentido — Edge Function lo rechazaría igualmente.
      if (!headers) return

      const { error } = await supabase.functions.invoke('log-audit-event', {
        body: entry,
        headers,
      })

      if (error != null) {
        reportError('audit.write', new Error(`[AuditLog] Invoke failed: ${error.message}`))
      }
    } catch (err) {
      reportError('audit.write', err)
    }
  })()
}

/**
 * Versión awaitable de fireAuditLog para entornos E2E (ADR-025).
 * Devuelve la Promise sin envolverla en IIFE, permitiendo que el caller
 * espere a que el INSERT en audit_logs complete antes de que el test
 * cierre la página. Lanza si la Edge Function devuelve error.
 * Solo se usa cuando globalThis.__E2E_AWAIT_AUDIT__ === true.
 */
export async function fireAuditLogAwaitable(entry: AuditLogEntry): Promise<void> {
  const headers = await getAuthHeader()
  if (!headers) return

  const { error } = await supabase.functions.invoke('log-audit-event', {
    body: entry,
    headers,
  })

  if (error != null) {
    throw new Error(`[AuditLog] Invoke failed: ${error.message}`)
  }
}
