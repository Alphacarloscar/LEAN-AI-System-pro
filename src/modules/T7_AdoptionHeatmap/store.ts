// ============================================================
// T7 — Zustand store
//
// Persiste el plan de cambio generado por LLM (Route B).
// Se almacena en localStorage via zustand/persist para que
// el consultor no tenga que regenerar en cada visita.
//
// El plan está scoped al engagement: si cambia el engagement
// activo, el plan se limpia automáticamente.
// ============================================================

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { GeneratedChangePlan } from './types'

interface T7Store {
  engagementId:       string | null
  generatedPlan:      GeneratedChangePlan | null
  saveGeneratedPlan:  (plan: GeneratedChangePlan, engagementId: string | null) => void
  clearGeneratedPlan: () => void
  /** Llama al montar T7View con el engagementId activo.
   *  Si difiere del guardado, limpia el plan (era de otro cliente). */
  syncEngagement:     (id: string | null) => void
}

export const useT7Store = create<T7Store>()(
  persist(
    (set, get) => ({
      engagementId:  null,
      generatedPlan: null,

      saveGeneratedPlan: (plan, engagementId) =>
        set({ generatedPlan: plan, engagementId }),

      clearGeneratedPlan: () =>
        set({ generatedPlan: null }),

      syncEngagement: (id) => {
        if (get().engagementId !== id) {
          set({ engagementId: id, generatedPlan: null })
        }
      },
    }),
    {
      name:    't7-store',
      version: 2,
    }
  )
)
