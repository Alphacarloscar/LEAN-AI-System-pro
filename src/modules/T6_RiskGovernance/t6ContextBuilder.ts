// ============================================================
// T6 — Context Builder para LLM Recommendations
//
// Construye el contexto para la Edge Function ai-recommend
// a partir de los datos de T4 (AI Act), T5 (dominios)
// y el perfil de empresa.
//
// ISO 42001 (controles) vive en T12 — eliminado de este builder.
// ============================================================

import type { UseCase }        from '@/modules/T4_UseCasePriorityBoard/types'
import type { T5Canvas }       from '@/modules/T5_AITaxonomyCanvas/types'
import type { CompanyProfile } from '@/modules/CompanyProfile/types'

// ── Tipos de salida ───────────────────────────────────────────

export interface T6RecommendationContext {
  company: {
    name:    string
    sector:  string
    size:    string
  }
  aiActRisk: {
    total:         number
    prohibido:     number
    alto:          number
    limitado:      number
    minimo:        number
    sinClasificar: number
    highRiskCases: Array<{ name: string; department: string }>
  }
  t5Domains: {
    activationSequence: string[]
    totalDomains:       number
    domainsWithContent: number
  }
  useCases: {
    total:        number
    go:           number
    piloto:       number
    noGo:         number
    unclassified: number
  }
}

// ── Builder ───────────────────────────────────────────────────

export function buildT6RecommendationContext(
  useCases: UseCase[],
  canvas:   T5Canvas,
  profile:  CompanyProfile,
): T6RecommendationContext {

  // AI Act risk breakdown
  const byRisk = {
    prohibido:     useCases.filter(uc => uc.aiActClassification?.riskLevel === 'prohibido').length,
    alto:          useCases.filter(uc => uc.aiActClassification?.riskLevel === 'alto').length,
    limitado:      useCases.filter(uc => uc.aiActClassification?.riskLevel === 'limitado').length,
    minimo:        useCases.filter(uc => uc.aiActClassification?.riskLevel === 'minimo').length,
    sinClasificar: useCases.filter(uc => !uc.aiActClassification).length,
  }

  const highRiskCases = useCases
    .filter(uc =>
      uc.aiActClassification?.riskLevel === 'alto' ||
      uc.aiActClassification?.riskLevel === 'prohibido'
    )
    .slice(0, 5)
    .map(uc => ({
      name:       uc.name,
      department: uc.department ?? 'Sin departamento',
    }))

  // T5 domains summary
  const domainEntries = Object.entries(canvas.domains)
  const domainsWithContent = domainEntries.filter(([, d]) => {
    const domain = d as { useCaseCount?: number }
    return (domain.useCaseCount ?? 0) > 0
  }).length

  // Use case status summary
  const ucStatus = {
    total:        useCases.length,
    go:           useCases.filter(uc => uc.status === 'go').length,
    piloto:       useCases.filter(uc => uc.status === 'en_piloto').length,
    noGo:         useCases.filter(uc => uc.status === 'no_go').length,
    unclassified: useCases.filter(uc => uc.status === 'candidato' || uc.status === 'priorizado').length,
  }

  return {
    company: {
      name:   profile.engagementName,
      sector: profile.sector ?? 'No especificado',
      size:   profile.tamanoEmpresa ?? 'No especificado',
    },
    aiActRisk: {
      total: useCases.length,
      ...byRisk,
      highRiskCases,
    },
    t5Domains: {
      activationSequence: canvas.activationSequence.slice(0, 4),
      totalDomains:       domainEntries.length,
      domainsWithContent,
    },
    useCases: ucStatus,
  }
}
