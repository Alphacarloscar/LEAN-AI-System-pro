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
import { logTrace }    from '@/lib/loadTrace'
import { reportError } from '@/lib/reportError'

// ── Debounce helper (protección contra ametralladora de llamadas) ─
const updateTimers = new Map<string, ReturnType<typeof setTimeout>>()

function debounceUpdate(key: string, fn: () => void, ms: number): void {
  const existing = updateTimers.get(key)
  if (existing) clearTimeout(existing)
  updateTimers.set(key, setTimeout(() => {
    fn()
    updateTimers.delete(key)
  }, ms))
}

const STALE_MS = 5 * 60_000

// ── Generador de ID local ────────────────────────────────────
function genId(): string {
  return crypto.randomUUID()
}

// ── Store ─────────────────────────────────────────────────────

interface T4Store {
  useCases:        UseCase[]
  engagementId:    string | null
  isLoading:       boolean
  /** true tras una carga exitosa; false tras reset o error. Permite a T4View
   *  distinguir "datos ya cargados" de "store recién limpiado" sin depender
   *  solo de useCases.length (que sería 0 para proyectos nuevos). */
  isLoaded:        boolean
  loadedProjectId: string | null
  lastLoadedAt:    number | null
  /** UUID generado por cada llamada a loadEngagement() — descarta respuestas de cargas obsoletas */
  currentRequestId: string | null

  ensureLoaded: (projectId: string, options?: { force?: boolean; reason?: string; staleMs?: number }) => Promise<void>

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
      useCases:        [],
      engagementId:    null,
      isLoading:       false,
      isLoaded:        false,
      loadedProjectId: null,
      lastLoadedAt:    null,
      currentRequestId: null,

      // ── ensureLoaded ────────────────────────────────────────
      ensureLoaded: async (projectId, options = {}) => {
        const { force = false, reason = 'unknown', staleMs = STALE_MS } = options
        const state = get()
        if (state.isLoading && state.loadedProjectId === projectId && !force) {
          logTrace({ resourceName: 'T4', projectId, requestId: state.currentRequestId ?? 'n/a', reason, status: 'skipped', skippedReason: 'in_flight' })
          return
        }
        if (!force && state.isLoaded && state.loadedProjectId === projectId && state.lastLoadedAt) {
          const age = Date.now() - state.lastLoadedAt
          if (age < staleMs) {
            logTrace({ resourceName: 'T4', projectId, requestId: 'n/a', reason, status: 'skipped', skippedReason: `fresh_${Math.round(age / 1000)}s` })
            return
          }
        }
        if (state.isLoaded && state.loadedProjectId !== projectId) {
          set({ useCases: [], isLoaded: false, engagementId: null })
        }
        await get().loadEngagement(projectId)
      },

      // ── loadEngagement ──────────────────────────────────────
      loadEngagement: async (engagementId) => {
        const requestId = crypto.randomUUID()
        set({ isLoading: true, isLoaded: false, engagementId, loadedProjectId: engagementId, currentRequestId: requestId })

        const LOAD_TIMEOUT_MS = 10_000
        const fetchPromise   = fetchUseCases(engagementId)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('T4_LOAD_TIMEOUT')), LOAD_TIMEOUT_MS)
        )

        try {
          const useCases = await Promise.race([fetchPromise, timeoutPromise])
          if (get().currentRequestId !== requestId) return  // respuesta stale — descartar
          set({ useCases, isLoading: false, isLoaded: true, lastLoadedAt: Date.now() })
        } catch (err) {
          if (get().currentRequestId !== requestId) return  // respuesta stale — descartar
          reportError('[T4Store] load', err)
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
            reportError('[T4Store] addUseCase sync', err)
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
          const key = `t4::${engagementId}::${id}`
          debounceUpdate(key, () => {
            updateUseCaseInDb(id, engagementId, updates).catch((err) =>
              reportError('[T4Store] updateUseCase sync', err)
            )
          }, 500)
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
            reportError('[T4Store] removeUseCase sync', err)
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
            reportError('[T4Store] recalcScore sync', err)
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
            reportError('[T4Store] updateAIAct sync', err)
          )
        }
      },

      // ── reset ──────────────────────────────────────────────────
      reset: () => set({ useCases: [], engagementId: null, isLoading: false, isLoaded: false, loadedProjectId: null, lastLoadedAt: null, currentRequestId: null }),
    }),
    {
      name:       'lean-t4-usecases',
      version:    5,  // v5: eliminado engagementId de localStorage (causaba F5 bug)
      partialize: () => ({}),  // nada persiste — isLoaded gestiona el guard en runtime
    }
  )
)
