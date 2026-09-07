// ============================================================
// useDomainDimensions — Obtener dimensiones según dominio activo
//
// Consume useDomainSlug() y retorna las 6 dimensiones del dominio
// (AI Adoption o Transformación Digital).
// ============================================================

import { DIMENSION_DEFINITIONS } from '@/modules/T1_MaturityRadar/constants'
import { TD_DIMENSION_DEFINITIONS } from '@/modules/T1_MaturityRadar/domains/transformacion-digital'
import type { DimensionDefinition } from '@/modules/T1_MaturityRadar/constants'
import { useDomainSlug } from './useDomainSlug'

export interface DomainDimensionsResult {
  dimensions: DimensionDefinition[]
  domainSlug: string | null
  domainLabel: string | null
}

/**
 * Retorna las dimensiones correspondientes al dominio activo.
 *
 * Lógica:
 * - Si domainSlug === 'ai_adoption' → DIMENSION_DEFINITIONS (AI Adoption)
 * - Si domainSlug === 'transformacion_digital' → TD_DIMENSION_DEFINITIONS (Transformación Digital)
 * - Si domainSlug es desconocido o null → DIMENSION_DEFINITIONS (fallback) + warning
 *
 * También retorna domainSlug y domainLabel para uso en UI.
 */
export function useDomainDimensions(): DomainDimensionsResult {
  const { domainSlug, domainLabel } = useDomainSlug()

  let dimensions: DimensionDefinition[]

  switch (domainSlug) {
    case 'ai_adoption':
      dimensions = DIMENSION_DEFINITIONS
      break

    case 'transformacion_digital':
    case 'digital_transformation':
      dimensions = TD_DIMENSION_DEFINITIONS
      break

    default:
      if (domainSlug) {
        console.warn(`[useDomainDimensions] Unknown domain slug: '${domainSlug}', falling back to AI Adoption`)
      }
      dimensions = DIMENSION_DEFINITIONS
  }

  return {
    dimensions,
    domainSlug,
    domainLabel,
  }
}
