import { supabase } from '@/lib/supabase'
import type { GeneratedPolicyContent } from '@/modules/T6_RiskGovernance/types'

const TOOL_CODE       = 't6_policy'
const PAYLOAD_VERSION = 1
const STALE_DAYS      = 90

function staleAfterISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + STALE_DAYS)
  return d.toISOString()
}

export async function savePolicyOutput(
  projectId: string,
  policy:    GeneratedPolicyContent,
): Promise<void> {
  const { error } = await supabase.rpc('save_tool_output', {
    p_project_id:      projectId,
    p_tool_code:       TOOL_CODE,
    p_payload:         policy as unknown as Record<string, unknown>,
    p_stale_after:     staleAfterISO(),
    p_payload_version: PAYLOAD_VERSION,
  })
  if (error) throw new Error(`[T6] savePolicyOutput: ${error.message}`)
}
