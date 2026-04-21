// ============================================================
// Auth — Tipos
//
// MVP: autenticación local con credencial hardcoded.
// Sprint 3+: integración con Supabase Auth.
// ============================================================

export interface AuthUser {
  email: string
  name:  string
  role:  'admin' | 'consultant' | 'viewer'
}

export interface AuthState {
  isAuthenticated: boolean
  user:            AuthUser | null
  error:           string | null
}

// ── Credenciales MVP (demo-safe) ──────────────────────────────
// En Sprint 3 esto se reemplaza por Supabase Auth.
// Nunca exponer en producción sin reemplazar por auth real.
export const MVP_CREDENTIALS: { email: string; password: string; user: AuthUser }[] = [
  {
    email:    'carlos.sanchez@consultoriaalpha.com',
    password: 'lean2025',
    user: {
      email: 'carlos.sanchez@consultoriaalpha.com',
      name:  'Carlos Sánchez',
      role:  'admin',
    },
  },
  {
    email:    'oscar@consultoriaalpha.com',
    password: 'lean2025',
    user: {
      email: 'oscar@consultoriaalpha.com',
      name:  'Óscar',
      role:  'consultant',
    },
  },
  // Acceso demo para prospects (Javier, Susana, cold leads)
  {
    email:    'demo@lean-ai.com',
    password: 'demo2025',
    user: {
      email: 'demo@lean-ai.com',
      name:  'Demo',
      role:  'viewer',
    },
  },
]
