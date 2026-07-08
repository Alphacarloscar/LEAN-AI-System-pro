// ============================================================
// GOBY — PackageEngagementGuard (FDR-002, Fase 1 · Bloque 2)
//
// Guard de LAYOUT (renderiza <Outlet/>): envuelve todas las rutas de
// paquete/standalone que requieren engagement activo. Se usa una sola
// vez como ruta padre → cero duplicación del guard por vista.
//
// Por qué existe (Opción D): las rutas de paquete usan URL LIMPIA, sin
// engagementId visible. Las *View resuelven `urlId ?? storeId` → en
// contexto de paquete SIEMPRE cae al store. Hay que GARANTIZAR que el
// store tiene engagement activo antes de montar la vista.
//
// Reglas:
//   — Hay engagement activo → renderiza la ruta hija (<Outlet/>).
//   — No hay y aún carga (loadMyProjects) → spinner.
//   — No hay y la carga terminó → redirige a '/' (Dashboard Global),
//     donde el EngagementSelector permite elegir uno. (Sin "ruta
//     pendiente" en Fase 1: decisión Claude↔GPT, demo > estado extra.)
//
// NOTA sobre carrera datos/engagement (planteada por GPT en B2):
//   NO se valida aquí "runtime listo". El stale-data está blindado en
//   el store: selectEngagement() llama resetAllEngagementStores() ANTES
//   de cambiar activeEngagementId, y cada View carga lo suyo vía
//   ensureLoaded() con sus propios estados loading/empty. No hay señal
//   global isReady que validar (ProjectRuntimeProvider no carga datos).
//
// ADR-007: solo lee estado de UI/sesión del store; no toca Supabase.
// ============================================================

import { Navigate, Outlet }     from 'react-router-dom'
import { Spinner }              from '@shared/design-system/components'
import { useEngagementStore }   from '@/modules/Engagement/store'

export function PackageEngagementGuard() {
  const activeEngagementId = useEngagementStore((s) => s.activeEngagementId)
  const isLoading          = useEngagementStore((s) => s.isLoading)

  if (!activeEngagementId) {
    if (isLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <Spinner size="lg" label="Cargando engagement…" className="text-navy" />
        </div>
      )
    }
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
