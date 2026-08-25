// ============================================================
// T5 — MaturityBadge
// ============================================================

import { Badge } from '@shared/design-system/components'
import { T5_MATURITY_CONFIG } from '../constants'

export function MaturityBadge({ level }: { level: string }) {
  const cfg = T5_MATURITY_CONFIG[level as keyof typeof T5_MATURITY_CONFIG] ?? T5_MATURITY_CONFIG.inicial
  return (
    <Badge
      shape="pill"
      size="sm"
      style={{ backgroundColor: `${cfg.hex}22`, color: cfg.hex }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.hex }} aria-hidden="true" />
      {/* TODO: domain-specific prefix — parametrize when second domain is implemented */}
      AI Maturity: {cfg.label}
    </Badge>
  )
}
