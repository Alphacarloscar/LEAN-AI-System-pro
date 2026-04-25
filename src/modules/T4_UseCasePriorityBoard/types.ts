// ============================================================
// T4 — Use Case Priority Board — Tipos
//
// Gestiona la priorización de casos de uso IA mediante scoring
// multi-dimensional (co-creación con stakeholders en taller).
// 4 dimensiones propias: impacto KPI, facilidad, riesgo IA,
// dependencia de datos.
//
// Puente T3: los casos de uso pueden importarse desde T3
// (procesos del Value Stream Map) pre-rellenando nombre,
// departamento, categoría IA y opportunityScore como base
// del scoring inicial.
//
// Sprint 2 MVP: datos en Zustand (persist local).
// Sprint 3+: Supabase tabla `use_cases`.
// ============================================================

// ── Estado del caso de uso ────────────────────────────────────

export type UseCaseStatus =
  | 'candidato'    // Identificado, pendiente de scoring completo
  | 'priorizado'   // Scored pero pendiente de decisión go/no-go
  | 'go'           // Aprobado para implementar
  | 'no_go'        // Descartado con justificación
  | 'en_piloto'    // Piloto activo en marcha
  | 'completado'   // Implementación finalizada

// ── Dimensiones de scoring ────────────────────────────────────

export type ScoringDimension =
  | 'kpiImpact'        // Impacto en KPI de negocio (1-5, mayor = mejor)
  | 'feasibility'      // Facilidad de implementación (1-5, mayor = más fácil)
  | 'aiRisk'           // Riesgo IA/regulatorio (1-5, mayor = mayor riesgo → peor)
  | 'dataDependency'   // Dependencia de datos (1-5, mayor = más dependiente → peor)

// ── Puntuación por dimensión (1-5) ───────────────────────────

export type ScoreValue = 1 | 2 | 3 | 4 | 5

// ── Objeto de scores del caso de uso ─────────────────────────
// Para kpiImpact y feasibility: mayor = mejor
// Para aiRisk y dataDependency: mayor = peor (se invierte en cálculo)

export interface UseCaseScores {
  kpiImpact:      number  // 1.0 – 5.0
  feasibility:    number  // 1.0 – 5.0
  aiRisk:         number  // 1.0 – 5.0
  dataDependency: number  // 1.0 – 5.0
}

// ── Score de un stakeholder individual ───────────────────────

export interface StakeholderScore {
  id:                  string
  stakeholderName:     string
  stakeholderRole:     string
  /** Arquetipo T2 si aplica */
  archetypeCode?:      string
  scores:              UseCaseScores
  notes?:              string
  scoredAt:            string
}

// ── Decisión go/no-go ─────────────────────────────────────────

export interface GoNoGoDecision {
  decision:   'go' | 'no_go' | 'pending'
  rationale?: string
  decidedAt?: string
  decidedBy?: string
}

// ── Hoja de ruta ──────────────────────────────────────────────

export interface UseCaseRoadmap {
  quarter?:           string   // e.g. 'Q2 2026', 'Q3 2026'
  estimatedDuration?: string   // e.g. '6 semanas', '3 meses'
  owner?:             string   // Responsable de la implementación
  nextSteps?:         string   // Texto libre: próximos pasos concretos
  dependencies?:      string   // Dependencias con otros casos o sistemas
}

// ── Contexto T1 (read-only) ───────────────────────────────────

export interface T1Context {
  /** Dimensiones del radar T1 más relevantes para este caso */
  relevantDimensions: string[]
  /** Nota del consultor sobre el impacto del nivel de madurez */
  maturityNotes?:     string
}

// ── Contexto T2 (read-only) ───────────────────────────────────

export interface T2Context {
  /** Arquetipo T2 que actúa como sponsor/champion */
  championArchetype?: string
  /** Arquetipos T2 que presentan resistencia o bloqueo */
  blockerArchetypes?: string[]
  /** Nota del consultor sobre la dinámica de stakeholders */
  stakeholderNotes?:  string
}

// ── Referencia al proceso T3 de origen ───────────────────────

export interface ImportedFromT3 {
  processId:        string
  processName:      string
  opportunityScore: number  // T3 opportunityScore 0-4, usado como input del kpiImpact
  aiCategory:       string
}

// ── Caso de uso — entidad principal ──────────────────────────

export interface UseCase {
  id:          string
  name:        string
  description?: string
  department:  string
  /** Categoría IA heredada de T3 o asignada manualmente */
  aiCategory:  string
  status:      UseCaseStatus
  /** Si fue importado desde T3 */
  importedFromT3?: ImportedFromT3

  /** Scores individuales de los stakeholders del taller */
  stakeholderScores: StakeholderScore[]

  /**
   * Scores consensuados/promediados (base para el cálculo).
   * Si hay stakeholderScores, estos son el promedio automático.
   * Si no, son los valores introducidos manualmente por el consultor.
   */
  scores: UseCaseScores

  /** Score de prioridad compuesto 0-100 */
  priorityScore: number

  /** Decisión go/no-go */
  goNoGo?: GoNoGoDecision

  /** Hoja de ruta de implementación */
  roadmap?: UseCaseRoadmap

  /** Contexto de T1 (solo lectura) */
  t1Context?: T1Context

  /** Contexto de T2 (solo lectura) */
  t2Context?: T2Context

  notes?:    string
  createdAt: string
}

// ── Formulario de nuevo caso de uso (manual) ─────────────────

export interface NewUseCaseForm {
  name:         string
  department:   string
  description?: string
  aiCategory:   string
}
