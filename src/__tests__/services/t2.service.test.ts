import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import {
  rowToStakeholder,
  stakeholderToInsert,
  fetchStakeholders,
  insertStakeholder,
  updateStakeholderInDb,
  deleteStakeholderFromDb,
  bulkInsertStakeholders,
} from '@/services/t2.service'
import type { StakeholderRow } from '@/types/database.types'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'

// ── Helpers ───────────────────────────────────────────────────

const ENG_ID = 'proj-t2-test'

function makeRow(overrides: Partial<StakeholderRow> = {}): StakeholderRow {
  return {
    id:              'stk-001',
    project_id:      ENG_ID,
    name:            'Carlos Fernández',
    role:            'Director de Operaciones',
    department:      'Operaciones',
    archetype:       'decisor',
    resistance:      'media',
    interview:       { adoptionScore: 70, influenceScore: 85, opennessScore: 60 },
    notes:           'Muy orientado a ROI',
    manual_override: false,
    unofficial_tools: null,
    created_at:      '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeStakeholder(overrides: Partial<Stakeholder> = {}): Stakeholder {
  return {
    id:         'stk-001',
    name:       'Carlos Fernández',
    role:       'Director de Operaciones',
    department: 'Operaciones',
    archetype:  'decisor',
    resistance: 'media',
    interview:  { answers: {}, adoptionScore: 70, influenceScore: 85, opennessScore: 60, archetype: 'decisor', resistance: 'media', computedAt: '2026-01-01T00:00:00.000Z' },
    notes:      'Muy orientado a ROI',
    createdAt:  '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ── rowToStakeholder ──────────────────────────────────────────

describe('rowToStakeholder', () => {
  it('mapea todos los campos de BD a dominio correctamente', () => {
    const row    = makeRow()
    const result = rowToStakeholder(row)

    expect(result.id).toBe('stk-001')
    expect(result.name).toBe('Carlos Fernández')
    expect(result.role).toBe('Director de Operaciones')
    expect(result.department).toBe('Operaciones')
    expect(result.archetype).toBe('decisor')
    expect(result.resistance).toBe('media')
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('mapea interview correctamente', () => {
    const result = rowToStakeholder(makeRow())
    expect(result.interview?.adoptionScore).toBe(70)
    expect(result.interview?.influenceScore).toBe(85)
    expect(result.interview?.opennessScore).toBe(60)
  })

  it('convierte notes null → undefined', () => {
    const result = rowToStakeholder(makeRow({ notes: null }))
    expect(result.notes).toBeUndefined()
  })

  it('convierte interview null → undefined', () => {
    const result = rowToStakeholder(makeRow({ interview: null }))
    expect(result.interview).toBeUndefined()
  })

  it('convierte unofficial_tools null → undefined', () => {
    const result = rowToStakeholder(makeRow({ unofficial_tools: null }))
    expect(result.unofficialTools).toBeUndefined()
  })

  it('manual_override false → undefined en el dominio', () => {
    const result = rowToStakeholder(makeRow({ manual_override: false }))
    expect(result.manualOverride).toBeUndefined()
  })
})

// ── stakeholderToInsert ───────────────────────────────────────

describe('stakeholderToInsert', () => {
  it('asigna project_id del parámetro engagementId', () => {
    const s   = makeStakeholder()
    const row = stakeholderToInsert(s, 'nuevo-engagement')
    expect(row.project_id).toBe('nuevo-engagement')
  })

  it('convierte notes undefined → null', () => {
    const s   = makeStakeholder({ notes: undefined })
    const row = stakeholderToInsert(s, ENG_ID)
    expect(row.notes).toBeNull()
  })

  it('round-trip: rowToStakeholder → stakeholderToInsert preserva datos clave', () => {
    const originalRow = makeRow()
    const s           = rowToStakeholder(originalRow)
    const insertRow   = stakeholderToInsert(s, ENG_ID)

    expect(insertRow.id).toBe(originalRow.id)
    expect(insertRow.name).toBe(originalRow.name)
    expect(insertRow.department).toBe(originalRow.department)
    expect(insertRow.archetype).toBe(originalRow.archetype)
    expect(insertRow.resistance).toBe(originalRow.resistance)
  })
})

// ── fetchStakeholders ─────────────────────────────────────────

describe('fetchStakeholders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna array de Stakeholder tras fetch exitoso', async () => {
    const rows = [makeRow(), makeRow({ id: 'stk-002', name: 'Laura Gómez' })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchStakeholders(ENG_ID)

    expect(supabase.from).toHaveBeenCalledWith('stakeholders')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Carlos Fernández')
    expect(result[1].name).toBe('Laura Gómez')
  })

  it('retorna array vacío si no hay stakeholders', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchStakeholders(ENG_ID)
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [T2] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchStakeholders(ENG_ID)).rejects.toThrow('[T2] fetchStakeholders:')
  })
})

// ── insertStakeholder ─────────────────────────────────────────

describe('insertStakeholder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a supabase.from("stakeholders").insert()', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await insertStakeholder(makeStakeholder(), ENG_ID)

    expect(supabase.from).toHaveBeenCalledWith('stakeholders')
    expect(mockChain.insert).toHaveBeenCalledOnce()
  })

  it('lanza error con prefijo [T2] si el insert falla', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: { message: 'duplicate key' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(insertStakeholder(makeStakeholder(), ENG_ID)).rejects.toThrow(
      '[T2] insertStakeholder:',
    )
  })
})

