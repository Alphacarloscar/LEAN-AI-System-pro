// ============================================================
// LEAN AI System — Tipos del dominio de negocio
//
// Estos tipos son independientes del esquema de Supabase.
// Representan las entidades tal como las entiende la aplicación.
// Sprint 0.5: tipos base del dominio — se amplían en cada Sprint.
// ============================================================

// ---- Arquetipos de usuario (D7) ----
export type UserRole =
  | 'consultor_alpha'
  | 'pm_cliente'
  | 'viewer_csuite'
  | 'admin_alpha'
  | 'superadmin'

// ---- Fases L.E.A.N. ----
export type LeanPhase = 'listen' | 'evaluate' | 'activate' | 'normalize'

// ---- Herramientas T1-T13 ----
export type ToolCode =
  | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7'
  | 'T8' | 'T9' | 'T10' | 'T11' | 'T12' | 'T13'

// ---- Estados de output ----
export type OutputStatus = 'draft' | 'in_progress' | 'committed' | 'archived'

// ---- Engagement ----
export interface Engagement {
  id: string
  clientId: string
  name: string
  startDate: string | null
  endDate: string | null
  currentPhase: LeanPhase | 'closed'
  assignedConsultantId: string | null
  status: 'active' | 'archived'
  createdAt: string
}

// ---- Organization (tenant) ----
export interface Organization {
  id: string
  name: string
  type: 'alpha_internal' | 'client_org'
  createdAt: string
  archivedAt: string | null
}

// ---- User profile ----
export interface UserProfile {
  id: string
  email: string
  fullName: string | null
  organizationId: string
  createdAt: string
  role: UserRole
}

// ---- Tool instance ----
export interface ToolInstance {
  id: string
  engagementId: string
  toolCode: ToolCode
  phase: LeanPhase
  status: OutputStatus
  currentVersion: number
  createdAt: string
  updatedAt: string
}

// ---- Dependency type (D8) ----
export type DependencyType = 'hard' | 'soft'

// ---- Context reference (snapshot con versionado — D8) ----
export interface ContextRef {
  id: string
  sourceToolInstanceId: string
  targetToolInstanceId: string
  targetVersionConsumed: number
  targetVersionCurrent: number
  stale: boolean  // true si targetVersionCurrent > targetVersionConsumed
  entityIds: string[]
  createdAt: string
}
