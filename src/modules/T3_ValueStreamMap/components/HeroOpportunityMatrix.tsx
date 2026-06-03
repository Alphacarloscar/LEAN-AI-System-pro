import { useState } from 'react'
import { AI_CATEGORY_CONFIG } from '../constants'
import { CAT_HEX } from './T3Badges'
import type { ValueStream } from '../types'

const QUAD_LABELS = [
  { qx: 0.60, qy: 0.08, text: 'PILOTAR YA',       color: '#5FAF8A' },
  { qx: 0.03, qy: 0.08, text: 'PREPARAR TERRENO', color: '#D4A85C' },
  { qx: 0.60, qy: 0.82, text: 'QUICK WINS',       color: '#9AAEC8' },
  { qx: 0.03, qy: 0.82, text: 'EVALUAR',           color: '#94A3B8' },
]

type HoveredDot = {
  leftPct: number; topPct: number
  name: string; hex: string; catLabel: string
  opportunity: number; readiness: number
}

export function HeroOpportunityMatrix({
  processes,
  activeId,
  onSelect,
}: {
  processes: ValueStream[]
  activeId:  string | null
  onSelect:  (id: string) => void
}) {
  const S = 320, P = 36, IN = S - P * 2
  const [hovered, setHovered] = useState<HoveredDot | null>(null)

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ display: 'block' }}>
        <defs>
          <clipPath id="t3hero-clip">
            <rect x={P} y={P} width={IN} height={IN} rx={6} />
          </clipPath>
        </defs>

        <g clipPath="url(#t3hero-clip)">
          <rect x={P}        y={P}        width={IN/2} height={IN/2} fill="#D4A85C" opacity={0.04} />
          <rect x={P + IN/2} y={P}        width={IN/2} height={IN/2} fill="#5FAF8A" opacity={0.06} />
          <rect x={P}        y={P + IN/2} width={IN/2} height={IN/2} fill="#E5E7EB" opacity={0.03} />
          <rect x={P + IN/2} y={P + IN/2} width={IN/2} height={IN/2} fill="#9AAEC8" opacity={0.04} />
        </g>

        <rect x={P} y={P} width={IN} height={IN} rx={6} fill="none" stroke="#E5E7EB" strokeWidth={1} />
        <line x1={P + IN/2} y1={P} x2={P + IN/2} y2={P + IN} stroke="#E5E7EB" strokeWidth={0.8} strokeDasharray="3 3" />
        <line x1={P} y1={P + IN/2} x2={P + IN} y2={P + IN/2} stroke="#E5E7EB" strokeWidth={0.8} strokeDasharray="3 3" />

        {QUAD_LABELS.map((q, i) => (
          <text key={i} x={P + q.qx * IN} y={P + q.qy * IN}
            fontSize={7} fill={q.color} opacity={0.80}
            fontFamily="ui-monospace,monospace" letterSpacing="0.06em" fontWeight="700">
            {q.text}
          </text>
        ))}

        <text x={P + IN / 2} y={P - 12} fontSize={8} fill="#9CA3AF"
          fontFamily="ui-monospace,monospace" textAnchor="middle" letterSpacing="0.08em">
          READINESS →
        </text>
        <text x={P - 14} y={P + IN / 2} fontSize={8} fill="#9CA3AF"
          fontFamily="ui-monospace,monospace" textAnchor="middle" letterSpacing="0.08em"
          transform={`rotate(-90, ${P - 14}, ${P + IN/2})`}>
          OPORTUNIDAD IA ↑
        </text>

        {processes.map((p) => {
          const score    = p.interview?.opportunityScore ?? 0
          const ready    = p.interview?.readinessScore   ?? 0
          const isActive = p.id === activeId
          const r        = isActive ? 9 : 7
          const rawDx    = P + (ready / 4) * IN
          const rawDy    = P + (1 - score / 4) * IN
          const dx       = Math.max(P + r + 1, Math.min(P + IN - r - 1, rawDx))
          const dy       = Math.max(P + r + 1, Math.min(P + IN - r - 1, rawDy))
          const hex      = CAT_HEX[p.aiCategory]
          const catLabel = AI_CATEGORY_CONFIG[p.aiCategory]?.label ?? p.aiCategory

          return (
            <g key={p.id} style={{ cursor: 'pointer' }}
              onClick={() => onSelect(p.id)}
              onMouseEnter={() => setHovered({ leftPct: (dx / S) * 100, topPct: (dy / S) * 100, name: p.name, hex, catLabel, opportunity: score, readiness: ready })}
              onMouseLeave={() => setHovered(null)}
            >
              <circle cx={dx} cy={dy} r={r} fill={hex}
                opacity={isActive ? 1 : 0.82}
                stroke={isActive ? '#fff' : 'rgba(255,255,255,0.6)'}
                strokeWidth={isActive ? 2 : 1} />
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute z-50 bg-white dark:bg-warm-800 border border-border dark:border-white/10 rounded-lg shadow-lg px-3 py-2 text-[11px] min-w-[148px]"
          style={{
            left:      `${hovered.leftPct}%`,
            top:       `${hovered.topPct}%`,
            transform: `translate(${hovered.leftPct > 65 ? 'calc(-100% - 10px)' : '10px'}, -50%)`,
          }}>
          <p className="font-semibold text-lean-black dark:text-gray-100 mb-1 leading-tight truncate max-w-[160px]">{hovered.name}</p>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hovered.hex }} />
            <span className="text-text-muted">{hovered.catLabel}</span>
          </div>
          <div className="space-y-0.5 text-text-muted">
            <div className="flex justify-between gap-4">
              <span>Oportunidad</span>
              <span className="font-medium text-lean-black dark:text-gray-200">{hovered.opportunity}/4</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Readiness</span>
              <span className="font-medium text-lean-black dark:text-gray-200">{hovered.readiness}/4</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
