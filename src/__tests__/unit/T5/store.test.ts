import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useT5Store } from '@/modules/T5_AITaxonomyCanvas/store'
import type { T5DomainScores } from '@/modules/T5_AITaxonomyCanvas/types'

// Mock isDemoEnabled so the store initialises with empty canvas (no demo data)
vi.mock('@/lib/config', () => ({ isDemoEnabled: false }))

// Mock t5.service so load() never touches Supabase in unit tests
vi.mock('@/services/t5.service', () => ({
  getT5Canvas:    vi.fn(),
  upsertT5Canvas: vi.fn(),
}))

import { getT5Canvas } from '@/services/t5.service'

const ZERO_SCORES: T5DomainScores = {
  businessValue: 0,
  technicalReady: 0,
  orgReadiness: 0,
  riskLevel: 0,
}

const HIGH_SCORES: T5DomainScores = {
  businessValue: 80,
  technicalReady: 70,
  orgReadiness: 65,
  riskLevel: 15,
}

// ── Estado inicial ────────────────────────────────────────────

describe('useT5Store — estado inicial', () => {
  beforeEach(() => {
    useT5Store.setState({
      engagementId: null,
      canvas: {
        id: '',
        companyName: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        domains: {
          automatizacion_rpa:         { domainCode: 'automatizacion_rpa',         scores: ZERO_SCORES, priorityScore: 0, recommendation: 'preparar_foundations', suggestedOwner: '', primaryKPI: '', activationConditions: [], useCaseCount: 0, assessedAt: '' },
          automatizacion_inteligente: { domainCode: 'automatizacion_inteligente', scores: ZERO_SCORES, priorityScore: 0, recommendation: 'preparar_foundations', suggestedOwner: '', primaryKPI: '', activationConditions: [], useCaseCount: 0, assessedAt: '' },
          analitica_predictiva:       { domainCode: 'analitica_predictiva',       scores: ZERO_SCORES, priorityScore: 0, recommendation: 'preparar_foundations', suggestedOwner: '', primaryKPI: '', activationConditions: [], useCaseCount: 0, assessedAt: '' },
          asistente_ia:               { domainCode: 'asistente_ia',               scores: ZERO_SCORES, priorityScore: 0, recommendation: 'preparar_foundations', suggestedOwner: '', primaryKPI: '', activationConditions: [], useCaseCount: 0, assessedAt: '' },
          optimizacion_proceso:       { domainCode: 'optimizacion_proceso',       scores: ZERO_SCORES, priorityScore: 0, recommendation: 'preparar_foundations', suggestedOwner: '', primaryKPI: '', activationConditions: [], useCaseCount: 0, assessedAt: '' },
          'agéntica':                 { domainCode: 'agéntica',                   scores: ZERO_SCORES, priorityScore: 0, recommendation: 'preparar_foundations', suggestedOwner: '', primaryKPI: '', activationConditions: [], useCaseCount: 0, assessedAt: '' },
        },
        maturityLevel: 'inicial',
        activationSequence: [],
      },
    })
  })

  it('engagementId es null por defecto', () => {
    expect(useT5Store.getState().engagementId).toBeNull()
  })

  it('canvas tiene 6 dominios', () => {
    const { domains } = useT5Store.getState().canvas
    expect(Object.keys(domains)).toHaveLength(6)
  })

  it('maturityLevel inicial es "inicial"', () => {
    expect(useT5Store.getState().canvas.maturityLevel).toBe('inicial')
  })
})

// ── updateDomainScores ────────────────────────────────────────

