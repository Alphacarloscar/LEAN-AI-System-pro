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
import { PhaseMiniMap }     from '@/shared/components/PhaseMiniMap'
import type {
  UseCase, UseCaseStatus, UseCaseScores, UseCaseEconomics,
  AIActScope, AIActClassification,
} from './types'
import { computeAIActRisk } from './types'

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
          <g key={uc.id} style={{ cursor: 'pointer' }}
            onClick={() => onSelect(uc.id)}
            onMouseEnter={() => setHovered({
              leftPct:     (x / S) * 100,
              topPct:      (y / S) * 100,
              name:        uc.name,
              hex,
              statusLabel: STATUS_CONFIG[uc.status].label,
              feasibility: uc.scores.feasibility,
              kpiImpact:   uc.scores.kpiImpact,
            })}
            onMouseLeave={() => setHovered(null)}
          >
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

    {/* Tooltip */}
    {hovered && (
      <div
        className="pointer-events-none absolute z-50 bg-white dark:bg-gray-900 border border-border dark:border-white/10 rounded-lg shadow-lg px-3 py-2 text-[11px] min-w-[148px]"
        style={{
          left:      `${hovered.leftPct}%`,
          top:       `${hovered.topPct}%`,
          transform: `translate(${hovered.leftPct > 65 ? 'calc(-100% - 10px)' : '10px'}, -50%)`,
        }}
      >
        <p className="font-semibold text-lean-black dark:text-gray-100 mb-1 leading-tight truncate max-w-[160px]">
          {hovered.name}
        </p>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: hovered.hex }} />
          <span className="text-text-muted">{hovered.statusLabel}</span>
        </div>
        <div className="space-y-0.5 text-text-muted">
          <div className="flex justify-between gap-4">
            <span>Facilidad</span>
            <span className="font-medium text-lean-black dark:text-gray-200">{hovered.feasibility}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Impacto KPI</span>
            <span className="font-medium text-lean-black dark:text-gray-200">{hovered.kpiImpact}</span>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}

// ── Score bars (visualización 0-100) ─────────────────────────

const T4_SCORE_BARS = [
  { key: 'kpiImpact',      cfg: DIMENSION_CONFIG.kpiImpact },
  { key: 'feasibility',    cfg: DIMENSION_CONFIG.feasibility },
  { key: 'aiRisk',         cfg: DIMENSION_CONFIG.aiRisk },
  { key: 'dataDependency', cfg: DIMENSION_CONFIG.dataDependency },
] as const

