/**
 * Routes Configuration — Épica 2
 * Centraliza todas las rutas de la aplicación con naming estandarizado (kebab-case)
 * Reemplaza strings hardcodeados en navigate(), Link, etc.
 */

// ── Zona Pública (Autenticación) ──────────────────────────────────────────
export const PUBLIC_ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  UPDATE_PASSWORD: '/update-password',
} as const

// ── Zona Protegida: Dashboard ─────────────────────────────────────────────
export const EVALUATION_ROUTES = {
  ROOT: '/evaluation',
  PROFILE: '/profile',
  PROJECT_ROOT: (projectId: string) => `/evaluation/projects/${projectId}`,
  T1: (projectId: string) => `/evaluation/projects/${projectId}/t1`,
  T2: (projectId: string) => `/evaluation/projects/${projectId}/t2`,
  T3: (projectId: string) => `/evaluation/projects/${projectId}/t3`,
  T4: (projectId: string) => `/evaluation/projects/${projectId}/t4`,
  T5: (projectId: string) => `/evaluation/projects/${projectId}/t5`,
  T6: (projectId: string) => `/evaluation/projects/${projectId}/t6`,
  T7: (projectId: string) => `/evaluation/projects/${projectId}/t7`,
  T8: (projectId: string) => `/evaluation/projects/${projectId}/t8`,
  T9: (projectId: string) => `/evaluation/projects/${projectId}/t9`,
  T10: (projectId: string) => `/evaluation/projects/${projectId}/t10`,
  T11: (projectId: string) => `/evaluation/projects/${projectId}/t11`,
  T12: (projectId: string) => `/evaluation/projects/${projectId}/t12`,
} as const

// ── Zona Admin (Superadmin) ───────────────────────────────────────────────
export const ADMIN_ROUTES = {
  ROOT: '/admin',
  COMPANIES: '/admin/companies',
  COMPANY_DETAIL: (companyId: string) => `/admin/companies/${companyId}`,
  COMPANY_PROJECTS: (companyId: string) => `/admin/companies/${companyId}/projects`,
  COMPANY_PROJECT_DETAIL: (companyId: string, projectId: string) =>
    `/admin/companies/${companyId}/projects/${projectId}`,
  USERS: '/admin/users',
  USER_DETAIL: (userId: string) => `/admin/users/${userId}`,
} as const

// ── Constantes útiles ─────────────────────────────────────────────────────
export const DEFAULT_REDIRECT = EVALUATION_ROUTES.ROOT // Después de login
export const LOGIN_REDIRECT = PUBLIC_ROUTES.LOGIN        // Si no autenticado

// ── Tipo para parámetros de ruta ──────────────────────────────────────────
export interface RouteParams {
  projectId?: string
  companyId?: string
  userId?: string
}
