// ============================================================
// T5 — AI Domain Architecture Canvas — Constantes
// ============================================================

import type { T5DomainCode, T5Recommendation, T5DomainScores, T5MaturityLevel } from './types'

// ── Configuración de los 6 dominios IA ───────────────────────

export const T5_DOMAIN_CONFIG: Record<T5DomainCode, {
  label:       string
  shortLabel:  string
  hex:         string
  tagline:     string
  description: string
  icon:        string
}> = {
  automatizacion_rpa: {
    label:       'Automatización RPA',
    shortLabel:  'RPA',
    hex:         '#5FAF8A',
    tagline:     'Procesos repetitivos, cero intervención humana',
    description: 'Robots que replican tareas manuales estructuradas: entrada de datos, extracción y transferencia entre sistemas.',
    icon:        '⚙️',
  },
  automatizacion_inteligente: {
    label:       'Automatización Inteligente',
    shortLabel:  'Auto-IA',
    hex:         '#6A90C0',
    tagline:     'RPA + comprensión contextual mediante IA',
    description: 'Combina automatización con capacidades cognitivas: clasificación, extracción de documentos no estructurados, decisiones contextuales.',
    icon:        '🤖',
  },
  analitica_predictiva: {
    label:       'Analítica Predictiva',
    shortLabel:  'Predictiva',
    hex:         '#2A2822',  // warm charcoal (era navy #1B2A4E)
    tagline:     'Anticipar para decidir mejor y más rápido',
    description: 'Modelos que predicen demanda, riesgo, fallos o comportamientos a partir de datos históricos y señales en tiempo real.',
    icon:        '📊',
  },
  asistente_ia: {
    label:       'Asistente IA',
    shortLabel:  'Asistente',
    hex:         '#D4A85C',
    tagline:     'Copilot para equipos — amplifica, no reemplaza',
    description: 'Interfaces conversacionales y copilotos que asisten en redacción, búsqueda, síntesis y toma de decisiones operativas.',
    icon:        '💬',
  },
  optimizacion_proceso: {
    label:       'Optimización de Proceso',
    shortLabel:  'Optimiz.',
    hex:         '#C06060',
    tagline:     'Reducir ineficiencias de forma continua y adaptativa',
    description: 'Algoritmos que detectan cuellos de botella, optimizan flujos de trabajo y asignación de recursos de forma dinámica.',
    icon:        '🔄',
  },
  'agéntica': {
    label:       'Agéntica IA',
    shortLabel:  'Agéntica',
    hex:         '#7C3AED',
    tagline:     'Agentes autónomos que ejecutan tareas complejas',
    description: 'Sistemas de múltiples agentes que planifican, deciden y ejecutan cadenas de pasos complejos de forma autónoma sin supervisión constante.',
    icon:        '🧠',
  },
}

// ── Configuración de recomendaciones ─────────────────────────

export const T5_RECOMMENDATION_CONFIG: Record<T5Recommendation, {
  label:       string
  description: string
  hex:         string
  badgeBg:     string
  badgeText:   string
  dotBg:       string
  order:       number
  actionLabel: string
}> = {
  activar_ahora: {
    label:       'Activar ahora',
    description: 'Condiciones técnicas, organizativas y de gobierno cumplidas. Iniciar implementación este trimestre.',
    hex:         '#5FAF8A',
    badgeBg:     'bg-success-light',
    badgeText:   'text-success-dark',
    dotBg:       'bg-success-dark',
    order:       0,
    actionLabel: 'Lanzar Q actual',
  },
  pilotar_90d: {
    label:       'Pilotar 90 días',
    description: 'Perfil prometedor. Ejecutar piloto controlado para validar hipótesis de valor antes de escalar.',
    hex:         '#D4A85C',
    badgeBg:     'bg-warning-light',
    badgeText:   'text-warning-dark',
    dotBg:       'bg-warning-dark',
    order:       1,
    actionLabel: 'Diseñar piloto',
  },
  preparar_foundations: {
    label:       'Preparar foundations',
    description: 'Valor claro pero prerequisitos (datos, skills o infraestructura) aún no listos. Resolverlos primero.',
    hex:         '#6A90C0',
    badgeBg:     'bg-info-light',
    badgeText:   'text-info-dark',
    dotBg:       'bg-info-dark',
    order:       2,
    actionLabel: 'Plan de enablers',
  },
  gobernar_primero: {
    label:       'Gobernar antes de expandir',
    description: 'Riesgo regulatorio o de madurez organizativa crítico. Establecer governance antes de cualquier despliegue.',
    hex:         '#C06060',
    badgeBg:     'bg-danger-light',
    badgeText:   'text-danger-dark',
    dotBg:       'bg-danger-dark',
    order:       3,
    actionLabel: 'Establecer governance',
  },
}

// ── Configuración de dimensiones de evaluación ───────────────

