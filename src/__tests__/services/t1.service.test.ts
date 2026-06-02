import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import {
  buildBlankDimensions,
  fetchT1Data,
  upsertT1Score,
  upsertAllScoresForInterviewee,
  deleteIntervieweeScores,
} from '@/services/t1.service'
import { DIMENSION_DEFINITIONS } from '@/modules/T1_MaturityRadar/constants'

// ── Helpers ───────────────────────────────────────────────────

const ENG_ID       = 'proj-t1-test'
const INTERVIEWEE_ID = 'int-001'

function makeScoreRow(overrides = {}) {
  return {
    dimension_code:         'strategy',
    subdimension_code:      'strategy-vision',
    score:                  3,
    evidence:               'Evidencia documentada',
    interviewee_id:         INTERVIEWEE_ID,
    interviewee_name:       'Ana Martínez',
    interviewee_role:       'CIO',
    interviewee_type:       'it',
    interviewee_department: 'IT',
    ...overrides,
  }
}

// ── buildBlankDimensions ──────────────────────────────────────

describe('buildBlankDimensions', () => {
  it('retorna exactamente 6 dimensiones', () => {
    const dims = buildBlankDimensions()
    expect(dims).toHaveLength(6)
  })

  it('cada dimensión tiene exactamente 4 subdimensiones', () => {
    const dims = buildBlankDimensions()
    for (const dim of dims) {
      expect(dim.subdimensions).toHaveLength(4)
    }
  })

  it('todos los scores iniciales son null', () => {
    const dims = buildBlankDimensions()
    for (const dim of dims) {
      for (const sub of dim.subdimensions) {
        expect(sub.score).toBeNull()
      }
    }
  })

  it('todas las evidencias iniciales son string vacío', () => {
    const dims = buildBlankDimensions()
    for (const dim of dims) {
      for (const sub of dim.subdimensions) {
        expect(sub.evidence).toBe('')
      }
    }
  })

  it('todos los showCriteria y showEvidence iniciales son false', () => {
    const dims = buildBlankDimensions()
    for (const dim of dims) {
      for (const sub of dim.subdimensions) {
        expect(sub.showCriteria).toBe(false)
        expect(sub.showEvidence).toBe(false)
      }
    }
  })

  it('los códigos de dimensión coinciden con DIMENSION_DEFINITIONS', () => {
    const dims   = buildBlankDimensions()
    const codes  = dims.map((d) => d.code)
    const defCodes = DIMENSION_DEFINITIONS.map((d) => d.code)
    expect(codes).toEqual(defCodes)
  })

  it('las subdimensiones tienen dimensionCode igual al code de la dimensión padre', () => {
    const dims = buildBlankDimensions()
    for (const dim of dims) {
      for (const sub of dim.subdimensions) {
        expect(sub.dimensionCode).toBe(dim.code)
      }
    }
  })
})

// ── fetchT1Data ───────────────────────────────────────────────

describe('fetchT1Data', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna vacío si no hay datos para el engagement', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchT1Data(ENG_ID)

    expect(result.interviewees).toEqual([])
    expect(result.dimensionStates).toEqual({})
  })

  it('retorna vacío si data es null', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchT1Data(ENG_ID)
    expect(result.interviewees).toEqual([])
  })

  it('reconstruye un entrevistado y sus dimensiones correctamente', async () => {
    const rows = DIMENSION_DEFINITIONS.flatMap((def) =>
      def.subdimensions.map((sub) =>
        makeScoreRow({
          dimension_code:    def.code,
          subdimension_code: sub.code,
          score:             2,
          evidence:          `Evidencia ${sub.code}`,
        }),
      ),
    )

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchT1Data(ENG_ID)

    expect(result.interviewees).toHaveLength(1)
    expect(result.interviewees[0].id).toBe(INTERVIEWEE_ID)
    expect(result.interviewees[0].name).toBe('Ana Martínez')
    expect(result.interviewees[0].type).toBe('it')
    expect(result.dimensionStates[INTERVIEWEE_ID]).toHaveLength(6)
  })

  it('distingue múltiples entrevistados por interviewee_id', async () => {
    const rowsIt = [makeScoreRow({ interviewee_id: 'int-it', interviewee_name: 'IT Person', interviewee_type: 'it' })]
    const rowsBiz = [makeScoreRow({ interviewee_id: 'int-biz', interviewee_name: 'Biz Person', interviewee_type: 'business' })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ data: [...rowsIt, ...rowsBiz], error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchT1Data(ENG_ID)

    expect(result.interviewees).toHaveLength(2)
    expect(Object.keys(result.dimensionStates)).toHaveLength(2)
  })

  it('showEvidence es true si hay evidencia en la fila', async () => {
    const rows = [makeScoreRow({ evidence: 'Texto de evidencia' })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchT1Data(ENG_ID)
    const strategyDim = result.dimensionStates[INTERVIEWEE_ID].find((d) => d.code === 'strategy')
    const visionSub   = strategyDim?.subdimensions.find((s) => s.code === 'strategy-vision')

    expect(visionSub?.showEvidence).toBe(true)
  })

  it('lanza error con prefijo [T1] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ data: null, error: { message: 'connection refused' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchT1Data(ENG_ID)).rejects.toThrow('[T1] fetchT1Data:')
  })
})

