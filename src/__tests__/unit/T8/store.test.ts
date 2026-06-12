import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useT8Store } from '@/modules/T8_CommunicationMap/store'
import type { GeneratedT8Content } from '@/modules/T8_CommunicationMap/types'

vi.mock('@/services/t8.service', () => ({
  saveCommunicationOutput: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn(),
}))

const MOCK_CONTENT: GeneratedT8Content = {
  archetypeMessages: [
    {
      archetypeCode:  'adoptador',
      archetypeLabel: 'Adoptador Entusiasta',
      headline:       'IA como acelerador de tu trabajo',
      keyPoints:      ['Ahorra tiempo', 'Mejora resultados'],
      doNotSay:       'No mencionar riesgos laborales',
      openingLine:    'Esta IA está diseñada para amplificar tu impacto',
      channel:        'email',
      resistanceNote: 'Ninguna resistencia esperada',
    },
  ],
  contextualNote: 'Empresa en fase exploradora',
  generatedAt:    '2026-01-01T00:00:00Z',
}

// ── Estado inicial ────────────────────────────────────────────

describe('useT8Store — estado inicial', () => {
  beforeEach(() => {
    useT8Store.setState({
      engagementId:      null,
      generatedContent:  null,
      persistenceStatus: 'idle',
      persistenceError:  null,
    })
  })

  it('generatedContent es null por defecto', () => {
    expect(useT8Store.getState().generatedContent).toBeNull()
  })

  it('engagementId es null por defecto', () => {
    expect(useT8Store.getState().engagementId).toBeNull()
  })

  it('persistenceStatus es idle por defecto', () => {
    expect(useT8Store.getState().persistenceStatus).toBe('idle')
  })
})

// ── saveGeneratedContent ──────────────────────────────────────

describe('useT8Store — saveGeneratedContent', () => {
  beforeEach(() => {
    useT8Store.setState({ generatedContent: null, engagementId: null })
  })

  it('guarda el contenido y el engagementId', () => {
    useT8Store.getState().saveGeneratedContent(MOCK_CONTENT, 'eng-abc')
    expect(useT8Store.getState().generatedContent).toEqual(MOCK_CONTENT)
    expect(useT8Store.getState().engagementId).toBe('eng-abc')
  })

  it('acepta engagementId null', () => {
    useT8Store.getState().saveGeneratedContent(MOCK_CONTENT, null)
    expect(useT8Store.getState().generatedContent).toEqual(MOCK_CONTENT)
  })
})

// ── clearGeneratedContent ─────────────────────────────────────

describe('useT8Store — clearGeneratedContent', () => {
  it('limpia el contenido y resetea persistenceStatus', () => {
    useT8Store.setState({ generatedContent: MOCK_CONTENT, persistenceStatus: 'saved' })
    useT8Store.getState().clearGeneratedContent()
    expect(useT8Store.getState().generatedContent).toBeNull()
    expect(useT8Store.getState().persistenceStatus).toBe('idle')
    expect(useT8Store.getState().persistenceError).toBeNull()
  })
})

// ── syncEngagement ────────────────────────────────────────────

describe('useT8Store — syncEngagement', () => {
  it('cambio de engagement → limpia el contenido', () => {
    useT8Store.setState({ engagementId: 'old', generatedContent: MOCK_CONTENT })
    useT8Store.getState().syncEngagement('new-id')
    expect(useT8Store.getState().engagementId).toBe('new-id')
    expect(useT8Store.getState().generatedContent).toBeNull()
    expect(useT8Store.getState().persistenceStatus).toBe('idle')
  })

  it('mismo engagement → NO limpia el contenido', () => {
    useT8Store.setState({ engagementId: 'same', generatedContent: MOCK_CONTENT })
    useT8Store.getState().syncEngagement('same')
    expect(useT8Store.getState().generatedContent).toEqual(MOCK_CONTENT)
  })
})

// ── setPersistence ────────────────────────────────────────────

describe('useT8Store — setPersistence', () => {
  it('actualiza status y error correctamente', () => {
    useT8Store.getState().setPersistence('saving')
    expect(useT8Store.getState().persistenceStatus).toBe('saving')

    useT8Store.getState().setPersistence('error', 'Supabase down')
    expect(useT8Store.getState().persistenceStatus).toBe('error')
    expect(useT8Store.getState().persistenceError).toBe('Supabase down')
  })

  it('sin error → persistenceError es null', () => {
    useT8Store.getState().setPersistence('saved')
    expect(useT8Store.getState().persistenceError).toBeNull()
  })
})

// ── retrySave ─────────────────────────────────────────────────

describe('useT8Store — retrySave', () => {
  it('no actúa si generatedContent es null', async () => {
    useT8Store.setState({ generatedContent: null, persistenceStatus: 'idle' })
    await useT8Store.getState().retrySave('proj-x')
    expect(useT8Store.getState().persistenceStatus).toBe('idle')
  })

  it('status saved si saveCommunicationOutput resuelve', async () => {
    const { saveCommunicationOutput } = await import('@/services/t8.service')
    vi.mocked(saveCommunicationOutput).mockResolvedValue(undefined)
    useT8Store.setState({ generatedContent: MOCK_CONTENT })
    await useT8Store.getState().retrySave('proj-x')
    expect(useT8Store.getState().persistenceStatus).toBe('saved')
    expect(saveCommunicationOutput).toHaveBeenCalledWith('proj-x', MOCK_CONTENT)
  })

  it('status error si saveCommunicationOutput falla', async () => {
    const { saveCommunicationOutput } = await import('@/services/t8.service')
    vi.mocked(saveCommunicationOutput).mockRejectedValue(new Error('Save failed'))
    useT8Store.setState({ generatedContent: MOCK_CONTENT })
    await useT8Store.getState().retrySave('proj-x')
    expect(useT8Store.getState().persistenceStatus).toBe('error')
    expect(useT8Store.getState().persistenceError).toBe('Save failed')
  })
})
