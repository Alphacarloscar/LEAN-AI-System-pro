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
import { Tabs, Badge, ToolHeader } from '@shared/design-system/components'

// ── Types ─────────────────────────────────────────────────────

type T6Tab = 'politica' | 'riesgos'

// ── Main View ─────────────────────────────────────────────────

export function T6View({
  onBack,
}: {
  onBack: () => void
}) {
  const [tab, setTab]    = useState<T6Tab>('politica')
  const { useCases }     = useT4Store()
  const { canvas }       = useT5Store()
  const { syncEngagement: syncT6 } = useT6Store()
  const companyProfile   = useCompanyProfileStore((s) => s.profile)
  const companyName      = companyProfile.engagementName
  const engagementId     = useEngagementStore((s) => s.activeEngagementId)

  useEffect(() => { syncT6(engagementId) }, [engagementId])

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
        backLabel="Volver"
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
                  🔴 {highRisk} caso{highRisk > 1 ? 's' : ''} alto riesgo
                </Badge>
              )}
              {unclassified > 0 && (
                <Badge variant="default" shape="pill">
                  ⬜ {unclassified} sin clasificar
                </Badge>
              )}
            </div>
          ) : undefined
        }
        className="print:hidden"
      />

      <div className="max-w-[1100px] mx-auto space-y-5 px-8 py-8">

        {/* Tabs */}
        <div className="print:hidden">
          <Tabs
            aria-label="Riesgos y gobernanza"
            value={tab}
            onChange={(v) => setTab(v as T6Tab)}
            tabs={[
              { value: 'politica', label: '📄 Política IA Corporativa' },
              { value: 'riesgos',  label: '⚖️ Dashboard AI Act', badge: highRisk > 0 ? `${highRisk} alto` : undefined },
            ]}
          />
        </div>

        {/* Tab content */}
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
      </div>
    </div>
  )
}
