// ============================================================
// T5 — MaturityBadge
// ============================================================

import { T5_MATURITY_CONFIG } from '../constants'

export function MaturityBadge({ level }: { level: string }) {
  const cfg = T5_MATURITY_CONFIG[level as keyof typeof T5_MATURITY_CONFIG] ?? T5_MATURITY_CONFIG.inicial
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.hex }} />
      AI Maturity: {cfg.label}
    </span>
  )
}