export const T5_DIMENSION_CONFIG: Record<keyof T5DomainScores, {
  label:       string
  description: string
  direction:   'positive' | 'negative'
  hex:         string
  scaleLabels: [string, string, string, string, string]
}> = {
  businessValue: {
    label:       'Valor de negocio',
    description: 'Impacto potencial en KPIs estratégicos. Mayor = más transformador.',
    direction:   'positive',
    hex:         '#6A90C0',
    scaleLabels: ['Sin impacto', 'Marginal', 'Moderado', 'Alto', 'Transformador'],
  },
  technicalReady: {
    label:       'Madurez técnica',
    description: 'Disponibilidad de datos, infraestructura y skills técnicos.',
    direction:   'positive',
    hex:         '#5FAF8A',
    scaleLabels: ['Sin datos ni infra', 'Básico', 'Parcial', 'Sólido', 'Completo'],
  },
  orgReadiness: {
    label:       'Preparación organizativa',
    description: 'Cultura IA, buy-in directivo y capacidad de cambio.',
    direction:   'positive',
    hex:         '#D4A85C',
    scaleLabels: ['Muy resistente', 'Escéptica', 'Neutral', 'Favorable', 'Campeona'],
  },
  riskLevel: {
    label:       'Nivel de riesgo',
    description: 'Riesgo regulatorio, ético o de impacto negativo. Mayor = más riesgo.',
    direction:   'negative',
    hex:         '#C06060',
    scaleLabels: ['Muy bajo', 'Bajo', 'Moderado', 'Alto', 'Crítico'],
  },
}

// ── Niveles de madurez IA ─────────────────────────────────────

export const T5_MATURITY_CONFIG: Record<T5MaturityLevel, {
  label:       string
  badgeBg:     string
  badgeText:   string
  hex:         string
  description: string
}> = {
  inicial: {
    label:       'Inicial',
    badgeBg:     'bg-gray-100 dark:bg-gray-800',
    badgeText:   'text-gray-500',
    hex:         '#94A3B8',
    description: 'La organización está en las primeras etapas. Foundations aún por construir.',
  },
  emergente: {
    label:       'Emergente',
    badgeBg:     'bg-warning-light',
    badgeText:   'text-warning-dark',
    hex:         '#D4A85C',
    description: 'Primeros pilotos en marcha. Madurez técnica y organizativa en desarrollo.',
  },
  operativo: {
    label:       'Operativo',
    badgeBg:     'bg-info-light',
    badgeText:   'text-info-dark',
    hex:         '#6A90C0',
    description: 'Varios dominios activos. Procesos de governance establecidos.',
  },
  avanzado: {
    label:       'Avanzado',
    badgeBg:     'bg-success-light',
    badgeText:   'text-success-dark',
    hex:         '#5FAF8A',
    description: 'IA integrada en múltiples áreas con métricas de valor demostradas.',
  },
}

// ── Fórmula de score compuesto ────────────────────────────────
// businessValue×0.40 + technicalReady×0.30 + orgReadiness×0.20 + (100-riskLevel)×0.10

export function computeT5DomainScore(scores: T5DomainScores): number {
  const raw =
    scores.businessValue  * 0.40 +
    scores.technicalReady * 0.30 +
    scores.orgReadiness   * 0.20 +
    (100 - scores.riskLevel) * 0.10
  return parseFloat(raw.toFixed(1))
}

// ── Recomendación automática ──────────────────────────────────

export function computeT5Recommendation(scores: T5DomainScores): T5Recommendation {
  if (scores.riskLevel >= 65) return 'gobernar_primero'
  if (
    scores.technicalReady >= 60 &&
    scores.orgReadiness   >= 55 &&
    scores.businessValue  >= 50
  ) return 'activar_ahora'
  if (
    scores.businessValue >= 55 &&
    (scores.technicalReady >= 40 || scores.orgReadiness >= 40)
  ) return 'pilotar_90d'
  return 'preparar_foundations'
}

// ── Nivel de madurez desde scores promedio ────────────────────

export function computeMaturityLevel(
  domains: Record<string, { priorityScore: number }>
): T5MaturityLevel {
  const scores = Object.values(domains).map(d => d.priorityScore)
  if (!scores.length) return 'inicial'
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  if (avg >= 70) return 'avanzado'
  if (avg >= 55) return 'operativo'
  if (avg >= 42) return 'emergente'
  return 'inicial'
}

// ── Secuencia de activación ───────────────────────────────────

export function computeActivationSequence(
  domains: Record<T5DomainCode, { priorityScore: number; recommendation: T5Recommendation }>
): T5DomainCode[] {
  return (Object.keys(domains) as T5DomainCode[]).sort((a, b) => {
    const orderA = T5_RECOMMENDATION_CONFIG[domains[a].recommendation].order
    const orderB = T5_RECOMMENDATION_CONFIG[domains[b].recommendation].order
    if (orderA !== orderB) return orderA - orderB
    return domains[b].priorityScore - domains[a].priorityScore
  })
}
