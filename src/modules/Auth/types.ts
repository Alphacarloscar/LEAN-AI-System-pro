// ============================================================
// Auth — Tipos
//
// Sprint 3: integración completa con Supabase Auth.
// UserRole: fuente única en database.types.ts (ADR-D10)
// ============================================================

import type { UserRole } from '@/types/database.types'
export type { UserRole }

export interface AuthUser {
  id:    string   // Supabase auth.users UUID
  email: string
  name:  string
  role:  UserRole
}

export interface AuthState {
  isAuthenticated: boolean
  user:            AuthUser | null
  error:           string | null
}
