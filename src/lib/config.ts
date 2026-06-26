// ============================================================
// GOBY — Configuración global de feature flags
//
// VITE_DEMO_ENABLED=true   → modo demo/staging (lean-ai-system-pro)
// VITE_DEMO_ENABLED=false  → modo producción (gobytech.vercel.app)
// Sin definir              → modo producción por defecto (opt-in demo)
// ============================================================

export const isDemoEnabled: boolean =
  import.meta.env.VITE_DEMO_ENABLED === 'true'
