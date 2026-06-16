// ============================================================
// T1 Service — AI Maturity Scores (Supabase)
//
// Capa de acceso a datos para la tabla t1_dimension_scores.
// Cada fila = un score de subdimensión para un entrevistado.
//
// Modelo:
//   — 1 fila por (engagement, interviewee, dimension, subdimension)
//   — UPSERT con onConflict en la UNIQUE constraint de la migración 003
//   — Reconstrucción de T1DimensionState[] al cargar desde BD
//
// Requiere migración 003_t1_multiinterviewee.sql ejecutada.
// ============================================================

import { supabase }             from '@/lib/supabase'
import { makeAuditable }          from '@/lib/audit'
import type { T1DimensionScoreInsert } from '@/types/database.types'
import { DIMENSION_DEFINITIONS }       from '@/modules/T1_MaturityRadar/constants'
import type {
  T1DimensionState,
  T1SubdimensionState,
  T1IntervieweeContext,
} from '@/modules/T1_MaturityRadar/types'

// ── Tipos internos ───────────────────────────────────────────

export interface T1LoadResult {
  interviewees:   T1IntervieweeContext[]
  dimensionStates: Record<string, T1DimensionState[]>
}

// ── Helpers ──────────────────────────────────────────────────

/** Construye dimensiones vacías (sin puntuar) para un entrevistado nuevo */
export function buildBlankDimensions(): T1DimensionState[] {
  return DIMENSION_DEFINITIONS.map((def) => ({
    code:          def.code,
    label:         def.label,
    dimNumber:     def.dimNumber,
    subdimensions: def.subdimensions.map((sub): T1SubdimensionState => ({
      code:          sub.code,
      label:         sub.label,
      dimensionCode: def.code,
      score:         null,
      evidence:      '',
      showCriteria:  false,
      showEvidence:  false,
    })),
  }))
}

/** Construye dimensiones aplicando los scores recibidos de BD */
function buildDimensionsFromRows(
  rows: { dimension_code: string; subdimension_code: string; score: number | null; evidence: string }[]
): T1DimensionState[] {
  const scoreMap = new Map(
    rows.map((r) => [`${r.dimension_code}::${r.subdimension_code}`, r])
  )

  return DIMENSION_DEFINITIONS.map((def) => ({
    code:          def.code,
    label:         def.label,
    dimNumber:     def.dimNumber,
    subdimensions: def.subdimensions.map((sub): T1SubdimensionState => {
      const key = `${def.code}::${sub.code}`
      const row = scoreMap.get(key)
      return {
        code:          sub.code,
        label:         sub.label,
        dimensionCode: def.code,
        score:         row?.score ?? null,
        evidence:      row?.evidence ?? '',
        showCriteria:  false,
        showEvidence:  !!(row?.evidence),
      }
    }),
  }))
}

// ── Implementación privada ───────────────────────────────────

