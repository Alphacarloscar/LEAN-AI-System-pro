// ============================================================
// T2 — UI Badge components: ArchetypeDot, ArchetypeBadge,
//      ResistanceBadge
// ============================================================

import { Badge, type BadgeVariant } from '@shared/design-system/components'
import { ARCHETYPE_CONFIG } from '../constants'
import type { ArchetypeCode, ResistanceLevel } from '../types'

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

// decisor: data-driven bg + text explícito (mismo patrón que CategoryBadge / IT-Negocio).
// bg-navy-metallic es un background-image gradient — no sobrescribible via bg-*/className.
// Inline style garantiza bg sólido + texto claro con ratio de contraste ≈ 12.8:1 (WCAG AAA).
const DECISOR_STYLE: React.CSSProperties = { backgroundColor: '#2A2822', color: '#F0EDE8' }

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
  const cfg     = ARCHETYPE_CONFIG[archetype]
  const variant = ARCHETYPE_VARIANT[archetype] ?? 'default'
  return (
    <Badge
      variant={variant}
      shape="pill"
      size="xs"
      style={archetype === 'decisor' ? DECISOR_STYLE : undefined}
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
