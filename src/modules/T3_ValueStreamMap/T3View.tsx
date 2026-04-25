// ============================================================
// T3 — Value Stream Map (Rediseño v2)
//
// Layout: 3 zonas verticales
//   1. HERO — Dos gráficas protagonistas (Opportunity Matrix +
//      Department Chart), grandes, sin texto, impacto visual.
//   2. BANNER — KPI de fases + lista de procesos (cards clicables).
//   3. DETALLE — Se despliega debajo al seleccionar un proceso.
//      Tabs: Oportunidades | Entrevista | Etapas (Sprint 3+)
//
// Sprint 2 MVP: datos en Zustand (persist local).
// Sprint 3+: Supabase tabla `value_stream`.
// ============================================================

import { useState, useMemo }         from 'react'
import { useNavigate }               from 'react-router-dom'
import { useT3Store }                from './store'
import {
  AI_CATEGORY_CONFIG,
  READINESS_CONFIG,
  OPPORTUNITY_CONFIG,
  PHASE_CONFIG,
} from './constants'
import { ProcessInterviewModal }     from './components/ProcessInterviewModal'
import type {
  ValueStream, AICategoryCode, OrgReadinessLevel,
  ProcessPhase,
} from './types'

// ── Constantes de color ───────────────────────────────────────

const CAT_HEX: Record<AICategoryCode, string> = {
  automatizacion_inteligente: '#6A90C0',
  automatizacion_rpa:         '#5FAF8A',
  analitica_predictiva:       '#1B2A4E',
  asistente_ia:               '#D4A85C',
  optimizacion_proceso:       '#C06060',
}

const CAT_ORDER: AICategoryCode[] = [
  'automatizacion_inteligente',
  'automatizacion_rpa',
  'analitica_predictiva',
  'asistente_ia',
  'optimizacion_proceso',
]

const ALL_PHASES: ProcessPhase[] = ['idea', 'validacion', 'piloto', 'estandarizacion', 'escalado']

// ── Badges ────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: AICategoryCode }) {
  const cfg = AI_CATEGORY_CONFIG[category]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  )
}

function ReadinessBadge({ level }: { level: OrgReadinessLevel }) {
  const cfg = READINESS_CONFIG[level]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {level === 'alta' ? '● ' : level === 'media' ? '◆ ' : '▲ '}
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  )
}

function PhaseBadge({ phase }: { phase: ProcessPhase }) {
  const cfg = PHASE_CONFIG[phase]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  )
}

// ── HERO CHART 1: Opportunity Matrix grande ───────────────────
// Eje X = readiness, Eje Y = oportunidad IA. Dots by category.

