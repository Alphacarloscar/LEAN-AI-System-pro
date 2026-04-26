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
// Escala de scoring: 0-100 (continua, slider en taller).
// Score compuesto: 0-100 (mayor = mayor prioridad).
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
  | 'kpiImpact'        // Impacto en KPI de negocio (0-100, mayor = mejor)
  | 'feasibility'      // Facilidad de implementación (0-100, mayor = más fácil)
  | 'aiRisk'           // Riesgo IA/regulatorio (0-100, mayor = mayor riesgo → peor)
  | 'dataDependency'   // Dependencia de datos (0-100, mayor = más dependiente → peor)

// ── Objeto de scores del caso de uso ─────────────────────────
// Escala: 0-100 continua (slider en taller).
// Para kpiImpact y feasibility: mayor = mejor.
// Para aiRisk y dataDependency: mayor = peor (se invierte en cálculo).

export interface UseCaseScores {
  kpiImpact:      number  // 0 – 100
  feasibility:    number  // 0 – 100
  aiRisk:         number  // 0 – 100
  dataDependency: number  // 0 – 100
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

// ── Economía y ROI del caso de uso ───────────────────────────
//
// Toggle auto/manual por campo:
//  - efficiencyGainMode 'benchmark': usa EFFICIENCY_GAIN_BENCHMARKS[aiCategory]
//  - hourlyRateMode 'preset': usa HOURLY_RATE_PRESETS[hourlyRatePreset]
//  - implementationCostMode 'benchmark': usa IMPLEMENTATION_COST_BENCHMARKS[aiCategory].suggested
//
// ROI calculado (no almacenado, derivado en runtime):
//  annualSaving    = processHoursPerWeek × headcount × 52 × efficiencyGain × hourlyRate
//  paybackMonths   = implementationCost / (annualSaving / 12)
//  roi3year (%)    = (annualSaving×3 - implementationCost) / implementationCost × 100

export type HourlyRatePreset   = 'administrativo' | 'tecnico' | 'directivo'
export type EfficiencyGainMode = 'benchmark' | 'manual'
export type HourlyRateMode     = 'preset' | 'manual'
export type ImplCostMode       = 'benchmark' | 'manual'

export interface UseCaseEconomics {
  /** KPI principal que impacta este caso de uso */
  kpiPrincipal?: string

  // ── Inputs de ahorro ────────────────────────────────────────
  /** Horas/semana que consume el proceso hoy */
  processHoursPerWeek:    number
  /** Personas involucradas en el proceso */
  headcount:              number

  /** Ganancia de eficiencia esperada (0-1 → 0-100%). */
  efficiencyGain:         number        // 0.0 – 1.0
  efficiencyGainMode:     EfficiencyGainMode

  /** Coste/hora cargado (€) */
  hourlyRate:             number        // €/hora
  hourlyRateMode:         HourlyRateMode
  hourlyRatePreset?:      HourlyRatePreset

  // ── Coste de implementación ──────────────────────────────────
  implementationCost:     number        // € total estimado
  implementationCostMode: ImplCostMode
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

  /** Sponsor / dueño del caso de uso en el cliente */
  sponsorName?:       string
  /** Responsable IT / Data para la implementación */
  responsibleItData?: string
  /** Objetivo de negocio estratégico que respalda este caso */
  businessObjective?: string

  /** Si fue importado desde T3 */
  importedFromT3?: ImportedFromT3

  /** Scores individuales de los stakeholders del taller */
  stakeholderScores: StakeholderScore[]

  /**
   * Scores consensuados/promediados (base para el cálculo).
   * Si hay stakeholderScores, estos son el promedio automático.
   * Si no, son los valores introducidos manualmente por el consultor.
   * Escala 0-100.
   */
  scores: UseCaseScores

  /** Score de prioridad compuesto 0-100 */
  priorityScore: number

  /** Datos económicos para cálculo de ROI */
  economics?: UseCaseEconomics

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
