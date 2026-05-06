// ============================================================
// T1 Context Builder
//
// Ensambla el objeto de contexto que se envía a la Edge Function
// ai-recommend para el tool T1.
//
// Se llama desde T1View con los datos ya computados en el componente.
// ============================================================

import type { T1DimensionState }       from './types'
import {
  computeDimensionScore,
  computeOverallScore,
  resolveMaturityTier,
  MATURITY_TIER_CONFIG,
}                                       from './types'
import type { IntervieweeAggregate }   from './components/T1ExecutiveOutput'
import type { CompanyProfile }         from '@/modules/CompanyProfile/types'

// ── Tipo de contexto para el prompt ──────────────────────────
// (Espejo del tipo esperado por prompts/t1.ts en la Edge Function)

export interface T1RecommendationContext {
  company: {
    sector:          string
    size:            string
    mainAIObjective: string
    valueHorizon:    string
    techEcosystem:   string
    restrictions:    string
    priorityAreas:   string[]
    frictions: {
      tipo:       string
      area:       string
      frecuencia: string | null
      impacto:    string | null
    }[]
  }
  assessment: {
    overallScore:  number
    maturityTier:  string
    maturityLabel: string
    strengths:     { code: string; label: string; score: number }[]
    gaps:          { code: string; label: string; score: number }[]
    dimensions: {
      code:         string
      label:        string
      score:        number | null
      subdimensions: {
        code:     string
        label:    string
        score:    number | null
        evidence: string
      }[]
    }[]
    itBizGap: {
      itOverallScore:  number
      bizOverallScore: number
      deltas: {
        dimension: string
        label:     string
        itScore:   number
        bizScore:  number
        delta:     number
      }[]
    } | null
  }
}

// ── Builder ───────────────────────────────────────────────────

export function buildT1RecommendationContext(
  aggregateDimensions: T1DimensionState[],
  allInterviewees:     IntervieweeAggregate[],
  profile:             CompanyProfile,
): T1RecommendationContext {

  // ── Dimensiones con scores calculados ──
  const dimensions = aggregateDimensions.map((dim) => ({
    code:  dim.code,
    label: dim.label,
    score: computeDimensionScore(dim),
    subdimensions: dim.subdimensions.map((sub) => ({
      code:     sub.code,
      label:    sub.label,
      score:    sub.score,
      evidence: sub.evidence,
    })),
  }))

  // ── Overall + tier ──
  const overallScore  = computeOverallScore(aggregateDimensions)
  const maturityTier  = resolveMaturityTier(overallScore)
  const maturityLabel = MATURITY_TIER_CONFIG[maturityTier].label

  // ── Strengths: top 3 por score descendente (con score ≥ 0) ──
  const strengths = [...dimensions]
    .filter((d) => d.score !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3)
    .map((d) => ({ code: d.code, label: d.label, score: d.score ?? 0 }))

  // ── Gaps: top 3 dimensiones con mayor brecha hacia 3.5 ──
  const gaps = [...dimensions]
    .filter((d) => d.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 3)
    .map((d) => ({ code: d.code, label: d.label, score: d.score ?? 0 }))

  // ── Brecha IT / Negocio ──
  const itGroup  = allInterviewees.filter((i) => i.type === 'it')
  const bizGroup = allInterviewees.filter((i) => i.type === 'business')

  let itBizGap: T1RecommendationContext['assessment']['itBizGap'] = null

  if (itGroup.length > 0 && bizGroup.length > 0) {
    // Promedio de entrevistados IT
    const itAvgDims  = averageDimensions(itGroup.map((i) => i.dimensions))
    const bizAvgDims = averageDimensions(bizGroup.map((i) => i.dimensions))

    const itOverallScore  = computeOverallScore(itAvgDims)
    const bizOverallScore = computeOverallScore(bizAvgDims)

    const deltas = itAvgDims.map((dim) => {
      const itScore  = computeDimensionScore(dim) ?? 0
      const bizDim   = bizAvgDims.find((d) => d.code === dim.code)
      const bizScore = bizDim ? (computeDimensionScore(bizDim) ?? 0) : 0
      return {
        dimension: dim.code,
        label:     dim.label,
        itScore,
        bizScore,
        delta:     itScore - bizScore,
      }
    })

    itBizGap = { itOverallScore, bizOverallScore, deltas }
  }

  return {
    company: {
      sector:          profile.sector,
      size:            profile.tamanoEmpresa,
      mainAIObjective: profile.objetivoPrincipalIA,
      valueHorizon:    profile.horizonteEsperadoValor,
      techEcosystem:   profile.ecosistemaTecnologico,
      restrictions:    profile.restriccionesRelevantes,
      priorityAreas:   profile.areasPrioritarias,
      frictions:       profile.fricciones.map((f) => ({
        tipo:       f.tipo,
        area:       f.areaFuncional,
        frecuencia: f.frecuencia,
        impacto:    f.impacto,
      })),
    },
    assessment: {
      overallScore,
      maturityTier,
      maturityLabel,
      strengths,
      gaps,
      dimensions,
      itBizGap,
    },
  }
}

// ── Helper: promedia N arrays de dimensiones ─────────────────

function averageDimensions(dimArrays: T1DimensionState[][]): T1DimensionState[] {
  if (dimArrays.length === 0) return []
  const template = dimArrays[0]

  return template.map((dim) => ({
    ...dim,
    subdimensions: dim.subdimensions.map((sub) => {
      const scores = dimArrays
        .map((arr) =>
          arr
            .find((d) => d.code === dim.code)
            ?.subdimensions.find((s) => s.code === sub.code)?.score ?? null
        )
        .filter((s): s is number => s !== null)

      return {
        ...sub,
        score: scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null,
      }
    }),
  }))
}
