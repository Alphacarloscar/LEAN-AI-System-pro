// ============================================================
// T3 — Value Stream Map
//
// Layout: header sticky + two-column (lista+matrix izq | panel der)
//
// Columna izquierda:
//   - OpportunityMatrix SVG (readiness × oportunidad)
//   - Lista de procesos agrupados por departamento
//
// Columna derecha (sticky):
//   - ProcessPanel: categoría IA + scores + oportunidades
//
// Sprint 2 MVP: datos en Zustand (persist local).
// Sprint 3+: Supabase tabla `value_stream`.
// ============================================================

import { useState, useMemo }         from 'react'
import { useNavigate }               from 'react-router-dom'
import { useT3Store }                from './store'
import { AI_CATEGORY_CONFIG, READINESS_CONFIG, OPPORTUNITY_CONFIG } from './constants'
import { ProcessInterviewModal }     from './components/ProcessInterviewModal'
import type {
  ValueStream, AICategoryCode, OrgReadinessLevel, OpportunityLevel,
} from './types'

// ── Colores hex por categoría IA ──────────────────────────────

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

// ── Utilities UI ──────────────────────────────────────────────

function CategoryDot({ category }: { category: AICategoryCode }) {
  const cfg = AI_CATEGORY_CONFIG[category]
  return <span className={`h-2 w-2 rounded-full ${cfg.dotBg} shrink-0`} />
}

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

function OpportunityBadge({ level }: { level: OpportunityLevel }) {
  const cfg = OPPORTUNITY_CONFIG[level]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  )
}

// ── Barras de score T3 ────────────────────────────────────────

const T3_SCORE_BARS = [
  { key: 'aut', label: 'AUTOMATIZACIÓN', hex: '#6A90C0', light: '#B8D0E8' },
  { key: 'dat', label: 'DATOS',          hex: '#5FAF8A', light: '#B4E4CF' },
  { key: 'imp', label: 'IMPACTO',        hex: '#D4A85C', light: '#E8D0A0' },
] as const

