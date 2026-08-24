// ============================================================
// usePermissions — hook centralizado de permisos: rol + paquetes
//
// Combina permisos de rol (isReadOnly, canEditCompanySettings)
// con permisos de paquetes contratados (hasPackage, hasModule).
//
// Uso:
//   const { isReadOnly, hasModule } = usePermissions()
//   {!isReadOnly && <button>Añadir</button>}
//   {hasModule('T4') && <UseCaseBoard />}
// ============================================================

import { useAuthStore } from './store'
import { useEngagementStore } from '@/modules/Engagement/store'
import type { PackageId, ToolCode } from '@/types'
import { PACKAGE_MODULES, PLATFORM_MODULES, SHARED_KERNEL_MODULES } from '@/config/packageModules'

interface Permissions {
  // Permisos por rol
  isReadOnly: boolean
  canEditCompanySettings: boolean
  // Permisos por paquete (ADR-029)
  hasPackage: (packageId: PackageId) => boolean
  hasModule: (moduleCode: ToolCode | string) => boolean
}

export function usePermissions(): Permissions {
  const { user } = useAuthStore()

  // Lee proyecto activo desde Zustand
  const projects = useEngagementStore((state) => state.projects)
  const activeId = useEngagementStore((state) => state.activeEngagementId)
  const activeProject = projects.find((p) => p.id === activeId)
  const contractedPackages = activeProject?.contracted_packages ?? []

  const hasPackage = (packageId: PackageId): boolean => {
    return contractedPackages.includes(packageId)
  }

  const hasModule = (moduleCode: ToolCode | string): boolean => {
    // T10 (plataforma) siempre disponible
    if (PLATFORM_MODULES.includes(moduleCode as ToolCode)) return true
    // T4 (shared kernel) consumible por paquetes que lo usan
    if (SHARED_KERNEL_MODULES.includes(moduleCode as ToolCode)) return true
    // Verificar si el módulo está en algún paquete contratado
    return Object.entries(PACKAGE_MODULES).some(
      ([pkg, modules]) =>
        hasPackage(pkg as PackageId) && modules.includes(moduleCode as ToolCode)
    )
  }

  return {
    isReadOnly: user?.role === 'client_viewer',
    canEditCompanySettings: user?.role === 'superadmin' || user?.role === 'consultant',
    hasPackage,
    hasModule,
  }
}
