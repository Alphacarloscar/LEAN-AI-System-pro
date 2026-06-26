// StatusBar — barra apilada horizontal

export function StatusBar({ segments }: { segments: Array<{ pct: number; color: string; label: string }> }) {
  return (
    <div>
      <div className="flex h-[7px] rounded-full overflow-hidden mb-2 gap-px">
        {segments.map((s, i) => (
          <div key={i} style={{ width: `${s.pct}%`, background: s.color, flexShrink: 0 }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[10px] text-text-muted dark:text-warm-300">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
