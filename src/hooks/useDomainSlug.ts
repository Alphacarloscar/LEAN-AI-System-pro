// ============================================================
// useDomainSlug — Obtener slug del dominio por defecto
//
// ADR-029 reverted: Proyectos ya no tienen domain_id.
// Retorna siempre el dominio por defecto 'ai_adoption'.
// ============================================================

export interface DomainSlugResult {
  domainId: string | null
  domainSlug: string
  domainLabel: string
}

/**
 * Retorna el dominio por defecto ('ai_adoption').
 * Mantiene la interfaz compatible para no romper las vistas.
 *
 * Nota: En futuras migraciones, esto podría extenderse para soportar
 * configuración a nivel de empresa o de sesión.
 */
export function useDomainSlug(): DomainSlugResult {
  return {
    domainId: null,
    domainSlug: 'ai_adoption',
    domainLabel: 'AI Adoption',
  }
}
