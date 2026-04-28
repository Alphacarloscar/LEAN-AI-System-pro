// ============================================================
// Engagements Service
//
// CRUD de engagements + membership.
// Todos los módulos de datos (T1-T13) están scoped a un engagement.
//
// Uso típico:
//   const engs = await listMyEngagements()
//   const eng  = await createEngagement({ name: 'Nexus S.A.' })
//   await addMember(eng.id, userId, 'viewer')
// ============================================================

import { supabase }                   from '@/lib/supabase'
import type { EngagementRow, MemberRole } from '@/types/database.types'

// ── Listar engagements del usuario autenticado ───────────────

export async function listMyEngagements(): Promise<EngagementRow[]> {
  const { data, error } = await supabase
    .from('engagements')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`[Engagements] listMyEngagements: ${error.message}`)
  return data ?? []
}

// ── Crear engagement ────────────────────────────────────────

export async function createEngagement(params: {
  name:        string
  currentPhase?: EngagementRow['current_phase']
  startDate?:  string
}): Promise<EngagementRow> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('[Engagements] Usuario no autenticado')

  const { data, error } = await supabase
    .from('engagements')
    .insert({
      name:          params.name,
      owner_id:      user.id,
      current_phase: params.currentPhase ?? 'listen',
      start_date:    params.startDate ?? null,
    })
    .select()
    .single()

  if (error || !data) throw new Error(`[Engagements] createEngagement: ${error?.message}`)

  // Auto-añadir al creador como consultant
  await supabase.from('engagement_members').insert({
    engagement_id: data.id,
    user_id:       user.id,
    role:          'consultant',
  })

  return data
}

// ── Añadir miembro ──────────────────────────────────────────

export async function addMember(
  engagementId: string,
  userId:       string,
  role:         MemberRole,
): Promise<void> {
  const { error } = await supabase
    .from('engagement_members')
    .upsert({ engagement_id: engagementId, user_id: userId, role })

  if (error) throw new Error(`[Engagements] addMember: ${error.message}`)
}

// ── Listar miembros de un engagement ────────────────────────

export async function listMembers(engagementId: string) {
  const { data, error } = await supabase
    .from('engagement_members')
    .select('*, profiles(id, email, name, role)')
    .eq('engagement_id', engagementId)

  if (error) throw new Error(`[Engagements] listMembers: ${error.message}`)
  return data ?? []
}

// ── Archivar engagement ─────────────────────────────────────

export async function archiveEngagement(engagementId: string): Promise<void> {
  const { error } = await supabase
    .from('engagements')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', engagementId)

  if (error) throw new Error(`[Engagements] archiveEngagement: ${error.message}`)
}
