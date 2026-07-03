// ============================================================
// CompanyPerson Service — Personas del proyecto/empresa (Supabase)
//
// Data access layer for the company_persons table.
// Stores call these functions; components never import supabase
// directly (ADR-011).
//
// Scope dual:
//   - project_id — alta/edición y PersonSelectField (T1/T2/T3/T9,
//     CompanyProfile en modo creación) siguen atados a un proyecto.
//   - company_id — listado "Personas en la empresa" (todos los
//     proyectos de la empresa). Ver 20260708_company_persons_company_scope.sql.
// ============================================================

import { supabase }      from '@/lib/supabase'
import { makeAuditable } from '@/lib/audit'
import type { CompanyPerson, NewCompanyPerson, MergeSummary } from '@/modules/CompanyProfile/useCompanyPersonStore'

const PERSON_COLUMNS = 'id, project_id, company_id, name, role, department, source_tool, created_at, projects(name)'

interface PersonRow {
  id:          string
  project_id:  string
  company_id:  string | null
  name:        string
  role:        string
  department:  string
  source_tool: CompanyPerson['source_tool']
  created_at:  string
  projects:    { name: string } | { name: string }[] | null
}

/** Aplana el embed `projects(name)` de Supabase a un campo plano `project_name`. */
function mapPersonRow(row: PersonRow): CompanyPerson {
  const { projects, ...rest } = row
  const projectRow = Array.isArray(projects) ? projects[0] : projects
  return { ...rest, project_name: projectRow?.name ?? null }
}

// ── Implementación privada ───────────────────────────────────

const _impl = {
  /** Fetches all persons for a given project, ordered by creation date. */
  async fetchPersons(projectId: string): Promise<CompanyPerson[]> {
    const { data, error } = await supabase
      .from('company_persons')
      .select(PERSON_COLUMNS)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`[CompanyPersonService] fetchPersons: ${error.message}`)
    return ((data ?? []) as unknown as PersonRow[]).map(mapPersonRow)
  },

  /** Fetches all persons across every project of a given company, ordered by creation date. */
  async fetchPersonsByCompany(companyId: string): Promise<CompanyPerson[]> {
    const { data, error } = await supabase
      .from('company_persons')
      .select(PERSON_COLUMNS)
      .eq('company_id', companyId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`[CompanyPersonService] fetchPersonsByCompany: ${error.message}`)
    return ((data ?? []) as unknown as PersonRow[]).map(mapPersonRow)
  },

  /** Inserts a new person and returns the created row. */
  async addPerson(person: NewCompanyPerson): Promise<CompanyPerson> {
    const { data, error } = await supabase
      .from('company_persons')
      .insert({
        project_id:  person.projectId,
        company_id:  person.companyId ?? null,
        name:        person.name.trim(),
        role:        person.role?.trim() ?? '',
        department:  person.department?.trim() ?? '',
        source_tool: person.sourceTool,
      })
      .select(PERSON_COLUMNS)
      .single()

    if (error) throw new Error(`[CompanyPersonService] addPerson: ${error.message}`)
    if (!data)  throw new Error('[CompanyPersonService] addPerson: no data returned')
    return mapPersonRow(data as unknown as PersonRow)
  },

  /** Updates name/role/department of an existing person. */
  async updatePerson(
    id:      string,
    updates: { name: string; role: string; department: string },
  ): Promise<CompanyPerson> {
    const { data, error } = await supabase
      .from('company_persons')
      .update({
        name:       updates.name.trim(),
        role:       updates.role.trim(),
        department: updates.department.trim(),
      })
      .eq('id', id)
      .select(PERSON_COLUMNS)
      .single()

    if (error) throw new Error(`[CompanyPersonService] updatePerson: ${error.message}`)
    if (!data)  throw new Error('[CompanyPersonService] updatePerson: no data returned')
    return mapPersonRow(data as unknown as PersonRow)
  },

  /**
   * Fusiona dos personas: repunta todas las referencias reales (T1/T2/T3/T9)
   * de `replacedId` hacia `principalId` y elimina `replacedId`. Atómico —
   * ver función Postgres `merge_company_persons` (SECURITY DEFINER, revierte
   * todos los cambios ante cualquier error).
   */
  async mergePersons(principalId: string, replacedId: string): Promise<MergeSummary> {
    const { data, error } = await supabase.rpc('merge_company_persons', {
      p_principal_id: principalId,
      p_replaced_id:  replacedId,
    })

    if (error) throw new Error(`[CompanyPersonService] mergePersons: ${error.message}`)
    return data as unknown as MergeSummary
  },
}

// ── Punto de exportación auditado ────────────────────────────

const _service = makeAuditable(_impl, 'services.company-person')

export const {
  fetchPersons,
  fetchPersonsByCompany,
  addPerson,
  updatePerson,
  mergePersons,
} = _service
