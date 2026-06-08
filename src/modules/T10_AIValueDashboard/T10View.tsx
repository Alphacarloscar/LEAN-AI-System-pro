// ============================================================
// T10 — AI Value Dashboard · "Wow Moment" Screen
//
// Home screen del GOBY.
// Modo demo siempre activo. 6 paneles con hero metric.
// Paleta Obsidian Amber · click-to-expand por panel.
// ============================================================

import { useState, useEffect, useMemo } from 'react'
import type { RadarDimension }          from '@/shared/components/charts/LeanRadarChart'
import { useT4Store }                    from '@/modules/T4_UseCasePriorityBoard/store'
import { useT2Store }                    from '@/modules/T2_StakeholderMatrix/store'
import { useCompanyProfileStore }        from '@/modules/CompanyProfile/store'
import { useEngagementStore }            from '@/modules/Engagement/store'
import { RecommendationPanel }           from '@/components/RecommendationPanel'
import { buildT10RecommendationContext } from './t10ContextBuilder'
import { useT1Store }                    from '@/modules/T1_MaturityRadar/store'
import { computeDimensionScore, computeOverallScore } from '@/modules/T1_MaturityRadar/types'
import { useT3Store }                    from '@/modules/T3_ValueStreamMap/store'
import { useT12Store }                   from '@/modules/T12_ISOAssessment/store'
import { useT9Store }                    from '@/modules/T9_AIRoadmap/store'
import { usePermissions }                from '@/modules/Auth'

import { EmptyNoProject, EmptyNoData } from './components/EmptyStates'
import { DashboardHeader }             from './components/DashboardHeader'
import { P1MaturityPanel }             from './components/panels/P1MaturityPanel'
import { P2PortfolioPanel }            from './components/panels/P2PortfolioPanel'
import { P3AdoptionPanel }             from './components/panels/P3AdoptionPanel'
import { P4EcosystemPanel }            from './components/panels/P4EcosystemPanel'
import { P5RiskPanel }                 from './components/panels/P5RiskPanel'
import { P6GovernancePanel }           from './components/panels/P6GovernancePanel'

// ── Tipos ────────────────────────────────────────────────────

type PanelId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6'

export interface T10ViewProps {
  onNavigate: (path: string) => void
}

// ── Constantes de módulo ─────────────────────────────────────

