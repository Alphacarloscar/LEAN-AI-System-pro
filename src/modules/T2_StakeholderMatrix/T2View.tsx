// ============================================================
// T2 — AI Stakeholder Matrix
//
// Layout: header sticky + two-column (matrix izq | panel der)
//
// Columna izquierda: stakeholders agrupados por departamento.
//   Cada departamento muestra chips de arquetipo y badges
//   de resistencia. Click en stakeholder → activa panel.
//
// Columna derecha (sticky): detalle del stakeholder activo.
//   Arquetipo + resistencia + scores + intervenciones.
//
// Sprint 2 MVP: datos en Zustand (persist local).
// Sprint 3+: leer/escribir desde Supabase.
// ============================================================

import { useState, useMemo, useEffect }  from 'react'
import { useNavigate, useParams }        from 'react-router-dom'
import { Button, ToolHeader }            from '@shared/design-system/components'
import { useT2Store }                    from './store'
import { useEngagementStore }            from '@/modules/Engagement/store'
import { useCompanyProfileStore }        from '@/modules/CompanyProfile/store'
import { useDepartmentStore }            from '@/modules/CompanyProfile/useDepartmentStore'
import { getProjectCompanyId }           from '@/services/projects.service'
import { InterviewModal }                from './components/InterviewModal'
import { ImportFromT1Modal }             from './components/ImportFromT1Modal'
import { StakeholderQuadrantChart }      from './components/StakeholderQuadrantChart'
import { StakeholderPanel }              from './components/StakeholderPanel'
import { DepartmentMatrix }              from './components/DepartmentMatrix'
import { DepartmentOverviewChart }       from './components/DepartmentOverviewChart'
import { RecommendationPanel }           from '@/components/RecommendationPanel'
import { buildT2RecommendationContext }  from './t2ContextBuilder'
import type { Stakeholder }              from './types'
import { PhaseMiniMap }                  from '@/shared/components/PhaseMiniMap'
import { isDemoEnabled }                 from '@/lib/config'
import { usePermissions }               from '@/modules/Auth'

// ── Vista principal ───────────────────────────────────────────

interface T2ViewProps {
  onBack: () => void
}

