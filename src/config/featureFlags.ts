// ============================================================
// GOBY — featureFlags.ts
// Lectura única de feature flags por variable de entorno.
//
// FDR-002 (Fase 1): VITE_PACKAGE_NAV_ENABLED gobierna la
// navegación por paquetes. Centralizar aquí evita comparar
// strings de env dispersos por componentes (única fuente).
//
// Convención: ausencia de la variable === false (ver .env.example).
// ============================================================

/** true si la navegación por paquetes (FDR-002) está activa. */
export function isPackageNavEnabled(): boolean {
  return import.meta.env.VITE_PACKAGE_NAV_ENABLED === 'true'
}
