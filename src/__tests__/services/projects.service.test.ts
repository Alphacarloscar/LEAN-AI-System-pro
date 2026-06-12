import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc:  vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import {
  listMyProjects,
  createProject,
  archiveProject,
  addProjectMember,
  getProjectCompanyId,
  getProjectWithCompany,
} from '@/services/projects.service'
import type { ProjectRow } from '@/types/database.types'

// ── Helper ────────────────────────────────────────────────────────

function makeProject(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id:            'proj-001',
    name:          'Nexus Digital S.A.',
    owner_id:      'user-abc',
    company_id:    'company-001',
    status:        'active',
    current_phase: 'listen',
    start_date:    '2026-01-01',
    end_date:      null,
    created_at:    '2026-01-01T09:00:00.000Z',
    updated_at:    '2026-01-01T09:00:00.000Z',
    ...overrides,
  }
}

// ── listMyProjects ────────────────────────────────────────────────

describe('listMyProjects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna proyectos activos del usuario', async () => {
    const projects = [makeProject(), makeProject({ id: 'proj-002', name: 'Acme Corp' })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: projects, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await listMyProjects()

    expect(supabase.from).toHaveBeenCalledWith('projects')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Nexus Digital S.A.')
  })

  it('retorna array vacío si no hay proyectos', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await listMyProjects()
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [Projects] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(listMyProjects()).rejects.toThrow('[Projects] listMyProjects:')
  })
})

// ── createProject ─────────────────────────────────────────────────

describe('createProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a rpc("create_project") con los parámetros correctos', async () => {
    const project = makeProject()
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [project], error: null } as never)

    await createProject({ name: 'Nexus Digital S.A.', companyId: 'company-001' })

    expect(supabase.rpc).toHaveBeenCalledWith('create_project', {
      p_name:       'Nexus Digital S.A.',
      p_company_id: 'company-001',
      p_phase:      'listen',
    })
  })

  it('usa fase "listen" por defecto', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [makeProject()], error: null } as never)

    await createProject({ name: 'Test' })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'create_project',
      expect.objectContaining({ p_phase: 'listen' }),
    )
  })

  it('usa companyId null si no se provee', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [makeProject()], error: null } as never)

    await createProject({ name: 'Test' })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'create_project',
      expect.objectContaining({ p_company_id: null }),
    )
  })

  it('retorna el primer elemento del array de data', async () => {
    const project = makeProject({ id: 'proj-nuevo' })
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [project], error: null } as never)

    const result = await createProject({ name: 'Test' })
    expect(result.id).toBe('proj-nuevo')
  })

  it('lanza error si rpc falla', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'function not found' },
    } as never)

    await expect(createProject({ name: 'Test' })).rejects.toThrow('[Projects] createProject RPC error:')
  })

  it('lanza error si data es array vacío', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as never)

    await expect(createProject({ name: 'Test' })).rejects.toThrow('[Projects] createProject:')
  })
})

// ── archiveProject ────────────────────────────────────────────────

describe('archiveProject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hace update con status "archived"', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await archiveProject('proj-001')

    expect(mockChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'archived' }),
    )
  })

  it('lanza error si update falla', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: { message: 'permission denied' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(archiveProject('proj-001')).rejects.toThrow('[Projects] archiveProject:')
  })
})

// ── addProjectMember ──────────────────────────────────────────────

describe('addProjectMember', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hace upsert en project_members', async () => {
    const mockChain = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await addProjectMember('proj-001', 'user-002', 'viewer')

    expect(supabase.from).toHaveBeenCalledWith('project_members')
    expect(mockChain.upsert).toHaveBeenCalledWith({
      project_id: 'proj-001',
      user_id:    'user-002',
      role:       'viewer',
    })
  })
})

// ── getProjectCompanyId ───────────────────────────────────────────

describe('getProjectCompanyId', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna company_id cuando el proyecto tiene empresa asociada', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { company_id: 'company-abc' }, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await getProjectCompanyId('proj-001')

    expect(supabase.from).toHaveBeenCalledWith('projects')
    expect(mockChain.select).toHaveBeenCalledWith('company_id')
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'proj-001')
    expect(result).toBe('company-abc')
  })

  it('retorna null si el proyecto no tiene empresa asignada (company_id null)', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { company_id: null }, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await getProjectCompanyId('proj-sin-empresa')
    expect(result).toBeNull()
  })

  it('retorna null si maybeSingle no encuentra el proyecto', async () => {
    const mockChain = {
      select:      vi.fn().mockReturnThis(),
      eq:          vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await getProjectCompanyId('proj-inexistente')
    expect(result).toBeNull()
  })
})

// ── getProjectWithCompany ─────────────────────────────────────────

describe('getProjectWithCompany', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna datos de empresa mapeados correctamente', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          company_id: 'company-abc',
          companies:  { name: 'Acme Corp', sector: 'technology', company_size: '201-500' },
        },
        error: null,
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await getProjectWithCompany('proj-001')

    expect(supabase.from).toHaveBeenCalledWith('projects')
    expect(mockChain.select).toHaveBeenCalledWith('company_id, companies(name, sector, company_size)')
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'proj-001')
    expect(result.company_id).toBe('company-abc')
    expect(result.company_name).toBe('Acme Corp')
    expect(result.sector).toBe('technology')
    expect(result.company_size).toBe('201-500')
  })

  it('devuelve strings vacíos si companies es null (proyecto sin empresa)', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { company_id: null, companies: null },
        error: null,
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await getProjectWithCompany('proj-sin-empresa')

    expect(result.company_id).toBeNull()
    expect(result.company_name).toBe('')
    expect(result.sector).toBe('')
    expect(result.company_size).toBe('')
  })

  it('lanza error con prefijo [Projects] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'JWT expired' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(getProjectWithCompany('proj-001')).rejects.toThrow('[Projects] getProjectWithCompany:')
  })
})
