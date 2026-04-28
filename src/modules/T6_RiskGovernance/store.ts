// ============================================================
// T6 — Zustand store
//
// Gestiona el estado de los controles ISO 42001.
// Los datos de riesgos AI Act se leen directamente desde T4.
// La política IA se genera en runtime desde T4 + T5.
//
// Sprint 3+: persistir controles en Supabase.
// ============================================================

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { ISO42001Control, ISO42001Status } from './types'
import { ISO42001_BASE_CONTROLS } from './constants'

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
  controls:      ISO42001Control[]
  updateControl: (id: string, status: ISO42001Status, notes?: string) => void
  resetControls: () => void
}

export const useT6Store = create<T6Store>()(
  persist(
    (set) => ({
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
    }),
    { name: 'lean-t6-governance', version: 1 },
  ),
)