export function T2View({ onBack }: T2ViewProps) {
  const { stakeholders, addStakeholder, updateStakeholder, initDemo, ensureLoaded, lastError, isLoading: isLoadingT2, hasData: hasDataT2 } = useT2Store()
  const { engagementId: urlId } = useParams<{ engagementId: string }>()
  const storeId                 = useEngagementStore((s) => s.activeEngagementId)
  const engagementId            = urlId ?? storeId
  const companyProfile = useCompanyProfileStore((s) => s.profile)
  const loadProfile    = useCompanyProfileStore((s) => s.loadProfile)
  const companyName    = companyProfile.engagementName
  const navigate       = useNavigate()

  const { isReadOnly } = usePermissions()
  const { fetchDepartments, reset: resetDepartments } = useDepartmentStore()
  const [companyId, setCompanyId] = useState<string | undefined>(undefined)

  // Garantizar datos al montar la ruta (idempotente).
  useEffect(() => {
    if (engagementId) {
      ensureLoaded(engagementId, { reason: 'route_mount' })
      void loadProfile(engagementId)
    } else if (isDemoEnabled) {
      initDemo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  // Departamentos — gestión independiente de T2 store
  useEffect(() => {
    if (engagementId) {
      getProjectCompanyId(engagementId).then((cid) => {
        setCompanyId(cid ?? undefined)
        if (cid) fetchDepartments(cid)
      })
    } else {
      resetDepartments()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId])

  const [activeStakeholder, setActiveStakeholder] = useState<Stakeholder | null>(
    () => stakeholders[0] ?? null
  )
  const [showModal,             setShowModal]             = useState(false)
  const [showImportT1,          setShowImportT1]          = useState(false)
  const [interviewingExisting,  setInterviewingExisting]  = useState<Stakeholder | null>(null)

  const t2LLMContext = useMemo(
    () => buildT2RecommendationContext(stakeholders, companyProfile),
    [stakeholders, companyProfile]
  )

  function handleAddStakeholder(s: Omit<Stakeholder, 'id' | 'createdAt'>) {
    addStakeholder(s, engagementId)
    setShowModal(false)
    setTimeout(() => {
      const latest = useT2Store.getState().stakeholders.at(-1)
      if (latest) setActiveStakeholder(latest)
    }, 50)
  }

  return (
    <div className="min-h-full bg-surface dark:bg-warm-900">

      {/* ── Header ── */}
      <ToolHeader
        sticky
        onBack={() => { onBack(); navigate('/') }}
        backLabel="Volver al dashboard"
        toolCode="T2"
        title="AI Stakeholder Matrix"
        phaseMiniMap={<PhaseMiniMap phaseId="listen" toolCode="T2" />}
        maxWidth="max-w-7xl"
        cta={!isReadOnly ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowImportT1(true)}
              icon={
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 8h10M8 4l4 4-4 4" />
                  <path d="M14 3v10" strokeWidth="1.5" />
                </svg>
              }
            >
              Importar desde T1
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowModal(true)}
              icon={
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2v12M2 8h12" />
                </svg>
              }
            >
              Nueva entrevista
            </Button>
          </>
        ) : undefined}
      />

      {/* ── Subheader: empresa ── */}
      <div className="max-w-7xl mx-auto px-8 pt-5 pb-1">
        <p className="text-sm font-semibold text-lean-black dark:text-warm-50">{companyName}</p>
        <p className="text-xs text-text-subtle mt-0.5">
          Haz clic en un stakeholder para ver su perfil y las intervenciones recomendadas.
        </p>
        {lastError && (
          <p className="mt-2 text-[11px] text-danger font-mono bg-danger-light dark:bg-danger/20 px-3 py-1.5 rounded-lg">
            {lastError}
          </p>
        )}
      </div>

      {/* ── Primer carga: sin datos → spinner bloqueante ── */}
      {isLoadingT2 && !hasDataT2 && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-navy/40 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-xs text-text-muted">Cargando stakeholders…</p>
          </div>
        </div>
      )}

      {/* ── Contenido principal ── */}
      <div className={!hasDataT2 ? 'hidden' : ''}>

        {isLoadingT2 && (
          <div className="max-w-7xl mx-auto px-8 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-text-subtle">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Actualizando datos…
            </div>
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex gap-6 items-start">

            {/* Columna izquierda: gráfico + matrix */}
            <div className="flex-1 min-w-0 space-y-5">
              <StakeholderQuadrantChart
                stakeholders={stakeholders}
                activeId={activeStakeholder?.id ?? null}
                onSelect={setActiveStakeholder}
              />
              {stakeholders.length > 0 && (
                <DepartmentOverviewChart stakeholders={stakeholders} />
              )}
              <DepartmentMatrix
                stakeholders={stakeholders}
                activeId={activeStakeholder?.id ?? null}
                onSelect={setActiveStakeholder}
              />
            </div>

            {/* Columna derecha: panel sticky */}
            <div className="w-96 shrink-0 sticky top-[130px] max-h-[calc(100vh-9rem)] overflow-y-auto">
              {activeStakeholder ? (
                <StakeholderPanel
                  stakeholder={activeStakeholder}
                  onClose={() => setActiveStakeholder(null)}
                  onStartInterview={(s) => setInterviewingExisting(s)}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-white/50 dark:bg-warm-800/50 p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[200px]">
                  <svg className="h-8 w-8 text-text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                  <p className="text-xs text-text-subtle">Selecciona un stakeholder para ver su perfil e intervenciones</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recomendaciones IA ── */}
        <div className="max-w-7xl mx-auto px-8 pb-10">
          <RecommendationPanel
            tool="t2"
            context={t2LLMContext}
            engagementId={engagementId}
            title="Recomendaciones IA — Gestión del Cambio"
            subtitle="Generadas por Claude · Específicas para este mapa de stakeholders"
          />
        </div>

      </div>

      {/* ── Modal nueva entrevista ── */}
      {showModal && engagementId && (
        <InterviewModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddStakeholder}
          projectId={engagementId}
          companyId={companyId}
        />
      )}

      {/* ── Modal entrevista para stakeholder ya importado ── */}
      {interviewingExisting && engagementId && (
        <InterviewModal
          onClose={() => setInterviewingExisting(null)}
          projectId={engagementId}
          companyId={companyId}
          onSubmit={(data) => {
            updateStakeholder(
              interviewingExisting.id,
              { interview: data.interview, archetype: data.archetype, resistance: data.resistance, notes: data.notes },
              engagementId,
            )
            setInterviewingExisting(null)
            setTimeout(() => {
              const updated = useT2Store.getState().stakeholders.find((s) => s.id === interviewingExisting.id)
              if (updated) setActiveStakeholder(updated)
            }, 50)
          }}
          existingStakeholder={interviewingExisting}
        />
      )}

      {/* ── Modal importar desde T1 ── */}
      {showImportT1 && (
        <ImportFromT1Modal onClose={() => setShowImportT1(false)} />
      )}
    </div>
  )
}
