// ============================================================
// T6 — Zustand store
//
// Gestiona:
//   · Controles ISO 42001 (estado por control)
//   · Política IA generada por LLM (GeneratedPolicyContent)
//   · Estado de persistencia en Supabase (persistenceStatus)
//
// Sprint 3+: persistir controles en Supabase.
// ============================================================

import { create }    from 'zustand'
import { persist }   from 'zustand/middleware'
import { savePolicyOutput, fetchPolicyFromDb } from '@/services/t6.service'
import { reportError } from '@/lib/reportError'
import type { ISO42001Control, ISO42001Status, GeneratedPolicyContent } from './types'
import { ISO42001_BASE_CONTROLS } from './constants'

// ── Tipos ─────────────────────────────────────────────────────

export type PersistenceStatus = 'idle' | 'saving' | 'saved' | 'error'

// ── Helpers de inicialización ─────────────────────────────────

function buildInitialControls(): ISO42001Control[] {
  return ISO42001_BASE_CONTROLS.map((c) => ({
    ...c,
    status:       'no_iniciado' as ISO42001Status,
    autoInferred: false,
  }))
}

// ── Store ─────────────────────────────────────────────────────

interface T6Store {
  // Engagement scoping
  engagementId:        string | null
  syncEngagement:      (id: string | null) => void
  // ISO 42001
  controls:            ISO42001Control[]
  updateControl:       (id: string, status: ISO42001Status, notes?: string) => void
  resetControls:       () => void
  // Política generada por LLM
  generatedPolicy:     GeneratedPolicyContent | null
  isPolicyGenerating:  boolean
  saveGeneratedPolicy: (policy: GeneratedPolicyContent) => void
  clearGeneratedPolicy: () => void
  setPolicyGenerating: (value: boolean) => void
  // Carga inicial desde Supabase (cache-first fallback tras F5 o primer acceso)
  loadPolicyFromDb:    (projectId: string) => Promise<void>
  // Persistencia en Supabase
  persistenceStatus:   PersistenceStatus
  persistenceError:    string | null
  setPersistence:      (status: PersistenceStatus, error?: string) => void
  retrySave:           (projectId: string) => Promise<void>
}

export const useT6Store = create<T6Store>()(
  persist(
    (set, get) => ({
      // ── Engagement scoping ──
      engagementId: null,

      syncEngagement: (id) => {
        if (get().engagementId !== id) {
          set({
            engagementId:      id,
            controls:          buildInitialControls(),
            generatedPolicy:   null,
            persistenceStatus: 'idle',
            persistenceError:  null,
          })
        }
      },

      // ── ISO 42001 ──
      controls: buildInitialControls(),

      updateControl: (id, status, notes) =>
        set((state) => ({
          controls: state.controls.map((c) =>
            c.id === id
              ? { ...c, status, notes: notes ?? c.notes, autoInferred: false }
              : c
          ),
        })),

      resetControls: () => set({ controls: buildInitialControls() }),

      // ── Política LLM ──
      generatedPolicy:    null,
      isPolicyGenerating: false,

      saveGeneratedPolicy: (policy) =>
        set({ generatedPolicy: policy, isPolicyGenerating: false }),

      clearGeneratedPolicy: () =>
        set({ generatedPolicy: null, persistenceStatus: 'idle', persistenceError: null }),

      setPolicyGenerating: (value) =>
        set({ isPolicyGenerating: value }),

      // ── Carga inicial desde DB ──
      loadPolicyFromDb: async (projectId) => {
        if (get().generatedPolicy !== null) return
        try {
          const policy = await fetchPolicyFromDb(projectId)
          if (policy) set({ generatedPolicy: policy })
        } catch (err) {
          reportError('[T6Store] loadPolicyFromDb', err)
        }
      },

      // ── Persistencia ──
      persistenceStatus: 'idle',
      persistenceError:  null,

      setPersistence: (status, error) =>
        set({ persistenceStatus: status, persistenceError: error ?? null }),

      retrySave: async (projectId) => {
        const { generatedPolicy } = get()
        if (!generatedPolicy) return

        set({ persistenceStatus: 'saving', persistenceError: null })

        try {
          await savePolicyOutput(projectId, generatedPolicy)
          set({ persistenceStatus: 'saved', persistenceError: null })
        } catch (err) {
          reportError('[T6Store] retrySave', err)
          set({ persistenceStatus: 'error', persistenceError: (err as Error).message })
        }
      },
    }),
    {
      name:    'lean-t6-governance',
      version: 4,
      // persistenceStatus y persistenceError son estado UI transitorio — no se persisten
      partialize: (state) => ({
        engagementId:    state.engagementId,
        controls:        state.controls,
        generatedPolicy: state.generatedPolicy,
      }),
    },
  ),
)
