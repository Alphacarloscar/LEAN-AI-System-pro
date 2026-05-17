// ============================================================
// GOBY — Configuración global de feature flags
//
// VITE_DEMO_ENABLED=false  → modo producción (gobytech.vercel.app)
// VITE_DEMO_ENABLED=true   → modo demo/staging (lean-ai-system-pro)
// Sin definir              → modo demo activo por defecto
// ============================================================

export const isDemoEnabled: boolean =
  import.meta.env.VITE_DEMO_ENABLED !== 'false'
