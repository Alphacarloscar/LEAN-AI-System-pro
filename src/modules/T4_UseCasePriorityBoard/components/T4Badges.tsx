import { Badge } from '@/shared/design-system/components'
import { STATUS_CONFIG, AI_CATEGORY_LABELS } from '../constants'
import type { UseCaseStatus } from '../types'
import type { BadgeVariant } from '@/shared/design-system/components'
import { DOMAIN_ICONS, DOMAIN_LABELS, type DomainIconCode } from '@shared/design-system/charts/domainIcons'

// ── Mapeo de estado T4 → variant de Badge ─────────────────────
// Los colores en STATUS_CONFIG usan los mismos tokens semánticos
// que Badge internamente (success-light/dark, warning-light/dark, etc.)
const STATUS_VARIANT: Record<UseCaseStatus, BadgeVariant> = {
  go:         'success',
  en_piloto:  'warning',
  priorizado: 'info',
  candidato:  'default',
  no_go:      'danger',
  completado: 'navy',
}

// ─────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: UseCaseStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} shape="pill" size="xs">
      {STATUS_CONFIG[status].label}
    </Badge>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  const icon  = DOMAIN_ICONS[category as DomainIconCode]
  const label = DOMAIN_LABELS[category as DomainIconCode] ?? AI_CATEGORY_LABELS[category] ?? category
  return (
    <Badge shape="pill" size="xs" className="gap-1 bg-warm-100 dark:bg-warm-700 text-warm-700 dark:text-warm-200 border-0">
      <span className="text-warm-600 dark:text-warm-300 shrink-0">{icon}</span>
      {label}
    </Badge>
  )
}

