// ============================================================
// T3 — Value Stream Map — Tipos
//
// Captura procesos de negocio y evalúa su potencial IA.
// Entrevista estructurada MCQ → 3 scores automáticos →
//   categoría IA sugerida + oportunidades concretas.
// Sprint 2 MVP: lógica rule-based local. Sprint 3+: Supabase.
// ============================================================

// ── Categorías de IA ─────────────────────────────────────────

export type AICategoryCode =
  | 'automatizacion_inteligente'  // alto auto + altos datos → automatización con decisión IA
  | 'automatizacion_rpa'          // alto auto + datos bajos → automatización de reglas
  | 'analitica_predictiva'        // datos altos + impacto alto → modelos predictivos
  | 'asistente_ia'                // readiness alto + auto bajo → copilot / asistente
  | 'optimizacion_proceso'        // scores medios → análisis y mejora de flujo

// ── Niveles de readiness del equipo ─────────────────────────

export type OrgReadinessLevel = 'baja' | 'media' | 'alta'

// ── Nivel de oportunidad IA ──────────────────────────────────

export type OpportunityLevel = 'baja' | 'media' | 'alta' | 'critica'

// ── Respuestas de la entrevista ──────────────────────────────

export type InterviewAnswerCode = 'A' | 'B' | 'C' | 'D'

// ── Opción de respuesta ──────────────────────────────────────

export interface AnswerOption {
  code:  InterviewAnswerCode
  text:  string
  /** Puntos brutos que suma esta respuesta a cada dimensión */
  scores: {
    automation: number   // automatización potencial
    data:       number   // disponibilidad / calidad de datos
    volume:     number   // volumen y frecuencia del proceso
    impact:     number   // impacto de mejora en negocio
    readiness:  number   // disposición del equipo
  }
}

// ── Pregunta de la entrevista ────────────────────────────────

export interface InterviewQuestion {
  id:      number
  text:    string
  hint?:   string
  answers: AnswerOption[]
}

// ── Resultado de la entrevista ───────────────────────────────

export interface ProcessInterviewResult {
  answers:          Record<number, InterviewAnswerCode>
  /** Scores normalizados 0-4 */
  automationScore:  number
  dataScore:        number
  volumeScore:      number
  impactScore:      number
  readinessScore:   number
  /** Score compuesto de oportunidad IA (0-4) */
  opportunityScore: number
  /** Categoría IA asignada automáticamente */
  aiCategory:       AICategoryCode
  orgReadiness:     OrgReadinessLevel
  computedAt:       string
}

// ── Oportunidad IA concreta ──────────────────────────────────

export interface AIOpportunity {
  id:          string
  title:       string
  description: string
  /** Esfuerzo estimado de implementación */
  effort:      'bajo' | 'medio' | 'alto'
  /** Impacto estimado en negocio */
  impact:      'bajo' | 'medio' | 'alto'
  /** Si el consultor ha validado / descartado manualmente */
  status:      'sugerida' | 'validada' | 'descartada'
}

// ── Proceso / Value Stream ───────────────────────────────────

export interface ValueStream {
  id:          string
  name:        string
  department:  string
  /** Persona responsable del proceso */
  owner?:      string
  ownerRole?:  string
  description?: string
  /** Categoría IA asignada (puede venir de entrevista o manual) */
  aiCategory:  AICategoryCode
  orgReadiness: OrgReadinessLevel
  opportunityLevel: OpportunityLevel
  /** Datos de la entrevista si se ha completado */
  interview?:  ProcessInterviewResult
  /** Oportunidades IA generadas/validadas */
  opportunities: AIOpportunity[]
  notes?:       string
  createdAt:    string
  /** Ajuste manual del consultor sobre la categoría auto-asignada */
  manualOverride?: boolean
}

// ── Formulario para crear proceso (antes de entrevista) ─────

export interface NewValueStreamForm {
  name:        string
  department:  string
  owner?:      string
  ownerRole?:  string
  description?: string
}

// ── Configuración de categoría IA ───────────────────────────

export interface AICategoryConfig {
  code:        AICategoryCode
  label:       string
  tagline:     string
  description: string
  /** Clases Tailwind para el badge */
  badgeBg:     string
  badgeText:   string
  dotBg:       string
  /** Color hex para SVG */
  hex:         string
  /** Oportunidades IA típicas para esta categoría */
  opportunityTemplates: Array<{
    title:       string
    description: string
    effort:      'bajo' | 'medio' | 'alto'
    impact:      'bajo' | 'medio' | 'alto'
  }>
}
