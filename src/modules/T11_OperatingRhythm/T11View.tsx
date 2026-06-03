// ============================================================
// T11 — AI Operating Rhythm
//
// Centro de operaciones: cadencia SAFe-adaptada, objetivos por
// fase, matriz de decisiones, datos a medir.
//
// Tabs:
//   Vista Interactiva — Big Picture clickable (default)
//   Cadencia Detallada — lista expandible de eventos
//   Objetivos por Fase — 5 fases LEAN
//   Decisiones y Escalada — matriz de decisión
//   Datos a Medir — KPIs por nivel
// ============================================================

import { useState, useMemo }              from 'react'
import { PhaseMiniMap }                   from '@/shared/components/PhaseMiniMap'
import { buildOperatingModel }            from './engine'
import { useCompanyProfileStore }         from '@/modules/CompanyProfile/store'
import { useEngagementStore }             from '@/modules/Engagement/store'
import { useT1Store }                     from '@/modules/T1_MaturityRadar/store'
import { DIMENSION_DEFINITIONS }          from '@/modules/T1_MaturityRadar/constants'
import type { RadarDimension }            from '@/shared/components/charts/LeanRadarChart'
import { RecommendationPanel }            from '@/components/RecommendationPanel'
import { buildT11RecommendationContext }  from './t11ContextBuilder'
import { T11_MATURITY_CONFIG, T11_LEVEL_CONFIG } from './constants'
import type { T11Event }                  from './types'

import { TabButton }          from './components/TabButton'
import { AdaptiveModeBadge }  from './components/AdaptiveModeBadge'
import { MaturityPill }       from './components/MaturityPill'
import { EventDetailPanel }   from './components/EventDetailPanel'
import { BigPictureTab }      from './components/BigPictureTab'
import { CadenciaTab }        from './components/CadenciaTab'
import { ObjetivosTab }       from './components/ObjetivosTab'
import { DecisionesTab }      from './components/DecisionesTab'
import { KpisTab }            from './components/KpisTab'
import { generateOperatingModelHTML } from './components/generateOperatingModelHTML'

// ── Props ─────────────────────────────────────────────────────

interface T11ViewProps {
  onBack: () => void
}

// ── Tabs ──────────────────────────────────────────────────────

type T11Tab = 'bigpicture' | 'cadencia' | 'objetivos' | 'decisiones' | 'kpis'

// ── Vista principal ───────────────────────────────────────────

