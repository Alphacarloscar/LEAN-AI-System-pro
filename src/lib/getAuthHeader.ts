// ============================================================
// getAuthHeader — helper compartido para propagar JWT en functions.invoke()
//
// supabase-js v2 envía el anon key por defecto en functions.invoke(),
// incluso con sesión activa. Las Edge Functions que llaman a getUser()
// reciben { user: null } con anon key → 401. Este helper lee el
// access_token de la sesión activa y construye el header correcto.
//
// ADR-026: toda llamada a supabase.functions.invoke() en este proyecto
// debe usar este helper si la Edge Function verifica la identidad del caller.
// ============================================================

import { supabase } from '@/lib/supabase'

/**
 * Devuelve { Authorization: "Bearer <access_token>" } si hay sesión activa.
 * Devuelve undefined si no hay sesión — el caller decide cómo manejarlo:
 *   - Operaciones de usuario (invite, delete, ai-recommend): lanzar error.
 *   - Audit trail: descartar silenciosamente (un audit sin usuario es inválido).
 */
export async function getAuthHeader(): Promise<{ Authorization: string } | undefined> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : undefined
}
