// ============================================================
// T1 — Vista completa (AI Readiness Assessment)
//
// Layout: header sticky (breadcrumb + progreso + score)
//         + selector de entrevistado
//         + two-column (dimensiones | radar sticky)
//         + executive output (QW1) al final
//
// Novedad Sprint 2:
//   — 6 dimensiones × 4 subdimensiones (escala 0-4)
//   — Selector de entrevistados (IT vs. Negocio)
//   — Estado por entrevistado (scores independientes)
//   — Gap IT/Negocio en T1ExecutiveOutput
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import { Button, ToolHeader } from '@/shared/design-system/components'
import { RetryBanner }                          from '@/shared/components/RetryBanner'
import { DIMENSION_DEFINITIONS, TOTAL_SUBDIMENSIONS } from './constants'
import type { T1DimensionState } from './types'
import { countScoredSubdimensions, computeOverallScore } from './types'
import { DimensionCard }                        from './components/DimensionCard'
import { T1RadarPanel }                         from './components/T1RadarPanel'
import { T1ExecutiveOutput }                    from './components/T1ExecutiveOutput'
import { NewInterviewModal }                    from './components/NewInterviewModal'
import { IntervieweeSelector }                  from './components/IntervieweeSelector'
import { PhaseMiniMap }                         from '@/shared/components/PhaseMiniMap'
import type { IntervieweeAggregate }            from './components/T1ExecutiveOutput'
import type { NewIntervieweeForm }              from './components/NewInterviewModal'
import { useT1Store }                           from './store'
import { useEngagementStore }                   from '@/modules/Engagement/store'
import { useCompanyProfileStore }              from '@/modules/CompanyProfile/store'
import { useDepartmentStore }                  from '@/modules/CompanyProfile/useDepartmentStore'
import { RecommendationPanel }                 from '@/components/RecommendationPanel'
import { buildT1RecommendationContext }        from './t1ContextBuilder'
import { usePermissions }                      from '@/modules/Auth'
import { getProjectCompanyId }                 from '@/services/projects.service'

interface T1ViewProps {
  onBack: () => void
}

// ── Componente principal ──────────────────────────────────────

