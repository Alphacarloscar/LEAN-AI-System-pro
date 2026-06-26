import { useCallback }                from 'react'
import { useT7Store }                  from '@/modules/T7_AdoptionHeatmap/store'
import type { GeneratedChangePlan }    from '@/modules/T7_AdoptionHeatmap/types'
import type { T7PlanContext }          from '@/modules/T7_AdoptionHeatmap/t7ContextBuilder'
import { useEdgeFunctionInvoke }       from './useEdgeFunctionInvoke'
import type { EdgeFunctionState }      from './useEdgeFunctionInvoke'
import { useServiceError }             from '@/shared/hooks/useServiceError'

interface UseChangePlanGenerationReturn {
  generate:     (context: T7PlanContext, engagementId: string | null) => Promise<void>
  isGenerating: boolean
  status:       EdgeFunctionState
  error:        string | null
  clearError:   () => void
}

export function useChangePlanGeneration(): UseChangePlanGenerationReturn {
  const { saveGeneratedPlan, setPersistence } = useT7Store()
  const { notifyError } = useServiceError()

  const onSuccess = useCallback((
    plan:         GeneratedChangePlan,
    engagementId: string,
  ) => {
    saveGeneratedPlan({ ...plan, generatedAt: new Date().toISOString() }, engagementId)
  }, [saveGeneratedPlan])

  const onPersistence = useCallback((p: { saved: boolean; error?: string } | undefined) => {
    if (p?.saved === false) setPersistence('error', p.error ?? 'Error desconocido al guardar en la nube.')
    else setPersistence('saved')
  }, [setPersistence])

  const { invoke, isGenerating, state, error, clearError } = useEdgeFunctionInvoke<
    T7PlanContext,
    GeneratedChangePlan
  >({
    tool:                't7_plan',
    timeoutMs:           62_000,
    noEngagementMessage: 'Necesitas un engagement activo para generar el plan de cambio.',
    logPrefix:           '[useChangePlanGeneration]',
    notifyError,
    validate: (data) => {
      const plan = data as GeneratedChangePlan | null
      if (!plan || !Array.isArray(plan.phases) || plan.phases.length === 0) {
        throw new Error('La Edge Function no devolvió un plan de cambio válido.')
      }
      return plan
    },
    onSuccess,
    onPersistence,
  })

  const generate = useCallback(
    (context: T7PlanContext, engagementId: string | null) => invoke(context, engagementId),
    [invoke],
  )

  return { generate, isGenerating, status: state, error, clearError }
}
