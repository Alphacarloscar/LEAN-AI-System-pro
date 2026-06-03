// MetricChip — tarjeta pequeña de métrica

export function MetricChip({ label, value, valueColor }: {
  label:       string
  value:       string
  valueColor?: string
}) {
  return (
    <div className="bg-surface dark:bg-warm-700 rounded-lg p-2 text-center flex-1 min-w-0">
      <p className="text-[9px] font-mono uppercase tracking-wide text-text-muted dark:text-warm-300 mb-0.5 leading-tight">{label}</p>
      <p className="text-sm font-semibold tabular-nums leading-snug"
        style={{ color: valueColor ?? 'var(--color-text-primary)' }}>
        {value}
      </p>
    </div>
  )
}
