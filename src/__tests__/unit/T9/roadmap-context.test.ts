import { describe, it, expect, beforeEach } from 'vitest'
import { buildT9RecommendationContext }      from '@/modules/T9_AIRoadmap/t9ContextBuilder'
import { useT9Store }                        from '@/modules/T9_AIRoadmap/store'
import type { FreeItem, T9ItemOverride }     from '@/modules/T9_AIRoadmap/types'
import type { UseCase }                      from '@/modules/T4_UseCasePriorityBoard/types'
import type { CompanyProfile }               from '@/modules/CompanyProfile/types'

// ── Helpers ───────────────────────────────────────────────────

const profile: CompanyProfile = {
  engagementName:        'ACME Test',
  sector:                'Retail',
  tamanoEmpresa:         'mediana',
  objetivoPrincipalIA:   'Reducir costes',
  horizonteEsperadoValor: '6 meses',
} as CompanyProfile

function makeUseCase(overrides: Partial<UseCase> = {}): UseCase {
  return {
    id:            'uc-1',
    name:          'Test UC',
    department:    'IT',
    status:        'go',
    priorityScore: 80,
    aiCategory:    'automatizacion_rpa',
    scores:        { kpiImpact: 80, feasibility: 70, aiRisk: 20, dataDependency: 20 },
    createdAt:     '2024-01-01T00:00:00Z',
    ...overrides,
  } as UseCase
}

