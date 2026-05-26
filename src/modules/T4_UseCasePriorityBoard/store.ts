// ============================================================
// T4 — Zustand store con Supabase sync (Sprint 3)
//
// Patrón: optimistic update + async sync a Supabase.
// El ID se genera localmente (UUID v4-style) → UI sin latencia.
// La escritura a Supabase es fire-and-forget con log de error.
//
// loadEngagement(id): hidrata el store desde Supabase.
//   Si no hay datos → carga demo data (primer engagement nuevo).
//
// Demo data (8 casos): solo se usa si no hay datos en Supabase.
// ============================================================

import { create }               from 'zustand'
import { persist }              from 'zustand/middleware'
import { computePriorityScore } from './constants'
import type { UseCase, AIActClassification } from './types'
import {
  fetchUseCases,
  insertUseCase,
  updateUseCaseInDb,
  deleteUseCaseFromDb,
} from '@/services/t4.service'

// ── Generador de ID local ────────────────────────────────────
function genId(): string {
  return crypto.randomUUID()
}

// ── Store ─────────────────────────────────────────────────────

interface T4Store {
  useCases:     UseCase[]
  engagementId: string | null
  isLoading:    boolean
  /** true tras una carga exitosa; false tras reset o error. Permite a T4View
   *  distinguir "datos ya cargados" de "store recién limpiado" sin depender
   *  solo de useCases.length (que sería 0 para proyectos nuevos). */
  isLoaded:     boolean

  /** Carga casos de uso desde Supabase para el engagement dado */
  loadEngagement: (engagementId: string) => Promise<void>

  /** Crea un caso de uso (local inmediato + sync Supabase) */
  addUseCase: (uc: Omit<UseCase, 'id' | 'createdAt'>) => string

  /** Actualiza un caso de uso (local inmediato + sync Supabase) */
  updateUseCase: (id: string, updates: Partial<Omit<UseCase, 'id'>>) => void

  /** Elimina un caso de uso (local inmediato + sync Supabase) */
  removeUseCase: (id: string) => void

  /** Recalcula el priorityScore tras editar scores */
  recalcScore: (id: string) => void

  /** Guarda la clasificación AI Act */
  updateAIActClassification: (id: string, classification: AIActClassification) => void

  /** Limpia todos los datos del engagement activo — llamado por Hard Reset al cambiar de proyecto */
  reset: () => void
}

export const useT4Store = create<T4Store>()(
  persist(
    (set, get) => ({
      useCases:     [],
      engagementId: null,
      isLoading:    false,
      isLoaded:     false,

      // ── loadEngagement ──────────────────────────────────────
      loadEngagement: async (engagementId) => {
        const s = get()
        // F-06 engagement-aware: solo bloquear si estamos cargando ESTE mismo engagement
        if (s.isLoading && s.engagementId === engagementId) {
          console.log(`[T4 Store] BLOCKED (F-06) — ya cargando engagement: ${engagementId}`)
          return
        }
        console.log(`[T4 Store] START — engagement: ${engagementId}`)
        set({ isLoading: true, isLoaded: false, engagementId })
        try {
          const useCases = await fetchUseCases(engagementId)
          // Stale guard: si el Hard Reset ocurrió mientras este fetch estaba en vuelo, descartar resultado
          if (get().engagementId !== engagementId) {
            console.log(`[T4 Store] STALE — resultado descartado (engagement actual: ${get().engagementId})`)
            return
          }
          console.log(`[T4 Store] OK — ${useCases.length} casos de uso`)
          set({ useCases, isLoading: false, isLoaded: true })
        } catch (err) {
          if (get().engagementId !== engagementId) {
            console.log(`[T4 Store] STALE+ERROR — resultado descartado`)
            return
          }
          console.error('[T4 Store] ERROR:', err)
          set({ isLoading: false, isLoaded: false })
        }
      },

      // ── addUseCase ──────────────────────────────────────────
      addUseCase: (uc) => {
        const id        = genId()
        const createdAt = new Date().toISOString()
        const full: UseCase = { ...uc, id, createdAt }

        set((state) => ({ useCases: [...state.useCases, full] }))

        const { engagementId } = get()
        if (engagementId) {
          insertUseCase(full, engagementId).catch((err) =>
            console.error('[T4] addUseCase sync:', err)
          )
        }
        return id
      },

      // ── updateUseCase ───────────────────────────────────────
      updateUseCase: (id, updates) => {
        set((state) => ({
          useCases: state.useCases.map((uc) =>
            uc.id === id ? { ...uc, ...updates } : uc
          ),
        }))

        const { engagementId } = get()
        if (engagementId) {
          updateUseCaseInDb(id, engagementId, updates).catch((err) =>
            console.error('[T4] updateUseCase sync:', err)
          )
        }
      },

      // ── removeUseCase ───────────────────────────────────────
      removeUseCase: (id) => {
        set((state) => ({
          useCases: state.useCases.filter((uc) => uc.id !== id),
        }))

        const { engagementId } = get()
        if (engagementId) {
          deleteUseCaseFromDb(id, engagementId).catch((err) =>
            console.error('[T4] removeUseCase sync:', err)
          )
        }
      },

      // ── recalcScore ─────────────────────────────────────────
      recalcScore: (id) => {
        const uc = get().useCases.find((u) => u.id === id)
        if (!uc) return
        const newScore = computePriorityScore(uc.scores)
        set((state) => ({
          useCases: state.useCases.map((u) =>
            u.id === id ? { ...u, priorityScore: newScore } : u
          ),
        }))

        const { engagementId } = get()
        if (engagementId) {
          updateUseCaseInDb(id, engagementId, { priorityScore: newScore }).catch((err) =>
            console.error('[T4] recalcScore sync:', err)
          )
        }
      },

      // ── updateAIActClassification ───────────────────────────
      updateAIActClassification: (id, classification) => {
        set((state) => ({
          useCases: state.useCases.map((uc) =>
            uc.id === id ? { ...uc, aiActClassification: classification } : uc
          ),
        }))

        const { engagementId } = get()
        if (engagementId) {
          updateUseCaseInDb(id, engagementId, { aiActClassification: classification }).catch((err) =>
            console.error('[T4] updateAIAct sync:', err)
          )
        }
      },

      // ── reset ──────────────────────────────────────────────────
      reset: () => set({ useCases: [], engagementId: null, isLoading: false, isLoaded: false }),
    }),
    {
      name:       'lean-t4-usecases',
      version:    5,  // v5: eliminado engagementId de localStorage (causaba F5 bug)
      partialize: () => ({}),  // nada persiste — isLoaded gestiona el guard en runtime
    }
  )
)
