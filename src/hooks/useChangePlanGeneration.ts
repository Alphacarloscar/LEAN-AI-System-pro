// ============================================================
// useChangePlanGeneration — Hook de generación LLM del Plan de Cambio
//
// Llama a la Edge Function ai-recommend con tool='t7_plan'
// y persiste el resultado en el store de T7.
//
// Diseño:
//   - Trigger manual (botón "Generar plan con IA").
//   - Sin auto-fetch: el consultor controla cuándo regenerar.
//   - En caso de error devuelve mensaje descriptivo sin romper la UI.
//   - El plan generado persiste en localStorage via T7 store.
// ============================================================

import { useState, useCallback }    from 'react'
import { supabase }                  from '@/lib/supabase'
import { useT7Store }                from '@/modules/T7_AdoptionHeatmap/store'
import type { GeneratedChangePlan }  from '@/modules/T7_AdoptionHeatmap/types'
import type { T7PlanContext }        from '@/modules/T7_AdoptionHeatmap/t7ContextBuilder'

// ── Return type ───────────────────────────────────────────────

interface UseChangePlanGenerationReturn {
  generate:     (context: T7PlanContext, engagementId: string | null) => Promise<void>
  isGenerating: boolean
  error:        string | null
  clearError:   () => void
}

// ── Hook ─────────────────────────────────────────────────────

export function useChangePlanGeneration(): UseChangePlanGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const { saveGeneratedPlan } = useT7Store()

  const generate = useCallback(async (
    context:      T7PlanContext,
    engagementId: string | null,
  ) => {
    if (!engagementId) {
      setError('Necesitas un engagement activo para generar el plan de cambio.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        'ai-recommend',
        { body: { tool: 't7_plan', context, engagementId } },
      )

      if (fnError) {
        throw new Error(fnError.message ?? 'Error al llamar a la Edge Function')
      }

      if (result?.error) {
        throw new Error(result.error)
      }

      const plan = result?.data as GeneratedChangePlan | null
      if (!plan || !Array.isArray(plan.phases) || plan.phases.length === 0) {
        throw new Error('La Edge Function no devolvió un plan de cambio válido.')
      }

      saveGeneratedPlan({
        ...plan,
        generatedAt: new Date().toISOString(),
      }, engagementId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      console.error('[useChangePlanGeneration]', err)
    } finally {
      setIsGenerating(false)
    }
  }, [saveGeneratedPlan])

  const clearError = useCallback(() => setError(null), [])

  return { generate, isGenerating, error, clearError }
}
