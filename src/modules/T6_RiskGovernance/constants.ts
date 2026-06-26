// ============================================================
// T6 — Constantes: ISO 42001 controls + AI Act visual config
// ============================================================

import type { ISO42001Control, ISO42001Clause } from './types'
import type { AIActRiskLevel } from '@/modules/T4_UseCasePriorityBoard/types'

// ── Config visual AI Act ──────────────────────────────────────

export const AIACT_RISK_CONFIG: Record<AIActRiskLevel, {
  label:      string
  shortLabel: string
  badgeBg:    string
  badgeText:  string
  hex:        string
  icon:       string
  description: string
}> = {
  prohibido: {
    label:       'Prohibido',
    shortLabel:  'Prohibido',
    badgeBg:     'bg-danger-light dark:bg-danger/20',
    badgeText:   'text-danger-dark dark:text-danger',
    hex:         '#C06060',
    icon:        'ban',
    description: 'Sistema potencialmente en categoría prohibida (Art. 5 AI Act). Requiere revisión legal inmediata antes de cualquier desarrollo o despliegue.',
  },
  alto: {
    label:       'Alto riesgo',
    shortLabel:  'Alto',
    badgeBg:     'bg-danger-light dark:bg-danger/20',
    badgeText:   'text-danger-dark dark:text-danger',
    hex:         '#C06060',
    icon:        'alert-circle',
    description: 'Sistema de alto riesgo según Annex III del AI Act. Requiere evaluación de conformidad, documentación de riesgos y supervisión humana antes del despliegue (obligatorio antes de agosto 2026).',
  },
  limitado: {
    label:       'Riesgo limitado',
    shortLabel:  'Limitado',
    badgeBg:     'bg-warning-light dark:bg-warning/20',
    badgeText:   'text-warning-dark dark:text-warning',
    hex:         '#D4A85C',
    icon:        'alert-triangle',
    description: 'Obligaciones de transparencia (Art. 50). Los usuarios deben saber que interactúan con IA. Requisitos menores de documentación.',
  },
  minimo: {
    label:       'Riesgo mínimo',
    shortLabel:  'Mínimo',
    badgeBg:     'bg-success-light dark:bg-success/20',
    badgeText:   'text-success-dark dark:text-success',
    hex:         '#5FAF8A',
    icon:        'check-circle',
    description: 'Sin requisitos regulatorios específicos del AI Act. Recomendado documentar en el catálogo corporativo de IA como buena práctica de gobernanza.',
  },
  sin_clasificar: {
    label:       'Sin clasificar',
    shortLabel:  'Pendiente',
    badgeBg:     'bg-warm-100 dark:bg-warm-700',
    badgeText:   'text-warm-500 dark:text-warm-300',
    hex:         '#9A9790',
    icon:        'circle',
    description: 'Pendiente de clasificación. Completa el cuestionario AI Act en la tab Regulatorio de cada caso de uso en T4.',
  },
}

// ── Config visual ISO 42001 cláusulas ────────────────────────

export const ISO42001_CLAUSE_CONFIG: Record<ISO42001Clause, { label: string; hex: string }> = {
  context:     { label: 'Cláusula 4 — Contexto',           hex: '#6B6864' },
  leadership:  { label: 'Cláusula 5 — Liderazgo',          hex: '#6B6864' },
  planning:    { label: 'Cláusula 6 — Planificación',       hex: '#6B6864' },
  support:     { label: 'Cláusula 7 — Apoyo',               hex: '#6B6864' },
  operation:   { label: 'Cláusula 8 — Operación',           hex: '#6B6864' },
  evaluation:  { label: 'Cláusula 9 — Evaluación',          hex: '#6B6864' },
  improvement: { label: 'Cláusula 10 — Mejora',             hex: '#6B6864' },
}

export const ISO42001_STATUS_CONFIG = {
  no_iniciado:  { label: 'No iniciado',  badgeBg: 'bg-warm-100 dark:bg-warm-700',          badgeText: 'text-warm-500',     hex: '#9A9790', dot: '○' },
  en_progreso:  { label: 'En progreso',  badgeBg: 'bg-warning-light dark:bg-warning/20',   badgeText: 'text-warning-dark', hex: '#D4A85C', dot: '◑' },
  implementado: { label: 'Implementado', badgeBg: 'bg-success-light dark:bg-success/20',   badgeText: 'text-success-dark', hex: '#5FAF8A', dot: '●' },
} as const

// ── 14 controles ISO 42001 para MVP ──────────────────────────
// Seleccionados de las cláusulas principales para ser completables
// en un taller de diagnóstico de 2-3 horas con el cliente.
// Sprint 3+: ampliar al catálogo completo de ~40 controles.

