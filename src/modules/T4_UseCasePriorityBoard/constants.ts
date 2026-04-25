// ============================================================
// T4 — Constantes: configuración de scoring, estados,
// dimensiones, go/no-go y funciones de cálculo.
// ============================================================

import type { UseCaseStatus, UseCaseScores } from './types'

// ── Configuración de estados ──────────────────────────────────

export const STATUS_CONFIG: Record<UseCaseStatus, {
  label:     string
  badgeBg:   string
  badgeText: string
  dotBg:     string
  hex:       string
  order:     number
}> = {
  go:         { label: 'Go',         badgeBg: 'bg-success-light',                    badgeText: 'text-success-dark',        dotBg: 'bg-success-dark',        hex: '#5FAF8A', order: 0 },
  en_piloto:  { label: 'En piloto',  badgeBg: 'bg-warning-light',                    badgeText: 'text-warning-dark',        dotBg: 'bg-warning-dark',        hex: '#D4A85C', order: 1 },
  priorizado: { label: 'Priorizado', badgeBg: 'bg-info-light',                       badgeText: 'text-info-dark',           dotBg: 'bg-info-dark',           hex: '#6A90C0', order: 2 },
  candidato:  { label: 'Candidato',  badgeBg: 'bg-gray-100 dark:bg-gray-800',        badgeText: 'text-gray-500',            dotBg: 'bg-gray-400',            hex: '#94A3B8', order: 3 },
  no_go:      { label: 'No-Go',      badgeBg: 'bg-danger-light',                     badgeText: 'text-danger-dark',         dotBg: 'bg-danger-dark',         hex: '#C06060', order: 4 },
  completado: { label: 'Completado', badgeBg: 'bg-navy/10 dark:bg-navy/20',          badgeText: 'text-navy dark:text-info-soft', dotBg: 'bg-navy',          hex: '#1B2A4E', order: 5 },
}

// ── Configuración de dimensiones de scoring ───────────────────

export const DIMENSION_CONFIG = {
  kpiImpact: {
    label:         'Impacto en KPI',
    description:   'Impacto estimado en los KPIs de negocio si se implementa. Mayor = más impacto directo y cuantificable.',
    direction:     'positive' as const,   // mayor = mejor
    hex:           '#6A90C0',
    light:         '#B8D0E8',
    scaleLabels:   ['Sin impacto', 'Marginal', 'Moderado', 'Alto', 'Transformador'],
  },
  feasibility: {
    label:         'Facilidad de implementación',
    description:   'Facilidad técnica, organizativa y de recursos para implementar. Mayor = más fácil y rápido.',
    direction:     'positive' as const,
    hex:           '#5FAF8A',
    light:         '#B4E4CF',
    scaleLabels:   ['Muy difícil', 'Difícil', 'Moderada', 'Fácil', 'Muy fácil'],
  },
  aiRisk: {
    label:         'Riesgo IA / Regulatorio',
    description:   'Riesgo asociado al uso de IA (sesgos, regulación, privacidad, impacto en personas). Menor riesgo = mejor.',
    direction:     'negative' as const,   // mayor = peor (se invierte)
    hex:           '#C06060',
    light:         '#DDA8A8',
    scaleLabels:   ['Muy bajo', 'Bajo', 'Moderado', 'Alto', 'Crítico'],
  },
  dataDependency: {
    label:         'Dependencia de datos',
    description:   'Grado en que el caso de uso depende de datos maduros, disponibles y de calidad. Menor dependencia bloqueante = mejor.',
    direction:     'negative' as const,
    hex:           '#D4A85C',
    light:         '#E8D0A0',
    scaleLabels:   ['Datos listos', 'Mínima prep.', 'Moderada', 'Alta', 'Bloqueante'],
  },
}

// ── Pesos del scoring compuesto ───────────────────────────────
// Resultado: 0-100 (max cuando kpi=5, feas=5, risk=1, dep=1)

export const SCORE_WEIGHTS = {
  kpiImpact:      0.35,
  feasibility:    0.30,
  aiRisk:         0.20,  // invertido: (6-aiRisk) × peso
  dataDependency: 0.15,  // invertido: (6-dataDependency) × peso
}

// ── Función de cálculo del score compuesto ────────────────────

export function computePriorityScore(scores: UseCaseScores): number {
  const { kpiImpact, feasibility, aiRisk, dataDependency } = scores
  const raw =
    kpiImpact      * SCORE_WEIGHTS.kpiImpact +
    feasibility    * SCORE_WEIGHTS.feasibility +
    (6 - aiRisk)   * SCORE_WEIGHTS.aiRisk +
    (6 - dataDependency) * SCORE_WEIGHTS.dataDependency

  // Normalizar: min=1.00, max=5.00 → 0-100
  return parseFloat(((raw / 5) * 100).toFixed(1))
}

