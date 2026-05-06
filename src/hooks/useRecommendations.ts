// ============================================================
// useRecommendations — Hook de recomendaciones LLM
//
// Llama a la Edge Function ai-recommend con el contexto del tool
// y gestiona los estados de carga, error y resultado.
//
// Diseño:
//   - Trigger manual (el consultor decide cuándo regenerar).
//   - Sin auto-fetch en mount: evita llamadas innecesarias al API.
//   - Cada llamada a refetch() genera nuevas recomendaciones.
//
// Uso:
//   const { data, isLoading, error, refetch } =
//     useRecommendations('t1', context, engagementId)
// ============================================================

import { useState, useCallback }  from 'react'
import { supabase }               from '@/lib/supabase'

// ── Tipos de respuesta ───────────────────────────────────────

export interface T1Recommendation {
  title:     string
  dimension: string
  rationale: string
  effort:    'bajo' | 'medio' | 'alto'
  horizon:   string
}

export interface T1RecommendationResult {
  recommendations: T1Recommendation[]
  contextualNote:  string
}

// Genérico para otros tools futuros
export type RecommendationResult = T1RecommendationResult

// ── Hook ─────────────────────────────────────────────────────

interface UseRecommendationsReturn {
  data:      RecommendationResult | null
  isLoading: boolean
  error:     string | null
  refetch:   () => Promise<void>
}

export function useRecommendations(
  tool:         string,
  context:      unknown,
  engagementId: string | null,
): UseRecommendationsReturn {
  const [data,      setData]      = useState<RecommendationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!context || !engagementId) {
      setError('Necesitas un engagement activo para generar recomendaciones.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        'ai-recommend',
        { body: { tool, context, engagementId } },
      )

      if (fnError) {
        throw new Error(fnError.message ?? 'Error al llamar a la Edge Function')
      }

      if (result?.error) {
        throw new Error(result.error)
      }

      setData(result?.data ?? null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      console.error(`[useRecommendations:${tool}]`, err)
    } finally {
      setIsLoading(false)
    }
  }, [tool, context, engagementId])

  return { data, isLoading, error, refetch }
}
