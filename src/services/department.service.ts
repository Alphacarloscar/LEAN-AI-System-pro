// ============================================================
// Department Service — Company Departments (Supabase)
//
// Data access layer for the company_departments table.
// Stores call these functions; components never import supabase
// directly (ADR-011).
//
// Scope: company_id — shared across all projects of a company.
// ============================================================

import { supabase }    from '@/lib/supabase'
import { makeAuditable } from '@/lib/audit'
import type { Department, DepartmentType } from '@/modules/CompanyProfile/useDepartmentStore'

const DEPARTMENT_COLUMNS = 'id, company_id, name, color, type, created_at'

// ── Implementación privada ───────────────────────────────────

const _impl = {
  /** Fetches all departments for a given company, ordered by creation date. */
  async fetchDepartments(companyId: string): Promise<Department[]> {
    const { data, error } = await supabase
      .from('company_departments')
      .select(DEPARTMENT_COLUMNS)
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`[DepartmentService] fetchDepartments: ${error.message}`)
    return (data ?? []).map(r => ({ ...r, type: r.type as DepartmentType, created_at: r.created_at ?? '' }))
  },

  /** Inserts a new department and returns the created row. */
  async addDepartment(
    companyId: string,
    name:      string,
    type:      DepartmentType,
  ): Promise<Department> {
    const { data, error } = await supabase
      .from('company_departments')
      .insert({ company_id: companyId, name: name.trim(), color: '#C8860A', type })
      .select(DEPARTMENT_COLUMNS)
      .single()

    if (error) throw new Error(`[DepartmentService] addDepartment: ${error.message}`)
    if (!data)  throw new Error('[DepartmentService] addDepartment: no data returned')
    return { ...data, type: data.type as DepartmentType, created_at: data.created_at ?? '' }
  },

  /** Updates a department's name and/or type. */
  async updateDepartment(
    id:      string,
    changes: Partial<Pick<Department, 'name' | 'type'>>,
  ): Promise<Department> {
    const payload: Partial<{ name: string; type: DepartmentType }> = {}
    if (changes.name !== undefined) payload.name = changes.name.trim()
    if (changes.type !== undefined) payload.type = changes.type

    const { data, error } = await supabase
      .from('company_departments')
      .update(payload)
      .eq('id', id)
      .select(DEPARTMENT_COLUMNS)
      .single()

    if (error) throw new Error(`[DepartmentService] updateDepartment: ${error.message}`)
    if (!data)  throw new Error('[DepartmentService] updateDepartment: no data returned')
    return { ...data, type: data.type as DepartmentType, created_at: data.created_at ?? '' }
  },

  /** Deletes a department by id. */
  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase
      .from('company_departments')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`[DepartmentService] deleteDepartment: ${error.message}`)
  },
}

// ── Punto de exportación auditado ────────────────────────────

const _service = makeAuditable(_impl, 'services.department')

export const {
  fetchDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
} = _service
