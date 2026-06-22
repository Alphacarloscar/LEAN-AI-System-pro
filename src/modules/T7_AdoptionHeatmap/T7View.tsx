// ============================================================
// T7 — Adoption Heatmap (Curva de Rogers) — v2
//
// Cambios v2:
// 1. Curva llega al tope del gráfico (AMPLITUDE aumentado)
// 2. Dots en Mayoría Temp. y Tardía van DEBAJO de la curva
// 3. Cinco segmentos de igual anchura (160px c/u)
// 4. Dots más pequeños (r=11) con iniciales conservadas
// 5. Filtro en modo spotlight (click muestra solo ese dpto.)
// 6. Efecto 3D con gradiente radial en los dots
// 7. Tarjeta dinámica de Momentum / Riesgos / Oportunidades
// ============================================================

import { useState, useMemo, useEffect }  from 'react'
import { useNavigate }                   from 'react-router-dom'
import { useT2Store }                    from '@/modules/T2_StakeholderMatrix/store'
import { useT4Store }                    from '@/modules/T4_UseCasePriorityBoard'
import { useT1Store }                    from '@/modules/T1_MaturityRadar/store'
import { PhaseMiniMap }                 from '@/shared/components/PhaseMiniMap'
import { useDarkMode }                  from '@/shared/hooks/useDarkMode'
import { useCompanyProfileStore }       from '@/modules/CompanyProfile/store'
import { useEngagementStore }           from '@/modules/Engagement/store'
import { RecommendationPanel }          from '@/components/RecommendationPanel'
import { buildT7RecommendationContext, buildT7PlanContext } from './t7ContextBuilder'
import { useT7Store }                   from './store'
import { useChangePlanGeneration }      from '@/hooks/useChangePlanGeneration'
import { PersistenceBanner }           from '@/shared/components/PersistenceBanner'
import { computeOverallScore }          from '@/modules/T1_MaturityRadar/types'
import { ToolErrorState }              from '@/shared/components/ToolErrorState'
import { getSegment }                  from './T7Constants'
import { Tabs, Card, ToolHeader, EmptyState, Button } from '@shared/design-system/components'
import { BellCurveTab }                from './components/T7BellCurveTab'
import { DeptRecommendationsTab }      from './components/T7DeptRecommendationsTab'
import { ChangeManagementPlanTab }     from './components/T7ChangeManagementPlanTab'

// ── T7View — Componente principal ─────────────────────────────

interface T7ViewProps {
  onBack: () => void
}

