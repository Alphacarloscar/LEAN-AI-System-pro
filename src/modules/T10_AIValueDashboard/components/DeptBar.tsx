export function DeptBar({ label, innovadores, early, rezagados, total, colors }: {
  label:       string
  innovadores: number
  early:       number
  rezagados:   number
  total:       number
  colors:      [string, string, string]
}) {
  const pI = (innovadores / total) * 100
  const pE = (early       / total) * 100
  const pR = (rezagados   / total) * 100
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[9px] text-text-muted dark:text-warm-300 w-20 flex-shrink-0 truncate">{label}</span>
      <div className="flex flex-1 h-[6px] rounded-full overflow-hidden gap-px">
        <div style={{ width: `${pI}%`, backgroundColor: colors[0] }} />
        <div style={{ width: `${pE}%`, backgroundColor: colors[1] }} />
        <div style={{ width: `${pR}%`, backgroundColor: colors[2] }} />
      </div>
      <span className="text-[9px] text-text-muted dark:text-warm-300 w-4 text-right">{total}</span>
    </div>
  )
}
