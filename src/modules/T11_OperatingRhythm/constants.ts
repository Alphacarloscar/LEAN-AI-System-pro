// ============================================================
// T11 — Constantes: catálogo de eventos, decisiones, KPIs
//
// 9 eventos de gobierno SAFe-adaptados en 3 niveles.
// Objetivos por las 5 fases del sprint L.E.A.N.
// ============================================================

import type {
  T11Event, T11DecisionNode, T11PhaseObjective, T11KpiGroup,
  T11Level, T11MaturityTier,
} from './types'

// ── Config visual por nivel ───────────────────────────────────

export const T11_LEVEL_CONFIG: Record<T11Level, {
  label:     string
  sublabel:  string
  hex:       string
  bg:        string
  border:    string
  badge:     string
  badgeText: string
  bgText:    string
  icon:      string
}> = {
  team: {
    label:     'Nivel Equipo',
    sublabel:  'Cadencia de Sprint (2 semanas)',
    hex:       '#5FAF8A',
    bg:        'bg-success-light dark:bg-success-dark/15',
    border:    'border-success dark:border-success-dark/40',
    badge:     'bg-success-dark dark:bg-success-dark/40',
    badgeText: 'text-lean-white dark:text-warm-50',
    bgText:    'text-success-dark dark:text-success',
    icon:      'team',
  },
  program: {
    label:     'Nivel Programa',
    sublabel:  'Cadencia mensual de gestión',
    hex:       '#6A90C0',
    bg:        'bg-info-light dark:bg-info-dark/15',
    border:    'border-info dark:border-info-dark/40',
    badge:     'bg-info-dark dark:bg-info-dark/40',
    badgeText: 'text-lean-white dark:text-warm-50',
    bgText:    'text-info-dark dark:text-info',
    icon:      'program',
  },
  direction: {
    label:     'Nivel Dirección',
    sublabel:  'Cadencia trimestral estratégica',
    hex:       '#C8860A',
    bg:        'bg-warning-light dark:bg-warning-dark/15',
    border:    'border-warning dark:border-warning-dark/40',
    badge:     'bg-warning-dark dark:bg-warning-dark/40',
    badgeText: 'text-lean-white dark:text-warm-50',
    bgText:    'text-warning-dark dark:text-warning',
    icon:      'direction',
  },
}

// ── Config por frecuencia ─────────────────────────────────────

export const T11_FREQUENCY_LABEL: Record<string, string> = {
  daily:      'Diario',
  biweekly:   'Quincenal',
  monthly:    'Mensual',
  quarterly:  'Trimestral',
  semiannual: 'Semestral',
}

// ── Config por tier de madurez ────────────────────────────────

export const T11_MATURITY_CONFIG: Record<T11MaturityTier, {
  label:       string
  description: string
  hex:         string
  stars:       number
}> = {
  foundational: {
    label:       'Fundacional',
    description: 'La organización está en las primeras fases de gobierno IA. Foco en establecer bases y concienciación.',
    hex:         '#C06060',
    stars:       1,
  },
  developing: {
    label:       'En desarrollo',
    description: 'Existen iniciativas IA activas. Necesidad de estructurar el gobierno y la toma de decisiones.',
    hex:         '#D4A85C',
    stars:       2,
  },
  advanced: {
    label:       'Avanzado',
    description: 'El gobierno IA está estructurado. Foco en escalar y optimizar la cadencia operativa.',
    hex:         '#5FAF8A',
    stars:       3,
  },
  optimised: {
    label:       'Optimizado',
    description: 'Modelo operativo IA maduro. Foco en mejora continua, innovación y liderazgo sectorial.',
    hex:         '#6A90C0',
    stars:       4,
  },
}

// ── Catálogo completo de eventos de gobierno ──────────────────

