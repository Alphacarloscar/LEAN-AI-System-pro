// DonutChart — SVG donut con segmentos

export function DonutChart({ segments, size = 64, strokeWidth = 13, centerLabel }: {
  segments:      Array<{ pct: number; color: string }>
  size?:         number
  strokeWidth?:  number
  centerLabel?:  string
}) {
  const r    = (size - strokeWidth) / 2
  const cx   = size / 2
  const cy   = size / 2
  const circ = 2 * Math.PI * r
  let cum    = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#D4D0C8" strokeWidth={strokeWidth} className="dark:stroke-warm-500" />
      {segments.map((seg, i) => {
        const dashLen = (seg.pct / 100) * circ
        const offset  = -cum
        cum += dashLen
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dashLen} ${circ}`} strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        )
      })}
      {centerLabel && (
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor"
          className="fill-lean-black dark:fill-warm-50">
          {centerLabel}
        </text>
      )}
    </svg>
  )
}
