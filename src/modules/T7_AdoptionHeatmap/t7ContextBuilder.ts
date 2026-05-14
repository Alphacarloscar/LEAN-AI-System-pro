// ============================================================
// T7 Context Builder
//
// buildT7RecommendationContext — contexto para RecommendationPanel
//   Usa T2 stakeholders + CompanyProfile.
//
// buildT7PlanContext — contexto para generación del plan de cambio
//   Usa T2 stakeholders + T4 use cases + T1 maturity avg + CompanyProfile.
// ============================================================

import type { RogersSegment }  from './types'
import type { Stakeholder, ArchetypeCode, ResistanceLevel } from '@/modules/T2_StakeholderMatrix/types'
import type { UseCase }        from '@/modules/T4_UseCasePriorityBoard/types'
import type { CompanyProfile } from '@/modules/CompanyProfile/types'

// Misma lógica que T7View — no importamos desde allí para evitar
// dependencia circular con un componente de UI.
const SEGMENT_ORDER: RogersSegment[] = [
  'innovators', 'early_adopters', 'early_majority', 'late_majority', 'laggards',
]

const ARCHETYPE_BASE_SEG: Record<ArchetypeCode, RogersSegment> = {
  adoptador:    'early_adopters',
  ambassador:   'early_majority',
  decisor:      'early_majority',
  reticente: 'late_majority',
  critico:      'laggards',
}

function getSegment(archetype: ArchetypeCode, resistance: ResistanceLevel): RogersSegment {
  const base = ARCHETYPE_BASE_SEG[archetype]
  if (resistance === 'alta') {
    const idx = SEGMENT_ORDER.indexOf(base)
    return SEGMENT_ORDER[Math.min(idx + 1, SEGMENT_ORDER.length - 1)]
  }
  return base
}

const SEGMENT_LABELS: Record<RogersSegment, string> = {
  innovators:     'Innovators',
  early_adopters: 'Early Adopters',
  early_majority: 'Early Majority',
  late_majority:  'Late Majority',
  laggards:       'Laggards',
}

export interface T7RecommendationContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
  }
  heatmap: {
    totalMapped:       number
    earlyAdopterRatio: number
    laggardRatio:      number
    bySegment: {
      segment: string
      count:   number
      pct:     number
      names:   string
    }[]
  }
}

export function buildT7RecommendationContext(
  stakeholders: Stakeholder[],
  profile:      CompanyProfile,
): T7RecommendationContext {

  const total = stakeholders.length

  // Agrupar por segmento
  const groups = new Map<RogersSegment, Stakeholder[]>()
  for (const seg of SEGMENT_ORDER) groups.set(seg, [])

  for (const sh of stakeholders) {
    const seg = getSegment(sh.archetype as ArchetypeCode, sh.resistance as ResistanceLevel)
    groups.get(seg)!.push(sh)
  }

  const bySegment = SEGMENT_ORDER
    .map((seg) => {
      const group = groups.get(seg)!
      const names = group.map((s) => s.name).slice(0, 3).join(', ')
      return {
        segment: SEGMENT_LABELS[seg],
        count:   group.length,
        pct:     total > 0 ? Math.round((group.length / total) * 100) : 0,
        names,
      }
    })
    .filter((s) => s.count > 0)

  const earlyCount   = (groups.get('innovators')?.length ?? 0) + (groups.get('early_adopters')?.length ?? 0)
  const laggardCount = (groups.get('late_majority')?.length ?? 0) + (groups.get('laggards')?.length ?? 0)

  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
    },
    heatmap: {
      totalMapped:       total,
      earlyAdopterRatio: total > 0 ? Math.round((earlyCount / total) * 100) : 0,
      laggardRatio:      total > 0 ? Math.round((laggardCount / total) * 100) : 0,
      bySegment,
    },
  }
}

// ── Context para generación del plan de cambio (Route B) ──────

export interface T7PlanContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
    valueHorizon:    string
  }
  maturity: {
    avg:    number
    label:  string
  }
  heatmap: {
    totalMapped:       number
    earlyAdopterRatio: number
    laggardRatio:      number
    bySegment: {
      segment: string
      count:   number
      pct:     number
      names:   string
    }[]
    byDepartment: {
      dept:      string
      total:     number
      favorable: number  // innovators + early_adopters + early_majority
      pct:       number
    }[]
    keyBlockers: {
      name:       string
      role:       string
      department: string
      segment:    string
    }[]
    keyChampions: {
      name:       string
      role:       string
      department: string
      segment:    string
    }[]
  }
  useCases: {
    topGo: {
      name:       string
      department: string
      score:      number
    }[]
    totalGo:    number
    totalPilot: number
  }
}

