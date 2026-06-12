import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { T5CanvasRow } from '@/types/database.types'

// Mock del cliente Supabase — antes de los imports del servicio
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase }                        from '@/lib/supabase'
import { getT5Canvas, upsertT5Canvas }     from '@/services/t5.service'
import type { T5Canvas }                   from '@/modules/T5_AITaxonomyCanvas/types'

// ── Fixtures ─────────────────────────────────────────────────────

const PROJECT_ID = 'proj-t5-test'

function makeRow(overrides: Partial<T5CanvasRow> = {}): T5CanvasRow {
  return {
    id:                  'canvas-001',
    project_id:          PROJECT_ID,
    company_name:        'Empresa Demo S.L.',
    domains:             {
      estrategia: { domainCode: 'estrategia', maturityLevel: 'emergente', priority: 2, notes: '' },
    },
    maturity_level:      'emergente',
    activation_sequence: ['estrategia', 'datos'],
    notes:               null,
    created_at:          '2026-01-10T08:00:00.000Z',
    updated_at:          '2026-01-15T12:00:00.000Z',
    ...overrides,
  }
}

function makeCanvas(overrides: Partial<T5Canvas> = {}): T5Canvas {
  return {
    id:                  'canvas-001',
    companyName:         'Empresa Demo S.L.',
    createdAt:           '2026-01-10T08:00:00.000Z',
    updatedAt:           '2026-01-15T12:00:00.000Z',
    domains:             {
      estrategia: { domainCode: 'estrategia', maturityLevel: 'emergente', priority: 2, notes: '' },
    } as T5Canvas['domains'],
    maturityLevel:       'emergente',
    activationSequence:  ['estrategia', 'datos'] as T5Canvas['activationSequence'],
    notes:               undefined,
    ...overrides,
  }
}

// ── getT5Canvas ───────────────────────────────────────────────────

describe('getT5Canvas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna T5Canvas mapeado cuando Supabase devuelve una fila', async () => {
    const row = makeRow()
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await getT5Canvas(PROJECT_ID)

    expect(supabase.from).toHaveBeenCalledWith('t5_canvas')
    expect(mockChain.select).toHaveBeenCalledWith('*')
    expect(mockChain.eq).toHaveBeenCalledWith('project_id', PROJECT_ID)
    expect(result).not.toBeNull()
    expect(result?.id).toBe('canvas-001')
    expect(result?.companyName).toBe('Empresa Demo S.L.')
    expect(result?.maturityLevel).toBe('emergente')
    expect(result?.notes).toBeUndefined()
  })

  it('retorna null cuando no existe fila (maybeSingle devuelve null)', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await getT5Canvas(PROJECT_ID)
    expect(result).toBeNull()
  })

  it('mapea notes correctamente cuando tiene valor string', async () => {
    const row = makeRow({ notes: 'Notas de diagnóstico inicial' })
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await getT5Canvas(PROJECT_ID)
    expect(result?.notes).toBe('Notas de diagnóstico inicial')
  })

  it('lanza error con prefijo [T5] si Supabase falla', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection refused' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(getT5Canvas(PROJECT_ID)).rejects.toThrow('[T5] getT5Canvas:')
  })

  it('NO accede a localStorage (solo Supabase)', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: makeRow(), error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    await getT5Canvas(PROJECT_ID)
    expect(getItemSpy).not.toHaveBeenCalled()
    getItemSpy.mockRestore()
  })
})

// ── upsertT5Canvas ────────────────────────────────────────────────

describe('upsertT5Canvas', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a supabase.from("t5_canvas").upsert() con onConflict project_id', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await upsertT5Canvas(PROJECT_ID, makeCanvas())

    expect(supabase.from).toHaveBeenCalledWith('t5_canvas')
    expect(mockChain.upsert).toHaveBeenCalledOnce()
    const [row, opts] = mockChain.upsert.mock.calls[0]
    expect(opts).toEqual({ onConflict: 'project_id' })
    expect(row.project_id).toBe(PROJECT_ID)
  })

  it('serializa correctamente los campos snake_case del payload', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const canvas = makeCanvas({ companyName: 'Acme Corp', maturityLevel: 'avanzado' })
    await upsertT5Canvas(PROJECT_ID, canvas)

    const [row] = mockChain.upsert.mock.calls[0]
    expect(row.company_name).toBe('Acme Corp')
    expect(row.maturity_level).toBe('avanzado')
    expect(row.notes).toBeNull()
  })

  it('incluye updated_at como ISO string en el payload', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await upsertT5Canvas(PROJECT_ID, makeCanvas())

    const [row] = mockChain.upsert.mock.calls[0]
    expect(typeof row.updated_at).toBe('string')
    expect(() => new Date(row.updated_at)).not.toThrow()
  })

  it('no lanza si upsert tiene error null (happy path)', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(upsertT5Canvas(PROJECT_ID, makeCanvas())).resolves.toBeUndefined()
  })

  it('lanza error con prefijo [T5] si Supabase falla', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: { message: 'RLS policy violation' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(upsertT5Canvas(PROJECT_ID, makeCanvas())).rejects.toThrow('[T5] upsertT5Canvas:')
  })

  it('NO accede a localStorage (solo Supabase)', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    await upsertT5Canvas(PROJECT_ID, makeCanvas())
    expect(setItemSpy).not.toHaveBeenCalled()
    setItemSpy.mockRestore()
  })
})
