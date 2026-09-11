// ============================================================
// usePermissions — hook centralizado de permisos: rol + paquetes
//
// Combina permisos por accion de rol
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
import type { UserRole } from './types'

interface CompanyProfileActionPermissions {
  canViewCompanyProfile: boolean
  canEditCompanyData: boolean
  canManageOrganization: boolean
  canManageContractedPlans: boolean
  canCreateProjects: boolean
  canEditProjects: boolean
  canDeleteProjects: boolean
}

interface Permissions extends CompanyProfileActionPermissions {
  // Compatibilidad temporal: usar canEditCompanyData en nuevas pantallas.
  isReadOnly: boolean
  canEditCompanySettings: boolean
  // Permisos por paquete (ADR-029)
  hasPackage: (packageId: PackageId) => boolean
  hasModule: (moduleCode: ToolCode | string) => boolean
}

export function canAccessAdmin(role: UserRole | null | undefined): boolean {
  return role === 'superadmin'
}

export const COMPANY_PROFILE_ROLE_PERMISSIONS: Record<UserRole, CompanyProfileActionPermissions> = {
  superadmin: {
    canViewCompanyProfile: true,
    canEditCompanyData: true,
    canManageOrganization: true,
    canManageContractedPlans: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
  },
  consultant: {
    canViewCompanyProfile: true,
    canEditCompanyData: true,
    canManageOrganization: true,
    canManageContractedPlans: false,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
  },
  client_editor: {
    canViewCompanyProfile: true,
    canEditCompanyData: false,
    canManageOrganization: false,
    canManageContractedPlans: false,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: false,
  },
  client_viewer: {
    canViewCompanyProfile: true,
    canEditCompanyData: false,
    canManageOrganization: false,
    canManageContractedPlans: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
  },
}

const CLOSED_COMPANY_PROFILE_PERMISSIONS: CompanyProfileActionPermissions = {
  canViewCompanyProfile: false,
  canEditCompanyData: false,
  canManageOrganization: false,
  canManageContractedPlans: false,
  canCreateProjects: false,
  canEditProjects: false,
  canDeleteProjects: false,
}

export function getCompanyProfilePermissions(role: UserRole | null | undefined): CompanyProfileActionPermissions {
  if (!role) return CLOSED_COMPANY_PROFILE_PERMISSIONS
  return COMPANY_PROFILE_ROLE_PERMISSIONS[role] ?? CLOSED_COMPANY_PROFILE_PERMISSIONS
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

  const companyProfilePermissions = getCompanyProfilePermissions(user?.role)

  return {
    isReadOnly: user?.role === 'client_viewer',
    canEditCompanySettings: companyProfilePermissions.canEditCompanyData,
    ...companyProfilePermissions,
    hasPackage,
    hasModule,
  }
}