// ── updateStakeholderInDb ─────────────────────────────────────

describe('updateStakeholderInDb', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hace update filtrando por id y project_id', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await updateStakeholderInDb('stk-001', ENG_ID, { name: 'Carlos Actualizado' })

    expect(supabase.from).toHaveBeenCalledWith('stakeholders')
    expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Carlos Actualizado' }))
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'stk-001')
    expect(mockChain.eq).toHaveBeenCalledWith('project_id', ENG_ID)
  })

  it('solo incluye en el patch los campos definidos', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const mockChain = {
      update: updateMock,
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await updateStakeholderInDb('stk-001', ENG_ID, { resistance: 'alta' })

    const patch = updateMock.mock.calls[0][0]
    expect(patch).toHaveProperty('resistance', 'alta')
    expect(patch).not.toHaveProperty('name')
    expect(patch).not.toHaveProperty('role')
  })

  it('lanza error con prefijo [T2] si update falla', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: { message: 'not found' } })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(
      updateStakeholderInDb('stk-001', ENG_ID, { name: 'X' }),
    ).rejects.toThrow('[T2] updateStakeholderInDb:')
  })
})

// ── deleteStakeholderFromDb ───────────────────────────────────

describe('deleteStakeholderFromDb', () => {
  beforeEach(() => vi.clearAllMocks())

  it('elimina filtrando por id y project_id', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await deleteStakeholderFromDb('stk-001', ENG_ID)

    expect(supabase.from).toHaveBeenCalledWith('stakeholders')
    expect(mockChain.delete).toHaveBeenCalledOnce()
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'stk-001')
    expect(mockChain.eq).toHaveBeenCalledWith('project_id', ENG_ID)
  })

  it('lanza error con prefijo [T2] si delete falla', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: { message: 'RLS denied' } })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(deleteStakeholderFromDb('stk-001', ENG_ID)).rejects.toThrow(
      '[T2] deleteStakeholderFromDb:',
    )
  })
})

// ── bulkInsertStakeholders ────────────────────────────────────

describe('bulkInsertStakeholders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserta múltiples stakeholders de golpe', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const stakeholders = [
      makeStakeholder({ id: 's1', name: 'Persona 1' }),
      makeStakeholder({ id: 's2', name: 'Persona 2' }),
      makeStakeholder({ id: 's3', name: 'Persona 3' }),
    ]
    await bulkInsertStakeholders(stakeholders, ENG_ID)

    expect(supabase.from).toHaveBeenCalledWith('stakeholders')
    const rows = vi.mocked(mockChain.insert).mock.calls[0][0] as unknown[]
    expect(rows).toHaveLength(3)
  })

  it('lanza error con prefijo [T2] si el bulk insert falla', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: { message: 'constraint violation' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(
      bulkInsertStakeholders([makeStakeholder()], ENG_ID),
    ).rejects.toThrow('[T2] bulkInsertStakeholders:')
  })
})
