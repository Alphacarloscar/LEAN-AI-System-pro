import { DIMENSION_CONFIG } from '../constants'
import type { UseCaseScores } from '../types'

const T4_SCORE_BARS = [
  { key: 'kpiImpact',      cfg: DIMENSION_CONFIG.kpiImpact },
  { key: 'feasibility',    cfg: DIMENSION_CONFIG.feasibility },
  { key: 'aiRisk',         cfg: DIMENSION_CONFIG.aiRisk },
  { key: 'dataDependency', cfg: DIMENSION_CONFIG.dataDependency },
] as const

export function T4ScoreBars({ scores }: { scores: UseCaseScores }) {
  return (
    <div className="flex flex-col gap-4">
      {T4_SCORE_BARS.map(({ key, cfg }) => {
        const val    = scores[key as keyof UseCaseScores]
        const lblIdx = Math.min(4, Math.floor(val / 20))
        const isNeg  = cfg.direction === 'negative'

        return (
          <div key={key} className="flex items-center gap-4">
            <div className="w-44 shrink-0">
              <p className="text-[11px] font-semibold text-lean-black dark:text-gray-200 leading-tight">
                {cfg.label}
              </p>
              <p className="text-[10px] text-text-subtle mt-0.5">
                {cfg.scaleLabels[lblIdx]}{isNeg ? ' ↑ riesgo' : ''}
              </p>
            </div>
            <div className="flex-1 h-2 rounded-full bg-warm-100 dark:bg-warm-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${val}%`, backgroundColor: cfg.hex, opacity: 0.85 }}
              />
            </div>
            <div className="shrink-0 w-14 text-right">
              <span className="text-xs font-bold tabular-nums text-lean-black dark:text-gray-200">
                {val}
              </span>
              <span className="text-[10px] text-text-subtle">/100</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ScoreInput({
  label,
  description,
  value,
  onChange,
  isNegative,
  hex,
}: {
  label:        string
  description?: string
  value:        number
  onChange:     (v: number) => void
  isNegative?:  boolean
  hex?:         string
}) {
  const barColor = hex ?? '#6A90C0'
  const pct      = value

  const cfg        = Object.values(DIMENSION_CONFIG).find((d) => d.label === label)
  const lblIdx     = Math.min(4, Math.floor(value / 20))
  const valueLabel = cfg?.scaleLabels[lblIdx] ?? String(value)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-lean-black dark:text-gray-200">{label}</p>
          {description && (
            <p className="text-[10px] text-text-subtle leading-snug">{description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="text-sm font-bold tabular-nums text-lean-black dark:text-gray-200">
            {value}
          </span>
          <span className="text-[10px] text-text-subtle ml-0.5">/100</span>
          <p className="text-[9px] text-text-subtle" style={{ color: barColor }}>
            {valueLabel}{isNegative ? ' ↑' : ''}
          </p>
        </div>
      </div>

      <div className="relative h-5 flex items-center">
        <div className="w-full h-1.5 rounded-full bg-warm-100 dark:bg-warm-700 relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
            style={{ width: `${pct}%`, backgroundColor: barColor, opacity: 0.7 }}
          />
        </div>
        <input
          type="range"
          min={0} max={100} step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 1 }}
        />
        <div
          className="absolute h-4 w-4 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)`, top: '2px', backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}
