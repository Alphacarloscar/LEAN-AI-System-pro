import { supabase } from '@/lib/supabase'
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

export async function saveCommunicationOutput(
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
}
