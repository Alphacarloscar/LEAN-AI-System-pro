// ============================================================
// T3 — Constantes: categorías IA, preguntas, scoring
// ============================================================

import type {
  AICategoryCode, AICategoryConfig, OrgReadinessLevel,
  OpportunityLevel, ProcessPhase, InterviewQuestion,
  InterviewAnswerCode, ProcessInterviewResult,
} from './types'

// ── Configuración de fases ────────────────────────────────────

export const PHASE_CONFIG: Record<ProcessPhase, {
  label: string; badgeBg: string; badgeText: string; order: number
}> = {
  idea:            { label: 'Idea',            badgeBg: 'bg-gray-100 dark:bg-gray-800', badgeText: 'text-gray-500', order: 0 },
  validacion:      { label: 'Validación',      badgeBg: 'bg-warning-light',             badgeText: 'text-warning-dark', order: 1 },
  piloto:          { label: 'Piloto',          badgeBg: 'bg-info-light',                badgeText: 'text-info-dark', order: 2 },
  estandarizacion: { label: 'Estandarización', badgeBg: 'bg-success-light',             badgeText: 'text-success-dark', order: 3 },
  escalado:        { label: 'Escalado',        badgeBg: 'bg-navy/10 dark:bg-navy/20',   badgeText: 'text-navy dark:text-info-soft', order: 4 },
}

// ── Configuración de categorías IA ───────────────────────────

