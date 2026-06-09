import type { AICategoryCode } from '../types'

// ── Colores hex canónicos por categoría IA ───────────────────

export const CAT_HEX: Record<AICategoryCode, string> = {
  automatizacion_inteligente: '#6A90C0',
  automatizacion_rpa:         '#5FAF8A',
  analitica_predictiva:       '#2A2822',
  asistente_ia:               '#D4A85C',
  optimizacion_proceso:       '#C06060',
  agéntica:                   '#7C3AED',
}

export const CAT_ORDER: AICategoryCode[] = [
  'automatizacion_inteligente',
  'automatizacion_rpa',
  'analitica_predictiva',
  'asistente_ia',
  'optimizacion_proceso',
  'agéntica',
]
