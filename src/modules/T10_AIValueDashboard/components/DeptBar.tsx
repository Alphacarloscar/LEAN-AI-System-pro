// DeptBar — barra de departamento para adopción
// Colores: gold (innovadores) · warm-500 (early majority) · warm-200 (rezagados)

export function DeptBar({ label, innovadores, early, rezagados, total }: {
  label:       string
  innovadores: number
  early:       number
  rezagados:   number
  total:       number
}) {
  const pI = (innovadores / total) * 100
  const pE = (early       / total) * 100
  const pR = (rezagados   / total) * 100
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[9px] text-text-muted dark:text-warm-300 w-20 flex-shrink-0 truncate">{label}</span>
      <div className="flex flex-1 h-[6px] rounded-full overflow-hidden gap-px">
        <div className="bg-gold"     style={{ width: `${pI}%` }} />
        <div className="bg-warm-500" style={{ width: `${pE}%` }} />
        <div className="bg-warm-200" style={{ width: `${pR}%` }} />
      </div>
      <span className="text-[9px] text-text-muted dark:text-warm-300 w-4 text-right">{total}</span>
    </div>
  )
}
