// ============================================================
// T9 Context Builder
//
// Ensambla el contexto para ai-recommend tool T9.
// El roadmap combina items importados de T4 (go) + free items.
// ============================================================

import type { FreeItem, T9ItemOverride } from './types'
import type { UseCase }                  from '@/modules/T4_UseCasePriorityBoard/types'
import type { CompanyProfile }           from '@/modules/CompanyProfile/types'

export interface T9RecommendationContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
    valueHorizon:    string
  }
  roadmap: {
    totalItems:       number
    t4ImportedCount:  number
    freeItemCount:    number
    withoutOwner:     number
    items: {
      name:        string
      type:        'go_usecase' | 'free'
      startMonth:  number
      endMonth:    number
      riskLevel:   string
      responsible: string
      department:  string
    }[]
    byMonth: { month: number; count: number }[]
    byRisk:  { level: string; count: number }[]
    byDept:  { dept: string;  count: number }[]
  }
}

export function buildT9RecommendationContext(
  goUseCases: UseCase[],
  freeItems:  FreeItem[],
  overrides:  T9ItemOverride[],
  profile:    CompanyProfile,
): T9RecommendationContext {

  // Mapear overrides por useCaseId
  const overrideMap = new Map(overrides.map((o) => [o.useCaseId, o]))

  // Items importados de T4
  type RoadmapItem = {
    name: string; type: 'go_usecase' | 'free'
    startMonth: number; endMonth: number
    riskLevel: string; responsible: string; department: string
  }

  const t4Items: RoadmapItem[] = goUseCases.map((uc) => {
    const override = overrideMap.get(uc.id)
    const startMonth = override?.startMonth ?? 0
    const endMonth   = override?.endMonth   ?? 1
    const responsible = override?.responsible ?? uc.roadmap?.owner ?? ''

    const aiActRisk = uc.aiActClassification?.riskLevel
    const riskLevel =
      aiActRisk === 'prohibido' || aiActRisk === 'alto' ? 'alto' :
      aiActRisk === 'limitado'                          ? 'medio' : 'bajo'

    return {
      name:        uc.name,
      type:        'go_usecase',
      startMonth,
      endMonth,
      riskLevel,
      responsible,
      department:  uc.department,
    }
  })

  const freeRows: RoadmapItem[] = freeItems.map((fi) => ({
    name:        fi.name,
    type:        'free',
    startMonth:  fi.startMonth,
    endMonth:    fi.endMonth,
    riskLevel:   fi.riskLevel,
    responsible: fi.responsible,
    department:  fi.department,
  }))

  const allItems = [...t4Items, ...freeRows]

  // Por mes
  const monthMap = new Map<number, number>()
  for (const item of allItems) {
    for (let m = item.startMonth; m <= item.endMonth; m++) {
      monthMap.set(m, (monthMap.get(m) ?? 0) + 1)
    }
  }
  const byMonth = Array.from(monthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([month, count]) => ({ month, count }))

  // Por riesgo
  const riskMap = new Map<string, number>()
  for (const item of allItems) {
    riskMap.set(item.riskLevel, (riskMap.get(item.riskLevel) ?? 0) + 1)
  }
  const byRisk = Array.from(riskMap.entries()).map(([level, count]) => ({ level, count }))

  // Por departamento
  const deptMap = new Map<string, number>()
  for (const item of allItems) {
    if (item.department) deptMap.set(item.department, (deptMap.get(item.department) ?? 0) + 1)
  }
  const byDept = Array.from(deptMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([dept, count]) => ({ dept, count }))

  const withoutOwner = allItems.filter((i) => !i.responsible).length

  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
      valueHorizon:    profile.horizonteEsperadoValor,
    },
    roadmap: {
      totalItems:      allItems.length,
      t4ImportedCount: t4Items.length,
      freeItemCount:   freeRows.length,
      withoutOwner,
      items:   allItems.slice(0, 12),
      byMonth,
      byRisk,
      byDept,
    },
  }
}
