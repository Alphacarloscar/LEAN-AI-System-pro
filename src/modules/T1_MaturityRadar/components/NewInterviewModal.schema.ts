import { z } from 'zod'

export const newIntervieweeSchema = z.object({
  name: z
    .string()
    .min(1,   'El nombre es obligatorio')
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .refine((v) => v.trim().length > 0, 'El nombre no puede estar en blanco'),

  role: z
    .string()
    .min(1,   'El cargo es obligatorio')
    .max(100, 'El cargo no puede superar los 100 caracteres')
    .refine((v) => v.trim().length > 0, 'El cargo no puede estar en blanco'),

  type: z.enum(['it', 'business'], {
    errorMap: () => ({ message: 'Selecciona un perfil válido' }),
  }),

  department: z
    .string()
    .min(1, 'El departamento es obligatorio')
    .refine((v) => v.trim().length > 0, 'Selecciona o escribe un departamento'),

  /** id de company_persons si se seleccionó una persona existente; null si se está creando una nueva. */
  personId: z.string().nullable(),
})

export type NewIntervieweeFormValues = z.infer<typeof newIntervieweeSchema>
