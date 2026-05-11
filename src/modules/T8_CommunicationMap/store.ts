// ============================================================
// T8 — Zustand store
//
// Persiste el contenido generado por LLM (Route B).
// Se almacena en localStorage via zustand/persist.
// ============================================================

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { GeneratedT8Content } from './types'

interface T8Store {
  generatedContent:    GeneratedT8Content | null
  saveGeneratedContent: (content: GeneratedT8Content) => void
  clearGeneratedContent: () => void
}

export const useT8Store = create<T8Store>()(
  persist(
    (set) => ({
      generatedContent: null,

      saveGeneratedContent: (content) => set({ generatedContent: content }),

      clearGeneratedContent: () => set({ generatedContent: null }),
    }),
    {
      name:    't8-store',
      version: 1,
    }
  )
)
