import { useState, useMemo } from 'react'
import { AI_CATEGORY_CONFIG } from '../constants'
import { CAT_HEX, CAT_ORDER } from './T3Badges.constants'
import { T3_QUADRANT_COLORS } from '@shared/design-system/charts/chartTokens'
import type { ValueStream } from '../types'

type HoveredDot = {
  leftPct: number; topPct: number
  name: string; hex: string; catLabel: string
  opportunity: number; readiness: number
}

export function HeroCategoryDonut({
  processes,
  activeId,
  onSelect,
}: {
  processes: ValueStream[]
  activeId:  string | null
  onSelect:  (id: string) => void
}) {
  const VB = 480, CX = 240, CY = 240
  const R_OUTER = 152, R_INNER = 58
  const total = processes.length

  const [donutHovered, setDonutHovered] = useState<HoveredDot | null>(null)

  const catData = useMemo(() => CAT_ORDER
    .map((cat) => ({
      cat,
      count: processes.filter((p) => p.aiCategory === cat).length,
      procs: processes.filter((p) => p.aiCategory === cat),
    }))
    .filter((c) => c.count > 0),
  [processes])

  if (total === 0) {
    return (
      <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" style={{ display: 'block' }}>
        <text x={CX} y={CY + 5} textAnchor="middle" fontSize={13}
          fill={T3_QUADRANT_COLORS.evaluar} fontFamily="ui-monospace,monospace">
          Sin procesos
        </text>
      </svg>
    )
  }

  const GAP_RAD = catData.length > 1 ? 0.03 : 0
  let currentAngle = -Math.PI / 2

  const arcs = catData.map(({ cat, count, procs }) => {
    const fraction   = count / total
    const arcSpan    = fraction * 2 * Math.PI - GAP_RAD
    const startAngle = currentAngle + GAP_RAD / 2
    const endAngle   = startAngle + arcSpan
    currentAngle    += fraction * 2 * Math.PI
    const midAngle   = (startAngle + endAngle) / 2
    return { cat, count, procs, startAngle, endAngle, midAngle }
  })

  function arcPath(sa: number, ea: number, ro: number, ri: number) {
    const x1o = CX + ro * Math.cos(sa), y1o = CY + ro * Math.sin(sa)
    const x2o = CX + ro * Math.cos(ea), y2o = CY + ro * Math.sin(ea)
    const x1i = CX + ri * Math.cos(sa), y1i = CY + ri * Math.sin(sa)
    const x2i = CX + ri * Math.cos(ea), y2i = CY + ri * Math.sin(ea)
    const large = ea - sa > Math.PI ? 1 : 0
    return [
      `M ${x1o.toFixed(2)} ${y1o.toFixed(2)}`,
      `A ${ro} ${ro} 0 ${large} 1 ${x2o.toFixed(2)} ${y2o.toFixed(2)}`,
      `L ${x2i.toFixed(2)} ${y2i.toFixed(2)}`,
      `A ${ri} ${ri} 0 ${large} 0 ${x1i.toFixed(2)} ${y1i.toFixed(2)}`,
      'Z',
    ].join(' ')
  }

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${VB} ${VB}`} width="100%"
        style={{ display: 'block', overflow: 'visible' }}
        className="text-lean-black dark:text-gray-100">

        <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="rgba(148,163,184,0.28)" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={0.6} />
        {[75, 100, 126].map((r) => (
          <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={0.6} />
        ))}

        {arcs.map(({ cat, count, procs, startAngle, endAngle, midAngle }) => {
          const hex    = CAT_HEX[cat]
          const cfg    = AI_CATEGORY_CONFIG[cat]
          const labelR = R_OUTER + 24
          const lx     = CX + labelR * Math.cos(midAngle)
          const ly     = CY + labelR * Math.sin(midAngle)
          const cosM   = Math.cos(midAngle)
          const anchor = cosM < -0.2 ? 'end' : cosM > 0.2 ? 'start' : 'middle'
          const words  = cfg.label.split(' ')
          const line1  = words.slice(0, Math.ceil(words.length / 2)).join(' ')
          const line2  = words.slice(Math.ceil(words.length / 2)).join(' ')

          const dots = procs.map((p, i) => {
            const frac   = procs.length > 1 ? (i + 0.5) / procs.length : 0.5
            const dotAng = startAngle + frac * (endAngle - startAngle)
            const opp    = p.interview?.opportunityScore ?? 2
            const radPct = 0.15 + (opp / 4) * 0.70
            const dotR   = R_INNER + radPct * (R_OUTER - R_INNER)
            return { id: p.id, cx: CX + dotR * Math.cos(dotAng), cy: CY + dotR * Math.sin(dotAng), hex, name: p.name, catLabel: cfg.label, opportunity: opp, readiness: p.interview?.readinessScore ?? 0 }
          })

          return (
            <g key={cat}>
              <path d={arcPath(startAngle, endAngle, R_OUTER, R_INNER)} fill={hex} opacity={0.18} />
              <path d={arcPath(startAngle, endAngle, R_OUTER, R_INNER)} fill="none" stroke={hex} strokeWidth={1} opacity={0.55} />

              {dots.map((dot) => {
                const isActive = dot.id === activeId
                return (
                  <g key={dot.id} style={{ cursor: 'pointer' }}
                    onClick={() => onSelect(dot.id)}
                    onMouseEnter={() => setDonutHovered({ leftPct: (dot.cx / VB) * 100, topPct: (dot.cy / VB) * 100, name: dot.name, hex: dot.hex, catLabel: dot.catLabel, opportunity: dot.opportunity, readiness: dot.readiness })}
                    onMouseLeave={() => setDonutHovered(null)}
                  >
                    {isActive && (
                      <>
                        <circle cx={dot.cx} cy={dot.cy} r={18} fill={dot.hex} opacity={0.10} />
                        <circle cx={dot.cx} cy={dot.cy} r={13} fill={dot.hex} opacity={0.18} />
                      </>
                    )}
                    <circle cx={dot.cx} cy={dot.cy} r={isActive ? 12 : 10} fill={dot.hex} opacity={isActive ? 0.28 : 0.15} />
                    <circle cx={dot.cx} cy={dot.cy} r={isActive ? 9 : 7} fill={dot.hex} opacity={0.92}
                      stroke={isActive ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.50)'}
                      strokeWidth={isActive ? 2 : 0.8} />
                    <ellipse cx={dot.cx - 2} cy={dot.cy - 2} rx={2.5} ry={1.5} fill="rgba(255,255,255,0.55)" />
                  </g>
                )
              })}

              <text
                x={CX + (R_INNER + (R_OUTER - R_INNER) * 0.80) * Math.cos(midAngle)}
                y={CY + (R_INNER + (R_OUTER - R_INNER) * 0.80) * Math.sin(midAngle) + 4}
                textAnchor="middle" fontSize={11} fontWeight="700"
                fill={hex} fontFamily="ui-monospace,monospace">
                {count}
              </text>

              <text x={lx} y={ly - (line2 ? 5 : 0)} textAnchor={anchor}
                fontSize={8} fontWeight="700" fill={hex}
                fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
                {line1.toUpperCase()}
              </text>
              {line2 && (
                <text x={lx} y={ly + 10} textAnchor={anchor}
                  fontSize={8} fontWeight="700" fill={hex}
                  fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
                  {line2.toUpperCase()}
                </text>
              )}
            </g>
          )
        })}

        <text x={CX} y={CY - 14} textAnchor="middle" fontSize={7.5} fill={T3_QUADRANT_COLORS.evaluar}
          fontFamily="ui-monospace,monospace" letterSpacing="0.10em">VALUE STREAM</text>
        <text x={CX} y={CY - 2}  textAnchor="middle" fontSize={7.5} fill={T3_QUADRANT_COLORS.evaluar}
          fontFamily="ui-monospace,monospace" letterSpacing="0.10em">MAP</text>
        <text x={CX} y={CY + 22} textAnchor="middle" fontSize={26} fontWeight="700"
          fill="currentColor" fontFamily="ui-monospace,monospace">
          {total}
        </text>
      </svg>

      {donutHovered && (
        <div className="pointer-events-none absolute z-50 bg-white dark:bg-warm-800 border border-border dark:border-white/10 rounded-lg shadow-sm px-3 py-2 text-[11px] min-w-[148px]"
          style={{
            left:      `${donutHovered.leftPct}%`,
            top:       `${donutHovered.topPct}%`,
            transform: `translate(${donutHovered.leftPct > 60 ? 'calc(-100% - 8px)' : '10px'}, -50%)`,
          }}>
          <p className="font-semibold text-lean-black dark:text-gray-100 mb-1 leading-tight truncate max-w-[160px]">{donutHovered.name}</p>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: donutHovered.hex }} />
            <span className="text-text-muted">{donutHovered.catLabel}</span>
          </div>
          <div className="space-y-0.5 text-text-muted">
            <div className="flex justify-between gap-4">
              <span>Oportunidad</span>
              <span className="font-medium text-lean-black dark:text-gray-200">{donutHovered.opportunity}/4</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Readiness</span>
              <span className="font-medium text-lean-black dark:text-gray-200">{donutHovered.readiness}/4</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
