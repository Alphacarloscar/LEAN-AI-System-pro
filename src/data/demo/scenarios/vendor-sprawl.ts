// ============================================================
// LEAN AI System — Escenario demo: Vendor Sprawl
//
// Patrón: cada departamento compra IA independientemente.
// Capacidades duplicadas, riesgo de seguridad no gestionado,
// y un presupuesto IA que nadie puede consolidar.
// Firma T1: Gobernanza muy baja + Exploración muy alta
//
// Momento del engagement en la demo: Phase E activa (Evaluate)
// — Listen completado, T2 acaba de generar QW4 (Licence Waste Report).
// Este es el escenario PRIORITARIO para la demo Javier + Susana.
// ============================================================

import type { DemoScenario } from '../types'

export const vendorSprawlScenario: DemoScenario = {
  id:      'vendor-sprawl',
  label:   'Vendor Sprawl',
  tagline: 'Todos compran IA. Nadie coordina. El dinero se escapa por 26 agujeros.',

  company: {
    name:      'Conecta Professional Services',
    industry:  'Servicios profesionales y consultoría',
    employees: 520,
    country:   'España',
    context:
      'Consultora de gestión con 520 empleados y 8 líneas de servicio. ' +
      'La adopción IA ha sido bottom-up: cada equipo ha comprado las herramientas ' +
      'que le parecían útiles. El CIO no tiene inventario consolidado.',
  },

  // ── T1 Radar — firma "caos de adopción" ─────────────────────
  // 6 dimensiones · escala 0-4 · consolidado IT + Negocio
  // Gobernanza y Procesos en estado crítico (< 0.5).
  // Talento y Tecnología relativamente fuertes.
  t1Radar: [
    { dimension: 'Estrategia', current: 2.0, target: 3.5 },
    { dimension: 'Datos',      current: 1.8, target: 3.5 },
    { dimension: 'Tecnología', current: 1.9, target: 3.5 },
    { dimension: 'Talento',    current: 2.4, target: 3.5 },
    { dimension: 'Procesos',   current: 0.9, target: 3.5 },
    { dimension: 'Gobernanza', current: 0.4, target: 3.5 },
  ],

  // ── Hero metrics ─────────────────────────────────────────────
  heroMetrics: [
    {
      value:      26,
      label:      'Contratos IA activos',
      sublabel:   'identificados en auditoría',
      trend:      'down',
      deltaLabel: 'en 8 departamentos independientes',
    },
    {
      value:      '€ 185K',
      label:      'Gasto duplicado estimado',
      sublabel:   'capacidades solapadas',
      trend:      'down',
      deltaLabel: 'ahorro potencial anual',
    },
    {
      value:      6,
      label:      'Categorías con contratos duplicados',
      sublabel:   'misma funcionalidad, distintos vendors',
      trend:      'down',
      deltaLabel: 'de 9 categorías auditadas',
    },
    {
      value:      0,
      label:      'Contratos IA con cláusula de seguridad',
      sublabel:   'ninguno revisado',
      trend:      'down',
      deltaLabel: 'riesgo GDPR no gestionado',
    },
  ],

  // ── Fases Metro Map — cliente en Evaluate (T2 acaba de entregar QW4) ──
  phases: [
    {
      id:          'listen',
      label:       'L — Listen',
      shortLabel:  'Listen',
      status:      'complete',
      duration:    'Semanas 1–3',
      description: 'Diagnóstico de madurez e inventario de adopción IA espontánea',
      tools: [
        { code: 'T1', name: 'AI Readiness Assessment',  status: 'complete', output: 'Firma T1: alta exploración, cero gobernanza' },
        { code: 'T2', name: 'Stakeholder Segmentation', status: 'complete', output: 'Mapa de compradores IA + Licence Waste Report (QW4)' },
        { code: 'T3', name: 'Value Stream Map',         status: 'complete', output: 'Procesos donde la IA actual genera valor vs. duplica coste' },
      ],
    },
    {
      id:          'evaluate',
      label:       'E — Evaluate',
      shortLabel:  'Evaluate',
      status:      'active',
      duration:    'Semanas 4–8',
      description: 'Racionalización del portfolio IA y diseño del gobierno de compras',
      tools: [
        { code: 'T4', name: 'Use Case Prioritization Board', status: 'in_progress', output: 'Mapa de qué herramientas conservar, consolidar o eliminar' },
        { code: 'T5', name: 'AI Taxonomy Canvas',            status: 'complete',    output: 'Taxonomía de capacidades IA — 7 categorías corporativas' },
        { code: 'T6', name: 'AI Risk & Governance Canvas',   status: 'in_progress', output: 'AI Policy + proceso de aprobación de compras IA' },
      ],
    },
    {
      id:          'activate',
      label:       'A — Activate',
      shortLabel:  'Activate',
      status:      'upcoming',
      duration:    'Semanas 9–16',
      description: 'Consolidación activa y comunicación del nuevo modelo de gobierno',
      tools: [
        { code: 'T7',  name: 'AI Adoption Heatmap',  status: 'pending', output: 'Mapa de adopción real por área — dónde está el valor verdadero' },
        { code: 'T8',  name: 'AI Communication Map', status: 'pending', output: 'Kit de comunicación para el cambio en el modelo de compras' },
        { code: 'T9',  name: 'AI Roadmap 6M',        status: 'pending', output: 'Roadmap de consolidación: qué se cancela, qué se escala' },
      ],
    },
    {
      id:          'normalize',
      label:       'N — Normalize',
      shortLabel:  'Normalize',
      status:      'upcoming',
      duration:    'Meses 5–6',
      description: 'Catálogo IA corporativo aprobado + gobierno de compras normalizado',
      tools: [
        { code: 'T10', name: 'AI Value Dashboard',  status: 'pending', output: 'Dashboard: gasto IA consolidado vs. valor generado' },
        { code: 'T11', name: 'AI Operating Rhythm', status: 'pending', output: 'Revisión trimestral de portfolio IA con criterios' },
        { code: 'T12', name: 'AI Backlog Board',    status: 'pending', output: 'Pipeline de nuevas herramientas con proceso de evaluación' },
      ],
    },
    {
      id:          'iso',
      label:       'ISO 42001',
      shortLabel:  'ISO',
      status:      'upcoming',
      duration:    'Semana 24',
      description: 'AIMS con inventario IA, risk register y AI Policy documentados',
      tools: [
        { code: 'T13', name: 'AI System Impact Assessment', status: 'pending', output: 'AIMS auditable — portfolio IA completo y gobernado' },
      ],
    },
    {
      id:          'handover',
      label:       'Continuidad',
      shortLabel:  '∞',
      status:      'locked',
      duration:    'Post-sprint',
      description: 'PM cliente gestiona el catálogo IA corporativo de forma autónoma',
      tools: [],
    },
  ],

  // ── Narrativa de demo ────────────────────────────────────────
  narrative: {
    hook:
      'En los últimos 6 meses vuestros equipos han firmado 26 contratos IA. ' +
      'Ninguno ha pasado por IT. Ninguno tiene cláusula de seguridad de datos.',

    problem:
      'La adopción IA en Conecta ha sido completamente bottom-up: ' +
      'cada equipo ha comprado lo que le parecía útil, sin ningún criterio corporativo. ' +
      'El resultado es un sprawl de 26 contratos, 6 categorías de capacidades duplicadas ' +
      'y un riesgo GDPR que nadie ha evaluado. El dinero se gasta, el valor no se mide.',

    unlock:
      'T2 genera el Licence Waste Report en 48 horas tras las primeras entrevistas: ' +
      'inventario completo, duplicidades identificadas, ahorro potencial cuantificado. ' +
      'T6 diseña el proceso de compra IA que evita que esto vuelva a pasar. ' +
      'El CIO tiene, por primera vez, control real sobre el portfolio IA de la empresa.',

    proofPoint:
      '€185K/año en contratos duplicados identificados en auditoría de 3 días. ' +
      '0 contratos con cláusula de seguridad de datos revisada.',
  },

  // ── QW4 Preview — Licence Waste Report ──────────────────────
  quickWinPreview: {
    qwCode:        'QW4',
    title:         'Licence Waste Report',
    subtitle:      'Auditoría de contratos IA — Conecta Professional Services',
    totalValue:    '€185K/año',
    impactSummary:
      '6 categorías de capacidades IA duplicadas en 8 departamentos. ' +
      'Consolidación a contrato corporativo único = ahorro estimado €185K/año.',
    licenceItems: [
      {
        category:    'Asistentes de redacción y síntesis',
        contracts:   6,
        departments: 4,
        annualWaste: 41_200,
        risk:        'low',
        examples:    ['ChatGPT Teams', 'Copilot M365', 'Claude Pro', 'Jasper', 'Writesonic', 'Notion AI'],
      },
      {
        category:    'Análisis de datos e informes automáticos',
        contracts:   4,
        departments: 3,
        annualWaste: 38_400,
        risk:        'high',
        examples:    ['Tableau AI', 'Power BI Copilot', 'ThoughtSpot', 'Akkio'],
      },
      {
        category:    'Transcripción y resumen de reuniones',
        contracts:   5,
        departments: 5,
        annualWaste: 29_600,
        risk:        'medium',
        examples:    ['Otter.ai', 'Fireflies', 'Fathom', 'Grain', 'Avoma'],
      },
      {
        category:    'Generación de presentaciones',
        contracts:   4,
        departments: 3,
        annualWaste: 22_800,
        risk:        'low',
        examples:    ['Tome', 'Beautiful.ai', 'Gamma', 'Canva AI'],
      },
      {
        category:    'Búsqueda y gestión del conocimiento',
        contracts:   4,
        departments: 3,
        annualWaste: 18_400,
        risk:        'medium',
        examples:    ['Glean', 'Guru', 'Notion AI', 'Confluence AI'],
      },
      {
        category:    'Automatización de tareas repetitivas',
        contracts:   3,
        departments: 3,
        annualWaste: 34_600,
        risk:        'high',
        examples:    ['Zapier AI', 'Make (Integromat)', 'n8n'],
      },
    ],
  },

  primaryQw: 'QW4',
  keyTools:  ['T2', 'T4', 'T6'],

  // ── Entrevistados T1 — brecha IT / Negocio ───────────────────
  // CIO: conoce el caos técnico y de gobernanza, puntúa bajo ahí.
  // CEO: ve cultura y estrategia bien, no percibe el riesgo real.
  // Brecha principal: Gobernanza (+0.25 CEO vs CIO) y Estrategia (+1.0).
  interviewees: [
    {
      id:        'cio-elena',
      name:      'Elena Villanueva',
      role:      'CIO',
      archetype: 'Ejecutiva TI',
      type:      'it',
      scores: {
        // D1 Estrategia — avg 1.5
        'strategy-vision':       2,
        'strategy-roadmap':      1,
        'strategy-budget':       1,
        'strategy-sponsorship':  2,
        // D2 Datos — avg 1.5
        'data-availability':     2,
        'data-quality':          1,
        'data-volume':           2,
        'data-privacy':          1,
        // D3 Tecnología — avg 2.0
        'tech-infrastructure':   3,
        'tech-integration':      2,
        'tech-security':         2,
        'tech-mlops':            1,
        // D4 Talento — avg 2.0
        'talent-technical':      3,
        'talent-training':       1,
        'talent-culture':        3,
        'talent-change':         1,
        // D5 Procesos — avg 0.75
        'process-identification': 1,
        'process-redesign':       1,
        'process-roi':            0,
        'process-pilots':         1,
        // D6 Gobernanza — avg 0.25
        'gov-policy':            0,
        'gov-risk':              0,
        'gov-catalog':           1,
        'gov-audit':             0,
      },
      evidence: {
        'gov-catalog':    '26 contratos IA activos identificados. Ninguno revisado por IT antes de firmarse.',
        'gov-policy':     'No existe AI Policy. Los contratos no incluyen cláusulas de seguridad de datos ni GDPR.',
        'process-roi':    'Sin métricas de valor generado por ninguna de las 26 herramientas activas.',
        'tech-infrastructure': 'M365 + Azure presentes y estables. Sin arquitectura IA definida formalmente.',
      },
    },
    {
      id:        'ceo-marcos',
      name:      'Marcos Ibáñez',
      role:      'CEO',
      archetype: 'Líder de Negocio',
      type:      'business',
      scores: {
        // D1 Estrategia — avg 2.5
        'strategy-vision':       3,
        'strategy-roadmap':      2,
        'strategy-budget':       2,
        'strategy-sponsorship':  3,
        // D2 Datos — avg 2.0
        'data-availability':     2,
        'data-quality':          2,
        'data-volume':           3,
        'data-privacy':          1,
        // D3 Tecnología — avg 1.75
        'tech-infrastructure':   3,
        'tech-integration':      2,
        'tech-security':         1,
        'tech-mlops':            1,
        // D4 Talento — avg 2.75
        'talent-technical':      3,
        'talent-training':       2,
        'talent-culture':        4,
        'talent-change':         2,
        // D5 Procesos — avg 1.0
        'process-identification': 1,
        'process-redesign':       1,
        'process-roi':            1,
        'process-pilots':         1,
        // D6 Gobernanza — avg 0.5
        'gov-policy':            1,
        'gov-risk':              0,
        'gov-catalog':           1,
        'gov-audit':             0,
      },
      evidence: {
        'talent-culture':     'Los equipos están muy entusiasmados con la IA. La energía es alta, la dirección lo ve positivo.',
        'strategy-vision':    'Queremos ser referentes en uso de IA en nuestro sector en 2 años.',
        'gov-catalog':        'No sabía que teníamos tantos contratos duplicados. Esto no puede seguir así.',
        'data-privacy':       'Asumía que IT revisaba los contratos antes de firmar. Al parecer no.',
      },
    },
  ],
}
