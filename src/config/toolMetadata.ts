// ============================================================
// GOBY — toolMetadata.ts
// Fuente ÚNICA de presentación por tool (label visible).
//
// FDR-002 (Fase 1): antes el label de cada tool estaba duplicado
// en AppSidebar (lista legacy) y en PackageNav. Esto los unifica.
// Tanto la navegación legacy (flag-off) como la de paquetes
// (flag-on) consumen este mapa → cero divergencia de nombres.
//
// NOTA (lane Gemini/Carlos): estos labels son los ACTUALES en
// producción. Cualquier renombrado comercial (p.ej. nombres más
// cortos) es decisión de producto/posicionamiento, no técnica, y
// se aplica cambiando SOLO este fichero.
// ============================================================

import type { ToolCode } from '@/types'

export interface ToolMetadata {
  code: ToolCode
  /** Nombre visible de la tool en la navegación. */
  label: string
}

export const TOOL_METADATA: Record<ToolCode, ToolMetadata> = {
  T1:  { code: 'T1',  label: 'AI Readiness Assessment' },
  T2:  { code: 'T2',  label: 'Stakeholder Matrix' },
  T3:  { code: 'T3',  label: 'Value Stream Map' },
  T4:  { code: 'T4',  label: 'Use Case Priority Board' },
  T5:  { code: 'T5',  label: 'AI Taxonomy Canvas' },
  T6:  { code: 'T6',  label: 'Risk & Governance' },
  T7:  { code: 'T7',  label: 'Adoption Heatmap' },
  T8:  { code: 'T8',  label: 'Communication Map' },
  T9:  { code: 'T9',  label: 'AI Roadmap' },
  T10: { code: 'T10', label: 'AI Value Dashboard' },
  T11: { code: 'T11', label: 'Operating Rhythm' },
  T12: { code: 'T12', label: 'ISO 42001 Assessment' },
}

/** Label visible de una tool. */
export function toolLabel(code: ToolCode): string {
  return TOOL_METADATA[code].label
}
