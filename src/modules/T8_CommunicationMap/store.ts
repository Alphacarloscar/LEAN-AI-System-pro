// ============================================================
// T8 — Zustand store
//
// Persiste el contenido generado por LLM (Route B).
// Se almacena en localStorage via zustand/persist.
//
// El contenido está scoped al engagement: si cambia el
// engagement activo, el contenido se limpia automáticamente.
// ============================================================

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { GeneratedT8Content } from './types'

interface T8Store {
  engagementId:         string | null
  generatedContent:     GeneratedT8Content | null
  saveGeneratedContent: (content: GeneratedT8Content, engagementId: string | null) => void
  clearGeneratedContent: () => void
  /** Llama al montar T8View con el engagementId activo.
   *  Si difiere del guardado, limpia el contenido (era de otro cliente). */
  syncEngagement:       (id: string | null) => void
}

export const useT8Store = create<T8Store>()(
  persist(
    (set, get) => ({
      engagementId:    null,
      generatedContent: null,

      saveGeneratedContent: (content, engagementId) =>
        set({ generatedContent: content, engagementId }),

      clearGeneratedContent: () =>
        set({ generatedContent: null }),

      syncEngagement: (id) => {
        if (get().engagementId !== id) {
          set({ engagementId: id, generatedContent: null })
        }
      },
    }),
    {
      name:    't8-store',
      version: 2,
    }
  )
)
