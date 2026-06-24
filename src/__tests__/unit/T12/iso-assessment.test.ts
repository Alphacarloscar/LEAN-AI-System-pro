import { describe, it, expect, beforeEach } from 'vitest'
import { T12_BASE_CONTROLS, T12_STATUS_CONFIG, T12_CLAUSE_ORDER } from '@/modules/T12_ISOAssessment/constants'
import { useT12Store } from '@/modules/T12_ISOAssessment/store'

// ── T12_BASE_CONTROLS (estructura del catálogo) ───────────────

describe('T12_BASE_CONTROLS', () => {
  it('contiene exactamente 25 controles', () => {
    expect(T12_BASE_CONTROLS).toHaveLength(25)
  })

  it('todos los controles tienen id, code, clause, title y description', () => {
    for (const c of T12_BASE_CONTROLS) {
      expect(c.id).toBeTruthy()
      expect(c.code).toBeTruthy()
      expect(c.clause).toBeTruthy()
      expect(c.title).toBeTruthy()
      expect(c.description).toBeTruthy()
    }
  })

  it('ids son únicos', () => {
    const ids = T12_BASE_CONTROLS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todas las clauses son válidas (pertenecen a T12_CLAUSE_ORDER)', () => {
    const validClauses = new Set(T12_CLAUSE_ORDER)
    for (const c of T12_BASE_CONTROLS) {
      expect(validClauses.has(c.clause)).toBe(true)
    }
  })
})

// ── T12_STATUS_CONFIG ─────────────────────────────────────────

describe('T12_STATUS_CONFIG', () => {
  it('cubre los 4 estados del workflow', () => {
    const statuses = Object.keys(T12_STATUS_CONFIG)
    expect(statuses).toContain('no_iniciado')
    expect(statuses).toContain('en_progreso')
    expect(statuses).toContain('pendiente_revision')
    expect(statuses).toContain('aprobado')
  })

  it('cadena de transición es lineal: no_iniciado → en_progreso → pendiente_revision → aprobado → null', () => {
    expect(T12_STATUS_CONFIG.no_iniciado.next).toBe('en_progreso')
    expect(T12_STATUS_CONFIG.en_progreso.next).toBe('pendiente_revision')
    expect(T12_STATUS_CONFIG.pendiente_revision.next).toBe('aprobado')
    expect(T12_STATUS_CONFIG.aprobado.next).toBeNull()
  })
})

// ── useT12Store ───────────────────────────────────────────────

describe('useT12Store — estado inicial', () => {
  beforeEach(() => {
    useT12Store.getState().resetAll()
  })

  it('inicializa con 25 controles en no_iniciado', () => {
    const { controls } = useT12Store.getState()
    expect(controls).toHaveLength(25)
    expect(controls.every((c) => c.status === 'no_iniciado')).toBe(true)
  })

  it('todos los controles tienen importedFromT6 = false y evidence vacía', () => {
    const { controls } = useT12Store.getState()
    expect(controls.every((c) => c.importedFromT6 === false)).toBe(true)
    expect(controls.every((c) => c.evidence === '')).toBe(true)
  })
})

describe('useT12Store — updateControl', () => {
  beforeEach(() => {
    useT12Store.getState().resetAll()
  })

  it('actualiza el status de un control por id', () => {
    useT12Store.getState().updateControl('5.1', { status: 'en_progreso' })
    const c = useT12Store.getState().controls.find((x) => x.id === '5.1')
    expect(c?.status).toBe('en_progreso')
  })

  it('actualiza evidence de un control', () => {
    useT12Store.getState().updateControl('4.1', { evidence: 'Documento de contexto adjunto' })
    const c = useT12Store.getState().controls.find((x) => x.id === '4.1')
    expect(c?.evidence).toBe('Documento de contexto adjunto')
  })

  it('no afecta a otros controles al actualizar uno', () => {
    useT12Store.getState().updateControl('4.1', { status: 'aprobado' })
    const others = useT12Store.getState().controls.filter((x) => x.id !== '4.1')
    expect(others.every((c) => c.status === 'no_iniciado')).toBe(true)
  })
})

describe('useT12Store — importFromT6', () => {
  beforeEach(() => {
    useT12Store.getState().resetAll()
  })

  it('mapea implementado → aprobado y devuelve el conteo correcto', () => {
    const t6Controls = [{ id: '5.1', status: 'implementado', notes: 'evidencia T6' }]
    const imported = useT12Store.getState().importFromT6(t6Controls)
    expect(imported).toBe(1)
    const c = useT12Store.getState().controls.find((x) => x.id === '5.1')
    expect(c?.status).toBe('aprobado')
    expect(c?.importedFromT6).toBe(true)
  })

  it('mapea en_progreso → en_progreso', () => {
    const t6Controls = [{ id: '4.1', status: 'en_progreso' }]
    useT12Store.getState().importFromT6(t6Controls)
    const c = useT12Store.getState().controls.find((x) => x.id === '4.1')
    expect(c?.status).toBe('en_progreso')
  })

  it('no importa controles sin t6Ref definido', () => {
    // 4.3 y 4.4 no tienen t6Ref en el catálogo
    const t6Controls = [{ id: '4.3', status: 'implementado' }]
    const imported = useT12Store.getState().importFromT6(t6Controls)
    expect(imported).toBe(0)
  })

  it('no reimporta un control ya importado', () => {
    const t6Controls = [{ id: '5.1', status: 'implementado' }]
    useT12Store.getState().importFromT6(t6Controls)
    const imported2 = useT12Store.getState().importFromT6(t6Controls)
    expect(imported2).toBe(0)
  })
})

describe('useT12Store — syncEngagement', () => {
  beforeEach(() => {
    useT12Store.getState().resetAll()
  })

  it('cambio de engagement resetea los controles', () => {
    useT12Store.getState().updateControl('4.1', { status: 'aprobado' })
    useT12Store.getState().syncEngagement('engagement-abc')
    useT12Store.getState().syncEngagement('engagement-xyz')
    const c = useT12Store.getState().controls.find((x) => x.id === '4.1')
    expect(c?.status).toBe('no_iniciado')
  })

  it('mismo engagement no resetea el estado existente', () => {
    useT12Store.getState().syncEngagement('engagement-abc')
    useT12Store.getState().updateControl('4.1', { status: 'aprobado' })
    useT12Store.getState().syncEngagement('engagement-abc')
    const c = useT12Store.getState().controls.find((x) => x.id === '4.1')
    expect(c?.status).toBe('aprobado')
  })
})
