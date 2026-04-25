// ============================================================
// T4 — Use Case Priority Board
//
// Layout: 3 zonas verticales
//   1. HERO — Priority Matrix (X=facilidad, Y=impacto KPI)
//             + Status Donut (distribución por estado)
//   2. BANNER — Filtros por estado + cards de casos de uso
//   3. DETALLE — Panel expansible al seleccionar un caso
//      Tabs: Scoring | Hoja de ruta | Contexto T1/T2
//
// Sprint 2 MVP: datos en Zustand (persist local).
// Sprint 3+: Supabase tabla `use_cases`.
// ============================================================

import { useState, useMemo } from 'react'
import { useNavigate }       from 'react-router-dom'
import { useT4Store }        from './store'
import {
  STATUS_CONFIG,
  STATUS_ORDER,
  DIMENSION_CONFIG,
  PRIORITY_QUADRANTS,
  AI_CATEGORY_LABELS,
  AI_CATEGORY_HEX,
  computePriorityScore,
  getGoNoGoRecommendation,
} from './constants'
import { ImportFromT3Modal } from './components/ImportFromT3Modal'
import type { UseCase, UseCaseStatus, UseCaseScores } from './types'

// ── Badges ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: UseCaseStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const label = AI_CATEGORY_LABELS[category] ?? category
  const hex   = AI_CATEGORY_HEX[category]    ?? '#94A3B8'
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ backgroundColor: `${hex}22`, color: hex }}
    >
      {label.split(' ')[0]}
    </span>
  )
}

// ── Colores del score ─────────────────────────────────────────

function priorityScoreColor(score: number): string {
  if (score >= 75) return 'text-success-dark'
  if (score >= 55) return 'text-warning-dark'
  return 'text-danger-dark'
}

// ── HERO CHART 1: Priority Matrix ─────────────────────────────
// X = feasibility (0-1), Y = kpiImpact (0-1)
// Dots colored by status. Quadrant threshold: 0.60.

