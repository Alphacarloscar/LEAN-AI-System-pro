import { useState } from 'react'
import { STATUS_CONFIG, PRIORITY_QUADRANTS } from '../constants'
import { DOMAIN_ICONS, type DomainIconCode } from '@shared/design-system/charts/domainIcons'
import type { UseCase } from '../types'

const NEUTRAL_HEX = '#8A857C'  // warm-500 — color neutro DS

export function PriorityMatrix({
  useCases,
  activeId,
  onSelect,
}: {
  useCases: UseCase[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const S  = 320
  const P  = 40
  const IN = S - P * 2

  type T4Hovered = {
    id: string
    leftPct: number; topPct: number
    name: string; hex: string; statusLabel: string
    feasibility: number; kpiImpact: number
  }
  const [hovered, setHovered] = useState<T4Hovered | null>(null)

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <clipPath id="t4matrix-clip">
            <rect x={P} y={P} width={IN} height={IN} rx={6} />
          </clipPath>
        </defs>

        <g clipPath="url(#t4matrix-clip)">
          {/* Fondos de cuadrante — warm sutiles sin saturación cromática */}
          <rect x={P}             y={P}             width={IN * 0.50} height={IN * 0.50} fill="#D4D0C8" opacity={0.06} />
          <rect x={P + IN * 0.50} y={P}             width={IN * 0.50} height={IN * 0.50} fill="#C8860A" opacity={0.05} />
          <rect x={P}             y={P + IN * 0.50} width={IN * 0.50} height={IN * 0.50} fill="#D4D0C8" opacity={0.03} />
          <rect x={P + IN * 0.50} y={P + IN * 0.50} width={IN * 0.50} height={IN * 0.50} fill="#D4D0C8" opacity={0.04} />
        </g>

        <rect x={P} y={P} width={IN} height={IN} rx={6} fill="none" stroke="#D4D0C8" strokeWidth={1} />

        <line x1={P + IN * 0.5} y1={P}        x2={P + IN * 0.5} y2={P + IN}
          stroke="#D4D0C8" strokeWidth={0.8} strokeDasharray="3 3" />
        <line x1={P}            y1={P + IN * 0.5} x2={P + IN} y2={P + IN * 0.5}
          stroke="#D4D0C8" strokeWidth={0.8} strokeDasharray="3 3" />

        {PRIORITY_QUADRANTS.map((q, i) => (
          <text
            key={i}
            x={P + q.qx * IN} y={P + q.qy * IN}
            fontSize={7} fill={q.color} opacity={0.80}
            fontFamily="ui-monospace,monospace" letterSpacing="0.06em" fontWeight="700"
          >
            {q.text}
          </text>
        ))}

        <text x={P + IN / 2} y={P + IN + 16} fontSize={8} fill="#9A9790"
          fontFamily="ui-monospace,monospace" textAnchor="middle" letterSpacing="0.08em">
          FACILIDAD →
        </text>
        <text
          x={P - 16} y={P + IN / 2}
          fontSize={8} fill="#9A9790"
          fontFamily="ui-monospace,monospace"
          textAnchor="middle"
          letterSpacing="0.08em"
          transform={`rotate(-90, ${P - 16}, ${P + IN / 2})`}
        >
          IMPACTO ↑
        </text>

        {useCases.map((uc) => {
          const x        = P + (uc.scores.feasibility / 100) * IN
          const y        = P + (1 - uc.scores.kpiImpact / 100) * IN
          const hex      = NEUTRAL_HEX
          const isActive = uc.id === activeId
          const isHover  = hovered?.id === uc.id
          const DOT_R    = 10
          const icon     = DOMAIN_ICONS[uc.aiCategory as DomainIconCode]

          return (
            <g
              key={uc.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(uc.id)}
              onMouseEnter={() =>
                setHovered({
                  id:          uc.id,
                  leftPct:     (x / S) * 100,
                  topPct:      (y / S) * 100,
                  name:        uc.name,
                  hex,
                  statusLabel: STATUS_CONFIG[uc.status].label,
                  feasibility: uc.scores.feasibility,
                  kpiImpact:   uc.scores.kpiImpact,
                })
              }
              onMouseLeave={() => setHovered(null)}
            >
              {(isActive || isHover) && (
                <>
                  <circle cx={x} cy={y} r={DOT_R + 14} fill={hex} opacity={0.06} />
                  <circle cx={x} cy={y} r={DOT_R + 10} fill={hex} opacity={0.10} />
                  <circle cx={x} cy={y} r={DOT_R + 6}  fill={hex} opacity={0.16} />
                </>
              )}
              <circle
                cx={x} cy={y}
                r={DOT_R}
                fill={hex}
                fillOpacity="0.85"
                stroke={isActive ? 'rgba(255,255,255,0.85)' : 'var(--color-warm-300)'}
                strokeWidth="1.5"
              />
              {icon && (
                <foreignObject x={x - 8} y={y - 8} width={16} height={16} style={{ pointerEvents: 'none', overflow: 'visible' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, color: '#fff' }}>
                    {icon}
                  </div>
                </foreignObject>
              )}
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-50 bg-white dark:bg-warm-800 border border-border dark:border-white/10 rounded-lg shadow-md px-3 py-2 text-[11px] min-w-[148px]"
          style={{
            left:      `${hovered.leftPct}%`,
            top:       `${hovered.topPct}%`,
            transform: `translate(${hovered.leftPct > 65 ? 'calc(-100% - 10px)' : '10px'}, -50%)`,
          }}
        >
          <p className="font-semibold text-lean-black dark:text-warm-50 mb-1 leading-tight truncate max-w-[160px]">
            {hovered.name}
          </p>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hovered.hex }} />
            <span className="text-text-muted">{hovered.statusLabel}</span>
          </div>
          <div className="space-y-0.5 text-text-muted">
            <div className="flex justify-between gap-4">
              <span>Facilidad</span>
              <span className="font-medium text-lean-black dark:text-warm-100">{hovered.feasibility}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Impacto KPI</span>
              <span className="font-medium text-lean-black dark:text-warm-100">{hovered.kpiImpact}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
