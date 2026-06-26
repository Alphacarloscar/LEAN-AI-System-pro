import type { AICategoryCode } from '../types'
import { DOMAIN_COLORS } from '@shared/design-system/charts/chartTokens'

// ── Colores hex canónicos por categoría IA — fuente: DOMAIN_COLORS ──

export const CAT_HEX: Record<AICategoryCode, string> = {
  automatizacion_rpa:         DOMAIN_COLORS.automatizacion_rpa,
  automatizacion_inteligente: DOMAIN_COLORS.automatizacion_inteligente,
  analitica_predictiva:       DOMAIN_COLORS.analitica_predictiva,
  asistente_ia:               DOMAIN_COLORS.asistente_ia,
  optimizacion_proceso:       DOMAIN_COLORS.optimizacion_proceso,
  agéntica:                   DOMAIN_COLORS['agéntica'],
}

export const CAT_ORDER: AICategoryCode[] = [
  'automatizacion_inteligente',
  'automatizacion_rpa',
  'analitica_predictiva',
  'asistente_ia',
  'optimizacion_proceso',
  'agéntica',
]
