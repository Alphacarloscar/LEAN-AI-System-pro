// ============================================================
// GOBY — Tipos de base de datos (Supabase)
//
// Sprint 8: renombrado engagement→project, añadida entidad Company.
//
// ⚠ Este archivo es FUENTE DE VERDAD para los tipos de BD.
//   No editar manualmente — cambiar el schema SQL primero.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Roles ───────────────────────────────────────────────────────

export type UserRole      = 'admin' | 'consultant' | 'viewer'
// 'admin' = platform admin (Carlos) — acceso global
// 'consultant' = consultor Alpha — acceso por project_members
// 'viewer' = usuario cliente — acceso por project_members
export type MemberRole    = 'consultant' | 'viewer'
export type ProjectStatus = 'active' | 'archived'
export type LeanPhase     = 'listen' | 'evaluate' | 'activate' | 'normalize' | 'closed'
export type ISO42001Status = 'no_iniciado' | 'en_progreso' | 'implementado'
export type UseCaseStatus = 'candidato' | 'priorizado' | 'go' | 'no_go' | 'en_piloto' | 'completado'

// ============================================================
// Filas (SELECT results)
// ============================================================

export interface CompanyRow {
  id:         string
  name:       string
  slug:       string | null
  created_at: string
}

export interface ProfileRow {
  id:         string
  email:      string
  name:       string
  role:       UserRole
  company_id: string | null
  created_at: string
}

export interface ProjectRow {
  id:            string
  name:          string
  owner_id:      string
  company_id:    string | null
  status:        ProjectStatus
  current_phase: LeanPhase
  start_date:    string | null
  end_date:      string | null
  created_at:    string
  updated_at:    string
}

export interface ProjectMemberRow {
  project_id: string
  user_id:    string
  role:       MemberRole
  added_at:   string
}

export interface CompanyProfileRow {
  id:                     string
  project_id:             string
  project_name:           string
  sector:                 string
  tamano_empresa:         string
  objetivo_principal_ia:  string
  horizonte_valor:        string
  ecosistema_tecnologico: string
  restricciones:          string
  areas_prioritarias:     Json   // string[]
  saved_at:               string | null
  created_at:             string
  updated_at:             string
}

export interface FrictionRow {
  id:             string
  project_id:     string
  tipo:           string
  area_funcional: string
  frecuencia:     'Baja' | 'Media' | 'Alta' | null
  impacto:        'Bajo' | 'Medio' | 'Alto' | null
  notas:          string
  created_at:     string
}

export interface T1DimensionScoreRow {
  id:                string
  project_id:        string
  dimension_code:    string
  subdimension_code: string
  score:             number | null
  evidence:          string
  interviewee_id:    string | null
  interviewee_name:  string | null
  interviewee_role:  string | null
  interviewee_type:  'it' | 'business'
  updated_at:        string
}

export interface StakeholderRow {
  id:              string
  project_id:      string
  name:            string
  role:            string
  department:      string
  archetype:       string
  resistance:      'baja' | 'media' | 'alta'
  interview:       Json | null
  notes:           string | null
  manual_override: boolean
  created_at:      string
}

export interface ValueStreamRow {
  id:                string
  project_id:        string
  name:              string
  department:        string
  owner:             string | null
  owner_role:        string | null
  description:       string | null
  phase:             string
  ai_category:       string
  org_readiness:     'baja' | 'media' | 'alta'
  opportunity_level: 'baja' | 'media' | 'alta' | 'critica'
  interview:         Json | null
  opportunities:     Json        // AIOpportunity[]
  stages:            Json        // ProcessStage[]
  notes:             string | null
  manual_override:   boolean
  created_at:        string
}

export interface UseCaseRow {
  id:                    string
  project_id:            string
  name:                  string
  description:           string | null
  department:            string
  ai_category:           string
  status:                UseCaseStatus
  sponsor_name:          string | null
  responsible_it_data:   string | null
  business_objective:    string | null
  imported_from_t3:      Json | null
  stakeholder_scores:    Json
  scores:                Json
  priority_score:        number
  economics:             Json | null
  go_no_go:              Json | null
  roadmap:               Json | null
  t1_context:            Json | null
  t2_context:            Json | null
  ai_act_classification: Json | null
  notes:                 string | null
  created_at:            string
  updated_at:            string
}

export interface T5CanvasRow {
  id:                  string
  project_id:          string
  company_name:        string
  domains:             Json
  maturity_level:      string
  activation_sequence: Json
  notes:               string | null
  created_at:          string
  updated_at:          string
}

