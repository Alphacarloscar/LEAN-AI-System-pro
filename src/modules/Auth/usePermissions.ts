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
}

export function usePermissions(): Permissions {
  const { user } = useAuthStore()
  return {
    isReadOnly: user?.role === 'client_viewer',
  }
}
