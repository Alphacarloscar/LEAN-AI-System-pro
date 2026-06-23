// ============================================================
// T5 — T5DimBars
//
// Barras de progreso para las dimensiones de evaluación
// de un dominio IA.
// ============================================================

import { T5_DIMENSION_CONFIG } from '../constants'
import type { T5DomainScores } from '../types'

export function T5DimBars({ scores }: { scores: T5DomainScores }) {
  return (
    <div className="flex flex-col gap-3">
      {(Object.entries(T5_DIMENSION_CONFIG) as Array<[keyof T5DomainScores, (typeof T5_DIMENSION_CONFIG)[keyof T5DomainScores]]>).map(([key, cfg]) => {
        const val    = scores[key]
        const lblIdx = Math.min(4, Math.floor(val / 20))
        const isNeg  = cfg.direction === 'negative'
        return (
          <div key={key} className="flex items-center gap-3">
            <div className="w-36 shrink-0">
              <p className="text-[10px] font-semibold text-lean-black dark:text-warm-200 leading-tight">
                {cfg.label}
              </p>
              <p className="text-[9px] text-text-subtle mt-0.5">
                {cfg.scaleLabels[lblIdx]}{isNeg ? ' ↑ riesgo' : ''}
              </p>
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-warm-100 dark:bg-warm-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${val}%`, backgroundColor: cfg.hex, opacity: 0.85 }}
              />
            </div>
            <div className="shrink-0 w-8 text-right">
              <span className="text-[10px] font-bold tabular-nums text-lean-black dark:text-warm-200">{val}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
