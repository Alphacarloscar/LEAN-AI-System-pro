// ============================================================
// t2-archetype.test.ts — Tests de asignación de arquetipos (T2)
// ============================================================

import { describe, it, expect } from 'vitest'
import { computeInterviewResult } from '@/modules/T2_StakeholderMatrix/constants'
import type { InterviewAnswerCode } from '@/modules/T2_StakeholderMatrix/types'

describe('T2 - Archetype Assignment', () => {
  // Helper para crear respuestas vacías
  const createAnswers = (overrides: Partial<Record<number, InterviewAnswerCode>>) => ({
    1: 'A' as InterviewAnswerCode,
    2: 'A' as InterviewAnswerCode,
    3: 'A' as InterviewAnswerCode,
    4: 'A' as InterviewAnswerCode,
    5: 'A' as InterviewAnswerCode,
    ...overrides,
  })

  it('assigns AMBASSADOR archetype when connector >= 3, influence >= 2.5, adoption >= 2', () => {
    // Las respuestas todas A (máxima puntuación) deberían dar altos scores
    const answers = createAnswers({})
    const result = computeInterviewResult(answers)
    expect(result.archetype).toBe('ambassador')
    expect(result.influenceScore).toBeGreaterThanOrEqual(2.5)
    expect(result.adoptionScore).toBeGreaterThanOrEqual(2)
  })

  it('assigns DECISOR archetype when influence >= 2.5 and adoption >= 2, but connector < 3', () => {
    // Respuestas que reducen connector a < 3 (evitando ambassador)
    // Cambiar pregunta 3 a B (reduce connector de 2 a 0) y pregunta 5 a D (reduce adoption)
    const answers: Record<number, InterviewAnswerCode> = {
      1: 'A', // adoption:4, influence:0, openness:3, connector:0
      2: 'A', // adoption:0, influence:0, openness:2, connector:0
      3: 'B', // adoption:2, influence:1, openness:0, connector:0 (no connector)
      4: 'A', // adoption:0, influence:4, openness:0, connector:0
      5: 'A', // adoption:1, influence:0, openness:3, connector:0
    }
    const result = computeInterviewResult(answers)
    expect(result.archetype).toBe('decisor')
    expect(result.influenceScore).toBeGreaterThanOrEqual(2.5)
    expect(result.adoptionScore).toBeGreaterThanOrEqual(2)
  })

  it('assigns CRITICO archetype when influence >= 2.5 and adoption < 2', () => {
    // Para CRITICO: influence >= 2.5 pero adoption < 2
    // Pregunta 3 D, Pregunta 4 A (high influence), resto bajo
    const answers: Record<number, InterviewAnswerCode> = {
      1: 'D', // adoption:0, influence:0, openness:0, connector:0
      2: 'D', // adoption:0, influence:0, openness:0, connector:0
      3: 'D', // adoption:0, influence:2, openness:0, connector:0 (frena por riesgo)
      4: 'A', // adoption:0, influence:4, openness:0, connector:0 (decisor)
      5: 'D', // adoption:0, influence:0, openness:0, connector:0
    }
    const result = computeInterviewResult(answers)
    // with all D except Q4=A: influence should be >= 2.5, adoption should be < 2
    expect(result.archetype).toBe('critico')
    expect(result.influenceScore).toBeGreaterThanOrEqual(2.5)
    expect(result.adoptionScore).toBeLessThan(2)
  })

  it('assigns RETICENTE archetype when adoption < 1.5 and openness < 1.5', () => {
    // Respuestas todas D (mínima puntuación) para adoption y openness
    const answers = createAnswers({
      1: 'D',
      2: 'D',
      3: 'D',
      4: 'D',
      5: 'D',
    })
    const result = computeInterviewResult(answers)
    expect(result.archetype).toBe('reticente')
    expect(result.adoptionScore).toBeLessThan(1.5)
  })

  it('assigns ADOPTADOR as default fallback archetype', () => {
    // Mix medio: algunas A, algunas C
    const answers = createAnswers({
      1: 'A',
      2: 'C',
      3: 'A',
      4: 'C',
      5: 'B',
    })
    const result = computeInterviewResult(answers)
    // Debería caer en el fallback adoptador
    expect(result.archetype).toBe('adoptador')
  })

  it('computes resistance as BAJA when openness >= 2.5', () => {
    // Todas A para maximizar openness
    const answers = createAnswers({})
    const result = computeInterviewResult(answers)
    expect(result.resistance).toBe('baja')
  })

  it('computes resistance as MEDIA when 1.5 <= openness < 2.5', () => {
    // Mix C y D para openness media (más bajo que A/B)
    const answers: Record<number, InterviewAnswerCode> = {
      1: 'C', // openness:1
      2: 'B', // openness:2
      3: 'C', // openness:1
      4: 'D', // openness:0
      5: 'C', // openness:1
    }
    const result = computeInterviewResult(answers)
    // openness = (1+2+1+0+1) / 9 * 4 = 5/9 * 4 = 2.22 (media)
    expect(result.resistance).toBe('media')
  })

  it('computes resistance as ALTA when openness < 1.5', () => {
    // Principalmente C y D para baja openness
    const answers = createAnswers({
      1: 'C',
      2: 'D',
      3: 'C',
      4: 'D',
      5: 'D',
    })
    const result = computeInterviewResult(answers)
    expect(result.resistance).toBe('alta')
  })

  it('normalizes scores to 0-4 scale', () => {
    const answers = createAnswers({})
    const result = computeInterviewResult(answers)

    expect(result.adoptionScore).toBeGreaterThanOrEqual(0)
    expect(result.adoptionScore).toBeLessThanOrEqual(4)

    expect(result.influenceScore).toBeGreaterThanOrEqual(0)
    expect(result.influenceScore).toBeLessThanOrEqual(4)

    expect(result.opennessScore).toBeGreaterThanOrEqual(0)
    expect(result.opennessScore).toBeLessThanOrEqual(4)
  })

  it('stores all interview answers in result', () => {
    const answers = createAnswers({ 1: 'C', 3: 'D' })
    const result = computeInterviewResult(answers)

    expect(result.answers).toBeDefined()
    expect(result.answers[1]).toBe('C')
    expect(result.answers[3]).toBe('D')
  })

  it('handles extreme case: all questions answered with A', () => {
    const answers: Record<number, InterviewAnswerCode> = {
      1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A',
    }
    const result = computeInterviewResult(answers)

    expect(result.adoptionScore).toBeCloseTo(4, 1) // (4+0+2+0+1)/7 * 4 = 4
    expect(result.influenceScore).toBeCloseTo(4, 1) // (0+0+2+4+0)/6 * 4 = 4
    expect(result.opennessScore).toBeCloseTo(3.56, 0) // (3+2+0+0+3)/9 * 4 = 3.56
    expect(result.archetype).toBe('ambassador') // connector=4 >= 3, influence=4 >= 2.5, adoption=4 >= 2
    expect(result.resistance).toBe('baja') // openness=3.56 >= 2.5
  })

  it('handles extreme case: all questions answered with D', () => {
    const answers: Record<number, InterviewAnswerCode> = {
      1: 'D', 2: 'D', 3: 'D', 4: 'D', 5: 'D',
    }
    const result = computeInterviewResult(answers)

    expect(result.adoptionScore).toBeCloseTo(0, 1)
    expect(result.archetype).toBe('reticente')
    expect(result.resistance).toBe('alta')
  })
})
