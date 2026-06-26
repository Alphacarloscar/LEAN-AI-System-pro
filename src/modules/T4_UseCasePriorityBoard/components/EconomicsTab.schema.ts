import { z } from 'zod'

export const economicsSchema = z.object({
  kpiPrincipal: z
    .string()
    .max(200, 'El KPI no puede superar los 200 caracteres')
    .optional(),

  processHoursPerWeek: z
    .number({ invalid_type_error: 'Introduce un número válido' })
    .min(0,   'Las horas no pueden ser negativas')
    .max(168, 'El máximo son 168 horas por semana (7 días × 24h)'),

  headcount: z
    .number({ invalid_type_error: 'Introduce un número válido' })
    .int('Debe ser un número entero de personas')
    .min(1,   'Debe haber al menos 1 persona involucrada')
    .max(500, 'El máximo permitido es 500 personas'),

  efficiencyGain: z
    .number({ invalid_type_error: 'Introduce un porcentaje válido' })
    .min(0,   'La ganancia no puede ser negativa')
    .max(1,   'La ganancia máxima es del 100%'),

  efficiencyGainMode: z.enum(['benchmark', 'manual']),

  hourlyRate: z
    .number({ invalid_type_error: 'Introduce un coste/hora válido' })
    .min(10,  'El coste mínimo es 10 €/hora')
    .max(500, 'El coste máximo es 500 €/hora'),

  hourlyRateMode: z.enum(['preset', 'manual']),

  hourlyRatePreset: z
    .enum(['administrativo', 'tecnico', 'directivo'])
    .optional(),

  implementationCost: z
    .number({ invalid_type_error: 'Introduce un coste de implementación válido' })
    .min(0,         'El coste no puede ser negativo')
    .max(2_000_000, 'El coste máximo permitido es 2.000.000 €'),

  implementationCostMode: z.enum(['benchmark', 'manual']),
})

export type EconomicsFormValues = z.infer<typeof economicsSchema>