// CSS puro — el texto nunca puede solaparse con la barra (flex con ancho fijo)
function T4ScoreBars({ scores }: { scores: UseCaseScores }) {
  return (
    <div className="flex flex-col gap-4">
      {T4_SCORE_BARS.map(({ key, cfg }) => {
        const val    = scores[key as keyof UseCaseScores]
        const lblIdx = Math.min(4, Math.floor(val / 20))
        const isNeg  = cfg.direction === 'negative'

        return (
          <div key={key} className="flex items-center gap-4">

            {/* Label — ancho fijo, nunca toca la barra */}
            <div className="w-44 shrink-0">
              <p className="text-[11px] font-semibold text-lean-black dark:text-gray-200 leading-tight">
                {cfg.label}
              </p>
              <p className="text-[10px] text-text-subtle mt-0.5">
                {cfg.scaleLabels[lblIdx]}{isNeg ? ' ↑ riesgo' : ''}
              </p>
            </div>

            {/* Barra — ocupa el espacio restante */}
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${val}%`, backgroundColor: cfg.hex, opacity: 0.85 }}
              />
            </div>

            {/* Valor */}
            <div className="shrink-0 w-14 text-right">
              <span className="text-xs font-bold tabular-nums text-lean-black dark:text-gray-200">
                {val}
              </span>
              <span className="text-[10px] text-text-subtle">/100</span>
            </div>

          </div>
        )
      })}
    </div>
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
              bg-navy-metallic text-white hover:bg-navy-metallic-hover transition-colors shadow-sm"
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
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-navy-metallic text-white
                hover:bg-navy-metallic-hover transition-colors shadow-sm"
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

// ── AI Act — configuración visual ────────────────────────────

const AIACT_RISK_CONFIG = {
  prohibido:      { label: 'Prohibido',      badgeBg: 'bg-red-100 dark:bg-red-900/30',      badgeText: 'text-red-700 dark:text-red-300',      hex: '#DC2626', icon: '🚫' },
  alto:           { label: 'Alto riesgo',    badgeBg: 'bg-danger-light dark:bg-red-900/20', badgeText: 'text-danger-dark',                    hex: '#EA580C', icon: '🔴' },
  limitado:       { label: 'Riesgo limitado',badgeBg: 'bg-warning-light',                  badgeText: 'text-warning-dark',                   hex: '#D97706', icon: '🟡' },
  minimo:         { label: 'Riesgo mínimo',  badgeBg: 'bg-success-light',                  badgeText: 'text-success-dark',                   hex: '#16A34A', icon: '🟢' },
  sin_clasificar: { label: 'Sin clasificar', badgeBg: 'bg-gray-100 dark:bg-gray-800',       badgeText: 'text-gray-500 dark:text-gray-400',    hex: '#94A3B8', icon: '⬜' },
} as const

const AIACT_SCOPE_LABELS: Record<AIActScope, string> = {
  rrhh:                 'RRHH — Selección, evaluación o formación de personas',
  financiero_clientes:  'Financiero — Crédito, scoring o seguros a clientes',
  salud:                'Salud o servicios sanitarios',
  infraestructura:      'Infraestructura crítica (energía, transporte, agua)',
  seguridad:            'Seguridad — Identificación o control de acceso',
  educacion:            'Educación — Evaluación o acceso a formación',
  administracion:       'Administración pública o justicia',
  operaciones_internas: 'Operaciones internas (back-office, procesos)',
  cliente_marketing:    'Atención al cliente, marketing o ventas',
}

// ── Modal de clasificación AI Act ─────────────────────────────

function AIActClassificationModal({
  useCaseName,
  onSave,
  onCancel,
}: {
  useCaseName: string
  onSave:      (classification: AIActClassification) => void
  onCancel:    () => void
}) {
  const [scope,          setScope]          = useState<AIActScope | ''>('')
  const [personImpact,   setPersonImpact]   = useState<'no' | 'human_review' | 'autonomous' | ''>('')
  const [sensitiveData,  setSensitiveData]  = useState<boolean | null>(null)
  const [explainability, setExplainability] = useState<'yes' | 'no' | ''>('')

  const allAnswered = scope && personImpact !== '' && sensitiveData !== null && explainability

  const previewRisk = allAnswered
    ? computeAIActRisk(scope as AIActScope, personImpact as 'no'|'human_review'|'autonomous', sensitiveData!, explainability as 'yes'|'no')
    : null

  const riskCfg = previewRisk ? AIACT_RISK_CONFIG[previewRisk] : null

  function handleSave() {
    if (!allAnswered) return
    onSave({
      scope:          scope as AIActScope,
      personImpact:   personImpact as 'no' | 'human_review' | 'autonomous',
      sensitiveData:  sensitiveData!,
      explainability: explainability as 'yes' | 'no',
      riskLevel:      previewRisk!,
      classifiedAt:   new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy text-white">AI Act</span>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">Clasificación regulatoria</p>
            </div>
            <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100 leading-tight">{useCaseName}</h3>
            <p className="text-[10px] text-text-subtle mt-1">Responde 4 preguntas para clasificar el riesgo regulatorio de este caso de uso.</p>
          </div>
          <button onClick={onCancel} className="text-text-subtle hover:text-lean-black dark:hover:text-gray-200 text-lg w-7 h-7 flex items-center justify-center shrink-0">✕</button>
        </div>

        {/* Questions */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* P1 — Ámbito */}
          <div>
            <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">
              P1 · ¿En qué ámbito opera este sistema?
            </p>
            <p className="text-[10px] text-text-subtle mb-2">El sector determina si aplica el Anexo III del AI Act (alto riesgo automático).</p>
            <div className="flex flex-col gap-1.5">
              {(Object.entries(AIACT_SCOPE_LABELS) as [AIActScope, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setScope(key)}
                  className={[
                    'text-left px-3 py-2 rounded-xl border text-xs transition-all duration-100',
                    scope === key
                      ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft font-medium'
                      : 'border-border text-text-muted hover:border-navy/30 hover:text-lean-black dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* P2 — Impacto en personas */}
          <div>
            <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">
              P2 · ¿El sistema toma decisiones que afectan a personas físicas?
            </p>
            <p className="text-[10px] text-text-subtle mb-2">No incluye decisiones sobre procesos o datos agregados de la empresa.</p>
            <div className="flex flex-col gap-1.5">
              {([
                { v: 'no',           l: 'No — opera sobre procesos o datos internos de la empresa' },
                { v: 'human_review', l: 'Sí — pero un humano revisa y aprueba cada decisión antes de aplicarla' },
                { v: 'autonomous',   l: 'Sí — de forma autónoma o con supervisión mínima' },
              ] as { v: 'no'|'human_review'|'autonomous'; l: string }[]).map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setPersonImpact(v)}
                  className={[
                    'text-left px-3 py-2 rounded-xl border text-xs transition-all duration-100',
                    personImpact === v
                      ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft font-medium'
                      : 'border-border text-text-muted hover:border-navy/30 hover:text-lean-black dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* P3 — Datos sensibles */}
          <div>
            <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">
              P3 · ¿Utiliza o procesa datos de salud, biométricos, religión, origen étnico o datos sexuales?
            </p>
            <p className="text-[10px] text-text-subtle mb-2">Categorías especiales RGPD Art. 9 y datos biométricos identificativos.</p>
            <div className="flex gap-2">
              {([{ v: false, l: 'No' }, { v: true, l: 'Sí' }] as { v: boolean; l: string }[]).map(({ v, l }) => (
                <button
                  key={String(v)}
                  onClick={() => setSensitiveData(v)}
                  className={[
                    'flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-100',
                    sensitiveData === v
                      ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft'
                      : 'border-border text-text-muted hover:border-navy/30',
                  ].join(' ')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* P4 — Explicabilidad */}
          <div>
            <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">
              P4 · ¿El output del sistema es explicable o trazable para el usuario afectado?
            </p>
            <p className="text-[10px] text-text-subtle mb-2">El sistema puede justificar por qué tomó una decisión o recomendación concreta.</p>
            <div className="flex gap-2">
              {([
                { v: 'yes', l: 'Sí — hay trazabilidad o explicación disponible' },
                { v: 'no',  l: 'No — el output es opaco o no se comunica' },
              ] as { v: 'yes'|'no'; l: string }[]).map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setExplainability(v)}
                  className={[
                    'flex-1 text-left px-3 py-2 rounded-xl border text-xs transition-all duration-100',
                    explainability === v
                      ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft font-medium'
                      : 'border-border text-text-muted hover:border-navy/30 hover:text-lean-black dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Preview resultado */}
          {riskCfg && (
            <div className={`rounded-xl border px-4 py-3 ${riskCfg.badgeBg}`}>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: riskCfg.hex }}>
                Clasificación resultante
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{riskCfg.icon}</span>
                <span className="text-sm font-bold" style={{ color: riskCfg.hex }}>{riskCfg.label}</span>
              </div>
              {previewRisk === 'prohibido' && (
                <p className="text-[10px] mt-1.5 text-red-600 dark:text-red-400 leading-relaxed">
                  ⚠️ Este sistema puede caer en la categoría de uso prohibido por el AI Act (Art. 5). Revisa con el equipo legal antes de proceder.
                </p>
              )}
              {previewRisk === 'alto' && (
                <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: riskCfg.hex }}>
                  Requiere conformidad con el Anexo III del AI Act antes de despliegue. Documenta controles y supervisión humana.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!allAnswered}
            className="px-4 py-2 rounded-xl bg-navy-metallic text-white text-sm font-medium
              hover:bg-navy-metallic-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Guardar clasificación
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Panel de detalle del caso de uso ─────────────────────────

type DetailTab = 'scoring' | 'economia' | 'roadmap' | 'contexto' | 'regulatorio'

function UseCaseDetailPanel({
  useCase,
  allUseCases,
  onSelect,
}: {
  useCase:     UseCase
  allUseCases: UseCase[]
  onSelect:    (id: string) => void
}) {
  const { updateUseCase, recalcScore, updateAIActClassification } = useT4Store()
  const [tab, setTab]                 = useState<DetailTab>('scoring')
  const [editingScore, setEditingScore] = useState(false)
  const [localScores, setLocalScores]  = useState<UseCaseScores>(useCase.scores)
  // AI Act gate: status pendiente de cambio hasta que el usuario clasifica
  const [pendingStatus,    setPendingStatus]    = useState<UseCaseStatus | null>(null)
  const [showAIActModal,   setShowAIActModal]   = useState(false)

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

  /** Gate: si el nuevo status requiere clasificación AI Act y no existe, muestra el modal */
  function handleStatusChange(newStatus: UseCaseStatus) {
    const requiresClassification = newStatus === 'go' || newStatus === 'priorizado'
    if (requiresClassification && !useCase.aiActClassification) {
      setPendingStatus(newStatus)
      setShowAIActModal(true)
    } else {
      updateUseCase(useCase.id, { status: newStatus })
    }
  }

  function handleAIActSave(classification: AIActClassification) {
    updateAIActClassification(useCase.id, classification)
    if (pendingStatus) updateUseCase(useCase.id, { status: pendingStatus })
    setPendingStatus(null)
    setShowAIActModal(false)
    setTab('regulatorio')
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
          <div className="flex flex-wrap gap-1.5 items-center">
            <StatusBadge status={useCase.status} />
            <CategoryBadge category={useCase.aiCategory} />
            {useCase.roadmap?.quarter && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                bg-navy/8 dark:bg-navy/20 text-navy dark:text-info-soft">
                {useCase.roadmap.quarter}
              </span>
            )}
            {/* AI Act risk badge */}
            {(() => {
              const risk = useCase.aiActClassification?.riskLevel ?? 'sin_clasificar'
              const cfg  = AIACT_RISK_CONFIG[risk]
              return (
                <button
                  onClick={() => setTab('regulatorio')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1
                    ${cfg.badgeBg} ${cfg.badgeText} hover:opacity-80 transition-opacity`}
                  title="Ver clasificación AI Act"
                >
                  {cfg.icon} {cfg.label}
                </button>
              )
            })()}
          </div>
          {/* Cambiar estado */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[9px] font-mono uppercase text-text-subtle">Estado:</span>
            {STATUS_ORDER.map((st) => {
              const cfg = STATUS_CONFIG[st]
              return (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  disabled={useCase.status === st}
                  className={[
                    'px-2 py-0.5 rounded-full text-[9px] font-semibold transition-all duration-100',
                    useCase.status === st
                      ? `${cfg.badgeBg} ${cfg.badgeText} cursor-default`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700',
                  ].join(' ')}
                >
                  {cfg.label}
                </button>
              )
            })}
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
          { key: 'scoring',     label: 'Scoring' },
          { key: 'economia',    label: 'Economía' },
          { key: 'roadmap',     label: 'Hoja de ruta' },
          { key: 'contexto',    label: 'Contexto T1/T2' },
          { key: 'regulatorio', label: `⚖️ AI Act${useCase.aiActClassification ? ` · ${AIACT_RISK_CONFIG[useCase.aiActClassification.riskLevel].label}` : ''}` },
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
                      bg-navy-metallic text-white hover:bg-navy-metallic-hover transition-colors shadow-sm"
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
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-navy-metallic text-white
                        hover:bg-navy-metallic-hover transition-colors shadow-sm"
                    >
                      Guardar
                    </button>
                  </div>
                )}
              </div>

              {!editingScore ? (
                <>
                  <T4ScoreBars scores={useCase.scores} />
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

        {/* ── TAB: REGULATORIO (AI Act) ────────────────────── */}
        {tab === 'regulatorio' && (() => {
          const cls = useCase.aiActClassification
          if (!cls) {
            return (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <span className="text-4xl">⚖️</span>
                <div>
                  <p className="text-sm font-semibold text-lean-black dark:text-gray-100 mb-1">
                    Sin clasificación AI Act
                  </p>
                  <p className="text-xs text-text-muted max-w-sm leading-relaxed">
                    Clasifica este caso de uso para evaluar su nivel de riesgo regulatorio según el EU AI Act y el RGPD.
                  </p>
                </div>
                <button
                  onClick={() => setShowAIActModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-navy-metallic text-white text-sm font-semibold hover:bg-navy-metallic-hover transition-colors shadow-sm"
                >
                  Clasificar ahora
                </button>
              </div>
            )
          }

          const riskCfg  = AIACT_RISK_CONFIG[cls.riskLevel]
          const scopeLabel = AIACT_SCOPE_LABELS[cls.scope]

          return (
            <div className="flex flex-col gap-5 max-w-2xl">

              {/* Resultado principal */}
              <div className={`rounded-2xl border px-5 py-4 ${riskCfg.badgeBg}`}>
                <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: riskCfg.hex }}>
                  Nivel de riesgo EU AI Act
                </p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{riskCfg.icon}</span>
                    <div>
                      <p className="text-lg font-bold" style={{ color: riskCfg.hex }}>{riskCfg.label}</p>
                      <p className="text-[10px] text-text-subtle mt-0.5">
                        Clasificado el {new Date(cls.classifiedAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAIActModal(true)}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-navy-metallic text-white
                      text-xs font-medium hover:bg-navy-metallic-hover transition-colors shadow-sm"
                  >
                    Reclasificar
                  </button>
                </div>
              </div>

              {/* Respuestas */}
              <div className="rounded-2xl border border-border bg-gray-50 dark:bg-gray-800/50 px-5 py-4 flex flex-col gap-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">Respuestas del cuestionario</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-0.5">P1 · Ámbito</p>
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200 leading-tight">{scopeLabel}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-0.5">P2 · Impacto en personas</p>
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200">
                      {cls.personImpact === 'no'           ? 'No afecta a personas físicas'
                      : cls.personImpact === 'human_review' ? 'Sí, con revisión humana'
                      :                                       'Sí, de forma autónoma'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-0.5">P3 · Datos sensibles</p>
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200">
                      {cls.sensitiveData ? '⚠️ Sí — datos RGPD Art. 9' : '✓ No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-0.5">P4 · Explicabilidad</p>
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200">
                      {cls.explainability === 'yes' ? '✓ Sistema explicable / trazable' : '✕ Output opaco'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Obligaciones según nivel */}
              <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 px-5 py-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">Obligaciones regulatorias aplicables</p>
                {cls.riskLevel === 'prohibido' && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">🚫 Sistema potencialmente prohibido — Art. 5 AI Act</p>
                    <p className="text-[10px] text-red-600 dark:text-red-400 leading-relaxed">Detener el desarrollo e iniciar revisión legal inmediata. Este sistema puede infringir el artículo 5 del AI Act si se despliega.</p>
                  </div>
                )}
                {cls.riskLevel === 'alto' && (
                  <ul className="flex flex-col gap-2">
                    {['Evaluación de conformidad antes del despliegue (Annex III)', 'Sistema de gestión de riesgos documentado', 'Datos de entrenamiento y gobernanza documentados', 'Registro en la base de datos EU de sistemas de alto riesgo', 'Supervisión humana obligatoria definida y operativa', 'Transparencia hacia usuarios afectados'].map((o, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-warning-dark shrink-0 mt-0.5">▶</span>
                        <span className="text-xs text-text-muted leading-tight">{o}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {cls.riskLevel === 'limitado' && (
                  <ul className="flex flex-col gap-2">
                    {['Obligación de transparencia hacia los usuarios (Art. 50)', 'Indicar que el contenido es generado por IA si aplica', 'Política de uso aceptable documentada'].map((o, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-warning-dark shrink-0 mt-0.5">▶</span>
                        <span className="text-xs text-text-muted leading-tight">{o}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {cls.riskLevel === 'minimo' && (
                  <p className="text-xs text-success-dark leading-relaxed">
                    ✓ Sin obligaciones regulatorias específicas del AI Act. Se recomienda documentar el uso en el catálogo corporativo de IA como buena práctica de gobernanza.
                  </p>
                )}
              </div>
            </div>
          )
        })()}

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

      {/* Modal AI Act — gate al cambiar status */}
      {showAIActModal && (
        <AIActClassificationModal
          useCaseName={useCase.name}
          onSave={handleAIActSave}
          onCancel={() => { setShowAIActModal(false); setPendingStatus(null) }}
        />
      )}
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
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[10px] font-mono font-semibold text-navy dark:text-info-soft uppercase tracking-wider">T4</span>
              <h1 className="text-sm font-semibold text-lean-black dark:text-gray-100">Use Case Priority Board</h1>
              <PhaseMiniMap phaseId="evaluate" toolCode="T4" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">{companyName}</p>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl
              text-xs font-semibold bg-navy-metallic text-white hover:bg-navy-metallic-hover
              transition-colors shadow-sm"
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
