// ============================================================
// T9 — AI Roadmap 6M — Tipos
//
// Dos tipos de fila en el Gantt:
//   'ai_import' — caso de uso Go importado desde T4.
//                 Status y riesgo se leen en runtime desde T4.
//                 Solo se persiste el override (responsable + fechas).
//   'free'      — iniciativa libre del consultor.
//                 Todos los campos son locales.
//
// Meses representados como índice 0-5 (0 = Mes 1, 5 = Mes 6).
// Sprint 3: persistencia en Zustand.
// Sprint 4: migrar a tabla `roadmap_items` en Supabase.
// ============================================================

// ── Nivel de riesgo simplificado para el Gantt ──────────────
// Mapeado desde AIActRiskLevel de T4:
//   prohibido | alto → 'alto'
//   limitado        → 'medio'
//   minimo | sin_clasificar | undefined → 'bajo'
export type RoadmapRiskLevel = 'alto' | 'medio' | 'bajo'

// ── Estado de iniciativa libre ────────────────────────────────
export type FreeItemStatus = 'pendiente' | 'en_curso' | 'completado'

// ── Override de posición/responsable para filas ai_import ────
// Se guarda cuando el consultor edita la posición o el responsable
// de un caso de uso importado de T4. Sin override, se usa la
// posición calculada automáticamente desde roadmap.quarter.
export interface T9ItemOverride {
  useCaseId:   string
  startMonth:  number   // 0-5
  endMonth:    number   // 0-5
  responsible: string   // puede diferir de roadmap.owner en T4
}

// ── Iniciativa libre ─────────────────────────────────────────
export interface FreeItem {
  id:          string
  name:        string
  department:  string
  responsible: string
  startMonth:  number          // 0-5
  endMonth:    number          // 0-5
  riskLevel:   RoadmapRiskLevel
  status:      FreeItemStatus
  notes?:      string
  createdAt:   string
}

// ── Estado interno del formulario de añadir libre ───────────
export interface AddFreeForm {
  name:        string
  department:  string
  responsible: string
  startMonth:  number
  endMonth:    number
  riskLevel:   RoadmapRiskLevel
  status:      FreeItemStatus
}
