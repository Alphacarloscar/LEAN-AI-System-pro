import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc:  vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-jwt-token' } },
        error: null,
      }),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import {
  fetchPersons,
  fetchPersonsByCompany,
  addPerson,
  updatePerson,
  mergePersons,
} from '@/services/company-person.service'

// ── Fixtures ──────────────────────────────────────────────────────

const PROJECT_ID = 'project-001'
const COMPANY_ID = 'company-001'

const PERSON_COLUMNS = 'id, project_id, company_id, name, role, department, source_tool, created_at, projects(name)'

function makePersonRow(overrides: Record<string, unknown> = {}) {
  return {
    id:          'person-001',
    project_id:  PROJECT_ID,
    company_id:  COMPANY_ID,
    name:        'Ana García',
    role:        'CTO',
    department:  'IT',
    source_tool: 'company_profile',
    created_at:  '2026-01-10T08:00:00.000Z',
    projects:    { name: 'Proyecto Alpha' },
    ...overrides,
  }
}

// ── fetchPersons ──────────────────────────────────────────────────

describe('fetchPersons', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna personas del proyecto con project_name aplanado', async () => {
    const rows = [makePersonRow(), makePersonRow({ id: 'person-002', name: 'Luis Ruiz' })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchPersons(PROJECT_ID)

    expect(supabase.from).toHaveBeenCalledWith('company_persons')
    expect(mockChain.select).toHaveBeenCalledWith(PERSON_COLUMNS)
    expect(mockChain.eq).toHaveBeenCalledWith('project_id', PROJECT_ID)
    expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result).toHaveLength(2)
    expect(result[0].project_name).toBe('Proyecto Alpha')
    expect(result[0]).not.toHaveProperty('projects')
  })

  it('retorna array vacío si data es null', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchPersons(PROJECT_ID)
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [CompanyPersonService] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'relation not found' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchPersons(PROJECT_ID)).rejects.toThrow('[CompanyPersonService] fetchPersons:')
  })
})

// ── fetchPersonsByCompany ─────────────────────────────────────────

describe('fetchPersonsByCompany', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filtra por company_id en vez de project_id', async () => {
    const rows = [
      makePersonRow({ project_id: 'project-001', projects: { name: 'Proyecto Alpha' } }),
      makePersonRow({ id: 'person-002', project_id: 'project-002', projects: { name: 'Proyecto Beta' } }),
    ]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchPersonsByCompany(COMPANY_ID)

    expect(supabase.from).toHaveBeenCalledWith('company_persons')
    expect(mockChain.select).toHaveBeenCalledWith(PERSON_COLUMNS)
    expect(mockChain.eq).toHaveBeenCalledWith('company_id', COMPANY_ID)
    expect(result).toHaveLength(2)
    expect(result[0].project_name).toBe('Proyecto Alpha')
    expect(result[1].project_name).toBe('Proyecto Beta')
  })

  it('retorna array vacío si data es null (empresa sin personas)', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchPersonsByCompany(COMPANY_ID)
    expect(result).toEqual([])
  })

  it('mapea project_name a null si no hay embed de proyecto', async () => {
    const rows = [makePersonRow({ projects: null })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await fetchPersonsByCompany(COMPANY_ID)
    expect(result[0].project_name).toBeNull()
  })

  it('lanza error con prefijo [CompanyPersonService] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS policy denied' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(fetchPersonsByCompany(COMPANY_ID)).rejects.toThrow('RLS policy denied')
  })
})

// ── addPerson ─────────────────────────────────────────────────────

describe('addPerson', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserta con name/role/department recortados', async () => {
    const created = makePersonRow({ name: 'Marta López' })
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: created, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await addPerson({
      projectId:  PROJECT_ID,
      companyId:  COMPANY_ID,
      name:       '  Marta López  ',
      role:       '  CTO  ',
      department: '  IT  ',
      sourceTool: 'company_profile',
    })

    expect(mockChain.insert).toHaveBeenCalledWith({
      project_id:  PROJECT_ID,
      company_id:  COMPANY_ID,
      name:        'Marta López',
      role:        'CTO',
      department:  'IT',
      source_tool: 'company_profile',
    })
    expect(result.name).toBe('Marta López')
    expect(result.project_name).toBe('Proyecto Alpha')
  })

  it('lanza error con prefijo [CompanyPersonService] si Supabase devuelve error', async () => {
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS violation' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(addPerson({
      projectId: PROJECT_ID, name: 'X', sourceTool: 'company_profile',
    })).rejects.toThrow('[CompanyPersonService] addPerson:')
  })
})

// ── updatePerson ──────────────────────────────────────────────────

describe('updatePerson', () => {
  beforeEach(() => vi.clearAllMocks())

  it('actualiza name/role/department recortados y filtra por id', async () => {
    const updated = makePersonRow({ name: 'Ana García', role: 'CEO' })
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: updated, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await updatePerson('person-001', { name: ' Ana García ', role: ' CEO ', department: ' IT ' })

    expect(mockChain.update).toHaveBeenCalledWith({ name: 'Ana García', role: 'CEO', department: 'IT' })
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'person-001')
    expect(result.role).toBe('CEO')
  })

  it('lanza error con prefijo [CompanyPersonService] si Supabase falla', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(updatePerson('person-001', { name: 'X', role: '', department: '' }))
      .rejects.toThrow('[CompanyPersonService] updatePerson:')
  })
})

// ── mergePersons ──────────────────────────────────────────────────

describe('mergePersons', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama al RPC merge_company_persons con los params correctos', async () => {
    const summary = { t1_updated: 1, t2_updated: 0, t3_updated: 2, t9_updated: 0 }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: summary, error: null } as never)

    const result = await mergePersons('principal-id', 'replaced-id')

    expect(supabase.rpc).toHaveBeenCalledWith('merge_company_persons', {
      p_principal_id: 'principal-id',
      p_replaced_id:  'replaced-id',
    })
    expect(result).toEqual(summary)
  })

  it('lanza error con prefijo [CompanyPersonService] si el RPC falla', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'Las dos personas deben pertenecer a la misma empresa.' },
    } as never)

    await expect(mergePersons('principal-id', 'replaced-id'))
      .rejects.toThrow('[CompanyPersonService] mergePersons:')
  })
})
