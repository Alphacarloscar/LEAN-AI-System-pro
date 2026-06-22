import { useState, useMemo, useCallback }  from 'react'
import { useT3Store }                      from '../store'
import { useEngagementStore }              from '@/modules/Engagement/store'
import { useCompanyProfileStore }          from '@/modules/CompanyProfile/store'
import { useT1Store }                      from '@/modules/T1_MaturityRadar/store'
import { computeOverallScore }             from '@/modules/T1_MaturityRadar/types'
import { buildT3OpportunitiesContext }     from '../t3OpportunitiesContextBuilder'
import { useEdgeFunctionInvoke }           from '@/hooks/useEdgeFunctionInvoke'
import { AI_CATEGORY_CONFIG }              from '../constants'
import { Button, Badge, Card, Tabs, type BadgeVariant } from '@shared/design-system/components'
import { CategoryBadge, ReadinessBadge, PhaseBadge } from './T3Badges'
import { DetailPositionMap }               from './DetailPositionMap'
import { StagesTab }                       from './StagesTab'
import type { ValueStream, AIOpportunity } from '../types'

type DetailTab = 'oportunidades' | 'etapas'

// ── Tipo de respuesta de la Edge Function ─────────────────────
interface T3OpportunitiesRaw {
  opportunities: Array<{ title: string; description: string; effort: string; impact: string }>
}

// ── Mapeo de dominio T3 → variant de Badge ────────────────────
const EFFORT_VARIANT: Record<AIOpportunity['effort'], BadgeVariant> = {
  bajo:  'success',
  medio: 'warning',
  alto:  'danger',
}
const IMPACT_VARIANT: Record<AIOpportunity['impact'], BadgeVariant> = {
  bajo:  'default',
  medio: 'info',
  alto:  'default',  // inline style — navy/10 pattern (background-image conflict)
}
// impact alto: bg-navy/10 text-navy — data-driven pair para evitar conflicto gradient
const IMPACT_ALTO_STYLE: React.CSSProperties = { backgroundColor: 'rgba(42,40,34,0.1)', color: '#2A2822' }

