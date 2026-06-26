// DimBar — barra horizontal de dimensión

export function DimBar({ label, value, max, color, showValue = false }: {
  label: string; value: number; max: number; color: string; showValue?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted dark:text-warm-300 w-[76px] flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-[5px] rounded-full bg-warm-200 dark:bg-warm-600/30">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: color }} />
      </div>
      {showValue && (
        <span className="text-xs text-text-muted dark:text-warm-300 w-6 text-right tabular-nums">{value.toFixed(1)}</span>
      )}
    </div>
  )
}
