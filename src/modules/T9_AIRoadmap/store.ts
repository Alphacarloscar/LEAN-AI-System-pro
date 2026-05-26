// ============================================================
// T9 — AI Roadmap 6M — Zustand store
//
// Persiste dos tipos de datos:
//   overrides  — posición y responsable de filas T4-import
//   freeItems  — iniciativas libres del consultor
//
// Las filas T4-import se derivan en runtime desde useT4Store.
// El status y el riesgo de esas filas siempre son live desde T4.
//
// Los datos están scoped al engagement: si cambia el engagement
// activo, overrides y freeItems se limpian automáticamente.
//
// Sprint 3: Zustand persist (localStorage).
// Sprint 4: migrar a Supabase tabla roadmap_items.
// ============================================================

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { FreeItem, T9ItemOverride } from './types'

// ── ID local — UUID compatible con columna uuid en Supabase ──
function genId(): string {
  return crypto.randomUUID()
}

// ── Store interface ───────────────────────────────────────────

interface T9Store {
  engagementId: string | null
  /** Overrides de posición/responsable para filas T4-import */
  overrides: T9ItemOverride[]
  /** Iniciativas libres añadidas por el consultor */
  freeItems: FreeItem[]

  /** Guarda o actualiza el override de un caso de uso T4 */
  setOverride: (override: T9ItemOverride) => void

  /** Añade una nueva iniciativa libre */
  addFreeItem: (item: Omit<FreeItem, 'id' | 'createdAt'>) => void

  /** Actualiza campos de una iniciativa libre */
  updateFreeItem: (id: string, updates: Partial<Omit<FreeItem, 'id' | 'createdAt'>>) => void

  /** Elimina una iniciativa libre */
  removeFreeItem: (id: string) => void

  /** Llama al montar T9View con el engagementId activo.
   *  Si difiere del guardado, limpia overrides y freeItems (eran de otro cliente). */
  syncEngagement: (id: string | null) => void
}

// ── Store ─────────────────────────────────────────────────────

export const useT9Store = create<T9Store>()(
  persist(
    (set, get) => ({
      engagementId: null,
      overrides: [],
      freeItems: [],

      // ── syncEngagement ─────────────────────────────────────
      syncEngagement: (id) => {
        if (get().engagementId !== id) {
          set({ engagementId: id, overrides: [], freeItems: [] })
        }
      },

      // ── setOverride ────────────────────────────────────────
      // Reemplaza el override existente para ese useCaseId,
      // o lo añade si no existía.
      setOverride: (override) =>
        set((state) => ({
          overrides: [
            ...state.overrides.filter((o) => o.useCaseId !== override.useCaseId),
            override,
          ],
        })),

      // ── addFreeItem ────────────────────────────────────────
      addFreeItem: (item) =>
        set((state) => ({
          freeItems: [
            ...state.freeItems,
            { ...item, id: genId(), createdAt: new Date().toISOString() },
          ],
        })),

      // ── updateFreeItem ─────────────────────────────────────
      updateFreeItem: (id, updates) =>
        set((state) => ({
          freeItems: state.freeItems.map((fi) =>
            fi.id === id ? { ...fi, ...updates } : fi
          ),
        })),

      // ── removeFreeItem ─────────────────────────────────────
      removeFreeItem: (id) =>
        set((state) => ({
          freeItems: state.freeItems.filter((fi) => fi.id !== id),
        })),
    }),
    {
      name:    'lean-t9-roadmap',
      version: 3,  // invalida overrides stale (pre-startDate era) en localStorage
    }
  )
)
