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
import { supabase } from '@/lib/supabase'
import { reportError } from '@/lib/reportError'

// ── Tipo público ──────────────────────────────────────────────

export interface Department {
  id:         string
  company_id: string
  name:       string
  color:      string
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
  addDepartment:    (companyId: string, name: string) => Promise<void>
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
      const { data, error } = await supabase
        .from('company_departments')
        .select('id, company_id, name, color, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })

      if (error) throw error
      set({ departments: data ?? [], isLoading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar departamentos'
      reportError('[DepartmentStore] fetchDepartments', err)
      set({ isLoading: false, error: msg })
    }
  },

  // ── Add ───────────────────────────────────────────────────

  addDepartment: async (companyId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return

    // Evitar duplicados antes de llamar a Supabase
    const alreadyExists = get().departments.some(
      (d) => d.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (alreadyExists) return

    set({ error: null })
    try {
      const { data, error } = await supabase
        .from('company_departments')
        .insert({ company_id: companyId, name: trimmed, color: '#C8860A' })
        .select('id, company_id, name, color, created_at')
        .single()

      if (error) throw error
      if (data) {
        set((s) => ({ departments: [...s.departments, data] }))
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al añadir departamento'
      reportError('[DepartmentStore] addDepartment', err)
      set({ error: msg })
    }
  },

  // ── Delete ────────────────────────────────────────────────

  deleteDepartment: async (id: string) => {
    // Optimistic update — rollback si Supabase falla
    const snapshot = get().departments
    set((s) => ({ departments: s.departments.filter((d) => d.id !== id) }))

    try {
      const { error } = await supabase
        .from('company_departments')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar departamento'
      reportError('[DepartmentStore] deleteDepartment', err)
      set({ departments: snapshot, error: msg })
    }
  },

  // ── Reset ─────────────────────────────────────────────────

  reset: () => set({ departments: [], isLoading: false, error: null }),
}))
