import { useOutletContext } from 'react-router-dom'

// ── Contexto compartido hacia las rutas hijas ─────────────────
export interface AppLayoutContext {
  dark: boolean
}

export function useAppLayout() {
  return useOutletContext<AppLayoutContext>()
}
