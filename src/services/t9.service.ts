import { supabase } from '@/lib/supabase'
import { makeAuditable } from '@/lib/audit'

const _impl = {
  async createSnapshot(params: {
    engagementId: string
    createdBy:    string
    label:        string
    type?:        string
    notes?:       string
  }): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('create_snapshot', {
      p_engagement_id: params.engagementId,
      p_created_by:    params.createdBy,
      p_label:         params.label,
      p_type:          params.type ?? 'roadmap',
      p_notes:         params.notes,
    })
    if (error) throw new Error(`[T9] createSnapshot: ${error.message}`)
    return data as string
  },
}

const _service = makeAuditable(_impl, 'services.t9')

export const { createSnapshot } = _service
