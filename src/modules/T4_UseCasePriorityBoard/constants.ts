// ============================================================
// T4 — Constantes: configuración de scoring, estados,
// dimensiones, go/no-go, benchmarks ROI y funciones de cálculo.
//
// Escala de scoring: 0-100 continua (slider).
// Score compuesto: fórmula directa 0-100.
// ============================================================

import type { UseCaseStatus, UseCaseScores, UseCaseEconomics, HourlyRatePreset } from './types'

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
// Fórmula directa 0-100:
//   score = kpi×0.35 + feas×0.30 + (100-risk)×0.20 + (100-dep)×0.15
// Máximo: 100×(0.35+0.30+0.20+0.15) = 100. Mínimo: 0.

export const SCORE_WEIGHTS = {
  kpiImpact:      0.35,
  feasibility:    0.30,
  aiRisk:         0.20,  // invertido: (100-aiRisk) × peso
  dataDependency: 0.15,  // invertido: (100-dataDependency) × peso
}

// ── Función de cálculo del score compuesto ────────────────────

export function computePriorityScore(scores: UseCaseScores): number {
  const { kpiImpact, feasibility, aiRisk, dataDependency } = scores
  const raw =
    kpiImpact           * SCORE_WEIGHTS.kpiImpact +
    feasibility         * SCORE_WEIGHTS.feasibility +
    (100 - aiRisk)      * SCORE_WEIGHTS.aiRisk +
    (100 - dataDependency) * SCORE_WEIGHTS.dataDependency

  return parseFloat(raw.toFixed(1))
}

// ── Umbrales de go/no-go (escala 0-100) ──────────────────────

export const GO_NOGO_THRESHOLDS = {
  go:      70,   // >= 70 → recomendación GO
  pending: 50,   // >= 50 → revisar (zona gris)
               // <  50 → recomendación NO-GO
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
    kpiImpact:      parseFloat((sum.kpiImpact / n).toFixed(1)),
    feasibility:    parseFloat((sum.feasibility / n).toFixed(1)),
    aiRisk:         parseFloat((sum.aiRisk / n).toFixed(1)),
    dataDependency: parseFloat((sum.dataDependency / n).toFixed(1)),
  }
}

// ── Cuadrantes de la matriz de prioridad ─────────────────────
// X = facilidad de implementación (0-100)
// Y = impacto en KPI (0-100)
// Umbral: 60 (equivale a 60/100)

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

// ── Benchmarks de coste de implementación por categoría IA ───
// Rangos basados en proyectos IA B2B en mercado español/europeo
// (fuente: estimación interna Alpha Consulting, revisable por engagement)

export const IMPLEMENTATION_COST_BENCHMARKS: Record<string, {
  min:       number
  max:       number
  suggested: number
  label:     string
}> = {
  automatizacion_inteligente: { min: 15_000, max: 60_000, suggested: 30_000, label: '15k – 60k €' },
  automatizacion_rpa:         { min:  8_000, max: 40_000, suggested: 18_000, label:  '8k – 40k €' },
  analitica_predictiva:       { min: 20_000, max: 80_000, suggested: 40_000, label: '20k – 80k €' },
  asistente_ia:               { min:  5_000, max: 25_000, suggested: 12_000, label:  '5k – 25k €' },
  optimizacion_proceso:       { min: 12_000, max: 50_000, suggested: 25_000, label: '12k – 50k €' },
}

// ── Benchmarks de ganancia de eficiencia por categoría IA ────
// Porcentaje de reducción de tiempo/esfuerzo esperado en el proceso.
// 0.0 = sin mejora. 1.0 = proceso 100% automatizado.

export const EFFICIENCY_GAIN_BENCHMARKS: Record<string, {
  value: number
  label: string
}> = {
  automatizacion_inteligente: { value: 0.55, label: '~55% reducción de carga manual' },
  automatizacion_rpa:         { value: 0.70, label: '~70% reducción de carga manual' },
  analitica_predictiva:       { value: 0.30, label: '~30% mejora de velocidad decisional' },
  asistente_ia:               { value: 0.40, label: '~40% reducción de tiempo en tarea' },
  optimizacion_proceso:       { value: 0.35, label: '~35% reducción de ineficiencias' },
}

// ── Presets de coste por hora (€/hora, coste cargado) ─────────
// Administrativo ≈ salario bruto 22k, carga ×2.0
// Técnico ≈ salario bruto 40k, carga ×2.0
// Directivo ≈ salario bruto 80k, carga ×2.0

export const HOURLY_RATE_PRESETS: Record<HourlyRatePreset, {
  rate:  number
  label: string
  hint:  string
}> = {
  administrativo: { rate: 25, label: 'Administrativo',  hint: '~25 €/h · perfil backoffice, soporte, ops' },
  tecnico:        { rate: 45, label: 'Técnico / Mando', hint: '~45 €/h · IT, analítica, product, RRHH, finanzas' },
  directivo:      { rate: 90, label: 'Directivo',       hint: '~90 €/h · C-level, directores de área' },
}

// ── Mapa de horas semanales desde respuesta Q6 de T3 ─────────
// Q6 de T3 = "¿Cuántas horas/semana consume este proceso?"
// Opciones: A (>20h), B (5-20h), C (1-5h), D (<1h)

export const T3_HOURS_FROM_ANSWER: Record<string, number> = {
  A: 25,  // > 20 horas/semana → 25h (estimación central)
  B: 14,  // 5-20 horas/semana → 14h (estimación central)
  C: 5,   // 1-5 horas/semana  → 5h  (estimación central)
  D: 1,   // < 1 hora/semana   → 1h
}

// ── Función de cálculo de ROI desde datos económicos ─────────
//
// annualSaving = horasSemanales × personas × 52 semanas × gananciaEfic × €/h
// paybackMeses = costeImpl / (ahorro / 12)
// roi3años (%) = (ahorro×3 - costeImpl) / costeImpl × 100

export interface ROIResult {
  annualSaving:   number   // € ahorro anual estimado
  paybackMonths:  number   // meses para recuperar inversión
  roi3year:       number   // % ROI a 3 años
}

export function computeROIFromEconomics(econ: UseCaseEconomics): ROIResult {
  const annualSaving =
    econ.processHoursPerWeek *
    econ.headcount *
    52 *
    econ.efficiencyGain *
    econ.hourlyRate

  const paybackMonths =
    annualSaving > 0 && econ.implementationCost > 0
      ? econ.implementationCost / (annualSaving / 12)
      : 0

  const roi3year =
    econ.implementationCost > 0
      ? ((annualSaving * 3 - econ.implementationCost) / econ.implementationCost) * 100
      : 0

  return {
    annualSaving:   Math.round(annualSaving),
    paybackMonths:  parseFloat(paybackMonths.toFixed(1)),
    roi3year:       parseFloat(roi3year.toFixed(0)),
  }
}
