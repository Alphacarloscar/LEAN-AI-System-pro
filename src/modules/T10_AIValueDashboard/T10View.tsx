// ============================================================
// T10 — AI Value Dashboard · "Wow Moment" Screen
//
// Home screen del L.E.A.N. AI System.
// Modo demo siempre activo. 6 paneles con hero metric.
// Paleta Obsidian Amber · click-to-expand por panel.
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import type { RadarDimension }          from '@/shared/components/charts/LeanRadarChart'
import { T10_DEMO }                     from './demo-data'
import { useT4Store }                    from '@/modules/T4_UseCasePriorityBoard/store'
import { useT2Store }                    from '@/modules/T2_StakeholderMatrix/store'
import { useCompanyProfileStore }        from '@/modules/CompanyProfile/store'
import { useEngagementStore }            from '@/modules/Engagement/store'
import { RecommendationPanel }           from '@/components/RecommendationPanel'
import { buildT10RecommendationContext } from './t10ContextBuilder'
import { isDemoEnabled }                 from '@/lib/config'

// ── Tipos ────────────────────────────────────────────────────

type PanelId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6'

export interface T10ViewProps {
  companyName:      string
  sector:           string
  employees:        number
  t1Radar:          RadarDimension[]
  onNavigate:       (path: string) => void
  demoPattern?:     string
  demoScenarios?:   Array<{ id: string; label: string }>
  onPatternChange?: (p: string) => void
}

// ── Helpers ──────────────────────────────────────────────────

function calcAvg(radar: RadarDimension[]): number {
  if (!radar.length) return 2.1
  return Math.round((radar.reduce((s, d) => s + d.current, 0) / radar.length) * 10) / 10
}

function maturityLabel(avg: number): string {
  if (avg < 1)   return 'Iniciación'
  if (avg < 2)   return 'Exploración'
  if (avg < 3)   return 'Desarrollo'
  if (avg < 3.5) return 'Avanzado'
  return 'Líder'
}

function weakestDimension(radar: RadarDimension[]): string {
  if (!radar.length) return '—'
  return radar.reduce((a, b) => a.current < b.current ? a : b).dimension
}

// ── Sub-componentes ──────────────────────────────────────────

// DimBar — barra horizontal de dimensión
function DimBar({ label, value, max, color, showValue = false }: {
  label: string; value: number; max: number; color: string; showValue?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted dark:text-warm-300 w-[76px] flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-[5px] rounded-full bg-border dark:bg-warm-500">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: color }} />
      </div>
      {showValue && (
        <span className="text-[10px] text-text-muted dark:text-warm-300 w-6 text-right tabular-nums">{value.toFixed(1)}</span>
      )}
    </div>
  )
}