function HeroPriorityMatrix({
  useCases,
  activeId,
  onSelect,
}: {
  useCases: UseCase[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const S  = 320
  const P  = 36
  const IN = S - P * 2

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <clipPath id="t4hero-clip">
          <rect x={P} y={P} width={IN} height={IN} rx={6} />
        </clipPath>
        {useCases.map((uc) => {
          const hex = STATUS_CONFIG[uc.status].hex
          return (
            <radialGradient key={`glow-${uc.id}`} id={`t4glow-${uc.id}`}
              cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={hex} stopOpacity="0.35" />
              <stop offset="100%" stopColor={hex} stopOpacity="0" />
            </radialGradient>
          )
        })}
      </defs>

      {/* Quadrant fills */}
      <g clipPath="url(#t4hero-clip)">
        <rect x={P}           y={P}           width={IN * 0.6} height={IN * 0.6} fill="#6A90C0" opacity={0.04} />
        <rect x={P + IN * 0.6} y={P}          width={IN * 0.4} height={IN * 0.6} fill="#5FAF8A" opacity={0.06} />
        <rect x={P}           y={P + IN * 0.6} width={IN * 0.6} height={IN * 0.4} fill="#E5E7EB" opacity={0.03} />
        <rect x={P + IN * 0.6} y={P + IN * 0.6} width={IN * 0.4} height={IN * 0.4} fill="#9AAEC8" opacity={0.04} />
      </g>

      {/* Grid border */}
      <rect x={P} y={P} width={IN} height={IN} rx={6} fill="none"
        stroke="#E5E7EB" strokeWidth={1} />

      {/* Dividers at threshold 0.60 */}
      <line x1={P + IN * 0.6} y1={P} x2={P + IN * 0.6} y2={P + IN}
        stroke="#E5E7EB" strokeWidth={0.8} strokeDasharray="3 3" />
      <line x1={P} y1={P + IN * 0.4} x2={P + IN} y2={P + IN * 0.4}
        stroke="#E5E7EB" strokeWidth={0.8} strokeDasharray="3 3" />

      {/* Quadrant labels */}
      {PRIORITY_QUADRANTS.map((q, i) => (
        <text key={i}
          x={P + q.qx * IN} y={P + q.qy * IN}
          fontSize={7} fill={q.color} opacity={0.80}
          fontFamily="ui-monospace,monospace" letterSpacing="0.06em" fontWeight="700">
          {q.text}
        </text>
      ))}

      {/* Axis labels */}
      <text x={P + IN / 2} y={P - 12} fontSize={8} fill="#9CA3AF"
        fontFamily="ui-monospace,monospace" textAnchor="middle" letterSpacing="0.08em">
        FACILIDAD →
      </text>
      <text
        x={P - 14} y={P + IN / 2}
        fontSize={8} fill="#9CA3AF"
        fontFamily="ui-monospace,monospace"
        textAnchor="middle"
        letterSpacing="0.08em"
        transform={`rotate(-90, ${P - 14}, ${P + IN / 2})`}
      >
        IMPACTO KPI ↑
      </text>

      {/* Use case dots */}
      {useCases.map((uc) => {
        const x        = P + (uc.scores.feasibility / 5) * IN
        const y        = P + (1 - uc.scores.kpiImpact / 5) * IN
        const hex      = STATUS_CONFIG[uc.status].hex
        const isActive = uc.id === activeId
        const r        = isActive ? 9 : 7

        return (
          <g key={uc.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(uc.id)}>
            <circle cx={x} cy={y} r={r * 3.5} fill={`url(#t4glow-${uc.id})`} />
            <circle cx={x} cy={y} r={r * 1.8} fill={hex}
              opacity={isActive ? 0.25 : 0.12} />
            <circle cx={x} cy={y} r={r} fill={hex}
              opacity={isActive ? 1 : 0.85}
              stroke={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
              strokeWidth={isActive ? 1.5 : 0.8} />
            <ellipse cx={x - r * 0.22} cy={y - r * 0.30}
              rx={r * 0.38} ry={r * 0.22}
              fill="#fff" opacity={0.40} />
          </g>
        )
      })}
    </svg>
  )
}

// ── HERO CHART 2: Status Donut ────────────────────────────────

function HeroStatusDonut({
  useCases,
  activeId,
  onSelect,
}: {
  useCases: UseCase[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const VB = 480, CX = 240, CY = 240
  const R_OUTER = 152, R_INNER = 58
  const total   = useCases.length

  const statusData = useMemo(() => STATUS_ORDER
    .map((st) => ({
      st,
      count: useCases.filter((uc) => uc.status === st).length,
      ucs:   useCases.filter((uc) => uc.status === st),
    }))
    .filter((d) => d.count > 0),
  [useCases])

  if (total === 0) {
    return (
      <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" style={{ display: 'block' }}>
        <text x={CX} y={CY + 5} textAnchor="middle" fontSize={13}
          fill="#94A3B8" fontFamily="ui-monospace,monospace">
          Sin casos de uso
        </text>
      </svg>
    )
  }

  const GAP_RAD = statusData.length > 1 ? 0.03 : 0
  let currentAngle = -Math.PI / 2

  const arcs = statusData.map(({ st, count, ucs }) => {
    const fraction   = count / total
    const arcSpan    = fraction * 2 * Math.PI - GAP_RAD
    const startAngle = currentAngle + GAP_RAD / 2
    const endAngle   = startAngle + arcSpan
    currentAngle    += fraction * 2 * Math.PI
    const midAngle   = (startAngle + endAngle) / 2
    return { st, count, ucs, startAngle, endAngle, midAngle }
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

  const goCount  = useCases.filter((uc) => uc.status === 'go').length
  const noGoCount = useCases.filter((uc) => uc.status === 'no_go').length

  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} width="100%"
      style={{ display: 'block', overflow: 'visible' }}
      className="text-lean-black dark:text-gray-100">

      <circle cx={CX} cy={CY} r={R_OUTER} fill="none"
        stroke="rgba(148,163,184,0.28)" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={R_INNER} fill="none"
        stroke="rgba(148,163,184,0.18)" strokeWidth={0.6} />
      {[75, 100, 126].map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r}
          fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={0.6} />
      ))}

      {arcs.map(({ st, count, ucs, startAngle, endAngle, midAngle }) => {
        const hex = STATUS_CONFIG[st].hex
        const cfg = STATUS_CONFIG[st]

        const labelR = R_OUTER + 24
        const lx     = CX + labelR * Math.cos(midAngle)
        const ly     = CY + labelR * Math.sin(midAngle)
        const cosM   = Math.cos(midAngle)
        const anchor = cosM < -0.2 ? 'end' : cosM > 0.2 ? 'start' : 'middle'

        const dots = ucs.map((uc, i) => {
          const frac   = ucs.length > 1 ? (i + 0.5) / ucs.length : 0.5
          const dotAng = startAngle + frac * (endAngle - startAngle)
          const pct    = 0.15 + (uc.priorityScore / 100) * 0.70
          const dotR   = R_INNER + pct * (R_OUTER - R_INNER)
          return {
            id: uc.id,
            cx: CX + dotR * Math.cos(dotAng),
            cy: CY + dotR * Math.sin(dotAng),
            hex,
          }
        })

        return (
          <g key={st}>
            <path d={arcPath(startAngle, endAngle, R_OUTER, R_INNER)}
              fill={hex} opacity={0.18} />
            <path d={arcPath(startAngle, endAngle, R_OUTER, R_INNER)}
              fill="none" stroke={hex} strokeWidth={1} opacity={0.55} />

            {dots.map((dot) => {
              const isActive = dot.id === activeId
              return (
                <g key={dot.id} style={{ cursor: 'pointer' }}
                  onClick={() => onSelect(dot.id)}>
                  {isActive && (
                    <>
                      <circle cx={dot.cx} cy={dot.cy} r={18}
                        fill={dot.hex} opacity={0.10} />
                      <circle cx={dot.cx} cy={dot.cy} r={13}
                        fill={dot.hex} opacity={0.18} />
                    </>
                  )}
                  <circle cx={dot.cx} cy={dot.cy} r={isActive ? 12 : 10}
                    fill={dot.hex} opacity={isActive ? 0.28 : 0.15} />
                  <circle cx={dot.cx} cy={dot.cy} r={isActive ? 9 : 7}
                    fill={dot.hex} opacity={0.92}
                    stroke={isActive ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.50)'}
                    strokeWidth={isActive ? 2 : 0.8} />
                  <ellipse cx={dot.cx - 2} cy={dot.cy - 2}
                    rx={2.5} ry={1.5} fill="rgba(255,255,255,0.55)" />
                </g>
              )
            })}

            <text
              x={CX + (R_INNER + (R_OUTER - R_INNER) * 0.80) * Math.cos(midAngle)}
              y={CY + (R_INNER + (R_OUTER - R_INNER) * 0.80) * Math.sin(midAngle) + 4}
              textAnchor="middle" fontSize={11} fontWeight="700"
              fill={hex} fontFamily="ui-monospace,monospace"
            >
              {count}
            </text>

            <text x={lx} y={ly} textAnchor={anchor}
              fontSize={8} fontWeight="700"
              fill={hex} fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
              {cfg.label.toUpperCase()}
            </text>
          </g>
        )
      })}

      {/* Center text */}
      <text x={CX} y={CY - 18} textAnchor="middle"
        fontSize={7.5} fill="#94A3B8"
        fontFamily="ui-monospace,monospace" letterSpacing="0.10em">
        CASOS DE USO
      </text>
      <text x={CX} y={CY + 22} textAnchor="middle"
        fontSize={26} fontWeight="700"
        fill="currentColor"
        fontFamily="ui-monospace,monospace">
        {total}
      </text>
      <text x={CX} y={CY + 38} textAnchor="middle"
        fontSize={8} fill="#5FAF8A"
        fontFamily="ui-monospace,monospace" letterSpacing="0.06em">
        {goCount} GO
      </text>
      {noGoCount > 0 && (
        <text x={CX} y={CY + 52} textAnchor="middle"
          fontSize={8} fill="#C06060"
          fontFamily="ui-monospace,monospace" letterSpacing="0.06em">
          {noGoCount} NO-GO
        </text>
      )}
    </svg>
  )
}

// ── Score bars T4 ─────────────────────────────────────────────

const T4_SCORE_BARS = [
  { key: 'kpiImpact',      cfg: DIMENSION_CONFIG.kpiImpact },
  { key: 'feasibility',    cfg: DIMENSION_CONFIG.feasibility },
  { key: 'aiRisk',         cfg: DIMENSION_CONFIG.aiRisk },
  { key: 'dataDependency', cfg: DIMENSION_CONFIG.dataDependency },
] as const

function T4ScoreBars({
  scores,
  trackWidth = 200,
}: {
  scores: UseCaseScores
  trackWidth?: number
}) {
  const MAX   = 5
  const LBL_W = 108, G1 = 8, TRACK_W = trackWidth, G2 = 8, VAL_COL = 28
  const VBW   = LBL_W + G1 + TRACK_W + G2 + VAL_COL
  const TX    = LBL_W + G1
  const ROW_H = 36, VBH = T4_SCORE_BARS.length * ROW_H + 8
  const values = [
    scores.kpiImpact,
    scores.feasibility,
    scores.aiRisk,
    scores.dataDependency,
  ]

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {T4_SCORE_BARS.map(({ key, cfg }, i) => {
          const fillW = Math.max((values[i] / MAX) * TRACK_W, 2)
          return (
            <linearGradient key={key} id={`t4sb-${key}`}
              x1={TX} y1="0" x2={TX + fillW} y2="0"
              gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor={cfg.hex}   stopOpacity="0.15" />
              <stop offset="30%"  stopColor={cfg.hex}   stopOpacity="0.92" />
              <stop offset="58%"  stopColor={cfg.light} stopOpacity="1" />
              <stop offset="85%"  stopColor={cfg.hex}   stopOpacity="0.80" />
              <stop offset="100%" stopColor={cfg.hex}   stopOpacity="0.40" />
            </linearGradient>
          )
        })}
      </defs>
      {T4_SCORE_BARS.map(({ key, cfg }, i) => {
        const val   = values[i]
        const fillW = Math.max((val / MAX) * TRACK_W, 2)
        const cy    = i * ROW_H + ROW_H / 2 + 3

        // Para dimensiones negativas (risk, dep), mostrar indicador invertido
        const isNegative = cfg.direction === 'negative'
        const scaleLabel = cfg.scaleLabels[Math.round(val) - 1] ?? ''

        return (
          <g key={key}>
            <text x={0} y={cy - 2} fontSize={7.5} fill="#64748B"
              fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
              {cfg.label}
            </text>
            <text x={0} y={cy + 8} fontSize={6.5} fill="#94A3B8"
              fontFamily="ui-monospace,monospace" letterSpacing="0.02em">
              {scaleLabel}{isNegative ? ' ↑ riesgo' : ''}
            </text>
            <rect x={TX} y={cy - 0.4} width={TRACK_W} height={0.8}
              fill={cfg.hex} opacity={0.08} rx={0.4} />
            <rect x={TX} y={cy - 3.5} width={fillW} height={7}
              fill={cfg.hex} opacity={0.10} rx={3.5} />
            <rect x={TX} y={cy - 1.5} width={fillW} height={3}
              fill={`url(#t4sb-${key})`} rx={1.5} />
            <rect x={TX + fillW * 0.08} y={cy - 2}
              width={fillW * 0.45} height={0.7}
              fill={cfg.light} opacity={0.60} rx={0.35} />
            <text x={TX + TRACK_W + G2} y={cy + 3}
              fontSize={8} fontWeight="600" fill="#94A3B8"
              fontFamily="ui-monospace,monospace">
              {val.toFixed(1)}<tspan fontSize={6.5} opacity={0.5}>/5</tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Mini mapa de posición para el panel de detalle ────────────

function DetailPositionMap({
  kpiImpact,
  feasibility,
  status,
  size = 200,
}: {
  kpiImpact:   number
  feasibility: number
  status:      UseCaseStatus
  size?:       number
}) {
  const S = size, P = Math.round(S * 0.10), IN = S - P * 2
  const dx  = P + (feasibility / 5) * IN
  const dy  = P + (1 - kpiImpact / 5) * IN
  const hex = STATUS_CONFIG[status].hex
  const r   = S * 0.048

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ display: 'block' }}>
      <defs>
        <clipPath id="t4detail-clip">
          <rect x={P} y={P} width={IN} height={IN} rx={5} />
        </clipPath>
        <radialGradient id="t4detail-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={hex} stopOpacity="0.40" />
          <stop offset="100%" stopColor={hex} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath="url(#t4detail-clip)">
        <rect x={P}              y={P}              width={IN * 0.6} height={IN * 0.4} fill="#6A90C0" opacity={0.04} />
        <rect x={P + IN * 0.6}   y={P}              width={IN * 0.4} height={IN * 0.4} fill="#5FAF8A" opacity={0.06} />
        <rect x={P}              y={P + IN * 0.4}   width={IN * 0.6} height={IN * 0.6} fill="#E5E7EB" opacity={0.03} />
        <rect x={P + IN * 0.6}   y={P + IN * 0.4}   width={IN * 0.4} height={IN * 0.6} fill="#9AAEC8" opacity={0.04} />
      </g>

      <rect x={P} y={P} width={IN} height={IN} rx={5} fill="none"
        stroke="#E5E7EB" strokeWidth={1} />
      <line x1={P + IN * 0.6} y1={P} x2={P + IN * 0.6} y2={P + IN}
        stroke="#E5E7EB" strokeWidth={0.6} strokeDasharray="3 3" />
      <line x1={P} y1={P + IN * 0.4} x2={P + IN} y2={P + IN * 0.4}
        stroke="#E5E7EB" strokeWidth={0.6} strokeDasharray="3 3" />

      {PRIORITY_QUADRANTS.map((q, i) => (
        <text key={i}
          x={P + q.qx * IN} y={P + q.qy * IN}
          fontSize={S * 0.045} fill={q.color} opacity={0.75}
          fontFamily="ui-monospace,monospace" letterSpacing="0.03em">
          {q.text.split(' ')[0]}
        </text>
      ))}

      <circle cx={dx} cy={dy} r={r * 3.5} fill="url(#t4detail-glow)" />
      <circle cx={dx} cy={dy} r={r * 1.8} fill={hex} opacity={0.20} />
      <circle cx={dx} cy={dy} r={r}       fill={hex}
        stroke="#fff" strokeWidth={1.5} />
      <ellipse cx={dx - r * 0.22} cy={dy - r * 0.30}
        rx={r * 0.40} ry={r * 0.22}
        fill="#fff" opacity={0.42} />
      <line x1={P} y1={dy} x2={dx - r} y2={dy}
        stroke={hex} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
      <line x1={dx} y1={P + IN} x2={dx} y2={dy + r}
        stroke={hex} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
    </svg>
  )
}

// ── Panel de scoring inline (edición de scores) ───────────────

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label:    string
  value:    number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-[10px] font-mono text-text-subtle w-32 shrink-0">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={[
              'h-6 w-6 rounded-lg text-[10px] font-bold transition-all',
              Math.round(value) === n
                ? 'bg-navy text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs font-bold text-lean-black dark:text-gray-200 tabular-nums w-6">
        {value.toFixed(0)}
      </span>
    </div>
  )
}

// ── Panel de detalle del caso de uso ─────────────────────────

type DetailTab = 'scoring' | 'roadmap' | 'contexto'

function UseCaseDetailPanel({ useCase }: { useCase: UseCase }) {
  const { updateUseCase, recalcScore } = useT4Store()
  const [tab, setTab]                 = useState<DetailTab>('scoring')
  const [editingScore, setEditingScore] = useState(false)
  const [localScores, setLocalScores]  = useState<UseCaseScores>(useCase.scores)

  const recommendation = getGoNoGoRecommendation(useCase.priorityScore)
  const catHex         = AI_CATEGORY_HEX[useCase.aiCategory] ?? '#94A3B8'

  function handleSaveScores() {
    updateUseCase(useCase.id, { scores: localScores })
    recalcScore(useCase.id)
    setEditingScore(false)
  }

  function handleScoreChange(dim: keyof UseCaseScores, v: number) {
    const updated = { ...localScores, [dim]: v }
    setLocalScores(updated)
  }

  const previewScore = computePriorityScore(localScores)

  return (
    <div className="border-t border-border dark:border-white/6 bg-white dark:bg-gray-950">

      {/* Panel header */}
      <div className="flex items-start gap-6 px-8 py-5 border-b border-border dark:border-white/6">

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            {useCase.department}
            {useCase.importedFromT3 && ` · Importado desde T3`}
          </p>
          <h2 className="text-lg font-semibold text-lean-black dark:text-gray-100 leading-tight mb-2">
            {useCase.name}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge status={useCase.status} />
            <CategoryBadge category={useCase.aiCategory} />
            {useCase.roadmap?.quarter && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                bg-navy/8 dark:bg-navy/20 text-navy dark:text-info-soft">
                {useCase.roadmap.quarter}
              </span>
            )}
          </div>
          {useCase.description && (
            <p className="text-xs text-text-muted mt-2 leading-relaxed max-w-2xl">
              {useCase.description}
            </p>
          )}
          {useCase.importedFromT3 && (
            <p className="text-[10px] font-mono text-text-subtle mt-1.5">
              T3 origen: {useCase.importedFromT3.processName}
              {' · '}Opp. T3: <span className="font-bold">{useCase.importedFromT3.opportunityScore.toFixed(2)}/4.0</span>
            </p>
          )}
        </div>

        {/* Priority score hero */}
        <div className="shrink-0 text-center">
          <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">
            Score prioridad
          </p>
          <p className={`text-4xl font-bold tabular-nums leading-none ${priorityScoreColor(useCase.priorityScore)}`}>
            {useCase.priorityScore.toFixed(0)}
          </p>
          <p className="text-[10px] text-text-subtle">/100</p>
          <div className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold
            ${recommendation.badgeBg} ${recommendation.badgeText}`}>
            {recommendation.label.replace('Recomendación: ', '')}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border dark:border-white/6 px-8">
        {([
          { key: 'scoring',  label: 'Scoring' },
          { key: 'roadmap',  label: 'Hoja de ruta' },
          { key: 'contexto', label: 'Contexto T1/T2' },
        ] as { key: DetailTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'px-4 py-3 text-xs font-medium border-b-2 transition-colors',
              tab === key
                ? 'border-navy text-lean-black dark:text-gray-100'
                : 'border-transparent text-text-muted hover:text-text-default',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-8 py-6">

        {/* ── TAB: SCORING ─────────────────────────────────── */}
        {tab === 'scoring' && (
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">

            {/* LEFT — mini matrix */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                Posición en la matriz
              </p>
              <DetailPositionMap
                kpiImpact={useCase.scores.kpiImpact}
                feasibility={useCase.scores.feasibility}
                status={useCase.status}
                size={200}
              />
              <div className="w-full rounded-2xl border border-border dark:border-white/8
                px-3 py-2.5 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
                  Umbral go/no-go
                </p>
                <p className={`text-xs font-semibold ${recommendation.badgeText} ${recommendation.badgeBg}
                  px-2 py-0.5 rounded-full inline-block`}>
                  {recommendation.label}
                </p>
                <p className="text-[10px] text-text-muted leading-relaxed mt-1.5">
                  {recommendation.description}
                </p>
              </div>
            </div>

            {/* RIGHT — score bars + go/no-go + edición */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                  Dimensiones de scoring · taller de priorización
                </p>
                {!editingScore ? (
                  <button
                    onClick={() => { setEditingScore(true); setLocalScores(useCase.scores) }}
                    className="text-[10px] font-semibold text-navy dark:text-info-soft
                      hover:underline transition-all"
                  >
                    ✎ Editar scores
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingScore(false)}
                      className="text-[10px] text-text-muted hover:text-text-default"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveScores}
                      className="text-[10px] font-bold px-3 py-1 rounded-lg bg-navy text-white
                        hover:bg-navy/80 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                )}
              </div>

              {!editingScore ? (
                <>
                  <T4ScoreBars scores={useCase.scores} trackWidth={220} />
                  <div className="mt-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50
                    border border-border dark:border-white/6 px-4 py-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                      Score compuesto
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-lean-black dark:text-gray-100">
                      {useCase.priorityScore.toFixed(1)}
                      <span className="text-sm font-normal text-text-subtle">/100</span>
                    </p>
                    <p className="text-[10px] text-text-subtle mt-1">
                      Ponderación: KPI 35% · facilidad 30% · riesgo IA 20% · dependencia datos 15%
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4 mt-2">
                  <p className="text-[10px] text-text-subtle">
                    Edita los scores del taller (1 = mínimo, 5 = máximo). Para riesgo y dependencia de datos,
                    puntuaciones altas indican mayor riesgo / dependencia.
                  </p>
                  <ScoreInput
                    label="Impacto en KPI"
                    value={localScores.kpiImpact}
                    onChange={(v) => handleScoreChange('kpiImpact', v)}
                  />
                  <ScoreInput
                    label="Facilidad impl."
                    value={localScores.feasibility}
                    onChange={(v) => handleScoreChange('feasibility', v)}
                  />
                  <ScoreInput
                    label="Riesgo IA/reg."
                    value={localScores.aiRisk}
                    onChange={(v) => handleScoreChange('aiRisk', v)}
                  />
                  <ScoreInput
                    label="Dep. de datos"
                    value={localScores.dataDependency}
                    onChange={(v) => handleScoreChange('dataDependency', v)}
                  />
                  <div className="rounded-xl bg-navy/5 dark:bg-navy/10 px-4 py-2.5
                    border border-navy/10 mt-2">
                    <p className="text-[10px] text-text-subtle">Preview score</p>
                    <p className={`text-xl font-bold tabular-nums ${priorityScoreColor(previewScore)}`}>
                      {previewScore.toFixed(1)}/100
                    </p>
                  </div>
                </div>
              )}

              {/* Stakeholder scores */}
              {useCase.stakeholderScores.length > 0 && !editingScore && (
                <div className="mt-6">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                    Scores por stakeholder
                  </p>
                  <div className="flex flex-col gap-2">
                    {useCase.stakeholderScores.map((ss) => (
                      <div key={ss.id}
                        className="rounded-xl border border-border dark:border-white/8
                          bg-white dark:bg-gray-900/50 px-4 py-2.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-5 w-5 rounded-full bg-navy/10 dark:bg-navy/20
                            flex items-center justify-center text-[9px] font-bold
                            text-navy dark:text-info-soft shrink-0">
                            {ss.stakeholderName.charAt(0)}
                          </div>
                          <p className="text-xs font-semibold text-lean-black dark:text-gray-200">
                            {ss.stakeholderName}
                          </p>
                          <p className="text-[10px] text-text-subtle">
                            {ss.stakeholderRole}
                          </p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          {(['kpiImpact', 'feasibility', 'aiRisk', 'dataDependency'] as const).map((dim) => (
                            <div key={dim} className="flex items-center gap-1">
                              <span className="text-[9px] text-text-subtle">
                                {DIMENSION_CONFIG[dim].label.split(' ')[0]}:
                              </span>
                              <span className="text-[10px] font-bold text-lean-black dark:text-gray-200">
                                {ss.scores[dim]}
                              </span>
                            </div>
                          ))}
                        </div>
                        {ss.notes && (
                          <p className="text-[10px] text-text-subtle italic mt-1 leading-relaxed">
                            "{ss.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Go/no-go decision */}
              {useCase.goNoGo && !editingScore && (
                <div className={`mt-5 rounded-2xl px-4 py-3 border
                  ${useCase.goNoGo.decision === 'go'
                    ? 'border-success-dark/20 bg-success-light/8 dark:bg-success-dark/5'
                    : useCase.goNoGo.decision === 'no_go'
                    ? 'border-danger-dark/20 bg-danger-light/8'
                    : 'border-border dark:border-white/8 bg-gray-50 dark:bg-gray-800/50'
                  }`}>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
                    Decisión go/no-go
                  </p>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs font-bold ${
                      useCase.goNoGo.decision === 'go' ? 'text-success-dark' :
                      useCase.goNoGo.decision === 'no_go' ? 'text-danger-dark' :
                      'text-warning-dark'
                    }`}>
                      {useCase.goNoGo.decision === 'go' ? '✓ GO' :
                       useCase.goNoGo.decision === 'no_go' ? '✕ NO-GO' :
                       '◎ PENDIENTE'}
                    </span>
                    {useCase.goNoGo.decidedBy && (
                      <span className="text-[10px] text-text-subtle">
                        · {useCase.goNoGo.decidedBy}
                      </span>
                    )}
                  </div>
                  {useCase.goNoGo.rationale && (
                    <p className="text-[11px] text-text-muted leading-relaxed italic">
                      {useCase.goNoGo.rationale}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: HOJA DE RUTA ────────────────────────────── */}
        {tab === 'roadmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left: roadmap details */}
            <div>
              {useCase.roadmap ? (
                <div className="flex flex-col gap-5">
                  {useCase.roadmap.quarter && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
                        Quarter planificado
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-lean-black dark:text-gray-100">
                          {useCase.roadmap.quarter}
                        </span>
                        {useCase.roadmap.estimatedDuration && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                            bg-navy/8 dark:bg-navy/20 text-navy dark:text-info-soft">
                            {useCase.roadmap.estimatedDuration}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {useCase.roadmap.owner && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
                        Responsable de implementación
                      </p>
                      <p className="text-sm font-semibold text-lean-black dark:text-gray-200">
                        {useCase.roadmap.owner}
                      </p>
                    </div>
                  )}

                  {useCase.roadmap.nextSteps && (
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50
                      border border-border dark:border-white/6 px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                        Próximos pasos
                      </p>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {useCase.roadmap.nextSteps}
                      </p>
                    </div>
                  )}

                  {useCase.roadmap.dependencies && (
                    <div className="rounded-2xl bg-warning-light/20 border border-warning-dark/20 px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-warning-dark mb-2">
                        Dependencias
                      </p>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {useCase.roadmap.dependencies}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800
                    flex items-center justify-center text-2xl">◎</div>
                  <p className="text-sm font-medium text-text-muted">Sin hoja de ruta asignada</p>
                  <p className="text-xs text-text-subtle max-w-xs leading-relaxed">
                    Asigna un quarter de implementación tras la decisión de go/no-go.
                  </p>
                </div>
              )}
            </div>

            {/* Right: notes */}
            {useCase.notes && (
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50
                border border-border dark:border-white/6 px-4 py-3 h-fit">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                  Notas del consultor
                </p>
                <p className="text-xs text-text-muted leading-relaxed italic">
                  {useCase.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CONTEXTO T1/T2 ──────────────────────────── */}
        {tab === 'contexto' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* T1 context */}
            <div className="rounded-2xl border border-border dark:border-white/8
              bg-white dark:bg-gray-900/50 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-navy/10 dark:bg-navy/20 flex items-center
                  justify-center text-xs font-bold text-navy dark:text-info-soft">
                  T1
                </div>
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">
                  Contexto de madurez IA (T1)
                </p>
              </div>
              {useCase.t1Context ? (
                <>
                  {useCase.t1Context.relevantDimensions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-mono text-text-subtle mb-1.5">
                        Dimensiones relevantes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {useCase.t1Context.relevantDimensions.map((d) => (
                          <span key={d}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                              bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {useCase.t1Context.maturityNotes && (
                    <p className="text-xs text-text-muted leading-relaxed">
                      {useCase.t1Context.maturityNotes}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-text-subtle italic">
                  Sin contexto T1 registrado para este caso de uso.
                </p>
              )}
            </div>

            {/* T2 context */}
            <div className="rounded-2xl border border-border dark:border-white/8
              bg-white dark:bg-gray-900/50 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-info-light flex items-center
                  justify-center text-xs font-bold text-info-dark">
                  T2
                </div>
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">
                  Contexto de stakeholders (T2)
                </p>
              </div>
              {useCase.t2Context ? (
                <div className="flex flex-col gap-3">
                  {useCase.t2Context.championArchetype && (
                    <div>
                      <p className="text-[10px] font-mono text-text-subtle mb-0.5">Champion</p>
                      <p className="text-xs font-medium text-success-dark">
                        ✓ {useCase.t2Context.championArchetype}
                      </p>
                    </div>
                  )}
                  {useCase.t2Context.blockerArchetypes && useCase.t2Context.blockerArchetypes.length > 0 && (
                    <div>
                      <p className="text-[10px] font-mono text-text-subtle mb-0.5">Posibles bloqueos</p>
                      {useCase.t2Context.blockerArchetypes.map((b) => (
                        <p key={b} className="text-xs font-medium text-danger-dark">
                          ▲ {b}
                        </p>
                      ))}
                    </div>
                  )}
                  {useCase.t2Context.stakeholderNotes && (
                    <p className="text-xs text-text-muted leading-relaxed">
                      {useCase.t2Context.stakeholderNotes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-subtle italic">
                  Sin contexto T2 registrado para este caso de uso.
                </p>
              )}
            </div>

            {/* Category context */}
            <div className="rounded-2xl border border-border dark:border-white/8
              bg-white dark:bg-gray-900/50 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: catHex }} />
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">
                  Categoría IA (T3)
                </p>
              </div>
              <p className="text-sm font-semibold text-lean-black dark:text-gray-200 mb-1"
                style={{ color: catHex }}>
                {AI_CATEGORY_LABELS[useCase.aiCategory] ?? useCase.aiCategory}
              </p>
              {useCase.importedFromT3 && (
                <div className="mt-2">
                  <p className="text-[10px] font-mono text-text-subtle mb-0.5">
                    Proceso origen (T3)
                  </p>
                  <p className="text-xs text-text-muted">
                    {useCase.importedFromT3.processName}
                  </p>
                  <p className="text-[10px] text-text-subtle mt-0.5">
                    Opportunity score T3: <span className="font-bold">
                      {useCase.importedFromT3.opportunityScore.toFixed(2)}/4.0
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── T4View principal ──────────────────────────────────────────

interface T4ViewProps {
  companyName: string
  onBack?:     () => void
}

export function T4View({ companyName, onBack }: T4ViewProps) {
  const navigate                     = useNavigate()
  const { useCases }                 = useT4Store()
  const [activeId, setActiveId]      = useState<string | null>(null)
  const [showImport, setShowImport]  = useState(false)
  const [filterStatus, setFilterStatus] = useState<UseCaseStatus | null>(null)

  const activeUseCase = useMemo(
    () => useCases.find((uc) => uc.id === activeId) ?? null,
    [useCases, activeId]
  )

  // Filtrado y ordenación
  const filtered = useMemo(
    () => useCases
      .filter((uc) => !filterStatus || uc.status === filterStatus)
      .sort((a, b) => b.priorityScore - a.priorityScore),
    [useCases, filterStatus]
  )

  // KPIs globales
  const totalGo       = useCases.filter((uc) => uc.status === 'go').length
  const totalNoGo     = useCases.filter((uc) => uc.status === 'no_go').length
  const totalPrio     = useCases.filter((uc) => uc.status === 'priorizado').length
  const avgScore      = useCases.length
    ? Math.round(useCases.reduce((s, uc) => s + uc.priorityScore, 0) / useCases.length)
    : 0

  // Contadores por status para filtros
  const statusCounts = Object.fromEntries(
    STATUS_ORDER.map((st) => [st, useCases.filter((uc) => uc.status === st).length])
  ) as Record<UseCaseStatus, number>

  function handleSelectUseCase(id: string) {
    setActiveId((prev) => prev === id ? null : id)
  }

  return (
    <div className="flex flex-col bg-white dark:bg-gray-950 min-h-screen">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm
        border-b border-border dark:border-white/6 px-8 py-3">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <button
            onClick={() => onBack ? onBack() : navigate('/')}
            className="h-8 w-8 rounded-full flex items-center justify-center
              text-text-subtle hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
              {companyName} · Fase E · Enable
            </p>
            <h1 className="text-base font-semibold text-lean-black dark:text-gray-100">
              T4 — Use Case Priority Board
            </h1>
          </div>

          {/* KPI strip */}
          <div className="hidden md:flex items-center gap-5">
            {[
              { label: 'GO',        value: totalGo,    color: 'text-success-dark' },
              { label: 'Priorizado', value: totalPrio,  color: 'text-info-dark' },
              { label: 'No-Go',     value: totalNoGo,  color: 'text-danger-dark' },
              { label: 'Score medio', value: avgScore,  color: 'text-lean-black dark:text-gray-100' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
                <p className="text-[9px] text-text-subtle mt-0.5 whitespace-nowrap">{label}</p>
              </div>
            ))}
          </div>

          {/* Botones */}
          <button
            onClick={() => setShowImport(true)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl
              text-xs font-semibold border border-navy text-navy dark:text-info-soft
              hover:bg-navy/5 transition-colors"
          >
            ↓ Importar desde T3
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-8">

        {/* ── ZONA 1: HERO CHARTS ─────────────────────────── */}
        <div className="py-8">
          <div className="grid grid-cols-2 gap-6 items-stretch">

            {/* Priority Matrix */}
            <div className="rounded-3xl bg-white dark:bg-gray-900 border border-border
              dark:border-white/6 p-6 flex flex-col">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mb-3">
                Matriz de prioridad
              </p>
              <div className="flex-1 flex items-center justify-center">
                <HeroPriorityMatrix
                  useCases={filtered}
                  activeId={activeId}
                  onSelect={handleSelectUseCase}
                />
              </div>
              {/* Leyenda por estado */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {STATUS_ORDER.filter((st) => useCases.some((uc) => uc.status === st)).map((st) => {
                  const cfg = STATUS_CONFIG[st]
                  return (
                    <div key={st} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${cfg.dotBg} shrink-0`} />
                      <span className="text-[10px] text-text-subtle">{cfg.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status Donut */}
            <div className="rounded-3xl bg-white dark:bg-gray-900 border border-border
              dark:border-white/6 p-6 flex flex-col">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mb-3">
                Distribución por estado
              </p>
              <div className="flex-1 flex items-center justify-center">
                <HeroStatusDonut
                  useCases={useCases}
                  activeId={activeId}
                  onSelect={handleSelectUseCase}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {STATUS_ORDER.filter((st) => useCases.some((uc) => uc.status === st)).map((st) => {
                  const cfg = STATUS_CONFIG[st]
                  return (
                    <div key={st} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${cfg.dotBg} shrink-0`} />
                      <span className="text-[10px] text-text-subtle">{cfg.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── ZONA 2: LISTA DE CASOS DE USO ───────────────── */}
        <div className="border-t border-border dark:border-white/6 pt-6 pb-4">

          {/* Filtros por estado */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mr-2 shrink-0">
              Casos de uso · {useCases.length}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_ORDER.filter((st) => statusCounts[st] > 0).map((st) => {
                const cfg = STATUS_CONFIG[st]
                const cnt = statusCounts[st]
                return (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(filterStatus === st ? null : st)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold',
                      'border transition-all',
                      filterStatus === st
                        ? `${cfg.badgeBg} ${cfg.badgeText} border-transparent`
                        : 'bg-transparent border-border dark:border-white/10 text-text-muted hover:border-gray-300',
                    ].join(' ')}
                  >
                    <span className="tabular-nums font-bold">{cnt}</span>
                    <span>{cfg.label}</span>
                  </button>
                )
              })}
              {filterStatus && (
                <button
                  onClick={() => setFilterStatus(null)}
                  className="text-[10px] text-text-subtle hover:text-text-muted transition-colors ml-1"
                >
                  Limpiar ×
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800
                flex items-center justify-center text-2xl">◎</div>
              <p className="text-sm font-bold text-text-muted">Sin casos de uso</p>
              <p className="text-xs text-text-subtle max-w-xs leading-relaxed">
                Importa procesos desde T3 o añade un caso de uso manualmente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filtered.map((uc) => {
                const isActive  = uc.id === activeId
                const statusCfg = STATUS_CONFIG[uc.status]
                const scoreColor = priorityScoreColor(uc.priorityScore)

                return (
                  <button
                    key={uc.id}
                    onClick={() => handleSelectUseCase(uc.id)}
                    className={[
                      'w-full text-left rounded-2xl px-4 py-3 transition-all duration-150',
                      'border flex flex-col gap-2',
                      isActive
                        ? 'border-navy/40 bg-navy/5 dark:bg-navy/10 shadow-sm ring-1 ring-navy/20'
                        : 'border-border dark:border-white/6 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-white/14 hover:shadow-sm',
                    ].join(' ')}
                  >
                    {/* Header: color bar + name + chevron */}
                    <div className="flex items-start gap-2.5">
                      <div
                        className="shrink-0 w-1 h-6 rounded-full mt-0.5"
                        style={{ backgroundColor: statusCfg.hex, opacity: isActive ? 1 : 0.6 }}
                      />
                      <p className="flex-1 text-xs font-bold text-lean-black dark:text-gray-200
                        leading-tight line-clamp-2">
                        {uc.name}
                      </p>
                      <span className={`shrink-0 text-text-subtle text-[10px] transition-transform
                        duration-200 ${isActive ? 'rotate-180' : ''}`}>↓</span>
                    </div>

                    {/* Dept */}
                    <p className="text-[10px] text-text-subtle truncate pl-3.5">
                      {uc.department}
                      {uc.importedFromT3 && <span className="ml-1 opacity-50">· T3</span>}
                    </p>

                    {/* Badges + score */}
                    <div className="flex items-center gap-1 flex-wrap pl-3.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold
                        ${statusCfg.badgeBg} ${statusCfg.badgeText}`}>
                        {statusCfg.label}
                      </span>
                      {uc.roadmap?.quarter && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold
                          bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft">
                          {uc.roadmap.quarter}
                        </span>
                      )}
                      <span className={`ml-auto text-xs font-bold tabular-nums ${scoreColor}`}>
                        {uc.priorityScore.toFixed(0)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ZONA 3: DETALLE ─────────────────────────────────── */}
      {activeUseCase && (
        <div className="max-w-7xl mx-auto w-full px-8 pb-16">
          <UseCaseDetailPanel useCase={activeUseCase} />
        </div>
      )}

      {/* Modal de importación desde T3 */}
      {showImport && (
        <ImportFromT3Modal onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}
