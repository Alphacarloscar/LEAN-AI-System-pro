// ============================================================
// T2 — UI Badge components: ArchetypeDot, ArchetypeBadge,
//      ResistanceBadge
// ============================================================

import { ARCHETYPE_CONFIG, RESISTANCE_CONFIG } from '../constants'
import type { ArchetypeCode, ResistanceLevel } from '../types'

export function ArchetypeDot({
  archetype,
  size = 'sm',
}: {
  archetype: ArchetypeCode
  size?: 'sm' | 'md'
}) {
  const cfg = ARCHETYPE_CONFIG[archetype]
  const s   = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
  return <span className={`${s} rounded-full ${cfg.dotBg} shrink-0`} />
}

export function ArchetypeBadge({ archetype }: { archetype: ArchetypeCode }) {
  const cfg = ARCHETYPE_CONFIG[archetype]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  )
}

export function ResistanceBadge({ resistance }: { resistance: ResistanceLevel }) {
  const cfg = RESISTANCE_CONFIG[resistance]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {resistance === 'alta' ? '▲ ' : resistance === 'media' ? '◆ ' : '● '}
      {resistance.charAt(0).toUpperCase() + resistance.slice(1)}
    </span>
  )
}
