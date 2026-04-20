// ============================================================
// LEAN AI System — Escenario demo: Toma de decisión lenta
//
// Patrón: la empresa quiere adoptar IA pero el proceso de aprobación
// dura meses. Para cuando aprueban, la tecnología ha cambiado.
// Firma T1: Gobernanza baja + Procesos muy bajos + Datos medio
//
// Momento del engagement en la demo: Phase L activa (Listen)
// — primeras semanas del sprint, T1 recién completado.
// ============================================================

import type { DemoScenario } from '../types'

export const slowDecisionsScenario: DemoScenario = {
  id:      'slow-decisions',
  label:   'Toma de decisión lenta',
  tagline: 'La oportunidad IA dura 6 semanas. Tu proceso de aprobación dura 4 meses.',

  company: {
    name:      'Argenta Manufactura',
    industry:  'Fabricación industrial y logística',
    employees: 1_650,
    country:   'España',
    context:
      'Empresa manufacturera con 4 plantas y 1.650 empleados. ' +
      'La dirección ha identificado 8 oportunidades de automatización con IA ' +
      'en el último año. Ninguna ha llegado a piloto todavía.',
  },

  // ── T1 Radar — firma "parálisis organizativa" ────────────────
  // Datos y Tecnología decentes: tienen cimientos técnicos.
  // Gobernanza y Procesos muy bajos: el problema es el sistema de decisión.
  // Estrategia media: saben que quieren IA, no saben cómo decidirlo.
  t1Radar: [
    { dimension: 'Estrategia',  current: 2.6, target: 4.0 },
    { dimension: 'Datos',       current: 2.9, target: 4.0 },
    { dimension: 'Tecnología',  current: 3.1, target: 4.0 },
    { dimension: 'Talento',     current: 2.4, target: 3.5 },
    { dimension: 'Procesos',    current: 1.4, target: 4.0 },
    { dimension: 'Cultura',     current: 2.7, target: 3.5 },
    { dimension: 'Gobernanza',  current: 1.6, target: 4.0 },
    { dimension: 'Liderazgo',   current: 3.3, target: 4.5 },
  ],

  // ── Hero metrics ─────────────────────────────────────────────
  heroMetrics: [
    {
      value:      4.5,
      suffix:     ' meses',
      label:      'Ciclo medio de aprobación IA',
      sublabel:   'desde identificación hasta piloto',
      trend:      'down',
      deltaLabel: 'objetivo del sector: 6 semanas',
    },
    {
      value:      18,
      label:      'Stakeholders en última decisión',
      sublabel:   'compra de herramienta IA',
      trend:      'down',
      deltaLabel: 'benchmark: 4-6 personas',
    },
    {
      value:      8,
      label:      'Oportunidades identificadas',
      sublabel:   'en los últimos 12 meses',
      trend:      'neutral',
      deltaLabel: 'ninguna en producción',
    },
    {
      value:      0,
      label:      'Pilotos IA activos',
      suffix:     'en marcha',
      trend:      'down',
      deltaLabel: 'pese a 8 oportunidades mapeadas',
    },
  ],

  // ── Fases Metro Map — cliente en Listen ─────────────────────
  phases: [
    {
      id:          'listen',
      label:       'L — Listen',
      shortLabel:  'Listen',
      status:      'active',
      duration:    'Semanas 1–3',
      description: 'Diagnóstico de madurez y mapa de oportunidades',
      tools: [
        { code: 'T1', name: 'AI Readiness Assessment',  status: 'complete',    output: 'Informe de madurez — parálisis en gobernanza identificada' },
        { code: 'T2', name: 'Stakeholder Segmentation', status: 'in_progress', output: 'Mapa de quién decide, quién bloquea, quién puede desbloquear' },
        { code: 'T3', name: 'Value Stream Map',         status: 'pending',     output: 'Top 8 procesos con oportunidad IA ordenados por impacto' },
      ],
    },
    {
      id:          'evaluate',
      label:       'E — Evaluate',
      shortLabel:  'Evaluate',
      status:      'upcoming',
      duration:    'Semanas 4–8',
      description: 'Priorización con criterios de decisión objetivos y validados',
      tools: [
        { code: 'T4', name: 'Use Case Prioritization Board', status: 'pending', output: 'Matriz de decisión — sustituye la política por criterios' },
        { code: 'T5', name: 'AI Taxonomy Canvas',            status: 'pending', output: 'Framework de clasificación IA que acelera aprobaciones' },
        { code: 'T6', name: 'AI Risk & Governance Canvas',   status: 'pending', output: 'Proceso de aprobación IA rediseñado — de 4 meses a 3 semanas' },
      ],
    },
    {
      id:          'activate',
      label:       'A — Activate',
      shortLabel:  'Activate',
      status:      'upcoming',
      duration:    'Semanas 9–16',
      description: 'Primer piloto lanzado bajo el nuevo proceso de gobierno',
      tools: [
        { code: 'T7',  name: 'AI Adoption Heatmap',  status: 'pending', output: 'Mapa de dónde empieza el cambio con mayor impacto' },
        { code: 'T8',  name: 'AI Communication Map', status: 'pending', output: 'Kit de comunicación para romper la resistencia interna' },
        { code: 'T9',  name: 'AI Roadmap 6M',        status: 'pending', output: 'Roadmap que el Comité puede seguir en tiempo real' },
      ],
    },
    {
      id:          'normalize',
      label:       'N — Normalize',
      shortLabel:  'Normalize',
      status:      'upcoming',
      duration:    'Meses 5–6',
      description: 'Gobierno IA institucionalizado y autónomo',
      tools: [
        { code: 'T10', name: 'AI Value Dashboard',  status: 'pending', output: 'Dashboard que el Comité consulta sin necesitar reunión' },
        { code: 'T11', name: 'AI Operating Rhythm', status: 'pending', output: 'Cadencia de revisión IA integrada en el ritmo directivo' },
        { code: 'T12', name: 'AI Backlog Board',    status: 'pending', output: 'Pipeline de iniciativas con criterios de priorización claros' },
      ],
    },
    {
      id:          'iso',
      label:       'ISO 42001',
      shortLabel:  'ISO',
      status:      'upcoming',
      duration:    'Semana 24',
      description: 'AIMS generado — gobierno IA documentado y auditable',
      tools: [
        { code: 'T13', name: 'AI System Impact Assessment', status: 'pending', output: 'AIMS completo (~78% ISO 42001)' },
      ],
    },
    {
      id:          'handover',
      label:       'Continuidad',
      shortLabel:  '∞',
      status:      'locked',
      duration:    'Post-sprint',
      description: 'El PM interno gestiona el backlog IA de forma autónoma',
      tools: [],
    },
  ],

  // ── Narrativa de demo ────────────────────────────────────────
  narrative: {
    hook:
      'Habéis identificado 8 oportunidades IA este año. ' +
      'Ninguna ha llegado a piloto porque el proceso de aprobación dura más que la vida útil de la oportunidad.',

    problem:
      'Cada vez que surge una iniciativa IA, empieza un circuito de reuniones, ' +
      'comités y validaciones que involucra a 18 personas y tarda 4,5 meses de media. ' +
      'Para cuando se aprueba, la herramienta ha cambiado de versión, el proveedor ' +
      'ha subido el precio o el equipo que lo impulsaba ha perdido el entusiasmo.',

    unlock:
      'T6 rediseña el proceso de aprobación IA: de 18 stakeholders a un comité de 4 ' +
      'con criterios objetivos. T4 convierte la discusión política en una matriz de ' +
      'decisión con datos. El resultado: de 4 meses a 3 semanas de ciclo de aprobación.',

    proofPoint:
      '8 oportunidades identificadas. 0 pilotos activos. ' +
      'El competidor que actuó antes ya lleva 6 meses de ventaja.',
  },

  primaryQw: 'QW3',
  keyTools:  ['T1', 'T4', 'T6'],
}
