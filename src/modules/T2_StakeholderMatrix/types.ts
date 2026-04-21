// ============================================================
// T2 — AI Stakeholder Matrix — Tipos
//
// 5 arquetipos + modificador de resistencia.
// Arquitectura: scorecards por entrevistado → auto-asignación.
// Sprint 2 MVP: lógica rule-based local. Sprint 3+: Supabase.
// ============================================================

// ── Arquetipos ────────────────────────────────────────────────

export type ArchetypeCode =
  | 'adoptador'    // Early adopter, bajo fricción, impulsa uso
  | 'ambassador'   // Connector IT-Negocio, multiplica adopción
  | 'decisor'      // Autoridad presupuestaria, necesita ROI claro
  | 'critico'      // Escéptico activo, puede bloquear
  | 'especialista' // Conocimiento profundo, preocupado por su rol

export type ResistanceLevel = 'baja' | 'media' | 'alta'

export type InterviewAnswerCode = 'A' | 'B' | 'C' | 'D'

// ── Definición de arquetipo (para UI y recomendaciones) ───────

export interface ArchetypeConfig {
  code:        ArchetypeCode
  label:       string
  tagline:     string
  description: string
  /** Clases Tailwind para el badge */
  badgeBg:     string
  badgeText:   string
  /** Color sólido para la barra/punto en la matrix */
  dotBg:       string
  /** Intervenciones recomendadas por nivel de resistencia */
  interventions: Record<ResistanceLevel, string[]>
}

// ── Preguntas de entrevista ───────────────────────────────────

export interface AnswerOption {
  code:  InterviewAnswerCode
  text:  string
  /** Puntos brutos que suma esta respuesta a cada dimensión */
  scores: {
    adoption:  number   // 0–4
    influence: number   // 0–4
    openness:  number   // 0–4
    connector: number   // 0–2 (solo Q3-A)
  }
}

export interface InterviewQuestion {
  id:      number
  text:    string
  hint?:   string
  answers: AnswerOption[]
}

// ── Resultado de la entrevista ────────────────────────────────

export interface InterviewResult {
  /** Respuesta por id de pregunta */
  answers:       Record<number, InterviewAnswerCode>
  /** Scores normalizados 0-4 */
  adoptionScore: number
  influenceScore: number
  opennessScore: number
  /** Asignación automática */
  archetype:     ArchetypeCode
  resistance:    ResistanceLevel
  computedAt:    string
}

// ── Stakeholder ───────────────────────────────────────────────

export interface Stakeholder {
  id:          string
  name:        string
  role:        string
  department:  string
  /** Arquetipo asignado (puede venir de entrevista o asignación manual) */
  archetype:   ArchetypeCode
  resistance:  ResistanceLevel
  /** Si tiene entrevista completada, aquí están los datos */
  interview?:  InterviewResult
  notes?:      string
  createdAt:   string
  /** Permite al consultor ajustar la asignación automática */
  manualOverride?: boolean
}

// ── Formulario para crear stakeholder (antes de entrevista) ──

export interface NewStakeholderForm {
  name:       string
  role:       string
  department: string
}
