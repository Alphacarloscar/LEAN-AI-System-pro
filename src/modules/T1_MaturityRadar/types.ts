// ============================================================
// T1 — AI Readiness Assessment · Tipos
// ============================================================

/**
 * Estado editable de una dimensión durante la sesión de demo.
 * Pre-cargado desde el DemoScenario, editable por el consultor en vivo.
 */
export interface T1DimensionState {
  code:       string    // 'strategy', 'data', etc.
  label:      string    // 'Estrategia', 'Datos', etc.
  score:      number    // 1–5, editable en demo
  target:     number    // score objetivo (from demo data)
  evidence:   string    // texto editable de evidencia
}

/**
 * Output auto-generado del T1 para el panel QW1.
 * Se recalcula en tiempo real al cambiar cualquier score.
 */
export interface T1Output {
  overallScore:   number           // media ponderada de los 8 scores
  maturityTier:   MaturityTier     // nivel resultante
  strengths:      T1DimensionState[]  // top 3 scores más altos
  gaps:           T1DimensionState[]  // top 3 mayor gap vs. target
  priorityActions: string[]        // 3 acciones prioritarias auto-generadas
}

export type MaturityTier =
  | 'inicial'
  | 'exploracion'
  | 'desarrollo'
  | 'avanzado'
  | 'lider'

export const MATURITY_TIER_CONFIG: Record<MaturityTier, {
  label:       string
  range:       [number, number]
  description: string
  color:       string   // Tailwind color token
}> = {
  inicial: {
    label:       'Iniciación',
    range:       [1.0, 1.9],
    description: 'La IA es experimental y no gobernada. Las iniciativas son oportunistas y sin alineación estratégica.',
    color:       'text-danger-dark bg-danger-light',
  },
  exploracion: {
    label:       'Exploración',
    range:       [2.0, 2.9],
    description: 'Hay conciencia del potencial IA pero faltan estructuras, procesos y gobierno formal.',
    color:       'text-warning-dark bg-warning-light',
  },
  desarrollo: {
    label:       'Desarrollo',
    range:       [3.0, 3.9],
    description: 'El ecosistema IA está en construcción. Hay bases sólidas pero la institucionalización no está completa.',
    color:       'text-info-dark bg-info-light',
  },
  avanzado: {
    label:       'Avanzado',
    range:       [4.0, 4.5],
    description: 'Gobierno robusto y IA como palanca real de negocio. La organización puede ejecutar y escalar.',
    color:       'text-success-dark bg-success-light',
  },
  lider: {
    label:       'Líder',
    range:       [4.6, 5.0],
    description: 'Referente de industria. La IA es un diferenciador estratégico central y la gobernanza es modelo para el sector.',
    color:       'text-success-dark bg-success-light',
  },
}

export function resolveMaturityTier(score: number): MaturityTier {
  if (score < 2.0) return 'inicial'
  if (score < 3.0) return 'exploracion'
  if (score < 4.0) return 'desarrollo'
  if (score < 4.6) return 'avanzado'
  return 'lider'
}
