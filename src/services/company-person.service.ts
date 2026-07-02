// ============================================================
// CompanyPerson Service — Personas del proyecto (Supabase)
//
// Data access layer for the company_persons table.
// Stores call these functions; components never import supabase
// directly (ADR-011).
//
// Scope: project_id — persona reutilizable entre T1, T2, T3, T9
// y CompanyProfile via PersonSelectField.
// ============================================================

import { supabase }      from '@/lib/supabase'
import { makeAuditable } from '@/lib/audit'
import type { CompanyPerson, NewCompanyPerson, MergeSummary } from '@/modules/CompanyProfile/useCompanyPersonStore'

const PERSON_COLUMNS = 'id, project_id, company_id, name, role, department, source_tool, created_at'

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
    return (data ?? []) as CompanyPerson[]
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
    return data as CompanyPerson
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
  addPerson,
  mergePersons,
} = _service
