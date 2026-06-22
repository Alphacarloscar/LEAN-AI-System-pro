import { getHeroColor } from '@shared/design-system/charts/chartTokens'

export function HeroMetric({ label, value, colorScore }: {
  label:       string
  value:       string
  colorScore?: number   // 0-100, o undefined para neutro
}) {
  const color = getHeroColor(colorScore)
  return (
    <div className="flex-shrink-0 text-right">
      <p className="text-xs font-mono uppercase tracking-wider text-text-muted dark:text-warm-300 leading-tight mb-0.5">
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
