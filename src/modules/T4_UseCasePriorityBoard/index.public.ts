// ============================================================
// T4 — Shared Kernel Public Interface
//
// ADR-029 Fase 2: Interfaz pública para consumo por Paquetes 2 y 3.
//
// RESTRICCIONES:
// - NO exporta useT4Store (privado a T4)
// - NO exporta componentes UI
// - Solo: hook useT4Kernel() + tipos públicos (AIActRiskLevel)
//
// USO (externo):
//   import { useT4Kernel } from '@/modules/T4_UseCasePriorityBoard/index.public'
//   const { useCases, isLoading, isLoaded, ensureLoaded } = useT4Kernel()
// ============================================================

import { useT4Store } from './store'
import type { AIActRiskLevel } from './types'

/**
 * Hook público del Shared Kernel T4.
 * Interfaz reactiva única para Paquetes 2 (T5) y 3 (T6).
 *
 * @returns {Object} Datos y acciones reactivos del kernel
 *   - useCases: UseCase[] — array de casos de uso del proyecto
 *   - isLoading: boolean — indica si está cargando (primer fetch)
 *   - isLoaded: boolean — indica si ya hay datos en caché
 *   - ensureLoaded: (engagementId, opts?) => Promise<void> — carga garantizada
 */
export function useT4Kernel() {
  const useCases = useT4Store(state => state.useCases)
  const isLoading = useT4Store(state => state.isLoading)
  const isLoaded = useT4Store(state => state.isLoaded)
  const ensureLoaded = useT4Store(state => state.ensureLoaded)

  return { useCases, isLoading, isLoaded, ensureLoaded }
}

// Tipos públicos exportados para uso en consumidores
export type { AIActRiskLevel }
