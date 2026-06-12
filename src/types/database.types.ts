// ============================================================
// GOBY — Tipos de base de datos (Supabase)
//
// Sprint 8: renombrado engagement→project, añadida entidad Company.
//
// ⚠ Este archivo es FUENTE DE VERDAD para los tipos de BD.
//   No editar manualmente — cambiar el schema SQL primero.
//
// IMPORTANT: All Row types MUST be `type`, not `interface`.
// TypeScript interfaces do not satisfy Record<string, unknown>
// in conditional type checks (Supabase GenericSchema constraint),
// causing Schema=never and all .data types to collapse to never.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Roles ───────────────────────────────────────────────────────

export type UserRole      = 'superadmin' | 'consultant' | 'client_editor' | 'client_viewer'
// 'superadmin'    = Alpha platform admin (Carlos) — acceso global a todo
// 'consultant'    = consultor Alpha — acceso por project_members
// 'client_editor' = cliente operativo — edita proyectos de su empresa
// 'client_viewer' = cliente directivo — solo lectura de su empresa
export type MemberRole    = 'consultant' | 'viewer'
export type ProjectStatus = 'active' | 'archived'
export type LeanPhase     = 'listen' | 'evaluate' | 'activate' | 'normalize' | 'closed'
export type ISO42001Status = 'no_iniciado' | 'en_progreso' | 'implementado'
export type UseCaseStatus = 'candidato' | 'priorizado' | 'go' | 'no_go' | 'en_piloto' | 'completado'

// ── Friction enums ────────────────────────────────────────────
export type FrictionFrequency = 'Baja' | 'Media' | 'Alta'
export type FrictionImpact    = 'Bajo' | 'Medio' | 'Alto'

// ============================================================
// Filas (SELECT results)
// ============================================================

export type CompanyRow = {
  id:           string
  name:         string
  slug:         string | null
  sector:       string          // Sprint 10: movido desde company_profiles
  company_size: string          // Sprint 10: movido desde company_profiles
  created_at:   string
}

export type CompanyDepartmentRow = {
  id:         string
  company_id: string
  name:       string
  color:      string
  created_at: string
}

export type ProfileRow = {
  id:         string
  email:      string
  name:       string
  role:       UserRole
  company_id: string | null
  created_at: string
}

