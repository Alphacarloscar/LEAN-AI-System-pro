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
import { saveCommunicationOutput } from '@/services/t8.service'
import { reportError } from '@/lib/reportError'
import type { GeneratedT8Content } from './types'

// ── Tipos ─────────────────────────────────────────────────────

export type PersistenceStatus = 'idle' | 'saving' | 'saved' | 'error'

// ── Store ─────────────────────────────────────────────────────

interface T8Store {
  engagementId:          string | null
  generatedContent:      GeneratedT8Content | null
  saveGeneratedContent:  (content: GeneratedT8Content, engagementId: string | null) => void
  clearGeneratedContent: () => void
  /** Llama al montar T8View con el engagementId activo.
   *  Si difiere del guardado, limpia el contenido (era de otro cliente). */
  syncEngagement:        (id: string | null) => void
  // Persistencia en Supabase
  persistenceStatus:     PersistenceStatus
  persistenceError:      string | null
  setPersistence:        (status: PersistenceStatus, error?: string) => void
  retrySave:             (projectId: string) => Promise<void>
}

export const useT8Store = create<T8Store>()(
  persist(
    (set, get) => ({
      engagementId:    null,
      generatedContent: null,

      saveGeneratedContent: (content, engagementId) =>
        set({ generatedContent: content, engagementId }),

      clearGeneratedContent: () =>
        set({ generatedContent: null, persistenceStatus: 'idle', persistenceError: null }),

      syncEngagement: (id) => {
        if (get().engagementId !== id) {
          set({ engagementId: id, generatedContent: null, persistenceStatus: 'idle', persistenceError: null })
        }
      },

      // ── Persistencia ──
      persistenceStatus: 'idle',
      persistenceError:  null,

      setPersistence: (status, error) =>
        set({ persistenceStatus: status, persistenceError: error ?? null }),

      retrySave: async (projectId) => {
        const { generatedContent } = get()
        if (!generatedContent) return

        set({ persistenceStatus: 'saving', persistenceError: null })

        try {
          await saveCommunicationOutput(projectId, generatedContent)
          set({ persistenceStatus: 'saved', persistenceError: null })
        } catch (err) {
          reportError('[T8Store] retrySave', err)
          set({ persistenceStatus: 'error', persistenceError: (err as Error).message })
        }
      },
    }),
    {
      name:    't8-store',
      version: 3,
      // persistenceStatus y persistenceError son estado UI transitorio — no se persisten
      partialize: (state) => ({
        engagementId:    state.engagementId,
        generatedContent: state.generatedContent,
      }),
    },
  )
)
