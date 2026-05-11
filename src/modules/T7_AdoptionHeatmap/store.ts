// ============================================================
// T7 — Zustand store
//
// Persiste el plan de cambio generado por LLM (Route B).
// Se almacena en localStorage via zustand/persist para que
// el consultor no tenga que regenerar en cada visita.
// ============================================================

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { GeneratedChangePlan } from './types'

interface T7Store {
  generatedPlan: GeneratedChangePlan | null
  saveGeneratedPlan:  (plan: GeneratedChangePlan) => void
  clearGeneratedPlan: () => void
}

export const useT7Store = create<T7Store>()(
  persist(
    (set) => ({
      generatedPlan: null,

      saveGeneratedPlan: (plan) => set({ generatedPlan: plan }),

      clearGeneratedPlan: () => set({ generatedPlan: null }),
    }),
    {
      name:    't7-store',
      version: 1,
    }
  )
)