export const AI_CATEGORY_CONFIG: Record<AICategoryCode, AICategoryConfig> = {
  automatizacion_inteligente: {
    code:        'automatizacion_inteligente',
    label:       'Automatización Inteligente',
    tagline:     'Alto volumen + datos ricos. Automatiza con criterio IA.',
    description: 'Proceso repetitivo con datos disponibles y estructurados. Puede automatizarse end-to-end con IA que toma decisiones dentro de reglas definidas. Máximo ROI y mínimo riesgo operacional.',
    badgeBg:     'bg-info-light',
    badgeText:   'text-info-dark',
    dotBg:       'bg-info-dark',
    hex:         '#6A90C0',
    opportunityTemplates: [
      {
        title:       'Automatización end-to-end del flujo',
        description: 'Orquestación del proceso completo con IA tomando decisiones en cada etapa según reglas de negocio definidas.',
        effort: 'medio', impact: 'alto',
      },
      {
        title:       'Clasificación y routing inteligente',
        description: 'Clasificación automática de inputs (tickets, documentos, solicitudes) y asignación al canal correcto sin intervención humana.',
        effort: 'bajo', impact: 'alto',
      },
      {
        title:       'Extracción + enriquecimiento de datos',
        description: 'Extracción automática de datos estructurados desde fuentes heterogéneas y enriquecimiento con información contextual.',
        effort: 'bajo', impact: 'medio',
      },
    ],
  },

  automatizacion_rpa: {
    code:        'automatizacion_rpa',
    label:       'Automatización RPA',
    tagline:     'Proceso repetitivo basado en reglas. Automatización directa.',
    description: 'Proceso altamente repetitivo y predecible pero con datos parcialmente estructurados. Ideal para RPA o automatización de flujos de trabajo. Implantación rápida y ROI inmediato.',
    badgeBg:     'bg-success-light',
    badgeText:   'text-success-dark',
    dotBg:       'bg-success-dark',
    hex:         '#5FAF8A',
    opportunityTemplates: [
      {
        title:       'Robot de proceso para tareas repetitivas',
        description: 'Automatización de las etapas manuales y repetitivas del proceso mediante RPA. Elimina el trabajo mecánico del equipo.',
        effort: 'bajo', impact: 'medio',
      },
      {
        title:       'Asistente de captura y validación',
        description: 'IA que captura datos de múltiples fuentes, valida consistencia y rellena formularios o sistemas destino automáticamente.',
        effort: 'bajo', impact: 'medio',
      },
      {
        title:       'Orquestador de aprobaciones',
        description: 'Sistema que gestiona el flujo de aprobaciones, notifica a los responsables y escala automáticamente cuando hay bloqueos.',
        effort: 'medio', impact: 'medio',
      },
    ],
  },

  analitica_predictiva: {
    code:        'analitica_predictiva',
    label:       'Analítica Predictiva',
    tagline:     'Datos ricos + impacto alto. Transforma datos en decisiones.',
    description: 'El proceso genera o consume datos valiosos con potencial para modelos predictivos. La IA puede anticipar resultados, detectar anomalías y recomendar acciones antes de que ocurran los problemas.',
    badgeBg:     'bg-navy/10 dark:bg-navy/20',
    badgeText:   'text-navy dark:text-info-soft',
    dotBg:       'bg-navy',
    hex:         '#1B2A4E',
    opportunityTemplates: [
      {
        title:       'Modelo predictivo de demanda / riesgo',
        description: 'Modelo de ML que anticipa la demanda, riesgo o comportamiento futuro basándose en patrones históricos del proceso.',
        effort: 'alto', impact: 'alto',
      },
      {
        title:       'Detección de anomalías en tiempo real',
        description: 'Sistema que identifica desviaciones del comportamiento esperado del proceso y alerta antes de que impacten en el negocio.',
        effort: 'medio', impact: 'alto',
      },
      {
        title:       'Dashboard de inteligencia operacional',
        description: 'Panel que combina datos históricos con predicciones IA para dar visibilidad en tiempo real al estado del proceso.',
        effort: 'medio', impact: 'medio',
      },
    ],
  },

  asistente_ia: {
    code:        'asistente_ia',
    label:       'Asistente IA',
    tagline:     'Equipo dispuesto. Amplifica con copilot o asistente.',
    description: 'El equipo tiene buena disposición hacia la IA y el proceso requiere criterio humano. Un asistente IA actúa como copilot: amplifica la capacidad del equipo sin reemplazarle.',
    badgeBg:     'bg-warning-light',
    badgeText:   'text-warning-dark',
    dotBg:       'bg-warning-dark',
    hex:         '#D4A85C',
    opportunityTemplates: [
      {
        title:       'Copilot para el equipo responsable',
        description: 'Asistente conversacional que responde preguntas, genera borradores y apoya la toma de decisiones del equipo en tiempo real.',
        effort: 'bajo', impact: 'medio',
      },
      {
        title:       'Generación automatizada de documentos',
        description: 'IA que genera borradores de informes, propuestas, actas y comunicaciones a partir de datos estructurados del proceso.',
        effort: 'bajo', impact: 'medio',
      },
      {
        title:       'Síntesis y resumen inteligente',
        description: 'Extracción automática de insights clave de documentos extensos, reuniones grabadas o histórico de datos del proceso.',
        effort: 'bajo', impact: 'bajo',
      },
    ],
  },

  optimizacion_proceso: {
    code:        'optimizacion_proceso',
    label:       'Optimización de Proceso',
    tagline:     'Potencial moderado. Foco en diagnóstico y mejora base.',
    description: 'El proceso tiene potencial IA moderado o requiere trabajo previo de maduración (datos, digitalización, readiness). La IA puede ayudar en la fase de diagnóstico y mejora incremental.',
    badgeBg:     'bg-danger-light',
    badgeText:   'text-danger-dark',
    dotBg:       'bg-danger-dark',
    hex:         '#C06060',
    opportunityTemplates: [
      {
        title:       'Diagnóstico de cuellos de botella con IA',
        description: 'Análisis automatizado del flujo de proceso para identificar los puntos de mayor pérdida de tiempo y valor.',
        effort: 'bajo', impact: 'bajo',
      },
      {
        title:       'Reporting ejecutivo dinámico',
        description: 'Automatización de los informes periódicos del proceso con insights IA sobre tendencias y desviaciones.',
        effort: 'bajo', impact: 'bajo',
      },
      {
        title:       'Hoja de ruta de maduración de datos',
        description: 'Plan para mejorar la calidad y estructura de los datos del proceso como prerequisito para iniciativas IA avanzadas.',
        effort: 'medio', impact: 'medio',
      },
    ],
  },
}

