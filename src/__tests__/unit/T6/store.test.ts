import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useT6Store } from '@/modules/T6_RiskGovernance/store'
import type { GeneratedPolicyContent } from '@/modules/T6_RiskGovernance/types'

// Mock de servicios y reportError para no necesitar Supabase
vi.mock('@/services/t6.service', () => ({
  savePolicyOutput: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn(),
}))

const MOCK_POLICY: GeneratedPolicyContent = {
  declaracion_opening:  'Esta política establece el marco de uso responsable de la IA.',
  declaracion_mandate:  'Todo sistema de IA debe ser evaluado y registrado.',
  alcance_context:      'Aplica a todos los departamentos que implanten sistemas de IA.',
  principios:           [
    { title: 'Transparencia',    desc: 'Los sistemas IA deben ser explicables.' },
    { title: 'Responsabilidad',  desc: 'Cada sistema IA tiene un propietario.' },
  ],
  contexto_sectorial:   'Sector Manufactura: riesgos regulatorios EU AI Act Annex III.',
  generatedAt:          '2026-01-01T00:00:00Z',
  sector:               'Manufactura',
  tamano:               'grande',
}

// ── Estado inicial ────────────────────────────────────────────

describe('useT6Store — estado inicial', () => {
  beforeEach(() => {
    useT6Store.getState().resetControls()
    useT6Store.setState({
      engagementId:      null,
      generatedPolicy:   null,
      isPolicyGenerating: false,
      persistenceStatus: 'idle',
      persistenceError:  null,
    })
  })

  it('controls inicializa con controles en estado no_iniciado', () => {
    const { controls } = useT6Store.getState()
    expect(controls.length).toBeGreaterThan(0)
    expect(controls.every((c) => c.status === 'no_iniciado')).toBe(true)
  })

  it('generatedPolicy es null por defecto', () => {
    expect(useT6Store.getState().generatedPolicy).toBeNull()
  })

  it('persistenceStatus es idle por defecto', () => {
    expect(useT6Store.getState().persistenceStatus).toBe('idle')
  })
})

// ── updateControl ─────────────────────────────────────────────

describe('useT6Store — updateControl', () => {
  beforeEach(() => {
    useT6Store.getState().resetControls()
  })

  it('actualiza el status del control indicado', () => {
    const { controls } = useT6Store.getState()
    const firstId = controls[0].id
    useT6Store.getState().updateControl(firstId, 'en_progreso')
    const updated = useT6Store.getState().controls.find((c) => c.id === firstId)
    expect(updated?.status).toBe('en_progreso')
    expect(updated?.autoInferred).toBe(false)
  })

  it('actualiza las notes del control', () => {
    const { controls } = useT6Store.getState()
    const firstId = controls[0].id
    useT6Store.getState().updateControl(firstId, 'en_progreso', 'Nota de prueba')
    const updated = useT6Store.getState().controls.find((c) => c.id === firstId)
    expect(updated?.notes).toBe('Nota de prueba')
  })

  it('no modifica otros controles', () => {
    const { controls } = useT6Store.getState()
    const firstId = controls[0].id
    useT6Store.getState().updateControl(firstId, 'implementado')
    const others = useT6Store.getState().controls.filter((c) => c.id !== firstId)
    expect(others.every((c) => c.status === 'no_iniciado')).toBe(true)
  })
})

// ── Policy management ─────────────────────────────────────────

