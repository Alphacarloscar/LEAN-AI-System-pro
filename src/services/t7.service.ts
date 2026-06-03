import { supabase } from '@/lib/supabase'
import type { GeneratedChangePlan } from '@/modules/T7_AdoptionHeatmap/types'

const TOOL_CODE       = 't7_plan'
const PAYLOAD_VERSION = 1
const STALE_DAYS      = 90

function staleAfterISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + STALE_DAYS)
  return d.toISOString()
}

export async function saveChangePlanOutput(
  projectId: string,
  plan:       GeneratedChangePlan,
): Promise<void> {
  const { error } = await supabase.rpc('save_tool_output', {
    p_project_id:      projectId,
    p_tool_code:       TOOL_CODE,
    p_payload:         plan as unknown as Record<string, unknown>,
    p_stale_after:     staleAfterISO(),
    p_payload_version: PAYLOAD_VERSION,
  })
  if (error) throw new Error(`[T7] saveChangePlanOutput: ${error.message}`)
}
