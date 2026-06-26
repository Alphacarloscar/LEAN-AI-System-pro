import { DOMAIN_ICONS, DOMAIN_LABELS, type DomainIconCode } from '@shared/design-system/charts/domainIcons'
import { T3_QUADRANT_COLORS } from '@shared/design-system/charts/chartTokens'
import type { AICategoryCode } from '../types'

const NEUTRAL_HEX = '#8A857C'  // warm-500 — color neutro DS

const QUAD_LABELS = [
  { qx: 0.52, qy: 0.06, text: 'Pilotar ya',  color: T3_QUADRANT_COLORS.pilotarYa       },
  { qx: 0.02, qy: 0.06, text: 'Preparar',    color: T3_QUADRANT_COLORS.prepararTerreno },
  { qx: 0.52, qy: 0.86, text: 'Quick wins',  color: T3_QUADRANT_COLORS.quickWins       },
  { qx: 0.02, qy: 0.86, text: 'Evaluar',     color: T3_QUADRANT_COLORS.evaluar         },
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
  const S    = size, P = Math.round(S * 0.10), IN = S - P * 2
  const dx   = P + (readinessScore   / 4) * IN
  const dy   = P + (1 - opportunityScore / 4) * IN
  const r    = S * 0.048
  const icon = DOMAIN_ICONS[category as DomainIconCode]
  const label = DOMAIN_LABELS[category as DomainIconCode] ?? category

  return (
    <>
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ display: 'block' }}>
      <defs>
        <clipPath id="detail-map-clip">
          <rect x={P} y={P} width={IN} height={IN} rx={5} />
        </clipPath>
      </defs>

      <g clipPath="url(#detail-map-clip)">
        <rect x={P}        y={P}        width={IN/2} height={IN/2} fill={T3_QUADRANT_COLORS.prepararTerreno} opacity={0.04} />
        <rect x={P + IN/2} y={P}        width={IN/2} height={IN/2} fill={T3_QUADRANT_COLORS.pilotarYa}       opacity={0.06} />
        <rect x={P}        y={P + IN/2} width={IN/2} height={IN/2} fill={T3_QUADRANT_COLORS.border}          opacity={0.03} />
        <rect x={P + IN/2} y={P + IN/2} width={IN/2} height={IN/2} fill={T3_QUADRANT_COLORS.quickWins}       opacity={0.04} />
      </g>

      <rect x={P} y={P} width={IN} height={IN} rx={5} fill="none" stroke={T3_QUADRANT_COLORS.border} strokeWidth={1} />
      <line x1={P + IN/2} y1={P} x2={P + IN/2} y2={P + IN} stroke={T3_QUADRANT_COLORS.border} strokeWidth={0.6} strokeDasharray="3 3" />
      <line x1={P} y1={P + IN/2} x2={P + IN} y2={P + IN/2} stroke={T3_QUADRANT_COLORS.border} strokeWidth={0.6} strokeDasharray="3 3" />

      {QUAD_LABELS.map((q, i) => (
        <text key={i} x={P + q.qx * IN} y={P + q.qy * IN}
          fontSize={S * 0.045} fill={q.color} opacity={0.75}
          fontFamily="ui-monospace,monospace" letterSpacing="0.03em">
          {q.text}
        </text>
      ))}

      <circle
        cx={dx} cy={dy} r={r}
        fill={NEUTRAL_HEX}
        fillOpacity="0.85"
        stroke="var(--color-warm-300)"
        strokeWidth="1.5"
      />
      {icon && (
        <foreignObject x={dx - r} y={dy - r} width={r * 2} height={r * 2} style={{ pointerEvents: 'none', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: r * 2, height: r * 2, color: '#fff' }}>
            {icon}
          </div>
        </foreignObject>
      )}
      <line x1={P} y1={dy} x2={dx - r} y2={dy} stroke={NEUTRAL_HEX} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
      <line x1={dx} y1={P + IN} x2={dx} y2={dy + r} stroke={NEUTRAL_HEX} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
    </svg>
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-warm-100 dark:bg-warm-700 mt-1">
      <span className="text-warm-600 dark:text-warm-300 flex items-center">{icon}</span>
      <span className="text-[10px] font-medium text-warm-700 dark:text-warm-200">{label}</span>
    </div>
    </>
  )
}
