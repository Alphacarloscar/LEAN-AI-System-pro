// ============================================================
// usePackagePanel — Determina si un panel está activo
//
// Hook simple que consulta usePermissions().hasPackage()
// para decidir si renderizar el panel activo o preview.
// ============================================================

import { usePermissions } from '@/modules/Auth'
import type { PackageId } from '@/types'

export interface UsePackagePanelResult {
  isActive: boolean
}

export function usePackagePanel(packageId: PackageId): UsePackagePanelResult {
  const { hasPackage } = usePermissions()
  const isActive = hasPackage(packageId)

  return { isActive }
}
