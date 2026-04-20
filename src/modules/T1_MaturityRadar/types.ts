// ============================================================
// T1 — AI Readiness Assessment · Tipos
//
// Sprint 2 refactor: arquitectura de subdimensiones
// — 6 dimensiones principales × 4 subdimensiones = 24 puntos
// — Escala 0-4 por subdimensión (0=Sin evidencia → 4=Óptimo)
// — Soporte para múltiples entrevistados (IT vs. Negocio)
// ============================================================

/**
 * Estado editable de una subdimensión durante la sesión de entrevista.
 *
 * Escala 0–4:
 *   0 = Sin evidencia   (no existe o no evaluable)
 *   1 = Inicial         (ad hoc, sin proceso)
 *   2 = Emergente       (en construcción, parcial)
 *   3 = Sistemático     (proceso formalizado y operativo)
 *   4 = Óptimo          (referente, mejora continua institucionalizada)
 */
export interface T1SubdimensionState {
  code:          string         // e.g. 'data-availability'
  label:         string         // e.g. 'Disponibilidad de datos'
  dimensionCode: string         // código de la dimensión padre, e.g. 'data'
  score:         number | null  // 0–4, null = sin puntuar aún
  evidence:      string         // nota de apoyo (editable en sesión)
  showCriteria:  boolean        // UI: mostrar/ocultar criterios expandibles
  showEvidence:  boolean        // UI: mostrar/ocultar textarea de evidencia
}

/**
 * Estado de una dimensión principal.
 * Contiene sus subdimensiones y metadatos de identificación.
 *
 * Score de la dimensión = media aritmética de las subdimensiones con score ≠ null.
 */
export interface T1DimensionState {
  code:          string                 // 'strategy', 'data', 'technology', etc.
  label:         string                 // 'Estrategia', 'Datos', etc.
  dimNumber:     string                 // 'D1', 'D2', ... 'D6'
  subdimensions: T1SubdimensionState[]  // siempre 4 subdimensiones
}

/**
 * Contexto del entrevistado activo en la sesión T1.
 * Se carga desde el DemoScenario y se puede cambiar en la UI.
 */
export interface T1IntervieweeContext {
  id:        string
  name:      string
  role:      string      // 'CIO', 'CEO', 'Head of Digital', etc.
  archetype: string      // 'Ejecutivo TI', 'Líder de Negocio', etc.
  type:      'it' | 'business'
}

/**
 * Output auto-generado del T1 para el panel ejecutivo (QW1).
 * Se recalcula en tiempo real al cambiar cualquier score.
 */
export interface T1Output {
  overallScore:    number
  maturityTier:    MaturityTier
  strengths:       { code: string; label: string; score: number }[]
  gaps:            { code: string; label: string; score: number; target: number }[]
  priorityActions: string[]
}

// ── Niveles de madurez (escala 0-4) ──────────────────────────

export type MaturityTier =
  | 'inicial'
  | 'exploracion'
  | 'desarrollo'
  | 'avanzado'
  | 'lider'

export const MATURITY_TIER_CONFIG: Record<MaturityTier, {
  label:       string
  range:       [number, number]
  description: string
  color:       string   // Tailwind color tokens
}> = {
  inicial: {
    label:       'Iniciación',
    range:       [0, 1.0],
    description: 'La IA es experimental y no gobernada. Las iniciativas son oportunistas y sin alineación estratégica.',
    color:       'text-danger-dark bg-danger-light',
  },
  exploracion: {
    label:       'Exploración',
    range:       [1.0, 2.0],
    description: 'Hay conciencia del potencial IA pero faltan estructuras, procesos y gobierno formal.',
    color:       'text-warning-dark bg-warning-light',
  },
  desarrollo: {
    label:       'Desarrollo',
    range:       [2.0, 3.0],
    description: 'El ecosistema IA está en construcción. Hay bases sólidas pero la institucionalización no está completa.',
    color:       'text-info-dark bg-info-light',
  },
  avanzado: {
    label:       'Avanzado',
    range:       [3.0, 3.5],
    description: 'Gobierno robusto y IA como palanca real de negocio. La organización puede ejecutar y escalar.',
    color:       'text-success-dark bg-success-light',
  },
  lider: {
    label:       'Líder',
    range:       [3.5, 4.0],
    description: 'Referente de industria. La IA es un diferenciador estratégico central y la gobernanza es modelo para el sector.',
    color:       'text-success-dark bg-success-light',
  },
}

export function resolveMaturityTier(score: number): MaturityTier {
  if (score < 1.0) return 'inicial'
  if (score < 2.0) return 'exploracion'
  if (score < 3.0) return 'desarrollo'
  if (score < 3.5) return 'avanzado'
  return 'lider'
}

// ── Helpers de cálculo ────────────────────────────────────────

/**
 * Score (0-4) de una dimensión = media aritmética de subdimensiones puntuadas.
 * Devuelve null si ninguna subdimensión ha sido puntuada aún.
 */
export function computeDimensionScore(dim: T1DimensionState): number | null {
  const scored = dim.subdimensions.filter((s) => s.score !== null)
  if (scored.length === 0) return null
  return scored.reduce((sum, s) => sum + (s.score as number), 0) / scored.length
}

/**
 * Overall score (0-4) = media de las dimensiones que tienen al menos 1 subdimensión puntuada.
 * Devuelve 0 si ninguna dimensión tiene scores.
 */
export function computeOverallScore(dimensions: T1DimensionState[]): number {
  const scored = dimensions
    .map((d) => computeDimensionScore(d))
    .filter((s): s is number => s !== null)
  if (scored.length === 0) return 0
  return scored.reduce((sum, s) => sum + s, 0) / scored.length
}

/**
 * Cuenta el total de subdimensiones puntuadas (score ≠ null) en todas las dimensiones.
 */
export function countScoredSubdimensions(dimensions: T1DimensionState[]): number {
  return dimensions.reduce(
    (total, dim) => total + dim.subdimensions.filter((s) => s.score !== null).length,
    0
  )
}