// ── Umbrales de go/no-go ──────────────────────────────────────

export const GO_NOGO_THRESHOLDS = {
  go:      75,   // >= 75 → recomendación GO
  pending: 55,   // >= 55 → revisar (zona gris)
               // <  55 → recomendación NO-GO
}

export function getGoNoGoRecommendation(priorityScore: number): {
  recommendation: 'go' | 'pending' | 'no_go'
  label:          string
  description:    string
  badgeBg:        string
  badgeText:      string
} {
  if (priorityScore >= GO_NOGO_THRESHOLDS.go) return {
    recommendation: 'go',
    label:          'Recomendación: GO',
    description:    'Score superior al umbral de prioridad. Este caso de uso tiene el perfil adecuado para iniciar implementación o piloto.',
    badgeBg:        'bg-success-light',
    badgeText:      'text-success-dark',
  }
  if (priorityScore >= GO_NOGO_THRESHOLDS.pending) return {
    recommendation: 'pending',
    label:          'Revisar en profundidad',
    description:    'Score en zona gris. Requiere análisis adicional o mejora de alguna dimensión antes de tomar la decisión.',
    badgeBg:        'bg-warning-light',
    badgeText:      'text-warning-dark',
  }
  return {
    recommendation: 'no_go',
    label:          'Recomendación: NO-GO',
    description:    'Score inferior al umbral mínimo. No cumple criterios de priorización en el contexto actual. Revisar en próxima iteración.',
    badgeBg:        'bg-danger-light',
    badgeText:      'text-danger-dark',
  }
}

// ── Función: promediar scores de stakeholders ────────────────

export function averageStakeholderScores(
  stakeholderScores: Array<{ scores: UseCaseScores }>
): UseCaseScores | null {
  if (!stakeholderScores.length) return null
  const n = stakeholderScores.length
  const sum = stakeholderScores.reduce(
    (acc, s) => ({
      kpiImpact:      acc.kpiImpact      + s.scores.kpiImpact,
      feasibility:    acc.feasibility    + s.scores.feasibility,
      aiRisk:         acc.aiRisk         + s.scores.aiRisk,
      dataDependency: acc.dataDependency + s.scores.dataDependency,
    }),
    { kpiImpact: 0, feasibility: 0, aiRisk: 0, dataDependency: 0 }
  )
  return {
    kpiImpact:      parseFloat((sum.kpiImpact / n).toFixed(2)),
    feasibility:    parseFloat((sum.feasibility / n).toFixed(2)),
    aiRisk:         parseFloat((sum.aiRisk / n).toFixed(2)),
    dataDependency: parseFloat((sum.dataDependency / n).toFixed(2)),
  }
}

// ── Cuadrantes de la matriz de prioridad ─────────────────────
// X = facilidad de implementación (0-1)
// Y = impacto en KPI (0-1)
// Umbral: 0.60 (equivale a score 3/5)

export const PRIORITY_QUADRANTS = [
  { qx: 0.60, qy: 0.08, text: 'IMPLEMENTAR YA', color: '#5FAF8A' },
  { qx: 0.03, qy: 0.08, text: 'PLANIFICAR',     color: '#6A90C0' },
  { qx: 0.60, qy: 0.82, text: 'QUICK WIN',      color: '#9AAEC8' },
  { qx: 0.03, qy: 0.82, text: 'REVISAR',        color: '#94A3B8' },
] as const

export const STATUS_ORDER: UseCaseStatus[] = [
  'go', 'en_piloto', 'priorizado', 'candidato', 'no_go', 'completado',
]

// ── Opciones de quarter para hoja de ruta ─────────────────────

export const ROADMAP_QUARTERS = [
  'Q2 2026', 'Q3 2026', 'Q4 2026',
  'Q1 2027', 'Q2 2027', 'Q3 2027', 'Q4 2027',
] as const

// ── Categorías IA (referencia desde T3) ───────────────────────

export const AI_CATEGORY_LABELS: Record<string, string> = {
  automatizacion_inteligente: 'Automatización Inteligente',
  automatizacion_rpa:         'Automatización RPA',
  analitica_predictiva:       'Analítica Predictiva',
  asistente_ia:               'Asistente IA',
  optimizacion_proceso:       'Optimización de Proceso',
}

export const AI_CATEGORY_HEX: Record<string, string> = {
  automatizacion_inteligente: '#6A90C0',
  automatizacion_rpa:         '#5FAF8A',
  analitica_predictiva:       '#1B2A4E',
  asistente_ia:               '#D4A85C',
  optimizacion_proceso:       '#C06060',
}