function T3ScoreBars({
  automationScore,
  dataScore,
  impactScore,
  trackWidth = 88,
}: {
  automationScore: number
  dataScore:       number
  impactScore:     number
  trackWidth?:     number
}) {
  const MAX   = 4
  const LBL_W = 72, G1 = 8, TRACK_W = trackWidth, G2 = 6, VAL_COL = 26
  const VBW   = LBL_W + G1 + TRACK_W + G2 + VAL_COL
  const TX    = LBL_W + G1
  const ROW_H = 38, VBH = T3_SCORE_BARS.length * ROW_H + 8
  const values = [automationScore, dataScore, impactScore]

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {T3_SCORE_BARS.map(({ key, hex, light }, i) => {
          const fillW = Math.max((values[i] / MAX) * TRACK_W, 2)
          return (
            <linearGradient key={key} id={`t3bar-${key}`}
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
            <text x={0} y={cy + 3} fontSize={7} fill="#64748B"
              fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
              {label}
            </text>
            <rect x={TX} y={cy - 0.4} width={TRACK_W} height={0.8} fill={hex} opacity={0.08} rx={0.4} />
            <rect x={TX} y={cy - 3}   width={fillW}   height={6}   fill={hex} opacity={0.10} rx={3} />
            <rect x={TX} y={cy - 1.5} width={fillW}   height={3}   fill={`url(#t3bar-${key})`} rx={1.5} />
            <rect x={TX + fillW * 0.08} y={cy - 2} width={fillW * 0.45} height={0.7}
              fill={light} opacity={0.60} rx={0.35} />
            <text x={TX + TRACK_W + G2} y={cy + 3} fontSize={8} fontWeight="600" fill="#94A3B8"
              fontFamily="ui-monospace,monospace">
              {val.toFixed(1)}<tspan fontSize={6.5} opacity={0.5}>/4</tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Mini Opportunity Matrix (SVG) ─────────────────────────────
// Eje X = readiness organizacional, Eje Y = oportunidad IA.
// Cada punto = un proceso. Tamaño del punto ∝ impacto.

function OpportunityMatrix({
  processes,
  activeId,
  onSelect,
}: {
  processes: ValueStream[]
  activeId:  string | null
  onSelect:  (id: string) => void
}) {
  const S = 200    // tamaño del cuadrado
  const P = 28     // padding
  const IN = S - P * 2

  function getCoords(p: ValueStream) {
    const score = p.interview?.opportunityScore ?? 0
    const ready = p.interview?.readinessScore ?? 0
    const rx  = P + (ready / 4) * IN
    const ry  = P + (1 - score / 4) * IN
    return { rx, ry }
  }

  const QUADRANT_LABELS = [
    { x: P + IN * 0.72, y: P + IN * 0.14, text: 'Pilotar ya', color: '#5FAF8A' },
    { x: P + IN * 0.04, y: P + IN * 0.14, text: 'Preparar',   color: '#D4A85C' },
    { x: P + IN * 0.72, y: P + IN * 0.78, text: 'Quick wins', color: '#9AAEC8' },
    { x: P + IN * 0.04, y: P + IN * 0.78, text: 'Evaluar',    color: '#94A3B8' },
  ]

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <clipPath id="t3-matrix-clip">
          <rect x={P} y={P} width={IN} height={IN} rx={4} />
        </clipPath>
      </defs>

      {/* Quadrant fills */}
      <g clipPath="url(#t3-matrix-clip)">
        <rect x={P}        y={P}        width={IN/2} height={IN/2} fill="#D4A85C" opacity={0.04} />
        <rect x={P + IN/2} y={P}        width={IN/2} height={IN/2} fill="#5FAF8A" opacity={0.06} />
        <rect x={P}        y={P + IN/2} width={IN/2} height={IN/2} fill="#94A3B8" opacity={0.03} />
        <rect x={P + IN/2} y={P + IN/2} width={IN/2} height={IN/2} fill="#9AAEC8" opacity={0.04} />
      </g>

      {/* Border */}
      <rect x={P} y={P} width={IN} height={IN} rx={4} fill="none"
        stroke="#E5E7EB" strokeWidth={0.8} />

      {/* Crosshairs */}
      <line x1={P + IN/2} y1={P} x2={P + IN/2} y2={P + IN}
        stroke="#E5E7EB" strokeWidth={0.6} strokeDasharray="2 2" />
      <line x1={P} y1={P + IN/2} x2={P + IN} y2={P + IN/2}
        stroke="#E5E7EB" strokeWidth={0.6} strokeDasharray="2 2" />

      {/* Quadrant labels */}
      {QUADRANT_LABELS.map((q, i) => (
        <text key={i} x={q.x} y={q.y} fontSize={5.5} fill={q.color}
          fontFamily="ui-monospace,monospace" letterSpacing="0.02em" opacity={0.7}>
          {q.text}
        </text>
      ))}

      {/* Axis labels */}
      <text x={P + IN/2} y={P - 7} fontSize={5.5} fill="#94A3B8"
        fontFamily="ui-monospace,monospace" textAnchor="middle">
        READINESS →
      </text>
      <text
        x={P - 7} y={P + IN/2}
        fontSize={5.5} fill="#94A3B8"
        fontFamily="ui-monospace,monospace"
        textAnchor="middle"
        transform={`rotate(-90, ${P - 7}, ${P + IN/2})`}
      >
        OPORTUNIDAD IA ↑
      </text>

      {/* Process dots */}
      {processes.map((p) => {
        const { rx, ry } = getCoords(p)
        const hex        = CAT_HEX[p.aiCategory]
        const isActive   = p.id === activeId
        const dotR       = isActive ? 5.5 : 4
        return (
          <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(p.id)}>
            {/* Glow */}
            <circle cx={rx} cy={ry} r={dotR * 2.2} fill={hex} opacity={isActive ? 0.18 : 0.08} />
            <circle cx={rx} cy={ry} r={dotR * 1.4} fill={hex} opacity={isActive ? 0.22 : 0.12} />
            {/* Main dot */}
            <circle cx={rx} cy={ry} r={dotR} fill={hex} opacity={isActive ? 1 : 0.75}
              stroke={isActive ? '#fff' : 'none'} strokeWidth={1} />
            {/* Shine */}
            <ellipse cx={rx - dotR * 0.2} cy={ry - dotR * 0.3}
              rx={dotR * 0.35} ry={dotR * 0.2}
              fill="#fff" opacity={0.35} />
          </g>
        )
      })}
    </svg>
  )
}

// ── Resumen por departamento (overview chart) ─────────────────

function DepartmentSummaryChart({ processes }: { processes: ValueStream[] }) {
  const byDept = useMemo(() => {
    const map = new Map<string, ValueStream[]>()
    processes.forEach((p) => {
      const arr = map.get(p.department) ?? []
      arr.push(p)
      map.set(p.department, arr)
    })
    return Array.from(map.entries())
      .map(([dept, members]) => ({
        dept,
        total: members.length,
        highOpp: members.filter((m) =>
          m.opportunityLevel === 'critica' || m.opportunityLevel === 'alta'
        ).length,
        segments: CAT_ORDER
          .map((cat) => ({ cat, count: members.filter((m) => m.aiCategory === cat).length }))
          .filter((s) => s.count > 0),
      }))
      .sort((a, b) => b.highOpp - a.highOpp || b.total - a.total)
  }, [processes])

  const BW = 10, GAP = 28, LM = 26, RM = 8
  const CH = 80, TM = 16, LH = 28
  const totalW = LM + byDept.length * (BW + GAP) - GAP + RM
  const svgH   = TM + CH + LH

  return (
    <svg viewBox={`0 0 ${totalW} ${svgH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      {byDept.map(({ dept, total, highOpp, segments }, di) => {
        const x = LM + di * (BW + GAP)
        let stackY = TM + CH

        const isHighRisk = highOpp > 0
        const labelColor = isHighRisk ? '#C06060' : '#94A3B8'

        return (
          <g key={dept}>
            {segments.map(({ cat, count }) => {
              const segH = (count / total) * CH
              stackY -= segH
              const hex  = CAT_HEX[cat]
              return (
                <g key={cat}>
                  <defs>
                    <linearGradient id={`t3dep-${di}-${cat}`}
                      x1="0" y1="0" x2="0" y2="1"
                      gradientUnits="userSpaceOnUse">
                      <stop offset="0%"   stopColor={hex} stopOpacity="0.95" />
                      <stop offset="55%"  stopColor={hex} stopOpacity="0.75" />
                      <stop offset="100%" stopColor={hex} stopOpacity="0.45" />
                    </linearGradient>
                  </defs>
                  <rect
                    x={x} y={stackY} width={BW} height={segH}
                    fill={`url(#t3dep-${di}-${cat})`} rx={2}
                  />
                  <rect x={x + BW * 0.2} y={stackY + 0.5}
                    width={BW * 0.35} height={Math.min(segH * 0.45, 2.5)}
                    fill="#fff" opacity={0.28} rx={0.8} />
                </g>
              )
            })}

            {/* Track base */}
            <rect x={x} y={TM} width={BW} height={CH}
              fill="currentColor" opacity={0.04} rx={2} className="text-gray-500" />

            {/* Count */}
            <text x={x + BW / 2} y={TM - 5} fontSize={7} fontWeight="700"
              fill={isHighRisk ? '#C06060' : '#64748B'}
              textAnchor="middle" fontFamily="ui-monospace,monospace">
              {total}
            </text>

            {/* Risk dot */}
            {isHighRisk && (
              <circle cx={x + BW + 3} cy={TM - 3} r={2} fill="#C06060" opacity={0.7} />
            )}

            {/* Dept label */}
            <text
              x={x + BW / 2}
              y={TM + CH + LH * 0.5}
              fontSize={5.5}
              fill={labelColor}
              textAnchor="middle"
              fontFamily="ui-sans-serif,sans-serif"
              style={{ letterSpacing: '0.01em' }}
            >
              {dept.split(' ')[0]}
            </text>
          </g>
        )
      })}

      {/* Eje Y */}
      <line x1={LM - 4} y1={TM} x2={LM - 4} y2={TM + CH}
        stroke="#E5E7EB" strokeWidth={0.6} />
      {[0, 0.5, 1].map((pct) => (
        <text key={pct} x={LM - 7} y={TM + CH - pct * CH + 2}
          fontSize={5.5} textAnchor="end" fill="#94A3B8"
          fontFamily="ui-monospace,monospace">
          {pct === 0 ? '' : pct === 0.5 ? '50%' : '100%'}
        </text>
      ))}
    </svg>
  )
}

