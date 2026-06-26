import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { UseCaseRow } from '@/types/database.types'

vi.mock('@/lib/audit/auditClient', () => ({ fireAuditLog: vi.fn() }))
vi.mock('@/lib/audit', () => ({ makeAuditable: <T>(s: T) => s }))

// Mock completo del cliente Supabase — debe ir antes de los imports del servicio
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import {
  rowToUseCase,
  useCaseToInsert,
  fetchUseCases,
  insertUseCase,
  updateUseCaseInDb,
  deleteUseCaseFromDb,
} from '@/services/t4.service'

// ── Helpers ──────────────────────────────────────────────────────

const PROJECT_ID = 'proj-abc-123'

function makeRow(overrides: Partial<UseCaseRow> = {}): UseCaseRow {
  return {
    id:                    'uc-001',
    project_id:            PROJECT_ID,
    name:                  'Automatización facturación',
    description:           'Desc',
    department:            'Finanzas',
    ai_category:           'automatizacion_rpa',
    status:                'candidato',
    sponsor_name:          'Ana López',
    responsible_it_data:   null,
    business_objective:    null,
    imported_from_t3:      null,
    stakeholder_scores:    [],
    scores:                { kpiImpact: 70, feasibility: 60, aiRisk: 20, dataDependency: 30 },
    priority_score:        68.5,
    economics:             null,
    go_no_go:              null,
    roadmap:               null,
    t1_context:            null,
    t2_context:            null,
    ai_act_classification: null,
    notes:                 null,
    created_at:            '2026-01-15T10:00:00.000Z',
    updated_at:            '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

// ── Tests de mapeo (sin red) ──────────────────────────────────────

describe('rowToUseCase', () => {
  it('mapea campos básicos correctamente', () => {
    const row  = makeRow()
    const uc   = rowToUseCase(row)

    expect(uc.id).toBe('uc-001')
    expect(uc.name).toBe('Automatización facturación')
    expect(uc.department).toBe('Finanzas')
    expect(uc.aiCategory).toBe('automatizacion_rpa')
    expect(uc.status).toBe('candidato')
    expect(uc.priorityScore).toBe(68.5)
    expect(uc.createdAt).toBe('2026-01-15T10:00:00.000Z')
  })

  it('convierte null → undefined para campos opcionales', () => {
    const uc = rowToUseCase(makeRow({ description: null, notes: null, economics: null }))
    expect(uc.description).toBeUndefined()
    expect(uc.notes).toBeUndefined()
    expect(uc.economics).toBeUndefined()
  })

  it('priorityScore es number (no string)', () => {
    const uc = rowToUseCase(makeRow({ priority_score: 72.3 }))
    expect(typeof uc.priorityScore).toBe('number')
    expect(uc.priorityScore).toBe(72.3)
  })
})

describe('useCaseToInsert', () => {
  it('asigna project_id del parámetro engagementId', () => {
    const uc  = rowToUseCase(makeRow())
    const row = useCaseToInsert(uc, 'new-project-id')
    expect(row.project_id).toBe('new-project-id')
  })

  it('convierte undefined → null para campos opcionales', () => {
    const uc  = rowToUseCase(makeRow({ description: null }))
    const row = useCaseToInsert(uc, PROJECT_ID)
    expect(row.description).toBeNull()
  })

  it('round-trip: rowToUseCase → useCaseToInsert preserva datos', () => {
    const originalRow = makeRow()
    const uc          = rowToUseCase(originalRow)
    const insertRow   = useCaseToInsert(uc, PROJECT_ID)

    expect(insertRow.id).toBe(originalRow.id)
    expect(insertRow.name).toBe(originalRow.name)
    expect(insertRow.department).toBe(originalRow.department)
    expect(insertRow.ai_category).toBe(originalRow.ai_category)
    expect(insertRow.priority_score).toBe(originalRow.priority_score)
  })
})

// ── Tests de operaciones CRUD (con mock de Supabase) ─────────────

describe('fetchUseCases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna array de UseCase tras fetch exitoso', async () => {
    const rows = [makeRow(), makeRow({ id: 'uc-002', name: 'Asistente IA RRHH' })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchUseCases(PROJECT_ID)

    expect(supabase.from).toHaveBeenCalledWith('use_cases')
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('uc-001')
    expect(result[1].name).toBe('Asistente IA RRHH')
  })

  it('retorna array vacío si data es null', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchUseCases(PROJECT_ID)
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [T4] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'connection error' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchUseCases(PROJECT_ID)).rejects.toThrow('[T4] fetchUseCases:')
  })
})

