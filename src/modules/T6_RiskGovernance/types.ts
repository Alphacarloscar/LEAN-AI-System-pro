// ============================================================
// T6 — Risk & Governance — Tipos
//
// Genera automáticamente desde T4 + T5:
//   · Política IA corporativa (descargable como PDF)
//   · Dashboard de riesgos AI Act por caso de uso
//   · Checklist de controles ISO 42001 (14 controles clave)
//
// Sprint 2 MVP: datos derivados en runtime desde T4 + T5 stores.
// Sprint 3+: persistencia en Supabase + versionado de política.
// ============================================================

import type { AIActRiskLevel } from '@/modules/T4_UseCasePriorityBoard/types'

// ── Re-export para conveniencia ───────────────────────────────
export type { AIActRiskLevel }

// ── Controles ISO 42001 ───────────────────────────────────────

export type ISO42001Clause =
  | 'context'     // Cláusula 4 — Contexto de la organización
  | 'leadership'  // Cláusula 5 — Liderazgo
  | 'planning'    // Cláusula 6 — Planificación
  | 'support'     // Cláusula 7 — Apoyo
  | 'operation'   // Cláusula 8 — Operación
  | 'evaluation'  // Cláusula 9 — Evaluación del desempeño
  | 'improvement' // Cláusula 10 — Mejora

export type ISO42001Status =
  | 'no_iniciado'  // Control no abordado
  | 'en_progreso'  // Control parcialmente implementado o en curso
  | 'implementado' // Control completamente operativo

export interface ISO42001Control {
  id:          string
  code:        string  // e.g. '5.2', '6.1.2'
  clause:      ISO42001Clause
  title:       string
  description: string
  /** Si el estado fue inferido automáticamente desde datos T4/T5 */
  autoInferred: boolean
  status:      ISO42001Status
  /** Nota o evidencia del consultor */
  notes?:      string
}

// ── Resumen de riesgos AI Act ─────────────────────────────────

export interface AIActRiskSummary {
  total:          number
  byLevel:        Record<AIActRiskLevel, number>
  classified:     number
  unclassified:   number
  /** % de casos clasificados */
  coveragePercent: number
}

// ── Política IA corporativa ───────────────────────────────────

export interface PolicySection {
  id:      string
  title:   string
  content: string
}

export interface T6PolicyData {
  companyName:     string
  version:         string
  generatedAt:     string
  sections:        PolicySection[]
  riskSummary:     AIActRiskSummary
  iso42001Controls: ISO42001Control[]
  /** Nivel de completitud ISO 42001 (0-100) */
  iso42001Progress: number
}