export interface ISO42001ControlRow {
  id:            string
  project_id:    string
  code:          string
  clause:        string
  title:         string
  description:   string
  auto_inferred: boolean
  status:        ISO42001Status
  notes:         string | null
  updated_at:    string
}

// ============================================================
// Inserts (campos requeridos al insertar)
// ============================================================

export type CompanyInsert          = Omit<CompanyRow, 'created_at'> & { id?: string }
export type ProjectInsert          = Omit<ProjectRow, 'created_at' | 'updated_at'> & { id?: string }
export type CompanyProfileInsert   = Omit<CompanyProfileRow, 'created_at' | 'updated_at'> & { id?: string }
export type FrictionInsert         = Omit<FrictionRow, 'created_at'> & { id?: string }
export type T1DimensionScoreInsert = Omit<T1DimensionScoreRow, 'id' | 'updated_at'> & { id?: string }
export type StakeholderInsert      = Omit<StakeholderRow, 'created_at'> & { id?: string }
export type ValueStreamInsert      = Omit<ValueStreamRow, 'created_at'> & { id?: string }
export type UseCaseInsert          = Omit<UseCaseRow, 'created_at' | 'updated_at'> & { id?: string }
export type T5CanvasInsert         = Omit<T5CanvasRow, 'created_at' | 'updated_at'> & { id?: string }
export type ISO42001ControlInsert  = Omit<ISO42001ControlRow, never>

// ── Alias de compatibilidad (deprecados — usar nombres nuevos)
/** @deprecated Usar ProjectRow */
export type EngagementRow = ProjectRow
/** @deprecated Usar ProjectMemberRow */
export type EngagementMemberRow = ProjectMemberRow
/** @deprecated Usar ProjectStatus */
export type EngagementStatus = ProjectStatus

// ============================================================
// Database interface
// ============================================================

type NoRelationships = { Relationships: [] }

export interface Database {
  public: {
    Tables: {
      companies: {
        Row:    CompanyRow
        Insert: CompanyInsert
        Update: Partial<Omit<CompanyRow, 'id' | 'created_at'>>
      } & NoRelationships
      profiles: {
        Row:    ProfileRow
        Insert: Omit<ProfileRow, 'created_at'>
        Update: Partial<Omit<ProfileRow, 'id'>>
      } & NoRelationships
      projects: {
        Row:    ProjectRow
        Insert: ProjectInsert
        Update: Partial<Omit<ProjectRow, 'id' | 'created_at'>>
      } & NoRelationships
      project_members: {
        Row:    ProjectMemberRow
        Insert: Omit<ProjectMemberRow, 'added_at'>
        Update: Partial<Pick<ProjectMemberRow, 'role'>>
      } & NoRelationships
      company_profiles: {
        Row:    CompanyProfileRow
        Insert: CompanyProfileInsert
        Update: Partial<Omit<CompanyProfileRow, 'id' | 'project_id' | 'created_at'>>
      } & NoRelationships
      frictions: {
        Row:    FrictionRow
        Insert: FrictionInsert
        Update: Partial<Omit<FrictionRow, 'id' | 'project_id' | 'created_at'>>
      } & NoRelationships
      t1_dimension_scores: {
        Row:    T1DimensionScoreRow
        Insert: T1DimensionScoreInsert
        Update: Partial<Omit<T1DimensionScoreRow, 'id' | 'project_id'>>
      } & NoRelationships
      stakeholders: {
        Row:    StakeholderRow
        Insert: StakeholderInsert
        Update: Partial<Omit<StakeholderRow, 'id' | 'project_id' | 'created_at'>>
      } & NoRelationships
      value_streams: {
        Row:    ValueStreamRow
        Insert: ValueStreamInsert
        Update: Partial<Omit<ValueStreamRow, 'id' | 'project_id' | 'created_at'>>
      } & NoRelationships
      use_cases: {
        Row:    UseCaseRow
        Insert: UseCaseInsert
        Update: Partial<Omit<UseCaseRow, 'id' | 'project_id' | 'created_at'>>
      } & NoRelationships
      t5_canvas: {
        Row:    T5CanvasRow
        Insert: T5CanvasInsert
        Update: Partial<Omit<T5CanvasRow, 'id' | 'project_id' | 'created_at'>>
      } & NoRelationships
      iso42001_controls: {
        Row:    ISO42001ControlRow
        Insert: ISO42001ControlInsert
        Update: Partial<Omit<ISO42001ControlRow, 'id' | 'project_id'>>
      } & NoRelationships
    }
    Views: Record<string, never>
    Functions: {
      is_project_member: {
        Args:    { pid: string }
        Returns: boolean
      }
      can_write_project: {
        Args:    { pid: string }
        Returns: boolean
      }
      is_platform_admin: {
        Args:    Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
