// ============================================================
// T4 Context Builder
//
// Ensambla el objeto de contexto que se envía a la Edge Function
// ai-recommend para el tool T4.
//
// Analiza el portfolio de casos de uso y extrae:
//   - Distribución por estado (go, candidato, no_go, etc.)
//   - Distribución por categoría IA
//   - Top casos priorizados con scores y economics
//   - Perfil de riesgo AI Act del portfolio
//   - Potencial económico agregado
// ============================================================

import type { UseCase }        from './types'
import type { CompanyProfile } from '@/modules/CompanyProfile/types'
import { computeROIFromEconomics } from './constants'

// ── Tipo de contexto ──────────────────────────────────────────

export interface T4RecommendationContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
    valueHorizon:    string
  }
  portfolio: {
    total:           number
    byStatus: {
      status: string
      count:  number
    }[]
    byAICategory: {
      category: string
      count:    number
      goCount:  number
    }[]
    topCases: {
      name:          string
      department:    string
      aiCategory:    string
      status:        string
      priorityScore: number
      goNoGo:        string
      annualSaving?:  number
      paybackMonths?: number
      aiActRisk?:    string
    }[]
  }
  economics: {
    totalAnnualSaving:   number
    totalImplCost:       number
    casesWithEconomics:  number
    avgPaybackMonths:    number | null
  }
  risk: {
    highRiskCount:        number
    unclassifiedCount:    number
    aiActDistribution: {
      level: string
      count: number
    }[]
  }
  coverage: {
    casesWithScoring:    number
    casesWithRoadmap:    number
    casesWithoutGoNoGo:  number
  }
}

// ── Builder ───────────────────────────────────────────────────

export function buildT4RecommendationContext(
  useCases: UseCase[],
  profile:  CompanyProfile,
): T4RecommendationContext {

  // ── Por estado ──
  const statusCounts = new Map<string, number>()
  for (const uc of useCases) {
    statusCounts.set(uc.status, (statusCounts.get(uc.status) ?? 0) + 1)
  }
  const byStatus = Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  // ── Por categoría IA ──
  const catMap = new Map<string, { total: number; go: number }>()
  for (const uc of useCases) {
    const entry = catMap.get(uc.aiCategory) ?? { total: 0, go: 0 }
    entry.total++
    if (uc.status === 'go' || uc.status === 'en_piloto') entry.go++
    catMap.set(uc.aiCategory, entry)
  }
  const byAICategory = Array.from(catMap.entries())
    .map(([category, { total, go }]) => ({ category, count: total, goCount: go }))
    .sort((a, b) => b.count - a.count)

  // ── Top casos (ordenados por priorityScore) ──
  const topCases = [...useCases]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 6)
    .map((uc) => {
      const roi = uc.economics ? computeROIFromEconomics(uc.economics) : null
      return {
        name:          uc.name,
        department:    uc.department,
        aiCategory:    uc.aiCategory,
        status:        uc.status,
        priorityScore: Math.round(uc.priorityScore),
        goNoGo:        uc.goNoGo?.decision ?? 'pending',
        annualSaving:  roi ? Math.round(roi.annualSaving) : undefined,
        paybackMonths: roi ? Math.round(roi.paybackMonths) : undefined,
        aiActRisk:     uc.aiActClassification?.riskLevel,
      }
    })

  // ── Economía agregada ──
  let totalAnnualSaving  = 0
  let totalImplCost      = 0
  let paybackSum         = 0
  let paybackCount       = 0
  let casesWithEconomics = 0

  for (const uc of useCases) {
    if (!uc.economics) continue
    casesWithEconomics++
    const roi = computeROIFromEconomics(uc.economics)
    totalAnnualSaving += roi.annualSaving
    totalImplCost     += uc.economics.implementationCost
    if (roi.paybackMonths > 0 && roi.paybackMonths < 999) {
      paybackSum += roi.paybackMonths
      paybackCount++
    }
  }

  // ── Riesgo AI Act ──
  const riskCounts = new Map<string, number>()
  let unclassifiedCount = 0
  for (const uc of useCases) {
    const level = uc.aiActClassification?.riskLevel
    if (!level || level === 'sin_clasificar') { unclassifiedCount++; continue }
    riskCounts.set(level, (riskCounts.get(level) ?? 0) + 1)
  }
  const aiActDistribution = Array.from(riskCounts.entries())
    .map(([level, count]) => ({ level, count }))
  const highRiskCount = (riskCounts.get('alto') ?? 0) + (riskCounts.get('prohibido') ?? 0)

  // ── Cobertura ──
  const casesWithScoring   = useCases.filter((uc) => uc.stakeholderScores.length > 0).length
  const casesWithRoadmap   = useCases.filter((uc) => !!uc.roadmap?.quarter).length
  const casesWithoutGoNoGo = useCases.filter((uc) => !uc.goNoGo || uc.goNoGo.decision === 'pending').length

  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
      valueHorizon:    profile.horizonteEsperadoValor,
    },
    portfolio: {
      total: useCases.length,
      byStatus,
      byAICategory,
      topCases,
    },
    economics: {
      totalAnnualSaving:  Math.round(totalAnnualSaving),
      totalImplCost:      Math.round(totalImplCost),
      casesWithEconomics,
      avgPaybackMonths:   paybackCount > 0 ? Math.round(paybackSum / paybackCount) : null,
    },
    risk: {
      highRiskCount,
      unclassifiedCount,
      aiActDistribution,
    },
    coverage: {
      casesWithScoring,
      casesWithRoadmap,
      casesWithoutGoNoGo,
    },
  }
}
