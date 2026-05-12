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

import { useState, useCallback, useEffect } from 'react'
import { supabase }                         from '@/lib/supabase'
import { useRecommendationCacheStore }      from '@/stores/recommendationCache.store'

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
  const { getCache, setCache } = useRecommendationCacheStore()

  // Inicializar desde caché si existe (sobrevive la navegación entre tools)
  const cached = engagementId ? getCache(engagementId, tool) : null

  const [data,      setData]      = useState<RecommendationResult | null>(cached)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // Si el engagementId cambia, restaurar el caché correspondiente
  useEffect(() => {
    if (engagementId) {
      const hit = getCache(engagementId, tool)
      if (hit) setData(hit)
      else setData(null)
    } else {
      setData(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, tool])

  const refetch = useCallback(async () => {
    if (!context || !engagementId) {
      setError('Necesitas un engagement activo para generar recomendaciones.')
      return
    }

    setIsLoading(true)
    setError(null)

    // Timeout de 90s: las Edge Functions tienen cold start + llamada a LLM.
    // 90s cubre el peor caso sin dejar al usuario esperando indefinidamente.
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('La generación tardó demasiado. Comprueba la conexión y vuelve a intentarlo.')),
        90_000,
      )
    )

    try {
      const { data: result, error: fnError } = await Promise.race([
        supabase.functions.invoke('ai-recommend', { body: { tool, context, engagementId } }),
        timeoutPromise,
      ])

      if (fnError) {
        throw new Error(fnError.message ?? 'Error al llamar a la Edge Function')
      }

      if (result?.error) {
        throw new Error(result.error)
      }

      const resultData = result?.data ?? null
      setData(resultData)
      // Guardar en caché para que sobreviva la navegación entre tools
      if (resultData && engagementId) {
        setCache(engagementId, tool, resultData)
      }
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
