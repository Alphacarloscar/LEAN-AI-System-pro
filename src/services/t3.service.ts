// ============================================================
// T3 Service — Value Streams (Supabase)
//
// Capa de acceso a datos para la tabla value_streams.
// Los stores llaman estas funciones; los componentes no las
// importan directamente (siempre pasan por el store).
//
// Mapeo:
//   ValueStreamRow (BD, snake_case) ↔ ValueStream (dominio, camelCase)
//
// Campos JSONB en BD: opportunities, stages, interview
// ============================================================

import { supabase }          from '@/lib/supabase'
import type { Json, ValueStreamRow, ValueStreamInsert } from '@/types/database.types'
import type { ValueStream }  from '@/modules/T3_ValueStreamMap/types'

// ── Helpers de cast ──────────────────────────────────────────

function cast<T>(v: unknown): T        { return v as T }
function castOpt<T>(v: unknown): T | undefined {
  return v == null ? undefined : v as T
}
function toJson<T>(v: T | undefined | null): Json {
  return (v ?? null) as unknown as Json
}

// ── Mapeo BD → dominio ───────────────────────────────────────

export function rowToValueStream(row: ValueStreamRow): ValueStream {
  return {
    id:               row.id,
    name:             row.name,
    department:       row.department,
    owner:            row.owner ?? undefined,
    ownerRole:        row.owner_role ?? undefined,
    description:      row.description ?? undefined,
    phase:            cast<ValueStream['phase']>(row.phase),
    aiCategory:       cast<ValueStream['aiCategory']>(row.ai_category),
    orgReadiness:     cast<ValueStream['orgReadiness']>(row.org_readiness),
    opportunityLevel: cast<ValueStream['opportunityLevel']>(row.opportunity_level),
    interview:        castOpt<ValueStream['interview']>(row.interview),
    opportunities:    cast<ValueStream['opportunities']>(row.opportunities) ?? [],
    stages:           castOpt<ValueStream['stages']>(row.stages),
    notes:            row.notes ?? undefined,
    createdAt:        row.created_at,
    manualOverride:   row.manual_override || undefined,
  }
}

// ── Mapeo dominio → BD ───────────────────────────────────────

export function valueStreamToInsert(vs: ValueStream, engagementId: string): ValueStreamInsert {
  return {
    id:               vs.id,
    engagement_id:    engagementId,
    name:             vs.name,
    department:       vs.department,
    owner:            vs.owner ?? null,
    owner_role:       vs.ownerRole ?? null,
    description:      vs.description ?? null,
    phase:            vs.phase,
    ai_category:      vs.aiCategory,
    org_readiness:    vs.orgReadiness,
    opportunity_level: vs.opportunityLevel,
    interview:        toJson(vs.interview),
    opportunities:    toJson(vs.opportunities),
    stages:           toJson(vs.stages),
    notes:            vs.notes ?? null,
    manual_override:  vs.manualOverride ?? false,
  }
}

// ── Operaciones CRUD ─────────────────────────────────────────

/** Carga todos los value streams de un engagement */
export async function fetchValueStreams(engagementId: string): Promise<ValueStream[]> {
  const { data, error } = await supabase
    .from('value_streams')
    .select('*')
    .eq('engagement_id', engagementId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`[T3] fetchValueStreams: ${error.message}`)
  return (data ?? []).map(rowToValueStream)
}

/** Inserta un nuevo value stream */
export async function insertValueStream(vs: ValueStream, engagementId: string): Promise<void> {
  const { error } = await supabase
    .from('value_streams')
    .insert(valueStreamToInsert(vs, engagementId))

  if (error) throw new Error(`[T3] insertValueStream: ${error.message}`)
}

/** Actualiza un value stream existente */
export async function updateValueStreamInDb(
  id: string,
  engagementId: string,
  updates: Partial<Omit<ValueStream, 'id' | 'createdAt'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {}

  if (updates.name             !== undefined) patch.name = updates.name
  if (updates.department       !== undefined) patch.department = updates.department
  if (updates.owner            !== undefined) patch.owner = updates.owner ?? null
  if (updates.ownerRole        !== undefined) patch.owner_role = updates.ownerRole ?? null
  if (updates.description      !== undefined) patch.description = updates.description ?? null
  if (updates.phase            !== undefined) patch.phase = updates.phase
  if (updates.aiCategory       !== undefined) patch.ai_category = updates.aiCategory
  if (updates.orgReadiness     !== undefined) patch.org_readiness = updates.orgReadiness
  if (updates.opportunityLevel !== undefined) patch.opportunity_level = updates.opportunityLevel
  if (updates.interview        !== undefined) patch.interview = toJson(updates.interview)
  if (updates.opportunities    !== undefined) patch.opportunities = toJson(updates.opportunities)
  if (updates.stages           !== undefined) patch.stages = toJson(updates.stages)
  if (updates.notes            !== undefined) patch.notes = updates.notes ?? null
  if (updates.manualOverride   !== undefined) patch.manual_override = updates.manualOverride ?? false

  const { error } = await supabase
    .from('value_streams')
    .update(patch)
    .eq('id', id)
    .eq('engagement_id', engagementId)

  if (error) throw new Error(`[T3] updateValueStreamInDb: ${error.message}`)
}

/** Elimina un value stream */
export async function deleteValueStreamFromDb(id: string, engagementId: string): Promise<void> {
  const { error } = await supabase
    .from('value_streams')
    .delete()
    .eq('id', id)
    .eq('engagement_id', engagementId)

  if (error) throw new Error(`[T3] deleteValueStreamFromDb: ${error.message}`)
}

/** Inserta múltiples value streams de golpe (seed de demo data) */
export async function bulkInsertValueStreams(
  valueStreams: ValueStream[],
  engagementId: string,
): Promise<void> {
  const rows = valueStreams.map((vs) => valueStreamToInsert(vs, engagementId))
  const { error } = await supabase.from('value_streams').insert(rows)
  if (error) throw new Error(`[T3] bulkInsertValueStreams: ${error.message}`)
}
