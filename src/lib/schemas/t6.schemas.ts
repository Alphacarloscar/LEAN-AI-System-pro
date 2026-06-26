import { z } from 'zod'

// ── AI Act Classification form schema (AIActClassificationModal) ──

export const AIACT_SCOPES = [
  'rrhh', 'financiero_clientes', 'salud', 'infraestructura',
  'seguridad', 'educacion', 'administracion', 'operaciones_internas', 'cliente_marketing',
] as const

export const aiActClassificationSchema = z.object({
  scope: z.enum(AIACT_SCOPES, {
    required_error: 'Selecciona el ámbito de operación del sistema',
  }),
  personImpact: z.enum(['no', 'human_review', 'autonomous'], {
    required_error: 'Indica si el sistema afecta a personas físicas',
  }),
  sensitiveData: z.boolean({
    required_error: 'Indica si el sistema procesa datos sensibles',
  }),
  explainability: z.enum(['yes', 'no'], {
    required_error: 'Indica si el output del sistema es explicable',
  }),
})

export type AIActClassificationFormValues = z.infer<typeof aiActClassificationSchema>
