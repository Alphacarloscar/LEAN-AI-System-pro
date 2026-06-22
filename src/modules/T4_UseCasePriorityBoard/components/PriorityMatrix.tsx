import { useState } from 'react'
import { STATUS_CONFIG, PRIORITY_QUADRANTS } from '../constants'
import type { UseCase } from '../types'

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
          {useCases.map((uc) => {
            const hex = STATUS_CONFIG[uc.status].hex
            return (
              <radialGradient key={`mglow-${uc.id}`} id={`t4mglow-${uc.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={hex} stopOpacity="0.35" />
                <stop offset="100%" stopColor={hex} stopOpacity="0" />
              </radialGradient>
            )
          })}
        </defs>

        <g clipPath="url(#t4matrix-clip)">
          <rect x={P}             y={P}             width={IN * 0.60} height={IN * 0.40} fill="#6A90C0" opacity={0.05} />
          <rect x={P + IN * 0.60} y={P}             width={IN * 0.40} height={IN * 0.40} fill="#5FAF8A" opacity={0.07} />
          <rect x={P}             y={P + IN * 0.40} width={IN * 0.60} height={IN * 0.60} fill="#E5E7EB" opacity={0.03} />
          <rect x={P + IN * 0.60} y={P + IN * 0.40} width={IN * 0.40} height={IN * 0.60} fill="#9AAEC8" opacity={0.05} />
        </g>

        <rect x={P} y={P} width={IN} height={IN} rx={6} fill="none" stroke="#E5E7EB" strokeWidth={1} />

        <line x1={P + IN * 0.6} y1={P}        x2={P + IN * 0.6} y2={P + IN}
          stroke="#E5E7EB" strokeWidth={0.8} strokeDasharray="3 3" />
        <line x1={P}            y1={P + IN * 0.4} x2={P + IN} y2={P + IN * 0.4}
          stroke="#E5E7EB" strokeWidth={0.8} strokeDasharray="3 3" />

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

        <text x={P + IN / 2} y={P + IN + 16} fontSize={8} fill="#9CA3AF"
          fontFamily="ui-monospace,monospace" textAnchor="middle" letterSpacing="0.08em">
          FACILIDAD →
        </text>
        <text
          x={P - 16} y={P + IN / 2}
          fontSize={8} fill="#9CA3AF"
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
          const hex      = STATUS_CONFIG[uc.status].hex
          const isActive = uc.id === activeId
          const r        = isActive ? 9 : 7

          return (
            <g
              key={uc.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSelect(uc.id)}
              onMouseEnter={() =>
                setHovered({
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
              <circle cx={x} cy={y} r={r * 3.5} fill={`url(#t4mglow-${uc.id})`} />
              <circle cx={x} cy={y} r={r * 1.8} fill={hex} opacity={isActive ? 0.25 : 0.12} />
              <circle
                cx={x} cy={y} r={r}
                fill={hex}
                opacity={isActive ? 1 : 0.85}
                stroke={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
                strokeWidth={isActive ? 1.5 : 0.8}
              />
              <ellipse
                cx={x - r * 0.22} cy={y - r * 0.30}
                rx={r * 0.38} ry={r * 0.22}
                fill="#fff" opacity={0.40}
              />
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-50 bg-white dark:bg-warm-800 border border-border dark:border-white/10 rounded-lg shadow-lg px-3 py-2 text-[11px] min-w-[148px]"
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
