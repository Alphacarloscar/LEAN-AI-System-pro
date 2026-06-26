// ============================================================
// T8 — Zustand store
//
// Persiste el contenido generado por LLM (Route B).
// Se almacena en localStorage via zustand/persist.
//
// El contenido está scoped al engagement: si cambia el
// engagement activo, el contenido se limpia automáticamente.
// ============================================================

import { create }   from 'zustand'
import { persist }  from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { GeneratedT8Content } from './types'

// ── Tipos ─────────────────────────────────────────────────────

export type PersistenceStatus = 'idle' | 'saving' | 'saved' | 'error'

const TOOL_CODE       = 't8_comms'
const PAYLOAD_VERSION = 1
const STALE_DAYS      = 90

function staleAfterISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + STALE_DAYS)
  return d.toISOString()
}

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

        const { error } = await supabase.rpc('save_tool_output', {
          p_project_id:      projectId,
          p_tool_code:       TOOL_CODE,
          p_payload:         generatedContent as unknown as Record<string, unknown>,
          p_stale_after:     staleAfterISO(),
          p_payload_version: PAYLOAD_VERSION,
        })

        if (error) {
          set({ persistenceStatus: 'error', persistenceError: error.message })
        } else {
          set({ persistenceStatus: 'saved', persistenceError: null })
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
