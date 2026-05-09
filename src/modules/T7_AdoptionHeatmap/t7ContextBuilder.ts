// ============================================================
// T7 Context Builder
//
// Ensambla el contexto para ai-recommend tool T7.
// Replica la lógica getSegment de T7View para clasificar
// stakeholders en los 5 segmentos de la curva de Rogers.
// ============================================================

import type { RogersSegment }  from './types'
import type { Stakeholder, ArchetypeCode, ResistanceLevel } from '@/modules/T2_StakeholderMatrix/types'
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
  especialista: 'late_majority',
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