export const ISO42001_BASE_CONTROLS: Omit<ISO42001Control, 'status' | 'autoInferred' | 'notes'>[] = [
  // ── Cláusula 4 — Contexto ──────────────────────────────────
  {
    id:          '4.1',
    code:        '4.1',
    clause:      'context',
    title:       'Contexto organizacional de IA',
    description: 'La organización ha identificado los factores internos y externos relevantes para su uso de sistemas IA (estrategia, sector regulatorio, madurez tecnológica).',
  },
  {
    id:          '4.2',
    code:        '4.2',
    clause:      'context',
    title:       'Partes interesadas en IA',
    description: 'Se han identificado las partes interesadas relevantes (empleados, clientes, reguladores) y sus requisitos respecto a los sistemas IA de la organización.',
  },

  // ── Cláusula 5 — Liderazgo ─────────────────────────────────
  {
    id:          '5.1',
    code:        '5.1',
    clause:      'leadership',
    title:       'Compromiso de la dirección con IA responsable',
    description: 'La alta dirección demuestra liderazgo y compromiso con el sistema de gestión de IA: asignación de recursos, comunicación de la importancia y rendición de cuentas.',
  },
  {
    id:          '5.2',
    code:        '5.2',
    clause:      'leadership',
    title:       'Política de IA corporativa',
    description: 'Existe una política de IA aprobada por la dirección que establece el propósito, los principios de uso responsable y el marco de gobernanza de los sistemas IA.',
  },
  {
    id:          '5.3',
    code:        '5.3',
    clause:      'leadership',
    title:       'Roles y responsabilidades de IA',
    description: 'Se han definido y comunicado los roles y responsabilidades relacionados con la gobernanza IA (AI Owner, Data Steward, compliance officer, etc.).',
  },

  // ── Cláusula 6 — Planificación ─────────────────────────────
  {
    id:          '6.1',
    code:        '6.1',
    clause:      'planning',
    title:       'Gestión de riesgos y oportunidades IA',
    description: 'La organización ha identificado los riesgos y oportunidades asociados a sus sistemas IA y ha planificado acciones para abordarlos.',
  },
  {
    id:          '6.1.2',
    code:        '6.1.2',
    clause:      'planning',
    title:       'Evaluación de riesgos regulatorios IA (AI Act)',
    description: 'Los sistemas IA han sido evaluados según el EU AI Act y el RGPD. Se ha documentado el nivel de riesgo de cada sistema y las medidas de mitigación correspondientes.',
  },

  // ── Cláusula 7 — Apoyo ─────────────────────────────────────
  {
    id:          '7.2',
    code:        '7.2',
    clause:      'support',
    title:       'Competencia en IA del equipo',
    description: 'El personal que trabaja con sistemas IA tiene la formación y competencia necesaria. Se ha evaluado la brecha de habilidades y se han planificado acciones de capacitación.',
  },
  {
    id:          '7.5',
    code:        '7.5',
    clause:      'support',
    title:       'Información documentada de IA',
    description: 'Se mantiene documentación actualizada de los sistemas IA: catálogo, propósito, datos utilizados, responsable, nivel de riesgo y controles aplicados.',
  },

  // ── Cláusula 8 — Operación ─────────────────────────────────
  {
    id:          '8.1',
    code:        '8.1',
    clause:      'operation',
    title:       'Planificación y control operacional de IA',
    description: 'Los procesos para desarrollar, desplegar y operar sistemas IA están planificados, implementados y controlados para cumplir los requisitos de la política de IA.',
  },
  {
    id:          '8.2',
    code:        '8.2',
    clause:      'operation',
    title:       'Tratamiento de riesgos IA',
    description: 'Se han implementado los controles seleccionados para tratar los riesgos identificados en la evaluación (supervisión humana, transparencia, validación de datos, etc.).',
  },
  {
    id:          '8.4',
    code:        '8.4',
    clause:      'operation',
    title:       'Ciclo de vida de sistemas IA',
    description: 'La organización gestiona el ciclo de vida de sus sistemas IA (diseño, desarrollo, despliegue, monitorización y retirada) siguiendo criterios documentados.',
  },

  // ── Cláusula 9 — Evaluación ────────────────────────────────
  {
    id:          '9.1',
    code:        '9.1',
    clause:      'evaluation',
    title:       'Seguimiento y medición del rendimiento IA',
    description: 'Se monitoriza y mide el rendimiento, la precisión y el impacto de los sistemas IA en producción. Existen KPIs definidos y revisados periódicamente.',
  },

  // ── Cláusula 10 — Mejora ───────────────────────────────────
  {
    id:          '10.1',
    code:        '10.1',
    clause:      'improvement',
    title:       'Mejora continua del sistema de gestión IA',
    description: 'La organización mejora continuamente la idoneidad, adecuación y eficacia de su sistema de gestión de IA, incorporando lecciones aprendidas y cambios regulatorios.',
  },
]
