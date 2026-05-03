// ============================================================
// T12 — AI System Impact Assessment (ISO 42001)
// Tipos propios. Extiende conceptos de T6 pero con workflow
// de aprobación de 4 estados y cobertura completa de cláusulas.
// ============================================================

export type T12Clause =
  | 'context'      // Cláusula 4
  | 'leadership'   // Cláusula 5
  | 'planning'     // Cláusula 6
  | 'support'      // Cláusula 7
  | 'operation'    // Cláusula 8
  | 'evaluation'   // Cláusula 9
  | 'improvement'  // Cláusula 10

export type T12Status =
  | 'no_iniciado'        // Control sin abordar
  | 'en_progreso'        // Implementación parcial en curso
  | 'pendiente_revision' // Listo para revisión interna
  | 'aprobado'           // Aprobado por el responsable interno

export interface T12Control {
  id:              string
  code:            string       // e.g. '5.2', '8.4'
  clause:          T12Clause
  title:           string
  description:     string
  /** Referencia al control equivalente en T6 (para import) */
  t6Ref?:          string
  /** Si el estado fue importado desde T6 */
  importedFromT6:  boolean
  status:          T12Status
  /** Evidencia / notas del consultor */
  evidence:        string
  /** Notas del revisor interno (pendiente revisión → aprobado) */
  reviewNote:      string
}

export interface T12ClauseProgress {
  clause:      T12Clause
  total:       number
  aprobado:    number
  pendiente:   number
  en_progreso: number
  no_iniciado: number
  pct:         number  // % aprobados
}
