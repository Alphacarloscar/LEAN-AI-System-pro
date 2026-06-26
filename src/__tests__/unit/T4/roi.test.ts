import { describe, it, expect } from 'vitest'
import { computeROIFromEconomics } from '@/modules/T4_UseCasePriorityBoard/constants'
import type { UseCaseEconomics } from '@/modules/T4_UseCasePriorityBoard/types'

const baseEcon = (): UseCaseEconomics => ({
  processHoursPerWeek:    10,
  headcount:              5,
  efficiencyGain:         0.40,
  efficiencyGainMode:     'benchmark',
  hourlyRate:             45,
  hourlyRateMode:         'preset',
  hourlyRatePreset:       'tecnico',
  implementationCost:     30_000,
  implementationCostMode: 'benchmark',
})

describe('computeROIFromEconomics', () => {
  it('calcula annualSaving correctamente', () => {
    const econ = baseEcon()
    // 10 × 5 × 52 × 0.40 × 45 = 46_800
    const { annualSaving } = computeROIFromEconomics(econ)
    expect(annualSaving).toBe(46_800)
  })

  it('calcula paybackMonths correctamente', () => {
    const { paybackMonths } = computeROIFromEconomics(baseEcon())
    // 30_000 / (46_800 / 12) = 30_000 / 3_900 = 7.69...
    expect(paybackMonths).toBeCloseTo(7.7, 1)
  })

  it('calcula roi3year correctamente', () => {
    const { roi3year } = computeROIFromEconomics(baseEcon())
    // (46_800×3 - 30_000) / 30_000 × 100 = (140_400 - 30_000) / 30_000 × 100 = 368
    expect(roi3year).toBe(368)
  })

  it('ahorro cero si efficiencyGain es 0', () => {
    const { annualSaving, paybackMonths, roi3year } = computeROIFromEconomics({
      ...baseEcon(),
      efficiencyGain: 0,
    })
    expect(annualSaving).toBe(0)
    expect(paybackMonths).toBe(0)
    expect(roi3year).toBe(-100)
  })

  it('payback 0 si coste de implementación es 0', () => {
    const { paybackMonths } = computeROIFromEconomics({
      ...baseEcon(),
      implementationCost: 0,
    })
    expect(paybackMonths).toBe(0)
  })

  it('annualSaving es entero (Math.round)', () => {
    const { annualSaving } = computeROIFromEconomics({
      ...baseEcon(),
      processHoursPerWeek: 3,
      efficiencyGain: 0.33,
    })
    expect(Number.isInteger(annualSaving)).toBe(true)
  })
})
