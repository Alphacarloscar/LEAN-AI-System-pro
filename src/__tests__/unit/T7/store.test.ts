import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useT7Store } from '@/modules/T7_AdoptionHeatmap/store'
import type { GeneratedChangePlan } from '@/modules/T7_AdoptionHeatmap/types'

vi.mock('@/services/t7.service', () => ({
  saveChangePlanOutput: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn(),
}))

const MOCK_PLAN: GeneratedChangePlan = {
  phases: [
    {
      phase:     'Mes 1–2',
      title:     'Sensibilización',
      icon:      '📢',
      objective: 'Crear conciencia',
      segments:  ['innovators', 'early_adopters'],
      actions:   ['Workshop inicial', 'Comunicación al equipo'],
      risk:      'Resistencia pasiva',
    },
  ],
  contextualNote: 'Alta resistencia en mandos medios',
  generatedAt:    '2026-01-01T00:00:00Z',
}

// ── Estado inicial ────────────────────────────────────────────

describe('useT7Store — estado inicial', () => {
  beforeEach(() => {
    useT7Store.setState({
      engagementId:      null,
      generatedPlan:     null,
      persistenceStatus: 'idle',
      persistenceError:  null,
    })
  })

  it('generatedPlan es null por defecto', () => {
    expect(useT7Store.getState().generatedPlan).toBeNull()
  })

  it('persistenceStatus es idle por defecto', () => {
    expect(useT7Store.getState().persistenceStatus).toBe('idle')
  })

  it('engagementId es null por defecto', () => {
    expect(useT7Store.getState().engagementId).toBeNull()
  })
})

// ── saveGeneratedPlan ─────────────────────────────────────────

describe('useT7Store — saveGeneratedPlan', () => {
  beforeEach(() => {
    useT7Store.setState({ generatedPlan: null, engagementId: null })
  })

  it('guarda el plan y el engagementId', () => {
    useT7Store.getState().saveGeneratedPlan(MOCK_PLAN, 'eng-001')
    expect(useT7Store.getState().generatedPlan).toEqual(MOCK_PLAN)
    expect(useT7Store.getState().engagementId).toBe('eng-001')
  })

  it('acepta engagementId null', () => {
    useT7Store.getState().saveGeneratedPlan(MOCK_PLAN, null)
    expect(useT7Store.getState().generatedPlan).toEqual(MOCK_PLAN)
    expect(useT7Store.getState().engagementId).toBeNull()
  })
})

// ── clearGeneratedPlan ────────────────────────────────────────

describe('useT7Store — clearGeneratedPlan', () => {
  it('limpia el plan y resetea persistenceStatus', () => {
    useT7Store.setState({ generatedPlan: MOCK_PLAN, persistenceStatus: 'saved' })
    useT7Store.getState().clearGeneratedPlan()
    expect(useT7Store.getState().generatedPlan).toBeNull()
    expect(useT7Store.getState().persistenceStatus).toBe('idle')
    expect(useT7Store.getState().persistenceError).toBeNull()
  })
})

// ── syncEngagement ────────────────────────────────────────────

describe('useT7Store — syncEngagement', () => {
  it('cambio de engagement → limpia el plan', () => {
    useT7Store.setState({ engagementId: 'old', generatedPlan: MOCK_PLAN })
    useT7Store.getState().syncEngagement('new-id')
    expect(useT7Store.getState().engagementId).toBe('new-id')
    expect(useT7Store.getState().generatedPlan).toBeNull()
    expect(useT7Store.getState().persistenceStatus).toBe('idle')
  })

  it('mismo engagement → NO limpia el plan', () => {
    useT7Store.setState({ engagementId: 'same', generatedPlan: MOCK_PLAN })
    useT7Store.getState().syncEngagement('same')
    expect(useT7Store.getState().generatedPlan).toEqual(MOCK_PLAN)
  })
})

// ── setPersistence ────────────────────────────────────────────

describe('useT7Store — setPersistence', () => {
  it('actualiza status y error', () => {
    useT7Store.getState().setPersistence('error', 'Timeout')
    expect(useT7Store.getState().persistenceStatus).toBe('error')
    expect(useT7Store.getState().persistenceError).toBe('Timeout')
  })

  it('sin error → persistenceError es null', () => {
    useT7Store.getState().setPersistence('saved')
    expect(useT7Store.getState().persistenceError).toBeNull()
  })
})

// ── retrySave ─────────────────────────────────────────────────

describe('useT7Store — retrySave', () => {
  it('no actúa si generatedPlan es null', async () => {
    useT7Store.setState({ generatedPlan: null, persistenceStatus: 'idle' })
    await useT7Store.getState().retrySave('proj-1')
    expect(useT7Store.getState().persistenceStatus).toBe('idle')
  })

  it('status saved si saveChangePlanOutput resuelve', async () => {
    const { saveChangePlanOutput } = await import('@/services/t7.service')
    vi.mocked(saveChangePlanOutput).mockResolvedValue(undefined)
    useT7Store.setState({ generatedPlan: MOCK_PLAN })
    await useT7Store.getState().retrySave('proj-1')
    expect(useT7Store.getState().persistenceStatus).toBe('saved')
  })

  it('status error si saveChangePlanOutput falla', async () => {
    const { saveChangePlanOutput } = await import('@/services/t7.service')
    vi.mocked(saveChangePlanOutput).mockRejectedValue(new Error('Network error'))
    useT7Store.setState({ generatedPlan: MOCK_PLAN })
    await useT7Store.getState().retrySave('proj-1')
    expect(useT7Store.getState().persistenceStatus).toBe('error')
    expect(useT7Store.getState().persistenceError).toBe('Network error')
  })
})
