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
import { saveChangePlanOutput } from '@/services/t7.service'
import { reportError } from '@/lib/reportError'
import type { GeneratedChangePlan } from './types'

// ── Tipos ─────────────────────────────────────────────────────

export type PersistenceStatus = 'idle' | 'saving' | 'saved' | 'error'

// ── Store ─────────────────────────────────────────────────────

interface T7Store {
  engagementId:       string | null
  generatedPlan:      GeneratedChangePlan | null
  saveGeneratedPlan:  (plan: GeneratedChangePlan, engagementId: string | null) => void
  clearGeneratedPlan: () => void
  /** Llama al montar T7View con el engagementId activo.
   *  Si difiere del guardado, limpia el plan (era de otro cliente). */
  syncEngagement:     (id: string | null) => void
  // Persistencia en Supabase
  persistenceStatus:  PersistenceStatus
  persistenceError:   string | null
  setPersistence:     (status: PersistenceStatus, error?: string) => void
  retrySave:          (projectId: string) => Promise<void>
}

export const useT7Store = create<T7Store>()(
  persist(
    (set, get) => ({
      engagementId:  null,
      generatedPlan: null,

      saveGeneratedPlan: (plan, engagementId) =>
        set({ generatedPlan: plan, engagementId }),

      clearGeneratedPlan: () =>
        set({ generatedPlan: null, persistenceStatus: 'idle', persistenceError: null }),

      syncEngagement: (id) => {
        if (get().engagementId !== id) {
          set({ engagementId: id, generatedPlan: null, persistenceStatus: 'idle', persistenceError: null })
        }
      },

      // ── Persistencia ──
      persistenceStatus: 'idle',
      persistenceError:  null,

      setPersistence: (status, error) =>
        set({ persistenceStatus: status, persistenceError: error ?? null }),

      retrySave: async (projectId) => {
        const { generatedPlan } = get()
        if (!generatedPlan) return

        set({ persistenceStatus: 'saving', persistenceError: null })

        try {
          await saveChangePlanOutput(projectId, generatedPlan)
          set({ persistenceStatus: 'saved', persistenceError: null })
        } catch (err) {
          reportError('[T7Store] retrySave', err)
          set({ persistenceStatus: 'error', persistenceError: (err as Error).message })
        }
      },
    }),
    {
      name:    't7-store',
      version: 3,
      // persistenceStatus y persistenceError son estado UI transitorio — no se persisten
      partialize: (state) => ({
        engagementId:  state.engagementId,
        generatedPlan: state.generatedPlan,
      }),
    },
  )
)
