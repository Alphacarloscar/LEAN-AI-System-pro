import { GO_NOGO_THRESHOLDS } from '../constants'

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
