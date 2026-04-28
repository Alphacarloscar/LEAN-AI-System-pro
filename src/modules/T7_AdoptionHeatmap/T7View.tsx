// ============================================================
// T7 — Adoption Heatmap (Curva de Rogers)
//
// Visualiza la distribución de stakeholders en la curva de
// difusión de Rogers (Innovadores → Rezagados).
// Fuente de datos: T2 store (arquetipo + resistencia).
//
// Tab 1: Bell curve SVG + filtro por dpto + tarjeta condensada
// Tab 2: Recomendaciones por departamento
// Tab 3: Plan global de gestión del cambio
// ============================================================

import { useState, useMemo } from 'react'
import { useT2Store }        from '@/modules/T2_StakeholderMatrix/store'
import { ARCHETYPE_CONFIG }  from '@/modules/T2_StakeholderMatrix/constants'
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

// Segmento base por arquetipo (sin modificar por resistencia)
const ARCHETYPE_BASE_SEG: Record<ArchetypeCode, RogersSegment> = {
  adoptador:    'early_adopters',
  ambassador:   'early_majority',
  decisor:      'early_majority',
  especialista: 'late_majority',
  critico:      'laggards',
}

/** Resistencia alta desplaza un segmento a la derecha */
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
const BASELINE  = 240
const AMPLITUDE = 180
const MU        = 400    // pico en x=400 (entre Early y Late Majority)
const SIGMA     = 160

function bellY(x: number): number {
  return BASELINE - AMPLITUDE * Math.exp(-((x - MU) ** 2) / (2 * SIGMA ** 2))
}

// Límites x de cada segmento (proporcional a % de población Rogers)
const SEG_BOUNDS: Record<RogersSegment, { x1: number; x2: number }> = {
  innovators:     { x1: 0,   x2: 20  },  // 2.5%
  early_adopters: { x1: 20,  x2: 128 },  // 13.5%
  early_majority: { x1: 128, x2: 400 },  // 34%
  late_majority:  { x1: 400, x2: 672 },  // 34%
  laggards:       { x1: 672, x2: 800 },  // 16%
}

const SEG_LABELS: Record<RogersSegment, { label: string; pct: string; bg: string; border: string }> = {
  innovators:     { label: 'Innovadores',    pct: '2.5%',  bg: '#EFF6FF', border: '#BFDBFE' },
  early_adopters: { label: 'Early Adopters', pct: '13.5%', bg: '#F0FDF4', border: '#86EFAC' },
  early_majority: { label: 'Mayoría Temp.',  pct: '34%',   bg: '#FEFCE8', border: '#FDE047' },
  late_majority:  { label: 'Mayoría Tardía', pct: '34%',   bg: '#FFF7ED', border: '#FDBA74' },
  laggards:       { label: 'Rezagados',      pct: '16%',   bg: '#F9FAFB', border: '#D1D5DB' },
}

// Construye el path SVG relleno de la curva
function buildBellFillPath(): string {
  const pts: string[] = []
  for (let x = 0; x <= W; x += 4) {
    pts.push(`${x.toFixed(1)},${bellY(x).toFixed(1)}`)
  }
  return `M ${pts.join(' L ')} L ${W},${BASELINE} L 0,${BASELINE} Z`
}

// Construye solo la línea de la curva (stroke)
function buildBellStrokePath(): string {
  const pts: string[] = []
  for (let x = 0; x <= W; x += 4) {
    pts.push(`${x.toFixed(1)},${bellY(x).toFixed(1)}`)
  }
  return `M ${pts.join(' L ')}`
}

const BELL_FILL   = buildBellFillPath()
const BELL_STROKE = buildBellStrokePath()

// ── Departamentos ─────────────────────────────────────────────

interface DeptCfg {
  fill:      string
  badgeBg:   string
  badgeText: string
}

