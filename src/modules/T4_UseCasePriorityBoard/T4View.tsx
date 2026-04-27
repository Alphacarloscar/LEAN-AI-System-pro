// ============================================================
// T4 — Use Case Priority Board  (Sprint 2 — Redesign)
//
// Layout: 3 zonas verticales
//   1. HERO — Executive Dashboard
//      · 4 KPI boxes (GO, ahorro estimado, payback, pendientes)
//      · Roadmap trimestral (strips por quarter)
//   2. BANNER — Filtros por estado + cards de casos de uso
//   3. DETALLE — Panel expansible al seleccionar un caso
//      Tabs: Scoring | Economía | Hoja de ruta | Contexto T1/T2
//      (Scoring tab incluye scatter matrix + sliders 0-100)
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
  ROADMAP_QUARTERS,
  computePriorityScore,
  getGoNoGoRecommendation,
  computeROIFromEconomics,
  IMPLEMENTATION_COST_BENCHMARKS,
  EFFICIENCY_GAIN_BENCHMARKS,
  HOURLY_RATE_PRESETS,
  GO_NOGO_THRESHOLDS,
} from './constants'
import { ImportFromT3Modal } from './components/ImportFromT3Modal'
import type {
  UseCase, UseCaseStatus, UseCaseScores, UseCaseEconomics,
} from './types'

// ── Helpers de color ──────────────────────────────────────────

function priorityScoreColor(score: number): string {
  if (score >= GO_NOGO_THRESHOLDS.go)      return 'text-success-dark'
  if (score >= GO_NOGO_THRESHOLDS.pending) return 'text-warning-dark'
  return 'text-danger-dark'
}

function fmtEur(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}€${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${sign}€${Math.round(abs / 1_000)}k`
  return `${sign}€${Math.round(abs)}`
}

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

// ── HERO: Executive Dashboard ─────────────────────────────────

interface ExecDashboardProps {
  useCases: UseCase[]
}

function ExecDashboard({ useCases }: ExecDashboardProps) {
  const totalGo    = useCases.filter((uc) => uc.status === 'go').length
  const pending    = useCases.filter((uc) => uc.status === 'candidato' || uc.status === 'priorizado').length

  // Suma de ahorro anual estimado de todos los casos con economics
  const roisWithData = useCases
    .filter((uc) => uc.economics)
    .map((uc) => computeROIFromEconomics(uc.economics!))

  const totalAnnualSaving = roisWithData.reduce((acc, r) => acc + r.annualSaving, 0)
  const avgPayback = roisWithData.length > 0
    ? roisWithData.reduce((acc, r) => acc + r.paybackMonths, 0) / roisWithData.length
    : null

  const kpis = [
    {
      label:    'Casos aprobados (GO)',
      value:    String(totalGo),
      subtext:  `de ${useCases.length} totales`,
      color:    'text-success-dark',
      dotColor: 'bg-success-dark',
    },
    {
      label:    'Ahorro anual estimado',
      value:    fmtEur(totalAnnualSaving),
      subtext:  `${roisWithData.length} casos con datos económicos`,
      color:    'text-lean-black dark:text-gray-100',
      dotColor: 'bg-navy',
    },
    {
      label:    'Payback promedio',
      value:    avgPayback !== null ? `${avgPayback.toFixed(1)} meses` : '—',
      subtext:  'recuperación de inversión',
      color:    'text-lean-black dark:text-gray-100',
      dotColor: 'bg-info-dark',
    },
    {
      label:    'Pendientes de decisión',
      value:    String(pending),
      subtext:  'candidatos + priorizados',
      color:    pending > 0 ? 'text-warning-dark' : 'text-text-muted',
      dotColor: pending > 0 ? 'bg-warning-dark' : 'bg-gray-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label}
          className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6
            px-5 py-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${kpi.dotColor}`} />
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle leading-tight">
              {kpi.label}
            </p>
          </div>
          <p className={`text-2xl font-bold tabular-nums leading-none ${kpi.color}`}>
            {kpi.value}
          </p>
          <p className="text-[10px] text-text-subtle">{kpi.subtext}</p>
        </div>
      ))}
    </div>
  )
}

// ── HERO: Quarterly Roadmap — tarjetas interactivas ──────────

