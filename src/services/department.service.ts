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
import type { Department } from '@/modules/CompanyProfile/useDepartmentStore'

// ── Read ─────────────────────────────────────────────────────

/** Fetches all departments for a given company, ordered by creation date. */
export async function fetchDepartments(companyId: string): Promise<Department[]> {
  const { data, error } = await supabase
    .from('company_departments')
    .select('id, company_id, name, color, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`[DepartmentService] fetchDepartments: ${error.message}`)
  return (data ?? []).map(r => ({ ...r, created_at: r.created_at ?? '' }))
}

// ── Write ─────────────────────────────────────────────────────

/** Inserts a new department and returns the created row. */
export async function addDepartment(
  companyId: string,
  name:      string,
): Promise<Department> {
  const { data, error } = await supabase
    .from('company_departments')
    .insert({ company_id: companyId, name: name.trim(), color: '#C8860A' })
    .select('id, company_id, name, color, created_at')
    .single()

  if (error) throw new Error(`[DepartmentService] addDepartment: ${error.message}`)
  if (!data)  throw new Error('[DepartmentService] addDepartment: no data returned')
  return { ...data, created_at: data.created_at ?? '' }
}

// ── Delete ────────────────────────────────────────────────────

/** Deletes a department by id. */
export async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase
    .from('company_departments')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`[DepartmentService] deleteDepartment: ${error.message}`)
}
