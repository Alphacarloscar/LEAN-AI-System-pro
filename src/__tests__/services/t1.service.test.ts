import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc:  vi.fn(),
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
// Usa supabase.rpc('bulk_upsert_t1_scores'), NO supabase.from()

describe('upsertAllScoresForInterviewee', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a supabase.rpc("bulk_upsert_t1_scores") con 24 filas (6 dims × 4 subdims)', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const dimensions = buildBlankDimensions()
    await upsertAllScoresForInterviewee({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'Ana', intervieweeRole: 'CIO',
      intervieweeType: 'it', intervieweeDepartment: 'IT',
      dimensions,
    })

    expect(supabase.rpc).toHaveBeenCalledWith('bulk_upsert_t1_scores', expect.any(Object))
    const callArgs = vi.mocked(supabase.rpc).mock.calls[0]
    expect(callArgs[0]).toBe('bulk_upsert_t1_scores')
    // 6 dimensiones × 4 subdimensiones = 24 filas en p_scores
    const rows = (callArgs[1] as { p_scores: unknown[] }).p_scores
    expect(rows).toHaveLength(24)
  })

  it('cada fila de p_scores incluye project_id, interviewee_id y dimension/subdimension codes', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    await upsertAllScoresForInterviewee({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'Ana', intervieweeRole: 'CIO',
      intervieweeType: 'it', intervieweeDepartment: 'IT',
      dimensions: buildBlankDimensions(),
    })

    const rows = (vi.mocked(supabase.rpc).mock.calls[0][1] as { p_scores: Record<string, unknown>[] }).p_scores
    for (const row of rows) {
      expect(row.project_id).toBe(ENG_ID)
      expect(row.interviewee_id).toBe(INTERVIEWEE_ID)
      expect(typeof row.dimension_code).toBe('string')
      expect(typeof row.subdimension_code).toBe('string')
    }
  })

  it('lanza error con prefijo [T1] si falla el upsert masivo', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'bulk insert failed' } } as never)

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

// ── PGRST202 — error de contexto (schema cache miss) ──────────
// PGRST202 ocurre cuando el schema cache de PostgREST no reconoce
// la función RPC o la constraint, típicamente tras un deploy reciente.
// El servicio NO debe silenciarlo: la UI necesita el error para lanzar Toast.

describe('PGRST202 — propagación de error de contexto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upsertT1Score: PGRST202 se propaga con prefijo [T1] y no se silencia', async () => {
    const pgrst202 = { code: 'PGRST202', message: 'Could not find a relationship between t1_dimension_scores and the constraint in the schema cache' }
    const mockChain = { upsert: vi.fn().mockResolvedValue({ error: pgrst202 }) }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const promise = upsertT1Score({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'Ana', intervieweeRole: 'CIO', intervieweeType: 'it',
      intervieweeDepartment: 'IT', dimensionCode: 'strategy',
      subdimensionCode: 'strategy-vision', score: 3, evidence: 'test',
    })

    await expect(promise).rejects.toThrow('[T1] upsertT1Score:')
    await expect(promise).rejects.toThrow(pgrst202.message)
  })

  it('upsertAllScoresForInterviewee: PGRST202 (función RPC ausente) se propaga y no se silencia', async () => {
    const pgrst202 = { code: 'PGRST202', message: 'Could not find the function bulk_upsert_t1_scores in the schema cache' }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: pgrst202 } as never)

    const promise = upsertAllScoresForInterviewee({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'Ana', intervieweeRole: 'CIO', intervieweeType: 'it',
      intervieweeDepartment: 'IT', dimensions: buildBlankDimensions(),
    })

    await expect(promise).rejects.toThrow('[T1] upsertAllScoresForInterviewee:')
    await expect(promise).rejects.toThrow(pgrst202.message)
  })

  it('fetchT1Data: error de contexto (project_id ausente simulado) se propaga con prefijo [T1]', async () => {
    const contextError = { code: 'PGRST202', message: 'Column project_id of relation t1_dimension_scores does not exist' }
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ data: null, error: contextError }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchT1Data(ENG_ID)).rejects.toThrow('[T1] fetchT1Data:')
  })
})

// ── Aislamiento de localStorage (sin side effects de persistencia) ──

describe('Aislamiento de localStorage — todas las operaciones T1', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetchT1Data no lee localStorage', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const spy = vi.spyOn(Storage.prototype, 'getItem')
    await fetchT1Data(ENG_ID)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('upsertT1Score no escribe localStorage', async () => {
    const mockChain = { upsert: vi.fn().mockResolvedValue({ error: null }) }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const spy = vi.spyOn(Storage.prototype, 'setItem')
    await upsertT1Score({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'Ana', intervieweeRole: 'CIO', intervieweeType: 'it',
      intervieweeDepartment: 'IT', dimensionCode: 'data',
      subdimensionCode: 'data-quality', score: 2, evidence: '',
    })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('upsertAllScoresForInterviewee no escribe localStorage', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const spy = vi.spyOn(Storage.prototype, 'setItem')
    await upsertAllScoresForInterviewee({
      engagementId: ENG_ID, intervieweeId: INTERVIEWEE_ID,
      intervieweeName: 'Ana', intervieweeRole: 'CIO', intervieweeType: 'it',
      intervieweeDepartment: 'IT', dimensions: buildBlankDimensions(),
    })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('deleteIntervieweeScores no escribe localStorage', async () => {
    const mockChain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
    mockChain.eq.mockReturnValueOnce(mockChain).mockResolvedValueOnce({ error: null })
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const spy = vi.spyOn(Storage.prototype, 'setItem')
    await deleteIntervieweeScores(ENG_ID, INTERVIEWEE_ID)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
