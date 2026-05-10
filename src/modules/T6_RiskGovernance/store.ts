// ============================================================
// T6 — Zustand store
//
// Gestiona:
//   · Controles ISO 42001 (estado por control)
//   · Política IA generada por LLM (GeneratedPolicyContent)
//
// Sprint 3+: persistir controles en Supabase.
// ============================================================

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { ISO42001Control, ISO42001Status, GeneratedPolicyContent } from './types'
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
}

export const useT6Store = create<T6Store>()(
  persist(
    (set) => ({
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
        set({ generatedPolicy: null }),

      setPolicyGenerating: (value) =>
        set({ isPolicyGenerating: value }),
    }),
    { name: 'lean-t6-governance', version: 2 },
  ),
)
