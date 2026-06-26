// ============================================================
// T2 — UI Badge components: ArchetypeDot, ArchetypeBadge,
//      ResistanceBadge
// ============================================================

import { Badge, type BadgeVariant } from '@shared/design-system/components'
import { ARCHETYPE_CONFIG } from '../constants'
import type { ArchetypeCode, ResistanceLevel } from '../types'
import { useIsDark } from '@/shared/hooks/useDarkMode'

// ── Mapeo de dominio T2 → variant de Badge ────────────────────
// Los colores semánticos en ARCHETYPE_CONFIG coinciden con los tokens
// de Badge internamente (success-light/dark, info-light/dark, etc.).
const ARCHETYPE_VARIANT: Record<ArchetypeCode, BadgeVariant> = {
  adoptador:  'success',
  ambassador: 'info',
  decisor:    'default',  // inline style handles navy color + contrast text (see below)
  critico:    'danger',
  reticente:  'warning',
}

const RESISTANCE_VARIANT: Record<ResistanceLevel, BadgeVariant> = {
  baja:  'success',
  media: 'warning',
  alta:  'danger',
}

const DECISOR_STYLE_LIGHT: React.CSSProperties = { backgroundColor: '#2A2822', color: '#F0EDE8' }
const DECISOR_STYLE_DARK:  React.CSSProperties = { backgroundColor: 'rgba(200,134,10,0.20)', color: '#C8860A' }

// ─────────────────────────────────────────────────────────────

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
  const isDark  = useIsDark()
  const cfg     = ARCHETYPE_CONFIG[archetype]
  const variant = ARCHETYPE_VARIANT[archetype] ?? 'default'
  return (
    <Badge
      variant={variant}
      shape="pill"
      size="xs"
      style={archetype === 'decisor' ? (isDark ? DECISOR_STYLE_DARK : DECISOR_STYLE_LIGHT) : undefined}
    >
      {cfg.label}
    </Badge>
  )
}

export function ResistanceBadge({ resistance }: { resistance: ResistanceLevel }) {
  const symbol = resistance === 'alta' ? '▲ ' : resistance === 'media' ? '◆ ' : '● '
  return (
    <Badge variant={RESISTANCE_VARIANT[resistance]} shape="pill" size="xs">
      {symbol}{resistance.charAt(0).toUpperCase() + resistance.slice(1)}
    </Badge>
  )
}
