import { describe, it, expect } from 'vitest'
import { buildT10RecommendationContext } from '@/modules/T10_AIValueDashboard/t10ContextBuilder'
import type { RadarDimension }  from '@/shared/components/charts/LeanRadarChart'
import type { UseCase }         from '@/modules/T4_UseCasePriorityBoard/types'
import type { Stakeholder }     from '@/modules/T2_StakeholderMatrix/types'
import type { T11OperatingModel } from '@/modules/T11_OperatingRhythm/types'
import type { CompanyProfile }  from '@/modules/CompanyProfile/types'

// ── Fixtures ──────────────────────────────────────────────────

const PROFILE: CompanyProfile = {
  engagementName:         'ACME S.A.',
  sector:                 'Manufactura',
  tamanoEmpresa:          'grande',
  objetivoPrincipalIA:    'Optimizar producción',
  horizonteEsperadoValor: '18 meses',
} as CompanyProfile

function radar(values: number[]): RadarDimension[] {
  return values.map((v, i) => ({ dimension: `d${i}`, current: v, target: 4 }))
}

function makeUseCase(overrides: Partial<UseCase> = {}): UseCase {
  return {
    id:            'uc-1',
    name:          'UC Test',
    department:    'IT',
    status:        'go',
    priorityScore: 70,
    aiCategory:    'automatizacion_rpa',
    scores:        { kpiImpact: 80, feasibility: 70, aiRisk: 20, dataDependency: 20 },
    createdAt:     '2024-01-01T00:00:00Z',
    ...overrides,
  } as UseCase
}

function makeStakeholder(overrides: Partial<Stakeholder> = {}): Stakeholder {
  return {
    id:          's-1',
    name:        'Alice',
    role:        'Director IT',
    department:  'IT',
    archetype:   'adoptador',
    resistance:  'baja',
    interview:   undefined,
    ...overrides,
  } as Stakeholder
}

const T11_MODEL: T11OperatingModel = {
  maturityTier:    'developing',
  maturityAvg:     2.0,
  adaptiveMode:    'standard',
  recommendedEvents: [
    { id: 'e1', title: 'Reunión mensual', level: 'tactical', frequency: 'monthly', owner: 'CTO', isCritical: true,  minTier: 'foundational' },
    { id: 'e2', title: 'Review QA',       level: 'tactical', frequency: 'monthly', owner: 'QA',  isCritical: false, minTier: 'developing' },
  ],
  decisions: [
    { decision: 'Aprobación casos IA', owner: 'CTO', escalateTo: 'CEO' },
    { decision: 'Presupuesto IA',      owner: 'CFO', escalateTo: '' },
    { decision: 'Sin owner',           owner: '',    escalateTo: '' },
  ],
  kpiGroups:       [],
  phaseObjectives: [],
} as unknown as T11OperatingModel

// ── Empresa ───────────────────────────────────────────────────

describe('buildT10RecommendationContext — company', () => {
  it('incluye sector, size, mainAIObjective y valueHorizon', () => {
    const ctx = buildT10RecommendationContext(radar([2, 2]), [], [], null, PROFILE)
    expect(ctx.company.sector).toBe('Manufactura')
    expect(ctx.company.size).toBe('grande')
    expect(ctx.company.mainAIObjective).toBe('Optimizar producción')
    expect(ctx.company.valueHorizon).toBe('18 meses')
  })
})

// ── Madurez (T1) ──────────────────────────────────────────────

describe('buildT10RecommendationContext — maturity', () => {
  it('overallScore es 0 con radar vacío', () => {
    const ctx = buildT10RecommendationContext([], [], [], null, PROFILE)
    expect(ctx.dashboard.maturity.overallScore).toBe(0)
    expect(ctx.dashboard.maturity.topDimension).toBe('Sin datos')
    expect(ctx.dashboard.maturity.criticalGap).toBe('Sin datos')
  })

  it('calcula overallScore como promedio del radar', () => {
    const ctx = buildT10RecommendationContext(radar([2, 4]), [], [], null, PROFILE)
    // (2+4)/2 = 3
    expect(ctx.dashboard.maturity.overallScore).toBe(3)
  })

  it('topDimension es la dimensión con mayor current', () => {
    const dims: RadarDimension[] = [
      { dimension: 'alfa', current: 1, target: 4 },
      { dimension: 'beta', current: 4, target: 4 },
    ]
    const ctx = buildT10RecommendationContext(dims, [], [], null, PROFILE)
    expect(ctx.dashboard.maturity.topDimension).toBe('beta')
  })

  it('criticalGap es la dimensión con menor current', () => {
    const dims: RadarDimension[] = [
      { dimension: 'alfa', current: 1, target: 4 },
      { dimension: 'beta', current: 4, target: 4 },
    ]
    const ctx = buildT10RecommendationContext(dims, [], [], null, PROFILE)
    expect(ctx.dashboard.maturity.criticalGap).toBe('alfa')
  })
})

// ── Portfolio (T4) ────────────────────────────────────────────

