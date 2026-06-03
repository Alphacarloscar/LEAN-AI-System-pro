import { useState, useMemo, useCallback } from 'react'
import { useT3Store }                      from '../store'
import { useEngagementStore }              from '@/modules/Engagement/store'
import { useCompanyProfileStore }          from '@/modules/CompanyProfile/store'
import { useT1Store }                      from '@/modules/T1_MaturityRadar/store'
import { computeOverallScore }             from '@/modules/T1_MaturityRadar/types'
import { buildT3OpportunitiesContext }     from '../t3OpportunitiesContextBuilder'
import { supabase }                        from '@/lib/supabase'
import { reportError }                     from '@/lib/reportError'
import { AI_CATEGORY_CONFIG }              from '../constants'
import { CategoryBadge, ReadinessBadge, PhaseBadge } from './T3Badges'
import { DetailPositionMap }               from './DetailPositionMap'
import { StagesTab }                       from './StagesTab'
import type { ValueStream, AIOpportunity } from '../types'

type DetailTab = 'oportunidades' | 'etapas'

const effortColors = {
  bajo:  'bg-success-light text-success-dark',
  medio: 'bg-warning-light text-warning-dark',
  alto:  'bg-danger-light text-danger-dark',
}
const impactColors = {
  bajo:  'bg-warm-100 dark:bg-warm-700 text-gray-500',
  medio: 'bg-info-light text-info-dark',
  alto:  'bg-navy/10 dark:bg-navy/20 text-navy dark:text-warm-100',
}