export function T1View({ onBack }: T1ViewProps) {

  const [showNewModal, setShowNewModal] = useState(false)

  const { isReadOnly } = usePermissions()

  // ── Store T1 + engagement ────────────────────────────────────
  const store          = useT1Store()
  const engagementId   = useEngagementStore((s) => s.activeEngagementId)
  const profile        = useCompanyProfileStore((s) => s.profile)

  // ── Departamentos centralizados (para el modal de alta) ──────
  const { departments, fetchDepartments, reset: resetDepartments } = useDepartmentStore()

  useEffect(() => {
    if (!engagementId) return
    let cancelled = false

    getProjectCompanyId(engagementId).then((companyId) => {
      if (cancelled || !companyId) return
      fetchDepartments(companyId)
    })

    return () => {
      cancelled = true
      resetDepartments()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  const liveInterviewees  = store.interviewees
  const intervieweeStates = store.dimensionStates
  const activeId          = store.activeId
  const isLoadingT1       = store.isLoading
  const hasDataT1         = store.hasData
  const loadErrorT1       = store.loadError

  // Garantizar datos al montar la ruta (idempotente vía ensureLoaded).
  useEffect(() => {
    if (engagementId) {
      store.ensureLoaded(engagementId, { reason: 'route_mount' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  // Añadir nuevo entrevistado en vivo
  async function addInterviewee(form: NewIntervieweeForm) {
    try {
      await store.addInterviewee(
        {
          name:       form.name.trim(),
          role:       form.role.trim(),
          archetype:  form.type === 'it' ? 'Ejecutivo TI' : 'Líder de Negocio',
          type:       form.type,
          department: form.department,
        },
        engagementId,
      )
    } finally {
      setShowNewModal(false)
    }
  }

  // Eliminar entrevistado (solo si hay más de uno)
  async function deleteInterviewee(id: string) {
    if (liveInterviewees.length <= 1) return
    await store.removeInterviewee(id, engagementId)
  }

  // Dimensiones activas del entrevistado seleccionado
  // useMemo: evita que `?? []` cree un nuevo array en cada render cuando la key no existe
  const activeDimensions = useMemo(
    () => intervieweeStates[activeId] ?? [],
    [intervieweeStates, activeId],
  )

  // Actualizar una dimensión del entrevistado activo.
  function updateDimension(updated: T1DimensionState) {
    const oldDim = (intervieweeStates[activeId] ?? []).find((d) => d.code === updated.code)
    if (!oldDim) return

    for (const updatedSub of updated.subdimensions) {
      const oldSub = oldDim.subdimensions.find((s) => s.code === updatedSub.code)
      if (!oldSub) continue

      if (updatedSub.score !== oldSub.score) {
        store.setScore(activeId, updated.code, updatedSub.code, updatedSub.score, engagementId)
      }
      if (updatedSub.evidence !== oldSub.evidence) {
        store.setEvidence(activeId, updated.code, updatedSub.code, updatedSub.evidence, engagementId)
      }
      if (updatedSub.showCriteria !== oldSub.showCriteria) {
        store.toggleCriteria(activeId, updated.code, updatedSub.code)
      }
      if (updatedSub.showEvidence !== oldSub.showEvidence) {
        store.toggleEvidence(activeId, updated.code, updatedSub.code)
      }
    }
  }

  // Métricas de progreso del entrevistado activo
  const scoredCount  = useMemo(
    () => countScoredSubdimensions(activeDimensions),
    [activeDimensions]
  )
  const overallScore = useMemo(
    () => computeOverallScore(activeDimensions),
    [activeDimensions]
  )

  // Datos para el gap IT/Negocio en T1ExecutiveOutput
  const allIntervieweeAggregates: IntervieweeAggregate[] = liveInterviewees.map((i) => ({
    id:         i.id,
    name:       i.name,
    role:       i.role,
    type:       i.type,
    dimensions: intervieweeStates[i.id] ?? [],
  }))

  // CompanyProfile — contexto de empresa para el motor LLM
  const companyProfile = useCompanyProfileStore((s) => s.profile)

  // Dimensiones agregadas: promedio de todos los entrevistados → para el QW1 Executive Output
  const aggregateDimensions = useMemo((): T1DimensionState[] => {
    const allStates = Object.values(intervieweeStates)
    if (allStates.length === 0) return []
    const template = allStates[0]
    return template.map((dim) => ({
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
  }, [intervieweeStates])

  // Contexto para el motor LLM
  const t1LLMContext = useMemo(
    () => buildT1RecommendationContext(aggregateDimensions, allIntervieweeAggregates, companyProfile),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aggregateDimensions, companyProfile]
  )

  return (
    <div className="min-h-screen bg-surface dark-page-bg">

      {/* ── Header de herramienta ── */}
      <ToolHeader
        sticky
        onBack={onBack}
        backLabel="Volver al dashboard"
        toolCode="T1"
        title="AI Readiness Assessment"
        phaseMiniMap={<PhaseMiniMap phaseId="listen" toolCode="T1" />}
        maxWidth="max-w-6xl"
        chips={
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-muted tabular-nums">
              <span className="font-semibold text-lean-black dark:text-gray-200">{scoredCount}</span>
              /{TOTAL_SUBDIMENSIONS} subdimensiones puntuadas
            </span>
            <div className="text-right">
              <span className="text-xl font-bold tabular-nums text-lean-black dark:text-gray-100">
                {overallScore.toFixed(1)}
              </span>
              <span className="text-sm font-light text-text-muted"> / 4</span>
            </div>
          </div>
        }
        cta={!isReadOnly ? (
          <Button
            size="sm"
            onClick={() => setShowNewModal(true)}
            icon={
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M8 2v12M2 8h12" />
              </svg>
            }
          >
            Nueva entrevista
          </Button>
        ) : undefined}
      />

      {/* ── Empresa + contexto ── */}
      <div className="max-w-6xl mx-auto px-8 pt-6 pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          {profile.engagementName && (
            <p className="text-sm font-semibold text-lean-black dark:text-gray-100">
              {profile.engagementName}
            </p>
          )}
          {profile.sector && (
            <>
              <span className="text-text-subtle">·</span>
              <p className="text-xs text-text-muted">{profile.sector}</p>
            </>
          )}
          {profile.tamanoEmpresa && (
            <>
              <span className="text-text-subtle">·</span>
              <p className="text-xs text-text-muted">{profile.tamanoEmpresa}</p>
            </>
          )}
        </div>
        <p className="text-xs text-text-muted mt-1 max-w-xl">
          Selecciona el entrevistado y ajusta los scores en tiempo real. El informe ejecutivo se genera automáticamente.
        </p>
      </div>

      {/* ── Primer carga: sin datos → spinner bloqueante ── */}
      {isLoadingT1 && !hasDataT1 && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-navy/40 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-xs text-text-muted">Cargando datos de la evaluación…</p>
          </div>
        </div>
      )}

      {/* ── Error sin datos previos ── */}
      {!hasDataT1 && !isLoadingT1 && loadErrorT1 && (
        <RetryBanner
          message={loadErrorT1}
          onRetry={() => { if (engagementId) store.load(engagementId) }}
        />
      )}

      {/* ── Contenido principal ── */}
      <div className={!hasDataT1 ? 'hidden' : ''}>

        {/* ── Indicador de actualización en background ── */}
        {isLoadingT1 && (
          <div className="max-w-6xl mx-auto px-8 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Actualizando datos…
            </div>
          </div>
        )}

        {/* ── Error durante refetch ── */}
        {hasDataT1 && !isLoadingT1 && loadErrorT1 && (
          <RetryBanner
            message={loadErrorT1}
            onRetry={() => { if (engagementId) store.load(engagementId) }}
          />
        )}

        {/* ── Selector de entrevistados ── */}
        <IntervieweeSelector
          interviewees={liveInterviewees}
          activeId={activeId}
          dimensionStates={intervieweeStates}
          isReadOnly={isReadOnly}
          onSelect={(id) => store.setActiveId(id)}
          onDelete={deleteInterviewee}
        />

        {/* ── Layout two-column ── */}
        <div className="max-w-6xl mx-auto px-8 pb-6">
          <div className="flex gap-6 items-start">

            {/* Columna izquierda — 6 DimensionCards */}
            <div className="flex-1 min-w-0 space-y-3">
              {activeDimensions.map((dim) => {
                const def = DIMENSION_DEFINITIONS.find((d) => d.code === dim.code)
                if (!def) return null
                return (
                  <DimensionCard
                    key={dim.code}
                    state={dim}
                    definition={def}
                    onChange={updateDimension}
                  />
                )
              })}
            </div>

            {/* Columna derecha — RadarPanel sticky */}
            <div className="w-72 xl:w-80 shrink-0 sticky top-20">
              <T1RadarPanel dimensions={activeDimensions} />
            </div>

          </div>

          {/* ── Executive Output (QW1) ── */}
          <div className="mt-8">
            <T1ExecutiveOutput
              dimensions={aggregateDimensions}
              companyName={profile.engagementName}
              allInterviewees={allIntervieweeAggregates}
            />
          </div>

          {/* ── Motor LLM — Recomendaciones dinámicas ── */}
          <div className="mt-6 max-w-6xl">
            <RecommendationPanel
              tool="t1"
              context={t1LLMContext}
              engagementId={engagementId}
              title="Recomendaciones IA — Madurez"
              subtitle="Generadas por Claude · Específicas para este engagement"
            />
          </div>
        </div>

      </div> {/* fin contenido principal */}

      {/* ── Modal nueva entrevista ── */}
      {showNewModal && (
        <NewInterviewModal
          onClose={() => setShowNewModal(false)}
          onSubmit={addInterviewee}
          departments={departments}
        />
      )}
    </div>
  )
}
