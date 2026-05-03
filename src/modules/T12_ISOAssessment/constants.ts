// ============================================================
// T12 — Constantes: 25 controles ISO 42001 + config visual
// ============================================================

import type { T12Clause, T12Control, T12Status } from './types'

// ── Config visual por cláusula ────────────────────────────────

export const T12_CLAUSE_CONFIG: Record<T12Clause, {
  label:     string
  shortLabel: string
  number:    string
  hex:       string
  bg:        string
}> = {
  context:     { label: 'Contexto de la organización', shortLabel: 'Contexto',     number: '4', hex: '#6A90C0', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  leadership:  { label: 'Liderazgo',                   shortLabel: 'Liderazgo',    number: '5', hex: '#7C3AED', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  planning:    { label: 'Planificación',                shortLabel: 'Planificación',number: '6', hex: '#0891B2', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  support:     { label: 'Apoyo',                        shortLabel: 'Apoyo',        number: '7', hex: '#5FAF8A', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  operation:   { label: 'Operación',                   shortLabel: 'Operación',    number: '8', hex: '#D4A85C', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  evaluation:  { label: 'Evaluación del desempeño',    shortLabel: 'Evaluación',   number: '9', hex: '#C06060', bg: 'bg-red-50 dark:bg-red-900/20' },
  improvement: { label: 'Mejora',                      shortLabel: 'Mejora',       number: '10', hex: '#C8860A', bg: 'bg-orange-50 dark:bg-orange-900/20' },
}

export const T12_CLAUSE_ORDER: T12Clause[] = [
  'context', 'leadership', 'planning', 'support', 'operation', 'evaluation', 'improvement',
]

// ── Config visual por estado ──────────────────────────────────

export const T12_STATUS_CONFIG: Record<T12Status, {
  label:     string
  badgeBg:   string
  badgeText: string
  hex:       string
  dot:       string
  next:      T12Status | null
  nextLabel: string | null
}> = {
  no_iniciado: {
    label:     'No iniciado',
    badgeBg:   'bg-gray-100 dark:bg-gray-800',
    badgeText: 'text-gray-500 dark:text-gray-400',
    hex:       '#94A3B8',
    dot:       '○',
    next:      'en_progreso',
    nextLabel: 'Marcar en progreso',
  },
  en_progreso: {
    label:     'En progreso',
    badgeBg:   'bg-warning-light dark:bg-yellow-900/20',
    badgeText: 'text-warning-dark dark:text-yellow-400',
    hex:       '#D4A85C',
    dot:       '◑',
    next:      'pendiente_revision',
    nextLabel: 'Enviar a revisión',
  },
  pendiente_revision: {
    label:     'Pendiente revisión',
    badgeBg:   'bg-blue-50 dark:bg-blue-900/20',
    badgeText: 'text-blue-600 dark:text-blue-400',
    hex:       '#6A90C0',
    dot:       '◎',
    next:      'aprobado',
    nextLabel: 'Aprobar control',
  },
  aprobado: {
    label:     'Aprobado',
    badgeBg:   'bg-success-light dark:bg-green-900/20',
    badgeText: 'text-success-dark dark:text-green-400',
    hex:       '#5FAF8A',
    dot:       '●',
    next:      null,
    nextLabel: null,
  },
}

// ── 25 controles ISO 42001 ────────────────────────────────────
// Cubre las cláusulas 4–10 con los controles operativamente
// más relevantes para empresas B2B medianas.

type ControlDef = Omit<T12Control, 'status' | 'importedFromT6' | 'evidence' | 'reviewNote'>

export const T12_BASE_CONTROLS: ControlDef[] = [

  // ── Cláusula 4 — Contexto (4 controles) ─────────────────────
  {
    id: '4.1', code: '4.1', clause: 'context', t6Ref: '4.1',
    title: 'Contexto organizacional de IA',
    description: 'La organización ha identificado los factores internos y externos relevantes para su uso de sistemas IA: estrategia corporativa, sector regulatorio, madurez tecnológica, capacidades internas y dependencias externas.',
  },
  {
    id: '4.2', code: '4.2', clause: 'context', t6Ref: '4.2',
    title: 'Partes interesadas en sistemas IA',
    description: 'Se han identificado las partes interesadas relevantes (empleados, clientes, reguladores, proveedores IA) y sus requisitos respecto a los sistemas IA de la organización.',
  },
  {
    id: '4.3', code: '4.3', clause: 'context',
    title: 'Alcance del sistema de gestión IA (AIMS)',
    description: 'La organización ha definido y documentado el alcance de su AI Management System: qué sistemas IA entran en el scope, qué unidades de negocio abarca y qué exclusiones aplican con su justificación.',
  },
  {
    id: '4.4', code: '4.4', clause: 'context',
    title: 'Sistema de gestión de IA (AIMS)',
    description: 'Se ha establecido, implementado y mantenido un sistema de gestión de IA coherente con los requisitos de ISO 42001, incluyendo procesos, responsables y mecanismos de revisión periódica.',
  },

  // ── Cláusula 5 — Liderazgo (3 controles) ────────────────────
  {
    id: '5.1', code: '5.1', clause: 'leadership', t6Ref: '5.1',
    title: 'Compromiso de la dirección con IA responsable',
    description: 'La alta dirección demuestra liderazgo y compromiso con el AIMS: asignación de recursos, comunicación de la importancia de la IA responsable y rendición de cuentas ante el consejo o equivalente.',
  },
  {
    id: '5.2', code: '5.2', clause: 'leadership', t6Ref: '5.2',
    title: 'Política corporativa de IA',
    description: 'Existe una política de IA aprobada por la dirección que establece el propósito, los principios de uso responsable, el marco de gobernanza y el compromiso con el cumplimiento regulatorio (AI Act, RGPD, ISO 42001).',
  },
  {
    id: '5.3', code: '5.3', clause: 'leadership', t6Ref: '5.3',
    title: 'Roles y responsabilidades de gobernanza IA',
    description: 'Se han definido, asignado y comunicado los roles y responsabilidades relacionados con la gobernanza IA: AI Owner, Data Steward, Compliance Officer, responsable de riesgos IA, etc.',
  },

  // ── Cláusula 6 — Planificación (3 controles) ─────────────────
  {
    id: '6.1', code: '6.1', clause: 'planning', t6Ref: '6.1',
    title: 'Gestión de riesgos y oportunidades IA',
    description: 'La organización ha identificado los riesgos y oportunidades asociados a sus sistemas IA y ha planificado acciones para abordarlos, incluyendo riesgos de sesgo, privacidad, transparencia y seguridad.',
  },
  {
    id: '6.1.2', code: '6.1.2', clause: 'planning', t6Ref: '6.1.2',
    title: 'Evaluación de riesgos regulatorios IA (AI Act)',
    description: 'Los sistemas IA han sido evaluados según el EU AI Act (Reglamento 2024/1689) y el RGPD. Cada sistema tiene documentado su nivel de riesgo y las medidas de mitigación y cumplimiento correspondientes.',
  },
  {
    id: '6.2', code: '6.2', clause: 'planning',
    title: 'Objetivos del sistema de gestión IA',
    description: 'La organización ha establecido objetivos medibles para su AIMS (adopción responsable, reducción de incidentes, cobertura de formación, etc.) con responsables, plazos y métodos de seguimiento definidos.',
  },

  // ── Cláusula 7 — Apoyo (5 controles) ─────────────────────────
  {
    id: '7.1', code: '7.1', clause: 'support',
    title: 'Recursos para el sistema de gestión IA',
    description: 'La organización ha determinado y proporcionado los recursos necesarios para establecer, implementar, mantener y mejorar el AIMS: presupuesto, herramientas, tiempo de personal y acceso a expertise externo.',
  },
  {
    id: '7.2', code: '7.2', clause: 'support', t6Ref: '7.2',
    title: 'Competencia y formación en IA del equipo',
    description: 'El personal que trabaja con sistemas IA tiene la formación y competencia necesaria. Se ha evaluado la brecha de habilidades y existen planes de capacitación implementados con seguimiento de resultados.',
  },
  {
    id: '7.3', code: '7.3', clause: 'support',
    title: 'Concienciación sobre IA responsable',
    description: 'El personal relevante conoce la política de IA de la organización, su contribución a la eficacia del AIMS y las implicaciones del incumplimiento. Existen programas de sensibilización activos.',
  },
  {
    id: '7.4', code: '7.4', clause: 'support',
    title: 'Comunicación interna y externa sobre IA',
    description: 'La organización ha definido qué comunicar sobre sus sistemas IA, a quién, cuándo y a través de qué canales — tanto internamente (empleados, dirección) como externamente (clientes, reguladores, medios).',
  },
  {
    id: '7.5', code: '7.5', clause: 'support', t6Ref: '7.5',
    title: 'Información documentada de sistemas IA',
    description: 'Se mantiene documentación actualizada de los sistemas IA en producción: catálogo, propósito, datos utilizados, responsable, nivel de riesgo, controles aplicados y versión del modelo.',
  },

  // ── Cláusula 8 — Operación (5 controles) ─────────────────────
  {
    id: '8.1', code: '8.1', clause: 'operation', t6Ref: '8.1',
    title: 'Planificación y control operacional de IA',
    description: 'Los procesos para desarrollar, desplegar y operar sistemas IA están planificados, implementados y controlados para cumplir los requisitos del AIMS y la política de IA corporativa.',
  },
  {
    id: '8.2', code: '8.2', clause: 'operation', t6Ref: '8.2',
    title: 'Tratamiento de riesgos IA',
    description: 'Se han implementado los controles seleccionados para tratar los riesgos identificados: supervisión humana, transparencia algorítmica, validación de datos, gestión de sesgos y planes de contingencia.',
  },
  {
    id: '8.3', code: '8.3', clause: 'operation',
    title: 'Evaluación de impacto en sistemas IA',
    description: 'Antes de desplegar sistemas IA de alto riesgo, se realiza una evaluación de impacto (privacy impact, fairness assessment) que documenta los riesgos residuales y las medidas de mitigación adoptadas.',
  },
  {
    id: '8.4', code: '8.4', clause: 'operation', t6Ref: '8.4',
    title: 'Gestión del ciclo de vida de sistemas IA',
    description: 'La organización gestiona el ciclo de vida de sus sistemas IA (diseño, desarrollo, despliegue, monitorización y retirada) siguiendo criterios documentados y con revisiones formales en cada fase.',
  },
  {
    id: '8.5', code: '8.5', clause: 'operation',
    title: 'Gobernanza de datos para sistemas IA',
    description: 'Los datos utilizados para entrenar, validar y operar sistemas IA están identificados, documentados y gestionados con criterios de calidad, linaje, privacidad y control de sesgo.',
  },

  // ── Cláusula 9 — Evaluación del desempeño (3 controles) ──────
  {
    id: '9.1', code: '9.1', clause: 'evaluation', t6Ref: '9.1',
    title: 'Seguimiento y medición del rendimiento IA',
    description: 'Se monitoriza y mide el rendimiento, la precisión y el impacto de los sistemas IA en producción. Existen KPIs definidos (precisión, drift, incidentes, tiempo de respuesta) revisados con periodicidad definida.',
  },
  {
    id: '9.2', code: '9.2', clause: 'evaluation',
    title: 'Auditoría interna del AIMS',
    description: 'Se realizan auditorías internas periódicas del sistema de gestión de IA para verificar que cumple los requisitos de ISO 42001 y los propios de la organización. Existe un programa de auditoría con hallazgos registrados.',
  },
  {
    id: '9.3', code: '9.3', clause: 'evaluation',
    title: 'Revisión del AIMS por la dirección',
    description: 'La alta dirección revisa periódicamente el AIMS para asegurar su idoneidad, adecuación y eficacia continua. Las revisiones consideran resultados de auditorías, incidentes, cambios regulatorios y oportunidades de mejora.',
  },

  // ── Cláusula 10 — Mejora (2 controles) ───────────────────────
  {
    id: '10.1', code: '10.1', clause: 'improvement', t6Ref: '10.1',
    title: 'Mejora continua del sistema de gestión IA',
    description: 'La organización mejora continuamente la idoneidad, adecuación y eficacia de su AIMS, incorporando lecciones aprendidas, cambios regulatorios (AI Act updates, nuevas directrices ISO) y resultados de auditorías.',
  },
  {
    id: '10.2', code: '10.2', clause: 'improvement',
    title: 'No conformidades y acciones correctivas',
    description: 'Cuando se producen no conformidades en el AIMS, la organización reacciona de forma controlada, investiga la causa raíz, implementa acciones correctivas y verifica su eficacia antes de cerrar el hallazgo.',
  },
]