function makeFreeItem(overrides: Partial<FreeItem> = {}): FreeItem {
  return {
    id:          'fi-1',
    name:        'Free Initiative',
    department:  'HR',
    responsible: 'Alice',
    startMonth:  0,
    endMonth:    2,
    riskLevel:   'bajo',
    status:      'pendiente',
    createdAt:   '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── buildT9RecommendationContext ──────────────────────────────

describe('buildT9RecommendationContext', () => {
  it('retorna la info de empresa del perfil', () => {
    const ctx = buildT9RecommendationContext([], [], [], profile)
    expect(ctx.company.sector).toBe('Retail')
    expect(ctx.company.size).toBe('mediana')
    expect(ctx.company.mainAIObjective).toBe('Reducir costes')
    expect(ctx.company.valueHorizon).toBe('6 meses')
  })

  it('totalItems = 0 cuando no hay items', () => {
    const ctx = buildT9RecommendationContext([], [], [], profile)
    expect(ctx.roadmap.totalItems).toBe(0)
    expect(ctx.roadmap.t4ImportedCount).toBe(0)
    expect(ctx.roadmap.freeItemCount).toBe(0)
  })

  it('cuenta correctamente los items importados de T4', () => {
    const ucs = [makeUseCase({ id: 'uc-1' }), makeUseCase({ id: 'uc-2' })]
    const ctx  = buildT9RecommendationContext(ucs, [], [], profile)
    expect(ctx.roadmap.t4ImportedCount).toBe(2)
    expect(ctx.roadmap.freeItemCount).toBe(0)
    expect(ctx.roadmap.totalItems).toBe(2)
  })

  it('cuenta correctamente los free items', () => {
    const fi  = [makeFreeItem({ id: 'fi-1' }), makeFreeItem({ id: 'fi-2' })]
    const ctx = buildT9RecommendationContext([], fi, [], profile)
    expect(ctx.roadmap.freeItemCount).toBe(2)
    expect(ctx.roadmap.t4ImportedCount).toBe(0)
    expect(ctx.roadmap.totalItems).toBe(2)
  })

  it('usa overrides para el responsable de un caso de uso T4', () => {
    const uc: UseCase = makeUseCase({ id: 'uc-override', department: 'Ventas' })
    const override: T9ItemOverride = {
      useCaseId:   'uc-override',
      startMonth:  1,
      endMonth:    3,
      responsible: 'Override Owner',
    }
    const ctx = buildT9RecommendationContext([uc], [], [override], profile)
    const item = ctx.roadmap.items.find(i => i.name === 'Test UC')
    expect(item?.responsible).toBe('Override Owner')
    expect(item?.startMonth).toBe(1)
    expect(item?.endMonth).toBe(3)
  })

  it('detecta withoutOwner correctamente', () => {
    const uc = makeUseCase({ id: 'uc-no-owner' })
    // Sin override ni roadmap.owner → responsible vacío
    const ctx = buildT9RecommendationContext([uc], [], [], profile)
    expect(ctx.roadmap.withoutOwner).toBe(1)
  })

  it('mapea riesgo alto/prohibido a "alto"', () => {
    const uc = makeUseCase({
      id: 'uc-risk',
      aiActClassification: { riskLevel: 'alto' } as UseCase['aiActClassification'],
    })
    const ctx  = buildT9RecommendationContext([uc], [], [], profile)
    const item = ctx.roadmap.items.find(i => i.name === 'Test UC')
    expect(item?.riskLevel).toBe('alto')
  })

  it('mapea riesgo limitado a "medio"', () => {
    const uc = makeUseCase({
      id: 'uc-risk-med',
      aiActClassification: { riskLevel: 'limitado' } as UseCase['aiActClassification'],
    })
    const ctx  = buildT9RecommendationContext([uc], [], [], profile)
    const item = ctx.roadmap.items.find(i => i.name === 'Test UC')
    expect(item?.riskLevel).toBe('medio')
  })

  it('agrupa byDept correctamente', () => {
    const ucs = [
      makeUseCase({ id: 'uc-a', department: 'IT' }),
      makeUseCase({ id: 'uc-b', department: 'IT' }),
      makeUseCase({ id: 'uc-c', department: 'Ventas' }),
    ]
    const ctx  = buildT9RecommendationContext(ucs, [], [], profile)
    const itEntry = ctx.roadmap.byDept.find(d => d.dept === 'IT')
    expect(itEntry?.count).toBe(2)
    const ventasEntry = ctx.roadmap.byDept.find(d => d.dept === 'Ventas')
    expect(ventasEntry?.count).toBe(1)
  })

  it('items en roadmap.items limitados a 12', () => {
    const ucs = Array.from({ length: 15 }, (_, i) =>
      makeUseCase({ id: `uc-${i}`, name: `UC ${i}` })
    )
    const ctx = buildT9RecommendationContext(ucs, [], [], profile)
    expect(ctx.roadmap.items.length).toBeLessThanOrEqual(12)
  })
})

// ── useT9Store ────────────────────────────────────────────────

describe('useT9Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useT9Store.setState({ engagementId: null, overrides: [], freeItems: [] })
  })

  it('syncEngagement limpia si el engagement cambia', () => {
    useT9Store.setState({
      engagementId: 'old-id',
      overrides: [{ useCaseId: 'uc-1', startMonth: 0, endMonth: 1, responsible: 'X' }],
      freeItems: [makeFreeItem()],
    })
    useT9Store.getState().syncEngagement('new-id')
    const state = useT9Store.getState()
    expect(state.engagementId).toBe('new-id')
    expect(state.overrides).toHaveLength(0)
    expect(state.freeItems).toHaveLength(0)
  })

  it('syncEngagement NO limpia si es el mismo engagement', () => {
    useT9Store.setState({
      engagementId: 'same-id',
      freeItems: [makeFreeItem()],
    })
    useT9Store.getState().syncEngagement('same-id')
    expect(useT9Store.getState().freeItems).toHaveLength(1)
  })

  it('addFreeItem añade el item con id y createdAt', () => {
    const { addFreeItem } = useT9Store.getState()
    addFreeItem({
      name: 'Nueva iniciativa', department: 'Ops',
      responsible: 'Bob', startMonth: 0, endMonth: 2,
      riskLevel: 'bajo', status: 'pendiente',
    })
    const items = useT9Store.getState().freeItems
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Nueva iniciativa')
    expect(items[0].id).toBeTruthy()
    expect(items[0].createdAt).toBeTruthy()
  })

  it('updateFreeItem actualiza solo el item indicado', () => {
    useT9Store.setState({ freeItems: [makeFreeItem({ id: 'fi-x', name: 'Original' })] })
    useT9Store.getState().updateFreeItem('fi-x', { name: 'Updated', responsible: 'Nuevo Owner' })
    const item = useT9Store.getState().freeItems[0]
    expect(item.name).toBe('Updated')
    expect(item.responsible).toBe('Nuevo Owner')
    // Status no cambia
    expect(item.status).toBe('pendiente')
  })

  it('removeFreeItem elimina el item correcto', () => {
    useT9Store.setState({
      freeItems: [
        makeFreeItem({ id: 'fi-keep', name: 'Keep' }),
        makeFreeItem({ id: 'fi-remove', name: 'Remove' }),
      ],
    })
    useT9Store.getState().removeFreeItem('fi-remove')
    const items = useT9Store.getState().freeItems
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('fi-keep')
  })

  it('setOverride reemplaza si ya existe para ese useCaseId', () => {
    const override1: T9ItemOverride = { useCaseId: 'uc-1', startMonth: 0, endMonth: 1, responsible: 'A' }
    const override2: T9ItemOverride = { useCaseId: 'uc-1', startMonth: 2, endMonth: 4, responsible: 'B' }
    useT9Store.getState().setOverride(override1)
    useT9Store.getState().setOverride(override2)
    const overrides = useT9Store.getState().overrides
    expect(overrides).toHaveLength(1)
    expect(overrides[0].responsible).toBe('B')
    expect(overrides[0].startMonth).toBe(2)
  })
})
