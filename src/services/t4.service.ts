// ============================================================
// T4 Service — Use Cases (Supabase)
//
// Capa de acceso a datos para la tabla use_cases.
// Los stores llaman estas funciones; los componentes no las
// importan directamente (siempre pasan por el store).
//
// Mapeo:
//   UseCaseRow (BD, snake_case) ↔ UseCase (dominio, camelCase)
// ============================================================

import { supabase }       from '@/lib/supabase'
import type { Json, UseCaseRow, UseCaseInsert } from '@/types/database.types'
import type { UseCase }   from '@/modules/T4_UseCasePriorityBoard/types'

// ── Mapeo BD → dominio ───────────────────────────────────────

// Alias para aplanar el cast Json → tipo de dominio (via unknown)
function cast<T>(v: unknown): T        { return v as T }
function castOpt<T>(v: unknown): T | undefined {
  return v == null ? undefined : v as T
}

export function rowToUseCase(row: UseCaseRow): UseCase {
  return {
    id:                   row.id,
    name:                 row.name,
    description:          row.description ?? undefined,
    department:           row.department,
    aiCategory:           row.ai_category,
    status:               row.status,
    sponsorName:          row.sponsor_name ?? undefined,
    responsibleItData:    row.responsible_it_data ?? undefined,
    businessObjective:    row.business_objective ?? undefined,
    importedFromT3:       castOpt<UseCase['importedFromT3']>(row.imported_from_t3),
    stakeholderScores:    cast<UseCase['stakeholderScores']>(row.stakeholder_scores) ?? [],
    scores:               cast<UseCase['scores']>(row.scores),
    priorityScore:        Number(row.priority_score),
    economics:            castOpt<UseCase['economics']>(row.economics),
    goNoGo:               castOpt<UseCase['goNoGo']>(row.go_no_go),
    roadmap:              castOpt<UseCase['roadmap']>(row.roadmap),
    t1Context:            castOpt<UseCase['t1Context']>(row.t1_context),
    t2Context:            castOpt<UseCase['t2Context']>(row.t2_context),
    aiActClassification:  castOpt<UseCase['aiActClassification']>(row.ai_act_classification),
    notes:                row.notes ?? undefined,
    createdAt:            row.created_at,
  }
}

// ── Mapeo dominio → BD ───────────────────────────────────────

// Alias para convertir cualquier valor JS a Json (Supabase acepta cualquier
// objeto serializable — el cast via unknown evita el error TS de object→Json)
function toJson<T>(v: T | undefined | null): Json {
  return (v ?? null) as unknown as Json
}

export function useCaseToInsert(uc: UseCase, engagementId: string): UseCaseInsert {
  return {
    id:                    uc.id,
    engagement_id:         engagementId,
    name:                  uc.name,
    description:           uc.description ?? null,
    department:            uc.department,
    ai_category:           uc.aiCategory,
    status:                uc.status,
    sponsor_name:          uc.sponsorName ?? null,
    responsible_it_data:   uc.responsibleItData ?? null,
    business_objective:    uc.businessObjective ?? null,
    imported_from_t3:      toJson(uc.importedFromT3),
    stakeholder_scores:    toJson(uc.stakeholderScores),
    scores:                toJson(uc.scores),
    priority_score:        uc.priorityScore,
    economics:             toJson(uc.economics),
    go_no_go:              toJson(uc.goNoGo),
    roadmap:               toJson(uc.roadmap),
    t1_context:            toJson(uc.t1Context),
    t2_context:            toJson(uc.t2Context),
    ai_act_classification: toJson(uc.aiActClassification),
    notes:                 uc.notes ?? null,
  }
}

// ── Operaciones CRUD ─────────────────────────────────────────

/** Carga todos los casos de uso de un engagement */
export async function fetchUseCases(engagementId: string): Promise<UseCase[]> {
  const { data, error } = await supabase
    .from('use_cases')
    .select('*')
    .eq('engagement_id', engagementId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`[T4] fetchUseCases: ${error.message}`)
  return (data ?? []).map(rowToUseCase)
}

/** Inserta un nuevo caso de uso */
export async function insertUseCase(uc: UseCase, engagementId: string): Promise<void> {
  const { error } = await supabase
    .from('use_cases')
    .insert(useCaseToInsert(uc, engagementId))

  if (error) throw new Error(`[T4] insertUseCase: ${error.message}`)
}

/** Actualiza un caso de uso existente (solo los campos cambiados) */
export async function updateUseCaseInDb(
  id: string,
  engagementId: string,
  updates: Partial<Omit<UseCase, 'id' | 'createdAt'>>,
): Promise<void> {
  const patch: Record<string, unknown> = {}

  if (updates.name             !== undefined) patch.name = updates.name
  if (updates.description      !== undefined) patch.description = updates.description ?? null
  if (updates.department       !== undefined) patch.department = updates.department
  if (updates.aiCategory       !== undefined) patch.ai_category = updates.aiCategory
  if (updates.status           !== undefined) patch.status = updates.status
  if (updates.sponsorName      !== undefined) patch.sponsor_name = updates.sponsorName ?? null
  if (updates.responsibleItData !== undefined) patch.responsible_it_data = updates.responsibleItData ?? null
  if (updates.businessObjective !== undefined) patch.business_objective = updates.businessObjective ?? null
  if (updates.stakeholderScores !== undefined) patch.stakeholder_scores = updates.stakeholderScores
  if (updates.scores           !== undefined) patch.scores = updates.scores
  if (updates.priorityScore    !== undefined) patch.priority_score = updates.priorityScore
  if (updates.economics        !== undefined) patch.economics = updates.economics ?? null
  if (updates.goNoGo           !== undefined) patch.go_no_go = updates.goNoGo ?? null
  if (updates.roadmap          !== undefined) patch.roadmap = updates.roadmap ?? null
  if (updates.t1Context        !== undefined) patch.t1_context = updates.t1Context ?? null
  if (updates.t2Context        !== undefined) patch.t2_context = updates.t2Context ?? null
  if (updates.aiActClassification !== undefined) patch.ai_act_classification = updates.aiActClassification ?? null
  if (updates.notes            !== undefined) patch.notes = updates.notes ?? null

  patch.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('use_cases')
    .update(patch)
    .eq('id', id)
    .eq('engagement_id', engagementId)

  if (error) throw new Error(`[T4] updateUseCaseInDb: ${error.message}`)
}

/** Elimina un caso de uso */
export async function deleteUseCaseFromDb(id: string, engagementId: string): Promise<void> {
  const { error } = await supabase
    .from('use_cases')
    .delete()
    .eq('id', id)
    .eq('engagement_id', engagementId)

  if (error) throw new Error(`[T4] deleteUseCaseFromDb: ${error.message}`)
}

/** Inserta múltiples casos de uso de golpe (útil para seed de demo data) */
export async function bulkInsertUseCases(
  useCases: UseCase[],
  engagementId: string,
): Promise<void> {
  const rows = useCases.map((uc) => useCaseToInsert(uc, engagementId))
  const { error } = await supabase.from('use_cases').insert(rows)
  if (error) throw new Error(`[T4] bulkInsertUseCases: ${error.message}`)
}
