// ============================================================
// GOBY — toolRoutes.ts
// Fuente ÚNICA de conversión ToolCode ↔ slug de ruta.
//
// FDR-002 (Fase 1): la navegación por paquetes introduce rutas
// /packages/:packageId/tools/:toolSlug con slug en minúscula,
// mientras el dominio usa ToolCode en MAYÚSCULA ('T1'…'T12').
// Este módulo es la única autoridad para traducir entre ambos
// y para conocer el path legacy de cada herramienta.
//
// Regla: ningún componente reinventa paths de tool. Todos
// consumen TOOL_ROUTE_MAP o los helpers de este fichero.
// ============================================================

import type { ToolCode } from '@/types'

// Slug de ruta en minúscula — espejo 1:1 de ToolCode.
export type ToolRouteSlug =
  | 't1' | 't2' | 't3' | 't4' | 't5' | 't6'
  | 't7' | 't8' | 't9' | 't10' | 't11' | 't12'

export interface ToolRoute {
  /** Ruta legacy existente (no destructiva). T10 vive en '/'. */
  legacyPath: string
  /** Slug minúscula para rutas de paquete /packages/:id/tools/:slug */
  slug: ToolRouteSlug
}

// Única fuente de verdad. legacyPath replica exactamente las rutas
// ya registradas en App.tsx (Sprint 10): /t1…/t12 salvo T10 = '/'.
export const TOOL_ROUTE_MAP: Record<ToolCode, ToolRoute> = {
  T1:  { legacyPath: '/t1',  slug: 't1'  },
  T2:  { legacyPath: '/t2',  slug: 't2'  },
  T3:  { legacyPath: '/t3',  slug: 't3'  },
  T4:  { legacyPath: '/t4',  slug: 't4'  },
  T5:  { legacyPath: '/t5',  slug: 't5'  },
  T6:  { legacyPath: '/t6',  slug: 't6'  },
  T7:  { legacyPath: '/t7',  slug: 't7'  },
  T8:  { legacyPath: '/t8',  slug: 't8'  },
  T9:  { legacyPath: '/t9',  slug: 't9'  },
  T10: { legacyPath: '/',    slug: 't10' },
  T11: { legacyPath: '/t11', slug: 't11' },
  T12: { legacyPath: '/t12', slug: 't12' },
}

// Índice inverso slug → ToolCode, construido una vez.
const SLUG_TO_CODE: Record<string, ToolCode> = Object.entries(TOOL_ROUTE_MAP)
  .reduce<Record<string, ToolCode>>((acc, [code, route]) => {
    acc[route.slug] = code as ToolCode
    return acc
  }, {})

/** Resuelve un slug de URL (minúscula) a su ToolCode canónico, o null si no existe. */
export function toolCodeFromSlug(slug: string): ToolCode | null {
  return SLUG_TO_CODE[slug.toLowerCase()] ?? null
}

/** Slug minúscula de una tool. */
export function slugForToolCode(code: ToolCode): ToolRouteSlug {
  return TOOL_ROUTE_MAP[code].slug
}

/** Path legacy de una tool (no destructivo). */
export function legacyPathForToolCode(code: ToolCode): string {
  return TOOL_ROUTE_MAP[code].legacyPath
}

/** Path de la tool dentro del contexto de un paquete. */
export function packageToolPath(packageId: string, code: ToolCode): string {
  return `/packages/${packageId}/tools/${TOOL_ROUTE_MAP[code].slug}`
}
