// ============================================================
// T1 — Zustand store
//
// Gestiona interviewees y sus scores de dimensiones.
// Sprint 5: conectado a Supabase via t1.service.ts
//
// Modos de operación:
//   — Demo (engagementId = null): datos de scenario, sin persistencia
//   — Real (engagementId presente): carga y guarda en Supabase
//
// Debounce en setScore: 800ms para evitar flood de UPSERTs
//   mientras el usuario mueve el slider.
// ============================================================

import { create }    from 'zustand'
import {
  fetchT1Data,
  upsertT1Score,
  upsertAllScoresForInterviewee,
  deleteIntervieweeScores,
  buildBlankDimensions,
} from '@/services/t1.service'
import type {
  T1IntervieweeContext,
  T1DimensionState,
  T1SubdimensionState,
} from './types'

// ── Tipos del store ──────────────────────────────────────────

interface T1Store {
  interviewees:    T1IntervieweeContext[]
  dimensionStates: Record<string, T1DimensionState[]>   // clave = interviewee.id
  activeId:               string
  isLoading:              boolean
  /** RC-1: engagement en vuelo — evita que F-06 bloquee cargas de otro engagement */
  loadingForEngagementId: string | null

  // ── Carga desde Supabase ────────────────────────────────────
  load: (engagementId: string) => Promise<void>

  // ── Inicialización en modo demo (sin engagement) ────────────
  initFromScenario: (interviewees: T1IntervieweeContext[], stateMap: Record<string, T1DimensionState[]>) => void

  // ── Navegación ───────────────────────────────────────────────
  setActiveId: (id: string) => void

  // ── Gestión de entrevistados ─────────────────────────────────
  addInterviewee: (
    person: Omit<T1IntervieweeContext, 'id'>,
    engagementId: string | null,
  ) => Promise<void>
  removeInterviewee: (
    intervieweeId: string,
    engagementId: string | null,
  ) => Promise<void>

  // ── Scores ───────────────────────────────────────────────────
  /**
   * Actualiza un score en el estado local de forma inmediata.
   * Si hay engagementId, también dispara un UPSERT a Supabase (debounced).
   */
  setScore: (
    intervieweeId:    string,
    dimensionCode:    string,
    subdimensionCode: string,
    score:            number | null,
    engagementId:     string | null,
  ) => void

  setEvidence: (
    intervieweeId:    string,
    dimensionCode:    string,
    subdimensionCode: string,
    evidence:         string,
    engagementId:     string | null,
  ) => void

  // ── UI toggles (locales, sin persistencia) ──────────────────
  toggleCriteria: (intervieweeId: string, dimensionCode: string, subdimensionCode: string) => void
  toggleEvidence: (intervieweeId: string, dimensionCode: string, subdimensionCode: string) => void

  // ── Reset ────────────────────────────────────────────────────
  reset: () => void
}

// ── Debounce helper ──────────────────────────────────────────

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

function debounce(key: string, fn: () => void, ms: number) {
  const existing = debounceTimers.get(key)
  if (existing) clearTimeout(existing)
  debounceTimers.set(key, setTimeout(() => {
    fn()
    debounceTimers.delete(key)
  }, ms))
}

// ── Helper: actualizar una subdimensión en el mapa de estados ──

function updateSubdimension(
  dimensionStates: Record<string, T1DimensionState[]>,
  intervieweeId: string,
  dimensionCode: string,
  subdimensionCode: string,
  patch: Partial<T1SubdimensionState>,
): Record<string, T1DimensionState[]> {
  const dims = dimensionStates[intervieweeId]
  if (!dims) return dimensionStates

  return {
    ...dimensionStates,
    [intervieweeId]: dims.map((dim) =>
      dim.code !== dimensionCode
        ? dim
        : {
            ...dim,
            subdimensions: dim.subdimensions.map((sub) =>
              sub.code !== subdimensionCode ? sub : { ...sub, ...patch }
            ),
          }
    ),
  }
}

