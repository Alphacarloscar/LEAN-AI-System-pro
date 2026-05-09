// ============================================================
// T10 Context Builder
//
// Agrega el estado global del programa IA para el Dashboard.
// Combina datos de T1 (madurez), T4 (portfolio), T2 (stakeholders)
// y T11 (governance) en un contexto ejecutivo para ai-recommend.
// ============================================================

import type { RadarDimension }    from '@/shared/components/charts/LeanRadarChart'
import type { UseCase }           from '@/modules/T4_UseCasePriorityBoard/types'
import type { Stakeholder }       from '@/modules/T2_StakeholderMatrix/types'
import type { T11OperatingModel } from '@/modules/T11_OperatingRhythm/types'
import type { CompanyProfile }    from '@/modules/CompanyProfile/types'
import { computeROIFromEconomics } from '@/modules/T4_UseCasePriorityBoard/constants'

export interface T10RecommendationContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
    valueHorizon:    string
  }
  dashboard: {
    maturity: {
      overallScore:  number
      topDimension:  string
      criticalGap:   string
    }
    portfolio: {
      activeCases:        number
      totalAnnualSaving:  number
      highRiskCases:      number
    }
    adoption: {
      totalStakeholders:   number
      earlyAdopterRatio:   number
      uninterviewedCount:  number
    }
    governance: {
      maturityTier:          string
      criticalEventsCount:   number
      decisionsWithOwner:    number
    }
  }
}

export function buildT10RecommendationContext(
  t1Radar:      RadarDimension[],
  useCases:     UseCase[],
  stakeholders: Stakeholder[],
  t11Model:     T11OperatingModel | null,
  profile:      CompanyProfile,
): T10RecommendationContext {

  // ── T1 madurez ──
  const overallScore = t1Radar.length
    ? Math.round((t1Radar.reduce((s, d) => s + (d.current ?? 0), 0) / t1Radar.length) * 100) / 100
    : 0

  const topDimension = t1Radar.length
    ? t1Radar.reduce((a, b) => (a.current ?? 0) > (b.current ?? 0) ? a : b).dimension
    : 'Sin datos'

  const criticalGap = t1Radar.length
    ? t1Radar.reduce((a, b) => (a.current ?? 0) < (b.current ?? 0) ? a : b).dimension
    : 'Sin datos'

  // ── T4 portfolio ──
  const activeCases = useCases.filter(
    (uc) => uc.status === 'go' || uc.status === 'en_piloto'
  ).length

  let totalAnnualSaving = 0
  for (const uc of useCases) {
    if (uc.economics && (uc.status === 'go' || uc.status === 'en_piloto')) {
      totalAnnualSaving += computeROIFromEconomics(uc.economics).annualSaving
    }
  }

  const highRiskCases = useCases.filter(
    (uc) => uc.aiActClassification?.riskLevel === 'alto' ||
            uc.aiActClassification?.riskLevel === 'prohibido'
  ).length

  // ── T2 adopción ──
  const totalStakeholders = stakeholders.length
  const uninterviewedCount = stakeholders.filter((s) => !s.interview).length

  // Early adopters: adoptador + ambassador con resistencia no alta
  const earlyCount = stakeholders.filter(
    (s) => (s.archetype === 'adoptador' || s.archetype === 'ambassador') && s.resistance !== 'alta'
  ).length
  const earlyAdopterRatio = totalStakeholders > 0
    ? Math.round((earlyCount / totalStakeholders) * 100)
    : 0

  // ── T11 governance ──
  const maturityTier        = t11Model?.maturityTier ?? 'Sin datos'
  const criticalEventsCount = t11Model?.recommendedEvents.filter((e) => e.isCritical).length ?? 0
  const decisionsWithOwner  = t11Model?.decisions.filter((d) => !!d.owner).length ?? 0

  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
      valueHorizon:    profile.horizonteEsperadoValor,
    },
    dashboard: {
      maturity: { overallScore, topDimension, criticalGap },
      portfolio: {
        activeCases,
        totalAnnualSaving: Math.round(totalAnnualSaving),
        highRiskCases,
      },
      adoption: { totalStakeholders, earlyAdopterRatio, uninterviewedCount },
      governance: { maturityTier, criticalEventsCount, decisionsWithOwner },
    },
  }
}
