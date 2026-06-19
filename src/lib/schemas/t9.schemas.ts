import { z } from 'zod'

export const AddFreeItemSchema = z.object({
  name:        z.string().min(1, 'El nombre es obligatorio'),
  department:  z.string(),
  responsible: z.string(),
  startMonth:  z.coerce.number().int().min(0).max(11),
  endMonth:    z.coerce.number().int().min(0).max(11),
  riskLevel:   z.enum(['bajo', 'medio', 'alto']),
  status:      z.enum(['pendiente', 'en_curso', 'completado']),
}).refine((d) => d.endMonth >= d.startMonth, {
  message: 'El mes fin no puede ser anterior al mes inicio',
  path: ['endMonth'],
})

export type AddFreeItemFormValues = z.infer<typeof AddFreeItemSchema>
