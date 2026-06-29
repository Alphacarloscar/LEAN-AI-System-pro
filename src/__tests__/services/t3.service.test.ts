import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/audit/auditClient', () => ({ fireAuditLog: vi.fn() }))
vi.mock('@/lib/audit', () => ({ makeAuditable: <T>(s: T) => s }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from:      vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  },
}))

import { supabase } from '@/lib/supabase'
import {
  rowToValueStream,
  valueStreamToInsert,
  fetchValueStreams,
  insertValueStream,
  updateValueStreamInDb,
  deleteValueStreamFromDb,
  bulkInsertValueStreams,
} from '@/services/t3.service'
import type { ValueStreamRow } from '@/types/database.types'
import type { ValueStream } from '@/modules/T3_ValueStreamMap/types'

// ── Helpers ───────────────────────────────────────────────────

const ENG_ID = 'proj-t3-test'

function makeRow(overrides: Partial<ValueStreamRow> = {}): ValueStreamRow {
  return {
    id:               'vs-001',
    project_id:       ENG_ID,
    name:             'Gestión de Pedidos',
    department:       'Logística',
    owner:            'María López',
    owner_role:       'Directora de Operaciones',
    description:      'Proceso de gestión de pedidos end-to-end',
    phase:            'validacion',
    ai_category:      'automatizacion_rpa',
    org_readiness:    'media',
    opportunity_level: 'alta',
    interview:        { processVolume: 500, manualSteps: 8, errorRate: 0.15 },
    opportunities:    [],
    stages:           [],
    notes:            null,
    manual_override:  false,
    created_at:       '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeValueStream(overrides: Partial<ValueStream> = {}): ValueStream {
  return {
    id:               'vs-001',
    name:             'Gestión de Pedidos',
    department:       'Logística',
    owner:            'María López',
    ownerRole:        'Directora de Operaciones',
    description:      'Proceso de gestión de pedidos end-to-end',
    phase:            'validacion',
    aiCategory:       'automatizacion_rpa',
    orgReadiness:     'media',
    opportunityLevel: 'alta',
    opportunities:    [],
    createdAt:        '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ── rowToValueStream ──────────────────────────────────────────

describe('rowToValueStream', () => {
  it('mapea todos los campos de BD a dominio correctamente', () => {
    const row    = makeRow()
    const result = rowToValueStream(row)

    expect(result.id).toBe('vs-001')
    expect(result.name).toBe('Gestión de Pedidos')
    expect(result.department).toBe('Logística')
    expect(result.owner).toBe('María López')
    expect(result.ownerRole).toBe('Directora de Operaciones')
    expect(result.phase).toBe('validacion')
    expect(result.aiCategory).toBe('automatizacion_rpa')
    expect(result.orgReadiness).toBe('media')
    expect(result.opportunityLevel).toBe('alta')
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('convierte owner null → undefined', () => {
    const result = rowToValueStream(makeRow({ owner: null }))
    expect(result.owner).toBeUndefined()
  })

  it('convierte description null → undefined', () => {
    const result = rowToValueStream(makeRow({ description: null }))
    expect(result.description).toBeUndefined()
  })

  it('convierte notes null → undefined', () => {
    const result = rowToValueStream(makeRow({ notes: null }))
    expect(result.notes).toBeUndefined()
  })

  it('convierte interview null → undefined', () => {
    const result = rowToValueStream(makeRow({ interview: null }))
    expect(result.interview).toBeUndefined()
  })

  it('opportunities es array vacío si es null o []', () => {
    const result = rowToValueStream(makeRow({ opportunities: [] }))
    expect(result.opportunities).toEqual([])
  })

  it('mapea interview correctamente cuando existe', () => {
    const interview = { processVolume: 500, manualSteps: 8, errorRate: 0.15 }
    const result    = rowToValueStream(makeRow({ interview }))
    expect(result.interview).toEqual(interview)
  })
})

// ── valueStreamToInsert ───────────────────────────────────────

describe('valueStreamToInsert', () => {
  it('asigna project_id del parámetro engagementId', () => {
    const vs  = makeValueStream()
    const row = valueStreamToInsert(vs, 'nuevo-engagement')
    expect(row.project_id).toBe('nuevo-engagement')
  })

  it('convierte owner undefined → null', () => {
    const vs  = makeValueStream({ owner: undefined })
    const row = valueStreamToInsert(vs, ENG_ID)
    expect(row.owner).toBeNull()
  })

  it('convierte description undefined → null', () => {
    const vs  = makeValueStream({ description: undefined })
    const row = valueStreamToInsert(vs, ENG_ID)
    expect(row.description).toBeNull()
  })

  it('round-trip: rowToValueStream → valueStreamToInsert preserva datos clave', () => {
    const originalRow = makeRow()
    const vs          = rowToValueStream(originalRow)
    const insertRow   = valueStreamToInsert(vs, ENG_ID)

    expect(insertRow.id).toBe(originalRow.id)
    expect(insertRow.name).toBe(originalRow.name)
    expect(insertRow.department).toBe(originalRow.department)
    expect(insertRow.phase).toBe(originalRow.phase)
    expect(insertRow.ai_category).toBe(originalRow.ai_category)
  })
})

// ── fetchValueStreams ─────────────────────────────────────────

describe('fetchValueStreams', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna array de ValueStream tras fetch exitoso', async () => {
    const rows = [makeRow(), makeRow({ id: 'vs-002', name: 'Facturación Automática' })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchValueStreams(ENG_ID)

    expect(supabase.from).toHaveBeenCalledWith('value_streams')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Gestión de Pedidos')
    expect(result[1].name).toBe('Facturación Automática')
  })

  it('retorna array vacío si no hay value streams', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchValueStreams(ENG_ID)
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [T3] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'connection error' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchValueStreams(ENG_ID)).rejects.toThrow('[T3] fetchValueStreams:')
  })
})

// ── insertValueStream ─────────────────────────────────────────

describe('insertValueStream', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a supabase.from("value_streams").insert()', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await insertValueStream(makeValueStream(), ENG_ID)

    expect(supabase.from).toHaveBeenCalledWith('value_streams')
    expect(mockChain.insert).toHaveBeenCalledOnce()
  })

  it('lanza error con prefijo [T3] si el insert falla', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: { message: 'duplicate key' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(insertValueStream(makeValueStream(), ENG_ID)).rejects.toThrow(
      '[T3] insertValueStream:',
    )
  })
})