function HeroOpportunityMatrix({
  processes,
  activeId,
  onSelect,
}: {
  processes: ValueStream[]
  activeId:  string | null
  onSelect:  (id: string) => void
}) {
  const S  = 320
  const P  = 36
  const IN = S - P * 2

  const QUAD_LABELS = [
    { qx: 0.60, qy: 0.08, text: 'PILOTAR YA',       color: '#5FAF8A' },
    { qx: 0.03, qy: 0.08, text: 'PREPARAR TERRENO', color: '#D4A85C' },
    { qx: 0.60, qy: 0.82, text: 'QUICK WINS',       color: '#9AAEC8' },
    { qx: 0.03, qy: 0.82, text: 'EVALUAR',           color: '#94A3B8' },
  ]

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <clipPath id="t3hero-clip">
          <rect x={P} y={P} width={IN} height={IN} rx={6} />
        </clipPath>
        {processes.map((p) => (
          <radialGradient key={`glow-${p.id}`} id={`glow-${p.id}`}
            cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={CAT_HEX[p.aiCategory]} stopOpacity="0.35" />
            <stop offset="100%" stopColor={CAT_HEX[p.aiCategory]} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Quadrant fills */}
      <g clipPath="url(#t3hero-clip)">
        <rect x={P}        y={P}        width={IN/2} height={IN/2} fill="#D4A85C" opacity={0.04} />
        <rect x={P + IN/2} y={P}        width={IN/2} height={IN/2} fill="#5FAF8A" opacity={0.06} />
        <rect x={P}        y={P + IN/2} width={IN/2} height={IN/2} fill="#E5E7EB" opacity={0.03} />
        <rect x={P + IN/2} y={P + IN/2} width={IN/2} height={IN/2} fill="#9AAEC8" opacity={0.04} />
      </g>

      {/* Grid border */}
      <rect x={P} y={P} width={IN} height={IN} rx={6} fill="none"
        stroke="#E5E7EB" strokeWidth={1} />

      {/* Dividers */}
      <line x1={P + IN/2} y1={P} x2={P + IN/2} y2={P + IN}
        stroke="#E5E7EB" strokeWidth={0.8} strokeDasharray="3 3" />
      <line x1={P} y1={P + IN/2} x2={P + IN} y2={P + IN/2}
        stroke="#E5E7EB" strokeWidth={0.8} strokeDasharray="3 3" />

      {/* Quadrant labels */}
      {QUAD_LABELS.map((q, i) => (
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
        READINESS →
      </text>
      <text
        x={P - 14} y={P + IN / 2}
        fontSize={8} fill="#9CA3AF"
        fontFamily="ui-monospace,monospace"
        textAnchor="middle"
        letterSpacing="0.08em"
        transform={`rotate(-90, ${P - 14}, ${P + IN/2})`}
      >
        OPORTUNIDAD IA ↑
      </text>

      {/* Process dots */}
      {processes.map((p) => {
        const score    = p.interview?.opportunityScore ?? 0
        const ready    = p.interview?.readinessScore   ?? 0
        const dx       = P + (ready / 4) * IN
        const dy       = P + (1 - score / 4) * IN
        const hex      = CAT_HEX[p.aiCategory]
        const isActive = p.id === activeId
        const r        = isActive ? 9 : 7

        return (
          <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(p.id)}>
            {/* Outer glow */}
            <circle cx={dx} cy={dy} r={r * 3.5}
              fill={`url(#glow-${p.id})`} />
            {/* Mid halo */}
            <circle cx={dx} cy={dy} r={r * 1.8}
              fill={hex} opacity={isActive ? 0.25 : 0.12} />
            {/* Main dot */}
            <circle cx={dx} cy={dy} r={r} fill={hex}
              opacity={isActive ? 1 : 0.80}
              stroke={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
              strokeWidth={isActive ? 1.5 : 0.8} />
            {/* Metallic shine */}
            <ellipse cx={dx - r * 0.22} cy={dy - r * 0.30}
              rx={r * 0.38} ry={r * 0.22}
              fill="#fff" opacity={0.40} />
          </g>
        )
      })}
    </svg>
  )
}

// ── HERO CHART 2: Category Donut — distribución por tipología IA ─
// Reemplaza el bar chart: gráfico circular con 5 sectores (una por
// categoría IA), inspirado en el diseño de T2 StakeholderQuadrantChart.
// Fondo oscuro, dots metallic por proceso, labels en el perímetro.

function HeroCategoryDonut({ processes }: { processes: ValueStream[] }) {
  const VB = 400, CX = 200, CY = 200
  const R_OUTER = 152, R_INNER = 58

  const total = processes.length

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
        <circle cx={CX} cy={CY} r={R_OUTER + 5} fill="#111827" />
        <text x={CX} y={CY + 5} textAnchor="middle" fontSize={13}
          fill="rgba(255,255,255,0.35)" fontFamily="ui-monospace,monospace">
          Sin procesos
        </text>
      </svg>
    )
  }

  // Compute arc angles
  const GAP_RAD = catData.length > 1 ? 0.03 : 0
  let currentAngle = -Math.PI / 2

  const arcs = catData.map(({ cat, count, procs }) => {
    const fraction  = count / total
    const arcSpan   = fraction * 2 * Math.PI - GAP_RAD
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
    <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="t3donut-bg" cx="50%" cy="35%" r="75%">
          <stop offset="0%"   stopColor="#2A3D6A" />
          <stop offset="100%" stopColor="#0D1B36" />
        </radialGradient>
      </defs>

      {/* Dark circular background */}
      <circle cx={CX} cy={CY} r={R_OUTER + 6} fill="url(#t3donut-bg)" />

      {/* Concentric rings — decorative */}
      {[75, 100, 126, 152].map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.8} />
      ))}

      {/* Sectors */}
      {arcs.map(({ cat, count, procs, startAngle, endAngle, midAngle }) => {
        const hex = CAT_HEX[cat]
        const cfg = AI_CATEGORY_CONFIG[cat]

        // Label — outside the donut
        const labelR   = R_OUTER + 24
        const lx       = CX + labelR * Math.cos(midAngle)
        const ly       = CY + labelR * Math.sin(midAngle)
        const cosM     = Math.cos(midAngle)
        const anchor   = cosM < -0.2 ? 'end' : cosM > 0.2 ? 'start' : 'middle'

        // Label text — short version
        const words    = cfg.label.split(' ')
        const line1    = words.slice(0, Math.ceil(words.length / 2)).join(' ')
        const line2    = words.slice(Math.ceil(words.length / 2)).join(' ')

        // Dots — one per process, distributed angularly, radially by opportunity score
        const dots = procs.map((p, i) => {
          const frac    = procs.length > 1 ? (i + 0.5) / procs.length : 0.5
          const dotAng  = startAngle + frac * (endAngle - startAngle)
          const opp     = p.interview?.opportunityScore ?? 2
          const radPct  = 0.15 + (opp / 4) * 0.70  // maps 0-4 → 15%-85% of ring width
          const dotR    = R_INNER + radPct * (R_OUTER - R_INNER)
          return {
            id: p.id,
            cx: CX + dotR * Math.cos(dotAng),
            cy: CY + dotR * Math.sin(dotAng),
            hex,
          }
        })

        return (
          <g key={cat}>
            {/* Sector fill — semi-transparent */}
            <path d={arcPath(startAngle, endAngle, R_OUTER, R_INNER)}
              fill={hex} opacity={0.18} />
            {/* Sector border */}
            <path d={arcPath(startAngle, endAngle, R_OUTER, R_INNER)}
              fill="none" stroke={hex} strokeWidth={1} opacity={0.55} />

            {/* Process dots */}
            {dots.map((dot) => (
              <g key={dot.id}>
                {/* Glow */}
                <circle cx={dot.cx} cy={dot.cy} r={10}
                  fill={dot.hex} opacity={0.15} />
                <circle cx={dot.cx} cy={dot.cy} r={7}
                  fill={dot.hex} opacity={0.90}
                  stroke="rgba(255,255,255,0.30)" strokeWidth={0.8} />
                {/* Shine */}
                <ellipse cx={dot.cx - 2} cy={dot.cy - 2}
                  rx={2.5} ry={1.5}
                  fill="rgba(255,255,255,0.45)" />
              </g>
            ))}

            {/* Count label — in arc midpoint near outer edge */}
            <text
              x={CX + (R_INNER + (R_OUTER - R_INNER) * 0.80) * Math.cos(midAngle)}
              y={CY + (R_INNER + (R_OUTER - R_INNER) * 0.80) * Math.sin(midAngle) + 4}
              textAnchor="middle" fontSize={11} fontWeight="700"
              fill={hex} fontFamily="ui-monospace,monospace"
            >
              {count}
            </text>

            {/* Category label — outside ring */}
            <text x={lx} y={ly - (line2 ? 5 : 0)} textAnchor={anchor}
              fontSize={8} fontWeight="700"
              fill={hex} fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
              {line1.toUpperCase()}
            </text>
            {line2 && (
              <text x={lx} y={ly + 10} textAnchor={anchor}
                fontSize={8} fontWeight="700"
                fill={hex} fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
                {line2.toUpperCase()}
              </text>
            )}
          </g>
        )
      })}

      {/* Inner circle — dark center */}
      <circle cx={CX} cy={CY} r={R_INNER - 3} fill="rgba(10,20,45,0.96)" />

      {/* Center text */}
      <text x={CX} y={CY - 14} textAnchor="middle"
        fontSize={7.5} fill="rgba(255,255,255,0.40)"
        fontFamily="ui-monospace,monospace" letterSpacing="0.10em">
        VALUE STREAM
      </text>
      <text x={CX} y={CY - 2} textAnchor="middle"
        fontSize={7.5} fill="rgba(255,255,255,0.40)"
        fontFamily="ui-monospace,monospace" letterSpacing="0.10em">
        MAP
      </text>
      <text x={CX} y={CY + 22} textAnchor="middle"
        fontSize={26} fontWeight="700"
        fill="rgba(255,255,255,0.88)"
        fontFamily="ui-monospace,monospace"
      >
        {total}
      </text>
    </svg>
  )
}

