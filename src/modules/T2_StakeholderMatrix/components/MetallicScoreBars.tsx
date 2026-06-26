// ============================================================
// T2 — MetallicScoreBars
//
// Barras SVG metálicas horizontales para mostrar los tres
// scores de entrevista: adopción, influencia, apertura.
// ============================================================

const SCORE_BARS_META = [
  { key: 'ad',  label: 'ADOPCIÓN IA', hex: '#5FAF8A', light: '#B4E4CF' },
  { key: 'inf', label: 'INFLUENCIA',  hex: '#6A90C0', light: '#B8D0E8' },
  { key: 'ap',  label: 'APERTURA',    hex: '#9AAEC8', light: '#C8DAE8' },
] as const

interface MetallicScoreBarsProps {
  adoptionScore:  number
  influenceScore: number
  opennessScore:  number
  trackWidth?:    number
}

export function MetallicScoreBars({
  adoptionScore,
  influenceScore,
  opennessScore,
  trackWidth = 88,
}: MetallicScoreBarsProps) {
  const MAX      = 4
  const LBL_W    = 76
  const G1       = 10
  const TRACK_W  = trackWidth
  const G2       = 8
  const VAL_COL  = 32
  const VBW      = LBL_W + G1 + TRACK_W + G2 + VAL_COL
  const TX       = LBL_W + G1
  const ROW_H    = 52
  const VBH      = SCORE_BARS_META.length * ROW_H + 8

  const values = [adoptionScore, influenceScore, opennessScore]

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {SCORE_BARS_META.map(({ key, hex, light }, i) => {
          const fillW = Math.max((values[i] / MAX) * TRACK_W, 2)
          return (
            <linearGradient
              key={key}
              id={`mb-${key}`}
              x1={TX} y1="0" x2={TX + fillW} y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%"   stopColor={hex}   stopOpacity="0.15" />
              <stop offset="30%"  stopColor={hex}   stopOpacity="0.92" />
              <stop offset="58%"  stopColor={light} stopOpacity="1" />
              <stop offset="85%"  stopColor={hex}   stopOpacity="0.80" />
              <stop offset="100%" stopColor={hex}   stopOpacity="0.40" />
            </linearGradient>
          )
        })}
      </defs>

      {SCORE_BARS_META.map(({ key, label, hex, light }, i) => {
        const val   = values[i]
        const fillW = Math.max((val / MAX) * TRACK_W, 2)
        const cy    = i * ROW_H + ROW_H / 2 + 3

        return (
          <g key={key}>
            <text x={0} y={cy + 4} fontSize={10} fill="var(--color-border)"
              fontFamily="ui-monospace,monospace" letterSpacing="0.04em" fontWeight="600">
              {label}
            </text>

            <rect x={TX} y={cy - 1} width={TRACK_W} height={2}
              fill={hex} opacity={0.12} rx={1} />

            <rect x={TX} y={cy - 5} width={fillW} height={10}
              fill={hex} opacity={0.10} rx={5} />
            <rect x={TX} y={cy - 3} width={fillW} height={6}
              fill={hex} opacity={0.10} rx={3} />

            <rect x={TX} y={cy - 3} width={fillW} height={6}
              fill={`url(#mb-${key})`} rx={3} />

            <rect x={TX + fillW * 0.08} y={cy - 3.5}
              width={fillW * 0.45} height={1.2}
              fill={light} opacity={0.60} rx={0.6} />

            <text
              x={TX + TRACK_W + G2} y={cy + 4}
              fontSize={11} fontWeight="600" fill="var(--color-warm-100)"
              fontFamily="ui-monospace,monospace"
            >
              {val.toFixed(1)}<tspan fontSize={8} opacity={0.5}>/4</tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}
