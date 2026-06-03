// ── Tab 1: Bell Curve ─────────────────────────────────────────

import { useState, useMemo } from 'react'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'
import type { RogersSegment } from '../types'
import {
  W, H_SVG, BASELINE,
  BELL_FILL, BELL_STROKE,
  SEG_BOUNDS, SEGMENT_ORDER, SEG_LABELS,
  DOT_R,
  computeDotPositions, deptFill, getSegment, gradId,
} from '../T7Constants'
import { CondensedCard } from './T7CondensedCard'
import { MomentumCard } from './T7MomentumCard'

export function BellCurveTab({ stakeholders, dark }: { stakeholders: Stakeholder[]; dark: boolean }) {
  // Spotlight: null = todos visibles; string = solo ese dept visible
  const [focusDept, setFocusDept] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
        <div className="flex-1 min-w-0 rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 overflow-hidden">
          <svg
            viewBox={`0 0 ${W} ${H_SVG}`}
            className="w-full"
            style={{ height: 'auto' }}
            aria-label="Curva de difusión de Rogers — distribución de stakeholders"
          >
            <defs>
              {/* Gradientes 3D por departamento */}
              {depts.map(dept => {
                const fill = deptFill(dept, dark)
                return (
                  <radialGradient key={dept} id={gradId(dept)} cx="35%" cy="28%" r="65%">
                    <stop offset="0%"   stopColor="white" stopOpacity={0.45}/>
                    <stop offset="100%" stopColor={fill}  stopOpacity={1}/>
                  </radialGradient>
                )
              })}
              {/* Gradiente seleccionado (más brillante) */}
              {depts.map(dept => {
                const fill = deptFill(dept, dark)
                return (
                  <radialGradient key={`sel-${dept}`} id={`${gradId(dept)}-sel`} cx="35%" cy="28%" r="65%">
                    <stop offset="0%"   stopColor="white" stopOpacity={0.7}/>
                    <stop offset="100%" stopColor={fill}  stopOpacity={1}/>
                  </radialGradient>
                )
              })}
            </defs>

            {/* Fondos de segmento */}
            {SEGMENT_ORDER.map(seg => {
              const { x1, x2 } = SEG_BOUNDS[seg]
              const cfg = SEG_LABELS[seg]
              return (
                <rect
                  key={seg}
                  x={x1} y={0}
                  width={x2 - x1} height={BASELINE}
                  fill={dark ? cfg.darkBg : cfg.bg}
                  opacity={0.85}
                />
              )
            })}

            {/* Divisores de segmento */}
            {dividers.map(x => (
              <line
                key={x}
                x1={x} y1={0} x2={x} y2={BASELINE}
                stroke={dark ? 'rgba(255,255,255,0.1)' : '#CBD5E1'}
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            ))}

            {/* Bell curve fill */}
            <path d={BELL_FILL} fill={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'} />

            {/* Bell curve stroke */}
            <path
              d={BELL_STROKE}
              fill="none"
              stroke={dark ? '#64748B' : '#475569'}
              strokeWidth={2}
            />

            {/* Baseline */}
            <line x1={0} y1={BASELINE} x2={W} y2={BASELINE} stroke={dark ? 'rgba(255,255,255,0.1)' : '#CBD5E1'} strokeWidth={1} />

            {/* Etiquetas de segmento */}
            {SEGMENT_ORDER.map(seg => {
              const { x1, x2 } = SEG_BOUNDS[seg]
              const cx    = (x1 + x2) / 2
              const cfg   = SEG_LABELS[seg]
              const count = countBySeg[seg]
              const labelFill  = dark ? '#94A3B8' : '#475569'
              const pctFill    = dark ? '#64748B' : '#94A3B8'
              const countFill  = dark ? '#64748B' : '#64748B'
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

            {/* Dots con efecto 3D */}
            {allDots.map(dot => {
              const sh = stakeholders.find(s => s.id === dot.stakeholderId)
              if (!sh) return null

              const isVisible  = focusDept === null || sh.department === focusDept
              const isSelected = selectedId === sh.id
              const dept       = sh.department
              const r          = isSelected ? DOT_R + 3 : DOT_R
              const fillUrl    = isSelected ? `url(#${gradId(dept)}-sel)` : `url(#${gradId(dept)})`
              const initials   = sh.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

              return (
                <g
                  key={dot.stakeholderId}
                  onClick={() => setSelectedId(isSelected ? null : sh.id)}
                  style={{ cursor: 'pointer' }}
                  opacity={isVisible ? 1 : 0.08}
                >
                  {/* Sombra */}
                  <circle
                    cx={dot.cx + 1}
                    cy={dot.cy + 1.5}
                    r={r}
                    fill="rgba(0,0,0,0.18)"
                  />
                  {/* Cuerpo con gradiente 3D */}
                  <circle
                    cx={dot.cx}
                    cy={dot.cy}
                    r={r}
                    fill={fillUrl}
                    stroke={isSelected ? 'white' : 'rgba(255,255,255,0.7)'}
                    strokeWidth={isSelected ? 2 : 1.2}
                    style={{ transition: 'r 0.15s' }}
                  />
                  {/* Brillo superior */}
                  <ellipse
                    cx={dot.cx - r * 0.2}
                    cy={dot.cy - r * 0.28}
                    rx={r * 0.38}
                    ry={r * 0.22}
                    fill="rgba(255,255,255,0.35)"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Iniciales */}
                  <text
                    x={dot.cx}
                    y={dot.cy + 3.5}
                    textAnchor="middle"
                    fontSize={7.5}
                    fontWeight="700"
                    fill="white"
                    fontFamily="sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {initials}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

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
