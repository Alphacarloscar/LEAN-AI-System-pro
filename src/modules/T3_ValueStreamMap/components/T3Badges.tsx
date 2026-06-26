import { Badge, type BadgeVariant } from '@shared/design-system/components'
import { AI_CATEGORY_CONFIG, PHASE_CONFIG } from '../constants'
import type { AICategoryCode, OrgReadinessLevel, ProcessPhase } from '../types'
import { useIsDark } from '@/shared/hooks/useDarkMode'
import { DOMAIN_ICONS, DOMAIN_LABELS, type DomainIconCode } from '@shared/design-system/charts/domainIcons'

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

const ESCALADO_STYLE_LIGHT: React.CSSProperties = { backgroundColor: 'rgba(42,40,34,0.1)',    color: '#2A2822' }
const ESCALADO_STYLE_DARK:  React.CSSProperties = { backgroundColor: 'rgba(240,237,232,0.12)', color: '#C4C0B8' }

// ─────────────────────────────────────────────────────────────

export function CategoryBadge({ category }: { category: AICategoryCode }) {
  const icon  = DOMAIN_ICONS[category as DomainIconCode]
  const label = DOMAIN_LABELS[category as DomainIconCode] ?? AI_CATEGORY_CONFIG[category]?.label ?? category
  return (
    <Badge shape="pill" size="xs" className="gap-1 bg-warm-100 dark:bg-warm-700 text-warm-700 dark:text-warm-200 border-0">
      <span className="text-warm-600 dark:text-warm-300 shrink-0">{icon}</span>
      {label}
    </Badge>
  )
}

export function CategoryIcon({ category }: { category: AICategoryCode }) {
  const icon  = DOMAIN_ICONS[category as DomainIconCode]
  const label = DOMAIN_LABELS[category as DomainIconCode] ?? AI_CATEGORY_CONFIG[category]?.label ?? category
  return (
    <span
      title={label}
      className="inline-flex items-center justify-center w-5 h-5 rounded-full
        bg-warm-100 dark:bg-warm-700 text-warm-600 dark:text-warm-300"
    >
      {icon}
    </span>
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
  const isDark = useIsDark()
  const cfg = PHASE_CONFIG[phase]
  return (
    <Badge
      variant={PHASE_VARIANT[phase]}
      shape="pill"
      size="xs"
      style={phase === 'escalado' ? (isDark ? ESCALADO_STYLE_DARK : ESCALADO_STYLE_LIGHT) : undefined}
    >
      {cfg.label}
    </Badge>
  )
}
