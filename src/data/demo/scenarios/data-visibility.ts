// ============================================================
// LEAN AI System — Escenario demo: Visibilidad del dato
//
// Patrón: la empresa tiene IA funcionando en múltiples equipos
// pero nadie sabe qué está produciendo ni cuánto cuesta.
// Firma T1: Estrategia alta + Liderazgo alto + Datos bajo + Procesos bajo
//
// Momento del engagement en la demo: Phase A activa (Activate)
// — Listen y Evaluate completados, ahora estructurando visibilidad.
// ============================================================

import type { DemoScenario } from '../types'

export const dataVisibilityScenario: DemoScenario = {
  id:      'data-visibility',
  label:   'Visibilidad del dato',
  tagline: 'IA en marcha. Sin métricas. Sin control.',

  company: {
    name:      'Meridian Seguros',
    industry:  'Servicios financieros y seguros',
    employees: 780,
    country:   'España',
    context:
      'Aseguradora mediana con presencia nacional. En los últimos 24 meses, ' +
      '5 departamentos han adoptado herramientas IA de forma autónoma. ' +
      'El CIO sabe que la IA está ocurriendo — no sabe qué está produciendo.',
  },

  // ── T1 Radar — firma "IA sin gobierno" ──────────────────────
  // Estrategia y Liderazgo altos: hay voluntad y visión arriba.
  // Datos y Procesos bajos: los cimientos no están.
  // Gobernanza muy baja: nadie tiene el control real.
  t1Radar: [
    { dimension: 'Estrategia',  current: 3.8, target: 4.5 },
    { dimension: 'Datos',       current: 1.7, target: 4.0 },
    { dimension: 'Tecnología',  current: 3.2, target: 4.0 },
    { dimension: 'Talento',     current: 2.9, target: 4.0 },
    { dimension: 'Procesos',    current: 1.9, target: 3.5 },
    { dimension: 'Cultura',     current: 3.1, target: 4.0 },
    { dimension: 'Gobernanza',  current: 1.4, target: 4.0 },
    { dimension: 'Liderazgo',   current: 4.0, target: 4.5 },
  ],

  // ── Hero metrics — los números que duelen ───────────────────
  heroMetrics: [
    {
      value:      14,
      label:      'Herramientas IA activas',
      sublabel:   'en 5 departamentos',
      trend:      'neutral',
      deltaLabel: 'sin inventario unificado',
    },
    {
      value:      3,
      label:      'Con KPIs definidos',
      unit:       'solo',
      suffix:     '/ 14',
      trend:      'down',
      deltaLabel: 'herramientas sin ROI medido',
    },
    {
      value:      '€ 224K',
      label:      'Gasto IA anual',
      sublabel:   'sin ROI documentado',
      trend:      'down',
      deltaLabel: 'sin justificación al Consejo',
    },
    {
      value:      0,
      label:      'Informes de valor IA',
      suffix:     'presentados al Comité',
      trend:      'down',
      deltaLabel: 'en los últimos 12 meses',
    },
  ],

  // ── Fases Metro Map — cliente en Activate ───────────────────
  phases: [
    {
      id:          'listen',
      label:       'L — Listen',
      shortLabel:  'Listen',
      status:      'complete',
      duration:    'Semanas 1–3',
      description: 'Diagnóstico de madurez IA y mapa de oportunidades',
      tools: [
        { code: 'T1', name: 'AI Readiness Assessment',      status: 'complete', output: 'Informe de madurez — 8 dimensiones' },
        { code: 'T2', name: 'Stakeholder Segmentation',     status: 'complete', output: 'Mapa de stakeholders + arquetipos' },
        { code: 'T3', name: 'Value Stream Map',             status: 'complete', output: 'Procesos con oportunidad IA identificada' },
      ],
    },
    {
      id:          'evaluate',
      label:       'E — Evaluate',
      shortLabel:  'Evaluate',
      status:      'complete',
      duration:    'Semanas 4–8',
      description: 'Priorización de casos de uso y marco de gobierno',
      tools: [
        { code: 'T4', name: 'Use Case Prioritization Board', status: 'complete', output: 'Top 5 casos de uso con ROI estimado' },
        { code: 'T5', name: 'AI Taxonomy Canvas',            status: 'complete', output: 'Taxonomía IA validada con el CIO' },
        { code: 'T6', name: 'AI Risk & Governance Canvas',   status: 'complete', output: 'AI Policy + Risk Register' },
      ],
    },
    {
      id:          'activate',
      label:       'A — Activate',
      shortLabel:  'Activate',
      status:      'active',
      duration:    'Semanas 9–16',
      description: 'Piloto activo y construcción del sistema de medición',
      tools: [
        { code: 'T7',  name: 'AI Adoption Heatmap',   status: 'in_progress', output: 'Mapa de adopción por área y arquetipo' },
        { code: 'T8',  name: 'AI Communication Map',  status: 'pending',     output: 'Kits de comunicación para el Comité' },
        { code: 'T9',  name: 'AI Roadmap 6M',         status: 'pending',     output: 'Roadmap visual ejecutivo + operativo' },
      ],
    },
    {
      id:          'normalize',
      label:       'N — Normalize',
      shortLabel:  'Normalize',
      status:      'upcoming',
      duration:    'Meses 5–6',
      description: 'Gobierno continuo y dashboard de valor en vivo',
      tools: [
        { code: 'T10', name: 'AI Value Dashboard',    status: 'pending', output: '4 KPIs de adopción, valor, gobierno, productividad' },
        { code: 'T11', name: 'AI Operating Rhythm',   status: 'pending', output: 'Templates Daily/Weekly/Monthly para el COO' },
        { code: 'T12', name: 'AI Backlog Board',      status: 'pending', output: '10-15 iniciativas priorizadas para post-sprint' },
      ],
    },
    {
      id:          'iso',
      label:       'ISO 42001',
      shortLabel:  'ISO',
      status:      'upcoming',
      duration:    'Semana 24',
      description: '~78% del AIMS documentado automáticamente desde T1-T12',
      tools: [
        { code: 'T13', name: 'AI System Impact Assessment', status: 'pending', output: 'AIMS auditable por certificadora externa' },
      ],
    },
    {
      id:          'handover',
      label:       'Continuidad',
      shortLabel:  '∞',
      status:      'locked',
      duration:    'Post-sprint',
      description: 'Transferencia al PM cliente o modalidad Managed Service',
      tools: [],
    },
  ],

  // ── Narrativa de demo ────────────────────────────────────────
  narrative: {
    hook:
      'Tenéis 14 herramientas IA funcionando en la empresa. ' +
      'No podéis decirle al Consejo cuánto os están costando ni qué están produciendo.',

    problem:
      'Cada departamento ha comprado o adoptado IA de forma autónoma, ' +
      'con criterios de éxito distintos o sin ningún criterio. ' +
      'El resultado: gasto real sin ROI documentado, ' +
      'y un CIO que no puede responder la pregunta más básica del Comité de Dirección: ' +
      '"¿Cuánto nos cuesta la IA y qué estamos obteniendo a cambio?"',

    unlock:
      'T1 fotografia la madurez real en 8 dimensiones. T10 construye el dashboard de valor ' +
      'que le permite al CIO presentar en Comité con datos, no con sensaciones. ' +
      'El sprint completo produce un AIMS auditado — por primera vez, la IA de la empresa ' +
      'tiene gobierno real, no voluntarismo.',

    proofPoint:
      '11 de las 14 herramientas activas no tienen ningún KPI definido. ' +
      '€224K gastados sin capacidad de justificación.',
  },

  // ── No tiene QW preview específico en Sprint 1 ──────────────
  // El QW más relevante es QW7 (Value Dashboard) que se activa en Normalize.
  // En Sprint 1 usamos QW1 (Executive Briefing Pack) como preview.
  quickWinPreview: undefined,

  primaryQw: 'QW7',
  keyTools:  ['T1', 'T7', 'T10'],
}
