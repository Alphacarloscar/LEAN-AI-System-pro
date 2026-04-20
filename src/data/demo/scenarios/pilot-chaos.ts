// ============================================================
// LEAN AI System — Escenario demo: Gestión de pilotos y PoC
//
// Patrón: la empresa experimenta con IA activamente pero cada piloto
// es una expedición solitaria. Nada escala a producción, los aprendizajes
// no se acumulan, y el presupuesto se consume en experimentos.
// Firma T1: Estrategia alta + Liderazgo alto + Procesos muy bajo + Gobernanza muy bajo
//
// Nota de posicionamiento:
// Este patrón es diferente de Vendor Sprawl.
// Vendor Sprawl = caos en COMPRA (procurement).
// Pilot Chaos   = caos en EJECUCIÓN (delivery).
// Una empresa puede tener ambos simultáneamente.
//
// Momento del engagement en la demo: Phase N activa (Normalize)
// — intentando institucionalizar lo que hasta ahora era caótico.
// ============================================================

import type { DemoScenario } from '../types'

export const pilotChaosScenario: DemoScenario = {
  id:      'pilot-chaos',
  label:   'Gestión de pilotos IA',
  tagline: 'Tenéis 7 pilotos en marcha. Ninguno tiene fecha de producción.',

  company: {
    name:      'Gestión Dinámica',
    industry:  'Consultoría de gestión y servicios digitales',
    employees: 440,
    country:   'España',
    context:
      'Firma de consultoría de gestión mid-market con 440 empleados. ' +
      'Muy orientada a la innovación: han lanzado 12 pilotos IA en 18 meses. ' +
      'Solo 1 ha llegado a producción. El CEO quiere respuestas.',
  },

  // ── T1 Radar — firma "ambición sin infraestructura" ──────────
  // Estrategia y Liderazgo muy altos: hay energía y visión en la cúpula.
  // Cultura alta: la empresa tiene ADN innovador, no hay resistencia.
  // Procesos y Gobernanza muy bajos: no hay metodología de ejecución.
  // Esta es la firma del "bright chaos" — mucha luz, cero rigor.
  t1Radar: [
    { dimension: 'Estrategia',  current: 4.2, target: 4.5 },
    { dimension: 'Datos',       current: 2.7, target: 4.0 },
    { dimension: 'Tecnología',  current: 3.5, target: 4.5 },
    { dimension: 'Talento',     current: 3.3, target: 4.0 },
    { dimension: 'Procesos',    current: 1.5, target: 4.5 },
    { dimension: 'Cultura',     current: 4.3, target: 4.5 },
    { dimension: 'Gobernanza',  current: 1.2, target: 4.5 },
    { dimension: 'Liderazgo',   current: 4.4, target: 4.5 },
  ],

  // ── Hero metrics ─────────────────────────────────────────────
  heroMetrics: [
    {
      value:      7,
      label:      'Pilotos IA simultáneos',
      sublabel:   'en distintas fases de ejecución',
      trend:      'neutral',
      deltaLabel: '1 en producción en 18 meses',
    },
    {
      value:      19,
      suffix:     ' semanas',
      label:      'Duración media de un PoC',
      sublabel:   'planificado: 6 semanas',
      trend:      'down',
      deltaLabel: '3× más de lo previsto',
    },
    {
      value:      4,
      label:      'Pilotos abandonados a mitad',
      sublabel:   'de los últimos 8',
      trend:      'down',
      deltaLabel: 'sin documentación del por qué',
    },
    {
      value:      '€ 0',
      label:      'Aprendizajes documentados',
      sublabel:   'reutilizables entre equipos',
      trend:      'down',
      deltaLabel: 'cada piloto reinventa la rueda',
    },
  ],

  // ── Fases Metro Map — cliente en Normalize (intentando ordenar) ──
  phases: [
    {
      id:          'listen',
      label:       'L — Listen',
      shortLabel:  'Listen',
      status:      'complete',
      duration:    'Semanas 1–3',
      description: 'Diagnóstico: mapa de todos los pilotos activos y sus estados reales',
      tools: [
        { code: 'T1', name: 'AI Readiness Assessment',  status: 'complete', output: 'Firma T1: ambición máxima, metodología cero' },
        { code: 'T2', name: 'Stakeholder Segmentation', status: 'complete', output: 'Quién lidera cada piloto y con qué recursos reales' },
        { code: 'T3', name: 'Value Stream Map',         status: 'complete', output: 'Procesos que los pilotos intentan mejorar — mapeo real' },
      ],
    },
    {
      id:          'evaluate',
      label:       'E — Evaluate',
      shortLabel:  'Evaluate',
      status:      'complete',
      duration:    'Semanas 4–8',
      description: 'Priorización de pilotos: cuáles escalar, cuáles cancelar, cuáles pausar',
      tools: [
        { code: 'T4', name: 'Use Case Prioritization Board', status: 'complete', output: 'De 12 pilotos/PoC a 5 priorizados con criterios objetivos' },
        { code: 'T5', name: 'AI Taxonomy Canvas',            status: 'complete', output: 'Clasificación de los 7 pilotos activos por categoría IA' },
        { code: 'T6', name: 'AI Risk & Governance Canvas',   status: 'complete', output: 'AI Policy para pilotos + criterios Go/No-Go explícitos' },
      ],
    },
    {
      id:          'activate',
      label:       'A — Activate',
      shortLabel:  'Activate',
      status:      'complete',
      duration:    'Semanas 9–16',
      description: 'Primer piloto con metodología: plazos reales, KPIs, ownership claro',
      tools: [
        { code: 'T7',  name: 'AI Adoption Heatmap',  status: 'complete', output: 'Mapa de adopción del primer piloto metodológico' },
        { code: 'T8',  name: 'AI Communication Map', status: 'complete', output: 'Comunicación de la nueva metodología a todos los equipos' },
        { code: 'T9',  name: 'AI Roadmap 6M',        status: 'complete', output: 'Programa IA: los 5 pilotos con fechas y criterios de éxito' },
      ],
    },
    {
      id:          'normalize',
      label:       'N — Normalize',
      shortLabel:  'Normalize',
      status:      'active',
      duration:    'Meses 5–6',
      description: 'Pilotos como programa institucional — no como aventuras individuales',
      tools: [
        { code: 'T10', name: 'AI Value Dashboard',  status: 'in_progress', output: 'Dashboard: estado de cada piloto + ROI en tiempo real' },
        { code: 'T11', name: 'AI Operating Rhythm', status: 'pending',     output: 'Weekly de programa IA — todos los pilotos sincronizados' },
        { code: 'T12', name: 'AI Backlog Board',    status: 'in_progress', output: 'Backlog de pilotos: cola priorizada con criterios de entrada' },
      ],
    },
    {
      id:          'iso',
      label:       'ISO 42001',
      shortLabel:  'ISO',
      status:      'upcoming',
      duration:    'Semana 24',
      description: 'AIMS con historial de pilotos, lecciones aprendidas y governance trail',
      tools: [
        { code: 'T13', name: 'AI System Impact Assessment', status: 'pending', output: 'AIMS con programa de pilotos documentado y auditable' },
      ],
    },
    {
      id:          'handover',
      label:       'Continuidad',
      shortLabel:  '∞',
      status:      'upcoming',
      duration:    'Post-sprint',
      description: 'PM interno gestiona el programa de pilotos IA de forma autónoma',
      tools: [],
    },
  ],

  // ── Narrativa de demo ────────────────────────────────────────
  narrative: {
    hook:
      'Lleváis 18 meses lanzando pilotos IA. ' +
      'Solo uno ha llegado a producción. Los 11 restantes murieron en el camino ' +
      'sin que nadie haya documentado por qué.',

    problem:
      'Gestión Dinámica tiene el ADN correcto: cultura innovadora, liderazgo comprometido ' +
      'y talento técnico. El problema es que cada piloto es una expedición en solitario. ' +
      'Los equipos no comparten aprendizajes, no hay criterios de Go/No-Go explícitos, ' +
      'los plazos se estiran 3× sobre lo planificado, y cuando un piloto muere ' +
      'nadie documenta la causa. El presupuesto IA se consume en experimentos ' +
      'que no acumulan conocimiento ni generan valor sistémico.',

    unlock:
      'T9 convierte los pilotos sueltos en un programa IA gobernado con fechas reales ' +
      'y criterios de éxito objetivos. T12 da al COO visibilidad de qué está en marcha, ' +
      'qué está bloqueado y qué ya debería haberse cancelado. ' +
      'T6 introduce los criterios de Go/No-Go que eliminan el sunk cost fallacy ' +
      'que alarga los pilotos eternamente.',

    proofPoint:
      '19 semanas de media para un PoC planificado en 6. ' +
      '4 de cada 8 pilotos abandonados sin documentación de causa.',
  },

  primaryQw: 'QW3',
  keyTools:  ['T4', 'T9', 'T12'],
}
