// ============================================================
// T6 — Risk & Governance View
//
// 2 tabs:
//   1. Política IA — documento corporativo dinámico + descarga PDF
//   2. Dashboard AI Act — distribución de riesgos + tabla por caso
//
// ISO 42001 (controles) vive en T12.
// ============================================================

import { useState, useMemo, useEffect } from 'react'
import { AlertCircle, Circle, FileText, Scale } from 'lucide-react'
import { useT4Store }        from '@/modules/T4_UseCasePriorityBoard'
import { useT5Store }        from '@/modules/T5_AITaxonomyCanvas'
import { useT6Store }        from './store'
import { useCompanyProfileStore } from '@/modules/CompanyProfile/store'
import { useEngagementStore }     from '@/modules/Engagement/store'
import { RecommendationPanel }    from '@/components/RecommendationPanel'
import { buildT6RecommendationContext } from './t6ContextBuilder'
import { PhaseMiniMap }          from '@/shared/components/PhaseMiniMap'
import { PolicyTab }             from './components/PolicyTab'
import { RiskDashboardTab }      from './components/RiskDashboardTab'
import { Tabs, Badge, ToolHeader, Spinner } from '@shared/design-system/components'

// ── Types ─────────────────────────────────────────────────────

type T6Tab = 'politica' | 'riesgos'

// ── Main View ─────────────────────────────────────────────────

export function T6View({
  onBack,
}: {
  onBack: () => void
}) {
  const [tab, setTab]    = useState<T6Tab>('politica')
  const {
    useCases,
    isLoading:   t4Loading,
    isLoaded:    t4Loaded,
    ensureLoaded: ensureT4,
  }                      = useT4Store()
  const { canvas }       = useT5Store()
  const { syncEngagement: syncT6, loadPolicyFromDb } = useT6Store()
  const companyProfile   = useCompanyProfileStore((s) => s.profile)
  const companyName      = companyProfile.engagementName
  const engagementId     = useEngagementStore((s) => s.activeEngagementId)

  // stable Zustand action — mount-only: sincronizar al cambiar engagement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { syncT6(engagementId) }, [engagementId])

  // Cache-first fallback: carga política desde BD si el store local está vacío
  // (primer acceso en este dispositivo o tras limpiar localStorage).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (engagementId) void loadPolicyFromDb(engagementId) }, [engagementId])

  // Cache-first con fallback a BD: si T4 no está cargado al montar T6View,
  // lo pedimos directamente — sin depender del Dashboard como precargador.
  useEffect(() => {
    if (engagementId && !t4Loaded) {
      void ensureT4(engagementId, { reason: 'T6View-mount' })
    }
  // ensureT4 es estable (referencia de store) — no necesita dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, t4Loaded])

  // Solo bloqueamos la UI en el primer ciclo de carga (sin caché).
  // Si hay datos previos (t4Loaded) hacemos refetch silencioso en bg.
  const showLoadingShield = t4Loading && !t4Loaded && engagementId !== null

  const t6LLMContext = useMemo(() =>
    companyProfile
      ? buildT6RecommendationContext(useCases, canvas, companyProfile)
      : null,
    [useCases, canvas, companyProfile]
  )

  const unclassified = useCases.filter((uc) => !uc.aiActClassification).length
  const highRisk     = useCases.filter((uc) =>
    uc.aiActClassification?.riskLevel === 'alto' ||
    uc.aiActClassification?.riskLevel === 'prohibido'
  ).length

  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Header ── */}
      <ToolHeader
        onBack={onBack}
        backLabel="Volver al dashboard"
        toolCode="T6"
        title="Risk &amp; Governance"
        subtitle={companyName}
        phaseMiniMap={<PhaseMiniMap phaseId="evaluate" toolCode="T6" />}
        maxWidth="max-w-[1100px]"
        chips={
          (highRisk > 0 || unclassified > 0) ? (
            <div className="flex items-center gap-2 flex-wrap">
              {highRisk > 0 && (
                <Badge variant="warning" shape="pill">
                  <span className="inline-flex items-center gap-1"><AlertCircle size={12} strokeWidth={1.75} /> {highRisk} caso{highRisk > 1 ? 's' : ''} alto riesgo</span>
                </Badge>
              )}
              {unclassified > 0 && (
                <Badge variant="default" shape="pill">
                  <span className="inline-flex items-center gap-1"><Circle size={12} strokeWidth={1.75} /> {unclassified} sin clasificar</span>
                </Badge>
              )}
            </div>
          ) : undefined
        }
        className="print:hidden"
      />

      <div className="max-w-[1100px] mx-auto space-y-5 px-8 py-8">

        {/* Tabs — siempre visibles, incluso durante carga */}
        <div className="print:hidden">
          <Tabs
            aria-label="Riesgos y gobernanza"
            value={tab}
            onChange={(v) => setTab(v as T6Tab)}
            tabs={[
              { value: 'politica', label: 'Política IA Corporativa', icon: <FileText size={14} strokeWidth={1.75} /> },
              { value: 'riesgos',  label: 'Dashboard AI Act', icon: <Scale size={14} strokeWidth={1.75} />, badge: highRisk > 0 ? `${highRisk} alto` : undefined },
            ]}
          />
        </div>

        {/* Tab content — spinner solo en primer ciclo sin caché */}
        {showLoadingShield ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spinner size="md" label="Cargando casos de uso…" />
            <p className="text-xs text-text-muted">Cargando casos de uso desde la base de datos…</p>
          </div>
        ) : (
          <>
            {tab === 'politica'  && <PolicyTab companyName={companyName} engagementId={engagementId} />}
            {tab === 'riesgos'   && <RiskDashboardTab />}

            {/* LLM Recommendations */}
            {t6LLMContext && (
              <RecommendationPanel
                tool="t6"
                title="Análisis de Riesgo y Cumplimiento"
                subtitle="Recomendaciones de gobernanza basadas en tu exposición AI Act"
                context={t6LLMContext}
                engagementId={engagementId}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