export const T11_EVENTS_CATALOG: T11Event[] = [

  // ── Nivel Equipo ─────────────────────────────────────────────

  {
    id:        'sprint-planning',
    level:     'team',
    title:     'AI Sprint Planning',
    subtitle:  'Selección de objetivos y backlog de la iteración',
    frequency: 'biweekly',
    duration:  '2h',
    owner:     'AI Lead / Digital Manager',
    participants: ['Equipo de adopción IA', 'IT Lead', 'Product Owner IA', 'Change Manager'],
    dataInputs:   ['T4 — Priorización de casos de uso', 'T3 — Estado del Value Stream', 'T9 — Roadmap sprint vigente'],
    agendaItems: [
      'Revisión del estado del sprint anterior (15min)',
      'Selección de objetivos del sprint (30min)',
      'Refinamiento del backlog de adopción IA (45min)',
      'Asignación de responsables por caso de uso (20min)',
      'Identificación de impedimentos y dependencias (10min)',
    ],
    kpisReviewed: [
      'Velocidad de adopción por departamento',
      'Casos de uso en producción vs. en piloto',
      'Impedimentos abiertos',
    ],
    minTier:    'foundational',
    isCritical: true,
  },

  {
    id:        'sprint-review',
    level:     'team',
    title:     'AI Sprint Review',
    subtitle:  'Demostración de avances y métricas de adopción',
    frequency: 'biweekly',
    duration:  '1h',
    owner:     'AI Lead',
    participants: ['Equipo de adopción IA', 'Stakeholders clave', 'Sponsor IA', 'Change Manager'],
    dataInputs:   ['T7 — Heatmap de adopción', 'T4 — Casos completados', 'Métricas de uso real'],
    agendaItems: [
      'Demostración de casos de uso completados (30min)',
      'Revisión de métricas de adopción por departamento (15min)',
      'Feedback de stakeholders (10min)',
      'Ajuste de prioridades para el próximo sprint (5min)',
    ],
    kpisReviewed: [
      'Adopción activa de herramientas IA (%)',
      'NPS interno de adopción IA',
      'ROI realizado vs. estimado en use cases completados',
    ],
    minTier:    'foundational',
    isCritical: true,
  },

  {
    id:        'ai-daily-sync',
    level:     'team',
    title:     'AI Daily Sync',
    subtitle:  'Sincronización diaria del equipo de adopción',
    frequency: 'daily',
    duration:  '15min',
    owner:     'AI Lead',
    participants: ['Equipo de adopción IA', 'Change Manager'],
    dataInputs:   ['Board de tareas del sprint', 'Impedimentos abiertos'],
    agendaItems: [
      '¿Qué completé ayer? (5min)',
      '¿Qué hago hoy? (5min)',
      '¿Qué impedimentos bloquean el avance? (5min)',
    ],
    kpisReviewed: [
      'Tareas completadas vs. planificadas',
      'Impedimentos activos',
    ],
    minTier:    'developing',
    isCritical: false,
  },

  // ── Nivel Programa ────────────────────────────────────────────

  {
    id:        'governance-committee',
    level:     'program',
    title:     'AI Governance Committee',
    subtitle:  'Supervisión de riesgos, cumplimiento y decisiones de programa',
    frequency: 'monthly',
    duration:  '1,5h',
    owner:     'CIO / COO',
    participants: ['AI Lead', 'Compliance Officer', 'Legal', 'Heads of Dept', 'Data Steward', 'CISO'],
    dataInputs: [
      'T6 — Estado de riesgos IA',
      'T12 — Avance ISO 42001',
      'T9 — Roadmap mes vigente',
      'T8 — KPIs de comunicación',
    ],
    agendaItems: [
      'Estado de controles de riesgo IA (20min)',
      'Avance de cumplimiento ISO 42001 / AI Act (20min)',
      'Decisiones de gobierno pendientes (25min)',
      'Revisión de incidentes y no conformidades (15min)',
      'Validación de hitos del roadmap (10min)',
    ],
    kpisReviewed: [
      'Controles ISO 42001 aprobados (%)',
      'Riesgos IA en estado "en progreso" (#)',
      'Incidentes IA abiertos (#)',
      'Hitos del roadmap en riesgo (#)',
    ],
    minTier:    'foundational',
    isCritical: true,
  },

  {
    id:        'vendor-review',
    level:     'program',
    title:     'AI Vendor & Technology Review',
    subtitle:  'Revisión de proveedores IA, contratos y rendimiento',
    frequency: 'monthly',
    duration:  '1h',
    owner:     'CIO / Procurement',
    participants: ['IT Lead', 'Finance', 'AI Lead', 'Heads of Dept usuarios'],
    dataInputs: [
      'T5 — AI Taxonomy Canvas (inventario de herramientas)',
      'KPIs de rendimiento de proveedores',
      'Informes de uso y coste',
    ],
    agendaItems: [
      'Revisión del inventario de herramientas IA activas (15min)',
      'Rendimiento y SLAs de proveedores críticos (20min)',
      'Contratos próximos a renovación (10min)',
      'Propuestas de consolidación o baja de herramientas (15min)',
    ],
    kpisReviewed: [
      'Coste total de herramientas IA (€/mes)',
      'Herramientas IA activas vs. infrautilizadas',
      'SLA de proveedores críticos (%)',
      'ROI por herramienta IA',
    ],
    minTier:    'developing',
    isCritical: false,
  },

  {
    id:        'adoption-review',
    level:     'program',
    title:     'AI Adoption & Change Review',
    subtitle:  'Evolución de la adopción por departamento y gestión del cambio',
    frequency: 'monthly',
    duration:  '45min',
    owner:     'Change Manager / Digital Manager',
    participants: ['AI Lead', 'HR', 'Comunicación Interna', 'Champions departamentales'],
    dataInputs: [
      'T7 — Heatmap de adopción por departamento',
      'T2 — Mapa de stakeholders (resistencia)',
      'Encuestas de adopción internas',
    ],
    agendaItems: [
      'Revisión del heatmap de adopción por departamento (15min)',
      'Stakeholders con resistencia activa — plan de acción (15min)',
      'Iniciativas de formación y concienciación (10min)',
      'Quick wins comunicables a la organización (5min)',
    ],
    kpisReviewed: [
      'Tasa de adopción activa por departamento (%)',
      'Stakeholders en zona de resistencia alta (#)',
      'Horas de formación IA completadas',
      'Satisfacción con el proceso de cambio (NPS)',
    ],
    minTier:    'developing',
    isCritical: false,
  },

  // ── Nivel Dirección ───────────────────────────────────────────

  {
    id:        'pi-planning',
    level:     'direction',
    title:     'AI PI Planning (Program Increment)',
    subtitle:  'Planificación trimestral de objetivos e iniciativas IA',
    frequency: 'quarterly',
    duration:  '1 día',
    owner:     'CIO / COO + Dirección',
    participants: ['CIO', 'COO', 'AI Lead', 'Heads of Dept', 'Change Manager', 'Data Steward', 'Finance'],
    dataInputs: [
      'T1 — Evolución de madurez IA',
      'T9 — Roadmap próximo trimestre',
      'T4 — Backlog de casos de uso priorizados',
      'T6 — Mapa de riesgos y mitigaciones',
      'KPIs de impacto del trimestre anterior',
    ],
    agendaItems: [
      'Revisión de resultados del trimestre anterior (1h)',
      'Presentación del contexto estratégico y mercado (30min)',
      'Definición de objetivos del PI (Objectives & KRs) (2h)',
      'Planificación por equipos y dependencias (2h)',
      'Riesgos, impedimentos y plan de mitigación (1h)',
      'Validación ejecutiva y compromiso (1h)',
      'Comunicación del plan a la organización (30min)',
    ],
    kpisReviewed: [
      'OKRs del trimestre anterior — cumplimiento (%)',
      'ROI acumulado de iniciativas IA (€)',
      'Madurez IA por dimensión — evolución',
      'Velocidad de adopción vs. plan',
    ],
    minTier:    'developing',
    isCritical: true,
  },

  {
    id:        'steering-committee',
    level:     'direction',
    title:     'AI Steering Committee',
    subtitle:  'Comité de dirección: resultados estratégicos y decisiones de inversión',
    frequency: 'quarterly',
    duration:  '2h',
    owner:     'CEO / COO',
    participants: ['CEO', 'COO', 'CIO', 'CFO', 'Chief of Staff', 'AI Lead'],
    dataInputs: [
      'Executive Summary del trimestre',
      'T1 — Evolución de madurez IA',
      'KPIs estratégicos de transformación',
      'Informe de ROI de iniciativas IA',
      'Posicionamiento competitivo',
    ],
    agendaItems: [
      'Estado de la transformación IA — KPIs estratégicos (30min)',
      'ROI y valor generado por iniciativas IA (30min)',
      'Decisiones de inversión y presupuesto IA (30min)',
      'Riesgos estratégicos y regulatorios (15min)',
      'Próximos hitos y compromisos ejecutivos (15min)',
    ],
    kpisReviewed: [
      'Valor generado por IA (€ acumulado)',
      'Índice de madurez IA global (0-4)',
      'Iniciativas IA en producción vs. en piloto',
      'Cumplimiento regulatorio (AI Act / ISO 42001)',
      'Inversión IA / ROI ratio',
    ],
    minTier:    'foundational',
    isCritical: true,
  },

  {
    id:        'board-update',
    level:     'direction',
    title:     'AI Board Update',
    subtitle:  'Actualización al consejo: transformación IA y posicionamiento',
    frequency: 'semiannual',
    duration:  '45min',
    owner:     'CEO',
    participants: ['CEO', 'Consejo de Administración', 'CIO', 'COO'],
    dataInputs: [
      'Informe ejecutivo de transformación IA',
      'Benchmarking sectorial',
      'KPIs de impacto y ROI',
      'Roadmap estratégico IA 12-24 meses',
    ],
    agendaItems: [
      'Estado de la transformación IA — resumen ejecutivo (15min)',
      'Valor generado y posicionamiento vs. competencia (15min)',
      'Inversión, ROI y próximas iniciativas (10min)',
      'Riesgos estratégicos y regulatorios (5min)',
    ],
    kpisReviewed: [
      'Índice de madurez IA global (0-4)',
      'ROI acumulado de iniciativas IA',
      'Posicionamiento IA vs. sector (benchmark)',
      'Inversión total IA y proyección',
    ],
    minTier:    'advanced',
    isCritical: false,
  },
]