describe('buildT10RecommendationContext — portfolio', () => {
  it('activeCases cuenta status go y en_piloto', () => {
    const useCases = [
      makeUseCase({ id: 'uc-go',    status: 'go' }),
      makeUseCase({ id: 'uc-pilot', status: 'en_piloto' }),
      makeUseCase({ id: 'uc-idea',  status: 'candidato' }),
    ]
    const ctx = buildT10RecommendationContext([], useCases, [], null, PROFILE)
    expect(ctx.dashboard.portfolio.activeCases).toBe(2)
  })

  it('highRiskCases cuenta riskLevel alto y prohibido', () => {
    const useCases = [
      makeUseCase({ id: 'uc-alto',     aiActClassification: { riskLevel: 'alto' }     as UseCase['aiActClassification'] }),
      makeUseCase({ id: 'uc-prohib',   aiActClassification: { riskLevel: 'prohibido' } as UseCase['aiActClassification'] }),
      makeUseCase({ id: 'uc-limitado', aiActClassification: { riskLevel: 'limitado' }  as UseCase['aiActClassification'] }),
    ]
    const ctx = buildT10RecommendationContext([], useCases, [], null, PROFILE)
    expect(ctx.dashboard.portfolio.highRiskCases).toBe(2)
  })

  it('totalAnnualSaving es 0 si no hay economics', () => {
    const useCases = [makeUseCase({ status: 'go' })]
    const ctx = buildT10RecommendationContext([], useCases, [], null, PROFILE)
    expect(ctx.dashboard.portfolio.totalAnnualSaving).toBe(0)
  })
})

// ── Adopción (T2) ─────────────────────────────────────────────

describe('buildT10RecommendationContext — adoption', () => {
  it('totalStakeholders cuenta todos los stakeholders', () => {
    const stakeholders = [makeStakeholder({ id: 's1' }), makeStakeholder({ id: 's2' })]
    const ctx = buildT10RecommendationContext([], [], stakeholders, null, PROFILE)
    expect(ctx.dashboard.adoption.totalStakeholders).toBe(2)
  })

  it('uninterviewedCount cuenta stakeholders sin interview (interview === undefined)', () => {
    // Los tres stakeholders no tienen entrevista — todos cuentan como no entrevistados
    const stakeholders = [
      makeStakeholder({ id: 's1', interview: undefined }),
      makeStakeholder({ id: 's2', interview: undefined }),
      makeStakeholder({ id: 's3', interview: undefined }),
    ]
    const ctx = buildT10RecommendationContext([], [], stakeholders, null, PROFILE)
    expect(ctx.dashboard.adoption.uninterviewedCount).toBe(3)
  })

  it('earlyAdopterRatio es 0 con lista vacía', () => {
    const ctx = buildT10RecommendationContext([], [], [], null, PROFILE)
    expect(ctx.dashboard.adoption.earlyAdopterRatio).toBe(0)
  })

  it('earlyAdopterRatio calcula adoptador+ambassador con resistencia no alta', () => {
    const stakeholders = [
      makeStakeholder({ id: 's1', archetype: 'adoptador',  resistance: 'baja' }),
      makeStakeholder({ id: 's2', archetype: 'ambassador', resistance: 'media' }),
      makeStakeholder({ id: 's3', archetype: 'adoptador',  resistance: 'alta' }), // excluido
      makeStakeholder({ id: 's4', archetype: 'reticente',  resistance: 'baja' }), // excluido (no es adoptador/ambassador)
    ]
    const ctx = buildT10RecommendationContext([], [], stakeholders, null, PROFILE)
    // 2 de 4 = 50%
    expect(ctx.dashboard.adoption.earlyAdopterRatio).toBe(50)
  })
})

// ── Governance (T11) ──────────────────────────────────────────

describe('buildT10RecommendationContext — governance', () => {
  it('governance es Sin datos si t11Model es null', () => {
    const ctx = buildT10RecommendationContext([], [], [], null, PROFILE)
    expect(ctx.dashboard.governance.maturityTier).toBe('Sin datos')
    expect(ctx.dashboard.governance.criticalEventsCount).toBe(0)
    expect(ctx.dashboard.governance.decisionsWithOwner).toBe(0)
  })

  it('propaga maturityTier del modelo T11', () => {
    const ctx = buildT10RecommendationContext([], [], [], T11_MODEL, PROFILE)
    expect(ctx.dashboard.governance.maturityTier).toBe('developing')
  })

  it('criticalEventsCount cuenta eventos isCritical', () => {
    const ctx = buildT10RecommendationContext([], [], [], T11_MODEL, PROFILE)
    expect(ctx.dashboard.governance.criticalEventsCount).toBe(1)
  })

  it('decisionsWithOwner cuenta decisiones con owner no vacío', () => {
    const ctx = buildT10RecommendationContext([], [], [], T11_MODEL, PROFILE)
    // 2 de 3 tienen owner
    expect(ctx.dashboard.governance.decisionsWithOwner).toBe(2)
  })
})
