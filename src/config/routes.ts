/**
 * Routes Configuration — Épica 2 + ADR-030
 *
 * Centraliza todas las rutas de la aplicación con naming estandarizado (kebab-case).
 * Reemplaza strings hardcodeados en navigate(), Link, etc.
 *
 * SEPARACIÓN FUNCIONAL (ADR-030):
 * ════════════════════════════════════════════════════════════════════════════════
 *
 * /company-profile (CLIENT ZONE — client_editor/client_viewer)
 *   • Clientes editan su propia empresa y proyectos
 *   • CompanyProfileView: Tab Empresa, Organización, Planes, Proyectos
 *   • Edición modal de proyectos (ProjectDetailView modal en CompanyProfile)
 *   • Datos: empresas del usuario, sus proyectos, configuración compartida
 *   • Guards: ProjectMembershipGuard valida acceso a proyecto activo
 *
 * /admin (OPERATIONAL ZONE — superadmin)
 *   • Superadmin gestiona todas las empresas, proyectos, usuarios
 *   • AdminView: landing con Empresas, Usuarios, Proyectos
 *   • CompanyDetailView: gestión empresa (info, usuarios, departamentos)
 *   • ProjectDetailAdminView: gestión proyecto (config, personas, departamentos)
 *   • UserDetailView: gestión usuario (asignaciones, permisos)
 *   • Datos: datos globales, acceso irrestricto
 *   • Guards: AdminRouteGuard + canAccessAdmin(superadmin) — redirige otros roles a /evaluation
 *
 * GARANTÍAS DE SEPARACIÓN:
 *   • No hay acceso /admin sin role superadmin (guard AdminRouteGuard)
 *   • Ediciones en /admin afectan data global (companies, projects, audit_logs)
 *   • Ediciones en /company-profile son locales (company_profiles project-scoped)
 *   • Ambas usan mismos servicios pero con diferentes contextos (role-based)
 */

// ── Zona Pública (Autenticación) ──────────────────────────────────────────
export const PUBLIC_ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  UPDATE_PASSWORD: '/update-password',
} as const

// ── Zona Protegida: Dashboard (CLIENT ZONE) ────────────────────────────────
// Proyecto activo seleccionado por cliente vía selector de proyecto en header.
// EVALUATION_ROUTE_PATTERNS — Static path patterns for React Router <Route path>
// Used only by <Route path={EVALUATION_ROUTE_PATTERNS.T1}> declarations
// to avoid hardcoded strings that drift from the builders below.
export const EVALUATION_ROUTE_PATTERNS = {
  ROOT: 'evaluation',
  PROJECT_ROOT: 'evaluation/projects/:projectId',
  T1: 'evaluation/projects/:projectId/t1',
  T2: 'evaluation/projects/:projectId/t2',
  T3: 'evaluation/projects/:projectId/t3',
  T4: 'evaluation/projects/:projectId/t4',
  T5: 'evaluation/projects/:projectId/t5',
  T6: 'evaluation/projects/:projectId/t6',
  T7: 'evaluation/projects/:projectId/t7',
  T8: 'evaluation/projects/:projectId/t8',
  T9: 'evaluation/projects/:projectId/t9',
  T10: 'evaluation/projects/:projectId/t10',
  T11: 'evaluation/projects/:projectId/t11',
  T12: 'evaluation/projects/:projectId/t12',
  MEMBERS: 'evaluation/projects/:projectId/members',
} as const

// EVALUATION_ROUTES — Path builders for navigate() and <Link>
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
  MEMBERS: (projectId: string) => `/evaluation/projects/${projectId}/members`,
} as const

// ── Zona Admin (OPERATIONAL ZONE — Superadmin only) ────────────────────────
// Gestión global: empresas, proyectos, usuarios, auditoría.
// Acceso: superadmin role solamente. Otros roles redirigidos a /company-profile.
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

// ADMIN_ROUTE_PATTERNS — Static path patterns for React Router <Route path>.
// Keep all /admin/** declarations behind AdminRouteGuard in App.tsx.
export const ADMIN_ROUTE_PATTERNS = {
  ROOT: '/admin',
  COMPANIES: '/admin/companies',
  PROJECTS: '/admin/projects',
  USERS: '/admin/users',
  COMPANY_DETAIL: '/admin/companies/:companyId',
  COMPANY_PROJECT_DETAIL: '/admin/companies/:companyId/projects/:projectId',
  USER_DETAIL: '/admin/users/:userId',
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
