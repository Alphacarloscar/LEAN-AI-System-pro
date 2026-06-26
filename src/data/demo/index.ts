// ============================================================
// LEAN AI System — Barrel del módulo de datos demo
//
// Exporta todos los escenarios y utilidades para el modo demo.
// Uso:
//   import { DEMO_SCENARIOS, getDemoScenario } from '@/data/demo'
//   import { vendorSprawlScenario }             from '@/data/demo'
// ============================================================

export type { DemoScenario, DemoPattern, DemoNarrative, DemoCompanyProfile, QuickWinPreview, QwLicenceItem } from './types'

export { dataVisibilityScenario  } from './scenarios/data-visibility'
export { slowDecisionsScenario   } from './scenarios/slow-decisions'
export { vendorSprawlScenario    } from './scenarios/vendor-sprawl'
export { changeResistanceScenario} from './scenarios/change-resistance'
export { pilotChaosScenario      } from './scenarios/pilot-chaos'

import { dataVisibilityScenario   } from './scenarios/data-visibility'
import { slowDecisionsScenario    } from './scenarios/slow-decisions'
import { vendorSprawlScenario     } from './scenarios/vendor-sprawl'
import { changeResistanceScenario } from './scenarios/change-resistance'
import { pilotChaosScenario       } from './scenarios/pilot-chaos'
import type { DemoPattern, DemoScenario } from './types'

/**
 * Array ordenado de todos los escenarios demo.
 * El orden es el orden del selector en la UI.
 */
export const DEMO_SCENARIOS: DemoScenario[] = [
  vendorSprawlScenario,      // primero — es el más relevante para Javier+Susana (QW4)
  dataVisibilityScenario,
  slowDecisionsScenario,
  changeResistanceScenario,
  pilotChaosScenario,
]

/**
 * Devuelve el escenario demo para un patrón dado.
 * Fallback a vendor-sprawl si el patrón no existe.
 */
export function getDemoScenario(pattern: DemoPattern): DemoScenario {
  return DEMO_SCENARIOS.find((s) => s.id === pattern) ?? vendorSprawlScenario
}

/**
 * Escenario por defecto para arrancar la app en modo demo.
 * Vendor Sprawl es el prioritario para la demo Javier+Susana.
 */
export const DEFAULT_DEMO_SCENARIO: DemoScenario = vendorSprawlScenario
