// ============================================================
// T7 — Adoption Heatmap (Curva de Rogers) — v2
//
// Cambios v2:
// 1. Curva llega al tope del gráfico (AMPLITUDE aumentado)
// 2. Dots en Mayoría Temp. y Tardía van DEBAJO de la curva
// 3. Cinco segmentos de igual anchura (160px c/u)
// 4. Dots más pequeños (r=11) con iniciales conservadas
// 5. Filtro en modo spotlight (click muestra solo ese dpto.)
// 6. Efecto 3D con gradiente radial en los dots
// 7. Tarjeta dinámica de Momentum / Riesgos / Oportunidades
// ============================================================

import { useState, useMemo } from 'react'
import { useT2Store }        from '@/modules/T2_StakeholderMatrix/store'
import { ARCHETYPE_CONFIG }  from '@/modules/T2_StakeholderMatrix/constants'
import { PhaseMiniMap }      from '@/shared/components/PhaseMiniMap'
import { useDarkMode }       from '@/shared/hooks/useDarkMode'
import type {
  ArchetypeCode,
  ResistanceLevel,
  Stakeholder,
}                            from '@/modules/T2_StakeholderMatrix/types'
import type { RogersSegment, DotPosition } from './types'

// ── Constantes ────────────────────────────────────────────────

const SEGMENT_ORDER: RogersSegment[] = [
  'innovators', 'early_adopters', 'early_majority', 'late_majority', 'laggards',
]

const ARCHETYPE_BASE_SEG: Record<ArchetypeCode, RogersSegment> = {
  adoptador:    'early_adopters',
  ambassador:   'early_majority',
  decisor:      'early_majority',
  especialista: 'late_majority',
  critico:      'laggards',
}

function getSegment(archetype: ArchetypeCode, resistance: ResistanceLevel): RogersSegment {
  const base = ARCHETYPE_BASE_SEG[archetype]
  if (resistance === 'alta') {
    const idx = SEGMENT_ORDER.indexOf(base)
    return SEGMENT_ORDER[Math.min(idx + 1, SEGMENT_ORDER.length - 1)]
  }
  return base
}

// ── SVG Bell Curve ────────────────────────────────────────────

const W         = 800
const H_SVG     = 560
const BASELINE  = 520           // línea base (eje X)
const AMPLITUDE = 482           // pico llega a y≈38 (cerca del tope)
const MU        = 400           // centrado en W/2 → curva perfectamente simétrica
const SIGMA     = 120           // colas llegan al suelo en x=0 y x=800

// Segmentos de igual anchura (W/5 = 160px)
const SEG_BOUNDS: Record<RogersSegment, { x1: number; x2: number }> = {
  innovators:     { x1: 0,   x2: 160 },
  early_adopters: { x1: 160, x2: 320 },
  early_majority: { x1: 320, x2: 480 },
  late_majority:  { x1: 480, x2: 640 },
  laggards:       { x1: 640, x2: 800 },
}

// Segmentos donde los dots van DEBAJO de la curva
const BELOW_CURVE_SEGS: RogersSegment[] = ['early_majority', 'late_majority']

function bellY(x: number): number {
  return BASELINE - AMPLITUDE * Math.exp(-((x - MU) ** 2) / (2 * SIGMA ** 2))
}

function buildBellFillPath(): string {
  const pts: string[] = []
  for (let x = 0; x <= W; x += 4) {
    pts.push(`${x.toFixed(1)},${bellY(x).toFixed(1)}`)
  }
  return `M ${pts.join(' L ')} L ${W},${BASELINE} L 0,${BASELINE} Z`
}

function buildBellStrokePath(): string {
  const pts: string[] = []
  for (let x = 0; x <= W; x += 4) {
    pts.push(`${x.toFixed(1)},${bellY(x).toFixed(1)}`)
  }
  return `M ${pts.join(' L ')}`
}

const BELL_FILL   = buildBellFillPath()
const BELL_STROKE = buildBellStrokePath()

