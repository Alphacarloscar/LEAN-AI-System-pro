// ============================================================
// useDomainMaturityConfig — Bandas de madurez global según dominio activo
//
// Mismo patrón que useDomainDimensions: MATURITY_TIER_CONFIG (AI Adoption,
// default/fallback) vs TD_MATURITY_TIER_CONFIG (Transformación Digital).
// Rango numérico y color son idénticos entre dominios — solo cambia el
// texto (label/description) para no hablar de "IA" en un proyecto TD.
// ============================================================

import { MATURITY_TIER_CONFIG } from '@/modules/T1_MaturityRadar/types'
import { TD_MATURITY_TIER_CONFIG } from '@/modules/T1_MaturityRadar/domains/transformacion-digital'
import type { MaturityTier, TierConfig } from '@/modules/T1_MaturityRadar/types'
import { useDomainSlug } from './useDomainSlug'

/**
 * Retorna la tabla de bandas de madurez (MATURITY_TIER_CONFIG) correspondiente
 * al dominio activo. Misma lógica de fallback que useDomainDimensions: dominio
 * desconocido o null → AI Adoption (default histórico).
 */
export function useDomainMaturityConfig(): Record<MaturityTier, TierConfig> {
  const { domainSlug } = useDomainSlug()

  switch (domainSlug) {
    case 'transformacion_digital':
    case 'digital_transformation':
      return TD_MATURITY_TIER_CONFIG

    case 'ai_adoption':
    default:
      return MATURITY_TIER_CONFIG
  }
}
