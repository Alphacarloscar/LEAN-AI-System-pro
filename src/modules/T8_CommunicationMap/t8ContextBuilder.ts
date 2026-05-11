// ============================================================
// T8 Context Builder
//
// Ensambla el contexto para ai-recommend tool T8.
// ============================================================

import type { CommAction, ArchetypeMessage, CommPhase } from './types'
import type { CompanyProfile }                          from '@/modules/CompanyProfile/types'
import type { Stakeholder, ArchetypeCode } from '@/modules/T2_StakeholderMatrix/types'
import type { UseCase }                                 from '@/modules/T4_UseCasePriorityBoard/types'

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

// ── Context para generación de comunicaciones LLM (Route B) ──


export interface T8CommContext {
  company: {
    name:            string
    sector:          string
    size:            string
    mainAIObjective: string
  }
  stakeholders: {
    total: number
    byArchetype: {
      archetypeCode:  string
      archetypeLabel: string
      count:          number
      names:          string[]
      roles:          string[]
      departments:    string[]
      resistances:    string[]
      dominantResistance: string
    }[]
    byDepartment: {
      dept:        string
      total:       number
      archetypes:  string
      ambassadors: string[]
    }[]
  }
  useCases: {
    topGo: { name: string; department: string; score: number }[]
    totalGo: number
  }
}

const ARCHETYPE_LABELS: Record<ArchetypeCode, string> = {
  adoptador:    'Adoptador temprano',
  ambassador:   'Ambassador',
  decisor:      'Decisor',
  especialista: 'Especialista',
  critico:      'Crítico',
}

export function buildT8CommContext(
  stakeholders: Stakeholder[],
  useCases:     UseCase[],
  profile:      CompanyProfile,
  companyName:  string,
): T8CommContext {

  const archetypes: ArchetypeCode[] = ['adoptador', 'ambassador', 'decisor', 'especialista', 'critico']
  const byArchetype = archetypes
    .map((arch) => {
      const shs = stakeholders.filter((s) => s.archetype === arch)
      if (shs.length === 0) return null
      const highRes = shs.filter((s) => s.resistance === 'alta').length
      const medRes  = shs.filter((s) => s.resistance === 'media').length
      const dominantResistance = highRes > shs.length / 2 ? 'alta'
        : medRes > 0 ? 'media' : 'baja'
      return {
        archetypeCode:      arch,
        archetypeLabel:     ARCHETYPE_LABELS[arch],
        count:              shs.length,
        names:              shs.map((s) => s.name),
        roles:              shs.map((s) => s.role),
        departments:        [...new Set(shs.map((s) => s.department ?? 'Sin asignar'))],
        resistances:        shs.map((s) => s.resistance),
        dominantResistance,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // Agrupación por departamento
  const deptMap = new Map<string, { shs: Stakeholder[] }>()
  for (const sh of stakeholders) {
    const dept = sh.department ?? 'Sin asignar'
    if (!deptMap.has(dept)) deptMap.set(dept, { shs: [] })
    deptMap.get(dept)!.shs.push(sh)
  }
  const byDepartment = [...deptMap.entries()].map(([dept, { shs }]) => ({
    dept,
    total:       shs.length,
    archetypes:  [...new Set(shs.map((s) => ARCHETYPE_LABELS[s.archetype as ArchetypeCode]))].join(', '),
    ambassadors: shs.filter((s) => s.archetype === 'ambassador').map((s) => s.name),
  })).sort((a, b) => b.total - a.total)

  const topGo = useCases
    .filter((uc) => uc.status === 'go')
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
    .slice(0, 5)
    .map((uc) => ({ name: uc.name, department: uc.department, score: uc.priorityScore ?? 0 }))

  return {
    company: {
      name:            companyName,
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
    },
    stakeholders: {
      total: stakeholders.length,
      byArchetype,
      byDepartment,
    },
    useCases: {
      topGo,
      totalGo: topGo.length,
    },
  }
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
