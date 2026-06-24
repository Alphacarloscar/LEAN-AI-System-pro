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
//   — T10 NO pertenece a ningún paquete: es el Dashboard Global standalone.
// ============================================================

import type { ToolCode } from '@/types'

export type PackageId =
  | 'ai-maturity'
  | 'ai-compliance'
  | 'ai-portfolio'
  | 'iso-42001'

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
  {
    id: 'iso-42001',
    commercialName: 'ISO 42001 Readiness',
    internalName: 'Evaluación ISO 42001',
    description:
      'Evaluación de preparación frente a la norma ISO/IEC 42001 de gestión de IA.',
    primaryBuyerPain:
      'Necesitamos certificarnos / prepararnos para ISO 42001 y no sé cuánto nos falta.',
    dashboardLabel: 'ISO 42001',
    tools: ['T12'],
  },
]

// ── Standalone — fuera de paquetes pero visible y clicable (gancho de venta) ──
// T10 (AI Value Dashboard) es la vista global de valor; vive en '/'.
export const STANDALONE_TOOLS: ToolCode[] = ['T10']

// ── Helpers ───────────────────────────────────────────────────
export function getPackageById(id: string): SalesPackage | undefined {
  return SALES_PACKAGES.find((p) => p.id === id)
}

/** Paquete que contiene una tool dada (o undefined si es standalone / sin paquete). */
export function getPackageForTool(code: ToolCode): SalesPackage | undefined {
  return SALES_PACKAGES.find((p) => p.tools.includes(code))
}
