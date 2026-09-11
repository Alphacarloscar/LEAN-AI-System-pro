import { describe, expect, it } from 'vitest'
import {
  getEcosystemOptions,
  getFrictionTypes,
} from '@/modules/Admin/constants/ecosystemOptions'

describe('domain-aware project options', () => {
  it('keeps AI Adoption options for AI Adoption projects', () => {
    expect(getEcosystemOptions('ai_adoption')).toContain('OpenAI / ChatGPT Enterprise')
    expect(getFrictionTypes('ai_adoption')).toContain('Falta de talento / formación en IA')
  })

  it('returns Transformacion Digital options for transformacion_digital projects', () => {
    expect(getEcosystemOptions('transformacion_digital')).toContain('Salesforce')
    expect(getEcosystemOptions('transformacion_digital')).not.toContain('OpenAI / ChatGPT Enterprise')
    expect(getFrictionTypes('transformacion_digital')).toContain('Sistemas legacy sin integración')
  })

  it('uses neutral fallback options when the project domain is unknown', () => {
    expect(getEcosystemOptions(null)).toContain('Otro / Personalizado')
    expect(getEcosystemOptions(null)).not.toContain('OpenAI / ChatGPT Enterprise')
    expect(getFrictionTypes(null)).not.toContain('Falta de talento / formación en IA')
  })
})