export function T7View({ onBack }: T7ViewProps) {
  const navigate                    = useNavigate()
  const stakeholders                = useT2Store(s => s.stakeholders)
  const loadT2                      = useT2Store(s => s.load)
  const isLoadingT2                 = useT2Store(s => s.isLoading)
  const t2Error                     = useT2Store(s => s.lastError)
  const companyName                 = useCompanyProfileStore(s => s.profile.engagementName)
  const { dark }                    = useDarkMode()
  const { profile: companyProfile } = useCompanyProfileStore()
  const engagementId                = useEngagementStore((s) => s.activeEngagementId)
  const [activeTab, setActiveTab]  = useState<'curve' | 'dept' | 'plan'>('curve')

  // Cargar T2 al montar T7 (por si el usuario llega directamente sin pasar por T2).
  // Intencional: solo re-ejecutar cuando cambia el engagement, no cuando llegan los datos.
  // stable Zustand action (loadT2); stakeholders.length omitida intencionalmente para evitar
  // re-fetch en cada actualización de la lista — el guard `=== 0` cubre la lógica necesaria
  useEffect(() => {
    if (engagementId && stakeholders.length === 0) loadT2(engagementId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  // T4 use cases para contexto del plan de cambio
  const useCases = useT4Store(s => s.useCases)

  // T1 — promedio de madurez agregado de todos los entrevistados
  const dimensionStates = useT1Store(s => s.dimensionStates)
  const t1Avg = useMemo(() => {
    const allStates = Object.values(dimensionStates)
    if (allStates.length === 0) return 2  // fallback neutro
    const template = allStates[0]
    const aggregated = template.map((dim) => ({
      ...dim,
      subdimensions: dim.subdimensions.map((sub) => {
        const scores = allStates
          .map((state) =>
            state.find((d) => d.code === dim.code)
              ?.subdimensions.find((s) => s.code === sub.code)?.score ?? null
          )
          .filter((s): s is number => s !== null)
        const avg = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null
        return { ...sub, score: avg }
      }),
    }))
    return computeOverallScore(aggregated)
  }, [dimensionStates])

  // T7 store — plan generado por LLM (scoped al engagement)
  const { generatedPlan, clearGeneratedPlan, syncEngagement: syncT7, persistenceStatus, persistenceError, retrySave } = useT7Store()
  // stable Zustand action — mount-only: sincronizar al cambiar engagement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { syncT7(engagementId) }, [engagementId])

  // Hook de generación del plan de cambio
  const { generate, isGenerating, status: planStatus, error } = useChangePlanGeneration()

  // Contexto para el plan de cambio IA
  const planContext = useMemo(
    () => companyProfile
      ? buildT7PlanContext(stakeholders, t1Avg, useCases, companyProfile)
      : null,
    [stakeholders, t1Avg, useCases, companyProfile],
  )

  const segCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const sh of stakeholders) {
      const seg = getSegment(sh.archetype, sh.resistance)
      counts[seg] = (counts[seg] ?? 0) + 1
    }
    return counts
  }, [stakeholders])

  const laggardCount = (segCounts['laggards'] ?? 0) + (segCounts['late_majority'] ?? 0)

  const t7LLMContext = useMemo(
    () => companyProfile ? buildT7RecommendationContext(stakeholders, companyProfile) : null,
    [stakeholders, companyProfile],
  )

  if (t2Error) {
    return (
      <ToolErrorState
        message="No se pudieron cargar los stakeholders. Comprueba tu conexión e inténtalo de nuevo."
        onRetry={() => engagementId && loadT2(engagementId)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Header ── */}
      <ToolHeader
        onBack={onBack}
        backLabel="Volver al dashboard"
        toolCode="T7"
        title="Adoption Heatmap"
        subtitle={<p className="text-xs text-text-muted">{companyName} · Curva de difusión Rogers</p>}
        phaseMiniMap={<PhaseMiniMap phaseId="activate" toolCode="T7" />}
        maxWidth="max-w-7xl"
        chips={
          <div className="flex items-center gap-3 flex-wrap">
            <Card variant="flat" padding="none" className="text-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-warm-700 border border-border dark:border-white/6">
              <p className="text-lg font-bold text-lean-black dark:text-warm-50 tabular-nums">{stakeholders.length}</p>
              <p className="text-[10px] text-text-subtle uppercase tracking-wide">Stakeholders</p>
            </Card>
            <Card variant="flat" padding="none" className="text-center px-3 py-2 rounded-lg bg-success-light border border-success-light">
              <p className="text-lg font-bold text-success-dark tabular-nums">
                {(segCounts['early_adopters'] ?? 0) + (segCounts['early_majority'] ?? 0)}
              </p>
              <p className="text-[10px] text-success-dark uppercase tracking-wide">Adoptantes</p>
            </Card>
            <Card variant="flat" padding="none" className="text-center px-3 py-2 rounded-lg bg-danger-light border border-danger-light">
              <p className="text-lg font-bold text-danger-dark tabular-nums">{laggardCount}</p>
              <p className="text-[10px] text-danger-dark uppercase tracking-wide">Resistentes</p>
            </Card>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto space-y-6 px-8 py-8">

      {/* Banner no bloqueante — stakeholders pendientes */}
      {(isLoadingT2 || (!isLoadingT2 && stakeholders.length === 0)) && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600/40 px-4 py-3">
          <svg className="mt-0.5 shrink-0 text-amber-500" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M8 6v3.5M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              {isLoadingT2 ? 'Cargando stakeholders…' : 'Stakeholders no cargados.'}
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5">
              {isLoadingT2
                ? 'La vista se actualizará automáticamente cuando terminen de cargar.'
                : 'Puedes ir a T2 para añadir stakeholders, reintentar la carga o continuar con datos vacíos.'}
            </p>
          </div>
          {!isLoadingT2 && engagementId && (
            <button
              onClick={() => loadT2(engagementId)}
              className="shrink-0 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:underline"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs
        aria-label="Adopción heatmap"
        value={activeTab}
        onChange={(v) => setActiveTab(v as typeof activeTab)}
        tabs={[
          { value: 'curve', label: 'Curva de adopción', badge: String(stakeholders.length) },
          { value: 'dept',  label: 'Por departamento',  badge: String(new Set(stakeholders.map(s => s.department)).size) },
          { value: 'plan',  label: 'Plan de cambio',    badge: '6M' },
        ]}
      />

      {/* Tab content */}
      {stakeholders.length === 0 ? (
        <EmptyState
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="7" r="3"/>
              <path d="M2 18v-1a5 5 0 0110 0v1"/>
              <circle cx="15" cy="7" r="2"/>
              <path d="M18 18v-1a3 3 0 00-4-2.8"/>
            </svg>
          }
          title="Sin stakeholders registrados"
          description="Completa T2 — AI Stakeholder Matrix para mapear al equipo antes de analizar la adopción."
          action={<Button variant="ghost" size="sm" onClick={() => navigate('/t2')}>Ir a T2</Button>}
          className="py-12"
        />
      ) : (
        <>
          {activeTab === 'curve' && <BellCurveTab stakeholders={stakeholders} dark={dark} />}
          {activeTab === 'dept'  && <DeptRecommendationsTab stakeholders={stakeholders} dark={dark} />}
          {activeTab === 'plan'  && (
            <>
              <ChangeManagementPlanTab
                generatedPlan={generatedPlan}
                isGenerating={isGenerating}
                planStatus={planStatus}
                error={error}
                canGenerate={!!planContext && !!engagementId}
                onGenerate={() => planContext && generate(planContext, engagementId)}
                onClear={clearGeneratedPlan}
              />
              {(persistenceStatus === 'error' || persistenceStatus === 'saving') && (
                <PersistenceBanner
                  error={persistenceError}
                  isRetrying={persistenceStatus === 'saving'}
                  onRetry={() => engagementId && retrySave(engagementId)}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ── RECOMENDACIONES IA ──────────────────────────────── */}
      {t7LLMContext && stakeholders.length > 0 && (
        <RecommendationPanel
          tool="t7"
          title="Recomendaciones IA — Mapa de Adopción"
          subtitle="Generadas por Claude · Específicas para esta curva de Rogers"
          context={t7LLMContext}
          engagementId={engagementId}
        />
      )}
      </div>
    </div>
  )
}