export function T11View({ onBack }: T11ViewProps) {
  const [activeTab, setActiveTab]         = useState<T11Tab>('bigpicture')
  const [selectedEvent, setSelectedEvent] = useState<T11Event | null>(null)
  const { profile: companyProfile }       = useCompanyProfileStore()
  const companyName                       = companyProfile.engagementName
  const engagementId                      = useEngagementStore((s) => s.activeEngagementId)

  // Compute RadarDimension[] from T1Store — agrega todos los entrevistados
  const dimensionStates = useT1Store((s) => s.dimensionStates)
  const t1Radar = useMemo((): RadarDimension[] => {
    const allStates = Object.values(dimensionStates)
    if (allStates.length === 0) {
      return DIMENSION_DEFINITIONS.map((def) => ({ dimension: def.label, current: 2 }))
    }
    return DIMENSION_DEFINITIONS.map((def) => {
      const scores: number[] = []
      for (const state of allStates) {
        const dim = state.find((d) => d.code === def.code)
        if (!dim) continue
        for (const sub of dim.subdimensions) {
          if (sub.score !== null) scores.push(sub.score)
        }
      }
      const avg = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 2
      return { dimension: def.label, current: Math.round(avg * 100) / 100 }
    })
  }, [dimensionStates])

  const model = useMemo(
    () => buildOperatingModel({ radar: t1Radar, employees: 500 }),
    [t1Radar],
  )

  const t11LLMContext = useMemo(
    () => companyProfile ? buildT11RecommendationContext(model, companyProfile) : null,
    [model, companyProfile],
  )

  const { maturityTier, maturityAvg, adaptiveMode, recommendedEvents, decisions, phaseObjectives, kpiGroups } = model
  const matCfg        = T11_MATURITY_CONFIG[maturityTier]
  const criticalCount = recommendedEvents.filter((e) => e.isCritical).length
  const totalKpis     = kpiGroups.reduce((acc, g) => acc + g.kpis.length, 0)

  function handleExport() {
    const html = generateOperatingModelHTML(companyName, model)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `OperatingRhythm_${companyName.replace(/\s+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Header ── */}
      <div className="sticky top-[57px] z-10 bg-[rgba(247,244,238,0.95)] dark:bg-warm-900/95 backdrop-blur-sm border-b border-border dark:border-white/6">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-text-subtle dark:text-warm-300 hover:text-text-muted dark:hover:text-warm-100 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 2L4 6l4 4" />
            </svg>
            Volver al dashboard
          </button>

          <div className="h-4 w-px bg-border dark:bg-warm-600" />

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              T11
            </span>
            <span className="text-xs font-semibold text-lean-black dark:text-warm-50">
              AI Operating Rhythm
            </span>
          </div>

          <div className="flex-1 flex justify-center">
            <PhaseMiniMap phaseId="normalize" toolCode="T11" />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-navy text-white hover:opacity-90 transition-opacity"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 1v7M3 5l3 3 3-3M1 9v1.5A1.5 1.5 0 002.5 12h7A1.5 1.5 0 0011 10.5V9" />
            </svg>
            Exportar modelo operativo
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Hero */}
        <div className="rounded-2xl bg-white dark:bg-warm-700 border border-border dark:border-warm-500 px-6 py-5">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle dark:text-warm-300 mb-1">
                {companyName} · Modelo Operativo IA
              </p>
              <h1 className="text-xl font-bold text-lean-black dark:text-warm-50">AI Operating Rhythm</h1>
              <p className="text-sm text-text-muted dark:text-warm-300 mt-1">
                Centro de operaciones basado en SAFe Agile + ISO 42001
              </p>
            </div>
            <div className="space-y-2">
              <MaturityPill tier={maturityTier} avg={maturityAvg} />
              <p className="text-[11px] text-text-subtle dark:text-warm-300 max-w-xs">{matCfg.description}</p>
              <AdaptiveModeBadge mode={adaptiveMode} />
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: recommendedEvents.length, label: 'Eventos de gobierno',  sub: 'en la cadencia recomendada', color: '#C8860A' },
            { value: criticalCount,            label: 'Eventos críticos',      sub: 'de implementación inmediata', color: '#C06060' },
            { value: decisions.length,         label: 'Nodos de decisión',     sub: 'mapeados con escalada', color: '#6A90C0' },
            { value: totalKpis,                label: 'KPIs definidos',        sub: 'en los 3 niveles de gobierno', color: '#5FAF8A' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl bg-white dark:bg-warm-700 border border-border dark:border-warm-500 px-5 py-4">
              <p className="text-2xl font-bold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs font-semibold text-lean-black dark:text-warm-50 mt-0.5">{kpi.label}</p>
              <p className="text-[10px] text-text-subtle dark:text-warm-300 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-border dark:border-warm-500 bg-white dark:bg-warm-700 px-6 py-5">
          <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle dark:text-warm-300 mb-3">
            ¿Cómo funciona este modelo?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Cadencia de Sprint (Equipo)',        body: 'Cada 2 semanas: planificación + review de use cases IA. El equipo sabe qué hacer, cuándo y con qué datos. Operación ágil sin burocracia.',  color: T11_LEVEL_CONFIG.team.hex },
              { title: 'Comités de Programa (Mensual)',      body: 'Supervisión mensual de riesgos, compliance y proveedores. El CIO/COO tiene visibilidad sin estar en el día a día. Decisiones de programa con datos.', color: T11_LEVEL_CONFIG.program.hex },
              { title: 'Dirección Estratégica (Trimestral)', body: 'PI Planning + Steering Committee: objetivos del trimestre, ROI, inversión. El C-suite gobierna la transformación IA sin microgestionar.', color: T11_LEVEL_CONFIG.direction.hex },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-xs font-semibold text-lean-black dark:text-warm-50 mb-1">{item.title}</p>
                  <p className="text-[11px] text-text-muted dark:text-warm-300 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-0.5">
            <TabButton active={activeTab === 'bigpicture'}  label="Vista Interactiva"     badge={String(recommendedEvents.length)} onClick={() => setActiveTab('bigpicture')} />
            <TabButton active={activeTab === 'cadencia'}    label="Cadencia Detallada"     badge={String(recommendedEvents.length)} onClick={() => setActiveTab('cadencia')} />
            <TabButton active={activeTab === 'objetivos'}   label="Objetivos por Fase"     badge={String(phaseObjectives.length)}   onClick={() => setActiveTab('objetivos')} />
            <TabButton active={activeTab === 'decisiones'}  label="Decisiones y Escalada"  badge={String(decisions.length)}         onClick={() => setActiveTab('decisiones')} />
            <TabButton active={activeTab === 'kpis'}        label="Datos a Medir"          badge={String(totalKpis)}                onClick={() => setActiveTab('kpis')} />
          </div>

          {activeTab === 'bigpicture'  && (
            <BigPictureTab
              recommendedEvents={recommendedEvents}
              maturityTier={maturityTier}
              adaptiveMode={adaptiveMode}
              onSelectEvent={setSelectedEvent}
            />
          )}
          {activeTab === 'cadencia'   && <CadenciaTab   events={recommendedEvents} />}
          {activeTab === 'objetivos'  && <ObjetivosTab  objectives={phaseObjectives} />}
          {activeTab === 'decisiones' && <DecisionesTab decisions={decisions} />}
          {activeTab === 'kpis'       && <KpisTab       kpiGroups={kpiGroups} />}
        </div>

        {/* SAFe note */}
        <div className="rounded-xl border border-border dark:border-warm-500 bg-surface dark:bg-warm-800 px-5 py-4">
          <p className="text-[10px] text-text-subtle dark:text-warm-300 leading-relaxed">
            <span className="font-semibold text-text-muted dark:text-warm-200">Metodología:</span> Este modelo operativo adapta el framework SAFe® (Scaled Agile Framework) al gobierno de sistemas IA, integrando los requisitos del estándar ISO 42001:2023 (AI Management System) y el EU AI Act (Reglamento 2024/1689). La cadencia recomendada se ajusta automáticamente al nivel de madurez IA de la organización medido en T1.
          </p>
        </div>
      </div>

      {/* ── Event detail panel ── */}
      <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* ── RECOMENDACIONES IA ──────────────────────────────── */}
      {t11LLMContext && (
        <div className="max-w-5xl mx-auto w-full px-8 pb-8">
          <RecommendationPanel
            tool="t11"
            title="Recomendaciones IA — Modelo Operativo"
            subtitle="Generadas por Claude · Específicas para este modelo de gobierno"
            context={t11LLMContext}
            engagementId={engagementId}
          />
        </div>
      )}
    </div>
  )
}
