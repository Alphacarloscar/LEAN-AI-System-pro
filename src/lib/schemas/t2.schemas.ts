import { z } from 'zod'

// ── Form schema for StakeholderFormPhase (InterviewModal step 1) ──
//
// Department is validated as a non-empty string because the list of
// valid values is dynamic (loaded from company_departments store).
// Enum-style validation would require passing the list at schema
// creation time; keeping it as min(1) is the pragmatic trade-off.

export const stakeholderFormSchema = z.object({
  name:            z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role:            z.string().min(2, 'El cargo debe tener al menos 2 caracteres'),
  department:      z.string().min(1, 'Selecciona un departamento'),
  unofficialTools: z.string().optional(),
})

export type StakeholderFormValues = z.infer<typeof stakeholderFormSchema>
