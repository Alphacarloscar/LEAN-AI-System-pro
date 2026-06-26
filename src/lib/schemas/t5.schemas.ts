import { z } from 'zod'

const scoreField = z.number().int().min(0).max(100).multipleOf(5)

export const T5DomainScoresSchema = z.object({
  businessValue:  scoreField,
  technicalReady: scoreField,
  orgReadiness:   scoreField,
  riskLevel:      scoreField,
})

export type T5DomainScoresFormValues = z.infer<typeof T5DomainScoresSchema>
