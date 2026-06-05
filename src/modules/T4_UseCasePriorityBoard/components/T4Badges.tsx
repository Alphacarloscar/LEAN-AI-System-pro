import { Badge } from '@/shared/design-system/components'
import { GO_NOGO_THRESHOLDS, STATUS_CONFIG, AI_CATEGORY_LABELS, AI_CATEGORY_HEX } from '../constants'
import type { UseCaseStatus } from '../types'
import type { BadgeVariant } from '@/shared/design-system/components'

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
  const label = AI_CATEGORY_LABELS[category] ?? category
  const hex   = AI_CATEGORY_HEX[category]    ?? '#94A3B8'
  // Los hexes de categoría son arbitrarios (incluye #7C3AED para agéntica),
  // sin equivalente en BadgeVariant. style= tiene precedencia sobre Tailwind.
  return (
    <Badge
      shape="pill"
      size="xs"
      style={{ backgroundColor: `${hex}22`, color: hex }}
    >
      {label.split(' ')[0]}
    </Badge>
  )
}

// ── Utilidades de dominio T4 ──────────────────────────────────

export function priorityScoreColor(score: number): string {
  if (score >= GO_NOGO_THRESHOLDS.go)      return 'text-success-dark'
  if (score >= GO_NOGO_THRESHOLDS.pending) return 'text-warning-dark'
  return 'text-danger-dark'
}

export function fmtEur(n: number): string {
  const abs  = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${sign}€${Math.round(abs / 1_000)}k`
  return `${sign}€${Math.round(abs)}`
}
