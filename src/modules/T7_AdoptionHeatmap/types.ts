// ============================================================
// T7 — Adoption Heatmap — Tipos
//
// Segmentación Rogers + config visual.
// Los tipos de stakeholder se importan desde T2.
// ============================================================

export type RogersSegment =
  | 'innovators'
  | 'early_adopters'
  | 'early_majority'
  | 'late_majority'
  | 'laggards'

export interface SegmentBounds {
  x1: number
  x2: number
}

export interface DotPosition {
  stakeholderId: string
  segment:       RogersSegment
  cx:            number
  cy:            number
}

// ── Plan de cambio generado por LLM ──────────────────────────

export interface GeneratedChangePlanPhase {
  phase:     string    // e.g. "Mes 1–2"
  title:     string
  icon:      string    // emoji
  objective: string
  segments:  string[]  // segmentos Rogers a los que se dirige la fase
  actions:   string[]  // 3–4 acciones concretas
  risk:      string    // riesgo principal de la fase
}

export interface GeneratedChangePlan {
  phases:          GeneratedChangePlanPhase[]
  contextualNote:  string   // patrón crítico observado
  generatedAt:     string   // ISO timestamp
}
