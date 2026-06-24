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
import { useRecommendationCacheStore }      from '@/stores/recommendationCache.store'
import { useEdgeFunctionInvoke }            from './useEdgeFunctionInvoke'

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

// ── Validación ───────────────────────────────────────────────

function validateRecommendationResult(raw: unknown): RecommendationResult {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !Array.isArray((raw as RecommendationResult).recommendations)
  ) {
    throw new Error('Respuesta inesperada de la Edge Function')
  }
  return raw as RecommendationResult
}

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

  const [data, setData] = useState<RecommendationResult | null>(cached)

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

  const handleSuccess = useCallback((result: RecommendationResult, eid: string) => {
    setData(result)
    setCache(eid, tool, result)
  }, [setCache, tool])

  const { invoke, isGenerating, error } = useEdgeFunctionInvoke<unknown, RecommendationResult>({
    tool,
    // T4 con 7+ casos de uso + datos económicos puede tardar hasta 2 min; supera el default de 90s
    timeoutMs:           120_000,
    noEngagementMessage: 'Necesitas un engagement activo para generar recomendaciones.',
    validate:            validateRecommendationResult,
    onSuccess:           handleSuccess,
    logPrefix:           `[useRecommendations:${tool}]`,
  })

  const refetch = useCallback(
    () => invoke(context, engagementId),
    [invoke, context, engagementId],
  )

  return { data, isLoading: isGenerating, error, refetch }
}
