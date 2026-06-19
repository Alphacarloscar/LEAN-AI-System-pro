import { z } from 'zod'

// ── Form schema for ProcessFormPhase (ProcessInterviewModal step 1) ──

export const PROCESS_PHASES = ['idea', 'validacion', 'piloto', 'estandarizacion', 'escalado'] as const
export type ProcessPhaseValue = typeof PROCESS_PHASES[number]

export const processFormSchema = z.object({
  name:        z.string().min(1, 'El nombre del proceso es obligatorio'),
  department:  z.string().min(1, 'Selecciona un departamento'),
  owner:       z.string().optional(),
  ownerRole:   z.string().optional(),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').optional().or(z.literal('')),
  phase:       z.enum(PROCESS_PHASES, { required_error: 'Selecciona una fase de madurez' }),
})

export type ProcessFormValues = z.infer<typeof processFormSchema>

// ── Form schema for StageModal (T3 StagesTab) ──────────────────

const VALUE_CONTRIBUTIONS = ['alta', 'media', 'baja', 'nula'] as const

export const stageFormSchema = z.object({
  name:              z.string().min(1, 'El nombre de la etapa es obligatorio').max(100, 'Máximo 100 caracteres'),
  responsible:       z.string().max(80, 'Máximo 80 caracteres').optional().or(z.literal('')),
  department:        z.string().optional().or(z.literal('')),
  system:            z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
  procTimeHours:     z.number({ invalid_type_error: 'Introduce un número válido' }).min(0, 'Debe ser ≥ 0'),
  waitTimeHours:     z.number({ invalid_type_error: 'Introduce un número válido' }).min(0, 'Debe ser ≥ 0'),
  handoffs:          z.number({ invalid_type_error: 'Introduce un número válido' }).int('Debe ser un número entero').min(0, 'Debe ser ≥ 0'),
  valueContribution: z.enum(VALUE_CONTRIBUTIONS, { required_error: 'Selecciona la contribución de valor' }),
  notes:             z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
})

export type StageFormValues = z.infer<typeof stageFormSchema>