describe('useT6Store — policy management', () => {
  beforeEach(() => {
    useT6Store.setState({ generatedPolicy: null, isPolicyGenerating: false })
  })

  it('saveGeneratedPolicy guarda la política y limpia isPolicyGenerating', () => {
    useT6Store.getState().setPolicyGenerating(true)
    useT6Store.getState().saveGeneratedPolicy(MOCK_POLICY)
    expect(useT6Store.getState().generatedPolicy).toEqual(MOCK_POLICY)
    expect(useT6Store.getState().isPolicyGenerating).toBe(false)
  })

  it('clearGeneratedPolicy limpia la política y resetea persistenceStatus', () => {
    useT6Store.setState({ generatedPolicy: MOCK_POLICY, persistenceStatus: 'saved' })
    useT6Store.getState().clearGeneratedPolicy()
    expect(useT6Store.getState().generatedPolicy).toBeNull()
    expect(useT6Store.getState().persistenceStatus).toBe('idle')
  })

  it('setPolicyGenerating actualiza el flag', () => {
    useT6Store.getState().setPolicyGenerating(true)
    expect(useT6Store.getState().isPolicyGenerating).toBe(true)
    useT6Store.getState().setPolicyGenerating(false)
    expect(useT6Store.getState().isPolicyGenerating).toBe(false)
  })
})

// ── setPersistence ────────────────────────────────────────────

describe('useT6Store — setPersistence', () => {
  it('actualiza el status y error de persistencia', () => {
    useT6Store.getState().setPersistence('error', 'Connection refused')
    expect(useT6Store.getState().persistenceStatus).toBe('error')
    expect(useT6Store.getState().persistenceError).toBe('Connection refused')
  })

  it('sin error → persistenceError es null', () => {
    useT6Store.getState().setPersistence('saved')
    expect(useT6Store.getState().persistenceStatus).toBe('saved')
    expect(useT6Store.getState().persistenceError).toBeNull()
  })
})

// ── syncEngagement ────────────────────────────────────────────

describe('useT6Store — syncEngagement', () => {
  it('cambia engagement → resetea controles y política', () => {
    useT6Store.setState({ engagementId: 'old', generatedPolicy: MOCK_POLICY })
    useT6Store.getState().updateControl(useT6Store.getState().controls[0].id, 'implementado')
    useT6Store.getState().syncEngagement('new-id')

    expect(useT6Store.getState().engagementId).toBe('new-id')
    expect(useT6Store.getState().generatedPolicy).toBeNull()
    expect(useT6Store.getState().controls.every((c) => c.status === 'no_iniciado')).toBe(true)
  })

  it('mismo engagement → NO resetea el estado', () => {
    useT6Store.setState({ engagementId: 'same' })
    useT6Store.getState().updateControl(useT6Store.getState().controls[0].id, 'implementado')
    useT6Store.getState().syncEngagement('same')
    const firstControl = useT6Store.getState().controls[0]
    expect(firstControl.status).toBe('implementado')
  })
})

// ── retrySave ─────────────────────────────────────────────────

describe('useT6Store — retrySave', () => {
  it('no hace nada si generatedPolicy es null', async () => {
    useT6Store.setState({ generatedPolicy: null, persistenceStatus: 'idle' })
    await useT6Store.getState().retrySave('project-123')
    expect(useT6Store.getState().persistenceStatus).toBe('idle')
  })

  it('llama a savePolicyOutput y actualiza status a saved', async () => {
    const { savePolicyOutput } = await import('@/services/t6.service')
    vi.mocked(savePolicyOutput).mockResolvedValue(undefined)

    useT6Store.setState({ generatedPolicy: MOCK_POLICY })
    await useT6Store.getState().retrySave('project-123')
    expect(useT6Store.getState().persistenceStatus).toBe('saved')
    expect(savePolicyOutput).toHaveBeenCalledWith('project-123', MOCK_POLICY)
  })

  it('actualiza status a error si savePolicyOutput falla', async () => {
    const { savePolicyOutput } = await import('@/services/t6.service')
    vi.mocked(savePolicyOutput).mockRejectedValue(new Error('DB error'))

    useT6Store.setState({ generatedPolicy: MOCK_POLICY })
    await useT6Store.getState().retrySave('project-123')
    expect(useT6Store.getState().persistenceStatus).toBe('error')
    expect(useT6Store.getState().persistenceError).toBe('DB error')
  })
})
