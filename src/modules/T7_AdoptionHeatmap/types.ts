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
