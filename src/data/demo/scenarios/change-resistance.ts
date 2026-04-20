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
  // Tecnología y Talento técnico altos: la infraestructura existe.
  // Cultura y Liderazgo intermedio muy bajos: el problema es humano.
  // Procesos bajos: los flujos de trabajo no están rediseñados para IA.
  t1Radar: [
    { dimension: 'Estrategia',  current: 2.7, target: 4.0 },
    { dimension: 'Datos',       current: 3.1, target: 4.0 },
    { dimension: 'Tecnología',  current: 3.8, target: 4.5 },
    { dimension: 'Talento',     current: 2.2, target: 4.0 },
    { dimension: 'Procesos',    current: 1.8, target: 4.0 },
    { dimension: 'Cultura',     current: 1.3, target: 4.0 },
    { dimension: 'Gobernanza',  current: 2.4, target: 3.5 },
    { dimension: 'Liderazgo',   current: 2.1, target: 4.5 },
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
}
