// ============================================================
// T11 — AI Operating Rhythm — Tipos
//
// Centro de operaciones: cadencia SAFe-adaptada, objetivos por
// fase, matriz de decisiones, KPIs por nivel de gobierno.
// ============================================================

export type T11Level = 'team' | 'program' | 'direction'

export type T11Frequency =
  | 'daily'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'

export type T11MaturityTier =
  | 'foundational'   // avg < 1.5
  | 'developing'     // avg 1.5–2.5
  | 'advanced'       // avg 2.5–3.5
  | 'optimised'      // avg > 3.5

export interface T11Event {
  id:           string
  level:        T11Level
  title:        string
  subtitle:     string
  frequency:    T11Frequency
  duration:     string          // e.g. '2h', '30min', '1 día'
  owner:        string          // Cargo responsable
  participants: string[]        // Lista de cargos asistentes
  dataInputs:   string[]        // Herramientas / datos que se revisan
  agendaItems:  string[]        // Puntos de agenda tipo
  kpisReviewed: string[]        // Métricas que se miden en este evento
  /** Solo mostrar si madurez >= este tier */
  minTier:      T11MaturityTier
  /** Si es recomendado como evento crítico para el cliente */
  isCritical:   boolean
}

export interface T11DecisionNode {
  id:          string
  trigger:     string    // Qué desencadena la decisión
  decision:    string    // Qué se decide
  owner:       string    // Quién decide
  validator:   string    // Quién valida
  escalateTo:  string    // A quién escalar si no hay acuerdo
  timeline:    string    // En cuánto tiempo debe resolverse
  level:       T11Level
}

export interface T11PhaseObjective {
  phase:       'listen' | 'enable' | 'accelerate' | 'normalize' | 'scale'
  phaseLabel:  string
  sprintRange: string
  objectives:  string[]
  keyEvents:   string[]
  dataNeeded:  string[]
}

export interface T11KpiGroup {
  level:   T11Level
  label:   string
  kpis:    {
    name:     string
    formula:  string
    source:   string    // Herramienta origen
    cadence:  string
  }[]
}

export interface T11OperatingModel {
  maturityTier:       T11MaturityTier
  maturityAvg:        number
  recommendedEvents:  T11Event[]
  decisions:          T11DecisionNode[]
  phaseObjectives:    T11PhaseObjective[]
  kpiGroups:          T11KpiGroup[]
}
