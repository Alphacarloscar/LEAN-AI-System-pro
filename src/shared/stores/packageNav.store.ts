// ============================================================
// GOBY — packageNav.store.ts
// Estado de UI de la navegación por paquetes (FDR-002 §5).
//
// ADR-007: Zustand SOLO para estado de UI. Prohibido como fuente
// de verdad: activePackageId / activeToolCode → se DERIVAN de la
// URL (useParams/location), nunca se guardan aquí.
//
// Permitido aquí:
//   — isPackageSidebarCollapsed: preferencia visual (persistida).
//   — expandedPackageIds: qué desplegables están abiertos (efímero;
//     el paquete activo se auto-expande desde la URL en el sidebar).
// ============================================================

import { create }   from 'zustand'
import { persist }  from 'zustand/middleware'
import type { PackageId } from '@/config/salesPackages'

interface PackageNavStore {
  /** Preferencia visual: sidebar de paquetes colapsado. Persistida. */
  isPackageSidebarCollapsed: boolean
  /** Desplegables de paquete abiertos. Efímero (no persistido). */
  expandedPackageIds: PackageId[]

  setSidebarCollapsed:  (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  togglePackageExpanded: (id: PackageId) => void
  /** Asegura que un paquete esté expandido (idempotente). Para auto-expandir el activo. */
  ensurePackageExpanded: (id: PackageId) => void
}

export const usePackageNavStore = create<PackageNavStore>()(
  persist(
    (set, get) => ({
      isPackageSidebarCollapsed: false,
      expandedPackageIds: [],

      setSidebarCollapsed: (collapsed) => set({ isPackageSidebarCollapsed: collapsed }),

      toggleSidebarCollapsed: () =>
        set((s) => ({ isPackageSidebarCollapsed: !s.isPackageSidebarCollapsed })),

      togglePackageExpanded: (id) =>
        set((s) => ({
          expandedPackageIds: s.expandedPackageIds.includes(id)
            ? s.expandedPackageIds.filter((p) => p !== id)
            : [...s.expandedPackageIds, id],
        })),

      ensurePackageExpanded: (id) => {
        if (get().expandedPackageIds.includes(id)) return
        set((s) => ({ expandedPackageIds: [...s.expandedPackageIds, id] }))
      },
    }),
    {
      name:    'lean-package-nav',
      version: 1,
      // Solo la preferencia de colapso persiste; la expansión es de sesión.
      partialize: (s) => ({ isPackageSidebarCollapsed: s.isPackageSidebarCollapsed }),
    }
  )
)
