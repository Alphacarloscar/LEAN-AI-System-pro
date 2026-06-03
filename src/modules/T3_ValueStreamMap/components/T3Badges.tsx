import { AI_CATEGORY_CONFIG, READINESS_CONFIG, PHASE_CONFIG } from '../constants'
import type { AICategoryCode, OrgReadinessLevel, ProcessPhase } from '../types'

export const CAT_HEX: Record<AICategoryCode, string> = {
  automatizacion_inteligente: '#6A90C0',
  automatizacion_rpa:         '#5FAF8A',
  analitica_predictiva:       '#2A2822',
  asistente_ia:               '#D4A85C',
  optimizacion_proceso:       '#C06060',
  agéntica:                   '#7C3AED',
}

export const CAT_ORDER: AICategoryCode[] = [
  'automatizacion_inteligente',
  'automatizacion_rpa',
  'analitica_predictiva',
  'asistente_ia',
  'optimizacion_proceso',
  'agéntica',
]

export function CategoryBadge({ category }: { category: AICategoryCode }) {
  const cfg = AI_CATEGORY_CONFIG[category]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  )
}

export function ReadinessBadge({ level }: { level: OrgReadinessLevel }) {
  const cfg = READINESS_CONFIG[level]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {level === 'alta' ? '● ' : level === 'media' ? '◆ ' : '▲ '}
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  )
}

export function PhaseBadge({ phase }: { phase: ProcessPhase }) {
  const cfg = PHASE_CONFIG[phase]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  )
}
