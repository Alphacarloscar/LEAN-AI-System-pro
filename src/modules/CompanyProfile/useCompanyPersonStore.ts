// ============================================================
// useCompanyPersonStore — Personas del proyecto (Equipo)
//
// Fuente de verdad: tabla `company_persons` en Supabase.
// Scope: project_id — reutilizable desde T1, T2, T3, T9 y
//        CompanyProfile via PersonSelectField.
//
// No usa persist — datos siempre frescos desde Supabase.
// ============================================================

import { create } from 'zustand'
import { reportError } from '@/lib/reportError'
import {
  fetchPersons  as svcFetchPersons,
  addPerson     as svcAddPerson,
  mergePersons  as svcMergePersons,
} from '@/services/company-person.service'

// ── Tipos públicos ──────────────────────────────────────────────

export type SourceTool = 't1' | 't2' | 't3' | 't9' | 'company_profile'

export interface CompanyPerson {
  id:          string
  project_id:  string
  company_id:  string | null
  name:        string
  role:        string
  department:  string
  source_tool: SourceTool
  created_at:  string
}

export interface NewCompanyPerson {
  projectId:   string
  companyId?:  string | null
  name:        string
  role?:       string
  department?: string
  sourceTool:  SourceTool
}

/** Resumen devuelto por la función Postgres merge_company_persons */
export interface MergeSummary {
  t1_updated: number
  t2_updated: number
  t3_updated: number
  t9_updated: number
}

// ── Store ─────────────────────────────────────────────────────

interface CompanyPersonStore {
  persons:    CompanyPerson[]
  isLoading:  boolean
  error:      string | null
  isMerging:  boolean
  /** Mensaje descriptivo del último error de fusión — consumido por el modal de error */
  mergeError: string | null

  /** Carga las personas de un proyecto. Llamar al abrir el selector. */
  fetchPersons: (projectId: string) => Promise<void>
  /** Crea una nueva persona y la añade al estado local. */
  addPerson:    (person: NewCompanyPerson) => Promise<CompanyPerson | null>
  /**
   * Fusiona dos personas: `principalId` se conserva, `replacedId` se elimina
   * tras repuntar todas sus referencias. Atómico en el backend — en éxito
   * refresca la lista; en error deja `mergeError` con el texto descriptivo.
   */
  mergePersons: (projectId: string, principalId: string, replacedId: string) => Promise<boolean>
  /** Limpia el mensaje de error de fusión (al cerrar el modal de error). */
  clearMergeError: () => void
  /** Limpia el estado (llamar al desmontar o al salir del proyecto). */
  reset:        () => void
}

export const useCompanyPersonStore = create<CompanyPersonStore>()((set) => ({
  persons:    [],
  isLoading:  false,
  error:      null,
  isMerging:  false,
  mergeError: null,

  // ── Fetch ─────────────────────────────────────────────────

  fetchPersons: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      const persons = await svcFetchPersons(projectId)
      set({ persons, isLoading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar personas'
      reportError('[CompanyPersonStore] fetchPersons', err)
      set({ isLoading: false, error: msg })
    }
  },

  // ── Add ───────────────────────────────────────────────────

  addPerson: async (person: NewCompanyPerson) => {
    const trimmed = person.name.trim()
    if (!trimmed) return null

    set({ error: null })
    try {
      const newPerson = await svcAddPerson({ ...person, name: trimmed })
      set((s) => ({ persons: [...s.persons, newPerson] }))
      return newPerson
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al añadir persona'
      reportError('[CompanyPersonStore] addPerson', err)
      set({ error: msg })
      return null
    }
  },

  // ── Merge ─────────────────────────────────────────────────

  mergePersons: async (projectId: string, principalId: string, replacedId: string) => {
    set({ isMerging: true, mergeError: null })
    try {
      await svcMergePersons(principalId, replacedId)
      set({ isMerging: false })
      // Refrescar el listado desde Supabase — la sustituible ya no existe.
      const persons = await svcFetchPersons(projectId)
      set({ persons })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al fusionar personas'
      reportError('[CompanyPersonStore] mergePersons', err)
      set({ isMerging: false, mergeError: msg })
      return false
    }
  },

  clearMergeError: () => set({ mergeError: null }),

  // ── Reset ─────────────────────────────────────────────────

  reset: () => set({ persons: [], isLoading: false, error: null, isMerging: false, mergeError: null }),
}))