// ── ProcessPanel — detalle del proceso seleccionado ───────────

function ProcessPanel({
  process,
}: {
  process: ValueStream
}) {
  const catCfg   = AI_CATEGORY_CONFIG[process.aiCategory]
  const hasInterview = !!process.interview

  const validatedOpps  = process.opportunities.filter((o) => o.status === 'validada')
  const suggestedOpps  = process.opportunities.filter((o) => o.status === 'sugerida')
  const discardedOpps  = process.opportunities.filter((o) => o.status === 'descartada')

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

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="flex items-start divide-x divide-border dark:divide-white/6
        border-b border-border dark:border-white/6">

        {/* Identidad */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            {process.department}
          </p>
          <p className="text-sm font-semibold text-lean-black dark:text-gray-100 leading-snug">
            {process.name}
          </p>
          {(process.owner || process.ownerRole) && (
            <p className="text-xs text-text-subtle mt-0.5">
              {[process.owner, process.ownerRole].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <CategoryBadge category={process.aiCategory} />
            <ReadinessBadge level={process.orgReadiness} />
            <OpportunityBadge level={process.opportunityLevel} />
            {process.manualOverride && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning-light text-warning-dark">
                Override consultor
              </span>
            )}
          </div>
        </div>

        {/* Oportunity score */}
        {hasInterview && (
          <div className="w-[100px] px-3 py-3 flex flex-col items-center justify-center">
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1 text-center">
              Oportunidad
            </p>
            <p className="text-2xl font-bold text-lean-black dark:text-gray-100 tabular-nums">
              {process.interview!.opportunityScore.toFixed(1)}
            </p>
            <p className="text-[9px] text-text-subtle">/4.0</p>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex divide-x divide-border/30 dark:divide-white/6 min-h-0 flex-1">

        {/* LEFT — descripción + mini matrix */}
        <div className="w-[180px] shrink-0 px-3 py-4 flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
              Categoría IA
            </p>
            <p className="text-[11px] font-semibold text-lean-black dark:text-gray-200 leading-snug mb-1">
              {catCfg.tagline}
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {catCfg.description}
            </p>
          </div>

          {/* Mini matrix posición */}
          {hasInterview && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle">
                Posición
              </p>
              <OpportunityMatrix
                processes={[process]}
                activeId={process.id}
                onSelect={() => undefined}
              />
            </div>
          )}

          {!hasInterview && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[11px] text-text-subtle text-center leading-relaxed">
                Entrevista pendiente
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — oportunidades IA */}
        <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
              Oportunidades IA
            </p>
            {process.opportunities.length === 0 ? (
              <p className="text-xs text-text-subtle">
                Completa la entrevista para generar oportunidades.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Validadas primero */}
                {validatedOpps.map((opp) => (
                  <div key={opp.id}
                    className="rounded-xl border border-success-dark/20 bg-success-light/10
                      dark:bg-success-dark/5 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-success-dark" />
                      <p className="text-[11px] font-semibold text-lean-black dark:text-gray-200">
                        {opp.title}
                      </p>
                      <span className="ml-auto text-[9px] font-semibold text-success-dark">VALIDADA</span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed mb-1.5">
                      {opp.description}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${effortColors[opp.effort]}`}>
                        Esfuerzo {opp.effort}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${impactColors[opp.impact]}`}>
                        Impacto {opp.impact}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Sugeridas */}
                {suggestedOpps.map((opp) => (
                  <div key={opp.id}
                    className="rounded-xl border border-border dark:border-white/8
                      bg-white dark:bg-gray-900/50 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-info-dark" />
                      <p className="text-[11px] font-semibold text-lean-black dark:text-gray-200">
                        {opp.title}
                      </p>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed mb-1.5">
                      {opp.description}
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${effortColors[opp.effort]}`}>
                        Esfuerzo {opp.effort}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${impactColors[opp.impact]}`}>
                        Impacto {opp.impact}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Descartadas (colapsadas) */}
                {discardedOpps.length > 0 && (
                  <p className="text-[10px] text-text-subtle">
                    + {discardedOpps.length} descartada{discardedOpps.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Descripción del proceso */}
          {process.description && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
                Descripción del proceso
              </p>
              <p className="text-[11px] text-text-muted leading-relaxed">{process.description}</p>
            </div>
          )}

          {/* Notas del consultor */}
          {process.notes && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
                Notas del consultor
              </p>
              <p className="text-[11px] text-text-muted leading-relaxed italic">{process.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER — score bars */}
      {hasInterview && (
        <div className="border-t border-border dark:border-white/6 px-4 py-3">
          <T3ScoreBars
            automationScore={process.interview!.automationScore}
            dataScore={process.interview!.dataScore}
            impactScore={process.interview!.impactScore}
            trackWidth={260}
          />
        </div>
      )}
    </div>
  )
}

// ── T3View principal ──────────────────────────────────────────

interface T3ViewProps {
  companyName: string
  onBack?:     () => void
}

export function T3View({ companyName, onBack }: T3ViewProps) {
  const navigate                    = useNavigate()
  const { processes, addProcess } = useT3Store()
  const [activeId, setActiveId]     = useState<string | null>(processes[0]?.id ?? null)
  const [showModal, setShowModal]   = useState(false)

  const activeProcess = useMemo(
    () => processes.find((p) => p.id === activeId) ?? null,
    [processes, activeId]
  )

  // Agrupar por departamento
  const byDept = useMemo(() => {
    const map = new Map<string, ValueStream[]>()
    processes.forEach((p) => {
      const arr = map.get(p.department) ?? []
      arr.push(p)
      map.set(p.department, arr)
    })
    return Array.from(map.entries()).sort((a, b) => {
      const aHigh = a[1].filter((p) => p.opportunityLevel === 'critica' || p.opportunityLevel === 'alta').length
      const bHigh = b[1].filter((p) => p.opportunityLevel === 'critica' || p.opportunityLevel === 'alta').length
      return bHigh - aHigh || b[1].length - a[1].length
    })
  }, [processes])

  // Métricas globales
  const totalCritica = processes.filter((p) => p.opportunityLevel === 'critica').length
  const totalAlta    = processes.filter((p) => p.opportunityLevel === 'alta').length
  const totalMedia   = processes.filter((p) => p.opportunityLevel === 'media').length
  const readyAlta    = processes.filter((p) => p.orgReadiness === 'alta').length

  const existingDepts = Array.from(new Set(processes.map((p) => p.department)))

  function handleAddProcess(p: Omit<ValueStream, 'id' | 'createdAt'>) {
    addProcess(p)
    setShowModal(false)
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-white dark:bg-gray-950">

      {/* ── Header sticky ───────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm
        border-b border-border dark:border-white/6 px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onBack ? onBack() : navigate('/')}
            className="h-8 w-8 rounded-full flex items-center justify-center
              text-text-subtle hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
              {companyName} · Fase L · Listen
            </p>
            <h1 className="text-base font-semibold text-lean-black dark:text-gray-100 leading-tight">
              T3 — Value Stream Map
            </h1>
          </div>

          {/* KPI strip */}
          <div className="hidden sm:flex items-center gap-4">
            {[
              { label: 'Crítica',  value: totalCritica, color: 'text-navy dark:text-info-soft' },
              { label: 'Alta',     value: totalAlta,    color: 'text-info-dark' },
              { label: 'Media',    value: totalMedia,   color: 'text-warning-dark' },
              { label: 'Equipos listos', value: readyAlta, color: 'text-success-dark' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-lg font-bold tabular-nums leading-none ${color}`}>{value}</p>
                <p className="text-[9px] text-text-subtle mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
              bg-navy text-white hover:bg-navy/80 transition-colors shrink-0"
          >
            + Proceso
          </button>
        </div>
      </div>

      {/* ── Layout dos columnas ──────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Columna izquierda ────────────────────────────── */}
        <div className="w-[340px] shrink-0 flex flex-col border-r border-border dark:border-white/6
          overflow-y-auto">

          {/* Overview charts */}
          <div className="px-4 pt-4 pb-2">
            <div className="grid grid-cols-2 gap-3">

              {/* Opportunity Matrix */}
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 p-3">
                <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                  Matriz oportunidad
                </p>
                <OpportunityMatrix
                  processes={processes}
                  activeId={activeId}
                  onSelect={setActiveId}
                />
                {/* Leyenda */}
                <div className="mt-2 flex flex-col gap-1">
                  {CAT_ORDER.filter((c) => processes.some((p) => p.aiCategory === c)).map((c) => {
                    const cfg = AI_CATEGORY_CONFIG[c]
                    return (
                      <div key={c} className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotBg} shrink-0`} />
                        <span className="text-[9px] text-text-subtle truncate">{cfg.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Department Summary */}
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 p-3">
                <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                  Por departamento
                </p>
                <DepartmentSummaryChart processes={processes} />
                <div className="mt-2 flex flex-col gap-1">
                  {CAT_ORDER.filter((c) => processes.some((p) => p.aiCategory === c)).map((c) => {
                    const cfg = AI_CATEGORY_CONFIG[c]
                    return (
                      <div key={c} className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotBg} shrink-0`} />
                        <span className="text-[9px] text-text-subtle truncate">{cfg.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de procesos por departamento */}
          <div className="flex-1 px-3 pt-1 pb-4">
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2 px-1">
              Procesos mapeados · {processes.length}
            </p>

            {byDept.map(([dept, members]) => {
              const highOpp = members.filter(
                (m) => m.opportunityLevel === 'critica' || m.opportunityLevel === 'alta'
              ).length
              return (
                <div key={dept} className="mb-3">
                  {/* Dept header */}
                  <div className="flex items-center gap-2 px-1 mb-1.5">
                    <p className="text-[10px] font-medium text-text-muted truncate flex-1">{dept}</p>
                    {highOpp > 0 && (
                      <span className="text-[9px] font-semibold text-danger-dark shrink-0">
                        {highOpp} alta prioridad
                      </span>
                    )}
                  </div>

                  {members.map((p) => {
                    const isActive  = p.id === activeId
                    const catCfg    = AI_CATEGORY_CONFIG[p.aiCategory]
                    const oppCfg    = OPPORTUNITY_CONFIG[p.opportunityLevel]
                    const hasCrit   = p.opportunityLevel === 'critica'

                    return (
                      <button
                        key={p.id}
                        onClick={() => setActiveId(p.id)}
                        className={[
                          'w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-all duration-150',
                          'border',
                          isActive
                            ? 'border-navy/30 bg-navy/5 dark:bg-navy/10'
                            : hasCrit
                            ? 'border-navy/15 bg-white dark:bg-gray-900 hover:border-navy/30'
                            : 'border-border dark:border-white/6 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-white/12',
                        ].join(' ')}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <CategoryDot category={p.aiCategory} />
                          <p className="text-[11px] font-semibold text-lean-black dark:text-gray-200
                            truncate flex-1 leading-snug">
                            {p.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${catCfg.badgeBg} ${catCfg.badgeText}`}>
                            {catCfg.label.split(' ')[0]}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${oppCfg.badgeBg} ${oppCfg.badgeText}`}>
                            {oppCfg.label}
                          </span>
                          {p.interview && (
                            <span className="text-[9px] text-text-subtle ml-auto tabular-nums">
                              {p.interview.opportunityScore.toFixed(1)}/4
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}

            {processes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center
                  justify-center text-xl mb-3">
                  ◎
                </div>
                <p className="text-sm font-medium text-text-muted mb-1">Sin procesos mapeados</p>
                <p className="text-xs text-text-subtle leading-relaxed">
                  Añade el primer proceso para comenzar el análisis de oportunidades IA.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Panel derecho ────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {activeProcess ? (
            <ProcessPanel process={activeProcess} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
              <div className="h-16 w-16 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center
                justify-center text-3xl mb-4">
                ◎
              </div>
              <p className="text-sm font-medium text-text-muted mb-2">
                Selecciona un proceso
              </p>
              <p className="text-xs text-text-subtle max-w-[240px] leading-relaxed">
                Haz click en un proceso de la lista para ver su análisis de oportunidades IA y scores de diagnóstico.
              </p>
            </div>
          )}
        </div>
      </div>

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
