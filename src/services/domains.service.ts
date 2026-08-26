// ============================================================
// Domains Service
//
// Carga dominios disponibles para selectores en formularios.
// Usado por: ProjectsTab (selector de dominio al crear proyecto)
//
// Dato importante: governance_domains tiene RLS permisivo
// (SELECT para todos los autenticados), así que no hay restricción
// de acceso. Cualquier usuario autenticado puede leer el catálogo.
// ============================================================

import { supabase } from '@/lib/supabase'

export interface GovernanceDomain {
  id: string
  slug: string
  label: string
}

const _impl = {
  async loadActiveDomains(): Promise<GovernanceDomain[]> {
    const { data, error } = await (supabase
      .from('governance_domains' as any)
      .select('id, slug, label')
      .eq('is_active', true)
      .order('label', { ascending: true }) as any)

    if (error) {
      console.error('[Domains] loadActiveDomains failed:', error.message)
      return []
    }

    return (data ?? []) as GovernanceDomain[]
  },
}

export const { loadActiveDomains } = _impl