// StatusBar — barra apilada horizontal
function StatusBar({ segments }: { segments: Array<{ pct: number; color: string; label: string }> }) {
  return (
    <div>
      <div className="flex h-[7px] rounded-full overflow-hidden mb-2 gap-px">
        {segments.map((s, i) => (
          <div key={i} style={{ width: `${s.pct}%`, background: s.color, flexShrink: 0 }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[10px] text-text-muted dark:text-warm-300">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// DonutChart — SVG donut con segmentos
function DonutChart({ segments, size = 64, strokeWidth = 13, centerLabel }: {
  segments: Array<{ pct: number; color: string }>
  size?: number; strokeWidth?: number; centerLabel?: string
}) {
  const r    = (size - strokeWidth) / 2
  const cx   = size / 2
  const cy   = size / 2
  const circ = 2 * Math.PI * r
  let cum    = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#D4D0C8" strokeWidth={strokeWidth} className="dark:stroke-warm-500" />
      {segments.map((seg, i) => {
        const dashLen = (seg.pct / 100) * circ
        const offset  = -cum
        cum += dashLen
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dashLen} ${circ}`} strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        )
      })}
      {centerLabel && (
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="500" fill="currentColor"
          className="fill-lean-black dark:fill-warm-50">
          {centerLabel}
        </text>
      )}
    </svg>
  )
}

// MetricChip — tarjeta pequeña de métrica
function MetricChip({ label, value, valueColor }: {
  label: string; value: string; valueColor?: string
}) {
  return (
    <div className="bg-surface dark:bg-warm-700 rounded-lg p-2 text-center flex-1 min-w-0">
      <p className="text-[9px] font-mono uppercase tracking-wide text-text-muted dark:text-warm-300 mb-0.5 leading-tight">{label}</p>
      <p className="text-sm font-semibold tabular-nums leading-snug"
        style={{ color: valueColor ?? 'var(--color-text-primary)' }}>
        {value}
      </p>
    </div>
  )
}

// DeptBar — barra de departamento para adopción
function DeptBar({ label, innovadores, early, rezagados, total }: {
  label: string; innovadores: number; early: number; rezagados: number; total: number
}) {
  const pI = (innovadores / total) * 100
  const pE = (early       / total) * 100
  const pR = (rezagados   / total) * 100
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[9px] text-text-muted dark:text-warm-300 w-20 flex-shrink-0 truncate">{label}</span>
      <div className="flex flex-1 h-[6px] rounded-full overflow-hidden gap-px">
        <div style={{ width: `${pI}%`, background: '#86C7A8' }} />
        <div style={{ width: `${pE}%`, background: '#9BB5D9' }} />
        <div style={{ width: `${pR}%`, background: '#C4C0B8' }} />
      </div>
      <span className="text-[9px] text-text-muted dark:text-warm-300 w-4 text-right">{total}</span>
    </div>
  )
}

// NavButton — enlace de navegación a herramienta
function NavButton({ label, onClick, secondary = false }: {
  label: string; onClick: () => void; secondary?: boolean
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={[
        'flex items-center gap-1 text-[11px] font-medium transition-colors',
        secondary ? 'text-text-muted dark:text-warm-300 hover:text-gold' : 'text-gold hover:text-gold-hover',
      ].join(' ')}
    >
      {label}
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" />
      </svg>
    </button>
  )
}

// ExpandedSection
function ExpandedSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 pt-3 border-t border-border dark:border-warm-500 animate-fade-in">
      {children}
    </div>
  )
}

const EVENT_LEVEL_COLOR: Record<string, string> = {
  direction: '#C8860A',
  program:   '#9BB5D9',
  team:      '#86C7A8',
}

// ── HeroMetric — componente único para todas las tarjetas ─────
//
// label:      texto en mayúsculas (MADUREZ IA, INVERSIÓN TOTAL…)
// value:      dato limpio (1.6, €259K, 38%…)
// colorScore: 0-100 → semáforo rojo/naranja/verde
//             undefined → gold neutro (para valores absolutos)

function heroColor(score?: number): string {
  if (score == null) return '#C8860A'          // gold neutro
  if (score < 30)   return '#C05035'           // rojo
  if (score < 60)   return '#C8860A'           // naranja/amber
  return '#2A7A52'                             // verde
}

function HeroMetric({ label, value, colorScore }: {
  label:       string
  value:       string
  colorScore?: number   // 0-100, o undefined para neutro
}) {
  const color = heroColor(colorScore)
  return (
    <div className="flex-shrink-0 text-right">
      <p className="text-[9px] font-mono uppercase tracking-wider text-text-muted dark:text-warm-300 leading-tight mb-0.5">
        {label}
      </p>
      <p className="text-[1.6rem] font-semibold tabular-nums leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

// ── PanelCard ─────────────────────────────────────────────────

type TagColor = 'warning' | 'success' | 'info' | 'danger' | 'purple' | 'amber'

const TAG_CLASSES: Record<TagColor, string> = {
  warning: 'bg-warning-light text-warning-dark',
  success: 'bg-success-light text-success-dark',
  info:    'bg-info-light text-info-dark',
  danger:  'bg-danger-light text-danger-dark',
  purple:  'bg-[#EEEDFE] text-[#3C3489]',
  amber:   'bg-warning-light text-warning-dark',
}

function PanelCard({
  featured = false, expanded, onClick,
  tag, tagColor, title, subtitle,
  animDelay, heroSlot, children,
}: {
  id?:        string
  featured?:  boolean
  expanded:   boolean
  onClick:    () => void
  tag:        string
  tagColor:   TagColor
  title:      string
  subtitle:   string
  animDelay:  number
  heroSlot?:  React.ReactNode
  children:   React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      className={[
        'relative overflow-hidden rounded-xl p-4 cursor-pointer',
        'transition-all duration-200 animate-fade-in',
        'bg-white dark:bg-warm-600',
        expanded
          ? 'shadow-lg ring-1 ring-gold/40 dark:ring-gold/30'
          : 'shadow-border dark:shadow-border-dark hover:shadow-md',
      ].join(' ')}
      style={{
        animationDelay:    `${animDelay}ms`,
        animationFillMode: 'both',
        borderTop: featured ? '2px solid #C8860A' : undefined,
      }}
    >
      {featured && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ background: 'linear-gradient(135deg, #C8860A 0%, transparent 60%)' }} />
      )}

      {/* Header row: tag + hero */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mb-1.5 ${TAG_CLASSES[tagColor]}`}>
            {tag}
          </span>
          <p className="text-sm font-medium text-lean-black dark:text-warm-50 leading-snug">{title}</p>
          <p className="text-[11px] text-text-muted dark:text-warm-300 mt-0.5">{subtitle}</p>
        </div>
        {heroSlot}
      </div>

      {children}
    </div>
  )
}

// ── T10View ──────────────────────────────────────────────────

export function T10View({
  companyName, sector, employees, t1Radar, onNavigate,
  demoPattern, demoScenarios, onPatternChange,
}: T10ViewProps) {

  const [expanded,  setExpanded]  = useState<PanelId | null>(null)
  const [aiDisplay, setAiDisplay] = useState(0)

  const useCases                    = useT4Store(s => s.useCases)
  const stakeholders                = useT2Store(s => s.stakeholders)
  const { profile: companyProfile } = useCompanyProfileStore()
  const engagementId                = useEngagementStore((s) => s.activeEngagementId)

  const avg     = calcAvg(t1Radar)
  const weakest = weakestDimension(t1Radar)
  const tier    = maturityLabel(avg)

  const t10LLMContext = useMemo(
    () => companyProfile
      ? buildT10RecommendationContext(t1Radar, useCases, stakeholders, null, companyProfile)
      : null,
    [t1Radar, useCases, stakeholders, companyProfile],
  )

  // AI Index counter animation
  useEffect(() => {
    const target = avg; const duration = 1300; const start = Date.now()
    let frame: number
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      setAiDisplay(Math.round((1 - Math.pow(1 - p, 3)) * target * 10) / 10)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [avg])

  function toggle(id: PanelId) { setExpanded(prev => prev === id ? null : id) }

  // ── Guard producción: sin demo y sin proyecto ─────────────────
  if (!isDemoEnabled && !engagementId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </div>
          <h2 className="text-base font-semibold text-[#2A2822] mb-2">Selecciona un proyecto</h2>
          <p className="text-sm text-gray-500">
            Elige un proyecto desde el selector superior para ver el dashboard de adopción IA de tu empresa.
          </p>
        </div>
      </div>
    )
  }

  const d   = T10_DEMO
  const t4n = d.t4.totalInitiatives
  const t4s = d.t4.statuses
  const t4Segments = [
    { pct: Math.round((t4s.active     / t4n) * 100), color: '#86C7A8', label: `Activas ${t4s.active}` },
    { pct: Math.round((t4s.validating / t4n) * 100), color: '#E8C281', label: `Validando ${t4s.validating}` },
    { pct: Math.round((t4s.backlog    / t4n) * 100), color: '#9BB5D9', label: `Backlog ${t4s.backlog}` },
    { pct: Math.round((t4s.stopped   / t4n) * 100), color: '#C4C0B8', label: `Paradas ${t4s.stopped}` },
  ]

  const rTotal = d.t6t12.risks.total
  const riskSegments = [
    { pct: Math.round((d.t6t12.risks.high   / rTotal) * 100), color: '#D85A30' },
    { pct: Math.round((d.t6t12.risks.medium / rTotal) * 100), color: '#EF9F27' },
    { pct: Math.round((d.t6t12.risks.low    / rTotal) * 100), color: '#97C459' },
  ]

  const aiTypeSegments = d.t3t5.aiTypes.map(t => ({ pct: t.pct, color: t.color }))

  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Dashboard header ─────────────────────────────── */}
      <div className="bg-lean-black dark:bg-warm-950">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-warm-300 mb-0.5">
              {sector} · {employees.toLocaleString('es-ES')} empleados
            </p>
            <h1 className="text-base font-semibold text-warm-50 leading-tight">{companyName}</h1>
          </div>
          <div className="text-center flex-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-warm-400 mb-1">Índice IA global</p>
            <div className="flex items-baseline gap-1.5 justify-center">
              <span className="text-[2.5rem] font-semibold leading-none text-gold tabular-nums tracking-tight">
                {aiDisplay.toFixed(1)}
              </span>
              <span className="text-lg text-warm-400 leading-none">/ 4.0</span>
            </div>
            <p className="text-[10px] text-warm-300 mt-0.5">{tier}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />Sprint 3 / 6
            </span>
            <p className="text-[10px] text-warm-400 mt-1">Mayo 2026</p>
          </div>
        </div>

        {/* Demo scenario selector — solo visible en entorno demo */}
        {isDemoEnabled && demoScenarios && onPatternChange && (
          <div className="border-t border-warm-700 dark:border-warm-800">
            <div className="max-w-6xl mx-auto px-8 py-2 flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-warm-400 flex-shrink-0">Escenario demo</span>
              <div className="flex gap-1.5 flex-wrap">
                {demoScenarios.map(s => (
                  <button key={s.id} onClick={() => onPatternChange(s.id)}
                    className={[
                      'px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all',
                      s.id === demoPattern ? 'bg-gold text-lean-black' : 'bg-warm-700 text-warm-200 hover:bg-warm-600',
                    ].join(' ')}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Panel grid ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-8 py-7">
        <div className="grid grid-cols-3 gap-5">

          {/* ── P1: T1 Madurez IA ──────────────────────────── */}
          <PanelCard
            id="p1" expanded={expanded === 'p1'} onClick={() => toggle('p1')}
            tag="T1 · Readiness" tagColor="warning"
            title="Madurez IA" subtitle={`${t1Radar.length} dimensiones · Score ${avg}/4`}
            animDelay={0}
            heroSlot={<HeroMetric label="Madurez IA" value={avg.toFixed(1)} colorScore={(avg / 4) * 100} />}
          >
            <div className="space-y-[5px]">
              {t1Radar.slice(0, 4).map(dim => (
                <DimBar key={dim.dimension} label={dim.dimension} value={dim.current} max={4} color="#C8860A" />
              ))}
              {t1Radar.length > 4 && (
                <p className="text-[10px] text-text-subtle dark:text-warm-400 pt-0.5">+{t1Radar.length - 4} más</p>
              )}
            </div>

            {expanded === 'p1' && (
              <ExpandedSection>
                {/* IT vs Negocio */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted dark:text-warm-300">IT (avg)</p>
                    <p className="text-xl font-semibold text-gold tabular-nums">{d.t1.itAvg}</p>
                  </div>
                  <div className="flex-1 relative mx-1">
                    <div className="h-1.5 bg-border dark:bg-warm-500 rounded-full overflow-hidden">
                      <div className="absolute left-0 top-0 h-full rounded-full bg-gold"
                        style={{ width: `${(d.t1.itAvg / 4) * 100}%` }} />
                    </div>
                    <div className="h-1.5 bg-border dark:bg-warm-500 rounded-full overflow-hidden mt-1">
                      <div className="absolute left-0 top-0 h-full rounded-full bg-info"
                        style={{ width: `${(d.t1.bizAvg / 4) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-text-muted dark:text-warm-300">Negocio (avg)</p>
                    <p className="text-xl font-semibold text-info-dark dark:text-info tabular-nums">{d.t1.bizAvg}</p>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted dark:text-warm-300 mb-2">
                  → Negocio +{d.t1.gapPts} pts sobre IT
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${avg < 2 ? 'bg-warning-light text-warning-dark' : 'bg-info-light text-info-dark'}`}>{tier}</span>
                  <span className="text-[10px] text-text-muted dark:text-warm-300">
                    Nº entrevistas: <span className="font-semibold text-lean-black dark:text-warm-50">{d.t1.interviewsCount}</span>
                  </span>
                </div>
                <p className="text-[10px] text-text-muted dark:text-warm-300 mb-2">
                  Área más débil: <span className="font-medium text-lean-black dark:text-warm-100">{weakest}</span>
                </p>
                <NavButton label="Abrir T1 Assessment" onClick={() => onNavigate('/t1')} />
              </ExpandedSection>
            )}
          </PanelCard>

          {/* ── P2: T4 Portfolio IA — FEATURED ─────────────── */}
          <PanelCard
            id="p2" featured expanded={expanded === 'p2'} onClick={() => toggle('p2')}
            tag="T4 · Portfolio IA  ★" tagColor="success"
            title="Iniciativas activas" subtitle={`${d.t4.totalInitiatives} iniciativas · ${d.t4.statuses.active} activas`}
            animDelay={80}
            heroSlot={<HeroMetric label="Inversión total" value={`€${(d.t4.totalInvestment / 1000).toFixed(0)}K`} />}
          >
            <StatusBar segments={t4Segments} />
            {/* 3 metric chips — always visible */}
            <div className="flex gap-2 mt-3">
              <MetricChip label="Ahorro anual est." value={`€${(d.t4.ahorroAnual / 1000).toFixed(0)}K`} valueColor="#5FAF8A" />
              <MetricChip label="Payback promedio" value={`${d.t4.paybackMeses} meses`} />
              <MetricChip label="ROI 3 años" value={`${d.t4.roi3years}%`} valueColor="#C8860A" />
            </div>

            {expanded === 'p2' && (
              <ExpandedSection>
                <div className="space-y-1.5 mb-3">
                  {d.t4.topInitiatives.map((ini, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="text-text-primary dark:text-warm-100 flex-1 truncate">{ini.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                        ini.status === 'active' ? 'bg-success-light text-success-dark' : 'bg-warning-light text-warning-dark'}`}>
                        {ini.status === 'active' ? 'Activa' : 'Validando'}
                      </span>
                      <span className="text-text-muted dark:text-warm-300 tabular-nums flex-shrink-0">
                        €{(ini.value / 1000).toFixed(0)}K
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-text-muted dark:text-warm-300">ROI estimado:</span>
                  <span className="text-[10px] font-semibold text-success-dark">{d.t4.roi}x retorno</span>
                </div>
                <NavButton label="Abrir T4 Portfolio" onClick={() => onNavigate('/t4')} />
              </ExpandedSection>
            )}
          </PanelCard>

          {/* ── P3: T2+T7 Adopción ──────────────────────────── */}
          <PanelCard
            id="p3" expanded={expanded === 'p3'} onClick={() => toggle('p3')}
            tag="T2 + T7 · Adopción" tagColor="info"
            title="Velocidad de adopción" subtitle={`${d.t2t7.totalStakeholders} stakeholders · ${d.t2t7.activePercent}% activos`}
            animDelay={160}
            heroSlot={<HeroMetric label="Adopción activa" value={`${d.t2t7.activePercent}%`} colorScore={d.t2t7.activePercent} />}
          >
            {/* Department chart */}
            <div className="mb-2">
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle dark:text-warm-400 mb-1.5">
                Composición por departamento
              </p>
              {d.t2t7.departments.map((dept, i) => (
                <DeptBar key={i} {...dept} />
              ))}
              {/* Legend */}
              <div className="flex gap-3 mt-1.5">
                {d.t2t7.groups.map((g, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] text-text-muted dark:text-warm-300">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: g.color }} />
                    {g.label.split(' ')[0]} {g.count}
                  </div>
                ))}
              </div>
            </div>

            {expanded === 'p3' && (
              <ExpandedSection>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Score de cambio</p>
                    <p className="text-lg font-semibold text-info-dark dark:text-info tabular-nums">{d.t2t7.changeScore} / 5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Fase de difusión</p>
                    <p className="text-[11px] font-medium text-text-primary dark:text-warm-100">{d.t2t7.rogersPhase}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <NavButton label="Abrir T2" onClick={() => onNavigate('/t2')} />
                  <NavButton label="Abrir T7" onClick={() => onNavigate('/t7')} secondary />
                </div>
              </ExpandedSection>
            )}
          </PanelCard>

          {/* ── P4: T3+T5 Ecosistema IA ─────────────────────── */}
          <PanelCard
            id="p4" expanded={expanded === 'p4'} onClick={() => toggle('p4')}
            tag="T3 + T5 · Taxonomía" tagColor="purple"
            title="Ecosistema IA" subtitle={`${d.t3t5.processesTotal} procesos · ${d.t3t5.aiTypes.length} tipos IA activos`}
            animDelay={240}
            heroSlot={<HeroMetric label="Eficiencia" value={`${d.t3t5.efficiencyPct}%`} colorScore={d.t3t5.efficiencyPct} />}
          >
            {/* AI type distribution — donut + legend */}
            <div className="flex items-center gap-3">
              <DonutChart segments={aiTypeSegments} size={68} strokeWidth={14} />
              <div className="space-y-1.5 flex-1">
                {d.t3t5.aiTypes.map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: t.color }} />
                    <span className="text-text-muted dark:text-warm-300 flex-1">{t.label}</span>
                    <span className="font-medium text-lean-black dark:text-warm-100">{t.count}</span>
                    <span className="text-text-subtle dark:text-warm-400">{t.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md px-2.5 py-1.5 mt-2" style={{ background: 'rgba(127, 119, 221, 0.08)' }}>
              <p className="text-[10px] text-[#534AB7] dark:text-[#AFA9EC]">
                Cuello: <span className="font-semibold">{d.t3t5.bottleneck}</span>
              </p>
            </div>

            {expanded === 'p4' && (
              <ExpandedSection>
                <div className="flex gap-2 mb-3">
                  <MetricChip label="Procesos mapeados" value={`${d.t3t5.processesMapped}/${d.t3t5.processesTotal}`} />
                  <MetricChip label="Opp crítica" value={String(d.t3t5.oppCritica)} valueColor="#C06060" />
                  <MetricChip label="Opp alta" value={String(d.t3t5.oppAlta)} valueColor="#D4A85C" />
                  <MetricChip label="Total" value={String(d.t3t5.total)} />
                </div>
                <div className="flex items-center gap-3">
                  <NavButton label="Abrir T3" onClick={() => onNavigate('/t3')} />
                  <NavButton label="Abrir T5" onClick={() => onNavigate('/t5')} secondary />
                </div>
              </ExpandedSection>
            )}
          </PanelCard>

          {/* ── P5: T6+T12 Riesgos + ISO ────────────────────── */}
          <PanelCard
            id="p5" expanded={expanded === 'p5'} onClick={() => toggle('p5')}
            tag="T6 + T12 · Riesgos" tagColor="danger"
            title="Riesgo + ISO 42001" subtitle={`${d.t6t12.risks.total} riesgos · ${d.t6t12.isoCompliance}% ISO`}
            animDelay={320}
            heroSlot={<HeroMetric label="ISO 42001" value={`${d.t6t12.isoCompliance}%`} colorScore={d.t6t12.isoCompliance} />}
          >
            <div className="flex items-center gap-3">
              <DonutChart segments={riskSegments} size={60} strokeWidth={12} centerLabel={`${d.t6t12.risks.total}`} />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-danger" />
                  <span className="text-text-muted dark:text-warm-300 flex-1">Alto</span>
                  <span className="font-semibold text-danger-dark dark:text-danger">{d.t6t12.risks.high}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-warning" />
                  <span className="text-text-muted dark:text-warm-300 flex-1">Medio</span>
                  <span className="font-medium text-warning-dark dark:text-warning">{d.t6t12.risks.medium}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-success" />
                  <span className="text-text-muted dark:text-warm-300 flex-1">Bajo</span>
                  <span className="font-medium text-success-dark">{d.t6t12.risks.low}</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-muted dark:text-warm-300">ISO 42001 cumplimiento</span>
                <span className="text-[10px] font-semibold text-gold">{d.t6t12.isoCompliance}%</span>
              </div>
              <div className="h-[5px] rounded-full bg-border dark:bg-warm-500">
                <div className="h-full rounded-full bg-gold" style={{ width: `${d.t6t12.isoCompliance}%` }} />
              </div>
            </div>

            {expanded === 'p5' && (
              <ExpandedSection>
                <div className="mb-2">
                  <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Riesgo crítico identificado</p>
                  <p className="text-[11px] font-medium text-danger-dark dark:text-danger">{d.t6t12.topRisk}</p>
                </div>
                <div className="mb-3">
                  <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Próximo objetivo ISO</p>
                  <p className="text-[11px] font-medium text-text-primary dark:text-warm-100">{d.t6t12.nextClause}</p>
                </div>
                <div className="flex items-center gap-3">
                  <NavButton label="Abrir T6 Riesgos" onClick={() => onNavigate('/t6')} />
                  <NavButton label="Abrir T12 ISO" onClick={() => onNavigate('/t12')} secondary />
                </div>
              </ExpandedSection>
            )}
          </PanelCard>

          {/* ── P6: T8+T9+T11 Gobierno Activo ───────────────── */}
          <PanelCard
            id="p6" expanded={expanded === 'p6'} onClick={() => toggle('p6')}
            tag="T8 · T9 · T11 · Gobierno" tagColor="amber"
            title="Gobierno activo" subtitle="Próximos eventos · Hitos · Vendors"
            animDelay={400}
            heroSlot={<HeroMetric label="Gobierno activo" value={`${d.t8t9t11.gobiernoActivoPct}%`} colorScore={d.t8t9t11.gobiernoActivoPct} />}
          >
            <div className="space-y-1.5">
              {d.t8t9t11.upcomingEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: EVENT_LEVEL_COLOR[ev.level] ?? '#C8860A' }} />
                  <span className="text-[11px] text-text-primary dark:text-warm-100 flex-1 truncate">{ev.name}</span>
                  <span className="text-[10px] text-text-muted dark:text-warm-300 flex-shrink-0">{ev.date}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
              <span className="text-[10px] text-danger-dark dark:text-danger truncate">
                {d.t8t9t11.criticalVendor} · renovación {d.t8t9t11.vendorRenewal}
              </span>
            </div>
            {/* 4 metric chips — always visible */}
            <div className="flex gap-1.5 mt-3">
              <MetricChip label="Casos en GO" value={String(d.t8t9t11.casosEnGO)} valueColor="#C8860A" />
              <MetricChip label="Inic. libres" value={String(d.t8t9t11.iniciativasLibres)} />
              <MetricChip label="Completadas" value={String(d.t8t9t11.archivosCompletados)} />
              <MetricChip label="Riesgos altos" value={String(d.t8t9t11.riesgosAltos)} valueColor="#C06060" />
            </div>

            {expanded === 'p6' && (
              <ExpandedSection>
                <div className="mb-3">
                  <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Próximo hito</p>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                    <p className="text-[11px] font-medium text-text-primary dark:text-warm-100">
                      {d.t8t9t11.nextMilestone}
                    </p>
                    <span className="text-[10px] text-text-muted dark:text-warm-300 flex-shrink-0">
                      {d.t8t9t11.nextMilestoneDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <NavButton label="Abrir T11 Gobierno" onClick={() => onNavigate('/t11')} />
                  <NavButton label="Abrir T9 Roadmap"   onClick={() => onNavigate('/t9')} secondary />
                  <NavButton label="Abrir T8 Vendors"   onClick={() => onNavigate('/t8')} secondary />
                </div>
              </ExpandedSection>
            )}
          </PanelCard>

        </div>

        {isDemoEnabled && (
          <p className="text-center text-[10px] text-text-subtle dark:text-warm-400 mt-6">
            Datos demo · GOBY · Alpha Consulting Solutions
          </p>
        )}

        {/* ── RECOMENDACIONES IA ────────────────────────────── */}
        {t10LLMContext && (
          <RecommendationPanel
            tool="t10"
            title="Recomendaciones IA — Programa de Adopción"
            subtitle="Generadas por Claude · Visión ejecutiva del programa completo"
            context={t10LLMContext}
            engagementId={engagementId}
          />
        )}
      </div>
    </div>
  )
}
