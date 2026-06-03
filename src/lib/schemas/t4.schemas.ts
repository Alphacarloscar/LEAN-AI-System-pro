import { z } from 'zod'

// ── Schemas Zod para los campos JSONB de la tabla use_cases ───
//
// Propósito: validación en runtime cuando datos llegan de Supabase.
// Los JSONB no tienen schema en BD — estos schemas evitan que una
// migración de datos silenciosa rompa la lógica del cliente.
//
// Uso: safeParse en rowToUseCase + log si falla.

export const UseCaseScoresSchema = z.object({
  kpiImpact:      z.number().min(0).max(100),
  feasibility:    z.number().min(0).max(100),
  aiRisk:         z.number().min(0).max(100),
  dataDependency: z.number().min(0).max(100),
})

export const StakeholderScoreSchema = z.object({
  id:              z.string(),
  stakeholderName: z.string(),
  stakeholderRole: z.string(),
  archetypeCode:   z.string().optional(),
  scores:          UseCaseScoresSchema,
  notes:           z.string().optional(),
  scoredAt:        z.string(),
})

export const StakeholderScoresSchema = z.array(StakeholderScoreSchema)

export const GoNoGoDecisionSchema = z.object({
  decision:   z.enum(['go', 'no_go', 'pending']),
  rationale:  z.string().optional(),
  decidedAt:  z.string().optional(),
  decidedBy:  z.string().optional(),
})

export const UseCaseEconomicsSchema = z.object({
  kpiPrincipal:           z.string().optional(),
  processHoursPerWeek:    z.number().min(0),
  headcount:              z.number().min(0),
  efficiencyGain:         z.number().min(0).max(1),
  efficiencyGainMode:     z.enum(['benchmark', 'manual']),
  hourlyRate:             z.number().min(0),
  hourlyRateMode:         z.enum(['preset', 'manual']),
  hourlyRatePreset:       z.enum(['administrativo', 'tecnico', 'directivo']).optional(),
  implementationCost:     z.number().min(0),
  implementationCostMode: z.enum(['benchmark', 'manual']),
})

export const AIActClassificationSchema = z.object({
  scope:          z.enum(['rrhh', 'financiero_clientes', 'salud', 'infraestructura', 'seguridad', 'educacion', 'administracion', 'operaciones_internas', 'cliente_marketing']),
  personImpact:   z.enum(['no', 'human_review', 'autonomous']),
  sensitiveData:  z.boolean(),
  explainability: z.enum(['yes', 'no']),
  riskLevel:      z.enum(['prohibido', 'alto', 'limitado', 'minimo', 'sin_clasificar']),
  classifiedAt:   z.string(),
})

// ── Función de parseo seguro (no lanza, reporta drift) ────────

import { reportError } from '@/lib/reportError'

export function safeParseJsonField<T>(
  schema: z.ZodSchema<T>,
  value:  unknown,
  field:  string,
): T | undefined {
  if (value == null) return undefined
  const result = schema.safeParse(value)
  if (!result.success) {
    reportError(`[T4 schema drift] ${field}`, new Error(result.error.message))
    return value as T
  }
  return result.data
}

export type UseCaseScoresType        = z.infer<typeof UseCaseScoresSchema>
export type StakeholderScoreType     = z.infer<typeof StakeholderScoreSchema>
export type GoNoGoDecisionType       = z.infer<typeof GoNoGoDecisionSchema>
export type UseCaseEconomicsType     = z.infer<typeof UseCaseEconomicsSchema>
export type AIActClassificationType  = z.infer<typeof AIActClassificationSchema>