// ── Catálogo de decisiones ────────────────────────────────────

export const T11_DECISIONS: T11DecisionNode[] = [
  {
    id:         'uc-prioritization',
    trigger:    'Propuesta de nuevo caso de uso IA o cambio de prioridad',
    decision:   'Aprobar, rechazar o posponer el caso de uso',
    owner:      'AI Lead',
    validator:  'Head of Dept patrocinador',
    escalateTo: 'CIO / COO',
    timeline:   '5 días hábiles',
    level:      'team',
  },
  {
    id:         'tool-adoption',
    trigger:    'Impedimento técnico que bloquea el avance de un sprint',
    decision:   'Solución técnica o replanificación del sprint',
    owner:      'IT Lead',
    validator:  'AI Lead',
    escalateTo: 'CIO',
    timeline:   '48 horas',
    level:      'team',
  },
  {
    id:         'vendor-contract',
    trigger:    'Propuesta de compra o renovación de herramienta IA >€10K',
    decision:   'Aprobar la compra / renovación',
    owner:      'CIO',
    validator:  'CFO + Procurement',
    escalateTo: 'COO / CEO',
    timeline:   '10 días hábiles',
    level:      'program',
  },
  {
    id:         'risk-escalation',
    trigger:    'Riesgo IA clasificado como Alto o Crítico sin mitigación',
    decision:   'Plan de mitigación urgente o suspensión del sistema IA',
    owner:      'Compliance Officer',
    validator:  'CIO + Legal',
    escalateTo: 'COO / CEO',
    timeline:   '24 horas',
    level:      'program',
  },
  {
    id:         'budget-allocation',
    trigger:    'Necesidad de reasignación presupuestaria en iniciativas IA',
    decision:   'Aprobación de reasignación de presupuesto IA',
    owner:      'CFO',
    validator:  'COO',
    escalateTo: 'CEO / Consejo',
    timeline:   '15 días hábiles',
    level:      'direction',
  },
  {
    id:         'strategic-pivot',
    trigger:    'Cambio en estrategia IA o reorientación de iniciativas clave',
    decision:   'Validar el nuevo rumbo estratégico y reasignar recursos',
    owner:      'CEO / COO',
    validator:  'CIO + CFO',
    escalateTo: 'Consejo de Administración',
    timeline:   'Próximo Steering Committee',
    level:      'direction',
  },
]

