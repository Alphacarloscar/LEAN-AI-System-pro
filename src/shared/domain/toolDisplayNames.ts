// ============================================================
// toolDisplayNames — Nombre visible por dominio para T1–T13
//
// Los códigos T1–T13 son invariantes (código, permisos, ADRs).
// Solo el nombre visible al usuario cambia por dominio — nunca el
// slot. Ver doc "Textos dominio Transformación Digital" (panel
// ROL-24..29), sección "Nombres de herramientas por dominio".
//
// Regla de particularización aplicada por el panel:
//   - Nombre incluye "AI"/"IA" o un estándar propio del dominio IA
//     (ISO 42001) → particularizar.
//   - Nombre metodológicamente neutro (Stakeholder, Value Stream,
//     Communication, Risk & Governance, Adoption Heatmap, Operating
//     Rhythm, Portfolio Management) → se mantiene igual en ambos
//     dominios, no se lista aquí.
// ============================================================

import type { ToolCode } from '@/types'

/**
 * Overrides de nombre visible para el dominio Transformación Digital.
 * Solo se listan los slots cuyo nombre AI Adoption no aplica (T2/T3/T6/
 * T7/T8/T10/T11/T13 son dominio-agnósticos y no tienen entrada aquí).
 */
export const TD_TOOL_DISPLAY_NAMES: Partial<Record<ToolCode, string>> = {
  T1:  'Digital Readiness Assessment',
  T4:  'Initiative Priority Board',
  T5:  'Digital Capability Canvas',
  T9:  'Digital Roadmap',
  T12: 'COBIT Assessment',
}

/**
 * Resuelve el nombre visible de una herramienta según el dominio activo.
 * Dominio desconocido/null o sin override para ese slot → nombre AI
 * Adoption (default histórico, `aiAdoptionLabel`).
 */
export function resolveToolLabel(
  code:             ToolCode,
  aiAdoptionLabel:  string,
  domainSlug:       string | null,
): string {
  if (domainSlug === 'transformacion_digital' || domainSlug === 'digital_transformation') {
    return TD_TOOL_DISPLAY_NAMES[code] ?? aiAdoptionLabel
  }
  return aiAdoptionLabel
}
