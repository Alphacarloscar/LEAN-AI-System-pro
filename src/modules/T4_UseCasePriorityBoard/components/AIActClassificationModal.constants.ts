import type { LucideIcon } from 'lucide-react'
import { Ban, AlertCircle, AlertTriangle, CheckCircle, Circle } from 'lucide-react'
import type { AIActScope } from '../types'

export const AIACT_ICON_MAP: Record<string, LucideIcon> = {
  'ban':            Ban,
  'alert-circle':   AlertCircle,
  'alert-triangle': AlertTriangle,
  'check-circle':   CheckCircle,
  'circle':         Circle,
}

export const AIACT_RISK_CONFIG = {
  prohibido:      { label: 'Prohibido',       badgeBg: 'bg-red-100 dark:bg-red-900/30',      badgeText: 'text-red-700 dark:text-red-300',   hex: '#DC2626', icon: 'ban' },
  alto:           { label: 'Alto riesgo',     badgeBg: 'bg-danger-light dark:bg-red-900/20', badgeText: 'text-danger-dark',                 hex: '#EA580C', icon: 'alert-circle' },
  limitado:       { label: 'Riesgo limitado', badgeBg: 'bg-warning-light',                  badgeText: 'text-warning-dark',                hex: '#D97706', icon: 'alert-triangle' },
  minimo:         { label: 'Riesgo mínimo',   badgeBg: 'bg-success-light',                  badgeText: 'text-success-dark',                hex: '#16A34A', icon: 'check-circle' },
  sin_clasificar: { label: 'Sin clasificar',  badgeBg: 'bg-warm-100 dark:bg-warm-700',       badgeText: 'text-warm-500 dark:text-warm-400', hex: '#94A3B8', icon: 'circle' },
} as const

export const AIACT_SCOPE_LABELS: Record<AIActScope, string> = {
  rrhh:                 'RRHH — Selección, evaluación o formación de personas',
  financiero_clientes:  'Financiero — Crédito, scoring o seguros a clientes',
  salud:                'Salud o servicios sanitarios',
  infraestructura:      'Infraestructura crítica (energía, transporte, agua)',
  seguridad:            'Seguridad — Identificación o control de acceso',
  educacion:            'Educación — Evaluación o acceso a formación',
  administracion:       'Administración pública o justicia',
  operaciones_internas: 'Operaciones internas (back-office, procesos)',
  cliente_marketing:    'Atención al cliente, marketing o ventas',
}
