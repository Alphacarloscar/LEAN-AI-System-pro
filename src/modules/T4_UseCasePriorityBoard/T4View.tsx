// ============================================================
// T4 — Use Case Priority Board
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import { useNavigate }            from 'react-router-dom'
import { useT4Store }             from './store'
import { useT1Store }             from '@/modules/T1_MaturityRadar/store'
import { useT2Store }             from '@/modules/T2_StakeholderMatrix/store'
import { useCompanyProfileStore } from '@/modules/CompanyProfile/store'
import { useEngagementStore }     from '@/modules/Engagement/store'
import { useAuthStore }           from '@/modules/Auth'
import { Button, Spinner, ToolHeader }        from '@shared/design-system/components'
import { RecommendationPanel }    from '@/components/RecommendationPanel'
import { buildT4RecommendationContext } from './t4ContextBuilder'
import { ImportFromT3Modal }      from './components/ImportFromT3Modal'
import { PhaseMiniMap }           from '@/shared/components/PhaseMiniMap'
import { isDemoEnabled }          from '@/lib/config'
import { ExecDashboard }          from './components/ExecDashboard'
import { QuarterlyRoadmap }       from './components/QuarterlyRoadmap'
import { UseCaseDetailPanel }     from './components/UseCaseDetailPanel'

interface T4ViewProps {
  onBack?: () => void
}

