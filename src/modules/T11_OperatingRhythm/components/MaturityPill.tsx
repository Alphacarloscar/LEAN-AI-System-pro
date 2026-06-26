// MaturityPill — indicador visual de nivel de madurez con estrellas

import { T11_MATURITY_CONFIG } from '../constants'
import type { T11MaturityTier } from '../types'

export function MaturityPill({ tier, avg }: { tier: T11MaturityTier; avg: number }) {
  const cfg = T11_MATURITY_CONFIG[tier]
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className="h-2 w-5 rounded-sm transition-all"
            style={{ backgroundColor: s <= cfg.stars ? cfg.hex : '#D4D0C8' }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: cfg.hex }}>
        {cfg.label}
      </span>
      <span className="text-[10px] text-text-subtle">({avg.toFixed(1)}/4)</span>
    </div>
  )
}