describe('insertUseCase', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a supabase.from("use_cases").insert()', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const uc = rowToUseCase(makeRow())
    await insertUseCase(uc, PROJECT_ID)

    expect(supabase.from).toHaveBeenCalledWith('use_cases')
    expect(mockChain.insert).toHaveBeenCalledOnce()
  })

  it('lanza error si insert falla', async () => {
    const mockChain = {
      insert: vi.fn().mockResolvedValue({ error: { message: 'duplicate key' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const uc = rowToUseCase(makeRow())
    await expect(insertUseCase(uc, PROJECT_ID)).rejects.toThrow('[T4] insertUseCase:')
  })
})

describe('deleteUseCaseFromDb', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a delete con id y project_id correctos', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    // El segundo .eq().mockResolvedValue
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })

    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await deleteUseCaseFromDb('uc-001', PROJECT_ID)

    expect(supabase.from).toHaveBeenCalledWith('use_cases')
    expect(mockChain.delete).toHaveBeenCalledOnce()
  })
})

// ── updateUseCaseInDb ─────────────────────────────────────────

describe('updateUseCaseInDb', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a update con id y project_id correctos', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await updateUseCaseInDb('uc-001', PROJECT_ID, { name: 'Nuevo nombre' })

    expect(supabase.from).toHaveBeenCalledWith('use_cases')
    expect(mockChain.update).toHaveBeenCalledOnce()
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'uc-001')
    expect(mockChain.eq).toHaveBeenCalledWith('project_id', PROJECT_ID)
  })

  it('lanza error con prefijo [T4] si Supabase falla', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: { message: 'FK violation' } })
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(
      updateUseCaseInDb('uc-001', PROJECT_ID, { name: 'X' })
    ).rejects.toThrow('[T4] updateUseCaseInDb:')
  })

  it('no lee ni escribe en localStorage directamente (aislamiento total)', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const getSpy = vi.spyOn(Storage.prototype, 'getItem')
    const setSpy = vi.spyOn(Storage.prototype, 'setItem')

    await updateUseCaseInDb('uc-001', PROJECT_ID, { description: 'Dependencia crítica' })

    expect(getSpy).not.toHaveBeenCalled()
    expect(setSpy).not.toHaveBeenCalled()

    getSpy.mockRestore()
    setSpy.mockRestore()
  })
})

// ── Debounce — protección contra ametralladora de llamadas ────

describe('updateUseCaseInDb — debounce (ametralladora de llamadas)', () => {
  // Timer map local que replica el patrón store T1/T5/T4
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

  function fireDebounced(id: string, engId: string, description: string): void {
    const key = `${engId}::${id}`
    const existing = debounceTimers.get(key)
    if (existing) clearTimeout(existing)
    debounceTimers.set(key, setTimeout(() => {
      updateUseCaseInDb(id, engId, { description }).catch(() => null)
      debounceTimers.delete(key)
    }, 500))
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    debounceTimers.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('acumula 5 pulsaciones y dispara UNA sola petición de red tras 500ms', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    // Simula usuario tecleando "Depen" carácter a carácter
    for (const char of ['D', 'De', 'Dep', 'Depe', 'Depen']) {
      fireDebounced('uc-001', PROJECT_ID, char)
    }

    // Antes de expirar el debounce — ninguna llamada de red
    expect(supabase.from).not.toHaveBeenCalled()

    // Avanzar 500ms: el timer del último keystroke dispara
    await vi.advanceTimersByTimeAsync(500)

    expect(supabase.from).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith('use_cases')
  })

  it('timers independientes por use-case: 2 IDs distintos → 2 peticiones de red', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain).mockResolvedValueOnce({ error: null })
      .mockReturnValueOnce(mockChain).mockResolvedValueOnce({ error: null })
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    fireDebounced('uc-001', PROJECT_ID, 'ROI: alto')
    fireDebounced('uc-002', PROJECT_ID, 'ROI: medio')

    await vi.advanceTimersByTimeAsync(500)

    expect(supabase.from).toHaveBeenCalledTimes(2)
  })

  it('cancelar y reenviar antes de 500ms → solo la última versión llega a Supabase', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
    }
    mockChain.eq
      .mockReturnValueOnce(mockChain)
      .mockResolvedValueOnce({ error: null })
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    fireDebounced('uc-001', PROJECT_ID, 'Vers 1')
    await vi.advanceTimersByTimeAsync(200)   // avanzamos sin llegar a 500
    fireDebounced('uc-001', PROJECT_ID, 'Vers 2 — final')  // resetea el timer
    await vi.advanceTimersByTimeAsync(500)   // ahora sí expira el nuevo timer

    expect(supabase.from).toHaveBeenCalledTimes(1)
    // El update se llama con la versión final
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Vers 2 — final' })
    )
  })
})
