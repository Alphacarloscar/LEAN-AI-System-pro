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