const SEG_LABELS: Record<RogersSegment, { label: string; pct: string; bg: string; darkBg: string }> = {
  innovators:     { label: 'Innovadores',    pct: '2.5%',  bg: '#EFF6FF', darkBg: 'rgba(59,130,246,0.07)'  },
  early_adopters: { label: 'Early Adopters', pct: '13.5%', bg: '#F0FDF4', darkBg: 'rgba(34,197,94,0.07)'   },
  early_majority: { label: 'Mayoría Temp.',  pct: '34%',   bg: '#FEFCE8', darkBg: 'rgba(234,179,8,0.07)'   },
  late_majority:  { label: 'Mayoría Tardía', pct: '34%',   bg: '#FFF7ED', darkBg: 'rgba(249,115,22,0.07)'  },
  laggards:       { label: 'Rezagados',      pct: '16%',   bg: '#F9FAFB', darkBg: 'rgba(148,163,184,0.05)' },
}

// ── Departamentos ─────────────────────────────────────────────

interface DeptCfg {
  fill:      string  // light mode dot/swatch color
  darkFill:  string  // dark mode dot/swatch color (más visible sobre fondos oscuros)
  badgeBg:   string
  badgeText: string
}

const DEPT_CFG: Record<string, DeptCfg> = {
  'Dirección General':     { fill: '#0D1B2A', darkFill: '#7BA7D4', badgeBg: 'bg-slate-100  dark:bg-slate-800', badgeText: 'text-slate-700  dark:text-slate-300' },
  'IT / Tecnología':       { fill: '#6366F1', darkFill: '#818CF8', badgeBg: 'bg-indigo-100 dark:bg-indigo-900/40', badgeText: 'text-indigo-700 dark:text-indigo-300' },
  'Operaciones':           { fill: '#F97316', darkFill: '#FB923C', badgeBg: 'bg-orange-100 dark:bg-orange-900/40', badgeText: 'text-orange-700 dark:text-orange-300' },
  'Marketing & Comercial': { fill: '#10B981', darkFill: '#34D399', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40', badgeText: 'text-emerald-700 dark:text-emerald-300' },
}

function deptCfg(dept: string): DeptCfg {
  return DEPT_CFG[dept] ?? { fill: '#94A3B8', darkFill: '#CBD5E1', badgeBg: 'bg-gray-100', badgeText: 'text-gray-700' }
}

function deptFill(dept: string, dark: boolean): string {
  const cfg = deptCfg(dept)
  return dark ? cfg.darkFill : cfg.fill
}

// ── Resistencia ───────────────────────────────────────────────

const RES_CFG: Record<ResistanceLevel, { label: string; color: string }> = {
  baja:  { label: 'Resistencia baja',  color: 'text-success-dark bg-success-light' },
  media: { label: 'Resistencia media', color: 'text-warning-dark bg-warning-light' },
  alta:  { label: 'Resistencia alta',  color: 'text-danger-dark  bg-danger-light'  },
}

// ── Posicionamiento de dots ───────────────────────────────────

const DOT_R = 11   // radio normal
const DOT_OFFSET = DOT_R + 6   // distancia perpendicular a la curva

function computeDotPositions(stakeholders: Stakeholder[]): DotPosition[] {
  const bySegment: Record<RogersSegment, Stakeholder[]> = {
    innovators: [], early_adopters: [], early_majority: [], late_majority: [], laggards: [],
  }
  for (const sh of stakeholders) {
    bySegment[getSegment(sh.archetype, sh.resistance)].push(sh)
  }

  const positions: DotPosition[] = []

  for (const seg of SEGMENT_ORDER) {
    const group = bySegment[seg]
    if (group.length === 0) continue

    const { x1, x2 } = SEG_BOUNDS[seg]
    const segW = x2 - x1
    const cx0  = (x1 + x2) / 2
    const below = BELOW_CURVE_SEGS.includes(seg)

    group.forEach((sh, i) => {
      const maxSpread = Math.min(segW * 0.55, 22 * group.length)
      const offsetX = group.length > 1
        ? -maxSpread / 2 + (maxSpread / (group.length - 1)) * i
        : 0

      const cx = cx0 + offsetX
      const curveY = bellY(cx)
      // Abajo de la curva en los segmentos mayoría; arriba en los demás
      const cy = below ? curveY + DOT_OFFSET : curveY - DOT_OFFSET

      positions.push({ stakeholderId: sh.id, segment: seg, cx, cy })
    })
  }

  return positions
}

// ── Gradiente ID seguro ───────────────────────────────────────

function gradId(dept: string): string {
  return `dotGrad3D-${dept.replace(/[\s/&]/g, '')}`
}

// ── TabButton ─────────────────────────────────────────────────

function TabButton({
  active, label, badge, onClick,
}: {
  active:  boolean
  label:   string
  badge?:  string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5',
        active
          ? 'border-navy/50 bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft shadow-sm'
          : 'border-border dark:border-white/10 text-text-muted hover:border-navy/30 hover:text-navy/70',
      ].join(' ')}
    >
      {label}
      {badge && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-navy/15 dark:bg-navy/30 text-navy dark:text-info-soft">
          {badge}
        </span>
      )}
    </button>
  )
}

