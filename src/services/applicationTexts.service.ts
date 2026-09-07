import { supabase } from '@/lib/supabase'
import type { ApplicationTextsRow } from '@/types/database.types'

export async function listApplicationTexts(filters?: { toolModule?: string }): Promise<ApplicationTextsRow[]> {
  let query = (supabase
    .from('application_texts' as any)
    .select('*')
    .order('tool_module', { ascending: true })
    .order('text_key', { ascending: true }) as any)

  if (filters?.toolModule && filters.toolModule !== 'all') {
    query = query.eq('tool_module', filters.toolModule)
  }

  const { data, error } = await query

  if (error) throw error
  return (data ?? []) as ApplicationTextsRow[]
}

export async function updateApplicationText(
  id: string,
  updates: Partial<ApplicationTextsRow>,
): Promise<void> {
  const { error } = await (supabase
    .from('application_texts' as any)
    .update(updates)
    .eq('id', id) as any)

  if (error) throw error
}
