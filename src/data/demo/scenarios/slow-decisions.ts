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
  // 6 dimensiones · escala 0-4 · consolidado IT + Negocio
  // Datos y Tecnología decentes: los cimientos técnicos existen.
  // Procesos y Gobernanza muy bajos: el sistema de decisión bloquea todo.
  t1Radar: [
    { dimension: 'Estrategia', current: 2.4, target: 3.5 },
    { dimension: 'Datos',      current: 2.6, target: 3.5 },
    { dimension: 'Tecnología', current: 2.3, target: 3.5 },
    { dimension: 'Talento',    current: 1.8, target: 3.5 },
    { dimension: 'Procesos',   current: 1.1, target: 3.5 },
    { dimension: 'Gobernanza', current: 1.3, target: 3.5 },
  ],

  // ── Hero metrics ─────────────────────────────────────────────
  heroMetrics: [
    {
      value:      4.5,
      suffix:     'meses',
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
      sublabel:   'ninguno en marcha',
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

  // ── Entrevistados T1 — brecha IT / Negocio ───────────────────
  // CTO: frustrado con el proceso. Sabe que la tecnología está lista.
  // CFO: cree que la gobernanza protege. No ve el coste de la lentitud.
  // Brecha principal: Gobernanza (+0.5 CFO) y Procesos IT vs BIZ.
  interviewees: [
    {
      id:        'cto-rafael',
      name:      'Rafael Mora',
      role:      'CTO',
      archetype: 'Ejecutivo TI',
      type:      'it',
      scores: {
        'strategy-vision':        3, 'strategy-roadmap':       1,
        'strategy-budget':        2, 'strategy-sponsorship':   3,
        'data-availability':      3, 'data-quality':           3,
        'data-volume':            3, 'data-privacy':           2,
        'tech-infrastructure':    3, 'tech-integration':       3,
        'tech-security':          2, 'tech-mlops':             2,
        'talent-technical':       2, 'talent-training':        2,
        'talent-culture':         2, 'talent-change':          1,
        'process-identification': 2, 'process-redesign':       1,
        'process-roi':            1, 'process-pilots':         1,
        'gov-policy':             1, 'gov-risk':               1,
        'gov-catalog':            1, 'gov-audit':              1,
      },
      evidence: {
        'strategy-roadmap':  '8 oportunidades IA identificadas. Ninguna ha llegado a piloto. El proceso de aprobación dura 4,5 meses de media.',
        'tech-infrastructure': 'La infraestructura está lista. El cuello de botella no es tecnológico.',
        'process-pilots':    'Sin metodología de pilotos. Cada solicitud empieza de cero en el Comité.',
      },
    },
    {
      id:        'cfo-inmaculada',
      name:      'Inmaculada Valls',
      role:      'CFO',
      archetype: 'Líder de Negocio',
      type:      'business',
      scores: {
        'strategy-vision':        3, 'strategy-roadmap':       2,
        'strategy-budget':        2, 'strategy-sponsorship':   3,
        'data-availability':      3, 'data-quality':           2,
        'data-volume':            3, 'data-privacy':           2,
        'tech-infrastructure':    3, 'tech-integration':       2,
        'tech-security':          2, 'tech-mlops':             1,
        'talent-technical':       2, 'talent-training':        1,
        'talent-culture':         3, 'talent-change':          1,
        'process-identification': 1, 'process-redesign':       1,
        'process-roi':            1, 'process-pilots':         1,
        'gov-policy':             2, 'gov-risk':               1,
        'gov-catalog':            2, 'gov-audit':              1,
      },
      evidence: {
        'gov-policy':       'El proceso de aprobación existe para proteger a la empresa. Pero quizás es demasiado largo.',
        'talent-culture':   'Los equipos quieren usar IA, hay buena disposición. El freno no es la gente.',
        'process-roi':      'Si aprobamos algo deberíamos medir si funciona. Ahora mismo no lo hacemos.',
      },
    },
  ],
}
