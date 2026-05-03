// ============================================================
// T10 — AI Value Dashboard · "Wow Moment" Screen
//
// Home screen del L.E.A.N. AI System.
// Modo demo siempre activo: datos estáticos realistas (T10_DEMO)
// + T1 Radar del escenario activo (prop).
//
// Diseño: Obsidian Amber palette · 6 paneles · click-to-expand
// ============================================================

import { useState, useEffect }               from 'react'
import type { RadarDimension }               from '@/shared/components/charts/LeanRadarChart'
import { T10_DEMO }                          from './demo-data'

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

function t1Avg(radar: RadarDimension[]): number {
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

interface DimBarProps {
  label:      string
  value:      number
  max:        number
  color:      string
  showValue?: boolean
}

function DimBar({ label, value, max, color, showValue = false }: DimBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted dark:text-warm-300 w-[76px] flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-[5px] rounded-full bg-border dark:bg-warm-500">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {showValue && (
        <span className="text-[10px] text-text-muted dark:text-warm-300 w-6 text-right tabular-nums">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}

interface StatusBarProps {
  segments: Array<{ pct: number; color: string; label: string }>
}

function StatusBar({ segments }: StatusBarProps) {
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

interface DonutChartProps {
  segments: Array<{ pct: number; color: string }>
  size?: number
  strokeWidth?: number
  centerLabel?: string
}

function DonutChart({ segments, size = 64, strokeWidth = 13, centerLabel }: DonutChartProps) {
  const r    = (size - strokeWidth) / 2
  const cx   = size / 2
  const cy   = size / 2
  const circ = 2 * Math.PI * r

  let cumulativeLen = 0
  const rendered = segments.map((seg, i) => {
    const dashLen    = (seg.pct / 100) * circ
    const dashOffset = -cumulativeLen
    cumulativeLen   += dashLen
    return (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dashLen} ${circ}`}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    )
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#D4D0C8" strokeWidth={strokeWidth} className="dark:stroke-warm-500" />
      {rendered}
      {centerLabel && (
        <text
          x={cx} y={cy + 4}
          textAnchor="middle"
          fontSize="12"
          fontWeight="500"
          fill="currentColor"
          className="text-lean-black dark:text-warm-50"
        >
          {centerLabel}
        </text>
      )}
    </svg>
  )
}

function NavButton({
  label, onClick, secondary = false,
}: {
  label: string
  onClick: () => void
  secondary?: boolean
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={[
        'flex items-center gap-1 text-[11px] font-medium transition-colors',
        secondary
          ? 'text-text-muted dark:text-warm-300 hover:text-gold'
          : 'text-gold hover:text-gold-hover',
      ].join(' ')}
    >
      {label}
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" />
      </svg>
    </button>
  )
}

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

// ── Panel Card ───────────────────────────────────────────────

type TagColor = 'warning' | 'success' | 'info' | 'danger' | 'purple' | 'amber'

const TAG_CLASSES: Record<TagColor, string> = {
  warning: 'bg-warning-light text-warning-dark',
  success: 'bg-success-light text-success-dark',
  info:    'bg-info-light text-info-dark',
  danger:  'bg-danger-light text-danger-dark',
  purple:  'bg-[#EEEDFE] text-[#3C3489]',
  amber:   'bg-warning-light text-warning-dark',
}

interface PanelCardProps {
  id:        PanelId
  featured?: boolean
  expanded:  boolean
  onClick:   () => void
  tag:       string
  tagColor:  TagColor
  title:     string
  subtitle:  string
  animDelay: number
  children:  React.ReactNode
}

function PanelCard({
  featured = false,
  expanded,
  onClick,
  tag,
  tagColor,
  title,
  subtitle,
  animDelay,
  children,
}: PanelCardProps) {
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
      {/* Featured: subtle gold tint layer */}
      {featured && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ background: 'linear-gradient(135deg, #C8860A 0%, transparent 60%)' }}
        />
      )}

      {/* Tag */}
      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mb-2 ${TAG_CLASSES[tagColor]}`}>
        {tag}
      </span>

      {/* Title */}
      <p className="text-sm font-medium text-lean-black dark:text-warm-50 mb-0.5 leading-snug">{title}</p>
      <p className="text-[11px] text-text-muted dark:text-warm-300 mb-3">{subtitle}</p>

      {/* Content (summary + expanded) */}
      {children}
    </div>
  )
}

// ── T10View ──────────────────────────────────────────────────

export function T10View({
  companyName,
  sector,
  employees,
  t1Radar,
  onNavigate,
  demoPattern,
  demoScenarios,
  onPatternChange,
}: T10ViewProps) {

  const [expanded,  setExpanded]  = useState<PanelId | null>(null)
  const [aiDisplay, setAiDisplay] = useState(0)

  const avg     = t1Avg(t1Radar)
  const weakest = weakestDimension(t1Radar)
  const tier    = maturityLabel(avg)

  // ── AI Index counter animation ─────────────────────────────
  useEffect(() => {
    const target   = avg
    const duration = 1300
    const start    = Date.now()
    let frame: number

    const tick = () => {
      const elapsed  = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setAiDisplay(Math.round(eased * target * 10) / 10)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [avg])

  function togglePanel(id: PanelId) {
    setExpanded(prev => prev === id ? null : id)
  }

  // ── T4 stacked bar ─────────────────────────────────────────
  const d    = T10_DEMO
  const t4n  = d.t4.totalInitiatives
  const t4s  = d.t4.statuses
  const t4Segments = [
    { pct: Math.round((t4s.active     / t4n) * 100), color: '#86C7A8', label: `Activas ${t4s.active}` },
    { pct: Math.round((t4s.validating / t4n) * 100), color: '#E8C281', label: `Validando ${t4s.validating}` },
    { pct: Math.round((t4s.backlog    / t4n) * 100), color: '#9BB5D9', label: `Backlog ${t4s.backlog}` },
    { pct: Math.round((t4s.stopped   / t4n) * 100), color: '#C4C0B8', label: `Paradas ${t4s.stopped}` },
  ]

  // ── Risk donut segments ────────────────────────────────────
  const rTotal = d.t6t12.risks.total
  const riskSegments = [
    { pct: Math.round((d.t6t12.risks.high   / rTotal) * 100), color: '#D85A30' },
    { pct: Math.round((d.t6t12.risks.medium / rTotal) * 100), color: '#EF9F27' },
    { pct: Math.round((d.t6t12.risks.low    / rTotal) * 100), color: '#97C459' },
  ]

  // ── Adoption donut segments ────────────────────────────────
  const adoptionSegments = d.t2t7.groups.map(g => ({ pct: g.pct, color: g.color }))

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Dashboard header ─────────────────────────────── */}
      <div className="bg-lean-black dark:bg-warm-950">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between gap-4 flex-wrap">

          {/* Left: company info */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-warm-300 mb-0.5">
              {sector} · {employees.toLocaleString('es-ES')} empleados
            </p>
            <h1 className="text-base font-semibold text-warm-50 leading-tight">{companyName}</h1>
          </div>

          {/* Center: AI Index */}
          <div className="text-center flex-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-warm-400 mb-1">
              Índice IA global
            </p>
            <div className="flex items-baseline gap-1.5 justify-center">
              <span className="text-[2.5rem] font-semibold leading-none text-gold tabular-nums tracking-tight">
                {aiDisplay.toFixed(1)}
              </span>
              <span className="text-lg text-warm-400 leading-none">/ 4.0</span>
            </div>
            <p className="text-[10px] text-warm-300 mt-0.5">{tier}</p>
          </div>

          {/* Right: sprint + date */}
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Sprint 3 / 6
            </span>
            <p className="text-[10px] text-warm-400 mt-1">Mayo 2026</p>
          </div>
        </div>

        {/* Demo scenario selector */}
        {demoScenarios && onPatternChange && (
          <div className="border-t border-warm-700 dark:border-warm-800">
            <div className="max-w-6xl mx-auto px-8 py-2 flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-warm-400 flex-shrink-0">
                Escenario demo
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {demoScenarios.map(s => (
                  <button
                    key={s.id}
                    onClick={() => onPatternChange(s.id)}
                    className={[
                      'px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all',
                      s.id === demoPattern
                        ? 'bg-gold text-lean-black'
                        : 'bg-warm-700 text-warm-200 hover:bg-warm-600',
                    ].join(' ')}
                  >
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

          {/* P1: T1 AI Readiness ─────────────────────────────── */}
          <PanelCard
            id="p1"
            expanded={expanded === 'p1'}
            onClick={() => togglePanel('p1')}
            tag="T1 · Readiness"
            tagColor="warning"
            title="Madurez IA"
            subtitle={`${t1Radar.length} dimensiones · Score ${avg}/4`}
            animDelay={0}
          >
            {/* Summary: first 4 bars */}
            <div className="space-y-[5px]">
              {t1Radar.slice(0, 4).map(d => (
                <DimBar key={d.dimension} label={d.dimension} value={d.current} max={4} color="#C8860A" />
              ))}
              {t1Radar.length > 4 && (
                <p className="text-[10px] text-text-subtle dark:text-warm-400 pt-0.5">
                  +{t1Radar.length - 4} más
                </p>
              )}
            </div>

            {/* Expanded */}
            {expanded === 'p1' && (
              <ExpandedSection>
                <div className="space-y-[5px] mb-3">
                  {t1Radar.map(dim => (
                    <DimBar
                      key={dim.dimension}
                      label={dim.dimension}
                      value={dim.current}
                      max={4}
                      color="#C8860A"
                      showValue
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${avg < 2 ? 'bg-warning-light text-warning-dark' : 'bg-info-light text-info-dark'}`}>
                    {tier}
                  </span>
                  <span className="text-[10px] text-text-muted dark:text-warm-300">
                    Área más débil: <span className="font-medium">{weakest}</span>
                  </span>
                </div>
                <NavButton label="Abrir T1 Assessment" onClick={() => onNavigate('/t1')} />
              </ExpandedSection>
            )}
          </PanelCard>

          {/* P2: T4 Portfolio IA — FEATURED ─────────────────── */}
          <PanelCard
            id="p2"
            featured
            expanded={expanded === 'p2'}
            onClick={() => togglePanel('p2')}
            tag="T4 · Portfolio IA  ★"
            tagColor="success"
            title="Iniciativas activas"
            subtitle={`${d.t4.totalInitiatives} iniciativas · ${d.t4.statuses.active} activas`}
            animDelay={80}
          >
            {/* Status bar */}
            <StatusBar segments={t4Segments} />

            {/* Hero metric */}
            <div className="mt-3">
              <p className="text-[1.875rem] font-semibold text-success-dark tabular-nums leading-none">
                €{(d.t4.estimatedValue / 1000).toFixed(0)}K
              </p>
              <p className="text-[11px] text-text-muted dark:text-warm-300 mt-0.5">
                valor estimado en cartera
              </p>
            </div>

            {/* Expanded */}
            {expanded === 'p2' && (
              <ExpandedSection>
                <div className="space-y-1.5 mb-3">
                  {d.t4.topInitiatives.map((ini, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="text-text-primary dark:text-warm-100 flex-1 truncate">{ini.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                        ini.status === 'active' ? 'bg-success-light text-success-dark' : 'bg-warning-light text-warning-dark'
                      }`}>
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

          {/* P3: T2+T7 Adopción ─────────────────────────────── */}
          <PanelCard
            id="p3"
            expanded={expanded === 'p3'}
            onClick={() => togglePanel('p3')}
            tag="T2 + T7 · Adopción"
            tagColor="info"
            title="Velocidad de adopción"
            subtitle={`${d.t2t7.totalStakeholders} stakeholders · ${d.t2t7.activePercent}% activos`}
            animDelay={160}
          >
            <div className="flex items-center gap-3">
              <DonutChart
                segments={adoptionSegments}
                centerLabel={`${d.t2t7.activePercent}%`}
              />
              <div className="space-y-1.5 flex-1">
                {d.t2t7.groups.map((g, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: g.color }} />
                    <span className="text-text-muted dark:text-warm-300 flex-1">{g.label}</span>
                    <span className="text-text-primary dark:text-warm-100 font-medium">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <span className="text-[10px] text-info-dark dark:text-info font-medium">
                Curva Rogers: {d.t2t7.rogersPhase}
              </span>
            </div>

            {/* Expanded */}
            {expanded === 'p3' && (
              <ExpandedSection>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Score de cambio</p>
                    <p className="text-lg font-semibold text-info-dark dark:text-info tabular-nums">
                      {d.t2t7.changeScore} / 5
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Fase de difusión</p>
                    <p className="text-[11px] font-medium text-text-primary dark:text-warm-100">
                      {d.t2t7.rogersPhase}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <NavButton label="Abrir T2" onClick={() => onNavigate('/t2')} />
                  <NavButton label="Abrir T7" onClick={() => onNavigate('/t7')} secondary />
                </div>
              </ExpandedSection>
            )}
          </PanelCard>

          {/* P4: T3+T5 Taxonomía IA ─────────────────────────── */}
          <PanelCard
            id="p4"
            expanded={expanded === 'p4'}
            onClick={() => togglePanel('p4')}
            tag="T3 + T5 · Taxonomía"
            tagColor="purple"
            title="Ecosistema IA"
            subtitle={`${d.t3t5.processesTotal} procesos · ${d.t3t5.aiTypes.length} tipos IA activos`}
            animDelay={240}
          >
            <div className="space-y-[5px] mb-2">
              {d.t3t5.aiTypes.map((t) => (
                <DimBar key={t.label} label={t.label} value={t.count} max={6} color={t.color} showValue />
              ))}
            </div>
            <div className="rounded-md px-2.5 py-1.5 mt-2" style={{ background: 'rgba(127, 119, 221, 0.08)' }}>
              <p className="text-[10px] text-[#534AB7] dark:text-[#AFA9EC]">
                Cuello de botella: <span className="font-semibold">{d.t3t5.bottleneck}</span>
                {' '}· Eficiencia: <span className="font-semibold">{d.t3t5.efficiencyPct}%</span>
              </p>
            </div>

            {/* Expanded */}
            {expanded === 'p4' && (
              <ExpandedSection>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Procesos mapeados</p>
                    <p className="text-lg font-semibold text-[#534AB7] tabular-nums">
                      {d.t3t5.processesMapped} / {d.t3t5.processesTotal}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Severidad cuello</p>
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium bg-danger-light text-danger-dark">
                      {d.t3t5.bottleneckSeverity}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <NavButton label="Abrir T3" onClick={() => onNavigate('/t3')} />
                  <NavButton label="Abrir T5" onClick={() => onNavigate('/t5')} secondary />
                </div>
              </ExpandedSection>
            )}
          </PanelCard>

          {/* P5: T6+T12 Riesgos + ISO ───────────────────────── */}
          <PanelCard
            id="p5"
            expanded={expanded === 'p5'}
            onClick={() => togglePanel('p5')}
            tag="T6 + T12 · Riesgos"
            tagColor="danger"
            title="Riesgo + ISO 42001"
            subtitle={`${d.t6t12.risks.total} riesgos · ${d.t6t12.isoCompliance}% ISO`}
            animDelay={320}
          >
            <div className="flex items-center gap-3">
              <DonutChart
                segments={riskSegments}
                centerLabel={`${d.t6t12.risks.total}`}
              />
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

            {/* ISO bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-text-muted dark:text-warm-300">ISO 42001 cumplimiento</span>
                <span className="text-[10px] font-semibold text-gold">{d.t6t12.isoCompliance}%</span>
              </div>
              <div className="h-[5px] rounded-full bg-border dark:bg-warm-500">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${d.t6t12.isoCompliance}%` }}
                />
              </div>
            </div>

            {/* Expanded */}
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

          {/* P6: T8+T9+T11 Gobierno Activo ─────────────────── */}
          <PanelCard
            id="p6"
            expanded={expanded === 'p6'}
            onClick={() => togglePanel('p6')}
            tag="T8 · T9 · T11 · Gobierno"
            tagColor="amber"
            title="Gobierno activo"
            subtitle="Próximos eventos · Hitos · Vendors"
            animDelay={400}
          >
            <div className="space-y-1.5">
              {d.t8t9t11.upcomingEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: EVENT_LEVEL_COLOR[ev.level] ?? '#C8860A' }}
                  />
                  <span className="text-[11px] text-text-primary dark:text-warm-100 flex-1 truncate">{ev.name}</span>
                  <span className="text-[10px] text-text-muted dark:text-warm-300 flex-shrink-0">{ev.date}</span>
                </div>
              ))}
            </div>

            {/* Critical vendor alert */}
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
              <span className="text-[10px] text-danger-dark dark:text-danger truncate">
                {d.t8t9t11.criticalVendor} · renovación {d.t8t9t11.vendorRenewal}
              </span>
            </div>

            {/* Expanded */}
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
                  <NavButton label="Abrir T9 Roadmap"  onClick={() => onNavigate('/t9')}  secondary />
                  <NavButton label="Abrir T8 Vendors"  onClick={() => onNavigate('/t8')}  secondary />
                </div>
              </ExpandedSection>
            )}
          </PanelCard>

        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-text-subtle dark:text-warm-400 mt-6">
          Datos demo · L.E.A.N. AI System Enterprise · Alpha Consulting Solutions
        </p>
      </div>
    </div>
  )
}