// ── Etiquetas de readiness organizacional ────────────────────

export const READINESS_CONFIG: Record<OrgReadinessLevel, {
  label: string; badgeBg: string; badgeText: string; dotBg: string
}> = {
  baja:  { label: 'Readiness Baja',  badgeBg: 'bg-danger-light',  badgeText: 'text-danger-dark',  dotBg: 'bg-danger-dark' },
  media: { label: 'Readiness Media', badgeBg: 'bg-warning-light', badgeText: 'text-warning-dark', dotBg: 'bg-warning-dark' },
  alta:  { label: 'Readiness Alta',  badgeBg: 'bg-success-light', badgeText: 'text-success-dark', dotBg: 'bg-success-dark' },
}

export const OPPORTUNITY_CONFIG: Record<OpportunityLevel, {
  label: string; badgeBg: string; badgeText: string
}> = {
  baja:   { label: 'Oportunidad Baja',   badgeBg: 'bg-gray-100 dark:bg-gray-800', badgeText: 'text-gray-500' },
  media:  { label: 'Oportunidad Media',  badgeBg: 'bg-warning-light',  badgeText: 'text-warning-dark' },
  alta:   { label: 'Oportunidad Alta',   badgeBg: 'bg-info-light',     badgeText: 'text-info-dark' },
  critica:{ label: 'Oportunidad Crítica',badgeBg: 'bg-navy/10 dark:bg-navy/20', badgeText: 'text-navy dark:text-info-soft' },
}