const DEPT_CFG: Record<string, DeptCfg> = {
  'Dirección General':     { fill: '#0D1B2A', badgeBg: 'bg-slate-100  dark:bg-slate-800', badgeText: 'text-slate-700  dark:text-slate-300' },
  'IT / Tecnología':       { fill: '#6366F1', badgeBg: 'bg-indigo-100 dark:bg-indigo-900/40', badgeText: 'text-indigo-700 dark:text-indigo-300' },
  'Operaciones':           { fill: '#F97316', badgeBg: 'bg-orange-100 dark:bg-orange-900/40', badgeText: 'text-orange-700 dark:text-orange-300' },
  'Marketing & Comercial': { fill: '#10B981', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40', badgeText: 'text-emerald-700 dark:text-emerald-300' },
}

function deptCfg(dept: string): DeptCfg {
  return DEPT_CFG[dept] ?? { fill: '#94A3B8', badgeBg: 'bg-gray-100', badgeText: 'text-gray-700' }
}

// ── Resistencia ───────────────────────────────────────────────

const RES_CFG: Record<ResistanceLevel, { label: string; color: string }> = {
  baja:  { label: 'Resistencia baja',  color: 'text-success-dark bg-success-light' },
  media: { label: 'Resistencia media', color: 'text-warning-dark bg-warning-light' },
  alta:  { label: 'Resistencia alta',  color: 'text-danger-dark  bg-danger-light'  },
}

// ── Posicionamiento de dots ───────────────────────────────────

function computeDotPositions(stakeholders: Stakeholder[]): DotPosition[] {
  // Agrupar por segmento
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
    const segW  = x2 - x1
    const cx0   = (x1 + x2) / 2

    group.forEach((sh, i) => {
      // Distribuir horizontalmente dentro del segmento
      const maxSpread = Math.min(segW * 0.55, 25 * group.length)
      const offsetX = group.length > 1
        ? -maxSpread / 2 + (maxSpread / (group.length - 1)) * i
        : 0

      const cx = cx0 + offsetX
      // Colocar el dot 14px por encima de la curva
      const cy = bellY(cx) - 14

      positions.push({ stakeholderId: sh.id, segment: seg, cx, cy })
    })
  }

  return positions
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
  dot, stakeholders, onClose,
}: {
  dot:          DotPosition
  stakeholders: Stakeholder[]
  onClose:      () => void
}) {
  const sh      = stakeholders.find(s => s.id === dot.stakeholderId)
  if (!sh) return null

  const arcCfg  = ARCHETYPE_CONFIG[sh.archetype]
  const resCfg  = RES_CFG[sh.resistance]
  const dc      = deptCfg(sh.department)
  const segLabel = SEG_LABELS[dot.segment].label
  const tip     = arcCfg.interventions[sh.resistance][0]
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
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
          style={{ backgroundColor: dc.fill }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          {/* Nombre + segmento */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-lean-black dark:text-gray-100 text-sm leading-tight">{sh.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{sh.role}</p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wide text-text-subtle bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
              {segLabel}
            </span>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${dc.badgeBg} ${dc.badgeText}`}>
              {sh.department}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${arcCfg.badgeBg} ${arcCfg.badgeText}`}>
              {arcCfg.label}
            </span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${resCfg.color}`}>
              {resCfg.label}
            </span>
          </div>

          {/* Intervención recomendada */}
          <div className="mt-3 flex gap-2.5 items-start">
            <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-navy/10 dark:bg-navy/25 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5 2l3 3-3 3" stroke="#0D1B2A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <p className="text-xs text-text-muted leading-relaxed">{tip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab 1: Bell Curve ─────────────────────────────────────────

function BellCurveTab({
  stakeholders,
}: {
  stakeholders: Stakeholder[]
}) {
  const [activeDepts, setActiveDepts] = useState<Set<string>>(
    () => new Set(stakeholders.map(s => s.department))
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Lista de departamentos únicos
  const depts = useMemo(
    () => [...new Set(stakeholders.map(s => s.department))],
    [stakeholders]
  )

  // Posiciones de todos los dots (todos, no solo visibles)
  const allDots = useMemo(
    () => computeDotPositions(stakeholders),
    [stakeholders]
  )

  // Dot del stakeholder seleccionado
  const selectedDot = useMemo(
    () => allDots.find(d => d.stakeholderId === selectedId) ?? null,
    [allDots, selectedId]
  )

  function toggleDept(dept: string) {
    setActiveDepts(prev => {
      const next = new Set(prev)
      if (next.has(dept)) { next.delete(dept) } else { next.add(dept) }
      return next
    })
  }

  // Contar por segmento
  const countBySeg = useMemo(() => {
    const counts: Record<RogersSegment, number> = {
      innovators: 0, early_adopters: 0, early_majority: 0, late_majority: 0, laggards: 0,
    }
    for (const sh of stakeholders) {
      counts[getSegment(sh.archetype, sh.resistance)]++
    }
    return counts
  }, [stakeholders])

  return (
    <div className="space-y-5">

      {/* Filtros por departamento */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mr-1">
          Filtrar por dpto.
        </span>
        {depts.map(dept => {
          const cfg     = deptCfg(dept)
          const active  = activeDepts.has(dept)
          return (
            <button
              key={dept}
              onClick={() => toggleDept(dept)}
              className={[
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 border',
                active
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-transparent text-text-muted border-border dark:border-white/10 hover:border-current',
              ].join(' ')}
              style={active ? { backgroundColor: cfg.fill, borderColor: cfg.fill } : { color: cfg.fill }}
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-white/60' : ''}`}
                style={!active ? { backgroundColor: cfg.fill } : undefined}
              />
              {dept}
            </button>
          )
        })}
      </div>

      {/* SVG Bell Curve */}
      <div className="rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 overflow-hidden">
        <svg
          viewBox={`0 0 ${W} 290`}
          className="w-full"
          style={{ height: 'auto' }}
          aria-label="Curva de difusión de Rogers — distribución de stakeholders"
        >
          <defs>
            {/* Clip path para fondo de la curva */}
            <clipPath id="t7-bell-clip">
              <path d={BELL_FILL} />
            </clipPath>
          </defs>

          {/* Fondos de segmento */}
          {SEGMENT_ORDER.map(seg => {
            const { x1, x2 } = SEG_BOUNDS[seg]
            const cfg = SEG_LABELS[seg]
            return (
              <rect
                key={seg}
                x={x1} y={0}
                width={x2 - x1} height={260}
                fill={cfg.bg}
                opacity={0.7}
              />
            )
          })}

          {/* Divisores de segmento */}
          {[20, 128, 400, 672].map(x => (
            <line
              key={x}
              x1={x} y1={0} x2={x} y2={250}
              stroke="#CBD5E1"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          ))}

          {/* Bell curve fill (blanco semi-transparente) */}
          <path
            d={BELL_FILL}
            fill="rgba(255,255,255,0.55)"
          />

          {/* Bell curve stroke */}
          <path
            d={BELL_STROKE}
            fill="none"
            stroke="#475569"
            strokeWidth={2}
          />

          {/* Baseline */}
          <line x1={0} y1={BASELINE} x2={W} y2={BASELINE} stroke="#CBD5E1" strokeWidth={1} />

          {/* Etiquetas de segmento */}
          {SEGMENT_ORDER.map(seg => {
            const { x1, x2 } = SEG_BOUNDS[seg]
            const cx    = (x1 + x2) / 2
            const cfg   = SEG_LABELS[seg]
            const count = countBySeg[seg]
            return (
              <g key={seg}>
                <text
                  x={cx} y={13}
                  textAnchor="middle"
                  fontSize={seg === 'innovators' ? 6 : 8.5}
                  fontWeight="600"
                  fill="#475569"
                  fontFamily="ui-monospace, monospace"
                >
                  {cfg.label}
                </text>
                <text
                  x={cx} y={24}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#94A3B8"
                  fontFamily="ui-monospace, monospace"
                >
                  {cfg.pct}
                </text>
                {count > 0 && (
                  <text
                    x={cx} y={257}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#64748B"
                    fontFamily="sans-serif"
                  >
                    {count} persona{count !== 1 ? 's' : ''}
                  </text>
                )}
              </g>
            )
          })}

          {/* Dots */}
          {allDots.map(dot => {
            const sh       = stakeholders.find(s => s.id === dot.stakeholderId)
            if (!sh) return null
            const isVisible  = activeDepts.has(sh.department)
            const isSelected = selectedId === sh.id
            const fill       = deptCfg(sh.department).fill
            const initials   = sh.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

            return (
              <g
                key={dot.stakeholderId}
                onClick={() => setSelectedId(isSelected ? null : sh.id)}
                style={{ cursor: 'pointer' }}
                opacity={isVisible ? 1 : 0.15}
              >
                <circle
                  cx={dot.cx}
                  cy={dot.cy}
                  r={isSelected ? 16 : 13}
                  fill={fill}
                  stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.8)'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  style={{ transition: 'r 0.15s, stroke-width 0.15s' }}
                />
                <text
                  x={dot.cx}
                  y={dot.cy + 4}
                  textAnchor="middle"
                  fontSize={9}
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

      {/* Tarjeta condensada — aparece al hacer click en un dot */}
      {selectedDot && (
        <CondensedCard
          dot={selectedDot}
          stakeholders={stakeholders}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Leyenda de departamentos */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">Leyenda</span>
        {depts.map(dept => {
          const cfg = deptCfg(dept)
          return (
            <div key={dept} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.fill }} />
              <span className="text-xs text-text-muted">{dept}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab 2: Recomendaciones por Departamento ───────────────────

function DeptRecommendationsTab({ stakeholders }: { stakeholders: Stakeholder[] }) {
  // Agrupar por departamento
  const byDept = useMemo(() => {
    const map: Record<string, Stakeholder[]> = {}
    for (const sh of stakeholders) {
      if (!map[sh.department]) map[sh.department] = []
      map[sh.department].push(sh)
    }
    return map
  }, [stakeholders])

  // Calcular readiness por departamento (% en segmentos "positivos")
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
        const cfg       = deptCfg(dept)
        const readiness = deptReadiness(deptShs)

        // Recomendaciones: primera intervención de cada stakeholder según arquetipo+resistencia
        const recs = deptShs.flatMap(sh => {
          const arc  = ARCHETYPE_CONFIG[sh.archetype]
          const tips = arc.interventions[sh.resistance]
          return tips.slice(0, 2).map(tip => ({ sh, tip }))
        })
        // Deduplicate keeping first occurrence
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
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: cfg.fill }}
                />
                <div>
                  <p className="font-semibold text-sm text-lean-black dark:text-gray-100">{dept}</p>
                  <p className="text-xs text-text-muted">{deptShs.length} stakeholders</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${readiness.color}`}>
                {readiness.label} · {readiness.pct}%
              </span>
            </div>

            {/* Stakeholders mini-list */}
            <div className="flex flex-wrap gap-2 mb-4">
              {deptShs.map(sh => {
                const arcCfg = ARCHETYPE_CONFIG[sh.archetype]
                const seg    = SEG_LABELS[getSegment(sh.archetype, sh.resistance)].label
                return (
                  <div
                    key={sh.id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border dark:border-white/6"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cfg.fill }}
                    />
                    <span className="text-xs font-medium text-lean-black dark:text-gray-200">{sh.name}</span>
                    <span className={`text-[10px] px-1.5 rounded-full ${arcCfg.badgeBg} ${arcCfg.badgeText}`}>
                      {arcCfg.label}
                    </span>
                    <span className="text-[10px] text-text-subtle font-mono">{seg}</span>
                  </div>
                )
              })}
            </div>

            {/* Recomendaciones */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                Acciones recomendadas
              </p>
              {uniqueRecs.map((r, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span
                    className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: cfg.fill }}
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
    risk:      'Si los ambassadors no tienen tiempo asignado, el proyecto se ralentizará en Mes 3-4.',
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
    risk:      'Los críticos intentarán desacreditar resultados parciales. Anticipar con datos, no con narrativa.',
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
    risk:      'Sin un ownership interno claro post-sprint, la adopción se degrada en 3-6 meses.',
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
        <div
          key={i}
          className="rounded-xl border border-border dark:border-white/6 bg-white dark:bg-gray-900 p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            {/* Phase badge */}
            <div className="flex-shrink-0 text-center">
              <div className="text-2xl">{step.icon}</div>
              <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-navy/10 dark:bg-navy/20 text-navy dark:text-info-soft">
                {step.phase}
              </span>
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-lean-black dark:text-gray-100 text-sm">{step.title}</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">{step.objective}</p>

              {/* Target segments */}
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

          {/* Actions */}
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

          {/* Risk */}
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
  const [activeTab, setActiveTab] = useState<'curve' | 'dept' | 'plan'>('curve')

  // Conteos para los badges de tabs
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
              <p className="text-xs text-text-muted">{companyName} · Curva de difusión Rogers</p>
            </div>
          </div>
        </div>

        {/* Stats summary */}
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
        <TabButton
          active={activeTab === 'curve'}
          label="Curva de adopción"
          badge={String(stakeholders.length)}
          onClick={() => setActiveTab('curve')}
        />
        <TabButton
          active={activeTab === 'dept'}
          label="Por departamento"
          badge={String(new Set(stakeholders.map(s => s.department)).size)}
          onClick={() => setActiveTab('dept')}
        />
        <TabButton
          active={activeTab === 'plan'}
          label="Plan de cambio"
          badge="6M"
          onClick={() => setActiveTab('plan')}
        />
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
          {activeTab === 'curve' && (
            <BellCurveTab stakeholders={stakeholders} />
          )}
          {activeTab === 'dept' && (
            <DeptRecommendationsTab stakeholders={stakeholders} />
          )}
          {activeTab === 'plan' && (
            <ChangeManagementPlanTab />
          )}
        </>
      )}
    </div>
  )
}
