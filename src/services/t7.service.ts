import { supabase } from '@/lib/supabase'
import { makeAuditable } from '@/lib/audit'
import type { Json } from '@/types/database.types'
import type { GeneratedChangePlan } from '@/modules/T7_AdoptionHeatmap/types'

const TOOL_CODE       = 't7_plan'
const PAYLOAD_VERSION = 1
const STALE_DAYS      = 90

function staleAfterISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + STALE_DAYS)
  return d.toISOString()
}

const _impl = {
  async saveChangePlanOutput(
    projectId: string,
    plan:       GeneratedChangePlan,
  ): Promise<void> {
    const { error } = await supabase.rpc('save_tool_output', {
      p_project_id:      projectId,
      p_tool_code:       TOOL_CODE,
      p_payload:         plan as unknown as Json,
      p_stale_after:     staleAfterISO(),
      p_payload_version: PAYLOAD_VERSION,
    })
    if (error) throw new Error(`[T7] saveChangePlanOutput: ${error.message}`)
  },

  /**
   * Cache-First fallback: consulta tool_outputs en Supabase cuando el store
   * (localStorage) está vacío — por ejemplo, tras un F5 o primer acceso.
   * Retorna null si el proyecto aún no tiene un plan de cambio generado.
   */
  async fetchChangePlanFromDb(
    projectId: string,
  ): Promise<GeneratedChangePlan | null> {
    const { data, error } = await supabase
      .from('tool_outputs')
      .select('payload')
      .eq('project_id', projectId)
      .eq('tool_code', TOOL_CODE)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`[T7] fetchChangePlanFromDb: ${error.message}`)
    if (!data) return null
    return (data as { payload: unknown }).payload as GeneratedChangePlan
  },
}

const _service = makeAuditable(_impl, 'services.t7')

export const { saveChangePlanOutput, fetchChangePlanFromDb } = _service