// ── Objetivos por fase del sprint LEAN ───────────────────────

export const T11_PHASE_OBJECTIVES: T11PhaseObjective[] = [
  {
    phase:       'listen',
    phaseLabel:  'L — Listen',
    sprintRange: 'Sprints 1–2',
    objectives: [
      'Completar el AI Readiness Assessment (T1) con todos los interlocutores clave',
      'Mapear el ecosistema de stakeholders y su nivel de resistencia (T2)',
      'Identificar los procesos con mayor potencial de mejora con IA (T3)',
      'Establecer el primer AI Governance Committee y su cadencia',
      'Documentar el contexto organizacional en ISO 42001 (T12 — Cláusula 4)',
    ],
    keyEvents: ['AI Sprint Planning #1', 'AI Sprint Review #1', 'AI Governance Committee #1'],
    dataNeeded: ['T1 radar completo', 'T2 stakeholders identificados', 'T3 value streams documentados'],
  },
  {
    phase:       'enable',
    phaseLabel:  'E — Enable',
    sprintRange: 'Sprints 3–5',
    objectives: [
      'Priorizar los 5-10 casos de uso de mayor impacto/viabilidad (T4)',
      'Inventariar y clasificar todas las herramientas IA en uso (T5)',
      'Establecer el marco de riesgos IA y primeros controles (T6)',
      'Lanzar el primer piloto de caso de uso priorizado',
      'Completar la cláusula de Liderazgo y Planificación de ISO 42001 (T12)',
    ],
    keyEvents: ['AI PI Planning #1', 'AI Vendor Review #1', 'AI Adoption Review #1'],
    dataNeeded: ['T4 scoring completado', 'T5 taxonomía validada', 'T6 controles identificados'],
  },
  {
    phase:       'accelerate',
    phaseLabel:  'A — Accelerate',
    sprintRange: 'Sprints 6–9',
    objectives: [
      'Poner en producción los 3 primeros casos de uso priorizados',
      'Medir y comunicar el ROI inicial de las iniciativas IA',
      'Escalar la adopción a los departamentos con mayor capacidad (T7)',
      'Establecer el plan de comunicación interna y externa (T8)',
      'Avanzar en la implementación operativa de ISO 42001 (T12 — Cláusulas 7-8)',
    ],
    keyEvents: ['AI PI Planning #2', 'AI Steering Committee #1', 'AI Adoption Review mensual'],
    dataNeeded: ['Métricas de ROI de pilotos', 'T7 heatmap actualizado', 'T8 plan de comunicación'],
  },
  {
    phase:       'normalize',
    phaseLabel:  'N — Normalize',
    sprintRange: 'Sprints 10–11',
    objectives: [
      'Consolidar el roadmap IA a 6-12 meses (T9)',
      'Completar la evaluación de cumplimiento ISO 42001 (T12)',
      'Estandarizar los procesos de gobierno IA en toda la organización',
      'Traspasar la gestión operativa al equipo interno',
      'Preparar la auditoría interna del AIMS',
    ],
    keyEvents: ['AI PI Planning #3', 'AI Board Update #1', 'AI Governance Committee de cierre'],
    dataNeeded: ['T9 roadmap validado', 'T12 controles auditados', 'KPIs estratégicos consolidados'],
  },
  {
    phase:       'scale',
    phaseLabel:  'S — Scale',
    sprintRange: 'Sprint 12–13+',
    objectives: [
      'Escalar los casos de uso exitosos a toda la organización',
      'Lanzar nuevas iniciativas IA basadas en los aprendizajes del sprint',
      'Posicionarse para la certificación ISO 42001 (si procede)',
      'Establecer el modelo de mejora continua del AIMS',
      'Definir el plan de expansión IA para el siguiente ejercicio',
    ],
    keyEvents: ['AI Steering Committee #2', 'AI Board Update #2', 'AI PI Planning #4'],
    dataNeeded: ['T1 revisado (madurez final)', 'Informe de ROI acumulado', 'Plan estratégico IA año 2'],
  },
]