export function ProcessDetailPanel({ process }: { process: ValueStream }) {
  const [tab, setTab] = useState<DetailTab>('oportunidades')

  const updateProcess   = useT3Store((s) => s.updateProcess)
  const engagementId    = useEngagementStore((s) => s.activeEngagementId)
  const companyProfile  = useCompanyProfileStore((s) => s.profile)
  const t1DimStates     = useT1Store((s) => s.dimensionStates)

  const t1MaturityScore = useMemo(() => {
    const allDims = Object.values(t1DimStates)
    if (allDims.length === 0) return undefined
    try { return computeOverallScore(allDims[0]) }
    catch { return undefined }
  }, [t1DimStates])

  const { invoke: invokeAI, isGenerating: aiLoading, error: aiError } =
    useEdgeFunctionInvoke<ReturnType<typeof buildT3OpportunitiesContext>, T3OpportunitiesRaw>({
      tool:                't3_opportunities',
      timeoutMs:           90_000,
      noEngagementMessage: 'No hay engagement activo.',
      logPrefix:           '[T3] personalizeWithAI',
      validate: (data) => {
        const raw = data as T3OpportunitiesRaw | null
        if (!raw?.opportunities?.length) throw new Error('La IA no devolvió oportunidades. Inténtalo de nuevo.')
        return raw
      },
      onSuccess: async (result, eid) => {
        const newOpportunities: AIOpportunity[] = result.opportunities.map((o) => ({
          id:          crypto.randomUUID(),
          title:       o.title,
          description: o.description,
          effort:      (o.effort as AIOpportunity['effort'])  ?? 'medio',
          impact:      (o.impact as AIOpportunity['impact'])  ?? 'medio',
          status:      'sugerida' as const,
        }))
        await updateProcess(process.id, { opportunities: newOpportunities }, eid)
      },
    })

  const handlePersonalizeWithAI = useCallback(() => {
    const context = buildT3OpportunitiesContext(process, companyProfile, t1MaturityScore)
    void invokeAI(context, engagementId)
  }, [process, companyProfile, t1MaturityScore, engagementId, invokeAI])

  const catCfg       = AI_CATEGORY_CONFIG[process.aiCategory]
  const hasInterview = !!process.interview

  return (
    <div className="border-t border-border dark:border-white/6 bg-surface dark:bg-warm-950">

      {/* Panel header */}
      <div className="flex items-start gap-6 px-8 py-5 border-b border-border dark:border-white/6">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1 truncate">
            {process.department}
            {process.owner && ` · ${process.owner}`}
            {process.ownerRole && ` · ${process.ownerRole}`}
          </p>
          <h2 className="text-lg font-semibold text-lean-black dark:text-gray-100 leading-tight mb-2 line-clamp-2">
            {process.name}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <PhaseBadge phase={process.phase} />
            <CategoryBadge category={process.aiCategory} />
            <ReadinessBadge level={process.orgReadiness} />
            {process.manualOverride && (
              <Badge variant="warning" shape="pill" size="xs">Override consultor</Badge>
            )}
          </div>
          {process.description && (
            <p className="text-xs text-text-muted mt-2 leading-relaxed max-w-2xl">{process.description}</p>
          )}
        </div>

        {hasInterview && (
          <div className="shrink-0 text-center">
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-muted mb-0.5">Score oportunidad</p>
            <p className="text-4xl font-bold text-lean-black dark:text-gray-100 tabular-nums leading-none">
              {process.interview!.opportunityScore.toFixed(1)}
            </p>
            <p className="text-[10px] text-text-muted">/4.0</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border dark:border-white/6 px-8">
        <Tabs
          aria-label="Detalle del proceso"
          variant="underline"
          value={tab}
          onChange={(v) => setTab(v as DetailTab)}
          tabs={[
            { value: 'oportunidades', label: 'Oportunidades IA' },
            { value: 'etapas',       label: 'Etapas del proceso' },
          ]}
        />
      </div>

      {/* Tab content */}
      <div className="px-8 py-6">

        {tab === 'oportunidades' && (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
            {/* LEFT — position map */}
            {hasInterview ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Posición en la matriz</p>
                <DetailPositionMap
                  opportunityScore={process.interview!.opportunityScore}
                  readinessScore={process.interview!.readinessScore}
                  category={process.aiCategory}
                  size={200}
                />
                <div className="w-full">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">Categoría IA</p>
                  <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-1">{catCfg.tagline}</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">{catCfg.description}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-8">
                <div className="h-10 w-10 rounded-2xl bg-warm-100 dark:bg-warm-700 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-text-muted"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="1" /></svg>
                </div>
                <p className="text-xs text-text-muted">Completa la entrevista para posicionar este proceso.</p>
              </div>
            )}

            {/* RIGHT — AI opportunities */}
            <div>
              {(() => {
                const hasStages   = (process.stages ?? []).length > 0
                const canGenerate = hasStages && !aiLoading
                return (
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
                      Oportunidades IA identificadas · {process.opportunities.length}
                    </p>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={aiLoading}
                        disabled={!canGenerate}
                        onClick={handlePersonalizeWithAI}
                        title={!hasStages ? 'Documenta las etapas del proceso primero' : 'Genera recomendaciones específicas con IA'}
                        icon={!aiLoading ? <span className="text-[11px]">✦</span> : undefined}
                      >
                        {aiLoading
                          ? 'Generando…'
                          : process.opportunities.length > 0 ? 'Regenerar con IA' : 'Personalizar con IA'}
                      </Button>
                      {!hasStages && !aiLoading && (
                        <p className="text-[9px] text-text-muted text-right max-w-[180px] leading-tight">
                          Documenta las etapas primero
                        </p>
                      )}
                    </div>
                  </div>
                )
              })()}

              {aiError && (
                <div className="mb-4 rounded-xl border border-danger-dark/20 bg-danger-light/10 px-3 py-2 flex items-start gap-2">
                  <span className="text-danger-dark text-xs mt-0.5 shrink-0">!</span>
                  <p className="text-xs text-danger-dark leading-relaxed">{aiError}</p>
                </div>
              )}

              {process.opportunities.length === 0 ? (
                <div className="flex flex-col gap-2">
                  {(process.stages ?? []).length === 0 ? (
                    <p className="text-xs text-text-muted leading-relaxed">
                      Ve a la pestaña <strong>Etapas del proceso</strong>, documenta qué sistemas usa cada etapa y vuelve aquí para generar recomendaciones IA.
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted leading-relaxed">
                      Usa el botón <strong>"Personalizar con IA"</strong> para recibir recomendaciones concretas basadas en los sistemas de este proceso.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {process.opportunities.map((opp) => {
                    const isValidated = opp.status === 'validada'
                    return (
                      <Card
                        key={opp.id}
                        variant="flat"
                        padding="none"
                        className={[
                          'rounded-2xl border px-4 py-3.5 flex flex-col gap-2',
                          isValidated
                            ? 'border-success-dark/20 bg-success-light/8 dark:bg-success-dark/5'
                            : 'border-border dark:border-white/8 bg-white dark:bg-warm-800/50',
                        ].join(' ')}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full mt-1 shrink-0 ${isValidated ? 'bg-success-dark' : 'bg-info-dark'}`} />
                          <p className="text-xs font-semibold text-lean-black dark:text-gray-200 leading-snug">{opp.title}</p>
                          {isValidated && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="ml-auto shrink-0 text-success-dark"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed">{opp.description}</p>
                        <div className="flex gap-1.5 flex-wrap mt-auto">
                          <Badge variant={EFFORT_VARIANT[opp.effort]} size="xs">
                            Esfuerzo {opp.effort}
                          </Badge>
                          <Badge
                            variant={IMPACT_VARIANT[opp.impact]}
                            size="xs"
                            style={opp.impact === 'alto' ? IMPACT_ALTO_STYLE : undefined}
                          >
                            Impacto {opp.impact}
                          </Badge>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}

              {process.notes && (
                <div className="mt-6 rounded-2xl bg-warm-50 dark:bg-warm-800/40 border border-border dark:border-white/6 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">Notas del consultor</p>
                  <p className="text-xs text-text-muted leading-relaxed italic">{process.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'etapas' && (
          <StagesTab processId={process.id} stages={process.stages ?? []} />
        )}
      </div>
    </div>
  )
}
