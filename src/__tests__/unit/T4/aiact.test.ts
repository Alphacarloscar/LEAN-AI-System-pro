import { describe, it, expect } from 'vitest'
import { computeAIActRisk } from '@/modules/T4_UseCasePriorityBoard/types'

describe('computeAIActRisk', () => {
  it('prohibido: datos sensibles + seguridad + autónomo', () => {
    expect(computeAIActRisk('seguridad', 'autonomous', true, 'yes')).toBe('prohibido')
    expect(computeAIActRisk('seguridad', 'autonomous', true, 'no')).toBe('prohibido')
  })

  it('alto: sectores de alto riesgo (Annex III)', () => {
    const highRiskSectors = ['rrhh', 'financiero_clientes', 'salud', 'infraestructura', 'educacion', 'administracion'] as const
    for (const scope of highRiskSectors) {
      expect(computeAIActRisk(scope, 'no', false, 'yes')).toBe('alto')
    }
  })

  it('alto: datos sensibles + impacto en personas', () => {
    expect(computeAIActRisk('operaciones_internas', 'human_review', true, 'yes')).toBe('alto')
    expect(computeAIActRisk('operaciones_internas', 'autonomous', true, 'yes')).toBe('alto')
  })

  it('alto: decisión autónoma sin explicabilidad', () => {
    expect(computeAIActRisk('operaciones_internas', 'autonomous', false, 'no')).toBe('alto')
  })

  it('limitado: cara al cliente', () => {
    expect(computeAIActRisk('cliente_marketing', 'no', false, 'yes')).toBe('limitado')
  })

  it('limitado: cualquier impacto en personas (no autonomous+no explicable)', () => {
    expect(computeAIActRisk('operaciones_internas', 'human_review', false, 'yes')).toBe('limitado')
  })

  it('mínimo: ops internas, sin datos sensibles, sin impacto en personas', () => {
    expect(computeAIActRisk('operaciones_internas', 'no', false, 'yes')).toBe('minimo')
    expect(computeAIActRisk('operaciones_internas', 'no', false, 'no')).toBe('minimo')
  })

  it('seguridad sin datos sensibles → alto (Annex III), no prohibido', () => {
    // seguridad sin sensitiveData no llega a prohibido pero sí a alto (sector)
    expect(computeAIActRisk('seguridad', 'autonomous', false, 'no')).toBe('alto')
  })
})
