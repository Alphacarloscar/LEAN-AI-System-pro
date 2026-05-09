// ============================================================
// T5 Context Builder
//
// Ensambla el contexto para ai-recommend tool T5.
// Extrae el estado del canvas de dominios IA.
// ============================================================

import type { T5Canvas }      from './types'
import type { CompanyProfile } from '@/modules/CompanyProfile/types'

export interface T5RecommendationContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
  }
  canvas: {
    maturityLevel:       string
    activationSequence:  string[]
    domains: {
      domainCode:     string
      scores: {
        businessValue:  number
        technicalReady: number
        orgReadiness:   number
        riskLevel:      number
      }
      priorityScore:  number
      recommendation: string
      useCaseCount:   number
    }[]
  }
}

export function buildT5RecommendationContext(
  canvas:  T5Canvas,
  profile: CompanyProfile,
): T5RecommendationContext {
  const domains = Object.values(canvas.domains).map((d) => ({
    domainCode:     d.domainCode,
    scores:         d.scores,
    priorityScore:  Math.round(d.priorityScore),
    recommendation: d.recommendation,
    useCaseCount:   d.useCaseCount,
  }))

  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
    },
    canvas: {
      maturityLevel:      canvas.maturityLevel,
      activationSequence: canvas.activationSequence,
      domains,
    },
  }
}
