// ============================================================
// Recommendation Cache Store
//
// Caché en memoria de las últimas recomendaciones generadas.
// Clave: `${engagementId}::${tool}`
//
// Diseño:
//   - Sin persistencia a localStorage (recomendaciones son efímeras,
//     el contexto puede cambiar entre sesiones).
//   - Sobreviven la navegación entre tools dentro de la misma sesión.
//   - Al cambiar de engagement → resetCache() limpia todo.
//
// Uso:
//   const { get, set, clear } = useRecommendationCacheStore()
// ============================================================

import { create } from 'zustand'
import type { RecommendationResult } from '@/hooks/useRecommendations'

interface RecommendationCacheStore {
  cache: Record<string, RecommendationResult>    // key = `${engagementId}::${tool}`

  getCache:   (engagementId: string, tool: string) => RecommendationResult | null
  setCache:   (engagementId: string, tool: string, data: RecommendationResult) => void
  resetCache: () => void
}

export const useRecommendationCacheStore = create<RecommendationCacheStore>()((set, get) => ({
  cache: {},

  getCache: (engagementId, tool) => {
    const key = `${engagementId}::${tool}`
    return get().cache[key] ?? null
  },

  setCache: (engagementId, tool, data) => {
    const key = `${engagementId}::${tool}`
    set((s) => ({ cache: { ...s.cache, [key]: data } }))
  },

  resetCache: () => set({ cache: {} }),
}))