function QuarterlyRoadmap({
  useCases,
  activeId,
  onSelect,
}: {
  useCases: UseCase[]
  activeId: string | null
  onSelect: (id: string) => void
}) {
  const byQuarter = useMemo(() => {
    const map = new Map<string, UseCase[]>()
    ROADMAP_QUARTERS.forEach((q) => map.set(q, []))
    useCases.forEach((uc) => {
      if (uc.roadmap?.quarter && map.has(uc.roadmap.quarter)) {
        map.get(uc.roadmap.quarter)!.push(uc)
      }
    })
    return map
  }, [useCases])

  const quartersToShow = useMemo(() => {
    const all  = [...ROADMAP_QUARTERS]
    const used = all.filter((q) => (byQuarter.get(q)?.length ?? 0) > 0)
    if (used.length === 0) return all.slice(0, 4)
    const lastUsedIdx = all.indexOf(used[used.length - 1])
    return all.slice(0, Math.min(lastUsedIdx + 3, all.length))
  }, [byQuarter])

  const unassigned = useCases.filter((uc) => !uc.roadmap?.quarter)

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 px-6 py-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-5">
        Roadmap trimestral — distribución planificada
      </p>

      <div className="flex flex-col divide-y divide-border dark:divide-white/6">
        {quartersToShow.map((quarter) => {
          const cases   = byQuarter.get(quarter) ?? []
          const isEmpty = cases.length === 0
          return (
            <div key={quarter} className={`flex items-start gap-5 py-4 first:pt-0 last:pb-0 ${isEmpty ? 'opacity-40' : ''}`}>
              {/* Quarter label — fijo */}
              <div className="shrink-0 w-20 pt-1">
                <p className="text-sm font-bold text-lean-black dark:text-gray-200 tabular-nums">
                  {quarter.split(' ')[0]}
                </p>
                <p className="text-[10px] text-text-subtle tabular-nums">
                  {quarter.split(' ')[1]}
                </p>
                {!isEmpty && (
                  <p className="text-[9px] font-mono text-text-subtle mt-0.5">
                    {cases.length} caso{cases.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Tarjetas — scroll horizontal si hay muchas */}
              <div className="flex-1 overflow-x-auto">
                {isEmpty ? (
                  <div className="flex items-center h-14">
                    <div className="w-full h-px opacity-50"
                      style={{ background: 'repeating-linear-gradient(to right,#CBD5E1 0,#CBD5E1 5px,transparent 5px,transparent 10px)' }}
                    />
                    <span className="shrink-0 ml-3 text-[10px] text-text-subtle italic">Sin casos asignados</span>
                  </div>
                ) : (
                  <div className="flex gap-2.5 pb-0.5">
                    {cases.map((uc) => {
                      const isActive  = uc.id === activeId
                      const statusCfg = STATUS_CONFIG[uc.status]
                      const roi       = uc.economics ? computeROIFromEconomics(uc.economics) : null
                      return (
                        <button
                          key={uc.id}
                          onClick={() => onSelect(uc.id)}
                          className={[
                            'shrink-0 w-52 text-left rounded-xl border px-3 py-2.5 transition-all duration-150',
                            isActive
                              ? 'border-navy/40 bg-navy/5 dark:bg-navy/10 ring-1 ring-navy/20 shadow-sm'
                              : 'border-border dark:border-white/8 bg-white dark:bg-gray-950 hover:border-navy/30 hover:shadow-sm',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold
                              ${statusCfg.badgeBg} ${statusCfg.badgeText}`}>
                              {statusCfg.label}
                            </span>
                            <span className={`text-sm font-bold tabular-nums ${priorityScoreColor(uc.priorityScore)}`}>
                              {uc.priorityScore.toFixed(0)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-lean-black dark:text-gray-200
                            leading-tight line-clamp-2 mb-1">
                            {uc.name}
                          </p>
                          <p className="text-[10px] text-text-subtle truncate">{uc.department}</p>
                          {roi && roi.annualSaving > 0 && (
                            <p className="text-[10px] font-semibold text-success-dark mt-1">
                              {fmtEur(roi.annualSaving)}/año · payback {roi.paybackMonths.toFixed(1)}m
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Sin quarter asignado */}
        {unassigned.length > 0 && (
          <div className="flex items-start gap-5 pt-4 opacity-50">
            <div className="shrink-0 w-20 pt-1">
              <p className="text-[10px] font-mono font-bold text-text-subtle">Sin Q</p>
            </div>
            <div className="flex-1 flex gap-2 flex-wrap">
              {unassigned.map((uc) => (
                <button
                  key={uc.id}
                  onClick={() => onSelect(uc.id)}
                  className="shrink-0 text-left rounded-xl border border-dashed border-border
                    dark:border-white/8 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 transition-all
                    hover:border-gray-400 hover:opacity-100"
                >
                  <p className="text-[10px] font-semibold text-text-muted truncate max-w-[160px]">{uc.name}</p>
                  <p className="text-[9px] text-text-subtle">{uc.department}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Scatter matrix (para tab Scoring del detalle) ─────────────
// X = feasibility (0-100), Y = kpiImpact (0-100). Umbral: 60.

function PriorityMatrix({
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

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <clipPath id="t4matrix-clip">
          <rect x={P} y={P} width={IN} height={IN} rx={6} />
        </clipPath>
        {useCases.map((uc) => {
          const hex = STATUS_CONFIG[uc.status].hex
          return (
            <radialGradient key={`mglow-${uc.id}`} id={`t4mglow-${uc.id}`}
              cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={hex} stopOpacity="0.35" />
              <stop offset="100%" stopColor={hex} stopOpacity="0" />
            </radialGradient>
          )
        })}
      </defs>

      {/* Quadrant fills */}
      <g clipPath="url(#t4matrix-clip)">
        <rect x={P}              y={P}              width={IN * 0.60} height={IN * 0.40} fill="#6A90C0" opacity={0.05} />
        <rect x={P + IN * 0.60}  y={P}              width={IN * 0.40} height={IN * 0.40} fill="#5FAF8A" opacity={0.07} />
        <rect x={P}              y={P + IN * 0.40}  width={IN * 0.60} height={IN * 0.60} fill="#E5E7EB" opacity={0.03} />
        <rect x={P + IN * 0.60}  y={P + IN * 0.40}  width={IN * 0.40} height={IN * 0.60} fill="#9AAEC8" opacity={0.05} />
      </g>

      {/* Grid border */}
      <rect x={P} y={P} width={IN} height={IN} rx={6} fill="none"
        stroke="#E5E7EB" strokeWidth={1} />

      {/* Threshold dividers */}
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

      {/* Axis labels — inside the plot area to avoid overflow */}
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

      {/* Use case dots */}
      {useCases.map((uc) => {
        const x        = P + (uc.scores.feasibility / 100) * IN
        const y        = P + (1 - uc.scores.kpiImpact / 100) * IN
        const hex      = STATUS_CONFIG[uc.status].hex
        const isActive = uc.id === activeId
        const r        = isActive ? 9 : 7

        return (
          <g key={uc.id} style={{ cursor: 'pointer' }} onClick={() => onSelect(uc.id)}>
            <circle cx={x} cy={y} r={r * 3.5} fill={`url(#t4mglow-${uc.id})`} />
            <circle cx={x} cy={y} r={r * 1.8} fill={hex} opacity={isActive ? 0.25 : 0.12} />
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

// ── Score bars (visualización 0-100) ─────────────────────────

const T4_SCORE_BARS = [
  { key: 'kpiImpact',      cfg: DIMENSION_CONFIG.kpiImpact },
  { key: 'feasibility',    cfg: DIMENSION_CONFIG.feasibility },
  { key: 'aiRisk',         cfg: DIMENSION_CONFIG.aiRisk },
  { key: 'dataDependency', cfg: DIMENSION_CONFIG.dataDependency },
] as const

function T4ScoreBars({ scores, trackWidth = 220 }: { scores: UseCaseScores; trackWidth?: number }) {
  const MAX = 100
  const LBL_W = 110, G1 = 8, G2 = 8, VAL_COL = 34
  const VBW   = LBL_W + G1 + trackWidth + G2 + VAL_COL
  const TX    = LBL_W + G1
  const ROW_H = 34, VBH = T4_SCORE_BARS.length * ROW_H + 8
  const values = [scores.kpiImpact, scores.feasibility, scores.aiRisk, scores.dataDependency]

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block' }}>
      <defs>
        {T4_SCORE_BARS.map(({ key, cfg }, i) => {
          const fillW = Math.max((values[i] / MAX) * trackWidth, 2)
          return (
            <linearGradient key={key} id={`t4sb2-${key}`}
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
        const val    = values[i]
        const fillW  = Math.max((val / MAX) * trackWidth, 2)
        const cy     = i * ROW_H + ROW_H / 2 + 3
        const lblIdx = Math.min(4, Math.floor(val / 20))
        const isNeg  = cfg.direction === 'negative'

        return (
          <g key={key}>
            <text x={0} y={cy - 2} fontSize={7.5} fill="#64748B"
              fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
              {cfg.label}
            </text>
            <text x={0} y={cy + 8} fontSize={6.5} fill="#94A3B8"
              fontFamily="ui-monospace,monospace">
              {cfg.scaleLabels[lblIdx]}{isNeg ? ' ↑ riesgo' : ''}
            </text>
            {/* Track bg — misma altura que la barra de relleno para evitar efecto doble-pista */}
            <rect x={TX} y={cy - 1.5} width={trackWidth} height={3}
              fill={cfg.hex} opacity={0.08} rx={1.5} />
            {/* Fill bar */}
            <rect x={TX} y={cy - 1.5} width={fillW} height={3}
              fill={`url(#t4sb2-${key})`} rx={1.5} />
            {/* Gloss */}
            <rect x={TX + fillW * 0.08} y={cy - 2}
              width={fillW * 0.45} height={0.7}
              fill={cfg.light} opacity={0.60} rx={0.35} />
            {/* Value */}
            <text x={TX + trackWidth + G2} y={cy + 3}
              fontSize={8} fontWeight="600" fill="#94A3B8"
              fontFamily="ui-monospace,monospace">
              {val}<tspan fontSize={6} opacity={0.5}>/100</tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Score input — slider 0-100 ────────────────────────────────

function ScoreInput({
  label,
  description,
  value,
  onChange,
  isNegative,
  hex,
}: {
  label:      string
  description?: string
  value:      number
  onChange:   (v: number) => void
  isNegative?: boolean
  hex?:       string
}) {
  const barColor = hex ?? '#6A90C0'
  const pct = value  // value ya está en escala 0-100

  // Semantic label for current value
  const cfg      = Object.values(DIMENSION_CONFIG).find((d) => d.label === label)
  const lblIdx   = Math.min(4, Math.floor(value / 20))
  const valueLabel = cfg?.scaleLabels[lblIdx] ?? String(value)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-lean-black dark:text-gray-200">{label}</p>
          {description && (
            <p className="text-[10px] text-text-subtle leading-snug">{description}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <span className="text-sm font-bold tabular-nums text-lean-black dark:text-gray-200">
            {value}
          </span>
          <span className="text-[10px] text-text-subtle ml-0.5">/100</span>
          <p className="text-[9px] text-text-subtle" style={{ color: barColor }}>
            {valueLabel}{isNegative ? ' ↑' : ''}
          </p>
        </div>
      </div>

      {/* Slider */}
      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
            style={{ width: `${pct}%`, backgroundColor: barColor, opacity: 0.7 }}
          />
        </div>
        <input
          type="range"
          min={0} max={100} step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 1 }}
        />
        {/* Thumb indicator — centrado verticalmente en el contenedor h-5 (20px), thumb h-4 (16px) → top 2px */}
        <div
          className="absolute h-4 w-4 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{
            left:            `calc(${pct}% - 8px)`,
            top:             '2px',
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  )
}

// ── Tab Economía ──────────────────────────────────────────────

function EconomicsTab({ useCase }: { useCase: UseCase }) {
  const { updateUseCase } = useT4Store()
  const [editing, setEditing] = useState(false)

  const benchmarkCost = IMPLEMENTATION_COST_BENCHMARKS[useCase.aiCategory]
  const benchmarkEff  = EFFICIENCY_GAIN_BENCHMARKS[useCase.aiCategory]

  // Inicializar economics con defaults de benchmark si no existen
  const defaultEcon: UseCaseEconomics = {
    kpiPrincipal:          '',
    processHoursPerWeek:   10,
    headcount:             2,
    efficiencyGain:        benchmarkEff?.value ?? 0.40,
    efficiencyGainMode:    'benchmark',
    hourlyRate:            HOURLY_RATE_PRESETS.tecnico.rate,
    hourlyRateMode:        'preset',
    hourlyRatePreset:      'tecnico',
    implementationCost:    benchmarkCost?.suggested ?? 20_000,
    implementationCostMode: 'benchmark',
  }

  const [local, setLocal] = useState<UseCaseEconomics>(useCase.economics ?? defaultEcon)

  function patch<K extends keyof UseCaseEconomics>(key: K, val: UseCaseEconomics[K]) {
    setLocal((prev) => ({ ...prev, [key]: val }))
  }

  function handleSave() {
    updateUseCase(useCase.id, { economics: local })
    setEditing(false)
  }

  const econ = editing ? local : (useCase.economics ?? local)
  const roiDisplay = computeROIFromEconomics(econ)

  const ROI_PILL_COLOR = roiDisplay.roi3year > 300
    ? 'text-success-dark bg-success-light'
    : roiDisplay.roi3year > 0
    ? 'text-warning-dark bg-warning-light'
    : 'text-danger-dark bg-danger-light'

  return (
    <div className="flex flex-col gap-6">

      {/* ROI summary boxes */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label:   'Ahorro anual estimado',
            value:   fmtEur(roiDisplay.annualSaving),
            sub:     `${econ.processHoursPerWeek}h/sem × ${econ.headcount} personas × ${Math.round(econ.efficiencyGain * 100)}% ef.`,
            color:   'text-success-dark',
          },
          {
            label:   'Payback estimado',
            value:   roiDisplay.paybackMonths > 0 ? `${roiDisplay.paybackMonths.toFixed(1)} meses` : '—',
            sub:     `${fmtEur(econ.implementationCost)} inversión`,
            color:   'text-lean-black dark:text-gray-100',
          },
          {
            label:   'ROI 3 años',
            value:   roiDisplay.roi3year > 0 ? `${Math.round(roiDisplay.roi3year)}%` : '—',
            sub:     `${fmtEur(roiDisplay.annualSaving * 3 - econ.implementationCost)} beneficio neto`,
            color:   ROI_PILL_COLOR.split(' ')[0],
          },
        ].map((kpi) => (
          <div key={kpi.label}
            className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-border
              dark:border-white/6 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
              {kpi.label}
            </p>
            <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-text-subtle mt-0.5 leading-snug">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Benchmark context */}
      {benchmarkCost && !editing && (
        <div className="rounded-2xl border border-navy/15 bg-navy/3 dark:bg-navy/8 px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-navy/60 mb-1">
            Benchmark · {AI_CATEGORY_LABELS[useCase.aiCategory] ?? useCase.aiCategory}
          </p>
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-[10px] text-text-subtle">Coste de implementación</p>
              <p className="text-xs font-bold text-lean-black dark:text-gray-200">
                {benchmarkCost.label}
              </p>
            </div>
            {benchmarkEff && (
              <div>
                <p className="text-[10px] text-text-subtle">Ganancia de eficiencia</p>
                <p className="text-xs font-bold text-lean-black dark:text-gray-200">
                  {benchmarkEff.label}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit / save toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Datos del caso de uso
        </p>
        {!editing ? (
          <button
            onClick={() => { setLocal(useCase.economics ?? defaultEcon); setEditing(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
              border border-navy/40 text-navy dark:text-info-soft bg-navy/5 dark:bg-navy/10
              hover:bg-navy/10 transition-colors"
          >
            ✎ Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border
                dark:border-white/10 text-text-muted hover:text-text-default transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-navy text-white
                hover:bg-navy/80 transition-colors"
            >
              Guardar
            </button>
          </div>
        )}
      </div>

      {/* Fields grid — datos en tarjetas */}
      <div className="rounded-2xl border border-border dark:border-white/8
        bg-gray-50 dark:bg-gray-900/50 px-5 py-4 flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* KPI principal */}
        <div className="lg:col-span-2">
          <p className="text-[10px] font-mono text-text-subtle mb-1">KPI principal a impactar</p>
          {editing ? (
            <input
              type="text"
              value={local.kpiPrincipal ?? ''}
              onChange={(e) => patch('kpiPrincipal', e.target.value)}
              placeholder="ej. Tiempo de resolución L1, Coste por contratación..."
              className="w-full px-3 py-2 rounded-xl border border-border dark:border-white/10
                bg-white dark:bg-gray-900 text-xs text-lean-black dark:text-gray-200
                focus:outline-none focus:ring-1 focus:ring-navy/30"
            />
          ) : (
            <p className="text-xs font-medium text-lean-black dark:text-gray-200">
              {econ.kpiPrincipal || <span className="italic text-text-subtle">Sin definir</span>}
            </p>
          )}
        </div>

        {/* Horas/semana */}
        <div>
          <p className="text-[10px] font-mono text-text-subtle mb-1">
            Horas/semana del proceso actual
          </p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={168} step={1}
                value={local.processHoursPerWeek}
                onChange={(e) => patch('processHoursPerWeek', Number(e.target.value))}
                className="w-20 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                  bg-white dark:bg-gray-900 text-xs text-lean-black dark:text-gray-200
                  focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums"
              />
              <span className="text-[10px] text-text-subtle">horas por semana</span>
            </div>
          ) : (
            <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
              {econ.processHoursPerWeek}
              <span className="text-xs font-normal text-text-subtle ml-1">h/semana</span>
            </p>
          )}
        </div>

        {/* Headcount */}
        <div>
          <p className="text-[10px] font-mono text-text-subtle mb-1">
            Personas involucradas
          </p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={500} step={1}
                value={local.headcount}
                onChange={(e) => patch('headcount', Number(e.target.value))}
                className="w-20 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                  bg-white dark:bg-gray-900 text-xs text-lean-black dark:text-gray-200
                  focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums"
              />
              <span className="text-[10px] text-text-subtle">personas</span>
            </div>
          ) : (
            <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
              {econ.headcount}
              <span className="text-xs font-normal text-text-subtle ml-1">personas</span>
            </p>
          )}
        </div>

        {/* Ganancia de eficiencia — toggle benchmark/manual */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-mono text-text-subtle">
              Ganancia de eficiencia
            </p>
            {editing && (
              <div className="flex items-center gap-1">
                {(['benchmark', 'manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      patch('efficiencyGainMode', mode)
                      if (mode === 'benchmark' && benchmarkEff) {
                        patch('efficiencyGain', benchmarkEff.value)
                      }
                    }}
                    className={[
                      'px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all',
                      local.efficiencyGainMode === mode
                        ? 'bg-navy text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-text-muted',
                    ].join(' ')}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number" min={0} max={100} step={5}
                value={Math.round(local.efficiencyGain * 100)}
                onChange={(e) => patch('efficiencyGain', Number(e.target.value) / 100)}
                disabled={local.efficiencyGainMode === 'benchmark'}
                className="w-20 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                  bg-white dark:bg-gray-900 text-xs text-lean-black dark:text-gray-200
                  focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-[10px] text-text-subtle">%</span>
              {local.efficiencyGainMode === 'benchmark' && benchmarkEff && (
                <span className="text-[9px] text-navy/60">(benchmark)</span>
              )}
            </div>
          ) : (
            <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
              {Math.round(econ.efficiencyGain * 100)}%
              {econ.efficiencyGainMode === 'benchmark' && (
                <span className="text-[10px] font-normal text-text-subtle ml-1">benchmark</span>
              )}
            </p>
          )}
        </div>

        {/* Coste por hora — toggle preset/manual */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-mono text-text-subtle">Coste/hora cargado</p>
            {editing && (
              <div className="flex items-center gap-1">
                {(['preset', 'manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => patch('hourlyRateMode', mode)}
                    className={[
                      'px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all',
                      local.hourlyRateMode === mode
                        ? 'bg-navy text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-text-muted',
                    ].join(' ')}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>
          {editing ? (
            local.hourlyRateMode === 'preset' ? (
              <div className="flex flex-col gap-1.5">
                {(Object.entries(HOURLY_RATE_PRESETS) as [string, typeof HOURLY_RATE_PRESETS[keyof typeof HOURLY_RATE_PRESETS]][]).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => {
                      patch('hourlyRatePreset', key as 'administrativo' | 'tecnico' | 'directivo')
                      patch('hourlyRate', p.rate)
                    }}
                    className={[
                      'text-left px-3 py-2 rounded-xl border text-[10px] transition-all',
                      local.hourlyRatePreset === key
                        ? 'border-navy/40 bg-navy/5 text-lean-black dark:text-gray-200'
                        : 'border-border dark:border-white/8 text-text-muted hover:border-gray-300',
                    ].join(' ')}
                  >
                    <span className="font-bold">{p.label}</span>
                    <span className="ml-2 opacity-70">{p.hint}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-subtle">€</span>
                <input
                  type="number" min={10} max={500} step={5}
                  value={local.hourlyRate}
                  onChange={(e) => patch('hourlyRate', Number(e.target.value))}
                  className="w-24 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                    bg-white dark:bg-gray-900 text-xs text-lean-black dark:text-gray-200
                    focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums"
                />
                <span className="text-[10px] text-text-subtle">/hora</span>
              </div>
            )
          ) : (
            <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
              €{econ.hourlyRate}/h
              {econ.hourlyRateMode === 'preset' && econ.hourlyRatePreset && (
                <span className="text-[10px] font-normal text-text-subtle ml-1">
                  {HOURLY_RATE_PRESETS[econ.hourlyRatePreset]?.label}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Coste de implementación — toggle benchmark/manual */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-mono text-text-subtle">
              Coste de implementación estimado
            </p>
            {editing && (
              <div className="flex items-center gap-1">
                {(['benchmark', 'manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      patch('implementationCostMode', mode)
                      if (mode === 'benchmark' && benchmarkCost) {
                        patch('implementationCost', benchmarkCost.suggested)
                      }
                    }}
                    className={[
                      'px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all',
                      local.implementationCostMode === mode
                        ? 'bg-navy text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-text-muted',
                    ].join(' ')}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>
          {editing ? (
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-text-subtle">€</span>
              <input
                type="number" min={0} max={2_000_000} step={1000}
                value={local.implementationCost}
                onChange={(e) => patch('implementationCost', Number(e.target.value))}
                disabled={local.implementationCostMode === 'benchmark'}
                className="w-32 px-2 py-1.5 rounded-xl border border-border dark:border-white/10
                  bg-white dark:bg-gray-900 text-xs text-lean-black dark:text-gray-200
                  focus:outline-none focus:ring-1 focus:ring-navy/30 tabular-nums
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-[10px] text-text-subtle">euros (coste total del proyecto)</span>
              {local.implementationCostMode === 'benchmark' && benchmarkCost && (
                <span className="text-[9px] text-navy/60">
                  Rango benchmark: {benchmarkCost.label}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xl font-bold text-lean-black dark:text-gray-200 tabular-nums">
              {fmtEur(econ.implementationCost)}
              {econ.implementationCostMode === 'benchmark' && benchmarkCost && (
                <span className="text-[10px] font-normal text-text-subtle ml-1">
                  benchmark · rango: {benchmarkCost.label}
                </span>
              )}
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

// ── Panel de detalle del caso de uso ─────────────────────────

type DetailTab = 'scoring' | 'economia' | 'roadmap' | 'contexto'

function UseCaseDetailPanel({
  useCase,
  allUseCases,
  onSelect,
}: {
  useCase:     UseCase
  allUseCases: UseCase[]
  onSelect:    (id: string) => void
}) {
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
    setLocalScores((prev) => ({ ...prev, [dim]: v }))
  }

  const previewScore = computePriorityScore(localScores)

  return (
    <div className="border-t border-border dark:border-white/6 bg-white dark:bg-gray-950">

      {/* Panel header */}
      <div className="flex items-start gap-6 px-8 py-5 border-b border-border dark:border-white/6">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            {useCase.department}
            {useCase.importedFromT3 && ` · Importado desde T3`}
            {useCase.sponsorName && ` · ${useCase.sponsorName}`}
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

        {/* Score hero */}
        <div className="shrink-0 text-center">
          <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">
            Score
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

      {/* Tabs — botones con borde azul metálico */}
      <div className="flex gap-2 px-8 py-3 border-b border-border dark:border-white/6 flex-wrap">
        {([
          { key: 'scoring',   label: 'Scoring' },
          { key: 'economia',  label: 'Economía' },
          { key: 'roadmap',   label: 'Hoja de ruta' },
          { key: 'contexto',  label: 'Contexto T1/T2' },
        ] as { key: DetailTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150',
              tab === key
                ? 'border-navy/50 bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft shadow-sm'
                : 'border-border dark:border-white/10 text-text-muted hover:border-navy/30 hover:text-navy/70 dark:hover:text-info-soft/70',
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
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">

            {/* LEFT — scatter matrix */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                Posición en la matriz de prioridad
              </p>
              <PriorityMatrix
                useCases={allUseCases}
                activeId={useCase.id}
                onSelect={onSelect}
              />
              <div className="flex flex-wrap gap-3">
                {STATUS_ORDER.filter((st) => allUseCases.some((uc) => uc.status === st)).map((st) => (
                  <div key={st} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[st].dotBg}`} />
                    <span className="text-[9px] text-text-subtle">{STATUS_CONFIG[st].label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — score bars + editing + go/no-go */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                  Dimensiones de scoring
                </p>
                {!editingScore ? (
                  <button
                    onClick={() => { setEditingScore(true); setLocalScores(useCase.scores) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                      border border-navy/40 text-navy dark:text-info-soft bg-navy/5 dark:bg-navy/10
                      hover:bg-navy/10 transition-colors"
                  >
                    ✎ Editar scores
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingScore(false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border
                        dark:border-white/10 text-text-muted hover:text-text-default transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveScores}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-navy text-white
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
                    <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
                      Score compuesto · ponderado
                    </p>
                    <p className="text-2xl font-bold tabular-nums text-lean-black dark:text-gray-100">
                      {useCase.priorityScore.toFixed(1)}
                      <span className="text-sm font-normal text-text-subtle">/100</span>
                    </p>
                    <p className="text-[10px] text-text-subtle mt-0.5">
                      KPI 35% · facilidad 30% · riesgo IA 20% · dep. datos 15%
                    </p>
                    <p className="text-[10px] text-text-subtle mt-0.5">
                      Umbral GO ≥ {GO_NOGO_THRESHOLDS.go} · Revisar ≥ {GO_NOGO_THRESHOLDS.pending} · NO-GO &lt; {GO_NOGO_THRESHOLDS.pending}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-5 mt-2">
                  <p className="text-[10px] text-text-subtle">
                    Ajusta los scores del taller (0 = mínimo, 100 = máximo).
                    Para riesgo y dependencia de datos, valores altos indican mayor riesgo/dependencia.
                  </p>
                  <ScoreInput
                    label={DIMENSION_CONFIG.kpiImpact.label}
                    description="Mayor valor = mayor impacto en KPIs de negocio"
                    value={localScores.kpiImpact}
                    onChange={(v) => handleScoreChange('kpiImpact', v)}
                    hex={DIMENSION_CONFIG.kpiImpact.hex}
                  />
                  <ScoreInput
                    label={DIMENSION_CONFIG.feasibility.label}
                    description="Mayor valor = más fácil de implementar"
                    value={localScores.feasibility}
                    onChange={(v) => handleScoreChange('feasibility', v)}
                    hex={DIMENSION_CONFIG.feasibility.hex}
                  />
                  <ScoreInput
                    label={DIMENSION_CONFIG.aiRisk.label}
                    description="Mayor valor = mayor riesgo (peor para el score)"
                    value={localScores.aiRisk}
                    onChange={(v) => handleScoreChange('aiRisk', v)}
                    isNegative
                    hex={DIMENSION_CONFIG.aiRisk.hex}
                  />
                  <ScoreInput
                    label={DIMENSION_CONFIG.dataDependency.label}
                    description="Mayor valor = mayor dependencia bloqueante (peor)"
                    value={localScores.dataDependency}
                    onChange={(v) => handleScoreChange('dataDependency', v)}
                    isNegative
                    hex={DIMENSION_CONFIG.dataDependency.hex}
                  />
                  <div className="rounded-xl bg-navy/5 dark:bg-navy/10 px-4 py-2.5 border border-navy/10">
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
                          <p className="text-[10px] text-text-subtle">{ss.stakeholderRole}</p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          {(['kpiImpact', 'feasibility', 'aiRisk', 'dataDependency'] as const).map((dim) => (
                            <div key={dim} className="flex items-center gap-1">
                              <span className="text-[9px] text-text-subtle"
                                style={{ color: DIMENSION_CONFIG[dim].hex }}>
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
                      useCase.goNoGo.decision === 'go'    ? 'text-success-dark' :
                      useCase.goNoGo.decision === 'no_go' ? 'text-danger-dark'  : 'text-warning-dark'
                    }`}>
                      {useCase.goNoGo.decision === 'go' ? '✓ GO' :
                       useCase.goNoGo.decision === 'no_go' ? '✕ NO-GO' : '◎ PENDIENTE'}
                    </span>
                    {useCase.goNoGo.decidedBy && (
                      <span className="text-[10px] text-text-subtle">· {useCase.goNoGo.decidedBy}</span>
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

        {/* ── TAB: ECONOMÍA ────────────────────────────────── */}
        {tab === 'economia' && <EconomicsTab useCase={useCase} />}

        {/* ── TAB: HOJA DE RUTA ────────────────────────────── */}
        {tab === 'roadmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                        Responsable
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
            {useCase.notes && (
              <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50
                border border-border dark:border-white/6 px-4 py-3 h-fit">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                  Notas del consultor
                </p>
                <p className="text-xs text-text-muted leading-relaxed italic">{useCase.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: CONTEXTO T1/T2 ──────────────────────────── */}
        {tab === 'contexto' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* T1 */}
            <div className="rounded-2xl border border-border dark:border-white/8
              bg-white dark:bg-gray-900/50 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-navy/10 dark:bg-navy/20
                  flex items-center justify-center text-xs font-bold text-navy dark:text-info-soft">
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
                      <p className="text-[10px] font-mono text-text-subtle mb-1.5">Dimensiones relevantes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {useCase.t1Context.relevantDimensions.map((d) => (
                          <span key={d} className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                            bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft">{d}</span>
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
                <p className="text-xs text-text-subtle italic">Sin contexto T1 registrado.</p>
              )}
            </div>

            {/* T2 */}
            <div className="rounded-2xl border border-border dark:border-white/8
              bg-white dark:bg-gray-900/50 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-info-light flex items-center
                  justify-center text-xs font-bold text-info-dark">T2</div>
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">
                  Contexto de stakeholders (T2)
                </p>
              </div>
              {useCase.t2Context ? (
                <div className="flex flex-col gap-3">
                  {useCase.t2Context.championArchetype && (
                    <div>
                      <p className="text-[10px] font-mono text-text-subtle mb-0.5">Champion</p>
                      <p className="text-xs font-medium text-success-dark">✓ {useCase.t2Context.championArchetype}</p>
                    </div>
                  )}
                  {useCase.t2Context.blockerArchetypes?.length ? (
                    <div>
                      <p className="text-[10px] font-mono text-text-subtle mb-0.5">Posibles bloqueos</p>
                      {useCase.t2Context.blockerArchetypes.map((b) => (
                        <p key={b} className="text-xs font-medium text-danger-dark">▲ {b}</p>
                      ))}
                    </div>
                  ) : null}
                  {useCase.t2Context.stakeholderNotes && (
                    <p className="text-xs text-text-muted leading-relaxed">
                      {useCase.t2Context.stakeholderNotes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-text-subtle italic">Sin contexto T2 registrado.</p>
              )}
            </div>

            {/* Categoría IA */}
            <div className="rounded-2xl border border-border dark:border-white/8
              bg-white dark:bg-gray-900/50 px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: catHex }} />
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">Categoría IA</p>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: catHex }}>
                {AI_CATEGORY_LABELS[useCase.aiCategory] ?? useCase.aiCategory}
              </p>
              {useCase.importedFromT3 && (
                <div className="mt-2">
                  <p className="text-[10px] font-mono text-text-subtle mb-0.5">Proceso origen (T3)</p>
                  <p className="text-xs text-text-muted">{useCase.importedFromT3.processName}</p>
                  <p className="text-[10px] text-text-subtle mt-0.5">
                    Opp. score T3: <span className="font-bold">{useCase.importedFromT3.opportunityScore.toFixed(2)}/4.0</span>
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
  const navigate                      = useNavigate()
  const { useCases }                  = useT4Store()
  const [activeId, setActiveId]     = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  const activeUseCase = useMemo(
    () => useCases.find((uc) => uc.id === activeId) ?? null,
    [useCases, activeId]
  )

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

        {/* ── ZONA 1: HERO — Executive Dashboard ──────────── */}
        <div className="py-8 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
              {companyName} · Portfolio de IA
            </p>
            <h2 className="text-lg font-semibold text-lean-black dark:text-gray-100">
              Dashboard ejecutivo
            </h2>
          </div>

          {/* 4 KPI boxes */}
          <ExecDashboard useCases={useCases} />

          {/* Roadmap trimestral — interactivo */}
          <QuarterlyRoadmap
            useCases={useCases}
            activeId={activeId}
            onSelect={handleSelectUseCase}
          />
        </div>

        {/* Sin casos — estado vacío */}
        {useCases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800
              flex items-center justify-center text-2xl">◎</div>
            <p className="text-sm font-bold text-text-muted">Sin casos de uso</p>
            <p className="text-xs text-text-subtle max-w-xs leading-relaxed">
              Importa procesos desde T3 o añade un caso de uso manualmente.
            </p>
          </div>
        )}
      </div>

      {/* ── ZONA 3: DETALLE ─────────────────────────────────── */}
      {activeUseCase && (
        <div className="max-w-7xl mx-auto w-full px-8 pb-16">
          <UseCaseDetailPanel
            useCase={activeUseCase}
            allUseCases={useCases}
            onSelect={handleSelectUseCase}
          />
        </div>
      )}

      {/* Modal importación T3 */}
      {showImport && (
        <ImportFromT3Modal onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}
