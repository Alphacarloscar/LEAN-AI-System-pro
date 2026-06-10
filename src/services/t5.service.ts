// ============================================================
// T5 Service — AI Domain Architecture Canvas (Supabase)
//
// Tabla: t5_canvas — una fila por project_id (UNIQUE).
// Mapeo: T5CanvasRow (snake_case) ↔ T5Canvas (camelCase).
// ============================================================

import { supabase }  from '@/lib/supabase'
import type { Json, T5CanvasRow, T5CanvasInsert } from '@/types/database.types'
import type { T5Canvas, T5DomainCode, T5DomainAssessment, T5MaturityLevel } from '@/modules/T5_AITaxonomyCanvas/types'

// ── Mapeo BD → dominio ───────────────────────────────────────

function rowToCanvas(row: T5CanvasRow): T5Canvas {
  return {
    id:                 row.id,
    companyName:        row.company_name,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    domains:            (row.domains ?? {}) as Record<T5DomainCode, T5DomainAssessment>,
    maturityLevel:      row.maturity_level as T5MaturityLevel,
    activationSequence: (row.activation_sequence ?? []) as T5DomainCode[],
    notes:              row.notes ?? undefined,
  }
}

// ── Operaciones ───────────────────────────────────────────────

/** Carga el canvas T5 de un proyecto. Retorna null si aún no existe fila. */
export async function getT5Canvas(projectId: string): Promise<T5Canvas | null> {
  const { data, error } = await supabase
    .from('t5_canvas')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw new Error(`[T5] getT5Canvas: ${error.message}`)
  return data ? rowToCanvas(data) : null
}

/** Inserta o actualiza el canvas T5 de un proyecto (upsert por project_id). */
export async function upsertT5Canvas(projectId: string, canvas: T5Canvas): Promise<void> {
  const row: T5CanvasInsert & { updated_at: string } = {
    project_id:          projectId,
    company_name:        canvas.companyName,
    domains:             canvas.domains as unknown as Json,
    maturity_level:      canvas.maturityLevel,
    activation_sequence: canvas.activationSequence as unknown as Json,
    notes:               canvas.notes ?? null,
    updated_at:          new Date().toISOString(),
  }

  const { error } = await supabase
    .from('t5_canvas')
    .upsert(row, { onConflict: 'project_id' })

  if (error) throw new Error(`[T5] upsertT5Canvas: ${error.message}`)
}