// ── Store ─────────────────────────────────────────────────────

export const useT1Store = create<T1Store>()((set, get) => ({
  interviewees:           [],
  dimensionStates:        {},
  activeId:               '',
  isLoading:              false,
  loadingForEngagementId: null,

  // ── load ───────────────────────────────────────────────────
  load: async (engagementId) => {
    const s = get()
    // F-06 engagement-aware: solo bloquear si estamos cargando ESTE mismo engagement
    if (s.isLoading && s.loadingForEngagementId === engagementId) return
    set({ isLoading: true, loadingForEngagementId: engagementId })

    const LOAD_TIMEOUT_MS = 15_000

    const fetchPromise = fetchT1Data(engagementId)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('T1_LOAD_TIMEOUT')), LOAD_TIMEOUT_MS)
    )

    try {
      const { interviewees, dimensionStates } = await Promise.race([fetchPromise, timeoutPromise])
      // Stale guard: si el Hard Reset ocurrió mientras este fetch estaba en vuelo, descartar resultado
      if (get().loadingForEngagementId !== engagementId) return
      set({
        interviewees,
        dimensionStates,
        activeId: interviewees[0]?.id ?? '',
        isLoading: false,
      })
    } catch (err) {
      if (get().loadingForEngagementId !== engagementId) return  // stale load post-reset, ignorar
      const isTimeout = (err as Error)?.message === 'T1_LOAD_TIMEOUT'
      console.error('[T1Store] load:', isTimeout ? 'timeout (>15s) — check Supabase connection' : err)
      set({ isLoading: false })
    }
  },

  // ── initFromScenario ───────────────────────────────────────
  initFromScenario: (interviewees, stateMap) => {
    set({
      interviewees,
      dimensionStates: stateMap,
      activeId:        interviewees[0]?.id ?? '',
      isLoading:       false,
    })
  },

  // ── setActiveId ────────────────────────────────────────────
  setActiveId: (id) => set({ activeId: id }),

  // ── addInterviewee ─────────────────────────────────────────
  addInterviewee: async (person, engagementId) => {
    const id = crypto.randomUUID()
    const newInterviewee: T1IntervieweeContext = { ...person, id }
    const blankDims = buildBlankDimensions()

    set((state) => ({
      interviewees:    [...state.interviewees, newInterviewee],
      dimensionStates: { ...state.dimensionStates, [id]: blankDims },
      activeId:        id,
    }))

    // Sync a Supabase en background (fire-and-forget).
    // No bloqueamos la UI esperando las 24 filas de la llamada bulk.
    if (engagementId) {
      upsertAllScoresForInterviewee({
        engagementId,
        intervieweeId:         id,
        intervieweeName:       person.name,
        intervieweeRole:       person.role,
        intervieweeType:       person.type,
        intervieweeDepartment: person.department,
        dimensions:            blankDims,
      }).catch((err) => {
        console.error('[T1Store] addInterviewee sync:', err)
      })
    }
  },

  // ── removeInterviewee ──────────────────────────────────────
  removeInterviewee: async (intervieweeId, engagementId) => {
    const { interviewees, activeId } = get()
    const remaining = interviewees.filter((i) => i.id !== intervieweeId)

    set((state) => {
      const newStates = { ...state.dimensionStates }
      delete newStates[intervieweeId]
      return {
        interviewees:    remaining,
        dimensionStates: newStates,
        activeId:        activeId === intervieweeId ? (remaining[0]?.id ?? '') : activeId,
      }
    })

    if (engagementId) {
      try {
        await deleteIntervieweeScores(engagementId, intervieweeId)
      } catch (err) {
        console.error('[T1Store] removeInterviewee sync:', err)
      }
    }
  },

  // ── setScore ───────────────────────────────────────────────
  setScore: (intervieweeId, dimensionCode, subdimensionCode, score, engagementId) => {
    // Actualización local inmediata
    set((state) => ({
      dimensionStates: updateSubdimension(
        state.dimensionStates,
        intervieweeId, dimensionCode, subdimensionCode,
        { score }
      ),
    }))

    // UPSERT a Supabase con debounce (800ms)
    if (engagementId) {
      const key = `${engagementId}::${intervieweeId}::${dimensionCode}::${subdimensionCode}`
      debounce(key, async () => {
        const { interviewees, dimensionStates } = get()
        const person    = interviewees.find((i) => i.id === intervieweeId)
        const dims      = dimensionStates[intervieweeId]
        const dim       = dims?.find((d) => d.code === dimensionCode)
        const sub       = dim?.subdimensions.find((s) => s.code === subdimensionCode)
        if (!person || !sub) return

        try {
          await upsertT1Score({
            engagementId,
            intervieweeId,
            intervieweeName:       person.name,
            intervieweeRole:       person.role,
            intervieweeType:       person.type,
            intervieweeDepartment: person.department,
            dimensionCode,
            subdimensionCode,
            score:                 sub.score,
            evidence:              sub.evidence,
          })
        } catch (err) {
          console.error('[T1Store] setScore sync:', err)
        }
      }, 800)
    }
  },

  // ── setEvidence ────────────────────────────────────────────
  setEvidence: (intervieweeId, dimensionCode, subdimensionCode, evidence, engagementId) => {
    set((state) => ({
      dimensionStates: updateSubdimension(
        state.dimensionStates,
        intervieweeId, dimensionCode, subdimensionCode,
        { evidence }
      ),
    }))

    if (engagementId) {
      const key = `ev::${engagementId}::${intervieweeId}::${dimensionCode}::${subdimensionCode}`
      debounce(key, async () => {
        const { interviewees, dimensionStates } = get()
        const person = interviewees.find((i) => i.id === intervieweeId)
        const dims   = dimensionStates[intervieweeId]
        const dim    = dims?.find((d) => d.code === dimensionCode)
        const sub    = dim?.subdimensions.find((s) => s.code === subdimensionCode)
        if (!person || !sub) return

        try {
          await upsertT1Score({
            engagementId,
            intervieweeId,
            intervieweeName:       person.name,
            intervieweeRole:       person.role,
            intervieweeType:       person.type,
            intervieweeDepartment: person.department,
            dimensionCode,
            subdimensionCode,
            score:                 sub.score,
            evidence:              sub.evidence,
          })
        } catch (err) {
          console.error('[T1Store] setEvidence sync:', err)
        }
      }, 1200)
    }
  },

  // ── toggles UI ─────────────────────────────────────────────
  toggleCriteria: (intervieweeId, dimensionCode, subdimensionCode) => {
    set((state) => {
      const dims = state.dimensionStates[intervieweeId]
      if (!dims) return state
      return {
        dimensionStates: updateSubdimension(
          state.dimensionStates,
          intervieweeId, dimensionCode, subdimensionCode,
          { showCriteria: !dims
              .find((d) => d.code === dimensionCode)
              ?.subdimensions.find((s) => s.code === subdimensionCode)
              ?.showCriteria }
        ),
      }
    })
  },

  toggleEvidence: (intervieweeId, dimensionCode, subdimensionCode) => {
    set((state) => {
      const dims = state.dimensionStates[intervieweeId]
      if (!dims) return state
      return {
        dimensionStates: updateSubdimension(
          state.dimensionStates,
          intervieweeId, dimensionCode, subdimensionCode,
          { showEvidence: !dims
              .find((d) => d.code === dimensionCode)
              ?.subdimensions.find((s) => s.code === subdimensionCode)
              ?.showEvidence }
        ),
      }
    })
  },

  // ── reset ──────────────────────────────────────────────────
  reset: () => set({ interviewees: [], dimensionStates: {}, activeId: '', isLoading: false, loadingForEngagementId: null }),
}))