export function T4View({ onBack }: T4ViewProps) {
  const navigate                                         = useNavigate()
  const { useCases, isLoading, isLoaded, ensureLoaded } = useT4Store()
  const { profile: companyProfile }                      = useCompanyProfileStore()
  const companyName                                      = companyProfile.engagementName
  const engagementId                                     = useEngagementStore((s) => s.activeEngagementId)
  const user                                             = useAuthStore((s) => s.user)
  const isAuth                                           = !!user

  const dimensionStates = useT1Store((s) => s.dimensionStates)
  const stakeholders    = useT2Store((s) => s.stakeholders)

  useEffect(() => {
    if (engagementId) {
      ensureLoaded(engagementId, { reason: 'route_mount' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  const [activeId, setActiveId]     = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  const activeUseCase = useMemo(
    () => useCases.find((uc) => uc.id === activeId) ?? null,
    [useCases, activeId],
  )

  const autoT1Context = useMemo(() => {
    const allStates = Object.values(dimensionStates)
    if (allStates.length === 0) return null
    const template       = allStates[0]
    const weakDimensions: string[] = []
    for (const dim of template) {
      const avgScore =
        dim.subdimensions.reduce((sum, sub) => {
          const scores = allStates
            .map(
              (state) =>
                state.find((d) => d.code === dim.code)?.subdimensions.find((s) => s.code === sub.code)?.score ?? null,
            )
            .filter((s): s is number => s !== null)
          return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0)
        }, 0) / Math.max(dim.subdimensions.length, 1)
      if (avgScore <= 2) weakDimensions.push(dim.code)
    }
    return { weakDimensions, total: template.length }
  }, [dimensionStates])

  const autoT2Context = useMemo(() => {
    if (stakeholders.length === 0) return null
    const champions = stakeholders.filter(
      (s) => (s.archetype === 'ambassador' || s.archetype === 'adoptador') && s.resistance !== 'alta',
    )
    const blockers = stakeholders.filter(
      (s) => (s.archetype === 'critico' || s.archetype === 'reticente') && s.resistance === 'alta',
    )
    return { champions, blockers }
  }, [stakeholders])

  const t4LLMContext = useMemo(
    () => (companyProfile ? buildT4RecommendationContext(useCases, companyProfile) : null),
    [useCases, companyProfile],
  )

  function handleSelectUseCase(id: string) {
    setActiveId((prev) => (prev === id ? null : id))
  }

  // Guard 1: primera carga sin datos previos → spinner bloqueante
  if (isLoading && !isLoaded) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" label="Cargando casos de uso…" className="text-navy dark:text-warm-200" />
          <p className="text-xs text-text-subtle dark:text-gray-500 font-mono">Cargando casos de uso...</p>
        </div>
      </div>
    )
  }

  // Guard 2: autenticado pero sin proyecto seleccionado
  if (isAuth && !engagementId && !isDemoEnabled) {
    return (
      <div className="min-h-screen bg-surface dark:bg-warm-900 flex items-center justify-center">
        <div className="max-w-sm text-center space-y-3 px-6">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-navy/8 dark:bg-navy/20 border border-navy/15 dark:border-navy/30 flex items-center justify-center">
            <svg
              width="20" height="20" viewBox="0 0 14 14" fill="none"
              stroke="#2A2822" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
              className="dark:stroke-warm-200"
            >
              <rect x="2" y="3" width="10" height="10" rx="1" />
              <path d="M5 13V9h4v4M2 6h10" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-lean-black dark:text-warm-50">Selecciona un proyecto</h2>
          <p className="text-xs text-text-muted dark:text-gray-500 leading-relaxed">
            Los casos de uso están vinculados al proyecto activo.
            Usa el selector <span className="font-semibold text-lean-black dark:text-gray-300">▾ Proyecto</span> en la barra superior para seleccionar uno existente o crear uno nuevo.
          </p>
          <Button variant="link" className="mt-2" onClick={() => navigate('/')}>
            Volver al dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-surface dark:bg-warm-950 min-h-screen">

      {/* HEADER */}
      <ToolHeader
        sticky
        onBack={() => onBack ? onBack() : navigate('/')}
        backLabel="Volver al dashboard"
        toolCode="T4"
        title="Use Case Priority Board"
        subtitle={
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">{companyName}</span>
            {isLoading && isLoaded && (
              <span className="flex items-center gap-1 text-[10px] text-text-subtle">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                Actualizando…
              </span>
            )}
          </div>
        }
        phaseMiniMap={<PhaseMiniMap phaseId="evaluate" toolCode="T4" />}
        cta={
          <Button variant="primary" size="sm" onClick={() => setShowImport(true)}>
            ↓ Importar desde T3
          </Button>
        }
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-8">
        {/* ZONA 1: HERO */}
        <div className="py-8 flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
              {companyName} · Portfolio de IA
            </p>
            <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50">Dashboard ejecutivo</h2>
          </div>
          <ExecDashboard useCases={useCases} />
          <QuarterlyRoadmap
            useCases={useCases}
            activeId={activeId}
            onSelect={handleSelectUseCase}
          />
        </div>

        {useCases.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-warm-100 dark:bg-warm-700 flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-text-subtle"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="1" /></svg></div>
            <p className="text-sm font-bold text-text-muted">Sin casos de uso</p>
            <p className="text-xs text-text-subtle max-w-xs leading-relaxed">
              Importa procesos desde T3 o añade un caso de uso manualmente.
            </p>
          </div>
        )}
      </div>

      {/* ZONA 3: DETALLE */}
      {activeUseCase && (
        <div className="max-w-7xl mx-auto w-full px-8 pb-16">
          <UseCaseDetailPanel
            useCase={activeUseCase}
            allUseCases={useCases}
            onSelect={handleSelectUseCase}
            autoT1Context={autoT1Context}
            autoT2Context={autoT2Context}
          />
        </div>
      )}

      {/* RECOMENDACIONES IA */}
      {t4LLMContext && useCases.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-8 pb-8">
          <RecommendationPanel
            tool="t4"
            title="Recomendaciones IA — Portfolio de Casos de Uso"
            subtitle="Generadas por Claude · Específicas para este portfolio"
            context={t4LLMContext}
            engagementId={engagementId}
          />
        </div>
      )}

      {showImport && <ImportFromT3Modal onClose={() => setShowImport(false)} />}
    </div>
  )
}
