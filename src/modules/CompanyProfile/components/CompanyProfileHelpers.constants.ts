import type { FrictionFrequency, FrictionImpact } from '../types'

export const FREQ_COLOR: Record<FrictionFrequency, string> = {
  Baja:  'bg-success-dark',
  Media: 'bg-warning-dark',
  Alta:  'bg-danger-dark',
}

export const IMPACT_COLOR: Record<FrictionImpact, string> = {
  Bajo:  'bg-info-dark',
  Medio: 'bg-warning-dark',
  Alto:  'bg-danger-dark',
}
