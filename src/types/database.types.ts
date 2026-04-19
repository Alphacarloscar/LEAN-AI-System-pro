// ============================================================
// LEAN AI System — Tipos de base de datos (Supabase)
//
// ⚠ Este archivo se SOBREESCRIBE automáticamente con:
//   supabase gen types typescript --project-id TU_PROJECT_ID
//
// Sprint 0.5: placeholder mínimo para que TypeScript compile.
// Sprint 1: se sustituye por los tipos generados reales.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Placeholder hasta Sprint 1 — se reemplaza con tipos generados desde Supabase
export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
