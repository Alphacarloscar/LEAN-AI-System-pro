// ============================================================
// useDomainSlug — Obtener slug del dominio activo
//
// Lee domain_id + governance_domains del proyecto activo en el store.
// Retorna slug, label e id del dominio — cero queries adicionales.
// ============================================================

import { useEngagementStore } from '@/modules/Engagement/store'

export interface DomainSlugResult {
  domainId: string | null
  domainSlug: string | null
  domainLabel: string | null
}

/**
 * Obtiene el slug del dominio activo desde el proyecto seleccionado.
 * Lee directamente del array projects cargado en useEngagementStore.
 * No realiza queries adicionales — todo desde store.
 *
 * Retorna:
 * - domainId: UUID del dominio (governance_domains.id)
 * - domainSlug: e.g. 'ai_adoption', 'transformacion_digital'
 * - domainLabel: e.g. 'AI Adoption', 'Transformación Digital'
 */
export function useDomainSlug(): DomainSlugResult {
  const projects = useEngagementStore((s) => s.projects)
  const activeId = useEngagementStore((s) => s.activeEngagementId)

  if (!activeId || !projects.length) {
    return { domainId: null, domainSlug: null, domainLabel: null }
  }

  const activeProject = projects.find((p) => p.id === activeId)

  if (!activeProject || !activeProject.governance_domains) {
    return { domainId: null, domainSlug: null, domainLabel: null }
  }

  const domain = activeProject.governance_domains

  return {
    domainId: domain.id ?? null,
    domainSlug: domain.slug ?? null,
    domainLabel: domain.label ?? null,
  }
}
