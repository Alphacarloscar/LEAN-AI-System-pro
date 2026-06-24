// ============================================================
// GOBY — Tipos de base de datos (Supabase)
//
// ⚠ Este archivo es FUENTE DE VERDAD para los tipos de BD.
//   No editar manualmente — regenerar con:
//   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
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

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_rate_limit_log: {
        Row: {
          created_at: string
          id: string
          project_id: string
          tool_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          tool_code: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          tool_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_rate_limit_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          company_size: string
          created_at: string | null
          id: string
          name: string
          sector: string
          slug: string | null
        }
        Insert: {
          company_size?: string
          created_at?: string | null
          id?: string
          name: string
          sector?: string
          slug?: string | null
        }
        Update: {
          company_size?: string
          created_at?: string | null
          id?: string
          name?: string
          sector?: string
          slug?: string | null
        }
        Relationships: []
      }
      company_departments: {
        Row: {
          color: string
          company_id: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          areas_prioritarias: Json
          created_at: string | null
          ecosistema_tecnologico: string
          horizonte_valor: string
          id: string
          objetivo_principal_ia: string
          project_id: string
          project_name: string
          restricciones: string
          saved_at: string | null
          sector: string
          tamano_empresa: string
          updated_at: string | null
        }
        Insert: {
          areas_prioritarias?: Json
          created_at?: string | null
          ecosistema_tecnologico?: string
          horizonte_valor?: string
          id?: string
          objetivo_principal_ia?: string
          project_id: string
          project_name?: string
          restricciones?: string
          saved_at?: string | null
          sector?: string
          tamano_empresa?: string
          updated_at?: string | null
        }
        Update: {
          areas_prioritarias?: Json
          created_at?: string | null
          ecosistema_tecnologico?: string
          horizonte_valor?: string
          id?: string
          objetivo_principal_ia?: string
          project_id?: string
          project_name?: string
          restricciones?: string
          saved_at?: string | null
          sector?: string
          tamano_empresa?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      frictions: {
        Row: {
          area_funcional: string
          created_at: string | null
          frecuencia: string | null
          id: string
          impacto: string | null
          notas: string
          project_id: string
          tipo: string
        }
        Insert: {
          area_funcional?: string
          created_at?: string | null
          frecuencia?: string | null
          id?: string
          impacto?: string | null
          notas?: string
          project_id: string
          tipo?: string
        }
        Update: {
          area_funcional?: string
          created_at?: string | null
          frecuencia?: string | null
          id?: string
          impacto?: string | null
          notas?: string
          project_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "frictions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      iso42001_controls: {
        Row: {
          auto_inferred: boolean
          clause: string
          code: string
          description: string
          id: string
          notes: string | null
          project_id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          auto_inferred?: boolean
          clause: string
          code: string
          description?: string
          id?: string
          notes?: string | null
          project_id: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          auto_inferred?: boolean
          clause?: string
          code?: string
          description?: string
          id?: string
          notes?: string | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iso42001_controls_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string
          role?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          added_at: string | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string | null
          created_at: string | null
          current_phase: string
          end_date: string | null
          id: string
          name: string
          owner_id: string
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          current_phase?: string
          end_date?: string | null
          id?: string
          name: string
          owner_id: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          current_phase?: string
          end_date?: string | null
          id?: string
          name?: string
          owner_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshots: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          label: string
          project_id: string | null
          tool: string
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: string
          label?: string
          project_id?: string | null
          tool: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          label?: string
          project_id?: string | null
          tool?: string
        }
        Relationships: [
          {
            foreignKeyName: "snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          archetype: string
          created_at: string | null
          department: string
          id: string
          interview: Json | null
          manual_override: boolean
          name: string
          notes: string | null
          project_id: string
          resistance: string
          role: string
          unofficial_tools: string | null
        }
        Insert: {
          archetype: string
          created_at?: string | null
          department: string
          id?: string
          interview?: Json | null
          manual_override?: boolean
          name: string
          notes?: string | null
          project_id: string
          resistance: string
          role: string
          unofficial_tools?: string | null
        }
        Update: {
          archetype?: string
          created_at?: string | null
          department?: string
          id?: string
          interview?: Json | null
          manual_override?: boolean
          name?: string
          notes?: string | null
          project_id?: string
          resistance?: string
          role?: string
          unofficial_tools?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      t1_dimension_scores: {
        Row: {
          dimension_code: string
          evidence: string
          id: string
          interviewee_department: string | null
          interviewee_id: string | null
          interviewee_name: string | null
          interviewee_role: string | null
          interviewee_type: string
          project_id: string
          score: number | null
          subdimension_code: string
          updated_at: string | null
        }
        Insert: {
          dimension_code: string
          evidence?: string
          id?: string
          interviewee_department?: string | null
          interviewee_id?: string | null
          interviewee_name?: string | null
          interviewee_role?: string | null
          interviewee_type?: string
          project_id: string
          score?: number | null
          subdimension_code: string
          updated_at?: string | null
        }
        Update: {
          dimension_code?: string
          evidence?: string
          id?: string
          interviewee_department?: string | null
          interviewee_id?: string | null
          interviewee_name?: string | null
          interviewee_role?: string | null
          interviewee_type?: string
          project_id?: string
          score?: number | null
          subdimension_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "t1_dimension_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      t5_canvas: {
        Row: {
          activation_sequence: Json
          company_name: string
          created_at: string | null
          domains: Json
          id: string
          maturity_level: string
          notes: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          activation_sequence?: Json
          company_name?: string
          created_at?: string | null
          domains?: Json
          id?: string
          maturity_level?: string
          notes?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          activation_sequence?: Json
          company_name?: string
          created_at?: string | null
          domains?: Json
          id?: string
          maturity_level?: string
          notes?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "t5_canvas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      t9_free_items: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          end_month: number
          id: string
          name: string
          project_id: string
          responsible: string
          risk_level: string
          roadmap_year: number
          start_month: number
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string
          end_month: number
          id?: string
          name: string
          project_id: string
          responsible?: string
          risk_level?: string
          roadmap_year?: number
          start_month: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          end_month?: number
          id?: string
          name?: string
          project_id?: string
          responsible?: string
          risk_level?: string
          roadmap_year?: number
          start_month?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "t9_free_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      t9_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          end_month: number
          id: string
          project_id: string
          responsible: string
          roadmap_year: number
          start_month: number
          updated_at: string
          updated_by: string | null
          use_case_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_month: number
          id?: string
          project_id: string
          responsible?: string
          roadmap_year?: number
          start_month: number
          updated_at?: string
          updated_by?: string | null
          use_case_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_month?: number
          id?: string
          project_id?: string
          responsible?: string
          roadmap_year?: number
          start_month?: number
          updated_at?: string
          updated_by?: string | null
          use_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "t9_overrides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_outputs: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          id: string
          payload: Json
          payload_version: number
          project_id: string
          stale_after: string | null
          status: string
          tool_code: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          payload_version?: number
          project_id: string
          stale_after?: string | null
          status?: string
          tool_code: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          payload?: Json
          payload_version?: number
          project_id?: string
          stale_after?: string | null
          status?: string
          tool_code?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tool_outputs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      use_cases: {
        Row: {
          ai_act_classification: Json | null
          ai_category: string
          business_objective: string | null
          created_at: string | null
          department: string
          description: string | null
          economics: Json | null
          go_no_go: Json | null
          id: string
          imported_from_t3: Json | null
          name: string
          notes: string | null
          priority_score: number
          project_id: string
          responsible_it_data: string | null
          roadmap: Json | null
          scores: Json
          sponsor_name: string | null
          stakeholder_scores: Json
          status: string
          t1_context: Json | null
          t2_context: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_act_classification?: Json | null
          ai_category: string
          business_objective?: string | null
          created_at?: string | null
          department: string
          description?: string | null
          economics?: Json | null
          go_no_go?: Json | null
          id?: string
          imported_from_t3?: Json | null
          name: string
          notes?: string | null
          priority_score?: number
          project_id: string
          responsible_it_data?: string | null
          roadmap?: Json | null
          scores?: Json
          sponsor_name?: string | null
          stakeholder_scores?: Json
          status?: string
          t1_context?: Json | null
          t2_context?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_act_classification?: Json | null
          ai_category?: string
          business_objective?: string | null
          created_at?: string | null
          department?: string
          description?: string | null
          economics?: Json | null
          go_no_go?: Json | null
          id?: string
          imported_from_t3?: Json | null
          name?: string
          notes?: string | null
          priority_score?: number
          project_id?: string
          responsible_it_data?: string | null
          roadmap?: Json | null
          scores?: Json
          sponsor_name?: string | null
          stakeholder_scores?: Json
          status?: string
          t1_context?: Json | null
          t2_context?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "use_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      value_streams: {
        Row: {
          ai_category: string
          created_at: string | null
          department: string
          description: string | null
          id: string
          interview: Json | null
          manual_override: boolean
          name: string
          notes: string | null
          opportunities: Json
          opportunity_level: string
          org_readiness: string
          owner: string | null
          owner_role: string | null
          phase: string
          project_id: string
          stages: Json
        }
        Insert: {
          ai_category: string
          created_at?: string | null
          department: string
          description?: string | null
          id?: string
          interview?: Json | null
          manual_override?: boolean
          name: string
          notes?: string | null
          opportunities?: Json
          opportunity_level: string
          org_readiness: string
          owner?: string | null
          owner_role?: string | null
          phase: string
          project_id: string
          stages?: Json
        }
        Update: {
          ai_category?: string
          created_at?: string | null
          department?: string
          description?: string | null
          id?: string
          interview?: Json | null
          manual_override?: boolean
          name?: string
          notes?: string | null
          opportunities?: Json
          opportunity_level?: string
          org_readiness?: string
          owner?: string | null
          owner_role?: string | null
          phase?: string
          project_id?: string
          stages?: Json
        }
        Relationships: [
          {
            foreignKeyName: "value_streams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bulk_upsert_t1_scores: { Args: { p_scores: Json }; Returns: undefined }
      can_write_project: { Args: { pid: string }; Returns: boolean }
      check_and_log_ai_call: {
        Args: { p_project_id: string; p_tool_code: string; p_user_id: string }
        Returns: Json
      }
      create_project: {
        Args: { p_company_id?: string; p_name?: string; p_phase?: string }
        Returns: {
          company_id: string | null
          created_at: string | null
          current_phase: string
          end_date: string | null
          id: string
          name: string
          owner_id: string
          start_date: string | null
          status: string
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "projects"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_company_project: { Args: { pid: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_project_member: { Args: { pid: string }; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      save_tool_output: {
        Args: {
          p_payload: Json
          p_payload_version?: number
          p_project_id: string
          p_stale_after?: string
          p_tool_code: string
        }
        Returns: string
      }
      user_can_edit_project: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      user_can_read_project: {
        Args: { p_project_id: string }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ============================================================
// TYPE ALIASES — Codebase convenience types
//
// Derivados de la interfaz Database auto-generada por Supabase CLI.
// NO editar manualmente — regenerar con:
//   npx supabase gen types typescript --project-id vbpgsgxsslccctjhuegt
//   > src/types/database.types.ts
// Luego mantener esta sección intacta (no la sobreescribe el CLI).
// ============================================================

// ── Union types de dominio ──────────────────────────────────────
export type UserRole      = 'superadmin' | 'consultant' | 'client_editor' | 'client_viewer'
export type MemberRole    = 'consultant' | 'viewer'
export type ProjectStatus = 'active' | 'archived'
export type LeanPhase     = 'listen' | 'evaluate' | 'activate' | 'normalize' | 'closed'
export type ISO42001Status = 'no_iniciado' | 'en_progreso' | 'implementado'
export type UseCaseStatus = 'candidato' | 'priorizado' | 'go' | 'no_go' | 'en_piloto' | 'completado'

// ── Friction enums ────────────────────────────────────────────
export type FrictionFrequency = 'Baja' | 'Media' | 'Alta'
export type FrictionImpact    = 'Bajo' | 'Medio' | 'Alto'

// ── Row types ───────────────────────────────────────────────────
export type CompanyRow           = Database['public']['Tables']['companies']['Row']
export type CompanyDepartmentRow = Database['public']['Tables']['company_departments']['Row']
export type ProfileRow           = Database['public']['Tables']['profiles']['Row']
export type ProjectRow           = Database['public']['Tables']['projects']['Row']
export type ProjectMemberRow     = Database['public']['Tables']['project_members']['Row']
export type CompanyProfileRow    = Database['public']['Tables']['company_profiles']['Row']
export type FrictionRow          = Database['public']['Tables']['frictions']['Row']
export type T1DimensionScoreRow  = Database['public']['Tables']['t1_dimension_scores']['Row']
export type StakeholderRow       = Database['public']['Tables']['stakeholders']['Row']
export type ValueStreamRow       = Database['public']['Tables']['value_streams']['Row']
export type UseCaseRow           = Database['public']['Tables']['use_cases']['Row']
export type T5CanvasRow          = Database['public']['Tables']['t5_canvas']['Row']
export type ISO42001ControlRow   = Database['public']['Tables']['iso42001_controls']['Row']
export type ToolOutputRow        = Database['public']['Tables']['tool_outputs']['Row']

// ── Insert types ────────────────────────────────────────────────
export type CompanyInsert          = Database['public']['Tables']['companies']['Insert']
export type CompanyDepartmentInsert= Database['public']['Tables']['company_departments']['Insert']
export type ProjectInsert          = Database['public']['Tables']['projects']['Insert']
export type CompanyProfileInsert   = Database['public']['Tables']['company_profiles']['Insert']
export type FrictionInsert         = Database['public']['Tables']['frictions']['Insert']
export type T1DimensionScoreInsert = Database['public']['Tables']['t1_dimension_scores']['Insert']
export type StakeholderInsert      = Database['public']['Tables']['stakeholders']['Insert']
export type ValueStreamInsert      = Database['public']['Tables']['value_streams']['Insert']
export type UseCaseInsert          = Database['public']['Tables']['use_cases']['Insert']
export type T5CanvasInsert         = Database['public']['Tables']['t5_canvas']['Insert']
export type ISO42001ControlInsert  = Database['public']['Tables']['iso42001_controls']['Insert']
export type ToolOutputInsert       = Database['public']['Tables']['tool_outputs']['Insert']

// ── Deprecated aliases (compatibilidad) ─────────────────────────
/** @deprecated Usar ProjectRow */
export type EngagementRow = ProjectRow
/** @deprecated Usar ProjectMemberRow */
export type EngagementMemberRow = ProjectMemberRow
/** @deprecated Usar ProjectStatus */
export type EngagementStatus = ProjectStatus
