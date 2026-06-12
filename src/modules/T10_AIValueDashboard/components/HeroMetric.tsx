// HeroMetric — componente único para la métrica destacada de cada tarjeta
//
// label:      texto en mayúsculas (MADUREZ IA, INVERSIÓN TOTAL…)
// value:      dato limpio (1.6, €259K, 38%…)
// colorScore: 0-100 → semáforo rojo/naranja/verde
//             undefined → gold neutro (para valores absolutos)

function heroColor(score?: number): string {
  if (score == null) return '#C8860A'   // gold neutro
  if (score < 30)   return '#C05035'   // rojo
  if (score < 60)   return '#C8860A'   // naranja/amber
  return '#2A7A52'                     // verde
}

export function HeroMetric({ label, value, colorScore }: {
  label:       string
  value:       string
  colorScore?: number   // 0-100, o undefined para neutro
}) {
  const color = heroColor(colorScore)
  return (
    <div className="flex-shrink-0 text-right">
      <p className="text-[9px] font-mono uppercase tracking-wider text-text-muted dark:text-warm-300 leading-tight mb-0.5">
        {label}
      </p>
      <p className="text-[1.6rem] font-semibold tabular-nums leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
