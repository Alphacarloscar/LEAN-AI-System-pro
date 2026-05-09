// ============================================================
// T11 Context Builder
//
// Ensambla el contexto para ai-recommend tool T11.
// ============================================================

import type { T11OperatingModel } from './types'
import type { CompanyProfile }    from '@/modules/CompanyProfile/types'

export interface T11RecommendationContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
  }
  model: {
    maturityTier:        string
    maturityAvg:         number
    recommendedEvents: {
      title:       string
      level:       string
      frequency:   string
      owner:       string
      isCritical:  boolean
    }[]
    decisions: {
      decision:   string
      owner:      string
      escalateTo: string
    }[]
    kpiGroups: {
      label: string
      kpis:  { name: string }[]
    }[]
  }
}

export function buildT11RecommendationContext(
  model:   T11OperatingModel,
  profile: CompanyProfile,
): T11RecommendationContext {
  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
    },
    model: {
      maturityTier: model.maturityTier,
      maturityAvg:  model.maturityAvg,
      recommendedEvents: model.recommendedEvents.map((e) => ({
        title:      e.title,
        level:      e.level,
        frequency:  e.frequency,
        owner:      e.owner,
        isCritical: e.isCritical,
      })),
      decisions: model.decisions.map((d) => ({
        decision:   d.decision,
        owner:      d.owner,
        escalateTo: d.escalateTo,
      })),
      kpiGroups: model.kpiGroups.map((g) => ({
        label: g.label,
        kpis:  g.kpis.map((k) => ({ name: k.name })),
      })),
    },
  }
}
