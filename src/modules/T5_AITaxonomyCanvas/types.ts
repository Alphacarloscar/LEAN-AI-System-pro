// ============================================================
// T5 — AI Domain Architecture Canvas — Tipos
//
// Herramienta estratégica que, dado el contexto de T1/T3/T4,
// genera recomendaciones de activación por dominio IA con
// condiciones de governance y secuencia de implementación.
// ============================================================

// ── Códigos de dominio IA (los 6 dominios del LEAN AI System) ─

export type T5DomainCode =
  | 'automatizacion_rpa'
  | 'automatizacion_inteligente'
  | 'analitica_predictiva'
  | 'asistente_ia'
  | 'optimizacion_proceso'
  | 'agéntica'

// ── Recomendación de activación ───────────────────────────────

export type T5Recommendation =
  | 'activar_ahora'          // Condiciones cumplidas → lanzar este trimestre
  | 'pilotar_90d'            // Perfil prometedor → piloto controlado
  | 'preparar_foundations'   // Valor claro, prerequisites pendientes
  | 'gobernar_primero'       // Riesgo crítico → governance antes que despliegue

// ── Nivel de madurez IA global de la organización ────────────

export type T5MaturityLevel = 'inicial' | 'emergente' | 'operativo' | 'avanzado'

// ── Scores de evaluación de un dominio ───────────────────────
// Escala 0-100 continua.
// businessValue, technicalReady, orgReadiness: mayor = mejor.
// riskLevel: mayor = más riesgo (se penaliza en fórmula).

export interface T5DomainScores {
  businessValue:  number   // Valor potencial de negocio (0-100)
  technicalReady: number   // Madurez técnica y de datos (0-100)
  orgReadiness:   number   // Preparación organizativa/cultural (0-100)
  riskLevel:      number   // Nivel de riesgo regulatorio/ético (0-100)
}

// ── Evaluación completa de un dominio ─────────────────────────

export interface T5DomainAssessment {
  domainCode:     T5DomainCode
  scores:         T5DomainScores
  priorityScore:  number           // 0-100, score compuesto
  recommendation: T5Recommendation

  // Governance
  suggestedOwner:       string
  primaryKPI:           string
  activationConditions: string[]
  governanceNotes?:     string

  useCaseCount: number   // Casos de uso en T4 de esta categoría
  assessedAt:   string   // ISO timestamp
}

// ── Canvas principal ──────────────────────────────────────────

export interface T5Canvas {
  id:          string
  companyName: string
  createdAt:   string
  updatedAt:   string

  domains:            Record<T5DomainCode, T5DomainAssessment>
  maturityLevel:      T5MaturityLevel
  activationSequence: T5DomainCode[]   // Orden recomendado de activación

  notes?: string
}
