// ============================================================
// T2 Service — Stakeholders (Supabase)
//
// Capa de acceso a datos para la tabla stakeholders.
// Los stores llaman estas funciones; los componentes no las
// importan directamente (siempre pasan por el store).
//
// Mapeo:
//   StakeholderRow (BD, snake_case) ↔ Stakeholder (dominio, camelCase)
// ============================================================

import { supabase }       from '@/lib/supabase'
import { makeAuditable }    from '@/lib/audit'
import type { Json, StakeholderRow, StakeholderInsert } from '@/types/database.types'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'

// ── Helpers de cast ──────────────────────────────────────────

function cast<T>(v: unknown): T        { return v as T }
function castOpt<T>(v: unknown): T | undefined {
  return v == null ? undefined : v as T
}
function toJson<T>(v: T | undefined | null): Json {
  return (v ?? null) as unknown as Json
}

// ── Mapeo BD → dominio ───────────────────────────────────────

export function rowToStakeholder(row: StakeholderRow): Stakeholder {
  return {
    id:              row.id,
    name:            row.name,
    role:            row.role,
    department:      row.department,
    archetype:       cast<Stakeholder['archetype']>(row.archetype),
    resistance:      cast<Stakeholder['resistance']>(row.resistance),
    interview:       castOpt<Stakeholder['interview']>(row.interview),
    notes:           row.notes ?? undefined,
    createdAt:       row.created_at ?? '',
    manualOverride:  row.manual_override || undefined,
    unofficialTools: row.unofficial_tools ?? undefined,
  }
}

// ── Mapeo dominio → BD ───────────────────────────────────────

export function stakeholderToInsert(s: Stakeholder, projectId: string): StakeholderInsert {
  return {
    id:               s.id,
    project_id:       projectId,
    name:             s.name,
    role:             s.role,
    department:       s.department,
    archetype:        s.archetype,
    resistance:       s.resistance,
    interview:        toJson(s.interview),
    notes:            s.notes ?? null,
    manual_override:  s.manualOverride ?? false,
    unofficial_tools: s.unofficialTools ?? null,
  }
}

// ── Implementación privada ───────────────────────────────────

const _impl = {
  /** Carga todos los stakeholders de un engagement */
  async fetchStakeholders(projectId: string): Promise<Stakeholder[]> {
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`[T2] fetchStakeholders: ${error.message}`)
    return (data ?? []).map(rowToStakeholder)
  },

  /** Inserta un nuevo stakeholder */
  async insertStakeholder(s: Stakeholder, projectId: string): Promise<void> {
    const { error } = await supabase
      .from('stakeholders')
      .insert(stakeholderToInsert(s, projectId))

    if (error) throw new Error(`[T2] insertStakeholder: ${error.message}`)
  },

  /** Actualiza un stakeholder existente */
  async updateStakeholderInDb(
    id: string,
    projectId: string,
    updates: Partial<Omit<Stakeholder, 'id' | 'createdAt'>>,
  ): Promise<void> {
    const patch: Partial<Omit<StakeholderRow, 'id' | 'project_id' | 'created_at'>> = {}

    if (updates.name           !== undefined) patch.name = updates.name
    if (updates.role           !== undefined) patch.role = updates.role
    if (updates.department     !== undefined) patch.department = updates.department
    if (updates.archetype      !== undefined) patch.archetype = updates.archetype
    if (updates.resistance     !== undefined) patch.resistance = updates.resistance
    if (updates.interview      !== undefined) patch.interview = toJson(updates.interview)
    if (updates.notes           !== undefined) patch.notes = updates.notes ?? null
    if (updates.manualOverride  !== undefined) patch.manual_override = updates.manualOverride ?? false
    if (updates.unofficialTools !== undefined) patch.unofficial_tools = updates.unofficialTools ?? null

    const { error } = await supabase
      .from('stakeholders')
      .update(patch)
      .eq('id', id)
      .eq('project_id', projectId)

    if (error) throw new Error(`[T2] updateStakeholderInDb: ${error.message}`)
  },

  /** Elimina un stakeholder */
  async deleteStakeholderFromDb(id: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from('stakeholders')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId)

    if (error) throw new Error(`[T2] deleteStakeholderFromDb: ${error.message}`)
  },

  /** Inserta múltiples stakeholders de golpe (seed de demo data) */
  async bulkInsertStakeholders(
    stakeholders: Stakeholder[],
    projectId: string,
  ): Promise<void> {
    const rows = stakeholders.map((s) => stakeholderToInsert(s, projectId))
    const { error } = await supabase.from('stakeholders').insert(rows)
    if (error) throw new Error(`[T2] bulkInsertStakeholders: ${error.message}`)
  },
}

// ── Punto de exportación auditado ────────────────────────────

const _service = makeAuditable(_impl, 'services.t2')

export const {
  fetchStakeholders,
  insertStakeholder,
  updateStakeholderInDb,
  deleteStakeholderFromDb,
  bulkInsertStakeholders,
} = _service