export type ProjectRow = {
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

export type ProjectMemberRow = {
  project_id: string
  user_id:    string
  role:       MemberRole
  added_at:   string
}

export type CompanyProfileRow = {
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

export type FrictionRow = {
  id:             string
  project_id:     string
  tipo:           string
  area_funcional: string
  frecuencia:     FrictionFrequency | null
  impacto:        FrictionImpact | null
  notas:          string
  created_at:     string
}

export type T1DimensionScoreRow = {
  id:                     string
  project_id:             string
  dimension_code:         string
  subdimension_code:      string
  score:                  number | null
  evidence:               string
  interviewee_id:         string | null
  interviewee_name:       string | null
  interviewee_role:       string | null
  interviewee_type:       'it' | 'business'
  interviewee_department: string | null
  updated_at:             string
}

export type StakeholderRow = {
  id:               string
  project_id:       string
  name:             string
  role:             string
  department:       string
  archetype:        string
  resistance:       'baja' | 'media' | 'alta'
  interview:        Json | null
  notes:            string | null
  manual_override:  boolean
  unofficial_tools: string | null   // Shadow AI: herramientas no oficiales declaradas
  created_at:       string
}

export type ValueStreamRow = {
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

export type UseCaseRow = {
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

export type T5CanvasRow = {
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

export type ISO42001ControlRow = {
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

export type ToolOutputRow = {
  id:              string
  project_id:      string
  tool_code:       string
  payload:         Json
  payload_version: number
  version:         number
  status:          string
  archived:        boolean
  stale_after:     string | null
  created_at:      string
  updated_at:      string
  created_by:      string | null
  updated_by:      string | null
}

// ============================================================
// Inserts (campos requeridos al insertar)
// id excluded from base Omit + added back as optional so Postgres
// auto-generates the UUID when the caller doesn't provide one.
// ============================================================

// Sprint 10: sector + company_size were added to companies. createCompany service
// only provides name + slug, so these fields are optional at insert time.
export type CompanyInsert = Omit<CompanyRow, 'created_at' | 'id' | 'sector' | 'company_size'> & {
  id?:           string
  sector?:       string
  company_size?: string
}

// Sprint 10: sector + tamano_empresa live in `companies`. company_profiles still
// has these columns for backward compat but profileToUpsert() doesn't write them.
// updated_at is explicitly set by the service on each upsert.
export type CompanyProfileInsert = Omit<CompanyProfileRow, 'created_at' | 'id' | 'sector' | 'tamano_empresa'> & {
  id?:             string
  sector?:         string
  tamano_empresa?: string
}

export type CompanyDepartmentInsert = Omit<CompanyDepartmentRow, 'created_at' | 'id'> & { id?: string }
export type ProjectInsert           = Omit<ProjectRow, 'created_at' | 'updated_at' | 'id'> & { id?: string }
export type FrictionInsert          = Omit<FrictionRow, 'created_at' | 'id'> & { id?: string }
export type T1DimensionScoreInsert  = Omit<T1DimensionScoreRow, 'id' | 'updated_at'> & { id?: string }
export type StakeholderInsert       = Omit<StakeholderRow, 'created_at' | 'id'> & { id?: string }
export type ValueStreamInsert       = Omit<ValueStreamRow, 'created_at' | 'id'> & { id?: string }
export type UseCaseInsert           = Omit<UseCaseRow, 'created_at' | 'updated_at' | 'id'> & { id?: string }
export type T5CanvasInsert          = Omit<T5CanvasRow, 'created_at' | 'updated_at' | 'id'> & { id?: string; updated_at?: string }
export type ToolOutputInsert        = Omit<ToolOutputRow, 'id' | 'created_at' | 'updated_at' | 'version'> & { id?: string; created_at?: string; updated_at?: string; version?: number }
export type ISO42001ControlInsert   = Omit<ISO42001ControlRow, 'id'> & { id?: string }

// ── Alias de compatibilidad (deprecados — usar nombres nuevos)
/** @deprecated Usar ProjectRow */
export type EngagementRow = ProjectRow
/** @deprecated Usar ProjectMemberRow */
export type EngagementMemberRow = ProjectMemberRow
/** @deprecated Usar ProjectStatus */
export type EngagementStatus = ProjectStatus

// ============================================================
// Database type
// MUST be `type`, not `interface` — same reason as Row types.
// ============================================================

export type Database = {
  public: {
    Tables: {
      companies: {
        Row:           CompanyRow
        Insert:        CompanyInsert
        Update:        Partial<Omit<CompanyRow, 'id' | 'created_at'>>
        Relationships: []
      }
      company_departments: {
        Row:           CompanyDepartmentRow
        Insert:        CompanyDepartmentInsert
        Update:        Partial<Omit<CompanyDepartmentRow, 'id' | 'created_at'>>
        Relationships: []
      }
      profiles: {
        Row:           ProfileRow
        Insert:        Omit<ProfileRow, 'created_at'>
        Update:        Partial<Omit<ProfileRow, 'id'>>
        Relationships: []
      }
      projects: {
        Row:           ProjectRow
        Insert:        ProjectInsert
        Update:        Partial<Omit<ProjectRow, 'id' | 'created_at'>>
        Relationships: []
      }
      project_members: {
        Row:           ProjectMemberRow
        Insert:        Omit<ProjectMemberRow, 'added_at'>
        Update:        Partial<Pick<ProjectMemberRow, 'role'>>
        Relationships: []
      }
      company_profiles: {
        Row:           CompanyProfileRow
        Insert:        CompanyProfileInsert
        Update:        Partial<Omit<CompanyProfileRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      frictions: {
        Row:           FrictionRow
        Insert:        FrictionInsert
        Update:        Partial<Omit<FrictionRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      t1_dimension_scores: {
        Row:           T1DimensionScoreRow
        Insert:        T1DimensionScoreInsert
        Update:        Partial<Omit<T1DimensionScoreRow, 'id' | 'project_id'>>
        Relationships: []
      }
      stakeholders: {
        Row:           StakeholderRow
        Insert:        StakeholderInsert
        Update:        Partial<Omit<StakeholderRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      value_streams: {
        Row:           ValueStreamRow
        Insert:        ValueStreamInsert
        Update:        Partial<Omit<ValueStreamRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      use_cases: {
        Row:           UseCaseRow
        Insert:        UseCaseInsert
        Update:        Partial<Omit<UseCaseRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      t5_canvas: {
        Row:           T5CanvasRow
        Insert:        T5CanvasInsert
        Update:        Partial<Omit<T5CanvasRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
      iso42001_controls: {
        Row:           ISO42001ControlRow
        Insert:        ISO42001ControlInsert
        Update:        Partial<Omit<ISO42001ControlRow, 'id' | 'project_id'>>
        Relationships: []
      }
      tool_outputs: {
        Row:           ToolOutputRow
        Insert:        ToolOutputInsert
        Update:        Partial<Omit<ToolOutputRow, 'id' | 'project_id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
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
      // Persists tool output — SECURITY DEFINER, handles RLS internally
      save_tool_output: {
        Args: {
          p_project_id:       string
          p_tool_code:        string
          p_payload:          Record<string, unknown>
          p_stale_after?:     string
          p_payload_version?: number
        }
        Returns: string  // uuid of the saved record
      }
      bulk_upsert_t1_scores: {
        Args:    { p_scores: Json }
        Returns: undefined
      }
      // Creates project + initial project_member row — SECURITY DEFINER
      create_project: {
        Args: {
          p_name:       string
          p_company_id: string | null
          p_phase:      LeanPhase
        }
        Returns: ProjectRow[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
