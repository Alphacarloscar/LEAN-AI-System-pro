// ============================================================
// usePermissions — hook centralizado de permisos de rol
//
// Única fuente de verdad para decisiones de UI basadas en rol.
// Añadir aquí cualquier permiso futuro (canExport, canInvite…).
//
// Uso:
//   const { isReadOnly } = usePermissions()
//   {!isReadOnly && <button>Añadir</button>}
// ============================================================

import { useAuthStore } from './store'

interface Permissions {
  /** true únicamente para client_viewer — no puede modificar datos */
  isReadOnly: boolean
  /**
   * true solo para superadmin y consultant.
   * Controla el Tab Empresa (sector, tamaño, departamentos).
   * client_editor y client_viewer no pueden modificar datos a nivel empresa.
   */
  canEditCompanySettings: boolean
}

export function usePermissions(): Permissions {
  const { user } = useAuthStore()
  return {
    isReadOnly:             user?.role === 'client_viewer',
    canEditCompanySettings: user?.role === 'superadmin' || user?.role === 'consultant',
  }
}
