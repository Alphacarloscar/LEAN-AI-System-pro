import { describe, it, expect, beforeEach } from 'vitest'
import { useT9Store } from '@/modules/T9_AIRoadmap/store'
import type { FreeItem, T9ItemOverride } from '@/modules/T9_AIRoadmap/types'

// ── Helper ────────────────────────────────────────────────────────

function makeFreeItem(overrides: Partial<FreeItem> = {}): FreeItem {
  return {
    id:          'fi-test',
    name:        'Iniciativa de prueba',
    department:  'Operaciones',
    responsible: 'Carlos',
    startMonth:  0,
    endMonth:    2,
    riskLevel:   'bajo',
    status:      'pendiente',
    createdAt:   '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── Estado inicial ────────────────────────────────────────────────

describe('useT9Store — estado inicial', () => {
  beforeEach(() => {
    useT9Store.setState({ engagementId: null, overrides: [], freeItems: [] })
  })

  it('engagementId empieza en null', () => {
    expect(useT9Store.getState().engagementId).toBeNull()
  })

  it('overrides empieza como array vacío', () => {
    expect(useT9Store.getState().overrides).toEqual([])
  })

  it('freeItems empieza como array vacío', () => {
    expect(useT9Store.getState().freeItems).toEqual([])
  })
})

// ── setOverride ───────────────────────────────────────────────────

describe('useT9Store.setOverride', () => {
  beforeEach(() => {
    useT9Store.setState({ engagementId: 'eng-1', overrides: [], freeItems: [] })
  })

  it('añade un override nuevo si no existía', () => {
    const o: T9ItemOverride = { useCaseId: 'uc-new', startMonth: 0, endMonth: 3, responsible: 'Ana' }
    useT9Store.getState().setOverride(o)
    expect(useT9Store.getState().overrides).toHaveLength(1)
    expect(useT9Store.getState().overrides[0]).toEqual(o)
  })

  it('reemplaza un override existente con el mismo useCaseId', () => {
    const o1: T9ItemOverride = { useCaseId: 'uc-x', startMonth: 0, endMonth: 1, responsible: 'A' }
    const o2: T9ItemOverride = { useCaseId: 'uc-x', startMonth: 2, endMonth: 5, responsible: 'B' }
    useT9Store.getState().setOverride(o1)
    useT9Store.getState().setOverride(o2)
    const overrides = useT9Store.getState().overrides
    expect(overrides).toHaveLength(1)
    expect(overrides[0].responsible).toBe('B')
    expect(overrides[0].startMonth).toBe(2)
  })

  it('mantiene otros overrides al actualizar uno específico', () => {
    const o1: T9ItemOverride = { useCaseId: 'uc-1', startMonth: 0, endMonth: 1, responsible: 'A' }
    const o2: T9ItemOverride = { useCaseId: 'uc-2', startMonth: 0, endMonth: 2, responsible: 'B' }
    const o2Updated: T9ItemOverride = { useCaseId: 'uc-2', startMonth: 1, endMonth: 3, responsible: 'B2' }
    useT9Store.getState().setOverride(o1)
    useT9Store.getState().setOverride(o2)
    useT9Store.getState().setOverride(o2Updated)
    const overrides = useT9Store.getState().overrides
    expect(overrides).toHaveLength(2)
    const found1 = overrides.find((o) => o.useCaseId === 'uc-1')
    expect(found1?.responsible).toBe('A')
  })
})

// ── addFreeItem ───────────────────────────────────────────────────

describe('useT9Store.addFreeItem', () => {
  beforeEach(() => {
    useT9Store.setState({ engagementId: 'eng-1', overrides: [], freeItems: [] })
  })

  it('añade un item con id y createdAt generados automáticamente', () => {
    useT9Store.getState().addFreeItem({
      name: 'Nueva iniciativa', department: 'IT',
      responsible: 'Pedro', startMonth: 1, endMonth: 4,
      riskLevel: 'medio', status: 'en_curso',
    })
    const items = useT9Store.getState().freeItems
    expect(items).toHaveLength(1)
    expect(items[0].id).toBeTruthy()
    expect(items[0].createdAt).toBeTruthy()
    expect(items[0].name).toBe('Nueva iniciativa')
  })

  it('cada item añadido tiene un id único', () => {
    useT9Store.getState().addFreeItem({ name: 'A', department: 'IT', responsible: 'X', startMonth: 0, endMonth: 1, riskLevel: 'bajo', status: 'pendiente' })
    useT9Store.getState().addFreeItem({ name: 'B', department: 'IT', responsible: 'Y', startMonth: 0, endMonth: 1, riskLevel: 'bajo', status: 'pendiente' })
    const items = useT9Store.getState().freeItems
    expect(items[0].id).not.toBe(items[1].id)
  })

  it('acumula múltiples items', () => {
    for (let i = 0; i < 3; i++) {
      useT9Store.getState().addFreeItem({ name: `Item ${i}`, department: 'Ops', responsible: 'Z', startMonth: 0, endMonth: 1, riskLevel: 'bajo', status: 'pendiente' })
    }
    expect(useT9Store.getState().freeItems).toHaveLength(3)
  })
})

// ── updateFreeItem ────────────────────────────────────────────────

describe('useT9Store.updateFreeItem', () => {
  beforeEach(() => {
    useT9Store.setState({ engagementId: 'eng-1', overrides: [], freeItems: [makeFreeItem({ id: 'fi-a', name: 'Original' })] })
  })

  it('actualiza solo los campos indicados del item correcto', () => {
    useT9Store.getState().updateFreeItem('fi-a', { name: 'Actualizado', status: 'completado' })
    const item = useT9Store.getState().freeItems[0]
    expect(item.name).toBe('Actualizado')
    expect(item.status).toBe('completado')
    // Campos no tocados se mantienen
    expect(item.department).toBe('Operaciones')
    expect(item.responsible).toBe('Carlos')
  })

  it('no modifica otros items al actualizar uno', () => {
    useT9Store.setState({
      freeItems: [
        makeFreeItem({ id: 'fi-keep', name: 'Keep' }),
        makeFreeItem({ id: 'fi-edit', name: 'Edit' }),
      ],
    })
    useT9Store.getState().updateFreeItem('fi-edit', { name: 'Edited' })
    const items = useT9Store.getState().freeItems
    const kept = items.find((i) => i.id === 'fi-keep')
    expect(kept?.name).toBe('Keep')
  })

  it('no hace nada si el id no existe', () => {
    useT9Store.getState().updateFreeItem('fi-nonexistent', { name: 'Ghost' })
    const items = useT9Store.getState().freeItems
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Original')
  })
})

// ── removeFreeItem ────────────────────────────────────────────────

describe('useT9Store.removeFreeItem', () => {
  beforeEach(() => {
    useT9Store.setState({
      freeItems: [
        makeFreeItem({ id: 'fi-1', name: 'Uno' }),
        makeFreeItem({ id: 'fi-2', name: 'Dos' }),
        makeFreeItem({ id: 'fi-3', name: 'Tres' }),
      ],
    })
  })

  it('elimina el item con el id indicado', () => {
    useT9Store.getState().removeFreeItem('fi-2')
    const items = useT9Store.getState().freeItems
    expect(items).toHaveLength(2)
    expect(items.find((i) => i.id === 'fi-2')).toBeUndefined()
  })

  it('mantiene el resto de items intactos', () => {
    useT9Store.getState().removeFreeItem('fi-1')
    const ids = useT9Store.getState().freeItems.map((i) => i.id)
    expect(ids).toContain('fi-2')
    expect(ids).toContain('fi-3')
  })

  it('no falla si el id no existe', () => {
    useT9Store.getState().removeFreeItem('fi-nonexistent')
    expect(useT9Store.getState().freeItems).toHaveLength(3)
  })
})

// ── syncEngagement ────────────────────────────────────────────────

describe('useT9Store.syncEngagement', () => {
  beforeEach(() => {
    useT9Store.setState({
      engagementId: 'eng-old',
      overrides: [{ useCaseId: 'uc-1', startMonth: 0, endMonth: 1, responsible: 'X' }],
      freeItems: [makeFreeItem()],
    })
  })

  it('limpia overrides y freeItems cuando el engagement cambia', () => {
    useT9Store.getState().syncEngagement('eng-new')
    const state = useT9Store.getState()
    expect(state.engagementId).toBe('eng-new')
    expect(state.overrides).toHaveLength(0)
    expect(state.freeItems).toHaveLength(0)
  })

  it('no limpia si se llama con el mismo engagementId', () => {
    useT9Store.getState().syncEngagement('eng-old')
    expect(useT9Store.getState().freeItems).toHaveLength(1)
    expect(useT9Store.getState().overrides).toHaveLength(1)
  })

  it('acepta null y limpia el store', () => {
    useT9Store.getState().syncEngagement(null)
    const state = useT9Store.getState()
    expect(state.engagementId).toBeNull()
    expect(state.freeItems).toHaveLength(0)
    expect(state.overrides).toHaveLength(0)
  })
})
