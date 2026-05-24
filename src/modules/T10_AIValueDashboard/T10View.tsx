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
import { useT1Store }                    from '@/modules/T1_MaturityRadar/store'
import { computeDimensionScore, computeOverallScore } from '@/modules/T1_MaturityRadar/types'
import { useT3Store }                    from '@/modules/T3_ValueStreamMap/store'
import { useT12Store }                   from '@/modules/T12_ISOAssessment/store'
import { useT9Store }                    from '@/modules/T9_AIRoadmap/store'
import { usePermissions }                from '@/modules/Auth'

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
  const loadT4                      = useT4Store(s => s.loadEngagement)
  const stakeholders                = useT2Store(s => s.stakeholders)
  const loadT2                      = useT2Store(s => s.load)
  const { profile: companyProfile, loadProfile } = useCompanyProfileStore()
  const engagementId                = useEngagementStore((s) => s.activeEngagementId)
  const projects                    = useEngagementStore((s) => s.projects)
  const { dimensionStates, interviewees, load: loadT1, isLoading: isT1Loading } = useT1Store()
  const { processes, load: loadT3 }   = useT3Store()
  const { controls: t12Controls, syncEngagement: syncT12 } = useT12Store()
  const { freeItems: t9FreeItems,  syncEngagement: syncT9  } = useT9Store()

  // ── Carga de todos los stores cuando cambia el proyecto activo ──
  useEffect(() => {
    if (!engagementId || isDemoEnabled) return
    loadT1(engagementId)
    loadT2(engagementId)
    loadT3(engagementId)
    loadT4(engagementId)
    loadProfile(engagementId)
    syncT12(engagementId)
    syncT9(engagementId)
  }, [engagementId])

  // ── T1: radar desde store real (producción) o prop demo ──────
  const liveT1Radar = useMemo((): RadarDimension[] => {
    if (isDemoEnabled) return t1Radar
    const allDimStates = Object.values(dimensionStates)
    if (allDimStates.length === 0) return []
    const template = allDimStates[0]
    return template.map(dim => {
      const scores: number[] = []
      allDimStates.forEach(dims => {
        const d = dims.find(x => x.code === dim.code)
        if (d) { const s = computeDimensionScore(d); if (s !== null) scores.push(s) }
      })
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      return { dimension: dim.label, current: Math.round(avg * 10) / 10, target: 4 }
    })
  }, [isDemoEnabled, t1Radar, dimensionStates])

  const avg     = calcAvg(liveT1Radar)
  const weakest = weakestDimension(liveT1Radar)
  const tier    = maturityLabel(avg)

  // ── Datos de cabecera: demo → props, producción → stores ─────
  const activeProject    = projects.find(p => p.id === engagementId)
  const displayName      = isDemoEnabled ? companyName  : (activeProject?.name ?? '')
  const displaySector    = isDemoEnabled ? sector       : (companyProfile?.sector ?? '')
  const displayTamano    = isDemoEnabled ? `${employees.toLocaleString('es-ES')} empleados` : (companyProfile?.tamanoEmpresa ?? '')

  // ── Permisos de usuario — client_viewer = solo lectura ──────────
  const { isReadOnly: isReadOnlyProject } = usePermissions()

  const t10LLMContext = useMemo(
    () => companyProfile
      ? buildT10RecommendationContext(liveT1Radar, useCases, stakeholders, null, companyProfile)
      : null,
    [liveT1Radar, useCases, stakeholders, companyProfile],
  )

  // ── T4: portfolio desde store real ───────────────────────────
  const liveT4 = useMemo(() => {
    if (useCases.length === 0) return {
      totalInitiatives: 0, estimatedValue: 0, totalInvestment: 0, ahorroAnual: 0,
      paybackMeses: 0, roi3years: 0, roi: 0,
      statuses: { active: 0, validating: 0, backlog: 0, stopped: 0 },
      topInitiatives: [] as Array<{ name: string; status: string; value: number }>,
    }
    const active     = useCases.filter(uc => ['go', 'en_piloto', 'completado'].includes(uc.status)).length
    const validating = useCases.filter(uc => uc.status === 'priorizado').length
    const backlog    = useCases.filter(uc => uc.status === 'candidato').length
    const stopped    = useCases.filter(uc => uc.status === 'no_go').length
    const ucWithEco  = useCases.filter(uc => uc.economics)
    const totalInvestment = ucWithEco.reduce((s, uc) => s + (uc.economics?.implementationCost ?? 0), 0)
    const savings = ucWithEco.map(uc => {
      const e = uc.economics!
      return e.processHoursPerWeek * e.headcount * 52 * e.efficiencyGain * e.hourlyRate
    })
    const totalSaving = savings.reduce((a, b) => a + b, 0)
    const paybacks = ucWithEco.map((uc, i) => {
      const s = savings[i]; const c = uc.economics?.implementationCost ?? 0
      return s > 0 && c > 0 ? (c / s) * 12 : null
    }).filter((p): p is number => p !== null)
    const roi3List = ucWithEco.map((uc, i) => {
      const s = savings[i]; const c = uc.economics?.implementationCost ?? 0
      return s > 0 && c > 0 ? ((s * 3 - c) / c) * 100 : null
    }).filter((r): r is number => r !== null)
    const topInitiatives = [...useCases]
      .filter(uc => ['go', 'en_piloto', 'priorizado'].includes(uc.status))
      .sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3)
      .map(uc => ({
        name:   uc.name,
        status: ['go', 'en_piloto'].includes(uc.status) ? 'active' : 'validating',
        value:  uc.economics?.implementationCost ?? 0,
      }))
    return {
      totalInitiatives: useCases.length, estimatedValue: 0, totalInvestment, ahorroAnual: totalSaving,
      paybackMeses: paybacks.length ? Math.round(paybacks.reduce((a, b) => a + b, 0) / paybacks.length) : 0,
      roi3years: roi3List.length ? Math.round(roi3List.reduce((a, b) => a + b, 0) / roi3List.length) : 0,
      roi: totalInvestment > 0 ? Math.round((totalSaving * 3 / totalInvestment) * 10) / 10 : 0,
      statuses: { active, validating, backlog, stopped }, topInitiatives,
    }
  }, [useCases])

  // ── T2: adopción desde store real ────────────────────────────
  const liveT2 = useMemo(() => {
    if (stakeholders.length === 0) return {
      totalStakeholders: 0, activeAdopters: 0, activePercent: 0,
      rogersPhase: 'Early Adopters', changeScore: 0,
      groups:      [] as Array<{ label: string; count: number; pct: number; color: string }>,
      departments: [] as Array<{ label: string; innovadores: number; early: number; rezagados: number; total: number }>,
    }
    const total = stakeholders.length
    const innov = stakeholders.filter(s => s.archetype === 'adoptador').length
    const early = stakeholders.filter(s => s.archetype === 'ambassador' || s.archetype === 'decisor').length
    const rezag = stakeholders.filter(s => s.archetype === 'critico' || s.archetype === 'reticente').length
    const activePercent = total > 0 ? Math.round(((innov + early) / total) * 100) : 0
    const deptMap: Record<string, { innovadores: number; early: number; rezagados: number; total: number }> = {}
    stakeholders.forEach(s => {
      if (!deptMap[s.department]) deptMap[s.department] = { innovadores: 0, early: 0, rezagados: 0, total: 0 }
      const dept = deptMap[s.department]; dept.total++
      if (s.archetype === 'adoptador') dept.innovadores++
      else if (s.archetype === 'ambassador' || s.archetype === 'decisor') dept.early++
      else dept.rezagados++
    })
    return {
      totalStakeholders: total, activeAdopters: innov + early, activePercent,
      rogersPhase: activePercent > 50 ? 'Early Majority' : 'Early Adopters', changeScore: 0,
      groups: [
        { label: 'Innovadores',    count: innov, pct: Math.round((innov / total) * 100), color: '#86C7A8' },
        { label: 'Early Majority', count: early, pct: Math.round((early / total) * 100), color: '#9BB5D9' },
        { label: 'Rezagados',      count: rezag, pct: Math.round((rezag / total) * 100), color: '#C4C0B8' },
      ],
      departments: Object.entries(deptMap)
        .map(([label, data]) => ({ label, ...data }))
        .sort((a, b) => b.total - a.total).slice(0, 4),
    }
  }, [stakeholders])

  // ── Shadow AI: % stakeholders con herramientas no oficiales ──
  const shadowAIPct = useMemo(() => {
    if (stakeholders.length === 0) return null
    const withTools = stakeholders.filter((s) => s.unofficialTools?.trim()).length
    return { pct: Math.round((withTools / stakeholders.length) * 100), total: stakeholders.length, withTools }
  }, [stakeholders])

  // ── T1: desglose IT vs Negocio para panel expandido ──────────
  const liveT1Breakdown = useMemo(() => {
    if (isDemoEnabled || interviewees.length === 0) {
      return { itAvg: 0, bizAvg: 0, gapPts: 0, interviewsCount: interviewees.length }
    }
    function avgForType(type: 'it' | 'business'): number {
      const group = interviewees.filter(i => i.type === type)
      if (group.length === 0) return 0
      const scores = group
        .map(i => { const dims = dimensionStates[i.id]; return dims ? computeOverallScore(dims) : null })
        .filter((s): s is number => s !== null)
      if (scores.length === 0) return 0
      return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    }
    const itAvg  = avgForType('it')
    const bizAvg = avgForType('business')
    return {
      itAvg,
      bizAvg,
      gapPts:          Math.abs(Math.round((bizAvg - itAvg) * 10) / 10),
      gapSign:         bizAvg >= itAvg ? 'Negocio' : 'IT',
      interviewsCount: interviewees.length,
    }
  }, [isDemoEnabled, interviewees, dimensionStates])

  // ── T3: ecosistema de procesos para P4 ───────────────────────
  const AI_CAT_META: Record<string, { label: string; color: string }> = {
    automatizacion_inteligente: { label: 'Automatización Inteligente', color: '#86C7A8' },
    analitica_predictiva:       { label: 'Analítica Predictiva',       color: '#9BB5D9' },
    automatizacion_rpa:         { label: 'RPA',                        color: '#E8C281' },
    asistente_ia:               { label: 'Asistente IA',               color: '#C8860A' },
  }

  const liveT3 = useMemo(() => {
    if (processes.length === 0) return null
    const catCounts: Record<string, number> = {}
    processes.forEach(p => { const c = p.aiCategory ?? 'sin_categoria'; catCounts[c] = (catCounts[c] ?? 0) + 1 })
    const total    = processes.length
    const aiTypes  = Object.entries(catCounts)
      .map(([cat, count]) => ({ label: AI_CAT_META[cat]?.label ?? cat, color: AI_CAT_META[cat]?.color ?? '#C4C0B8', count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
    const oppCritica      = processes.filter(p => p.opportunityLevel === 'critica').length
    const oppAlta         = processes.filter(p => p.opportunityLevel === 'alta').length
    const processesMapped = processes.filter(p => p.stages && p.stages.length > 0).length
    const withScore       = processes.filter(p => p.interview?.opportunityScore != null)
    const avgOpp          = withScore.length ? withScore.reduce((s, p) => s + p.interview!.opportunityScore, 0) / withScore.length : 0
    const bottleneck      = [...processes]
      .filter(p => p.stages && p.stages.length > 0)
      .map(p => ({ name: p.name, ratio: (p.stages ?? []).reduce((s, st) => s + st.waitTimeHours, 0) / Math.max((p.stages ?? []).reduce((s, st) => s + st.procTimeHours, 0), 0.01) }))
      .sort((a, b) => b.ratio - a.ratio)[0]?.name ?? '—'
    return {
      processesTotal: total, processesMapped, efficiencyPct: Math.round((avgOpp / 4) * 100),
      bottleneck, oppCritica, oppAlta, total: oppCritica + oppAlta, aiTypes,
    }
  }, [processes])

  // ── P5: T12 compliance + T4 risk distribution ────────────────
  const liveP5 = useMemo(() => {
    const total    = t12Controls.length
    const approved = t12Controls.filter(c => c.status === 'aprobado').length
    const isoCompliance = total > 0 ? Math.round((approved / total) * 100) : 0
    const high   = useCases.filter(uc => uc.scores.aiRisk > 60).length
    const medium = useCases.filter(uc => uc.scores.aiRisk >= 30 && uc.scores.aiRisk <= 60).length
    const low    = useCases.filter(uc => uc.scores.aiRisk < 30).length
    const risks  = { high, medium, low, total: useCases.length }
    return { isoCompliance, risks, hasData: approved > 0 || useCases.length > 0 }
  }, [t12Controls, useCases])

  // ── P6: T9 milestones + T4 active initiatives ─────────────────
  const liveP6 = useMemo(() => {
    const casosEnGO      = useCases.filter(uc => ['go', 'en_piloto'].includes(uc.status)).length
    const completados    = useCases.filter(uc => uc.status === 'completado').length
    const libres         = useCases.filter(uc => uc.status === 'candidato').length
    const upcomingEvents = [...t9FreeItems]
      .filter(item => item.status !== 'completado')
      .sort((a, b) => a.startMonth - b.startMonth)
      .slice(0, 4)
      .map(item => ({
        name:  item.name,
        date:  `Mes ${item.startMonth + 1}`,
        level: item.riskLevel === 'alto' ? 'direction' as const
             : item.riskLevel === 'medio' ? 'program' as const
             : 'team' as const,
      }))
    const total = useCases.length
    const gobiernoActivoPct = total > 0 ? Math.round((casosEnGO / total) * 100) : 0
    return {
      casosEnGO, completados, libres, upcomingEvents, gobiernoActivoPct,
      hasData: casosEnGO > 0 || t9FreeItems.length > 0,
    }
  }, [t9FreeItems, useCases])

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

  // ── Guard 1: sin proyecto seleccionado ────────────────────────
  if (!isDemoEnabled && !engagementId) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center px-6">
        <div className="text-center max-w-sm space-y-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(200,134,10,0.06)', border: '1.5px solid rgba(200,134,10,0.18)' }}
          >
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none" stroke="#C8860A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="10" height="10" rx="1" />
              <path d="M5 13V9h4v4M2 6h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-lean-black dark:text-gray-100 mb-1.5">
              Selecciona un proyecto
            </h2>
            <p className="text-xs text-text-muted dark:text-gray-500 leading-relaxed">
              El dashboard de adopción IA está vinculado al proyecto activo.
              Usa el selector <span className="font-semibold text-lean-black dark:text-gray-300">▾ Proyecto</span> en la barra superior para seleccionar uno existente o crear uno nuevo.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Guard 2: proyecto seleccionado pero T1 todavía sin datos ──
  if (!isDemoEnabled && engagementId && !isT1Loading && liveT1Radar.length === 0) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center px-6">
        <div className="text-center max-w-md space-y-5">
          {/* Icono */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(200,134,10,0.06)', border: '1.5px solid rgba(200,134,10,0.18)' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeWidth="1.8" />
            </svg>
          </div>
          {/* Texto */}
          <div>
            <h2 className="text-sm font-semibold text-lean-black dark:text-gray-100 mb-2">
              No hay datos suficientes para calcular el valor
            </h2>
            <p className="text-xs text-text-muted dark:text-gray-500 leading-relaxed">
              El dashboard se construye a partir de las herramientas del programa L.E.A.N.
              Comienza completando el <span className="font-semibold text-lean-black dark:text-gray-300">Radar de Madurez (T1)</span> para que el sistema pueda calcular los indicadores de adopción IA de tu empresa.
            </p>
          </div>
          {/* Progress de herramientas completadas */}
          <div
            className="rounded-xl px-4 py-3 text-left space-y-1.5"
            style={{ background: 'rgba(200,134,10,0.04)', border: '1px solid rgba(200,134,10,0.14)' }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: '#C8860A' }}>
              Ruta de activación recomendada
            </p>
            {[
              { code: 'T1', label: 'Radar de Madurez', active: true  },
              { code: 'T2', label: 'Matriz de Stakeholders', active: false },
              { code: 'T3', label: 'Mapa de Procesos', active: false  },
              { code: 'T4', label: 'Portfolio de Casos de Uso', active: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                  style={{
                    background: step.active ? '#C8860A' : 'rgba(200,134,10,0.08)',
                    color:      step.active ? '#fff'    : '#C8860A',
                    border:     step.active ? 'none'   : '1px solid rgba(200,134,10,0.25)',
                  }}
                >
                  {i + 1}
                </div>
                <span className={`text-xs ${step.active ? 'font-semibold text-lean-black dark:text-gray-100' : 'text-text-muted dark:text-gray-500'}`}>
                  {step.code} · {step.label}
                </span>
              </div>
            ))}
          </div>
          {/* CTA */}
          <button
            onClick={() => onNavigate('/t1')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm"
            style={{ background: '#C8860A' }}
          >
            Comenzar con T1 — Radar de Madurez
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const d      = T10_DEMO
  const t4data = isDemoEnabled ? d.t4     : liveT4
  const t2data = isDemoEnabled ? d.t2t7   : liveT2
  const t3data = isDemoEnabled ? d.t3t5   : liveT3   // null = sin datos aún
  const p5data = isDemoEnabled ? d.t6t12  : liveP5
  const p6data = isDemoEnabled ? d.t8t9t11 : liveP6
  const t4n    = t4data.totalInitiatives
  const t4s    = t4data.statuses
  const t4Segments = t4n > 0 ? [
    { pct: Math.round((t4s.active     / t4n) * 100), color: '#86C7A8', label: `Activas ${t4s.active}` },
    { pct: Math.round((t4s.validating / t4n) * 100), color: '#E8C281', label: `Validando ${t4s.validating}` },
    { pct: Math.round((t4s.backlog    / t4n) * 100), color: '#9BB5D9', label: `Backlog ${t4s.backlog}` },
    { pct: Math.round((t4s.stopped   / t4n) * 100), color: '#C4C0B8', label: `Paradas ${t4s.stopped}` },
  ] : [{ pct: 100, color: '#D4D0C8', label: 'Sin datos' }]

  const rTotal = p5data.risks.total
  const riskSegments = p5data.risks.total > 0 ? [
    { pct: Math.round((p5data.risks.high   / rTotal) * 100), color: '#D85A30' },
    { pct: Math.round((p5data.risks.medium / rTotal) * 100), color: '#EF9F27' },
    { pct: Math.round((p5data.risks.low    / rTotal) * 100), color: '#97C459' },
  ] : [{ pct: 100, color: '#D4D0C8' }]

  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Dashboard header ─────────────────────────────── */}
      <div className="bg-lean-black dark:bg-warm-950">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-warm-300 mb-0.5">
              {[displaySector, displayTamano].filter(Boolean).join(' · ')}
            </p>
            <h1 className="text-base font-semibold text-warm-50 leading-tight">{displayName}</h1>
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

        {/* Banner solo-lectura — visible cuando el proyecto es de un compañero */}
        {isReadOnlyProject && (
          <div className="border-t border-warm-700">
            <div className="max-w-6xl mx-auto px-8 py-2 flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#9BB5D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="7" width="10" height="7" rx="1.5" />
                <path d="M5 7V5a3 3 0 016 0v2" />
              </svg>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#9BB5D9]">
                Proyecto de tu empresa · Solo lectura — no puedes guardar cambios en este proyecto
              </span>
            </div>
          </div>
        )}

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
            title="Madurez IA" subtitle={`${liveT1Radar.length} dimensiones · Score ${avg}/4`}
            animDelay={0}
            heroSlot={<HeroMetric label="Madurez IA" value={avg.toFixed(1)} colorScore={(avg / 4) * 100} />}
          >
            <div className="space-y-[5px]">
              {liveT1Radar.slice(0, 4).map(dim => (
                <DimBar key={dim.dimension} label={dim.dimension} value={dim.current} max={4} color="#C8860A" />
              ))}
              {liveT1Radar.length > 4 && (
                <p className="text-[10px] text-text-subtle dark:text-warm-400 pt-0.5">+{liveT1Radar.length - 4} más</p>
              )}
            </div>

            {expanded === 'p1' && (
              <ExpandedSection>
                {/* IT vs Negocio — datos reales o demo */}
                {(isDemoEnabled || liveT1Breakdown.interviewsCount > 0) ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-center">
                        <p className="text-[10px] text-text-muted dark:text-warm-300">IT (avg)</p>
                        <p className="text-xl font-semibold text-gold tabular-nums">
                          {isDemoEnabled ? d.t1.itAvg : liveT1Breakdown.itAvg}
                        </p>
                      </div>
                      <div className="flex-1 relative mx-1">
                        <div className="h-1.5 bg-border dark:bg-warm-500 rounded-full overflow-hidden">
                          <div className="absolute left-0 top-0 h-full rounded-full bg-gold"
                            style={{ width: `${((isDemoEnabled ? d.t1.itAvg : liveT1Breakdown.itAvg) / 4) * 100}%` }} />
                        </div>
                        <div className="h-1.5 bg-border dark:bg-warm-500 rounded-full overflow-hidden mt-1">
                          <div className="absolute left-0 top-0 h-full rounded-full bg-info"
                            style={{ width: `${((isDemoEnabled ? d.t1.bizAvg : liveT1Breakdown.bizAvg) / 4) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-text-muted dark:text-warm-300">Negocio (avg)</p>
                        <p className="text-xl font-semibold text-info-dark dark:text-info tabular-nums">
                          {isDemoEnabled ? d.t1.bizAvg : liveT1Breakdown.bizAvg}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-2">
                      → {isDemoEnabled ? `Negocio +${d.t1.gapPts} pts sobre IT` : `${liveT1Breakdown.gapSign} +${liveT1Breakdown.gapPts} pts`}
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] text-text-muted dark:text-warm-300 mb-2">
                    Sin entrevistas registradas aún — abre T1 para añadir la primera.
                  </p>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${avg < 2 ? 'bg-warning-light text-warning-dark' : 'bg-info-light text-info-dark'}`}>{tier}</span>
                  <span className="text-[10px] text-text-muted dark:text-warm-300">
                    Nº entrevistas: <span className="font-semibold text-lean-black dark:text-warm-50">
                      {isDemoEnabled ? d.t1.interviewsCount : liveT1Breakdown.interviewsCount}
                    </span>
                  </span>
                </div>
                <p className="text-[10px] text-text-muted dark:text-warm-300 mb-2">
                  Área más débil: <span className="font-medium text-lean-black dark:text-warm-100">{weakest || '—'}</span>
                </p>
                <NavButton label="Abrir T1 Assessment" onClick={() => onNavigate('/t1')} />
              </ExpandedSection>
            )}
          </PanelCard>

          {/* ── P2: T4 Portfolio IA — FEATURED ─────────────── */}
          <PanelCard
            id="p2" featured expanded={expanded === 'p2'} onClick={() => toggle('p2')}
            tag="T4 · Portfolio IA  ★" tagColor="success"
            title="Iniciativas activas" subtitle={`${t4data.totalInitiatives} iniciativas · ${t4data.statuses.active} activas`}
            animDelay={80}
            heroSlot={<HeroMetric label="Inversión total" value={t4data.totalInvestment > 0 ? `€${(t4data.totalInvestment / 1000).toFixed(0)}K` : '—'} />}
          >
            <StatusBar segments={t4Segments} />
            {/* 3 metric chips — always visible */}
            <div className="flex gap-2 mt-3">
              <MetricChip label="Ahorro anual est." value={t4data.ahorroAnual > 0 ? `€${(t4data.ahorroAnual / 1000).toFixed(0)}K` : '—'} valueColor="#5FAF8A" />
              <MetricChip label="Payback promedio" value={t4data.paybackMeses > 0 ? `${t4data.paybackMeses} meses` : '—'} />
              <MetricChip label="ROI 3 años" value={t4data.roi3years > 0 ? `${t4data.roi3years}%` : '—'} valueColor="#C8860A" />
            </div>

            {expanded === 'p2' && (
              <ExpandedSection>
                <div className="space-y-1.5 mb-3">
                  {t4data.topInitiatives.length > 0
                    ? t4data.topInitiatives.map((ini, i) => (
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
                      ))
                    : <p className="text-[11px] text-text-muted dark:text-warm-300">Sin iniciativas priorizadas aún</p>
                  }
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-text-muted dark:text-warm-300">ROI estimado:</span>
                  <span className="text-[10px] font-semibold text-success-dark">{t4data.roi > 0 ? `${t4data.roi}x retorno` : '—'}</span>
                </div>
                <NavButton label="Abrir T4 Portfolio" onClick={() => onNavigate('/t4')} />
              </ExpandedSection>
            )}
          </PanelCard>

          {/* ── P3: T2+T7 Adopción ──────────────────────────── */}
          <PanelCard
            id="p3" expanded={expanded === 'p3'} onClick={() => toggle('p3')}
            tag="T2 + T7 · Adopción" tagColor="info"
            title="Velocidad de adopción" subtitle={`${t2data.totalStakeholders} stakeholders · ${t2data.activePercent}% activos`}
            animDelay={160}
            heroSlot={<HeroMetric label="Adopción activa" value={`${t2data.activePercent}%`} colorScore={t2data.activePercent} />}
          >
            {/* Department chart */}
            <div className="mb-2">
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle dark:text-warm-400 mb-1.5">
                Composición por departamento
              </p>
              {t2data.departments.length > 0
                ? t2data.departments.map((dept, i) => <DeptBar key={i} {...dept} />)
                : <p className="text-[10px] text-text-muted dark:text-warm-300">Sin stakeholders registrados aún</p>
              }
              {/* Legend */}
              {t2data.groups.length > 0 && (
                <div className="flex gap-3 mt-1.5">
                  {t2data.groups.map((g, i) => (
                    <div key={i} className="flex items-center gap-1 text-[9px] text-text-muted dark:text-warm-300">
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: g.color }} />
                      {g.label.split(' ')[0]} {g.count}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {expanded === 'p3' && (
              <ExpandedSection>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Score de cambio</p>
                    <p className="text-lg font-semibold text-info-dark dark:text-info tabular-nums">{t2data.changeScore} / 5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Fase de difusión</p>
                    <p className="text-[11px] font-medium text-text-primary dark:text-warm-100">{t2data.rogersPhase}</p>
                  </div>
                </div>
                {/* Shadow AI mini-indicator */}
                {shadowAIPct !== null && (
                  <div
                    className="rounded-xl border px-3 py-2.5 mb-3"
                    style={{ backgroundColor: 'rgba(200,134,10,0.04)', borderColor: 'rgba(200,134,10,0.25)' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">⚠️</span>
                        <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: '#C8860A' }}>
                          Riesgo de Shadow AI
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color: '#C8860A' }}>
                        {shadowAIPct.pct}%
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${shadowAIPct.pct}%`, backgroundColor: '#C8860A' }}
                      />
                    </div>
                    <p className="text-[9px] text-text-subtle mt-1">
                      {shadowAIPct.withTools} de {shadowAIPct.total} perfiles declaran herramientas externas · Ver detalle en T6
                    </p>
                  </div>
                )}

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
            tag="T3 · Ecosistema IA" tagColor="purple"
            title="Ecosistema IA"
            subtitle={t3data
              ? `${t3data.processesTotal} procesos · ${t3data.aiTypes.length} tipos IA`
              : 'Sin procesos mapeados aún'}
            animDelay={240}
            heroSlot={<HeroMetric
              label="Eficiencia"
              value={t3data ? `${t3data.efficiencyPct}%` : '—'}
              colorScore={t3data?.efficiencyPct}
            />}
          >
            {t3data ? (
              <>
                {/* AI type distribution — donut + legend */}
                <div className="flex items-center gap-3">
                  <DonutChart
                    segments={t3data.aiTypes.map(t => ({ pct: t.pct, color: t.color }))}
                    size={68} strokeWidth={14}
                  />
                  <div className="space-y-1.5 flex-1">
                    {t3data.aiTypes.map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: t.color }} />
                        <span className="text-text-muted dark:text-warm-300 flex-1 truncate">{t.label}</span>
                        <span className="font-medium text-lean-black dark:text-warm-100">{t.count}</span>
                        <span className="text-text-subtle dark:text-warm-400">{t.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-md px-2.5 py-1.5 mt-2" style={{ background: 'rgba(127, 119, 221, 0.08)' }}>
                  <p className="text-[10px] text-[#534AB7] dark:text-[#AFA9EC]">
                    Mayor espera: <span className="font-semibold truncate">{t3data.bottleneck}</span>
                  </p>
                </div>
              </>
            ) : (
              <p className="text-[11px] text-text-muted dark:text-warm-300 py-2">
                Abre T3 para mapear los procesos de la empresa y ver la distribución de tipos de IA.
              </p>
            )}

            {expanded === 'p4' && (
              <ExpandedSection>
                {t3data ? (
                  <div className="flex gap-2 mb-3">
                    <MetricChip label="Mapeados" value={`${t3data.processesMapped}/${t3data.processesTotal}`} />
                    <MetricChip label="Opp crítica" value={String(t3data.oppCritica)} valueColor="#C06060" />
                    <MetricChip label="Opp alta"   value={String(t3data.oppAlta)}    valueColor="#D4A85C" />
                  </div>
                ) : null}
                <NavButton label="Abrir T3 Procesos" onClick={() => onNavigate('/t3')} />
              </ExpandedSection>
            )}
          </PanelCard>

          {/* ── P5: T12 ISO + T4 risk distribution ──────────── */}
          <PanelCard
            id="p5" expanded={expanded === 'p5'} onClick={() => toggle('p5')}
            tag="T6 + T12 · Riesgos" tagColor="danger"
            title="Riesgo + ISO 42001"
            subtitle={p5data.risks.total > 0 || p5data.isoCompliance > 0
              ? `${p5data.risks.total} casos mapeados · ${p5data.isoCompliance}% ISO`
              : 'Pendiente de mapeo'}
            animDelay={320}
            heroSlot={<HeroMetric
              label="ISO 42001"
              value={p5data.isoCompliance > 0 ? `${p5data.isoCompliance}%` : '—'}
              colorScore={p5data.isoCompliance > 0 ? p5data.isoCompliance : undefined}
            />}
          >
            {(isDemoEnabled || liveP5.hasData) ? (
              <>
                <div className="flex items-center gap-3">
                  <DonutChart
                    segments={riskSegments}
                    size={60} strokeWidth={12}
                    centerLabel={`${p5data.risks.total}`}
                  />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-danger" />
                      <span className="text-text-muted dark:text-warm-300 flex-1">Alto</span>
                      <span className="font-semibold text-danger-dark dark:text-danger">{p5data.risks.high}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-warning" />
                      <span className="text-text-muted dark:text-warm-300 flex-1">Medio</span>
                      <span className="font-medium text-warning-dark dark:text-warning">{p5data.risks.medium}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-success" />
                      <span className="text-text-muted dark:text-warm-300 flex-1">Bajo</span>
                      <span className="font-medium text-success-dark">{p5data.risks.low}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-text-muted dark:text-warm-300">ISO 42001 cumplimiento</span>
                    <span className="text-[10px] font-semibold text-gold">{p5data.isoCompliance}%</span>
                  </div>
                  <div className="h-[5px] rounded-full bg-border dark:bg-warm-500">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${p5data.isoCompliance}%` }} />
                  </div>
                </div>

                {/* Shadow AI — mismo dato que T6 */}
                {shadowAIPct !== null && (
                  <div className="mt-3 pt-3 border-t border-border dark:border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px]">⚠️</span>
                        <span className="text-[10px] text-text-muted dark:text-warm-300">Shadow AI</span>
                      </div>
                      <span
                        className="text-[10px] font-semibold tabular-nums"
                        style={{ color: shadowAIPct.pct > 0 ? '#C8860A' : '#6b7280' }}
                      >
                        {shadowAIPct.pct}%
                      </span>
                    </div>
                    <div className="h-[5px] rounded-full bg-border dark:bg-warm-500 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${shadowAIPct.pct}%`, backgroundColor: '#C8860A' }}
                      />
                    </div>
                    <p className="text-[9px] text-text-subtle mt-1">
                      {shadowAIPct.withTools} de {shadowAIPct.total} perfiles declaran herramientas externas
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[11px] text-text-muted dark:text-warm-300 py-2">
                Completa T4 (casos de uso) y T12 (ISO 42001) para ver el mapa de riesgo real del proyecto.
              </p>
            )}

            {expanded === 'p5' && (
              <ExpandedSection>
                {isDemoEnabled && (
                  <>
                    <div className="mb-2">
                      <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Riesgo crítico identificado</p>
                      <p className="text-[11px] font-medium text-danger-dark dark:text-danger">{d.t6t12.topRisk}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Próximo objetivo ISO</p>
                      <p className="text-[11px] font-medium text-text-primary dark:text-warm-100">{d.t6t12.nextClause}</p>
                    </div>
                  </>
                )}
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
            title="Gobierno activo"
            subtitle={isDemoEnabled
              ? 'Próximos eventos · Hitos · Vendors'
              : liveP6.hasData
                ? `${liveP6.casosEnGO} en GO · ${liveP6.upcomingEvents.length} hitos próximos`
                : 'Pendiente de configurar'}
            animDelay={400}
            heroSlot={<HeroMetric
              label="Gobierno activo"
              value={p6data.gobiernoActivoPct > 0 ? `${p6data.gobiernoActivoPct}%` : '—'}
              colorScore={p6data.gobiernoActivoPct > 0 ? p6data.gobiernoActivoPct : undefined}
            />}
          >
            {(isDemoEnabled || liveP6.hasData) ? (
              <>
                <div className="space-y-1.5">
                  {p6data.upcomingEvents.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: EVENT_LEVEL_COLOR[ev.level] ?? '#C8860A' }} />
                      <span className="text-[11px] text-text-primary dark:text-warm-100 flex-1 truncate">{ev.name}</span>
                      <span className="text-[10px] text-text-muted dark:text-warm-300 flex-shrink-0">{ev.date}</span>
                    </div>
                  ))}
                </div>
                {isDemoEnabled && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse flex-shrink-0" />
                    <span className="text-[10px] text-danger-dark dark:text-danger truncate">
                      {d.t8t9t11.criticalVendor} · renovación {d.t8t9t11.vendorRenewal}
                    </span>
                  </div>
                )}
                <div className="flex gap-1.5 mt-3">
                  <MetricChip label="Casos en GO"   value={String(p6data.casosEnGO)}   valueColor="#C8860A" />
                  {isDemoEnabled ? (
                    <>
                      <MetricChip label="Inic. libres"  value={String(d.t8t9t11.iniciativasLibres)} />
                      <MetricChip label="Completadas"   value={String(d.t8t9t11.archivosCompletados)} />
                      <MetricChip label="Riesgos altos" value={String(d.t8t9t11.riesgosAltos)} valueColor="#C06060" />
                    </>
                  ) : (
                    <>
                      <MetricChip label="Candidatos"  value={String(liveP6.libres)} />
                      <MetricChip label="Completados" value={String(liveP6.completados)} />
                      <MetricChip label="Riesgo alto" value={String(liveP5.risks.high)} valueColor="#C06060" />
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-[11px] text-text-muted dark:text-warm-300 py-2">
                Usa T4 (Portfolio) y T9 (Roadmap) para construir el panel de gobierno del proyecto.
              </p>
            )}

            {expanded === 'p6' && (
              <ExpandedSection>
                {isDemoEnabled && d.t8t9t11.nextMilestone && (
                  <div className="mb-3">
                    <p className="text-[10px] text-text-muted dark:text-warm-300 mb-0.5">Próximo hito</p>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0" />
                      <p className="text-[11px] font-medium text-text-primary dark:text-warm-100">{d.t8t9t11.nextMilestone}</p>
                      <span className="text-[10px] text-text-muted dark:text-warm-300 flex-shrink-0">{d.t8t9t11.nextMilestoneDate}</span>
                    </div>
                  </div>
                )}
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
