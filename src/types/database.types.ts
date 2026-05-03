// ============================================================
// LEAN AI System — Tipos de base de datos (Supabase)
//
// Generados manualmente para alinear con 001_foundation.sql.
// Sprint 5+: reemplazar con tipos auto-generados vía:
//   supabase gen types typescript --project-id TU_ID > database.types.ts
//
// ⚠ Este archivo es FUENTE DE VERDAD para los tipos de BD.
//   No editar las interfaces Row/Insert manualmente — cambiar
//   el schema SQL primero y luego regenerar.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Roles ───────────────────────────────────────────────────────

export type UserRole = 'admin' | 'consultant' | 'viewer'
export type MemberRole = 'consultant' | 'viewer'
export type EngagementStatus = 'active' | 'archived'
export type LeanPhase = 'listen' | 'evaluate' | 'activate' | 'normalize' | 'closed'
export type ISO42001Status = 'no_iniciado' | 'en_progreso' | 'implementado'
export type UseCaseStatus = 'candidato' | 'priorizado' | 'go' | 'no_go' | 'en_piloto' | 'completado'

// ============================================================
// Filas (SELECT results)
// ============================================================

export interface ProfileRow {
  id:         string
  email:      string
  name:       string
  role:       UserRole
  created_at: string
}

export interface EngagementRow {
  id:            string
  name:          string
  owner_id:      string
  status:        EngagementStatus
  current_phase: LeanPhase
  start_date:    string | null
  end_date:      string | null
  created_at:    string
  updated_at:    string
}

export interface EngagementMemberRow {
  engagement_id: string
  user_id:       string
  role:          MemberRole
  added_at:      string
}

export interface CompanyProfileRow {
  id:                     string
  engagement_id:          string
  engagement_name:        string
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
  id:            string
  engagement_id: string
  tipo:          string
  area_funcional:string
  frecuencia:    'Baja' | 'Media' | 'Alta' | null
  impacto:       'Bajo' | 'Medio' | 'Alto' | null
  notas:         string
  created_at:    string
}

export interface T1DimensionScoreRow {
  id:                string
  engagement_id:     string
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
  engagement_id:   string
  name:            string
  role:            string
  department:      string
  archetype:       string
  resistance:      'baja' | 'media' | 'alta'
  interview:       Json | null  // InterviewResult | null
  notes:           string | null
  manual_override: boolean
  created_at:      string
}

export interface ValueStreamRow {
  id:                string
  engagement_id:     string
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
  engagement_id:         string
  name:                  string
  description:           string | null
  department:            string
  ai_category:           string
  status:                UseCaseStatus
  sponsor_name:          string | null
  responsible_it_data:   string | null
  business_objective:    string | null
  imported_from_t3:      Json | null   // ImportedFromT3 | null
  stakeholder_scores:    Json          // StakeholderScore[]
  scores:                Json          // UseCaseScores
  priority_score:        number
  economics:             Json | null   // UseCaseEconomics | null
  go_no_go:              Json | null   // GoNoGoDecision | null
  roadmap:               Json | null   // UseCaseRoadmap | null
  t1_context:            Json | null   // T1Context | null
  t2_context:            Json | null   // T2Context | null
  ai_act_classification: Json | null   // AIActClassification | null
  notes:                 string | null
  created_at:            string
  updated_at:            string
}

export interface T5CanvasRow {
  id:                  string
  engagement_id:       string
  company_name:        string
  domains:             Json   // Record<T5DomainCode, T5DomainAssessment>
  maturity_level:      string
  activation_sequence: Json   // T5DomainCode[]
  notes:               string | null
  created_at:          string
  updated_at:          string
}

export interface ISO42001ControlRow {
  id:            string
  engagement_id: string
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

// Los `id` son opcionales en Insert — si se omiten, Supabase usa gen_random_uuid().
// Los servicios los envían explícitamente para soportar el patrón optimistic update.
export type EngagementInsert      = Omit<EngagementRow, 'created_at' | 'updated_at'> & { id?: string }
export type CompanyProfileInsert  = Omit<CompanyProfileRow, 'created_at' | 'updated_at'> & { id?: string }
export type FrictionInsert        = Omit<FrictionRow, 'created_at'> & { id?: string }
export type T1DimensionScoreInsert = Omit<T1DimensionScoreRow, 'id' | 'updated_at'> & { id?: string }
export type StakeholderInsert     = Omit<StakeholderRow, 'created_at'> & { id?: string }
export type ValueStreamInsert     = Omit<ValueStreamRow, 'created_at'> & { id?: string }
export type UseCaseInsert         = Omit<UseCaseRow, 'created_at' | 'updated_at'> & { id?: string }
export type T5CanvasInsert        = Omit<T5CanvasRow, 'created_at' | 'updated_at'> & { id?: string }
export type ISO42001ControlInsert = Omit<ISO42001ControlRow, never>  // id requerido

// ============================================================
// Database interface (para createClient<Database>)
// ============================================================

// Supabase v2 requiere Relationships en cada tabla
type NoRelationships = { Relationships: [] }

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row:    ProfileRow
        Insert: Omit<ProfileRow, 'created_at'>
        Update: Partial<Omit<ProfileRow, 'id'>>
      } & NoRelationships
      engagements: {
        Row:    EngagementRow
        Insert: EngagementInsert
        Update: Partial<Omit<EngagementRow, 'id' | 'created_at'>>
      } & NoRelationships
      engagement_members: {
        Row:    EngagementMemberRow
        Insert: Omit<EngagementMemberRow, 'added_at'>
        Update: Partial<Pick<EngagementMemberRow, 'role'>>
      } & NoRelationships
      company_profiles: {
        Row:    CompanyProfileRow
        Insert: CompanyProfileInsert
        Update: Partial<Omit<CompanyProfileRow, 'id' | 'engagement_id' | 'created_at'>>
      } & NoRelationships
      frictions: {
        Row:    FrictionRow
        Insert: FrictionInsert
        Update: Partial<Omit<FrictionRow, 'id' | 'engagement_id' | 'created_at'>>
      } & NoRelationships
      t1_dimension_scores: {
        Row:    T1DimensionScoreRow
        Insert: T1DimensionScoreInsert
        Update: Partial<Omit<T1DimensionScoreRow, 'id' | 'engagement_id'>>
      } & NoRelationships
      stakeholders: {
        Row:    StakeholderRow
        Insert: StakeholderInsert
        Update: Partial<Omit<StakeholderRow, 'id' | 'engagement_id' | 'created_at'>>
      } & NoRelationships
      value_streams: {
        Row:    ValueStreamRow
        Insert: ValueStreamInsert
        Update: Partial<Omit<ValueStreamRow, 'id' | 'engagement_id' | 'created_at'>>
      } & NoRelationships
      use_cases: {
        Row:    UseCaseRow
        Insert: UseCaseInsert
        Update: Partial<Omit<UseCaseRow, 'id' | 'engagement_id' | 'created_at'>>
      } & NoRelationships
      t5_canvas: {
        Row:    T5CanvasRow
        Insert: T5CanvasInsert
        Update: Partial<Omit<T5CanvasRow, 'id' | 'engagement_id' | 'created_at'>>
      } & NoRelationships
      iso42001_controls: {
        Row:    ISO42001ControlRow
        Insert: ISO42001ControlInsert
        Update: Partial<Omit<ISO42001ControlRow, 'id' | 'engagement_id'>>
      } & NoRelationships
    }
    Views: Record<string, never>
    Functions: {
      is_engagement_member: {
        Args:    { eid: string }
        Returns: boolean
      }
      can_write_engagement: {
        Args:    { eid: string }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
