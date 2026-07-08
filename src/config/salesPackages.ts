// ============================================================
// GOBY — salesPackages.ts
// Definición de los paquetes de venta (FDR-002, Fase 1).
//
// Por qué config hardcodeada y no tabla BBDD:
//   En Fase 1 los paquetes son una capa COMERCIAL y de NAVEGACIÓN,
//   no una entidad por cliente. Se migrará a BBDD solo cuando exista
//   venta modular real por cliente (decisión diferida en el FDR).
//
// Reglas (FDR-002):
//   — Las tools se referencian por ToolCode canónico ('T1'…'T12').
//   — Los paths se derivan vía toolRoutes.ts; aquí NO se escriben URLs.
//   — Fase 1 modela SOLO tools actuales. Sin abstracciones para
//     fusiones futuras (T7+T8, T3+T4): eso entra en su FDR posterior.
//   — Los paquetes son navegación, NO permisos. No tocan RLS/ADR-008.
//   — Tools standalone (fuera de todo paquete, sueltas en la nav):
//       · T10 (AI Value Dashboard) → Dashboard Global, vive en '/'.
//       · T12 (ISO 42001 Assessment) → suelta, sin desplegable.
//     Decisión Carlos 2026-06-25: T12 no merece desplegable propio (sería
//     un paquete de una sola tool → lectura de "producto a medias" en demo).
// ============================================================

import type { ToolCode } from '@/types'

export type PackageId =
  | 'ai-maturity'
  | 'ai-compliance'
  | 'ai-portfolio'

export interface SalesPackage {
  /** Identificador técnico estable (usado en rutas /packages/:packageId). */
  id: PackageId
  /** Nombre que ve el comprador en la demo. */
  commercialName: string
  /** Nombre interno de trabajo. */
  internalName: string
  /** Descripción comercial corta del paquete. */
  description: string
  /** Dolor principal del comprador que ataca el paquete (lenguaje de venta). */
  primaryBuyerPain: string
  /** Etiqueta del dashboard del paquete (vive dentro del mismo desplegable). */
  dashboardLabel: string
  /** Tools que componen el paquete en Fase 1, en orden de presentación. */
  tools: ToolCode[]
}

// Orden = orden de aparición en la navegación principal.
export const SALES_PACKAGES: SalesPackage[] = [
  {
    id: 'ai-maturity',
    commercialName: 'AI Maturity Boost',
    internalName: 'AI Readiness / Madurez',
    description:
      'Diagnóstico de madurez en IA y gestión del cambio: dónde está la organización y cómo moverla sin abrumarla.',
    primaryBuyerPain:
      'No sé dónde estamos ni por dónde empezar con IA sin abrumar a la organización.',
    dashboardLabel: 'Dashboard de Madurez',
    tools: ['T1', 'T2', 'T7', 'T8'],
  },
  {
    id: 'ai-compliance',
    commercialName: 'AI Compliance',
    internalName: 'Riesgo y Gobierno IA',
    description:
      'Política de IA corporativa sector-aware (AI Act) y mapa de riesgos de gobierno de la IA.',
    primaryBuyerPain:
      'No sé si nuestro uso de IA cumple y qué riesgos de gobierno tenemos abiertos.',
    dashboardLabel: 'Dashboard de Riesgos',
    tools: ['T6'],
  },
  {
    id: 'ai-portfolio',
    commercialName: 'AI Portfolio Management',
    internalName: 'Cartera de casos de uso y valor',
    description:
      'Identificación, priorización y roadmap de casos de uso de IA, con la cadencia de governance para sostenerlos.',
    primaryBuyerPain:
      'Tengo muchas ideas de IA pero no sé cuáles priorizar, qué valor dan, ni cómo mantener el ritmo.',
    dashboardLabel: 'Portfolio Dashboard',
    tools: ['T3', 'T4', 'T5', 'T9', 'T11'],
  },
]

// ── Standalone — fuera de paquetes pero visibles y clicables en la nav ──
//   T10 → Dashboard Global ('/').  T12 → ISO 42001 Assessment (suelta).
// Orden = orden de aparición. T10 va primero (cabecera de la nav).
//
// IMPORTANTE — distinguir dos planos (acordado con auditor GPT, B2):
//   STANDALONE_TOOLS  = plano de NAVEGACIÓN: qué tools se pintan sueltas
//                       en la sidebar (incluye T10).
//   isIndexRoute      = plano de ROUTING: T10 vive en '/', por eso NO es
//                       enrutable bajo '/tools/t10' (lo bloquea
//                       StandaloneToolRouteView vía getToolRouteDefinition).
//   → T10 está en este array (navegación) pero NO es ruta /tools (routing).
export const STANDALONE_TOOLS: ToolCode[] = ['T10', 'T12']

// ── Helpers ───────────────────────────────────────────────────

/** Conjunto de ids válidos — fuente para el type guard (evita listas duplicadas). */
const PACKAGE_IDS: readonly PackageId[] = SALES_PACKAGES.map((p) => p.id)

/**
 * Type guard: ¿es `value` un PackageId válido?
 * Úsalo al leer el packageId de la URL antes de tratarlo como PackageId
 * (la URL es entrada no confiable). Si es false → ruta inválida → NotFound.
 */
export function isPackageId(value: string): value is PackageId {
  return (PACKAGE_IDS as readonly string[]).includes(value)
}

export function getPackageById(id: string): SalesPackage | undefined {
  return SALES_PACKAGES.find((p) => p.id === id)
}

/** Paquete que contiene una tool dada (o undefined si es standalone / sin paquete). */
export function getPackageForTool(code: ToolCode): SalesPackage | undefined {
  return SALES_PACKAGES.find((p) => p.tools.includes(code))
}

/**
 * ¿Pertenece `code` al paquete `packageId`?
 * Necesario para validar combinaciones de URL como /packages/ai-maturity/tools/t6
 * (T6 NO está en ai-maturity → combinación inválida → NotFound en B2).
 */
export function isToolAllowedInPackage(packageId: PackageId, code: ToolCode): boolean {
  const pkg = getPackageById(packageId)
  return pkg ? pkg.tools.includes(code) : false
}
