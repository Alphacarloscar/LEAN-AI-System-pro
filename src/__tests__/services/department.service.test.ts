import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import {
  fetchDepartments,
  addDepartment,
  deleteDepartment,
} from '@/services/department.service'
import type { Department } from '@/modules/CompanyProfile/useDepartmentStore'

// ── Fixtures ──────────────────────────────────────────────────────

const COMPANY_ID = 'company-dept-test'

function makeDept(overrides: Partial<Department> = {}): Department {
  return {
    id:         'dept-001',
    company_id: COMPANY_ID,
    name:       'Tecnología',
    color:      '#C8860A',
    created_at: '2026-01-10T08:00:00.000Z',
    ...overrides,
  }
}

// ── fetchDepartments ──────────────────────────────────────────────

describe('fetchDepartments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna array de Department tras fetch exitoso', async () => {
    const rows = [makeDept(), makeDept({ id: 'dept-002', name: 'Operaciones' })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchDepartments(COMPANY_ID)

    expect(supabase.from).toHaveBeenCalledWith('company_departments')
    expect(mockChain.select).toHaveBeenCalledWith('id, company_id, name, color, created_at')
    expect(mockChain.eq).toHaveBeenCalledWith('company_id', COMPANY_ID)
    expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Tecnología')
  })

  it('retorna array vacío si data es null (empresa sin departamentos)', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchDepartments(COMPANY_ID)
    expect(result).toEqual([])
  })

  it('retorna array vacío si data es array vacío', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchDepartments(COMPANY_ID)
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [DepartmentService] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'relation not found' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchDepartments(COMPANY_ID)).rejects.toThrow('[DepartmentService] fetchDepartments:')
  })

  it('propaga el mensaje de error original de Supabase', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS policy denied' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchDepartments(COMPANY_ID)).rejects.toThrow('RLS policy denied')
  })
})

// ── addDepartment ─────────────────────────────────────────────────

describe('addDepartment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserta con el nombre recortado y color por defecto #C8860A', async () => {
    const created = makeDept({ name: 'Marketing' })
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: created, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await addDepartment(COMPANY_ID, '  Marketing  ')

    expect(supabase.from).toHaveBeenCalledWith('company_departments')
    expect(mockChain.insert).toHaveBeenCalledWith({
      company_id: COMPANY_ID,
      name:       'Marketing',
      color:      '#C8860A',
    })
    expect(result.name).toBe('Marketing')
    expect(result.color).toBe('#C8860A')
  })

  it('retorna el departamento completo creado por Supabase', async () => {
    const created = makeDept({ id: 'dept-new', name: 'RRHH', company_id: COMPANY_ID })
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: created, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await addDepartment(COMPANY_ID, 'RRHH')

    expect(result.id).toBe('dept-new')
    expect(result.company_id).toBe(COMPANY_ID)
    expect(result.created_at).toBe('2026-01-10T08:00:00.000Z')
  })

  it('selecciona los campos correctos tras el insert', async () => {
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: makeDept(), error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await addDepartment(COMPANY_ID, 'Finanzas')

    expect(mockChain.select).toHaveBeenCalledWith('id, company_id, name, color, created_at')
  })

  it('lanza error con prefijo [DepartmentService] si Supabase devuelve error', async () => {
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS violation' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(addDepartment(COMPANY_ID, 'Finanzas')).rejects.toThrow('[DepartmentService] addDepartment:')
  })

  it('lanza error si Supabase no devuelve data (insert silencioso)', async () => {
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(addDepartment(COMPANY_ID, 'Finanzas')).rejects.toThrow(
      '[DepartmentService] addDepartment: no data returned',
    )
  })
})

// ── deleteDepartment ──────────────────────────────────────────────

describe('deleteDepartment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a delete filtrando por id correcto', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await deleteDepartment('dept-001')

    expect(supabase.from).toHaveBeenCalledWith('company_departments')
    expect(mockChain.delete).toHaveBeenCalledOnce()
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'dept-001')
  })

  it('no lanza si error es null (happy path)', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(deleteDepartment('dept-001')).resolves.toBeUndefined()
  })

  it('lanza error con prefijo [DepartmentService] si Supabase falla', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: { message: 'foreign key constraint' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(deleteDepartment('dept-001')).rejects.toThrow('[DepartmentService] deleteDepartment:')
  })

  it('propaga el mensaje de error original', async () => {
    const mockChain = {
      delete: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: { message: 'department has active users' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(deleteDepartment('dept-001')).rejects.toThrow('department has active users')
  })
})
