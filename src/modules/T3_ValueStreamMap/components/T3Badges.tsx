import { Badge, type BadgeVariant } from '@shared/design-system/components'
import { AI_CATEGORY_CONFIG, PHASE_CONFIG } from '../constants'
import type { AICategoryCode, OrgReadinessLevel, ProcessPhase } from '../types'
import { CAT_HEX } from './T3Badges.constants'

// ── Mapeos de dominio T3 → variant de Badge ───────────────────

const READINESS_VARIANT: Record<OrgReadinessLevel, BadgeVariant> = {
  alta:  'success',
  media: 'warning',
  baja:  'danger',
}

const PHASE_VARIANT: Record<ProcessPhase, BadgeVariant> = {
  idea:            'default',
  validacion:      'warning',
  piloto:          'info',
  estandarizacion: 'success',
  escalado:        'default',  // inline style below — misma razón que T2 decisor
}

// escalado: bg-navy/10 text-navy — requiere inline style (background-image conflict en variant navy).
const ESCALADO_STYLE: React.CSSProperties = { backgroundColor: 'rgba(42,40,34,0.1)', color: '#2A2822' }

// ─────────────────────────────────────────────────────────────

export function CategoryBadge({ category }: { category: AICategoryCode }) {
  const hex = CAT_HEX[category]
  return (
    <Badge
      shape="pill"
      size="xs"
      style={{ backgroundColor: `${hex}22`, color: hex }}
    >
      {AI_CATEGORY_CONFIG[category].label}
    </Badge>
  )
}

export function ReadinessBadge({ level }: { level: OrgReadinessLevel }) {
  const symbol = level === 'alta' ? '● ' : level === 'media' ? '◆ ' : '▲ '
  return (
    <Badge variant={READINESS_VARIANT[level]} shape="pill" size="xs">
      {symbol}{level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  )
}

export function PhaseBadge({ phase }: { phase: ProcessPhase }) {
  const cfg = PHASE_CONFIG[phase]
  return (
    <Badge
      variant={PHASE_VARIANT[phase]}
      shape="pill"
      size="xs"
      style={phase === 'escalado' ? ESCALADO_STYLE : undefined}
    >
      {cfg.label}
    </Badge>
  )
}