// ── Preguntas de la entrevista (6 MCQ) ───────────────────────
// Cada respuesta suma puntos a 5 dimensiones:
//   automation, data, volume, impact, readiness

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id:   1,
    text: '¿Qué porcentaje del proceso es repetitivo, predecible y basado en reglas fijas?',
    hint: 'Piensa en las tareas que siempre se hacen igual, independientemente de quién las ejecute.',
    answers: [
      { code: 'A', text: 'Más del 70% — es muy repetitivo y estructurado',              scores: { automation: 4, data: 0, volume: 0, impact: 0, readiness: 0 } },
      { code: 'B', text: 'Entre 40-70% — parte repetitiva, parte requiere criterio',     scores: { automation: 2.5, data: 0, volume: 0, impact: 0, readiness: 0 } },
      { code: 'C', text: 'Entre 20-40% — hay partes estructurables pero mucho juicio',  scores: { automation: 1.5, data: 0, volume: 0, impact: 0, readiness: 0 } },
      { code: 'D', text: 'Menos del 20% — principalmente criterio humano',              scores: { automation: 0,   data: 0, volume: 0, impact: 0, readiness: 0 } },
    ],
  },
  {
    id:   2,
    text: '¿Cómo describirías la disponibilidad y calidad de los datos de este proceso?',
    hint: 'Considera si los datos están digitalizados, son accesibles y tienen buena calidad.',
    answers: [
      { code: 'A', text: 'Datos digitalizados, accesibles, estructurados y de buena calidad',    scores: { automation: 0, data: 4,   volume: 0, impact: 0, readiness: 0 } },
      { code: 'B', text: 'Disponibles pero con fricción: silos, acceso manual o calidad irregular', scores: { automation: 0, data: 2.5, volume: 0, impact: 0, readiness: 0 } },
      { code: 'C', text: 'Parciales o incompletos — faltan datos o están en formatos difíciles',  scores: { automation: 0, data: 1.5, volume: 0, impact: 0, readiness: 0 } },
      { code: 'D', text: 'Mayoritariamente manuales, en papel o sin digitalizar',                 scores: { automation: 0, data: 0,   volume: 0, impact: 0, readiness: 0 } },
    ],
  },
  {
    id:   3,
    text: '¿Con qué frecuencia y volumen opera este proceso?',
    hint: 'Cuántas veces al día/semana se ejecuta y cuántas personas o transacciones involucra.',
    answers: [
      { code: 'A', text: 'Diario o continuo — alto volumen de transacciones o personas',       scores: { automation: 0, data: 0, volume: 4,   impact: 0, readiness: 0 } },
      { code: 'B', text: 'Varias veces por semana — volumen medio, regularidad predecible',    scores: { automation: 0, data: 0, volume: 2.5, impact: 0, readiness: 0 } },
      { code: 'C', text: 'Semanal o mensual — bajo volumen o periodicidad irregular',           scores: { automation: 0, data: 0, volume: 1.5, impact: 0, readiness: 0 } },
      { code: 'D', text: 'Esporádico o puntual — muy bajo volumen',                            scores: { automation: 0, data: 0, volume: 0,   impact: 0, readiness: 0 } },
    ],
  },
  {
    id:   4,
    text: '¿Qué impacto tendría mejorar este proceso en los resultados del negocio?',
    hint: 'Piensa en ahorro de tiempo, reducción de errores, velocidad de respuesta o calidad del servicio.',
    answers: [
      { code: 'A', text: 'Alto y cuantificable — ahorro significativo de tiempo, coste o mejora de calidad',  scores: { automation: 0, data: 0, volume: 0, impact: 4,   readiness: 0 } },
      { code: 'B', text: 'Moderado — mejoras claras pero no transformadoras a corto plazo',                   scores: { automation: 0, data: 0, volume: 0, impact: 2.5, readiness: 0 } },
      { code: 'C', text: 'Difuso — impacto existe pero es difícil de cuantificar',                            scores: { automation: 0, data: 0, volume: 0, impact: 1.5, readiness: 0 } },
      { code: 'D', text: 'Bajo o muy indirecto — no es un proceso crítico para el negocio',                   scores: { automation: 0, data: 0, volume: 0, impact: 0,   readiness: 0 } },
    ],
  },
  {
    id:   5,
    text: '¿Cuál es la actitud del equipo responsable hacia la automatización o la IA?',
    hint: 'Cómo respondería el equipo si se les propusiera pilotar IA en este proceso.',
    answers: [
      { code: 'A', text: 'Proactivos — buscan activamente soluciones IA o ya experimentan',    scores: { automation: 0, data: 0, volume: 0, impact: 0, readiness: 4 } },
      { code: 'B', text: 'Abiertos — adoptarían si reciben formación y soporte adecuado',       scores: { automation: 0, data: 0, volume: 0, impact: 0, readiness: 2.5 } },
      { code: 'C', text: 'Escépticos — necesitan ver evidencia antes de comprometerse',         scores: { automation: 0, data: 0, volume: 0, impact: 0, readiness: 1.5 } },
      { code: 'D', text: 'Resistentes — temen que la IA afecte su rol o el de su equipo',       scores: { automation: 0, data: 0, volume: 0, impact: 0, readiness: 0 } },
    ],
  },
  {
    id:   6,
    text: '¿Cuánto tiempo manual consume este proceso en el equipo actualmente?',
    hint: 'Suma las horas semanales de todas las personas involucradas en el proceso.',
    answers: [
      { code: 'A', text: 'Más de 20h/semana — carga alta en el equipo',     scores: { automation: 1,   data: 0, volume: 0, impact: 3,   readiness: 0 } },
      { code: 'B', text: 'Entre 8-20h/semana — carga media, notable',       scores: { automation: 0.5, data: 0, volume: 0, impact: 2,   readiness: 0 } },
      { code: 'C', text: 'Entre 2-8h/semana — carga baja pero visible',     scores: { automation: 0,   data: 0, volume: 0, impact: 1,   readiness: 0 } },
      { code: 'D', text: 'Menos de 2h/semana — carga mínima',               scores: { automation: 0,   data: 0, volume: 0, impact: 0,   readiness: 0 } },
    ],
  },
]