// ── Condensed Stakeholder Card ────────────────────────────────

function CondensedCard({
  dot, stakeholders, onClose, dark,
}: {
  dot:          DotPosition
  stakeholders: Stakeholder[]
  onClose:      () => void
  dark:         boolean
}) {
  const sh = stakeholders.find(s => s.id === dot.stakeholderId)
  if (!sh) return null

  const arcCfg   = ARCHETYPE_CONFIG[sh.archetype]
  const resCfg   = RES_CFG[sh.resistance]
  const segLabel = SEG_LABELS[dot.segment].label
  const avatarFill = deptFill(sh.department, dark)
  const tip      = arcCfg.interventions[sh.resistance][0]
  const initials = sh.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="relative rounded-xl border border-border dark:border-white/8 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-text-base hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg leading-none"
      >
        ×
      </button>

      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
          style={{ backgroundColor: avatarFill }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-lean-black dark:text-gray-100 text-sm leading-tight">{sh.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{sh.role}</p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wide text-text-subtle bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
              {segLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${deptCfg(sh.department).badgeBg} ${deptCfg(sh.department).badgeText}`}>
              {sh.department}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${arcCfg.badgeBg} ${arcCfg.badgeText}`}>
              {arcCfg.label}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${resCfg.color}`}>
              {resCfg.label}
            </span>
          </div>

          <div className="mt-3 flex gap-2.5 items-start">
            <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-navy/10 dark:bg-navy/25 flex items-center justify-center text-navy dark:text-info-soft">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <p className="text-xs text-text-muted leading-relaxed">{tip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta de Momentum ───────────────────────────────────────

function MomentumCard({ stakeholders }: { stakeholders: Stakeholder[] }) {
  const total = stakeholders.length
  if (total === 0) return null

  // % en segmentos positivos (innovators + early_adopters + early_majority)
  const positive = stakeholders.filter(sh => {
    const seg = getSegment(sh.archetype, sh.resistance)
    return seg === 'innovators' || seg === 'early_adopters' || seg === 'early_majority'
  }).length
  const momentumPct = Math.round((positive / total) * 100)

  // Nivel de momentum
  const momentumLevel =
    momentumPct >= 65 ? { label: 'Alto', color: 'text-success-dark', bg: 'bg-success-light' }
    : momentumPct >= 40 ? { label: 'Medio', color: 'text-warning-dark', bg: 'bg-warning-light' }
    : { label: 'Bajo', color: 'text-danger-dark', bg: 'bg-danger-light' }

  // Riesgo principal: stakeholders con resistencia alta
  const highResistance = stakeholders.filter(sh => sh.resistance === 'alta')
  const topRisk = highResistance.length > 0
    ? `${highResistance.length} stakeholder${highResistance.length > 1 ? 's' : ''} con resistencia alta`
    : 'Sin resistencia crítica detectada'

  // Oportunidad: ambassadors / adoptadores con resistencia baja-media
  const ambassadors = stakeholders.filter(sh =>
    (sh.archetype === 'ambassador' || sh.archetype === 'adoptador') && sh.resistance !== 'alta'
  )
  const topOpp = ambassadors.length > 0
    ? `${ambassadors.length} agente${ambassadors.length > 1 ? 's' : ''} de cambio activos disponibles`
    : 'Identificar nuevos early adopters internos'

  // Segmento con más concentración
  const segCount: Partial<Record<RogersSegment, number>> = {}
  for (const sh of stakeholders) {
    const seg = getSegment(sh.archetype, sh.resistance)
    segCount[seg] = (segCount[seg] ?? 0) + 1
  }
  const topSeg = (Object.entries(segCount) as [RogersSegment, number][])
    .sort((a, b) => b[1] - a[1])[0]
  const topSegLabel = topSeg ? SEG_LABELS[topSeg[0]].label : '—'

  return (
    <div className="w-52 flex-shrink-0 rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 p-4 space-y-4">
      {/* Momentum score */}
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2">Momentum</p>
        <div className="flex items-end gap-1.5 mb-1.5">
          <span className="text-2xl font-bold text-lean-black dark:text-gray-100 tabular-nums leading-none">
            {momentumPct}%
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mb-0.5 ${momentumLevel.bg} ${momentumLevel.color}`}>
            {momentumLevel.label}
          </span>
        </div>
        {/* Barra de progreso */}
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${momentumPct}%`,
              backgroundColor: momentumPct >= 65 ? '#16a34a' : momentumPct >= 40 ? '#d97706' : '#dc2626',
            }}
          />
        </div>
        <p className="text-[10px] text-text-subtle mt-1.5">
          Concentración: <span className="font-medium text-text-muted">{topSegLabel}</span>
        </p>
      </div>

      <div className="border-t border-border dark:border-white/6" />

      {/* Riesgo */}
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2">Riesgo principal</p>
        <div className="flex gap-2 items-start">
          <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-danger-light flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 1L1 7h6L4 1z" stroke="#dc2626" strokeWidth="1.2" strokeLinejoin="round"/>
              <circle cx="4" cy="5.5" r="0.4" fill="#dc2626"/>
            </svg>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">{topRisk}</p>
        </div>
      </div>

      <div className="border-t border-border dark:border-white/6" />

      {/* Oportunidad */}
      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2">Oportunidad</p>
        <div className="flex gap-2 items-start">
          <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-success-light flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4.5l2 2 3-3.5" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">{topOpp}</p>
        </div>
      </div>
    </div>
  )
}

// ── Tab 1: Bell Curve ─────────────────────────────────────────

function BellCurveTab({ stakeholders, dark }: { stakeholders: Stakeholder[]; dark: boolean }) {
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

// ── Tab 2: Recomendaciones por Departamento ───────────────────

function DeptRecommendationsTab({ stakeholders, dark }: { stakeholders: Stakeholder[]; dark: boolean }) {
  const byDept = useMemo(() => {
    const map: Record<string, Stakeholder[]> = {}
    for (const sh of stakeholders) {
      if (!map[sh.department]) map[sh.department] = []
      map[sh.department].push(sh)
    }
    return map
  }, [stakeholders])

  function deptReadiness(deptShs: Stakeholder[]): { label: string; pct: number; color: string } {
    const positives = deptShs.filter(sh => {
      const seg = getSegment(sh.archetype, sh.resistance)
      return seg === 'innovators' || seg === 'early_adopters' || seg === 'early_majority'
    }).length
    const pct = Math.round((positives / deptShs.length) * 100)
    if (pct >= 75) return { label: 'Alta preparación', pct, color: 'text-success-dark bg-success-light' }
    if (pct >= 40) return { label: 'Preparación media', pct, color: 'text-warning-dark bg-warning-light' }
    return { label: 'Preparación baja', pct, color: 'text-danger-dark bg-danger-light' }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Object.entries(byDept).map(([dept, deptShs]) => {
        const fill      = deptFill(dept, dark)
        const readiness = deptReadiness(deptShs)

        const recs = deptShs.flatMap(sh => {
          const arc  = ARCHETYPE_CONFIG[sh.archetype]
          const tips = arc.interventions[sh.resistance]
          return tips.slice(0, 2).map(tip => ({ sh, tip }))
        })
        const seen = new Set<string>()
        const uniqueRecs = recs.filter(r => {
          if (seen.has(r.tip)) return false
          seen.add(r.tip)
          return true
        }).slice(0, 3)

        return (
          <div
            key={dept}
            className="rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: fill }} />
                <div>
                  <p className="font-semibold text-sm text-lean-black dark:text-gray-100">{dept}</p>
                  <p className="text-xs text-text-muted">{deptShs.length} stakeholders</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${readiness.color}`}>
                {readiness.label} · {readiness.pct}%
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {deptShs.map(sh => {
                const arcCfg = ARCHETYPE_CONFIG[sh.archetype]
                const seg    = SEG_LABELS[getSegment(sh.archetype, sh.resistance)].label
                return (
                  <div key={sh.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border dark:border-white/6">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fill }} />
                    <span className="text-xs font-medium text-lean-black dark:text-gray-200">{sh.name}</span>
                    <span className={`text-[10px] px-1.5 rounded-full ${arcCfg.badgeBg} ${arcCfg.badgeText}`}>{arcCfg.label}</span>
                    <span className="text-[10px] text-text-subtle font-mono">{seg}</span>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2.5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">Acciones recomendadas</p>
              {uniqueRecs.map((r, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span
                    className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: fill }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-xs text-text-muted leading-relaxed">{r.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab 3: Plan Global de Gestión del Cambio ──────────────────

const CHANGE_PLAN = [
  {
    phase:     'Mes 1–2',
    title:     'Activar a los agentes de cambio',
    icon:      '⚡',
    objective: 'Construir la masa crítica interna antes del lanzamiento visible.',
    segments:  ['Innovadores', 'Early Adopters'],
    actions: [
      'Identificar y briefar a ambassadors y adoptadores como co-pilotos del sprint.',
      'Realizar sesiones de alineación con los decisores clave — presentar el caso de negocio cuantificado (QW1).',
      'Establecer el grupo de trabajo LEAN con representación de todas las áreas.',
      'Definir el criterio de éxito del piloto junto a cada decisor — ownership desde el día 1.',
    ],
    risk: 'Si los ambassadors no tienen tiempo asignado, el proyecto se ralentizará en Mes 3-4.',
  },
  {
    phase:     'Mes 3–4',
    title:     'Construir evidencia, reducir fricción',
    icon:      '📊',
    objective: 'Generar datos internos de impacto para convertir a la Mayoría Temprana.',
    segments:  ['Early Majority', 'Mayoría Temprana'],
    actions: [
      'Publicar los primeros resultados del piloto con métricas concretas (no titulares, datos reales).',
      'Abordar a los especialistas resistentes individualmente — clarificar su rol en el entorno con IA.',
      'Ejecutar workshop de casos de uso con Operaciones y Dirección General.',
      'Escalar comunicación interna liderada por ambassadors — no por IT o consultores externos.',
    ],
    risk: 'Los críticos intentarán desacreditar resultados parciales. Anticipar con datos, no con narrativa.',
  },
  {
    phase:     'Mes 5–6',
    title:     'Escalar y normalizar',
    icon:      '🚀',
    objective: 'Transición de piloto a operación. La adopción pasa de voluntaria a estructural.',
    segments:  ['Late Majority', 'Laggards'],
    actions: [
      'Integrar el uso de IA en los procesos operativos estándar — no como opción, como flujo habitual.',
      'Revisar los casos de bajo score en T4 con evidencia real del piloto para actualizar prioridades.',
      'Presentar resultados al Comité de Dirección con el T9 Roadmap 6M actualizado.',
      'Diseñar el plan de continuidad post-sprint — quién mantiene la gobernanza del sistema de adopción.',
    ],
    risk: 'Sin un ownership interno claro post-sprint, la adopción se degrada en 3-6 meses.',
  },
]

function ChangeManagementPlanTab() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-text-muted leading-relaxed">
        Plan de gestión del cambio alineado con el sprint L.E.A.N. de 6 meses.
        Cada fase tiene un objetivo de adopción, las acciones concretas y el riesgo principal a gestionar.
      </p>

      {CHANGE_PLAN.map((step, i) => (
        <div key={i} className="rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 text-center">
              <div className="text-2xl">{step.icon}</div>
              <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-navy/10 dark:bg-navy/20 text-navy dark:text-info-soft">
                {step.phase}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lean-black dark:text-gray-100 text-sm">{step.title}</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">{step.objective}</p>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] font-mono text-text-subtle uppercase tracking-wide">Foco:</span>
                {step.segments.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-text-muted font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {step.actions.map((action, j) => (
              <div key={j} className="flex gap-2 items-start">
                <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-navy/10 dark:bg-navy/25 flex items-center justify-center text-[9px] font-bold text-navy dark:text-info-soft">
                  {j + 1}
                </span>
                <p className="text-xs text-text-muted leading-relaxed">{action}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-start p-3 rounded-lg bg-danger-light/30 dark:bg-red-900/15 border border-danger-light dark:border-red-800/30">
            <svg className="flex-shrink-0 mt-0.5 w-3.5 h-3.5 text-danger-dark" fill="none" viewBox="0 0 16 16">
              <path d="M8 2L1 14h14L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 7v3M8 12v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-xs text-danger-dark leading-relaxed">{step.risk}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── T7View — Componente principal ─────────────────────────────

interface T7ViewProps {
  companyName: string
  onBack:      () => void
}

export function T7View({ companyName, onBack }: T7ViewProps) {
  const stakeholders = useT2Store(s => s.stakeholders)
  const { dark }     = useDarkMode()
  const [activeTab, setActiveTab] = useState<'curve' | 'dept' | 'plan'>('curve')

  const segCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sh of stakeholders) {
      const seg = getSegment(sh.archetype, sh.resistance)
      counts[seg] = (counts[seg] ?? 0) + 1
    }
    return counts
  }, [stakeholders])

  const laggardCount = (segCounts['laggards'] ?? 0) + (segCounts['late_majority'] ?? 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-8 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-base transition-colors mb-3"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver al dashboard
          </button>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider bg-navy text-white">
              T7
            </span>
            <div>
              <h1 className="text-lg font-semibold text-lean-black dark:text-gray-100 leading-tight">
                Adoption Heatmap
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-text-muted">{companyName} · Curva de difusión Rogers</p>
                <PhaseMiniMap phaseId="activate" toolCode="T7" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border dark:border-white/6">
            <p className="text-lg font-bold text-lean-black dark:text-gray-100 tabular-nums">{stakeholders.length}</p>
            <p className="text-[10px] text-text-subtle uppercase tracking-wide">Stakeholders</p>
          </div>
          <div className="text-center px-3 py-2 rounded-lg bg-success-light border border-success-light">
            <p className="text-lg font-bold text-success-dark tabular-nums">
              {(segCounts['early_adopters'] ?? 0) + (segCounts['early_majority'] ?? 0)}
            </p>
            <p className="text-[10px] text-success-dark uppercase tracking-wide">Adoptantes</p>
          </div>
          <div className="text-center px-3 py-2 rounded-lg bg-danger-light border border-danger-light">
            <p className="text-lg font-bold text-danger-dark tabular-nums">{laggardCount}</p>
            <p className="text-[10px] text-danger-dark uppercase tracking-wide">Resistentes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <TabButton active={activeTab === 'curve'} label="Curva de adopción" badge={String(stakeholders.length)} onClick={() => setActiveTab('curve')} />
        <TabButton active={activeTab === 'dept'}  label="Por departamento"  badge={String(new Set(stakeholders.map(s => s.department)).size)} onClick={() => setActiveTab('dept')} />
        <TabButton active={activeTab === 'plan'}  label="Plan de cambio"    badge="6M" onClick={() => setActiveTab('plan')} />
      </div>

      {/* Tab content */}
      {stakeholders.length === 0 ? (
        <div className="rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 p-12 text-center">
          <p className="text-sm text-text-muted">
            No hay stakeholders registrados. Completa la T2 — AI Stakeholder Matrix primero.
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'curve' && <BellCurveTab stakeholders={stakeholders} dark={dark} />}
          {activeTab === 'dept'  && <DeptRecommendationsTab stakeholders={stakeholders} dark={dark} />}
          {activeTab === 'plan'  && <ChangeManagementPlanTab />}
        </>
      )}
    </div>
  )
}
