// ============================================================
// T8 Context Builder
//
// Ensambla el contexto para ai-recommend tool T8.
// ============================================================

import type { CommAction, ArchetypeMessage, CommPhase } from './types'
import type { CompanyProfile }                          from '@/modules/CompanyProfile/types'

export interface T8RecommendationContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
  }
  commMap: {
    totalActions:       number
    highPriorityCount:  number
    channelsUsed:       string
    archetypeMessages:  { archetypeLabel: string; channel: string }[]
    byPhase: { phase: string; count: number }[]
  }
}

const PHASE_LABELS: Record<CommPhase, string> = {
  phase1: 'Fase 1 — Arranque',
  phase2: 'Fase 2 — Despliegue',
  phase3: 'Fase 3 — Consolidación',
}

export function buildT8RecommendationContext(
  actions:           CommAction[],
  archetypeMessages: ArchetypeMessage[],
  profile:           CompanyProfile,
): T8RecommendationContext {

  const phases: CommPhase[] = ['phase1', 'phase2', 'phase3']
  const byPhase = phases.map((phase) => ({
    phase: PHASE_LABELS[phase],
    count: actions.filter((a) => a.phase === phase).length,
  })).filter((p) => p.count > 0)

  const highPriorityCount = actions.filter((a) => a.priority === 'alta').length
  const channels = [...new Set(actions.map((a) => a.channel))].join(', ')

  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
    },
    commMap: {
      totalActions:      actions.length,
      highPriorityCount,
      channelsUsed:      channels || 'Sin datos',
      archetypeMessages: archetypeMessages.map((am) => ({
        archetypeLabel: am.archetypeLabel,
        channel:        am.channel,
      })),
      byPhase,
    },
  }
}
