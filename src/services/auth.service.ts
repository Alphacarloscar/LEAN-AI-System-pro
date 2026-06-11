// ============================================================
// Auth Service (ADR-011)
//
// Encapsula TODAS las llamadas a supabase.auth.* y supabase.from('profiles')
// para que los stores no importen { supabase } directamente.
//
// Creado: 2026-06-11 — remediación DEBT-013 (violación ADR-011 en Auth/Engagement stores)
// ============================================================

import { supabase } from '@/lib/supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { AuthUser } from '@/modules/Auth/types'

type AuthStateCallback = (event: AuthChangeEvent, session: Session | null) => void | Promise<void>

// ── Tipos re-exportados para consumidores del servicio ───────

export type { AuthUser }

// ── Perfil ───────────────────────────────────────────────────

/** Carga el perfil extendido del usuario desde la tabla profiles. */
export async function fetchProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return {
    id:    data.id,
    email: data.email,
    name:  data.name,
    role:  data.role as AuthUser['role'],
  }
}

/**
 * Devuelve el company_id del usuario autenticado en este momento.
 * Usado por Engagement store al crear un proyecto sin companyId explícito (rol client_editor).
 */
export async function getAuthUserCompanyId(): Promise<string | undefined> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return undefined

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  return (profile?.company_id as string | undefined) ?? undefined
}

// ── Sesión ───────────────────────────────────────────────────

/** Obtiene la sesión activa actual (puede ser null si no hay sesión). */
export async function getAuthSession() {
  return supabase.auth.getSession()
}

/**
 * Registra un listener de cambios de estado de autenticación.
 * Devuelve el objeto subscription para poder llamar a unsubscribe() cuando sea necesario.
 */
export function subscribeToAuthChanges(callback: AuthStateCallback) {
  return supabase.auth.onAuthStateChange(callback)
}

// ── Autenticación ─────────────────────────────────────────────

/** Sign-in con email + contraseña. */
export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

/** Cierra la sesión del usuario actual. */
export async function signOut() {
  return supabase.auth.signOut()
}

/** Envía email de recuperación de contraseña con enlace de redirección opcional. */
export async function resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
  return supabase.auth.resetPasswordForEmail(email, options)
}

/** Actualiza atributos del usuario autenticado (contraseña, metadata user_metadata, etc.). */
export async function updateAuthUser(attributes: { password?: string; data?: Record<string, unknown> }) {
  return supabase.auth.updateUser(attributes)
}