// ── upsertT1Score ─────────────────────────────────────────────

describe('upsertT1Score', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a upsert en t1_dimension_scores con los campos correctos', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await upsertT1Score({
      engagementId:          ENG_ID,
      intervieweeId:         INTERVIEWEE_ID,
      intervieweeName:       'Ana Martínez',
      intervieweeRole:       'CIO',
      intervieweeType:       'it',
      intervieweeDepartment: 'IT',
      dimensionCode:         'strategy',
      subdimensionCode:      'strategy-vision',
      score:                 3,
      evidence:              'Evidencia de prueba',
    })

    expect(supabase.from).toHaveBeenCalledWith('t1_dimension_scores')
    expect(mockChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id:        ENG_ID,
        dimension_code:    'strategy',
        subdimension_code: 'strategy-vision',
        score:             3,
        evidence:          'Evidencia de prueba',
        interviewee_id:    INTERVIEWEE_ID,
      }),
      expect.objectContaining({ onConflict: expect.stringContaining('project_id') }),
    )
  })

  it('acepta score null (subdimensión sin puntuar)', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await upsertT1Score({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'X', intervieweeRole: 'Y', intervieweeType: 'business',
      intervieweeDepartment: '', dimensionCode: 'data', subdimensionCode: 'data-availability',
      score: null, evidence: '',
    })

    expect(mockChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ score: null }),
      expect.any(Object),
    )
  })

  it('lanza error con prefijo [T1] si falla el upsert', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: { message: 'unique violation' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(upsertT1Score({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'X', intervieweeRole: 'Y', intervieweeType: 'it',
      intervieweeDepartment: 'IT', dimensionCode: 'data', subdimensionCode: 'data-quality',
      score: 2, evidence: '',
    })).rejects.toThrow('[T1] upsertT1Score:')
  })
})

// ── upsertAllScoresForInterviewee ─────────────────────────────

describe('upsertAllScoresForInterviewee', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hace upsert con todas las subdimensiones de las dimensiones pasadas', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const dimensions = buildBlankDimensions()
    await upsertAllScoresForInterviewee({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'Ana', intervieweeRole: 'CIO',
      intervieweeType: 'it', intervieweeDepartment: 'IT',
      dimensions,
    })

    // 6 dimensiones × 4 subdimensiones = 24 filas
    const rows = vi.mocked(mockChain.upsert).mock.calls[0][0] as unknown[]
    expect(rows).toHaveLength(24)
  })

  it('lanza error con prefijo [T1] si falla el upsert masivo', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: { message: 'bulk insert failed' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(upsertAllScoresForInterviewee({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'X', intervieweeRole: 'Y', intervieweeType: 'business',
      intervieweeDepartment: '', dimensions: buildBlankDimensions(),
    })).rejects.toThrow('[T1] upsertAllScoresForInterviewee:')
  })
})

// ── deleteIntervieweeScores ───────────────────────────────────

describe('deleteIntervieweeScores', () => {
  beforeEach(() => vi.clearAllMocks())

  it('elimina los scores filtrando por project_id e interviewee_id', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await deleteIntervieweeScores(ENG_ID, INTERVIEWEE_ID)

    expect(supabase.from).toHaveBeenCalledWith('t1_dimension_scores')
    expect(mockChain.delete).toHaveBeenCalledOnce()
    expect(mockChain.eq).toHaveBeenCalledWith('project_id', ENG_ID)
    expect(mockChain.eq).toHaveBeenCalledWith('interviewee_id', INTERVIEWEE_ID)
  })

  it('lanza error con prefijo [T1] si falla el delete', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: { message: 'RLS denied' } })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(deleteIntervieweeScores(ENG_ID, INTERVIEWEE_ID)).rejects.toThrow(
      '[T1] deleteIntervieweeScores:',
    )
  })
})
