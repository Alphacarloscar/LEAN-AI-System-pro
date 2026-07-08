// ============================================================
// GOBY — toolRoutes.ts
// Fuente ÚNICA de conversión ToolCode ↔ slug de ruta y de paths.
//
// FDR-002 (Fase 1) — corrección v2 (convergencia Claude+GPT, 2026-06-24):
//   El routing real (App.tsx, Sprint 10) NO es plano "/t1…/t12":
//   las tools viven en "/t{n}/:engagementId" (param obligatorio),
//   salvo T10 que es el índice "/". La v1 de este fichero asumía
//   paths planos y producía rutas no registradas. Aquí se modela
//   correctamente: base path + requisito de engagement + helpers.
//
// Opción D de routing de paquetes: la URL de tool dentro de un
// paquete va LIMPIA, sin engagementId visible
// ("/packages/:packageId/tools/:toolSlug"). El engagement se
// resuelve por el store (las *View hacen `urlId ?? storeId`), no
// por la URL. Ver PackageEngagementGuard (FDR-002 §6/§7).
//
// Regla: ningún componente reinventa paths de tool. Todos
// consumen TOOL_ROUTE_MAP o los helpers de este fichero.
//   — Navegación legacy: SIEMPRE vía buildLegacyToolPath(code, id).
//   — Nunca navegar usando legacyBasePath directamente.
// ============================================================

import type { ToolCode } from '@/types'
import type { PackageId } from '@/config/salesPackages'

// Slug de ruta en minúscula — espejo 1:1 de ToolCode.
export type ToolRouteSlug =
  | 't1' | 't2' | 't3' | 't4' | 't5' | 't6'
  | 't7' | 't8' | 't9' | 't10' | 't11' | 't12'

export interface ToolRouteDefinition {
  code: ToolCode
  slug: ToolRouteSlug
  /** Base path legacy registrado en App.tsx (sin engagementId). Ej.: '/t1'. */
  legacyBasePath: string
  /**
   * Patrón legacy real tal como está registrado en App.tsx.
   * Solo documentación — NO navegar con esto. Ej.: '/t1/:engagementId'.
   */
  legacyPattern: string
  /** true para T1–T9, T11, T12 (necesitan engagementId). false para T10. */
  requiresEngagement: boolean
  /** true solo para T10 (vive en '/'). */
  isIndexRoute: boolean
}

// Única fuente de verdad. Refleja exactamente App.tsx (Sprint 10):
// /t{n}/:engagementId salvo T10 = '/'.
export const TOOL_ROUTE_MAP: Record<ToolCode, ToolRouteDefinition> = {
  T1:  { code: 'T1',  slug: 't1',  legacyBasePath: '/t1',  legacyPattern: '/t1/:engagementId',  requiresEngagement: true,  isIndexRoute: false },
  T2:  { code: 'T2',  slug: 't2',  legacyBasePath: '/t2',  legacyPattern: '/t2/:engagementId',  requiresEngagement: true,  isIndexRoute: false },
  T3:  { code: 'T3',  slug: 't3',  legacyBasePath: '/t3',  legacyPattern: '/t3/:engagementId',  requiresEngagement: true,  isIndexRoute: false },
  T4:  { code: 'T4',  slug: 't4',  legacyBasePath: '/t4',  legacyPattern: '/t4/:engagementId',  requiresEngagement: true,  isIndexRoute: false },
  T5:  { code: 'T5',  slug: 't5',  legacyBasePath: '/t5',  legacyPattern: '/t5/:engagementId',  requiresEngagement: true,  isIndexRoute: false },
  T6:  { code: 'T6',  slug: 't6',  legacyBasePath: '/t6',  legacyPattern: '/t6/:engagementId',  requiresEngagement: true,  isIndexRoute: false },
  T7:  { code: 'T7',  slug: 't7',  legacyBasePath: '/t7',  legacyPattern: '/t7/:engagementId',  requiresEngagement: true,  isIndexRoute: false },
  T8:  { code: 'T8',  slug: 't8',  legacyBasePath: '/t8',  legacyPattern: '/t8/:engagementId',  requiresEngagement: true,  isIndexRoute: false },
  T9:  { code: 'T9',  slug: 't9',  legacyBasePath: '/t9',  legacyPattern: '/t9/:engagementId',  requiresEngagement: true,  isIndexRoute: false },
  T10: { code: 'T10', slug: 't10', legacyBasePath: '/',    legacyPattern: '/',                  requiresEngagement: false, isIndexRoute: true  },
  T11: { code: 'T11', slug: 't11', legacyBasePath: '/t11', legacyPattern: '/t11/:engagementId', requiresEngagement: true,  isIndexRoute: false },
  T12: { code: 'T12', slug: 't12', legacyBasePath: '/t12', legacyPattern: '/t12/:engagementId', requiresEngagement: true,  isIndexRoute: false },
}

// Índice inverso slug → ToolCode, construido una vez.
const SLUG_TO_CODE: Record<string, ToolCode> = Object.values(TOOL_ROUTE_MAP)
  .reduce<Record<string, ToolCode>>((acc, route) => {
    acc[route.slug] = route.code
    return acc
  }, {})

// ── Helpers ───────────────────────────────────────────────────

export function getToolRouteDefinition(code: ToolCode): ToolRouteDefinition {
  return TOOL_ROUTE_MAP[code]
}

/** Resuelve un slug de URL (minúscula) a su ToolCode canónico, o null si no existe. */
export function toolCodeFromSlug(slug: string): ToolCode | null {
  return SLUG_TO_CODE[slug.toLowerCase()] ?? null
}

/** Slug minúscula de una tool. */
export function slugFromToolCode(code: ToolCode): ToolRouteSlug {
  return TOOL_ROUTE_MAP[code].slug
}

/**
 * Path legacy navegable de una tool. Única forma válida de navegar a legacy.
 * T10 → '/'. El resto exige engagementId: lanza si falta (fallo temprano y
 * explícito en vez de una URL rota que caería al fallback '/').
 */
export function buildLegacyToolPath(code: ToolCode, engagementId?: string | null): string {
  const route = TOOL_ROUTE_MAP[code]
  if (route.isIndexRoute) return '/'
  if (route.requiresEngagement && !engagementId) {
    throw new Error(`buildLegacyToolPath(${code}): engagementId es obligatorio.`)
  }
  return `${route.legacyBasePath}/${engagementId}`
}

/**
 * Path navegable de una tool STANDALONE (fuera de paquete) en modo flag-on.
 *   — T10 (índice) → '/'.
 *   — Resto (T12) → '/tools/:slug' (URL limpia Opción D; el engagement lo
 *     resuelve el store vía PackageEngagementGuard, no la URL).
 * Solo para tools realmente standalone (STANDALONE_TOOLS). Para tools de
 * paquete usar buildPackageToolPath; para legacy, buildLegacyToolPath.
 */
export function buildStandaloneToolPath(code: ToolCode): string {
  const route = TOOL_ROUTE_MAP[code]
  return route.isIndexRoute ? '/' : `/tools/${route.slug}`
}

/**
 * Path del dashboard de un paquete.
 * `packageId` se tipa como PackageId (no string): solo se construyen paths
 * de paquetes que existen. Validar la entrada de URL con isPackageId() antes.
 */
export function buildPackageDashboardPath(packageId: PackageId): string {
  return `/packages/${packageId}`
}

/** Path de una tool dentro del contexto de un paquete (URL limpia, sin engagementId). */
export function buildPackageToolPath(packageId: PackageId, code: ToolCode): string {
  return `/packages/${packageId}/tools/${TOOL_ROUTE_MAP[code].slug}`
}
