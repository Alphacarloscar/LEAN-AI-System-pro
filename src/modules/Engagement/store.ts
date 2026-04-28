// ============================================================
// Engagement Store
//
// Gestiona el engagement activo en la sesión.
// Un consultor puede tener múltiples engagements (multi-client).
// Este store trackea cuál está seleccionado ahora mismo.
//
// Flujo:
//   1. Tras login → loadMyEngagements()
//   2. Si hay uno solo → auto-select
//   3. Si hay varios → mostrar selector (Sprint 4 UI)
//   4. selectEngagement(id) → el resto de stores cargan sus datos
// ============================================================

import { create }                     from 'zustand'
import { persist }                    from 'zustand/middleware'
import { listMyEngagements, createEngagement } from '@/services/engagements.service'
import type { EngagementRow }         from '@/types/database.types'

interface EngagementStore {
  engagements:        EngagementRow[]
  activeEngagementId: string | null
  isLoading:          boolean

  // Carga los engagements del usuario logueado
  loadMyEngagements:  () => Promise<void>
  // Selecciona el engagement activo (y notifica a los stores T1-T6)
  selectEngagement:   (id: string) => void
  // Crea un nuevo engagement y lo selecciona
  createAndSelect:    (name: string) => Promise<EngagementRow>
  // Limpia el estado al logout
  reset:              () => void
}

export const useEngagementStore = create<EngagementStore>()(
  persist(
    (set, get) => ({
      engagements:        [],
      activeEngagementId: null,
      isLoading:          false,

      loadMyEngagements: async () => {
        set({ isLoading: true })
        try {
          const engagements = await listMyEngagements()
          set({ engagements, isLoading: false })

          // Auto-select si hay exactamente uno
          const { activeEngagementId } = get()
          if (!activeEngagementId && engagements.length === 1) {
            set({ activeEngagementId: engagements[0].id })
          }
          // Si el activeEngagementId guardado ya no existe → limpiar
          if (
            activeEngagementId &&
            !engagements.find((e) => e.id === activeEngagementId)
          ) {
            set({ activeEngagementId: engagements[0]?.id ?? null })
          }
        } catch (err) {
          console.error('[EngagementStore] loadMyEngagements:', err)
          set({ isLoading: false })
        }
      },

      selectEngagement: (id) => {
        set({ activeEngagementId: id })
      },

      createAndSelect: async (name) => {
        set({ isLoading: true })
        try {
          const engagement = await createEngagement({ name })
          set((s) => ({
            engagements:        [...s.engagements, engagement],
            activeEngagementId: engagement.id,
            isLoading:          false,
          }))
          return engagement
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      reset: () => set({ engagements: [], activeEngagementId: null, isLoading: false }),
    }),
    {
      name:       'lean-active-engagement',
      version:    1,
      // Solo persistir el ID activo, no la lista completa (puede quedar stale)
      partialize: (s) => ({ activeEngagementId: s.activeEngagementId }),
    }
  )
)
