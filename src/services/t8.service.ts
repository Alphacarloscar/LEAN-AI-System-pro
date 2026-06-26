import { supabase } from '@/lib/supabase'
import { makeAuditable } from '@/lib/audit'
import type { Json } from '@/types/database.types'
import type { GeneratedT8Content } from '@/modules/T8_CommunicationMap/types'

const TOOL_CODE       = 't8_comms'
const PAYLOAD_VERSION = 1
const STALE_DAYS      = 90

function staleAfterISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + STALE_DAYS)
  return d.toISOString()
}

const _impl = {
  async saveCommunicationOutput(
    projectId: string,
    content:   GeneratedT8Content,
  ): Promise<void> {
    const { error } = await supabase.rpc('save_tool_output', {
      p_project_id:      projectId,
      p_tool_code:       TOOL_CODE,
      p_payload:         content as unknown as Json,
      p_stale_after:     staleAfterISO(),
      p_payload_version: PAYLOAD_VERSION,
    })
    if (error) throw new Error(`[T8] saveCommunicationOutput: ${error.message}`)
  },

  /**
   * Cache-First fallback: consulta tool_outputs en Supabase cuando el store
   * (localStorage) está vacío — por ejemplo, tras un F5 o primer acceso.
   * Retorna null si el proyecto aún no tiene contenido T8 generado.
   */
  async fetchCommunicationOutputFromDb(
    projectId: string,
  ): Promise<GeneratedT8Content | null> {
    const { data, error } = await supabase
      .from('tool_outputs')
      .select('payload')
      .eq('project_id', projectId)
      .eq('tool_code', TOOL_CODE)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`[T8] fetchCommunicationOutputFromDb: ${error.message}`)
    if (!data) return null
    return (data as { payload: unknown }).payload as GeneratedT8Content
  },
}

const _service = makeAuditable(_impl, 'services.t8')

export const { saveCommunicationOutput, fetchCommunicationOutputFromDb } = _service
