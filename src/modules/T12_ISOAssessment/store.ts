// ============================================================
// T12 — Zustand store
//
// Gestiona los 25 controles ISO 42001 con workflow de
// aprobación de 4 estados.
//
// Import desde T6: mapea los controles de T6 (14) a T12 (25)
// cuando coincide t6Ref, usando el estado de T6 como base.
//
// Sprint 5: persist local (localStorage). Supabase en Sprint 6.
// ============================================================

import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { T12Control, T12Status } from './types'
import { T12_BASE_CONTROLS } from './constants'

// ── Helpers ───────────────────────────────────────────────────

function buildInitialControls(): T12Control[] {
  return T12_BASE_CONTROLS.map((c) => ({
    ...c,
    status:         'no_iniciado' as T12Status,
    importedFromT6: false,
    evidence:       '',
    reviewNote:     '',
  }))
}

// Mapeo de estados T6 → T12
function mapT6Status(t6Status: string): T12Status {
  if (t6Status === 'implementado') return 'aprobado'
  if (t6Status === 'en_progreso')  return 'en_progreso'
  return 'no_iniciado'
}

// ── Store ─────────────────────────────────────────────────────

interface T12Store {
  controls: T12Control[]

  /** Actualiza estado, evidencia y nota de revisión de un control */
  updateControl: (
    id:          string,
    patch:       Partial<Pick<T12Control, 'status' | 'evidence' | 'reviewNote'>>,
  ) => void

  /**
   * Importa estados desde T6 store.
   * Solo afecta controles con t6Ref definido que estén en 'no_iniciado'.
   * Devuelve el número de controles importados.
   */
  importFromT6: (t6Controls: { id: string; status: string; notes?: string }[]) => number

  /** Resetea todos los controles a estado inicial */
  resetAll: () => void
}

export const useT12Store = create<T12Store>()(
  persist(
    (set) => ({
      controls: buildInitialControls(),

      // ── updateControl ────────────────────────────────────────
      updateControl: (id, patch) => {
        set((state) => ({
          controls: state.controls.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        }))
      },

      // ── importFromT6 ─────────────────────────────────────────
      importFromT6: (t6Controls) => {
        const t6Map = new Map(t6Controls.map((c) => [c.id, c]))
        let imported = 0

        set((state) => ({
          controls: state.controls.map((c) => {
            if (!c.t6Ref) return c
            const t6 = t6Map.get(c.t6Ref)
            if (!t6) return c
            // Solo importamos si el control T12 está sin iniciar
            // o si no ha sido previamente importado
            if (c.importedFromT6 || c.status !== 'no_iniciado') return c
            const mappedStatus = mapT6Status(t6.status)
            if (mappedStatus === 'no_iniciado') return c  // nada que importar
            imported++
            return {
              ...c,
              status:         mappedStatus,
              evidence:       t6.notes ?? c.evidence,
              importedFromT6: true,
            }
          }),
        }))

        // Devolver el conteo desde el estado actualizado
        return imported
      },

      // ── resetAll ─────────────────────────────────────────────
      resetAll: () => set({ controls: buildInitialControls() }),
    }),
    { name: 'lean-t12-iso-assessment', version: 1 },
  ),
)