// ── updateValueStreamInDb ─────────────────────────────────────

describe('updateValueStreamInDb', () => {
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

    await updateValueStreamInDb('vs-001', ENG_ID, { name: 'Gestión Actualizada', phase: 'piloto' })

    expect(supabase.from).toHaveBeenCalledWith('value_streams')
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Gestión Actualizada', phase: 'piloto' }),
    )
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'vs-001')
    expect(mockChain.eq).toHaveBeenCalledWith('project_id', ENG_ID)
  })

  it('solo incluye en el patch los campos definidos', async () => {
    const updateMock = vi.fn().mockReturnThis()
    const mockChain  = { update: updateMock, eq: vi.fn().mockReturnThis() }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await updateValueStreamInDb('vs-001', ENG_ID, { phase: 'estandarizacion' })

    const patch = updateMock.mock.calls[0][0]
    expect(patch).toHaveProperty('phase', 'estandarizacion')
    expect(patch).not.toHaveProperty('name')
    expect(patch).not.toHaveProperty('department')
  })

  it('lanza error con prefijo [T3] si update falla', async () => {
    const mockChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: { message: 'not found' } })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(
      updateValueStreamInDb('vs-001', ENG_ID, { name: 'X' }),
    ).rejects.toThrow('[T3] updateValueStreamInDb:')
  })
})

// ── deleteValueStreamFromDb ───────────────────────────────────

describe('deleteValueStreamFromDb', () => {
  beforeEach(() => vi.clearAllMocks())

  it('elimina filtrando por id y project_id', async () => {
    const mockChain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await deleteValueStreamFromDb('vs-001', ENG_ID)

    expect(supabase.from).toHaveBeenCalledWith('value_streams')
    expect(mockChain.delete).toHaveBeenCalledOnce()
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'vs-001')
    expect(mockChain.eq).toHaveBeenCalledWith('project_id', ENG_ID)
  })

  it('lanza error con prefijo [T3] si delete falla', async () => {
    const mockChain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: { message: 'RLS denied' } })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(deleteValueStreamFromDb('vs-001', ENG_ID)).rejects.toThrow(
      '[T3] deleteValueStreamFromDb:',
    )
  })
})

// ── bulkInsertValueStreams ─────────────────────────────────────

describe('bulkInsertValueStreams', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserta múltiples value streams de golpe', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const valueStreams = [
      makeValueStream({ id: 'vs-1', name: 'Proceso 1' }),
      makeValueStream({ id: 'vs-2', name: 'Proceso 2' }),
    ]
    await bulkInsertValueStreams(valueStreams, ENG_ID)

    expect(supabase.from).toHaveBeenCalledWith('value_streams')
    const rows = vi.mocked(mockChain.insert).mock.calls[0][0] as unknown[]
    expect(rows).toHaveLength(2)
  })

  it('lanza error con prefijo [T3] si el bulk insert falla', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: { message: 'constraint violation' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(
      bulkInsertValueStreams([makeValueStream()], ENG_ID),
    ).rejects.toThrow('[T3] bulkInsertValueStreams:')
  })
})

// ── Aislamiento de localStorage — mutaciones T3 ───────────────
// Todas las mutaciones del servicio deben ir directamente a Supabase.
// No deben generar persistencias paralelas en el almacenamiento local.

describe('Aislamiento de localStorage — mutaciones T3', () => {
  beforeEach(() => vi.clearAllMocks())

  it('insertValueStream no escribe localStorage', async () => {
    const mockChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const spy = vi.spyOn(Storage.prototype, 'setItem')
    await insertValueStream(makeValueStream(), ENG_ID)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('updateValueStreamInDb no escribe localStorage', async () => {
    const mockChain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
    mockChain.eq.mockReturnValueOnce(mockChain).mockResolvedValueOnce({ error: null })
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const spy = vi.spyOn(Storage.prototype, 'setItem')
    await updateValueStreamInDb('vs-001', ENG_ID, { phase: 'estandarizacion' })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('deleteValueStreamFromDb no escribe localStorage', async () => {
    const mockChain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
    mockChain.eq.mockReturnValueOnce(mockChain).mockResolvedValueOnce({ error: null })
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const spy = vi.spyOn(Storage.prototype, 'setItem')
    await deleteValueStreamFromDb('vs-001', ENG_ID)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('bulkInsertValueStreams no escribe localStorage', async () => {
    const mockChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const spy = vi.spyOn(Storage.prototype, 'setItem')
    await bulkInsertValueStreams([makeValueStream(), makeValueStream({ id: 'vs-002', name: 'P2' })], ENG_ID)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('fetchValueStreams no lee localStorage', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const spy = vi.spyOn(Storage.prototype, 'getItem')
    await fetchValueStreams(ENG_ID)
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
