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

interface EdgeFunctionPersistence {
  saved: boolean
  error?: string
}

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

  const { saveGeneratedPlan, setPersistence } = useT7Store()

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

    // Timeout cliente (62s): protege contra hangs de red si la conexión TCP
    // se cierra sin respuesta (Edge Function tiene 55s internos de AbortController).
    const INVOKE_TIMEOUT_MS = 62_000
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('La generación tardó demasiado. Inténtalo de nuevo en unos segundos.')),
        INVOKE_TIMEOUT_MS,
      )
    )

    try {
      const { data: result, error: fnError } = await Promise.race([
        supabase.functions.invoke('ai-recommend', { body: { tool: 't7_plan', context, engagementId } }),
        timeoutPromise,
      ])

      if (fnError) {
        // fnError.message suele ser genérico ("Edge Function returned a non-2xx status code").
        // Si es genérico, mostramos un mensaje más orientado a la acción.
        const isGeneric = fnError.message?.includes('non-2xx')
        throw new Error(isGeneric
          ? 'El servidor tardó demasiado o encontró un error. Inténtalo de nuevo.'
          : (fnError.message ?? 'Error al llamar a la Edge Function'))
      }

      if (result?.error) {
        throw new Error(result.error)
      }

      const plan = result?.data as GeneratedChangePlan | null
      if (!plan || !Array.isArray(plan.phases) || plan.phases.length === 0) {
        throw new Error('La Edge Function no devolvió un plan de cambio válido.')
      }

      // Hidratar contenido en store (visible aunque falle el guardado)
      saveGeneratedPlan({
        ...plan,
        generatedAt: new Date().toISOString(),
      }, engagementId)

      // Actualizar estado de persistencia según lo que reporta la Edge Function
      const persistence = result?.persistence as EdgeFunctionPersistence | undefined
      if (persistence?.saved === false) {
        setPersistence('error', persistence.error ?? 'Error desconocido al guardar en la nube.')
      } else {
        setPersistence('saved')
      }
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