// ── Score bars T3 ─────────────────────────────────────────────

const T3_SCORE_BARS = [
  { key: 'aut', label: 'AUTOMATIZACIÓN', hex: '#6A90C0', light: '#B8D0E8' },
  { key: 'dat', label: 'DATOS',          hex: '#5FAF8A', light: '#B4E4CF' },
  { key: 'vol', label: 'VOLUMEN',        hex: '#9AAEC8', light: '#C8DAE8' },
  { key: 'imp', label: 'IMPACTO',        hex: '#D4A85C', light: '#E8D0A0' },
  { key: 'rdy', label: 'READINESS',      hex: '#C06060', light: '#DDA8A8' },
] as const

function T3ScoreBars({
  automationScore, dataScore, volumeScore, impactScore, readinessScore,
  trackWidth = 200,
}: {
  automationScore: number; dataScore: number; volumeScore: number
  impactScore: number; readinessScore: number; trackWidth?: number
}) {
  const MAX = 4
  const LBL_W = 80, G1 = 10, TRACK_W = trackWidth, G2 = 8, VAL_COL = 28
  const VBW = LBL_W + G1 + TRACK_W + G2 + VAL_COL
  const TX  = LBL_W + G1
  const ROW_H = 36, VBH = T3_SCORE_BARS.length * ROW_H + 8
  const values = [automationScore, dataScore, volumeScore, impactScore, readinessScore]

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {T3_SCORE_BARS.map(({ key, hex, light }, i) => {
          const fillW = Math.max((values[i] / MAX) * TRACK_W, 2)
          return (
            <linearGradient key={key} id={`t3sb-${key}`}
              x1={TX} y1="0" x2={TX + fillW} y2="0"
              gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor={hex}   stopOpacity="0.15" />
              <stop offset="30%"  stopColor={hex}   stopOpacity="0.92" />
              <stop offset="58%"  stopColor={light} stopOpacity="1" />
              <stop offset="85%"  stopColor={hex}   stopOpacity="0.80" />
              <stop offset="100%" stopColor={hex}   stopOpacity="0.40" />
            </linearGradient>
          )
        })}
      </defs>
      {T3_SCORE_BARS.map(({ key, label, hex, light }, i) => {
        const val   = values[i]
        const fillW = Math.max((val / MAX) * TRACK_W, 2)
        const cy    = i * ROW_H + ROW_H / 2 + 3
        return (
          <g key={key}>
            <text x={0} y={cy + 3} fontSize={7.5} fill="#64748B"
              fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
              {label}
            </text>
            <rect x={TX} y={cy - 0.4} width={TRACK_W} height={0.8}
              fill={hex} opacity={0.08} rx={0.4} />
            <rect x={TX} y={cy - 3.5} width={fillW} height={7}
              fill={hex} opacity={0.10} rx={3.5} />
            <rect x={TX} y={cy - 1.5} width={fillW} height={3}
              fill={`url(#t3sb-${key})`} rx={1.5} />
            <rect x={TX + fillW * 0.08} y={cy - 2}
              width={fillW * 0.45} height={0.7}
              fill={light} opacity={0.60} rx={0.35} />
            <text x={TX + TRACK_W + G2} y={cy + 3}
              fontSize={8} fontWeight="600" fill="#94A3B8"
              fontFamily="ui-monospace,monospace">
              {val.toFixed(1)}<tspan fontSize={6.5} opacity={0.5}>/4</tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Mini matrix de posición para el panel de detalle ──────────

function DetailPositionMap({
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
  const S = size, P = Math.round(S * 0.10), IN = S - P * 2
  const dx  = P + (readinessScore   / 4) * IN
  const dy  = P + (1 - opportunityScore / 4) * IN
  const hex = CAT_HEX[category]
  const r   = S * 0.048

  const QUAD_LABELS = [
    { qx: 0.52, qy: 0.06, text: 'Pilotar ya',       color: '#5FAF8A' },
    { qx: 0.02, qy: 0.06, text: 'Preparar',          color: '#D4A85C' },
    { qx: 0.52, qy: 0.86, text: 'Quick wins',        color: '#9AAEC8' },
    { qx: 0.02, qy: 0.86, text: 'Evaluar',           color: '#94A3B8' },
  ]

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ display: 'block' }}>
      <defs>
        <clipPath id="detail-map-clip">
          <rect x={P} y={P} width={IN} height={IN} rx={5} />
        </clipPath>
        <radialGradient id="detail-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={hex} stopOpacity="0.40" />
          <stop offset="100%" stopColor={hex} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g clipPath="url(#detail-map-clip)">
        <rect x={P}        y={P}        width={IN/2} height={IN/2} fill="#D4A85C" opacity={0.04} />
        <rect x={P + IN/2} y={P}        width={IN/2} height={IN/2} fill="#5FAF8A" opacity={0.06} />
        <rect x={P}        y={P + IN/2} width={IN/2} height={IN/2} fill="#E5E7EB" opacity={0.03} />
        <rect x={P + IN/2} y={P + IN/2} width={IN/2} height={IN/2} fill="#9AAEC8" opacity={0.04} />
      </g>

      <rect x={P} y={P} width={IN} height={IN} rx={5} fill="none"
        stroke="#E5E7EB" strokeWidth={1} />
      <line x1={P + IN/2} y1={P} x2={P + IN/2} y2={P + IN}
        stroke="#E5E7EB" strokeWidth={0.6} strokeDasharray="3 3" />
      <line x1={P} y1={P + IN/2} x2={P + IN} y2={P + IN/2}
        stroke="#E5E7EB" strokeWidth={0.6} strokeDasharray="3 3" />

      {QUAD_LABELS.map((q, i) => (
        <text key={i}
          x={P + q.qx * IN} y={P + q.qy * IN}
          fontSize={S * 0.045} fill={q.color} opacity={0.75}
          fontFamily="ui-monospace,monospace" letterSpacing="0.03em">
          {q.text}
        </text>
      ))}

      {/* Glow + dot */}
      <circle cx={dx} cy={dy} r={r * 3.5} fill="url(#detail-glow)" />
      <circle cx={dx} cy={dy} r={r * 1.8} fill={hex} opacity={0.20} />
      <circle cx={dx} cy={dy} r={r}       fill={hex}
        stroke="#fff" strokeWidth={1.5} />
      <ellipse cx={dx - r * 0.22} cy={dy - r * 0.30}
        rx={r * 0.40} ry={r * 0.22}
        fill="#fff" opacity={0.42} />

      {/* Crosshair lines from dot to axes */}
      <line x1={P} y1={dy} x2={dx - r} y2={dy}
        stroke={hex} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
      <line x1={dx} y1={P + IN} x2={dx} y2={dy + r}
        stroke={hex} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4} />
    </svg>
  )
}

// ── Panel de detalle del proceso (desplegado debajo) ──────────

type DetailTab = 'oportunidades' | 'entrevista' | 'etapas'

function ProcessDetailPanel({ process }: { process: ValueStream }) {
  const [tab, setTab] = useState<DetailTab>('oportunidades')

  const catCfg       = AI_CATEGORY_CONFIG[process.aiCategory]
  const hasInterview = !!process.interview

  const effortColors = {
    bajo:  'bg-success-light text-success-dark',
    medio: 'bg-warning-light text-warning-dark',
    alto:  'bg-danger-light text-danger-dark',
  }
  const impactColors = {
    bajo:  'bg-gray-100 dark:bg-gray-800 text-gray-500',
    medio: 'bg-info-light text-info-dark',
    alto:  'bg-navy/10 dark:bg-navy/20 text-navy dark:text-info-soft',
  }

  const INTERVIEW_LABELS: Record<number, string> = {
    1: '¿Qué % es repetitivo?',
    2: '¿Disponibilidad de datos?',
    3: '¿Frecuencia y volumen?',
    4: '¿Impacto de mejora?',
    5: '¿Actitud del equipo?',
    6: '¿Tiempo manual/semana?',
  }

  return (
    <div className="border-t border-border dark:border-white/6 bg-white dark:bg-gray-950">

      {/* Panel header */}
      <div className="flex items-start gap-6 px-8 py-5 border-b border-border dark:border-white/6">

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            {process.department}
            {process.owner && ` · ${process.owner}`}
            {process.ownerRole && ` · ${process.ownerRole}`}
          </p>
          <h2 className="text-lg font-semibold text-lean-black dark:text-gray-100 leading-tight mb-2">
            {process.name}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <PhaseBadge phase={process.phase} />
            <CategoryBadge category={process.aiCategory} />
            <ReadinessBadge level={process.orgReadiness} />
            {process.manualOverride && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                bg-warning-light text-warning-dark">
                Override consultor
              </span>
            )}
          </div>
          {process.description && (
            <p className="text-xs text-text-muted mt-2 leading-relaxed max-w-2xl">
              {process.description}
            </p>
          )}
        </div>

        {/* Opp score hero */}
        {hasInterview && (
          <div className="shrink-0 text-center">
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">
              Score oportunidad
            </p>
            <p className="text-4xl font-bold text-lean-black dark:text-gray-100 tabular-nums leading-none">
              {process.interview!.opportunityScore.toFixed(1)}
            </p>
            <p className="text-[10px] text-text-subtle">/4.0</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border dark:border-white/6 px-8">
        {([
          { key: 'oportunidades', label: 'Oportunidades IA' },
          { key: 'entrevista',    label: 'Entrevista' },
          { key: 'etapas',       label: 'Etapas del proceso' },
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

        {/* ── TAB: OPORTUNIDADES ───────────────────────────── */}
        {tab === 'oportunidades' && (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">

            {/* LEFT — posición map grande */}
            {hasInterview ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                  Posición en la matriz
                </p>
                <DetailPositionMap
                  opportunityScore={process.interview!.opportunityScore}
                  readinessScore={process.interview!.readinessScore}
                  category={process.aiCategory}
                  size={200}
                />
                <div className="w-full">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
                    Categoría IA
                  </p>
                  <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-1">
                    {catCfg.tagline}
                  </p>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {catCfg.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-8">
                <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl">
                  ◎
                </div>
                <p className="text-xs text-text-muted">
                  Completa la entrevista para posicionar este proceso.
                </p>
              </div>
            )}

            {/* RIGHT — oportunidades IA */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-4">
                Oportunidades IA identificadas · {process.opportunities.length}
              </p>

              {process.opportunities.length === 0 ? (
                <p className="text-xs text-text-subtle">
                  Completa la entrevista para generar oportunidades automáticamente.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {process.opportunities.map((opp) => {
                    const isValidated = opp.status === 'validada'
                    return (
                      <div key={opp.id}
                        className={[
                          'rounded-2xl border px-4 py-3.5 flex flex-col gap-2',
                          isValidated
                            ? 'border-success-dark/20 bg-success-light/8 dark:bg-success-dark/5'
                            : 'border-border dark:border-white/8 bg-white dark:bg-gray-900/50',
                        ].join(' ')}>
                        <div className="flex items-start gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full mt-1 shrink-0 ${
                            isValidated ? 'bg-success-dark' : 'bg-info-dark'
                          }`} />
                          <p className="text-xs font-semibold text-lean-black dark:text-gray-200 leading-snug">
                            {opp.title}
                          </p>
                          {isValidated && (
                            <span className="ml-auto shrink-0 text-[9px] font-bold text-success-dark">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                          {opp.description}
                        </p>
                        <div className="flex gap-1.5 flex-wrap mt-auto">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${effortColors[opp.effort]}`}>
                            Esfuerzo {opp.effort}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${impactColors[opp.impact]}`}>
                            Impacto {opp.impact}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Notas del consultor */}
              {process.notes && (
                <div className="mt-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50
                  border border-border dark:border-white/6 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
                    Notas del consultor
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed italic">{process.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: ENTREVISTA ──────────────────────────────── */}
        {tab === 'entrevista' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

            {/* Preguntas + respuestas */}
            <div>
              {hasInterview ? (
                <>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-4">
                    Respuestas de la entrevista
                  </p>
                  <div className="flex flex-col gap-3">
                    {Object.entries(process.interview!.answers).map(([qId, answer]) => (
                      <div key={qId}
                        className="rounded-xl border border-border dark:border-white/8
                          bg-white dark:bg-gray-900/50 px-4 py-3">
                        <p className="text-[10px] font-mono text-text-subtle mb-0.5">
                          P{qId}
                        </p>
                        <p className="text-xs text-text-muted mb-1.5">
                          {INTERVIEW_LABELS[parseInt(qId)] ?? `Pregunta ${qId}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-full bg-navy flex items-center justify-center
                            text-[10px] font-bold text-white shrink-0">
                            {answer}
                          </span>
                          <p className="text-xs font-medium text-lean-black dark:text-gray-200">
                            Respuesta {answer}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center
                    justify-center text-2xl">
                    ✎
                  </div>
                  <p className="text-sm font-medium text-text-muted">Sin entrevista registrada</p>
                  <p className="text-xs text-text-subtle max-w-xs leading-relaxed">
                    Usa el botón "+ Proceso" y selecciona este proceso para completar la entrevista estructurada.
                  </p>
                </div>
              )}
            </div>

            {/* Score bars */}
            {hasInterview && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-4">
                  Scores del diagnóstico
                </p>
                <T3ScoreBars
                  automationScore={process.interview!.automationScore}
                  dataScore={process.interview!.dataScore}
                  volumeScore={process.interview!.volumeScore}
                  impactScore={process.interview!.impactScore}
                  readinessScore={process.interview!.readinessScore}
                  trackWidth={200}
                />
                <div className="mt-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50
                  border border-border dark:border-white/6 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                    Score oportunidad compuesto
                  </p>
                  <p className="text-2xl font-bold text-lean-black dark:text-gray-100 tabular-nums">
                    {process.interview!.opportunityScore.toFixed(2)}
                    <span className="text-sm font-normal text-text-subtle">/4.00</span>
                  </p>
                  <p className="text-[10px] text-text-subtle mt-1">
                    Ponderación: automatización 35% · datos 25% · volumen 20% · impacto 20%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ETAPAS (Sprint 3+) ──────────────────────── */}
        {tab === 'etapas' && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="h-14 w-14 rounded-3xl bg-navy/5 dark:bg-navy/10 flex items-center
              justify-center text-3xl">
              ◎
            </div>
            <div>
              <p className="text-sm font-semibold text-lean-black dark:text-gray-100 mb-1">
                Etapas del proceso — Sprint 3
              </p>
              <p className="text-xs text-text-muted max-w-sm leading-relaxed">
                El mapeado de etapas (VSM swimlane) con tiempos de proceso, espera, handoffs
                y detección de cuellos de botella estará disponible en Sprint 3.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full
              bg-navy/5 dark:bg-navy/10 border border-navy/10">
              <span className="text-[10px] font-mono text-navy dark:text-info-soft uppercase tracking-widest">
                Próximamente en Sprint 3
              </span>
            </div>
            {process.stages && process.stages.length > 0 && (
              <p className="text-xs text-text-subtle">
                {process.stages.length} etapa{process.stages.length > 1 ? 's' : ''} definida{process.stages.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── T3View principal ──────────────────────────────────────────

interface T3ViewProps {
  companyName: string
  onBack?:     () => void
}

export function T3View({ companyName, onBack }: T3ViewProps) {
  const navigate                          = useNavigate()
  const { processes, addProcess }         = useT3Store()
  const [activeId, setActiveId]           = useState<string | null>(null)
  const [showModal, setShowModal]         = useState(false)
  const [filterPhase, setFilterPhase]     = useState<ProcessPhase | null>(null)
  const [filterCat, setFilterCat]         = useState<AICategoryCode | null>(null)

  const activeProcess = useMemo(
    () => processes.find((p) => p.id === activeId) ?? null,
    [processes, activeId]
  )

  // Procesos filtrados
  const filtered = useMemo(
    () => processes
      .filter((p) => !filterPhase || p.phase === filterPhase)
      .filter((p) => !filterCat   || p.aiCategory === filterCat)
      .sort((a, b) => {
        const oA = a.interview?.opportunityScore ?? 0
        const oB = b.interview?.opportunityScore ?? 0
        return oB - oA
      }),
    [processes, filterPhase, filterCat]
  )

  // KPIs globales
  const phaseCount  = Object.fromEntries(
    ALL_PHASES.map((ph) => [ph, processes.filter((p) => p.phase === ph).length])
  ) as Record<ProcessPhase, number>

  const totalCritica = processes.filter((p) => p.opportunityLevel === 'critica').length
  const totalAlta    = processes.filter((p) => p.opportunityLevel === 'alta').length

  const existingDepts = Array.from(new Set(processes.map((p) => p.department)))

  function handleAddProcess(p: Omit<ValueStream, 'id' | 'createdAt'>) {
    addProcess(p)
    setShowModal(false)
  }

  function handleSelectProcess(id: string) {
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
              {companyName} · Fase L · Listen
            </p>
            <h1 className="text-base font-semibold text-lean-black dark:text-gray-100">
              T3 — Value Stream Map
            </h1>
          </div>

          {/* KPI strip */}
          <div className="hidden md:flex items-center gap-5">
            {[
              { label: 'Opp crítica', value: totalCritica, color: 'text-navy dark:text-info-soft' },
              { label: 'Opp alta',    value: totalAlta,    color: 'text-info-dark' },
              { label: 'Total',       value: processes.length, color: 'text-lean-black dark:text-gray-100' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
                <p className="text-[9px] text-text-subtle mt-0.5 whitespace-nowrap">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl
              text-xs font-semibold bg-navy text-white hover:bg-navy/80 transition-colors"
          >
            + Proceso
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-8">

        {/* ── ZONA 1: HERO CHARTS ─────────────────────────── */}
        <div className="py-8">
          <div className="grid grid-cols-2 gap-6 items-stretch">

            {/* Opportunity Matrix */}
            <div className="rounded-3xl bg-white dark:bg-gray-900 border border-border
              dark:border-white/6 p-6 flex flex-col">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mb-3">
                Matriz de oportunidad
              </p>
              <div className="flex-1 flex items-center justify-center">
                <HeroOpportunityMatrix
                  processes={filtered}
                  activeId={activeId}
                  onSelect={handleSelectProcess}
                />
              </div>
              {/* Leyenda compacta */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {CAT_ORDER.filter((c) => processes.some((p) => p.aiCategory === c)).map((c) => {
                  const cfg = AI_CATEGORY_CONFIG[c]
                  return (
                    <div key={c} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${cfg.dotBg} shrink-0`} />
                      <span className="text-[10px] text-text-subtle">{cfg.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Category Donut Chart */}
            <div className="rounded-3xl bg-white dark:bg-gray-900 border border-border
              dark:border-white/6 p-6 flex flex-col">
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mb-3">
                Distribución por categoría IA
              </p>
              <div className="flex-1 flex items-center justify-center">
                <HeroCategoryDonut processes={processes} />
              </div>
              {/* Leyenda compacta */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {CAT_ORDER.filter((c) => processes.some((p) => p.aiCategory === c)).map((c) => {
                  const cfg = AI_CATEGORY_CONFIG[c]
                  return (
                    <div key={c} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${cfg.dotBg} shrink-0`} />
                      <span className="text-[10px] text-text-subtle">{cfg.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── ZONA 2: BANNER DE PROCESOS ───────────────────── */}
        <div className="border-t border-border dark:border-white/6 pt-6 pb-4">

          {/* Phase KPI bar */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mr-2 shrink-0">
              Procesos mapeados · {processes.length}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_PHASES.map((ph) => {
                const cfg = PHASE_CONFIG[ph]
                const cnt = phaseCount[ph]
                return (
                  <button
                    key={ph}
                    onClick={() => setFilterPhase(filterPhase === ph ? null : ph)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold',
                      'border transition-all',
                      filterPhase === ph
                        ? `${cfg.badgeBg} ${cfg.badgeText} border-transparent`
                        : 'bg-transparent border-border dark:border-white/10 text-text-muted hover:border-gray-300',
                    ].join(' ')}
                  >
                    <span className="tabular-nums font-bold">{cnt}</span>
                    <span>{cfg.label}</span>
                  </button>
                )
              })}
              {filterPhase && (
                <button onClick={() => { setFilterPhase(null); setFilterCat(null) }}
                  className="text-[10px] text-text-subtle hover:text-text-muted transition-colors ml-1">
                  Limpiar filtros ×
                </button>
              )}
            </div>
          </div>

          {/* Process cards — compact grid style */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800
                flex items-center justify-center text-2xl">◎</div>
              <p className="text-sm font-bold text-text-muted">Sin procesos mapeados</p>
              <p className="text-xs text-text-subtle max-w-xs leading-relaxed">
                Añade el primer proceso para comenzar el análisis de oportunidades IA.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filtered.map((p) => {
                const isActive  = p.id === activeId
                const catCfg    = AI_CATEGORY_CONFIG[p.aiCategory]
                const oppCfg    = OPPORTUNITY_CONFIG[p.opportunityLevel]
                const phaseCfg  = PHASE_CONFIG[p.phase]

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProcess(p.id)}
                    className={[
                      'w-full text-left rounded-2xl px-4 py-3 transition-all duration-150',
                      'border flex flex-col gap-2',
                      isActive
                        ? 'border-navy/40 bg-navy/5 dark:bg-navy/10 shadow-sm ring-1 ring-navy/20'
                        : 'border-border dark:border-white/6 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-white/14 hover:shadow-sm',
                    ].join(' ')}
                  >
                    {/* Header row: color bar + name + chevron */}
                    <div className="flex items-start gap-2.5">
                      <div
                        className="shrink-0 w-1 h-6 rounded-full mt-0.5"
                        style={{ backgroundColor: CAT_HEX[p.aiCategory], opacity: isActive ? 1 : 0.6 }}
                      />
                      <p className="flex-1 text-xs font-bold text-lean-black dark:text-gray-200 leading-tight line-clamp-2">
                        {p.name}
                      </p>
                      <span className={`shrink-0 text-text-subtle text-[10px] transition-transform duration-200 ${
                        isActive ? 'rotate-180' : ''
                      }`}>↓</span>
                    </div>

                    {/* Dept */}
                    <p className="text-[10px] text-text-subtle truncate pl-3.5">
                      {p.department}
                    </p>

                    {/* Badges row */}
                    <div className="flex items-center gap-1 flex-wrap pl-3.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${phaseCfg.badgeBg} ${phaseCfg.badgeText}`}>
                        {phaseCfg.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${catCfg.badgeBg} ${catCfg.badgeText}`}>
                        {catCfg.label.split(' ')[0]}
                      </span>
                      {p.interview && (
                        <span className={`ml-auto text-xs font-bold tabular-nums ${oppCfg.badgeText}`}>
                          {p.interview.opportunityScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── ZONA 3: DETALLE DEL PROCESO ──────────────────────── */}
      {activeProcess && (
        <div className="max-w-7xl mx-auto w-full px-8 pb-16">
          <ProcessDetailPanel process={activeProcess} />
        </div>
      )}

      {/* Modal de nueva entrevista */}
      {showModal && (
        <ProcessInterviewModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddProcess}
          existingDepartments={existingDepts}
        />
      )}
    </div>
  )
}
