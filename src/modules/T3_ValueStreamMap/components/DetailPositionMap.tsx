import { CAT_HEX } from './T3Badges.constants'
import type { AICategoryCode } from '../types'

const QUAD_LABELS = [
  { qx: 0.52, qy: 0.06, text: 'Pilotar ya',  color: '#5FAF8A' },
  { qx: 0.02, qy: 0.06, text: 'Preparar',    color: '#D4A85C' },
  { qx: 0.52, qy: 0.86, text: 'Quick wins',  color: '#9AAEC8' },
  { qx: 0.02, qy: 0.86, text: 'Evaluar',     color: '#94A3B8' },
]

export function DetailPositionMap({
  opportunityScore,
  readinessScore,
  category,
  size = 200,
}: {
  opportunityScore: number
  readinessScore:   number
  category:         AICategoryCode
  size?:            number
}) {
  const S = size, P = Math.round(S * 0.10), IN = S - P * 2
  const dx  = P + (readinessScore   / 4) * IN
  const dy  = P + (1 - opportunityScore / 4) * IN
  const hex = CAT_HEX[category]
  const r   = S * 0.048

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ display: 'block' }}>
      <defs>
        <clipPath id="detail-map-clip">
          <rect x={P} y={P} width={IN} height={IN} rx={5} />
        </clipPath>
      </defs>

      <g clipPath="url(#detail-map-clip)">
        <rect x={P}        y={P}        width={IN/2} height={IN/2} fill="#D4A85C" opacity={0.04} />
        <rect x={P + IN/2} y={P}        width={IN/2} height={IN/2} fill="#5FAF8A" opacity={0.06} />
        <rect x={P}        y={P + IN/2} width={IN/2} height={IN/2} fill="#E5E7EB" opacity={0.03} />
        <rect x={P + IN/2} y={P + IN/2} width={IN/2} height={IN/2} fill="#9AAEC8" opacity={0.04} />
      </g>

      <rect x={P} y={P} width={IN} height={IN} rx={5} fill="none" stroke="#E5E7EB" strokeWidth={1} />
      <line x1={P + IN/2} y1={P} x2={P + IN/2} y2={P + IN} stroke="#E5E7EB" strokeWidth={0.6} strokeDasharray="3 3" />
      <line x1={P} y1={P + IN/2} x2={P + IN} y2={P + IN/2} stroke="#E5E7EB" strokeWidth={0.6} strokeDasharray="3 3" />

      {QUAD_LABELS.map((q, i) => (
        <text key={i} x={P + q.qx * IN} y={P + q.qy * IN}
          fontSize={S * 0.045} fill={q.color} opacity={0.75}
          fontFamily="ui-monospace,monospace" letterSpacing="0.03em">
          {q.text}
        </text>
      ))}

      <circle cx={dx} cy={dy} r={r} fill={hex} stroke="#fff" strokeWidth={1.5} />
      <line x1={P} y1={dy} x2={dx - r} y2={dy} stroke={hex} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
      <line x1={dx} y1={P + IN} x2={dx} y2={dy + r} stroke={hex} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
    </svg>
  )
}