function maturityLabel(avg: number): string {
  if (avg < 1.5) return 'Fundacional'
  if (avg < 2.5) return 'En desarrollo'
  if (avg < 3.5) return 'Avanzado'
  return 'Optimizado'
}

export function buildT7PlanContext(
  stakeholders: Stakeholder[],
  t1Avg:        number,
  useCases:     UseCase[],
  profile:      CompanyProfile,
): T7PlanContext {

  const total  = stakeholders.length

  // Agrupar stakeholders por segmento Rogers
  const groups = new Map<RogersSegment, Stakeholder[]>()
  for (const seg of SEGMENT_ORDER) groups.set(seg, [])
  for (const sh of stakeholders) {
    const seg = getSegment(sh.archetype as ArchetypeCode, sh.resistance as ResistanceLevel)
    groups.get(seg)!.push(sh)
  }

  // Segmentos favorables: innovators + early_adopters + early_majority
  const FAVORABLE: RogersSegment[] = ['innovators', 'early_adopters', 'early_majority']

  const bySegment = SEGMENT_ORDER
    .map((seg) => {
      const group = groups.get(seg)!
      return {
        segment: SEGMENT_LABELS[seg],
        count:   group.length,
        pct:     total > 0 ? Math.round((group.length / total) * 100) : 0,
        names:   group.map((s) => s.name).slice(0, 3).join(', '),
      }
    })
    .filter((s) => s.count > 0)

  // Champions (innovators + early_adopters)
  const champions = [...(groups.get('innovators') ?? []), ...(groups.get('early_adopters') ?? [])]
    .slice(0, 4)
    .map((s) => ({
      name:       s.name,
      role:       s.role,
      department: s.department ?? '',
      segment:    SEGMENT_LABELS[getSegment(s.archetype as ArchetypeCode, s.resistance as ResistanceLevel)],
    }))

  // Blockers (laggards + late_majority con alta resistencia)
  const blockers = [...(groups.get('laggards') ?? []), ...(groups.get('late_majority') ?? [])]
    .filter((s) => s.resistance === 'alta')
    .slice(0, 4)
    .map((s) => ({
      name:       s.name,
      role:       s.role,
      department: s.department ?? '',
      segment:    SEGMENT_LABELS[getSegment(s.archetype as ArchetypeCode, s.resistance as ResistanceLevel)],
    }))

  // Resumen por departamento
  const deptMap = new Map<string, { total: number; favorable: number }>()
  for (const sh of stakeholders) {
    const dept = sh.department ?? 'Sin asignar'
    if (!deptMap.has(dept)) deptMap.set(dept, { total: 0, favorable: 0 })
    const d   = deptMap.get(dept)!
    const seg = getSegment(sh.archetype as ArchetypeCode, sh.resistance as ResistanceLevel)
    d.total++
    if (FAVORABLE.includes(seg)) d.favorable++
  }
  const byDepartment = [...deptMap.entries()].map(([dept, d]) => ({
    dept,
    total:     d.total,
    favorable: d.favorable,
    pct:       Math.round((d.favorable / d.total) * 100),
  })).sort((a, b) => b.total - a.total).slice(0, 6)

  const earlyCount   = (groups.get('innovators')?.length ?? 0) + (groups.get('early_adopters')?.length ?? 0)
  const laggardCount = (groups.get('late_majority')?.length ?? 0) + (groups.get('laggards')?.length ?? 0)

  // Top casos de uso en estado 'go'
  const topGo = useCases
    .filter((uc) => uc.status === 'go')
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
    .slice(0, 5)
    .map((uc) => ({
      name:       uc.name,
      department: uc.department,
      score:      uc.priorityScore ?? 0,
    }))

  const totalPilot = useCases.filter((uc) => uc.status === 'en_piloto').length

  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
      valueHorizon:    profile.horizonteEsperadoValor ?? 'No especificado',
    },
    maturity: {
      avg:   Math.round(t1Avg * 100) / 100,
      label: maturityLabel(t1Avg),
    },
    heatmap: {
      totalMapped:       total,
      earlyAdopterRatio: total > 0 ? Math.round((earlyCount / total) * 100) : 0,
      laggardRatio:      total > 0 ? Math.round((laggardCount / total) * 100) : 0,
      bySegment,
      byDepartment,
      keyBlockers:  blockers,
      keyChampions: champions,
    },
    useCases: {
      topGo,
      totalGo:    topGo.length,
      totalPilot,
    },
  }
}
