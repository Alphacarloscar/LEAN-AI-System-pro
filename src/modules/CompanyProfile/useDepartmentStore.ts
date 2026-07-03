// ============================================================
// useDepartmentStore — Departamentos centralizados por Empresa
//
// Fuente de verdad: tabla `company_departments` en Supabase.
// Scope: company_id (compartido entre todos los proyectos de
//        una misma empresa).
//
// No usa persist — datos siempre frescos desde Supabase.
// ============================================================

import { create } from 'zustand'
import { reportError } from '@/lib/reportError'
import type { DepartmentType } from '@/types/database.types'
import {
  fetchDepartments  as svcFetchDepartments,
  addDepartment     as svcAddDepartment,
  updateDepartment  as svcUpdateDepartment,
  deleteDepartment  as svcDeleteDepartment,
} from '@/services/department.service'

export type { DepartmentType }

// ── Tipo público ──────────────────────────────────────────────

export interface Department {
  id:         string
  company_id: string
  name:       string
  color:      string
  type:       DepartmentType
  created_at: string
}

// ── Store ─────────────────────────────────────────────────────

interface DepartmentStore {
  departments: Department[]
  isLoading:   boolean
  error:       string | null

  /** Carga los departamentos de una empresa. Llamar al cambiar de proyecto. */
  fetchDepartments: (companyId: string) => Promise<void>
  /** Crea un nuevo departamento. Ignora duplicados (case-insensitive). */
  addDepartment:    (companyId: string, name: string, type: DepartmentType) => Promise<void>
  /** Actualiza nombre y/o tipo de un departamento. Optimistic update con rollback en error. */
  updateDepartment: (id: string, changes: Partial<Pick<Department, 'name' | 'type'>>) => Promise<void>
  /** Elimina un departamento. Usa optimistic update con rollback en error. */
  deleteDepartment: (id: string) => Promise<void>
  /** Limpia el estado (llamar al desmontar o al salir del proyecto). */
  reset:            () => void
}

export const useDepartmentStore = create<DepartmentStore>()((set, get) => ({
  departments: [],
  isLoading:   false,
  error:       null,

  // ── Fetch ─────────────────────────────────────────────────

  fetchDepartments: async (companyId: string) => {
    set({ isLoading: true, error: null })
    try {
      const departments = await svcFetchDepartments(companyId)
      set({ departments, isLoading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar departamentos'
      reportError('[DepartmentStore] fetchDepartments', err)
      set({ isLoading: false, error: msg })
    }
  },

  // ── Add ───────────────────────────────────────────────────

  addDepartment: async (companyId: string, name: string, type: DepartmentType) => {
    const trimmed = name.trim()
    if (!trimmed) return

    // Evitar duplicados antes de llamar a Supabase
    const alreadyExists = get().departments.some(
      (d) => d.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (alreadyExists) return

    set({ error: null })
    try {
      const newDept = await svcAddDepartment(companyId, trimmed, type)
      set((s) => ({ departments: [...s.departments, newDept] }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al añadir departamento'
      reportError('[DepartmentStore] addDepartment', err)
      set({ error: msg })
    }
  },

  // ── Update ────────────────────────────────────────────────

  updateDepartment: async (id: string, changes: Partial<Pick<Department, 'name' | 'type'>>) => {
    const snapshot = get().departments
    set((s) => ({
      departments: s.departments.map((d) => (d.id === id ? { ...d, ...changes } : d)),
    }))

    try {
      const updated = await svcUpdateDepartment(id, changes)
      set((s) => ({ departments: s.departments.map((d) => (d.id === id ? updated : d)) }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar departamento'
      reportError('[DepartmentStore] updateDepartment', err)
      set({ departments: snapshot, error: msg })
    }
  },

  // ── Delete ────────────────────────────────────────────────

  deleteDepartment: async (id: string) => {
    // Optimistic update — rollback si Supabase falla
    const snapshot = get().departments
    set((s) => ({ departments: s.departments.filter((d) => d.id !== id) }))

    try {
      await svcDeleteDepartment(id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar departamento'
      reportError('[DepartmentStore] deleteDepartment', err)
      set({ departments: snapshot, error: msg })
    }
  },

  // ── Reset ─────────────────────────────────────────────────

  reset: () => set({ departments: [], isLoading: false, error: null }),
}))
