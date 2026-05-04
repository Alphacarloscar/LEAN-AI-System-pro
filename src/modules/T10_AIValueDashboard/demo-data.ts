// ============================================================
// T10 — AI Value Dashboard · Datos Demo
//
// Datos estáticos realistas para empresa manufacturera española.
// T10 corre siempre en modo demo en Sprint 5.
// T1 Radar se inyecta desde el escenario activo (props).
// ============================================================

export const T10_DEMO = {

  // ── P1: T1 extension (IT vs negocio breakdown) ──────────────
  t1: {
    itAvg:           1.3,
    bizAvg:          1.8,
    interviewsCount: 23,
    gapPts:          0.5,
  },

  // ── P2: T4 Portfolio IA ─────────────────────────────────────
  t4: {
    totalInitiatives:  8,
    estimatedValue:    847_000,
    totalInvestment:   259_000,
    ahorroAnual:       350_000,
    paybackMeses:      18.0,
    roi3years:         446,
    roi:               2.4,
    statuses: {
      active:     2,
      validating: 3,
      backlog:    2,
      stopped:    1,
    },
    topInitiatives: [
      { name: 'Automatización proceso de pedidos',   status: 'active',     value: 320_000 },
      { name: 'Predicción de demanda manufactura',   status: 'validating', value: 240_000 },
      { name: 'Asistente IA para atención técnica',  status: 'validating', value: 185_000 },
    ],
  },

  // ── P3: T2 Stakeholders + T7 Gestión del Cambio ────────────
  t2t7: {
    totalStakeholders: 47,
    activeAdopters:    18,
    activePercent:     38,
    rogersPhase:       'Early Majority',
    changeScore:       3.2,
    groups: [
      { label: 'Innovadores',    count: 18, pct: 38, color: '#86C7A8' },
      { label: 'Early Majority', count: 12, pct: 26, color: '#9BB5D9' },
      { label: 'Rezagados',      count: 17, pct: 36, color: '#C4C0B8' },
    ],
    departments: [
      { label: 'Dir. General',   innovadores: 3, early: 2, rezagados: 2, total: 7  },
      { label: 'IT Tecnología',  innovadores: 5, early: 4, rezagados: 3, total: 12 },
      { label: 'Operaciones',    innovadores: 6, early: 4, rezagados: 6, total: 16 },
      { label: 'Mkt & Comercial',innovadores: 4, early: 2, rezagados: 6, total: 12 },
    ],
  },

  // ── P4: T3 Procesos + T5 Taxonomía IA ──────────────────────
  t3t5: {
    processesTotal:     12,
    processesMapped:    12,
    bottleneck:         'Calidad de datos',
    bottleneckSeverity: 'Alto' as const,
    efficiencyPct:      61,
    oppCritica:         2,
    oppAlta:            2,
    total:              7,
    aiTypes: [
      { label: 'IA Generativa',  count: 5, pct: 42, color: '#7F77DD' },
      { label: 'Automatización', count: 4, pct: 33, color: '#9BB5D9' },
      { label: 'IA Predictiva',  count: 3, pct: 25, color: '#C4C0B8' },
    ],
  },

  // ── P5: T6 Riesgos + T12 ISO 42001 ─────────────────────────
  t6t12: {
    risks: {
      high:   3,
      medium: 5,
      low:    3,
      total:  11,
    },
    topRisk:         'Sesgo algorítmico en procesos RRHH',
    topRiskSeverity: 'Alto' as const,
    isoCompliance:   52,
    isoPhase:        'Cláusulas 4–7 completadas',
    nextClause:      'Cláusula 8 — Operación',
  },

  // ── P6: T8 Vendors + T9 Roadmap + T11 Gobierno ─────────────
  t8t9t11: {
    gobiernoActivoPct:    30,
    casosEnGO:            3,
    iniciativasLibres:    0,
    archivosCompletados:  0,
    riesgosAltos:         3,
    upcomingEvents: [
      { name: 'PI Planning Q3',     date: '15 May', level: 'direction' as const },
      { name: 'Steering Committee', date: '22 May', level: 'program'   as const },
      { name: 'Sprint Review #6',   date: '28 May', level: 'team'      as const },
    ],
    criticalVendor:    'OpenAI (GPT-4o)',
    vendorRenewal:     'Jun 2026',
    nextMilestone:     'Primer piloto en producción',
    nextMilestoneDate: 'Jun 2026',
    milestoneStatus:   'on-track' as const,
  },

} as const