// Máximos posibles por dimensión (para normalizar a 0-4)
const MAX_AUTOMATION = 4 + 0 + 0 + 0 + 0 + 1   // Q1 + Q6 = 5
const MAX_DATA       = 4                          // Q2 = 4
const MAX_VOLUME     = 4                          // Q3 = 4
const MAX_IMPACT     = 0 + 0 + 0 + 4 + 0 + 3    // Q4 + Q6 = 7
const MAX_READINESS  = 4                          // Q5 = 4

// ── Algoritmo de scoring ──────────────────────────────────────

export function computeProcessInterviewResult(
  answers: Record<number, InterviewAnswerCode>
): Omit<ProcessInterviewResult, 'computedAt'> {
  // Acumular puntos brutos
  let rawAuto = 0, rawData = 0, rawVol = 0, rawImpact = 0, rawReady = 0

  INTERVIEW_QUESTIONS.forEach((q) => {
    const answerCode = answers[q.id]
    if (!answerCode) return
    const option = q.answers.find((a) => a.code === answerCode)
    if (!option) return
    rawAuto   += option.scores.automation
    rawData   += option.scores.data
    rawVol    += option.scores.volume
    rawImpact += option.scores.impact
    rawReady  += option.scores.readiness
  })

  // Normalizar a escala 0-4
  const automationScore  = parseFloat(((rawAuto  / MAX_AUTOMATION) * 4).toFixed(2))
  const dataScore        = parseFloat(((rawData  / MAX_DATA)       * 4).toFixed(2))
  const volumeScore      = parseFloat(((rawVol   / MAX_VOLUME)     * 4).toFixed(2))
  const impactScore      = parseFloat(((rawImpact/ MAX_IMPACT)     * 4).toFixed(2))
  const readinessScore   = parseFloat(((rawReady / MAX_READINESS)  * 4).toFixed(2))

  // ── Score compuesto de oportunidad IA (ponderado) ─────────
  // Pesos: automation 35%, data 25%, volume 20%, impact 20%
  const opportunityScore = parseFloat((
    automationScore * 0.35 +
    dataScore       * 0.25 +
    volumeScore     * 0.20 +
    impactScore     * 0.20
  ).toFixed(2))

  // ── Asignación de categoría IA (priority-ordered) ─────────
  let aiCategory: AICategoryCode

  if (automationScore >= 2.5 && dataScore >= 2.5) {
    aiCategory = 'automatizacion_inteligente'
  } else if (automationScore >= 2.5) {
    aiCategory = 'automatizacion_rpa'
  } else if (dataScore >= 2.5 && impactScore >= 2) {
    aiCategory = 'analitica_predictiva'
  } else if (readinessScore >= 2.5) {
    aiCategory = 'asistente_ia'
  } else {
    aiCategory = 'optimizacion_proceso'
  }

  // ── Readiness organizacional ──────────────────────────────
  const orgReadiness: OrgReadinessLevel =
    readinessScore >= 2.5 ? 'alta' :
    readinessScore >= 1.5 ? 'media' :
                            'baja'

  return {
    answers,
    automationScore,
    dataScore,
    volumeScore,
    impactScore,
    readinessScore,
    opportunityScore,
    aiCategory,
    orgReadiness,
  }
}

// ── Nivel de oportunidad a partir del score ──────────────────

export function getOpportunityLevel(opportunityScore: number): OpportunityLevel {
  if (opportunityScore >= 3.2) return 'critica'
  if (opportunityScore >= 2.2) return 'alta'
  if (opportunityScore >= 1.2) return 'media'
  return 'baja'
}

// ── Generar oportunidades IA desde la categoría ──────────────

export function generateOpportunities(
  category: AICategoryCode,
  processId: string
): import('./types').AIOpportunity[] {
  const templates = AI_CATEGORY_CONFIG[category].opportunityTemplates
  return templates.map((t, i) => ({
    id:          `${processId}-opp-${i}`,
    title:       t.title,
    description: t.description,
    effort:      t.effort,
    impact:      t.impact,
    status:      'sugerida' as const,
  }))
}