const _impl = {
  /**
   * Carga todos los scores T1 de un engagement y los reconstruye
   * como { interviewees, dimensionStates }.
   * Devuelve vacío (no error) si el proyecto no tiene datos T1 aún.
   */
  async fetchT1Data(projectId: string): Promise<T1LoadResult> {
    const { data, error } = await supabase
      .from('t1_dimension_scores')
      .select('dimension_code,subdimension_code,score,evidence,interviewee_id,interviewee_name,interviewee_role,interviewee_type,interviewee_department')
      .eq('project_id', projectId)

    if (error) throw new Error(`[T1] fetchT1Data: ${error.message}`)

    if (!data || data.length === 0) {
      return { interviewees: [], dimensionStates: {} }
    }

    // Agrupar filas por interviewee_id
    const byInterviewee = new Map<string, typeof data>()
    for (const row of data) {
      const key = row.interviewee_id ?? '__shared__'
      if (!byInterviewee.has(key)) byInterviewee.set(key, [])
      byInterviewee.get(key)!.push(row)
    }

    const interviewees: T1IntervieweeContext[] = []
    const dimensionStates: Record<string, T1DimensionState[]> = {}

    for (const [intervieweeId, rows] of byInterviewee.entries()) {
      const firstRow = rows[0]
      const ctx: T1IntervieweeContext = {
        id:         intervieweeId === '__shared__' ? 'shared' : intervieweeId,
        name:       firstRow.interviewee_name ?? 'Sin nombre',
        role:       firstRow.interviewee_role ?? '',
        archetype:  firstRow.interviewee_type === 'it' ? 'Ejecutivo TI' : 'Líder de Negocio',
        type:       (firstRow.interviewee_type as 'it' | 'business') ?? 'business',
        department: firstRow.interviewee_department ?? '',
      }
      interviewees.push(ctx)
      dimensionStates[ctx.id] = buildDimensionsFromRows(rows)
    }

    return { interviewees, dimensionStates }
  },

  /**
   * Guarda (inserta o actualiza) el score de una subdimensión
   * para un entrevistado específico.
   * Usa UPSERT con onConflict en la constraint 003.
   */
  async upsertT1Score(params: {
    projectId?:            string
    engagementId?:         string
    intervieweeId:         string
    intervieweeName:       string
    intervieweeRole:       string
    intervieweeType:       'it' | 'business'
    intervieweeDepartment: string
    dimensionCode:         string
    subdimensionCode:      string
    score:                 number | null
    evidence:              string
  }): Promise<void> {
    const projectId = params.projectId ?? params.engagementId
    if (!projectId) throw new Error('[T1] upsertT1Score: projectId is required')
    const row: T1DimensionScoreInsert = {
      project_id:             projectId,
      dimension_code:         params.dimensionCode,
      subdimension_code:      params.subdimensionCode,
      score:                  params.score,
      evidence:               params.evidence,
      interviewee_id:         params.intervieweeId,
      interviewee_name:       params.intervieweeName,
      interviewee_role:       params.intervieweeRole,
      interviewee_type:       params.intervieweeType,
      interviewee_department: params.intervieweeDepartment || null,
    }

    const { error } = await supabase
      .from('t1_dimension_scores')
      .upsert(row, {
        onConflict: 'project_id,dimension_code,subdimension_code,interviewee_id',
        ignoreDuplicates: false,
      })

    if (error) throw new Error(`[T1] upsertT1Score: ${error.message}`)
  },

  /**
   * Guarda todos los scores de un entrevistado de golpe.
   * Útil al añadir un nuevo entrevistado con dimensiones iniciales.
   */
  async upsertAllScoresForInterviewee(params: {
    projectId?:            string
    engagementId?:         string
    intervieweeId:         string
    intervieweeName:       string
    intervieweeRole:       string
    intervieweeType:       'it' | 'business'
    intervieweeDepartment: string
    dimensions:            T1DimensionState[]
  }): Promise<void> {
    const projectId = params.projectId ?? params.engagementId
    if (!projectId) throw new Error('[T1] upsertAllScoresForInterviewee: projectId is required')
    const rows: T1DimensionScoreInsert[] = []

    for (const dim of params.dimensions) {
      for (const sub of dim.subdimensions) {
        rows.push({
        project_id:             projectId,
          dimension_code:         dim.code,
          subdimension_code:      sub.code,
          score:                  sub.score,
          evidence:               sub.evidence,
          interviewee_id:         params.intervieweeId,
          interviewee_name:       params.intervieweeName,
          interviewee_role:       params.intervieweeRole,
          interviewee_type:       params.intervieweeType,
          interviewee_department: params.intervieweeDepartment || null,
        })
      }
    }

    const { error } = await supabase.rpc('bulk_upsert_t1_scores', {
      p_scores: rows,
    })

    if (error) throw new Error(`[T1] upsertAllScoresForInterviewee: ${error.message}`)
  },

  /** Elimina todos los scores de un entrevistado de un engagement */
  async deleteIntervieweeScores(
    projectId: string,
    intervieweeId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('t1_dimension_scores')
      .delete()
      .eq('project_id', projectId)
      .eq('interviewee_id', intervieweeId)

    if (error) throw new Error(`[T1] deleteIntervieweeScores: ${error.message}`)
  },
}

// ── Punto de exportación auditado ────────────────────────────

const _service = makeAuditable(_impl, 'services.t1')

export const {
  fetchT1Data,
  upsertT1Score,
  upsertAllScoresForInterviewee,
  deleteIntervieweeScores,
} = _service
