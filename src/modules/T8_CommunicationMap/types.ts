// ============================================================
// T8 — Communication Map — Tipos
// ============================================================

export type CommPhase = 'phase1' | 'phase2' | 'phase3'

export type CommType =
  | 'anuncio'
  | 'formacion'
  | 'actualizacion'
  | 'sesion_bilateral'
  | 'workshop'
  | 'newsletter'
  | 'presentacion_ejecutiva'

export type CommChannel =
  | 'email'
  | 'reunion_presencial'
  | 'teams_slack'
  | 'presentacion'
  | 'video'
  | 'documento'

export type CommPriority = 'alta' | 'media' | 'baja'

export interface CommAction {
  id:        string
  phase:     CommPhase
  week:      string          // e.g. "Semana 1-2"
  type:      CommType
  title:     string
  audience:  string          // Specific stakeholder groups
  message:   string          // Core message to deliver
  channel:   CommChannel
  owner:     string          // Who delivers this
  priority:  CommPriority
  materials?: string[]       // Suggested supporting materials
}

export interface ArchetypeMessage {
  archetypeCode:  string
  archetypeLabel: string
  headline:       string
  keyPoints:      string[]
  doNotSay:       string
  openingLine:    string
  channel:        CommChannel
  resistanceNote: string
}

export interface MaterialTemplate {
  id:       string
  title:    string
  subtitle: string
  icon:     string
  content:  string   // Full copyable text
  tags:     string[]
}

export interface DeptKit {
  department:  string
  readiness:   number       // 0-100
  readinessLabel: string
  mainConcern: string
  approach:    string
  actions:     string[]
  channel:     CommChannel
  ambassadors: string[]     // Names of ambassadors in this dept
}
