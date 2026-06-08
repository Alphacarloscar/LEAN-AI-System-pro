import { describe, it, expect } from 'vitest'
import { buildT11RecommendationContext } from '@/modules/T11_OperatingRhythm/t11ContextBuilder'
import type { T11OperatingModel }        from '@/modules/T11_OperatingRhythm/types'
import type { CompanyProfile }           from '@/modules/CompanyProfile/types'

// ── Fixtures ──────────────────────────────────────────────────

const PROFILE: CompanyProfile = {
  engagementName:         'Test Co.',
  sector:                 'Tecnología',
  tamanoEmpresa:          'grande',
  objetivoPrincipalIA:    'Automatizar procesos',
  horizonteEsperadoValor: '12 meses',
} as CompanyProfile

const MODEL: T11OperatingModel = {
  maturityTier:  'developing',
  maturityAvg:   2.1,
  adaptiveMode:  'standard',
  recommendedEvents: [
    { id: 'e1', title: 'Revisión AI mensual', level: 'tactical',  frequency: 'monthly',  owner: 'CTO',  isCritical: true,  minTier: 'foundational' },
    { id: 'e2', title: 'Comité estratégico',  level: 'strategic', frequency: 'quarterly', owner: 'CEO',  isCritical: false, minTier: 'developing' },
  ],
  decisions: [
    { decision: 'Aprobación de nuevos casos de uso IA', owner: 'CTO', escalateTo: 'CEO' },
    { decision: 'Presupuesto IA Q+1',                   owner: 'CFO', escalateTo: 'Board' },
  ],
  kpiGroups: [
    { label: 'Adopción',    kpis: [{ name: 'Usuarios activos IA (%)' }, { name: 'NPS IA' }] },
    { label: 'Valor',       kpis: [{ name: 'Ahorro anual estimado (€)' }] },
  ],
  phaseObjectives: ['Establecer governance básico', 'Medir adopción'],
} as unknown as T11OperatingModel

// ── buildT11RecommendationContext ─────────────────────────────

describe('buildT11RecommendationContext', () => {
  it('incluye datos de empresa del perfil', () => {
    const ctx = buildT11RecommendationContext(MODEL, PROFILE)
    expect(ctx.company.sector).toBe('Tecnología')
    expect(ctx.company.size).toBe('grande')
    expect(ctx.company.mainAIObjective).toBe('Automatizar procesos')
  })

  it('propaga maturityTier y maturityAvg del modelo', () => {
    const ctx = buildT11RecommendationContext(MODEL, PROFILE)
    expect(ctx.model.maturityTier).toBe('developing')
    expect(ctx.model.maturityAvg).toBe(2.1)
  })

  it('propaga adaptiveMode correctamente', () => {
    const ctx = buildT11RecommendationContext(MODEL, PROFILE)
    expect(ctx.model.adaptiveMode).toBe('standard')
  })

  it('activeEventCount coincide con nº de events del modelo', () => {
    const ctx = buildT11RecommendationContext(MODEL, PROFILE)
    expect(ctx.model.activeEventCount).toBe(2)
  })

  it('recommendedEvents incluye title, level, frequency, owner, isCritical', () => {
    const ctx = buildT11RecommendationContext(MODEL, PROFILE)
    const ev = ctx.model.recommendedEvents[0]
    expect(ev.title).toBe('Revisión AI mensual')
    expect(ev.level).toBe('tactical')
    expect(ev.frequency).toBe('monthly')
    expect(ev.owner).toBe('CTO')
    expect(ev.isCritical).toBe(true)
  })

  it('decisions incluye decision, owner y escalateTo', () => {
    const ctx = buildT11RecommendationContext(MODEL, PROFILE)
    const dec = ctx.model.decisions[0]
    expect(dec.decision).toBe('Aprobación de nuevos casos de uso IA')
    expect(dec.owner).toBe('CTO')
    expect(dec.escalateTo).toBe('CEO')
  })

  it('kpiGroups incluye label y kpis con name', () => {
    const ctx = buildT11RecommendationContext(MODEL, PROFILE)
    const group = ctx.model.kpiGroups[0]
    expect(group.label).toBe('Adopción')
    expect(group.kpis[0].name).toBe('Usuarios activos IA (%)')
  })

  it('evento sin campo minTier se mapea correctamente (sólo los campos declarados)', () => {
    const ctx = buildT11RecommendationContext(MODEL, PROFILE)
    // El context builder sólo mapea title/level/frequency/owner/isCritical — no minTier
    const ev = ctx.model.recommendedEvents[0] as Record<string, unknown>
    expect(ev['minTier']).toBeUndefined()
  })
})
