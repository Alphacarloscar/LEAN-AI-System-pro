// ============================================================
// Mapeo de paquetes → módulos (ADR-029 Fase 3)
//
// PACKAGE_MODULES vincula cada PackageId con sus módulos T*.
// Estos son los módulos que AppSidebar y usePermissions usan
// para determinar qué herramientas mostrar.
//
// T4 (Shared Kernel): compartido por portfolio_management y legal_compliance.
// T10 (Plataforma): presente en toda suscripción, no en paquetes.
// ============================================================

import type { PackageId } from '@/types/packages'
import type { ToolCode } from '@/types'

export const PACKAGE_MODULES: Record<PackageId, ToolCode[]> = {
  boost_assessment: ['T1', 'T2', 'T7'],
  portfolio_management: ['T3', 'T5', 'T8', 'T9', 'T11'],
  legal_compliance: ['T6', 'T12'],
}

export const PLATFORM_MODULES: ToolCode[] = ['T10']
export const SHARED_KERNEL_MODULES: ToolCode[] = ['T4']
