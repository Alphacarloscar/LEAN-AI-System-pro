// ── Tab 1: Bell Curve ─────────────────────────────────────────

import { useState, useMemo } from 'react'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'
import type { RogersSegment } from '../types'
import {
  W, H_SVG, BASELINE,
  BELL_FILL, BELL_STROKE,
  SEG_BOUNDS, SEGMENT_ORDER, SEG_LABELS,
  DOT_R,
  computeDotPositions, deptFill, getSegment,
} from '../T7Constants'
import { Card } from '@shared/design-system/components'
import { CondensedCard } from './T7CondensedCard'
import { MomentumCard } from './T7MomentumCard'

export function BellCurveTab({ stakeholders, dark }: { stakeholders: Stakeholder[]; dark: boolean }) {
  const [focusDept, setFocusDept] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId,    setHoverId]    = useState<string | null>(null)

  const depts = useMemo(
    () => [...new Set(stakeholders.map(s => s.department))],
    [stakeholders]
  )

  const allDots = useMemo(
    () => computeDotPositions(stakeholders),
    [stakeholders]
  )

  const selectedDot = useMemo(
    () => allDots.find(d => d.stakeholderId === selectedId) ?? null,
    [allDots, selectedId]
  )

  function handleDeptClick(dept: string) {
    setFocusDept(prev => prev === dept ? null : dept)
    setSelectedId(null)
  }

  const countBySeg = useMemo(() => {
    const counts: Record<RogersSegment, number> = {
      innovators: 0, early_adopters: 0, early_majority: 0, late_majority: 0, laggards: 0,
    }
    for (const sh of stakeholders) {
      counts[getSegment(sh.archetype, sh.resistance)]++
    }
    return counts
  }, [stakeholders])

  // Divisores iguales: 160, 320, 480, 640
  const dividers = [160, 320, 480, 640]

  return (
    <div className="space-y-4">

      {/* Filtro spotlight */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mr-1">
          Filtrar por dpto.
        </span>
        {depts.map(dept => {
          const fill    = deptFill(dept, dark)
          const active  = focusDept === dept
          return (
            <button
              key={dept}
              onClick={() => handleDeptClick(dept)}
              className={[
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 border',
                active
                  ? 'text-white border-transparent shadow-sm'
                  : focusDept !== null
                    ? 'bg-transparent text-text-subtle border-border dark:border-white/10 opacity-40'
                    : 'bg-transparent text-text-muted border-border dark:border-white/10 hover:border-current',
              ].join(' ')}
              style={active ? { backgroundColor: fill, borderColor: fill } : { color: fill }}
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-white/60' : ''}`}
                style={!active ? { backgroundColor: fill } : undefined}
              />
              {dept}
            </button>
          )
        })}
        {focusDept && (
          <button
            onClick={() => setFocusDept(null)}
            className="text-[10px] text-text-subtle hover:text-text-muted underline transition-colors"
          >
            Ver todos
          </button>
        )}
      </div>

      {/* SVG + tarjeta momentum */}
      <div className="flex gap-4 items-start">

        {/* SVG Bell Curve */}
        <Card variant="outlined" padding="none" className="flex-1 min-w-0 rounded-xl overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${H_SVG}`}
            className="w-full"
            style={{ height: 'auto' }}
            aria-label="Curva de difusión de Rogers — distribución de stakeholders"
          >
            <defs />

            {/* Fondos de segmento — color plano por zona Rogers */}
            {(() => {
              const zoneColor: Record<string, string> = {
                innovators:     dark ? 'rgba(212,208,200,0.18)' : 'rgba(212,208,200,0.52)',
                early_adopters: dark ? 'rgba(184,180,171,0.24)' : 'rgba(184,180,171,0.62)',
                early_majority: dark ? 'rgba(200,134,10,0.18)'  : 'rgba(200,134,10,0.22)',
                late_majority:  dark ? 'rgba(184,180,171,0.20)' : 'rgba(184,180,171,0.55)',
                laggards:       dark ? 'rgba(212,208,200,0.14)' : 'rgba(212,208,200,0.42)',
              }
              return SEGMENT_ORDER.map(seg => {
                const { x1, x2 } = SEG_BOUNDS[seg]
                return (
                  <rect
                    key={seg}
                    x={x1} y={0}
                    width={x2 - x1} height={BASELINE}
                    fill={zoneColor[seg]}
                  />
                )
              })
            })()}

            {/* Divisores de segmento */}
            {dividers.map(x => (
              <line
                key={x}
                x1={x} y1={0} x2={x} y2={BASELINE}
                stroke={dark ? 'rgba(212,208,200,0.18)' : '#D4D0C8'}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}

            {/* Bell curve fill */}
            <path d={BELL_FILL} fill={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'} />

            {/* Bell curve stroke */}
            <path
              d={BELL_STROKE}
              fill="none"
              stroke={dark ? '#8A857C' : '#6B6864'}
              strokeWidth={1.5}
            />

            {/* Baseline */}
            <line x1={0} y1={BASELINE} x2={W} y2={BASELINE} stroke={dark ? 'rgba(255,255,255,0.1)' : '#D4D0C8'} strokeWidth={1} />

            {/* Etiquetas de segmento */}
            {SEGMENT_ORDER.map(seg => {
              const { x1, x2 } = SEG_BOUNDS[seg]
              const cx    = (x1 + x2) / 2
              const cfg   = SEG_LABELS[seg]
              const count = countBySeg[seg]
              const labelFill  = dark ? '#9A9790' : '#9A9790'
              const pctFill    = dark ? '#6B6864' : '#B8B4AB'
              const countFill  = dark ? '#6B6864' : '#6B6864'
              return (
                <g key={seg}>
                  <text
                    x={cx} y={14}
                    textAnchor="middle"
                    fontSize={8.5}
                    fontWeight="600"
                    fill={labelFill}
                    fontFamily="ui-monospace, monospace"
                  >
                    {cfg.label}
                  </text>
                  <text
                    x={cx} y={25}
                    textAnchor="middle"
                    fontSize={7}
                    fill={pctFill}
                    fontFamily="ui-monospace, monospace"
                  >
                    {cfg.pct}
                  </text>
                  {count > 0 && (
                    <text
                      x={cx} y={BASELINE + 22}
                      textAnchor="middle"
                      fontSize={8}
                      fill={countFill}
                      fontFamily="sans-serif"
                    >
                      {count} persona{count !== 1 ? 's' : ''}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Dots — badge base: halo, cuerpo plano, 2 iniciales */}
            {allDots.map(dot => {
              const sh = stakeholders.find(s => s.id === dot.stakeholderId)
              if (!sh) return null

              const isVisible = focusDept === null || sh.department === focusDept
              const isActive  = selectedId === sh.id
              const isHover   = hoverId    === sh.id
              const fill      = deptFill(sh.department, dark)
              const ini       = sh.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

              return (
                <g
                  key={dot.stakeholderId}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedId(isActive ? null : sh.id)}
                  onMouseEnter={() => setHoverId(sh.id)}
                  onMouseLeave={() => setHoverId(null)}
                  opacity={isVisible ? 1 : 0.08}
                >
                  {/* Halo en active o hover */}
                  {(isActive || isHover) && (
                    <>
                      <circle cx={dot.cx} cy={dot.cy} r={DOT_R + 14} fill={fill} opacity={0.06} />
                      <circle cx={dot.cx} cy={dot.cy} r={DOT_R + 10} fill={fill} opacity={0.10} />
                      <circle cx={dot.cx} cy={dot.cy} r={DOT_R + 6}  fill={fill} opacity={0.16} />
                    </>
                  )}

                  {/* Cuerpo plano */}
                  <circle
                    cx={dot.cx} cy={dot.cy}
                    r={DOT_R}
                    fill={fill}
                    fillOpacity="0.85"
                    stroke={isActive ? 'rgba(255,255,255,0.85)' : 'var(--color-warm-300)'}
                    strokeWidth="1.5"
                  />

                  {/* Iniciales — igual que T2: siempre 2 chars, y+4, fontSize 9 */}
                  <text
                    x={dot.cx} y={dot.cy + 4}
                    textAnchor="middle" fontSize={9} fontWeight="700"
                    fill="#FFFFFF" fontFamily="Inter, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {ini}
                  </text>
                </g>
              )
            })}
          </svg>
        </Card>

        {/* Tarjeta Momentum */}
        <MomentumCard stakeholders={stakeholders} />
      </div>

      {/* Tarjeta condensada al hacer click */}
      {selectedDot && (
        <CondensedCard
          dot={selectedDot}
          stakeholders={stakeholders}
          onClose={() => setSelectedId(null)}
          dark={dark}
        />
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">Leyenda</span>
        {depts.map(dept => (
          <div key={dept} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: deptFill(dept, dark) }} />
            <span className="text-xs text-text-muted">{dept}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