export function ProcessDetailPanel({ process }: { process: ValueStream }) {
  const [tab,       setTab]       = useState<DetailTab>('oportunidades')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError,   setAiError]   = useState<string | null>(null)

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

  const handlePersonalizeWithAI = useCallback(async () => {
    setAiLoading(true)
    setAiError(null)

    const context = buildT3OpportunitiesContext(process, companyProfile, t1MaturityScore)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('La generación tardó demasiado. Inténtalo de nuevo.')), 90_000)
    )

    try {
      const { data: result, error: fnError } = await Promise.race([
        supabase.functions.invoke('ai-recommend', {
          body: { tool: 't3_opportunities', context, engagementId },
        }),
        timeoutPromise,
      ])

      if (fnError) throw new Error(fnError.message ?? 'Error al llamar a la Edge Function')
      if (result?.error) throw new Error(result.error)

      const raw = result?.data as { opportunities?: Array<{ title: string; description: string; effort: string; impact: string }> } | null
      if (!raw?.opportunities?.length) throw new Error('La IA no devolvió oportunidades. Inténtalo de nuevo.')

      const newOpportunities: AIOpportunity[] = raw.opportunities.map((o) => ({
        id:          crypto.randomUUID(),
        title:       o.title,
        description: o.description,
        effort:      (o.effort as AIOpportunity['effort'])   ?? 'medio',
        impact:      (o.impact as AIOpportunity['impact'])   ?? 'medio',
        status:      'sugerida' as const,
      }))

      await updateProcess(process.id, { opportunities: newOpportunities }, engagementId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setAiError(msg)
      reportError('[T3] personalizeWithAI', err)
    } finally {
      setAiLoading(false)
    }
  }, [process, companyProfile, t1MaturityScore, engagementId, updateProcess])

  const catCfg       = AI_CATEGORY_CONFIG[process.aiCategory]
  const hasInterview = !!process.interview

  return (
    <div className="border-t border-border dark:border-white/6 bg-surface dark:bg-warm-950">

      {/* Panel header */}
      <div className="flex items-start gap-6 px-8 py-5 border-b border-border dark:border-white/6">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
            {process.department}
            {process.owner && ` · ${process.owner}`}
            {process.ownerRole && ` · ${process.ownerRole}`}
          </p>
          <h2 className="text-lg font-semibold text-lean-black dark:text-gray-100 leading-tight mb-2">
            {process.name}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <PhaseBadge phase={process.phase} />
            <CategoryBadge category={process.aiCategory} />
            <ReadinessBadge level={process.orgReadiness} />
            {process.manualOverride && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning-light text-warning-dark">
                Override consultor
              </span>
            )}
          </div>
          {process.description && (
            <p className="text-xs text-text-muted mt-2 leading-relaxed max-w-2xl">{process.description}</p>
          )}
        </div>

        {hasInterview && (
          <div className="shrink-0 text-center">
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">Score oportunidad</p>
            <p className="text-4xl font-bold text-lean-black dark:text-gray-100 tabular-nums leading-none">
              {process.interview!.opportunityScore.toFixed(1)}
            </p>
            <p className="text-[10px] text-text-subtle">/4.0</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border dark:border-white/6 px-8">
        {([
          { key: 'oportunidades', label: 'Oportunidades IA' },
          { key: 'etapas',       label: 'Etapas del proceso' },
        ] as { key: DetailTab; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={[
              'px-4 py-3 text-xs font-medium border-b-2 transition-colors',
              tab === key
                ? 'border-navy text-lean-black dark:text-gray-100'
                : 'border-transparent text-text-muted hover:text-text-default',
            ].join(' ')}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-8 py-6">

        {tab === 'oportunidades' && (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
            {/* LEFT — position map */}
            {hasInterview ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">Posición en la matriz</p>
                <DetailPositionMap
                  opportunityScore={process.interview!.opportunityScore}
                  readinessScore={process.interview!.readinessScore}
                  category={process.aiCategory}
                  size={200}
                />
                <div className="w-full">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">Categoría IA</p>
                  <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-1">{catCfg.tagline}</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">{catCfg.description}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-8">
                <div className="h-10 w-10 rounded-2xl bg-warm-100 dark:bg-warm-700 flex items-center justify-center text-xl">◎</div>
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
                    <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                      Oportunidades IA identificadas · {process.opportunities.length}
                    </p>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        onClick={handlePersonalizeWithAI}
                        disabled={!canGenerate}
                        title={!hasStages ? 'Documenta las etapas del proceso primero' : 'Genera recomendaciones específicas con IA'}
                        className={[
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all border',
                          aiLoading
                            ? 'border-navy/20 bg-navy/5 text-navy/50 cursor-not-allowed'
                            : !hasStages
                              ? 'border-border bg-gray-50 dark:bg-gray-800/50 text-text-subtle cursor-not-allowed'
                              : 'border-navy/30 bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100 hover:bg-navy/15 dark:hover:bg-navy/25',
                        ].join(' ')}>
                        {aiLoading ? (
                          <>
                            <svg className="animate-spin h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Generando…
                          </>
                        ) : (
                          <><span className="text-[11px]">✦</span>{process.opportunities.length > 0 ? 'Regenerar con IA' : 'Personalizar con IA'}</>
                        )}
                      </button>
                      {!hasStages && !aiLoading && (
                        <p className="text-[9px] text-text-subtle text-right max-w-[180px] leading-tight">
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
                    <p className="text-xs text-text-subtle leading-relaxed">
                      Ve a la pestaña <strong>Etapas del proceso</strong>, documenta qué sistemas usa cada etapa y vuelve aquí para generar recomendaciones IA.
                    </p>
                  ) : (
                    <p className="text-xs text-text-subtle leading-relaxed">
                      Usa el botón <strong>"Personalizar con IA"</strong> para recibir recomendaciones concretas basadas en los sistemas de este proceso.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {process.opportunities.map((opp) => {
                    const isValidated = opp.status === 'validada'
                    return (
                      <div key={opp.id}
                        className={[
                          'rounded-2xl border px-4 py-3.5 flex flex-col gap-2',
                          isValidated
                            ? 'border-success-dark/20 bg-success-light/8 dark:bg-success-dark/5'
                            : 'border-border dark:border-white/8 bg-white dark:bg-warm-800/50',
                        ].join(' ')}>
                        <div className="flex items-start gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full mt-1 shrink-0 ${isValidated ? 'bg-success-dark' : 'bg-info-dark'}`} />
                          <p className="text-xs font-semibold text-lean-black dark:text-gray-200 leading-snug">{opp.title}</p>
                          {isValidated && <span className="ml-auto shrink-0 text-[9px] font-bold text-success-dark">✓</span>}
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed">{opp.description}</p>
                        <div className="flex gap-1.5 flex-wrap mt-auto">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${effortColors[opp.effort]}`}>Esfuerzo {opp.effort}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${impactColors[opp.impact]}`}>Impacto {opp.impact}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {process.notes && (
                <div className="mt-6 rounded-2xl bg-warm-50 dark:bg-warm-800/40 border border-border dark:border-white/6 px-4 py-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">Notas del consultor</p>
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
