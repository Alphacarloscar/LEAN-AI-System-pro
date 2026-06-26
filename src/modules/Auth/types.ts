// ============================================================
// Auth — Tipos
//
// Sprint 3: integración completa con Supabase Auth.
// Los roles se alinean con database.types.ts → UserRole.
// ============================================================

export type AuthUserRole = 'superadmin' | 'consultant' | 'client_editor' | 'client_viewer'

export interface AuthUser {
  id:    string   // Supabase auth.users UUID
  email: string
  name:  string
  role:  AuthUserRole
}

export interface AuthState {
  isAuthenticated: boolean
  user:            AuthUser | null
  error:           string | null
}