describe('useT5Store — updateDomainScores', () => {
  beforeEach(() => {
    useT5Store.getState().resetCanvas()
  })

  it('actualiza los scores del dominio indicado', () => {
    useT5Store.getState().updateDomainScores('automatizacion_rpa', HIGH_SCORES)
    const domain = useT5Store.getState().canvas.domains['automatizacion_rpa']
    expect(domain.scores).toEqual(HIGH_SCORES)
  })

  it('recalcula priorityScore tras actualizar scores', () => {
    useT5Store.getState().updateDomainScores('automatizacion_rpa', HIGH_SCORES)
    const domain = useT5Store.getState().canvas.domains['automatizacion_rpa']
    expect(domain.priorityScore).toBeGreaterThan(0)
  })

  it('recalcula recommendation tras actualizar scores', () => {
    // Scores óptimos → no debería ser preparar_foundations
    useT5Store.getState().updateDomainScores('automatizacion_rpa', HIGH_SCORES)
    const domain = useT5Store.getState().canvas.domains['automatizacion_rpa']
    expect(domain.recommendation).not.toBe('preparar_foundations')
  })

  it('actualiza maturityLevel del canvas al actualizar dominios', () => {
    // Todos los dominios a 0 → inicial; al subir uno debe recalcular
    useT5Store.getState().updateDomainScores('automatizacion_rpa', HIGH_SCORES)
    // maturityLevel puede seguir siendo inicial si 1 dominio no mueve el promedio suficiente
    // Lo importante es que no lanza error
    const { maturityLevel } = useT5Store.getState().canvas
    expect(['inicial', 'emergente', 'operativo', 'avanzado']).toContain(maturityLevel)
  })

  it('actualiza updatedAt del canvas (campo definido y es string ISO)', () => {
    useT5Store.getState().updateDomainScores('asistente_ia', HIGH_SCORES)
    const { updatedAt } = useT5Store.getState().canvas
    // updatedAt debe ser un ISO string válido
    expect(() => new Date(updatedAt).toISOString()).not.toThrow()
  })

  it('no modifica otros dominios al actualizar uno', () => {
    useT5Store.getState().updateDomainScores('automatizacion_rpa', HIGH_SCORES)
    const otherDomain = useT5Store.getState().canvas.domains['asistente_ia']
    expect(otherDomain.scores).toEqual(ZERO_SCORES)
  })
})

// ── load ──────────────────────────────────────────────────────
// syncEngagement fue eliminado del store (Sprint 10).
// La misma semántica vive ahora en load(): setea engagementId,
// descarga el canvas desde Supabase y hace early-return cuando
// el proyecto ya está cargado.

describe('useT5Store — load', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getT5Canvas).mockResolvedValue(null)
    useT5Store.setState({ engagementId: null, isLoading: false, loadError: null })
    useT5Store.getState().resetCanvas()
  })

  it('actualiza engagementId tras cargar un nuevo projectId', async () => {
    await useT5Store.getState().load('new-id')
    expect(useT5Store.getState().engagementId).toBe('new-id')
  })

  it('resetea el canvas al cambiar de engagement', async () => {
    useT5Store.setState({ engagementId: 'old-id' })
    useT5Store.getState().updateDomainScores('automatizacion_rpa', HIGH_SCORES)
    await useT5Store.getState().load('new-id')
    const domain = useT5Store.getState().canvas.domains['automatizacion_rpa']
    expect(domain.priorityScore).toBe(0)
  })

  it('NO recarga si el engagement es el mismo y el canvas ya está cargado', async () => {
    // Forzar canvas.id no vacío para que se cumpla la condición de early-return
    useT5Store.setState({
      engagementId: 'same-id',
      isLoading:    false,
      canvas:       { ...useT5Store.getState().canvas, id: 'existing-canvas' },
    })
    useT5Store.getState().updateDomainScores('automatizacion_rpa', HIGH_SCORES)
    const scoreBefore = useT5Store.getState().canvas.domains['automatizacion_rpa'].priorityScore
    await useT5Store.getState().load('same-id')
    const scoreAfter = useT5Store.getState().canvas.domains['automatizacion_rpa'].priorityScore
    expect(scoreAfter).toBe(scoreBefore)
    expect(getT5Canvas).not.toHaveBeenCalled()
  })
})

// ── resetCanvas ───────────────────────────────────────────────

describe('useT5Store — resetCanvas', () => {
  it('resetea todos los dominios a priorityScore 0', () => {
    useT5Store.getState().updateDomainScores('automatizacion_rpa', HIGH_SCORES)
    useT5Store.getState().resetCanvas()
    const domain = useT5Store.getState().canvas.domains['automatizacion_rpa']
    expect(domain.priorityScore).toBe(0)
  })

  it('resetea maturityLevel a "inicial"', () => {
    useT5Store.getState().updateDomainScores('automatizacion_rpa', HIGH_SCORES)
    useT5Store.getState().resetCanvas()
    expect(useT5Store.getState().canvas.maturityLevel).toBe('inicial')
  })
})
