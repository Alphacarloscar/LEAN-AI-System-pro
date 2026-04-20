// ============================================================
// LEAN AI System — Escenario demo: Resistencia al cambio
//
// Patrón: la tecnología funciona, la gente no quiere usarla.
// Los pilotos llegan a producción pero mueren en el rollout.
// Firma T1: Cultura muy baja + Adopción muy baja + Técnico alto
//
// Momento del engagement en la demo: Phase A activa (Activate)
// — la resistencia al cambio se ha vuelto visible al intentar escalar.
// ============================================================

import type { DemoScenario } from '../types'

export const changeResistanceScenario: DemoScenario = {
  id:      'change-resistance',
  label:   'Resistencia al cambio',
  tagline: 'La tecnología puede. La organización no quiere.',

  company: {
    name:      'Clínica Red Salud',
    industry:  'Sanidad y servicios de salud',
    employees: 1_100,
    country:   'España',
    context:
      'Red de clínicas privadas con 1.100 profesionales sanitarios y administrativos. ' +
      'Han invertido €320K en herramientas IA de diagnóstico asistido y administración. ' +
      'La adopción real entre el personal clínico es del 18%.',
  },

  // ── T1 Radar — firma "techo cultural" ───────────────────────
  // 6 dimensiones · escala 0-4 · consolidado IT + Negocio
  // Tecnología y Datos sólidos: la infraestructura técnica existe.
  // Talento y Procesos muy bajos: el cambio no está gestionado.
  t1Radar: [
    { dimension: 'Estrategia', current: 2.4, target: 3.5 },
    { dimension: 'Datos',      current: 3.0, target: 3.5 },
    { dimension: 'Tecnología', current: 2.5, target: 3.5 },
    { dimension: 'Talento',    current: 1.3, target: 3.5 },
    { dimension: 'Procesos',   current: 1.3, target: 3.5 },
    { dimension: 'Gobernanza', current: 1.9, target: 3.5 },
  ],

  // ── Hero metrics ─────────────────────────────────────────────
  heroMetrics: [
    {
      value:      18,
      unit:       '',
      suffix:     '%',
      label:      'Adoption rate real del personal',
      sublabel:   'tras 6 meses disponible',
      trend:      'down',
      deltaLabel: 'objetivo: 70%',
    },
    {
      value:      3,
      label:      'Pilotos abandonados en rollout',
      sublabel:   'de los últimos 5 lanzados',
      trend:      'down',
      deltaLabel: 'no en piloto — en escalado',
    },
    {
      value:      '€ 320K',
      label:      'Inversión en herramientas IA',
      sublabel:   'últimos 18 meses',
      trend:      'neutral',
      deltaLabel: 'con 18% de uso efectivo',
    },
    {
      value:      67,
      suffix:     '%',
      label:      'Personal sin uso IA en 30 días',
      sublabel:   'pese a tener acceso y formación',
      trend:      'down',
      deltaLabel: 'dato de last-30-days',
    },
  ],

  // ── Fases Metro Map — cliente en Activate (resistencia visible) ──
  phases: [
    {
      id:          'listen',
      label:       'L — Listen',
      shortLabel:  'Listen',
      status:      'complete',
      duration:    'Semanas 1–3',
      description: 'Diagnóstico de madurez — el techo cultural identificado',
      tools: [
        { code: 'T1', name: 'AI Readiness Assessment',  status: 'complete', output: 'Firma T1: brecha extrema Tecnología vs. Cultura' },
        { code: 'T2', name: 'Stakeholder Segmentation', status: 'complete', output: 'Mapa de arquetipos — 68% Resistentes identificados' },
        { code: 'T3', name: 'Value Stream Map',         status: 'complete', output: 'Flujos donde IA tiene más valor y menos resistencia' },
      ],
    },
    {
      id:          'evaluate',
      label:       'E — Evaluate',
      shortLabel:  'Evaluate',
      status:      'complete',
      duration:    'Semanas 4–8',
      description: 'Priorización de casos de uso de baja resistencia y alto impacto',
      tools: [
        { code: 'T4', name: 'Use Case Prioritization Board', status: 'complete', output: 'Casos de uso ordenados por facilidad de adopción' },
        { code: 'T5', name: 'AI Taxonomy Canvas',            status: 'complete', output: 'Clasificación IA adaptada al contexto sanitario' },
        { code: 'T6', name: 'AI Risk & Governance Canvas',   status: 'complete', output: 'AI Policy sanitaria + gestión de resistencia activa' },
      ],
    },
    {
      id:          'activate',
      label:       'A — Activate',
      shortLabel:  'Activate',
      status:      'active',
      duration:    'Semanas 9–16',
      description: 'Programa de activación por arquetipos — Exploradores primero',
      tools: [
        { code: 'T7',  name: 'AI Adoption Heatmap',  status: 'complete',    output: 'Heatmap de resistencia por área y arquetipo clínico' },
        { code: 'T8',  name: 'AI Communication Map', status: 'in_progress', output: 'Kits de comunicación diferenciados por arquetipo' },
        { code: 'T9',  name: 'AI Roadmap 6M',        status: 'in_progress', output: 'Roadmap de activación secuenciada por resistencia' },
      ],
    },
    {
      id:          'normalize',
      label:       'N — Normalize',
      shortLabel:  'Normalize',
      status:      'upcoming',
      duration:    'Meses 5–6',
      description: 'Adoption rate >70% y gobierno cultural de largo plazo',
      tools: [
        { code: 'T10', name: 'AI Value Dashboard',  status: 'pending', output: 'Dashboard: adoption rate por área vs. objetivo' },
        { code: 'T11', name: 'AI Operating Rhythm', status: 'pending', output: 'Ritmo de feedback y mejora continua de adopción' },
        { code: 'T12', name: 'AI Backlog Board',    status: 'pending', output: 'Pipeline de nuevas capacidades IA con plan de adopción' },
      ],
    },
    {
      id:          'iso',
      label:       'ISO 42001',
      shortLabel:  'ISO',
      status:      'upcoming',
      duration:    'Semana 24',
      description: 'AIMS con foco en AI Act sanitario y gestión de impacto humano',
      tools: [
        { code: 'T13', name: 'AI System Impact Assessment', status: 'pending', output: 'AIMS con mapeo AI Act sanitario + plan de cambio' },
      ],
    },
    {
      id:          'handover',
      label:       'Continuidad',
      shortLabel:  '∞',
      status:      'locked',
      duration:    'Post-sprint',
      description: 'PM interno gestiona la curva de adopción sin Alpha presente',
      tools: [],
    },
  ],

  // ── Narrativa de demo ────────────────────────────────────────
  narrative: {
    hook:
      '€320K en herramientas IA disponibles para todo el personal. ' +
      'El 67% no ha abierto ninguna en el último mes.',

    problem:
      'El problema no es técnico. Clínica Red Salud tiene la tecnología, tiene los datos, ' +
      'tiene la formación. Pero el personal clínico no usa las herramientas porque ' +
      'nadie ha trabajado los arquetipos de resistencia, nadie ha rediseñado los ' +
      'flujos de trabajo para integrar IA, y el liderazgo intermedio no ha recibido ' +
      'el kit de comunicación que necesita para gestionar el cambio.',

    unlock:
      'T2 identifica exactamente quién resiste y por qué — no todos los perfiles ' +
      'se gestionan igual. T7 mapea dónde empezar con los Exploradores para ' +
      'crear masa crítica. T8 genera los kits de comunicación diferenciados ' +
      'por arquetipo. La adopción no es un problema de tecnología — es un programa.',

    proofPoint:
      '3 de 5 pilotos abandonados en la fase de rollout, no en piloto. ' +
      'El problema siempre aparece en el escalado, no en la prueba de concepto.',
  },

  primaryQw: 'QW6',
  keyTools:  ['T2', 'T7', 'T8'],

  // ── Entrevistados T1 — brecha IT / Negocio ───────────────────
  // Director TI: ve la tecnología lista, no entiende la resistencia clínica.
  // Director médico: usa la tecnología lo menos posible, cultura muy baja.
  // Brecha principal: Tecnología (+1.0 IT vs BIZ) y Talento/Cambio.
  interviewees: [
    {
      id:        'it-director-david',
      name:      'David Carrasco',
      role:      'Director TI',
      archetype: 'Ejecutivo TI',
      type:      'it',
      scores: {
        'strategy-vision':        3, 'strategy-roadmap':       2,
        'strategy-budget':        3, 'strategy-sponsorship':   2,
        'data-availability':      3, 'data-quality':           3,
        'data-volume':            3, 'data-privacy':           3,
        'tech-infrastructure':    4, 'tech-integration':       3,
        'tech-security':          3, 'tech-mlops':             2,
        'talent-technical':       3, 'talent-training':        1,
        'talent-culture':         1, 'talent-change':          1,
        'process-identification': 2, 'process-redesign':       1,
        'process-roi':            1, 'process-pilots':         2,
        'gov-policy':             2, 'gov-risk':               2,
        'gov-catalog':            2, 'gov-audit':              2,
      },
      evidence: {
        'tech-infrastructure':  'Hemos desplegado 3 herramientas IA clínicas. Técnicamente funcionan perfectamente.',
        'talent-culture':       'Solo el 18% del personal clínico usa las herramientas disponibles. No entiendo por qué.',
        'talent-change':        'No hay plan de formación ni gestión del cambio. IT desplegó, nadie acompañó la adopción.',
      },
    },
    {
      id:        'medical-director-ana',
      name:      'Ana Quintero',
      role:      'Directora Médica',
      archetype: 'Líder de Negocio',
      type:      'business',
      scores: {
        'strategy-vision':        3, 'strategy-roadmap':       2,
        'strategy-budget':        2, 'strategy-sponsorship':   2,
        'data-availability':      3, 'data-quality':           3,
        'data-volume':            3, 'data-privacy':           3,
        'tech-infrastructure':    3, 'tech-integration':       2,
        'tech-security':          2, 'tech-mlops':             1,
        'talent-technical':       1, 'talent-training':        1,
        'talent-culture':         1, 'talent-change':          1,
        'process-identification': 1, 'process-redesign':       1,
        'process-roi':            1, 'process-pilots':         1,
        'gov-policy':             2, 'gov-risk':               2,
        'gov-catalog':            2, 'gov-audit':              1,
      },
      evidence: {
        'talent-culture':    'El personal clínico no ha recibido formación. Les han instalado herramientas sin explicarles el por qué.',
        'talent-change':     '3 de los 5 pilotos fueron abandonados por el personal en la fase de rollout.',
        'process-redesign':  'Las herramientas IA están encima de flujos de trabajo que no se han rediseñado para ellas.',
      },
    },
  ],
}
