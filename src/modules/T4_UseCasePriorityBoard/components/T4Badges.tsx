import { GO_NOGO_THRESHOLDS, STATUS_CONFIG, AI_CATEGORY_LABELS, AI_CATEGORY_HEX } from '../constants'
import type { UseCaseStatus } from '../types'

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

export function StatusBadge({ status }: { status: UseCaseStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  const label = AI_CATEGORY_LABELS[category] ?? category
  const hex   = AI_CATEGORY_HEX[category]    ?? '#94A3B8'
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: `${hex}22`, color: hex }}
    >
      {label.split(' ')[0]}
    </span>
  )
}