const AI_CAT_META: Record<string, { label: string; color: string }> = {
  automatizacion_inteligente: { label: 'Automatización Inteligente', color: '#86C7A8' },
  analitica_predictiva:       { label: 'Analítica Predictiva',       color: '#9BB5D9' },
  automatizacion_rpa:         { label: 'RPA',                        color: '#E8C281' },
  asistente_ia:               { label: 'Asistente IA',               color: '#C8860A' },
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

// ── T10View ──────────────────────────────────────────────────

export function T10View({ onNavigate }: T10ViewProps) {

  const [expanded,  setExpanded]  = useState<PanelId | null>(null)
  const [aiDisplay, setAiDisplay] = useState(0)

  const useCases   = useT4Store(s => s.useCases)
  const loadT4     = useT4Store(s => s.loadEngagement)
  const stakeholders = useT2Store(s => s.stakeholders)
  const loadT2     = useT2Store(s => s.load)
  const { profile: companyProfile, loadProfile } = useCompanyProfileStore()
  const engagementId = useEngagementStore((s) => s.activeEngagementId)
  const projects     = useEngagementStore((s) => s.projects)
  const { dimensionStates, interviewees, load: loadT1, isLoading: isT1Loading } = useT1Store()
  const { processes, load: loadT3 }      = useT3Store()
  const { controls: t12Controls, syncEngagement: syncT12 } = useT12Store()
  const { freeItems: t9FreeItems, syncEngagement: syncT9  } = useT9Store()
  const { isReadOnly: isReadOnlyProject } = usePermissions()

  // mount-only: carga inicial de todos los módulos cuando cambia el engagement
  // stable Zustand actions — añadirlas es inofensivo pero convención del proyecto es omitirlas
  useEffect(() => {
    if (!engagementId) return
    loadT1(engagementId); loadT2(engagementId); loadT3(engagementId); loadT4(engagementId)
    loadProfile(engagementId); syncT12(engagementId); syncT9(engagementId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  // ── T1: radar agregado ───────────────────────────────────────
  const liveT1Radar = useMemo((): RadarDimension[] => {
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
  }, [dimensionStates])

  const avg     = calcAvg(liveT1Radar)
  const weakest = weakestDimension(liveT1Radar)
  const tier    = maturityLabel(avg)

  const activeProject = projects.find(p => p.id === engagementId)
  const displayName   = activeProject?.name ?? ''
  const displaySector = companyProfile?.sector ?? ''
  const displayTamano = companyProfile?.tamanoEmpresa ?? ''

  const t10LLMContext = useMemo(
    () => companyProfile
      ? buildT10RecommendationContext(liveT1Radar, useCases, stakeholders, null, companyProfile)
      : null,
    [liveT1Radar, useCases, stakeholders, companyProfile],
  )

  // ── T4: portfolio ────────────────────────────────────────────
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
    const savings = ucWithEco.map(uc => { const e = uc.economics!; return e.processHoursPerWeek * e.headcount * 52 * e.efficiencyGain * e.hourlyRate })
    const totalSaving = savings.reduce((a, b) => a + b, 0)
    const paybacks  = ucWithEco.map((uc, i) => { const s = savings[i]; const c = uc.economics?.implementationCost ?? 0; return s > 0 && c > 0 ? (c / s) * 12 : null }).filter((p): p is number => p !== null)
    const roi3List  = ucWithEco.map((uc, i) => { const s = savings[i]; const c = uc.economics?.implementationCost ?? 0; return s > 0 && c > 0 ? ((s * 3 - c) / c) * 100 : null }).filter((r): r is number => r !== null)
    const topInitiatives = [...useCases].filter(uc => ['go', 'en_piloto', 'priorizado'].includes(uc.status)).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3).map(uc => ({ name: uc.name, status: ['go', 'en_piloto'].includes(uc.status) ? 'active' : 'validating', value: uc.economics?.implementationCost ?? 0 }))
    return {
      totalInitiatives: useCases.length, estimatedValue: 0, totalInvestment, ahorroAnual: totalSaving,
      paybackMeses: paybacks.length ? Math.round(paybacks.reduce((a, b) => a + b, 0) / paybacks.length) : 0,
      roi3years: roi3List.length ? Math.round(roi3List.reduce((a, b) => a + b, 0) / roi3List.length) : 0,
      roi: totalInvestment > 0 ? Math.round((totalSaving * 3 / totalInvestment) * 10) / 10 : 0,
      statuses: { active, validating, backlog, stopped }, topInitiatives,
    }
  }, [useCases])

  // ── T2: adopción ─────────────────────────────────────────────
  const liveT2 = useMemo(() => {
    if (stakeholders.length === 0) return { totalStakeholders: 0, activeAdopters: 0, activePercent: 0, rogersPhase: 'Early Adopters', changeScore: 0, groups: [] as Array<{ label: string; count: number; pct: number; color: string }>, departments: [] as Array<{ label: string; innovadores: number; early: number; rezagados: number; total: number }> }
    const total = stakeholders.length
    const innov = stakeholders.filter(s => s.archetype === 'adoptador').length
    const early = stakeholders.filter(s => s.archetype === 'ambassador' || s.archetype === 'decisor').length
    const rezag = stakeholders.filter(s => s.archetype === 'critico' || s.archetype === 'reticente').length
    const activePercent = total > 0 ? Math.round(((innov + early) / total) * 100) : 0
    const deptMap: Record<string, { innovadores: number; early: number; rezagados: number; total: number }> = {}
    stakeholders.forEach(s => { if (!deptMap[s.department]) deptMap[s.department] = { innovadores: 0, early: 0, rezagados: 0, total: 0 }; const dept = deptMap[s.department]; dept.total++; if (s.archetype === 'adoptador') dept.innovadores++; else if (s.archetype === 'ambassador' || s.archetype === 'decisor') dept.early++; else dept.rezagados++ })
    return { totalStakeholders: total, activeAdopters: innov + early, activePercent, rogersPhase: activePercent > 50 ? 'Early Majority' : 'Early Adopters', changeScore: 0, groups: [{ label: 'Innovadores', count: innov, pct: Math.round((innov / total) * 100), color: '#86C7A8' }, { label: 'Early Majority', count: early, pct: Math.round((early / total) * 100), color: '#9BB5D9' }, { label: 'Rezagados', count: rezag, pct: Math.round((rezag / total) * 100), color: '#C4C0B8' }], departments: Object.entries(deptMap).map(([label, data]) => ({ label, ...data })).sort((a, b) => b.total - a.total).slice(0, 4) }
  }, [stakeholders])

  const shadowAIPct = useMemo(() => {
    if (stakeholders.length === 0) return null
    const withTools = stakeholders.filter((s) => s.unofficialTools?.trim()).length
    return { pct: Math.round((withTools / stakeholders.length) * 100), total: stakeholders.length, withTools }
  }, [stakeholders])

  // ── T1: breakdown IT vs Negocio ──────────────────────────────
  const liveT1Breakdown = useMemo(() => {
    if (interviewees.length === 0) return { itAvg: 0, bizAvg: 0, gapPts: 0, interviewsCount: 0 }
    function avgForType(type: 'it' | 'business'): number {
      const group = interviewees.filter(i => i.type === type)
      if (group.length === 0) return 0
      const scores = group.map(i => { const dims = dimensionStates[i.id]; return dims ? computeOverallScore(dims) : null }).filter((s): s is number => s !== null)
      if (scores.length === 0) return 0
      return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    }
    const itAvg = avgForType('it'); const bizAvg = avgForType('business')
    return { itAvg, bizAvg, gapPts: Math.abs(Math.round((bizAvg - itAvg) * 10) / 10), gapSign: bizAvg >= itAvg ? 'Negocio' : 'IT', interviewsCount: interviewees.length }
  }, [interviewees, dimensionStates])

  // ── T3: ecosistema ───────────────────────────────────────────
  const liveT3 = useMemo(() => {
    if (processes.length === 0) return null
    const catCounts: Record<string, number> = {}
    processes.forEach(p => { const c = p.aiCategory ?? 'sin_categoria'; catCounts[c] = (catCounts[c] ?? 0) + 1 })
    const total    = processes.length
    const aiTypes  = Object.entries(catCounts).map(([cat, count]) => ({ label: AI_CAT_META[cat]?.label ?? cat, color: AI_CAT_META[cat]?.color ?? '#C4C0B8', count, pct: Math.round((count / total) * 100) })).sort((a, b) => b.count - a.count)
    const oppCritica = processes.filter(p => p.opportunityLevel === 'critica').length
    const oppAlta    = processes.filter(p => p.opportunityLevel === 'alta').length
    const processesMapped = processes.filter(p => p.stages && p.stages.length > 0).length
    const withScore  = processes.filter(p => p.interview?.opportunityScore != null)
    const avgOpp     = withScore.length ? withScore.reduce((s, p) => s + p.interview!.opportunityScore, 0) / withScore.length : 0
    const bottleneck = [...processes].filter(p => p.stages && p.stages.length > 0).map(p => ({ name: p.name, ratio: (p.stages ?? []).reduce((s, st) => s + st.waitTimeHours, 0) / Math.max((p.stages ?? []).reduce((s, st) => s + st.procTimeHours, 0), 0.01) })).sort((a, b) => b.ratio - a.ratio)[0]?.name ?? '—'
    return { processesTotal: total, processesMapped, efficiencyPct: Math.round((avgOpp / 4) * 100), bottleneck, oppCritica, oppAlta, total: oppCritica + oppAlta, aiTypes }
  }, [processes])

  // ── P5: ISO + riesgo ─────────────────────────────────────────
  const liveP5 = useMemo(() => {
    const total = t12Controls.length; const approved = t12Controls.filter(c => c.status === 'aprobado').length
    const isoCompliance = total > 0 ? Math.round((approved / total) * 100) : 0
    const high = useCases.filter(uc => uc.scores.aiRisk > 60).length; const medium = useCases.filter(uc => uc.scores.aiRisk >= 30 && uc.scores.aiRisk <= 60).length; const low = useCases.filter(uc => uc.scores.aiRisk < 30).length
    return { isoCompliance, risks: { high, medium, low, total: useCases.length }, hasData: approved > 0 || useCases.length > 0 }
  }, [t12Controls, useCases])

  // ── P6: gobierno + roadmap ────────────────────────────────────
  const liveP6 = useMemo(() => {
    const casosEnGO = useCases.filter(uc => ['go', 'en_piloto'].includes(uc.status)).length
    const completados = useCases.filter(uc => uc.status === 'completado').length
    const libres = useCases.filter(uc => uc.status === 'candidato').length
    const upcomingEvents = [...t9FreeItems].filter(item => item.status !== 'completado').sort((a, b) => a.startMonth - b.startMonth).slice(0, 4).map(item => ({ name: item.name, date: `Mes ${item.startMonth + 1}`, level: item.riskLevel === 'alto' ? 'direction' as const : item.riskLevel === 'medio' ? 'program' as const : 'team' as const }))
    const total = useCases.length; const gobiernoActivoPct = total > 0 ? Math.round((casosEnGO / total) * 100) : 0
    return { casosEnGO, completados, libres, upcomingEvents, gobiernoActivoPct, hasData: casosEnGO > 0 || t9FreeItems.length > 0 }
  }, [t9FreeItems, useCases])

  // AI Index counter animation
  useEffect(() => {
    const target = avg; const duration = 1300; const start = Date.now(); let frame: number
    const tick = () => { const p = Math.min((Date.now() - start) / duration, 1); setAiDisplay(Math.round((1 - Math.pow(1 - p, 3)) * target * 10) / 10); if (p < 1) frame = requestAnimationFrame(tick) }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [avg])

  function toggle(id: PanelId) { setExpanded(prev => prev === id ? null : id) }

  // ── Guards ───────────────────────────────────────────────────
  if (!engagementId) return <EmptyNoProject />
  if (engagementId && !isT1Loading && liveT1Radar.length === 0) return <EmptyNoData onNavigate={onNavigate} />

  // ── Segmentos precalculados para barras ──────────────────────
  const t4n = liveT4.totalInitiatives; const t4s = liveT4.statuses
  const t4Segments = t4n > 0 ? [
    { pct: Math.round((t4s.active     / t4n) * 100), color: '#86C7A8', label: `Activas ${t4s.active}` },
    { pct: Math.round((t4s.validating / t4n) * 100), color: '#E8C281', label: `Validando ${t4s.validating}` },
    { pct: Math.round((t4s.backlog    / t4n) * 100), color: '#9BB5D9', label: `Backlog ${t4s.backlog}` },
    { pct: Math.round((t4s.stopped   / t4n) * 100), color: '#C4C0B8', label: `Paradas ${t4s.stopped}` },
  ] : [{ pct: 100, color: '#D4D0C8', label: 'Sin datos' }]

  const rTotal = liveP5.risks.total
  const riskSegments = rTotal > 0 ? [
    { pct: Math.round((liveP5.risks.high   / rTotal) * 100), color: '#D85A30' },
    { pct: Math.round((liveP5.risks.medium / rTotal) * 100), color: '#EF9F27' },
    { pct: Math.round((liveP5.risks.low    / rTotal) * 100), color: '#97C459' },
  ] : [{ pct: 100, color: '#D4D0C8' }]

  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      <DashboardHeader
        displayName={displayName} displaySector={displaySector} displayTamano={displayTamano}
        aiDisplay={aiDisplay} tier={tier} isReadOnly={isReadOnlyProject}
      />

      <div className="max-w-6xl mx-auto px-8 py-7">
        <div className="grid grid-cols-3 gap-5">

          <P1MaturityPanel
            radar={liveT1Radar} avg={avg} tier={tier} weakest={weakest}
            breakdown={liveT1Breakdown} expanded={expanded === 'p1'}
            onToggle={() => toggle('p1')} onNavigate={onNavigate}
          />

          <P2PortfolioPanel
            t4data={liveT4} segments={t4Segments} expanded={expanded === 'p2'}
            onToggle={() => toggle('p2')} onNavigate={onNavigate}
          />

          <P3AdoptionPanel
            t2data={liveT2} shadowAIPct={shadowAIPct} expanded={expanded === 'p3'}
            onToggle={() => toggle('p3')} onNavigate={onNavigate}
          />

          <P4EcosystemPanel
            t3data={liveT3} expanded={expanded === 'p4'}
            onToggle={() => toggle('p4')} onNavigate={onNavigate}
          />

          <P5RiskPanel
            p5data={liveP5} riskSegments={riskSegments} shadowAIPct={shadowAIPct}
            expanded={expanded === 'p5'} onToggle={() => toggle('p5')} onNavigate={onNavigate}
          />

          <P6GovernancePanel
            p6data={liveP6} risksHigh={liveP5.risks.high} expanded={expanded === 'p6'}
            onToggle={() => toggle('p6')} onNavigate={onNavigate}
          />

        </div>

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