// ── KPIs por nivel de gobierno ────────────────────────────────

export const T11_KPI_GROUPS: T11KpiGroup[] = [
  {
    level: 'team',
    label: 'Equipo — Métricas de Sprint',
    kpis: [
      { name: 'Velocidad de adopción',       formula: 'Casos de uso en producción / total planificados',    source: 'T4',  cadence: 'Quincenal' },
      { name: 'Tasa de adopción activa',     formula: 'Usuarios activos IA / total usuarios objetivo (%)',  source: 'T7',  cadence: 'Quincenal' },
      { name: 'Impedimentos resueltos',      formula: 'Impedimentos cerrados / impedimentos abiertos (%)', source: 'Sprint Board', cadence: 'Semanal' },
      { name: 'Sprint goal achievement',     formula: 'Objetivos de sprint completados (%)',                source: 'T4',  cadence: 'Quincenal' },
    ],
  },
  {
    level: 'program',
    label: 'Programa — Métricas Mensuales',
    kpis: [
      { name: 'Controles de riesgo activos', formula: 'Controles implementados / total identificados (%)', source: 'T6',  cadence: 'Mensual' },
      { name: 'Adopción por departamento',   formula: 'Dptos. con adopción >50% / total dptos. (%)',       source: 'T7',  cadence: 'Mensual' },
      { name: 'Coste de herramientas IA',    formula: '€ totales en licencias IA / mes',                   source: 'T5',  cadence: 'Mensual' },
      { name: 'Cumplimiento ISO 42001',      formula: 'Controles aprobados / 25 controles totales (%)',     source: 'T12', cadence: 'Mensual' },
      { name: 'Incidentes IA abiertos',      formula: 'Nº de incidentes no resueltos',                     source: 'T6',  cadence: 'Mensual' },
    ],
  },
  {
    level: 'direction',
    label: 'Dirección — Métricas Estratégicas',
    kpis: [
      { name: 'ROI acumulado de iniciativas IA', formula: '(Valor generado - Inversión IA) / Inversión IA × 100', source: 'T4 + Finance', cadence: 'Trimestral' },
      { name: 'Índice de madurez IA',            formula: 'Promedio de las 6 dimensiones T1 (0-4)',               source: 'T1',          cadence: 'Trimestral' },
      { name: 'Casos IA en producción',          formula: 'Nº de use cases con impacto medible en producción',    source: 'T4',          cadence: 'Trimestral' },
      { name: 'Cumplimiento regulatorio',        formula: '% de requisitos AI Act / ISO 42001 implementados',     source: 'T12 + T6',    cadence: 'Trimestral' },
      { name: 'NPS de transformación IA',        formula: 'Net Promoter Score del programa IA interno',           source: 'Encuesta',    cadence: 'Trimestral' },
    ],
  },
]
