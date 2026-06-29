import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from:      vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  },
}))

import { supabase } from '@/lib/supabase'
import {
  listCompanies,
  createCompany,
  inviteUserToCompany,
  listCompanyUsers,
  listAllUsers,
  deleteUser,
  listCompanyProjects,
  updateCompanySettings,
} from '@/services/companies.service'
import type { CompanyRow } from '@/types/database.types'

// ── Helpers ───────────────────────────────────────────────────

function makeCompany(overrides: Partial<CompanyRow> = {}): CompanyRow {
  return {
    id:           'comp-001',
    name:         'Acme Corp',
    slug:         'acme-corp',
    sector:       'tecnologia',
    company_size: 'mediana',
    created_at:   '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ── listCompanies ─────────────────────────────────────────────

describe('listCompanies', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna empresas ordenadas por nombre', async () => {
    const companies = [makeCompany(), makeCompany({ id: 'comp-002', name: 'Zara Digital' })]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: companies, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await listCompanies()

    expect(supabase.from).toHaveBeenCalledWith('companies')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Acme Corp')
  })

  it('retorna array vacío si no hay empresas', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await listCompanies()
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [Companies] si Supabase falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(listCompanies()).rejects.toThrow('[Companies] listCompanies:')
  })
})

// ── createCompany ─────────────────────────────────────────────

describe('createCompany', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserta con el nombre y slug generado automáticamente', async () => {
    const company = makeCompany({ name: 'Mi Empresa Test', slug: 'mi-empresa-test' })
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: company, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await createCompany({ name: 'Mi Empresa Test' })

    expect(supabase.from).toHaveBeenCalledWith('companies')
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mi Empresa Test', slug: 'mi-empresa-test' }),
    )
    expect(result.id).toBe('comp-001')
  })

  it('usa el slug proporcionado si se pasa explícitamente', async () => {
    const company = makeCompany({ slug: 'mi-slug-custom' })
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: company, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await createCompany({ name: 'Empresa', slug: 'mi-slug-custom' })

    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'mi-slug-custom' }),
    )
  })

  it('genera slug eliminando caracteres especiales', async () => {
    const company = makeCompany({ slug: 'empresa-sa' })
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: company, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await createCompany({ name: 'Empresa, S.A.' })

    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'empresa-sa' }),
    )
  })

  it('lanza error con prefijo [Companies] si insert falla', async () => {
    const mockChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'unique violation' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(createCompany({ name: 'Empresa' })).rejects.toThrow('[Companies] createCompany:')
  })
})

// ── inviteUserToCompany ───────────────────────────────────────

describe('inviteUserToCompany', () => {
  beforeEach(() => vi.clearAllMocks())

  it('invoca la Edge Function invite-user con los parámetros correctos', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true }, error: null,
    } as never)

    await inviteUserToCompany({
      email:     'usuario@empresa.com',
      name:      'Ana García',
      companyId: 'comp-001',
      role:      'client_editor',
    })

    expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
      body: {
        email:     'usuario@empresa.com',
        name:      'Ana García',
        companyId: 'comp-001',
        role:      'client_editor',
      },
    })
  })

  it('usa role "client_viewer" por defecto si no se especifica', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true }, error: null,
    } as never)

    await inviteUserToCompany({ email: 'x@y.com', name: 'X', companyId: 'comp-001' })

    expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user',
      expect.objectContaining({ body: expect.objectContaining({ role: 'client_viewer' }) }),
    )
  })

  it('lanza error si la Edge Function devuelve error de red', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null, error: { message: 'function timeout' },
    } as never)

    await expect(
      inviteUserToCompany({ email: 'x@y.com', name: 'X', companyId: 'comp-001' }),
    ).rejects.toThrow('[Companies] inviteUserToCompany:')
  })

  it('lanza error si la Edge Function devuelve { success: false }', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false, error: 'Email ya registrado' }, error: null,
    } as never)

    await expect(
      inviteUserToCompany({ email: 'x@y.com', name: 'X', companyId: 'comp-001' }),
    ).rejects.toThrow('Email ya registrado')
  })
})

// ── listCompanyUsers ──────────────────────────────────────────

describe('listCompanyUsers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filtra por company_id y ordena por nombre', async () => {
    const users = [
      { id: 'u1', email: 'ana@test.com', name: 'Ana', role: 'client_editor', created_at: '2026-01-01' },
      { id: 'u2', email: 'bob@test.com', name: 'Bob', role: 'client_viewer', created_at: '2026-01-02' },
    ]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: users, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await listCompanyUsers('comp-001')

    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(mockChain.eq).toHaveBeenCalledWith('company_id', 'comp-001')
    expect(result).toHaveLength(2)
  })

  it('retorna array vacío si la empresa no tiene usuarios', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await listCompanyUsers('comp-sin-usuarios')
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [Companies] si falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'permission denied' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(listCompanyUsers('comp-001')).rejects.toThrow('[Companies] listCompanyUsers:')
  })
})

// ── listAllUsers ──────────────────────────────────────────────

describe('listAllUsers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna todos los usuarios ordenados por fecha de creación desc', async () => {
    const users = [
      { id: 'u1', email: 'super@test.com', name: 'Super', role: 'superadmin', company_id: null, created_at: '2026-02-01' },
      { id: 'u2', email: 'cons@test.com',  name: 'Cons',  role: 'consultant', company_id: 'comp-001', created_at: '2026-01-01' },
    ]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: users, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await listAllUsers()

    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(result).toHaveLength(2)
    expect(result[0].role).toBe('superadmin')
  })

  it('lanza error con prefijo [Companies] si falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'not authorized' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(listAllUsers()).rejects.toThrow('[Companies] listAllUsers:')
  })
})

// ── deleteUser ────────────────────────────────────────────────

describe('deleteUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('invoca la Edge Function delete-user con el userId correcto', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true }, error: null,
    } as never)

    await deleteUser('user-uuid-123')

    expect(supabase.functions.invoke).toHaveBeenCalledWith('delete-user', {
      body: { userId: 'user-uuid-123' },
    })
  })

  it('lanza error si la Edge Function devuelve error de red', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null, error: { message: 'network error' },
    } as never)

    await expect(deleteUser('user-uuid-123')).rejects.toThrow('[Companies] deleteUser:')
  })

  it('lanza error si la Edge Function devuelve { success: false }', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false, error: 'Usuario no encontrado' }, error: null,
    } as never)

    await expect(deleteUser('user-uuid-123')).rejects.toThrow('Usuario no encontrado')
  })
})

// ── listCompanyProjects ───────────────────────────────────────

describe('listCompanyProjects', () => {
  beforeEach(() => vi.clearAllMocks())

  it('filtra por company_id y status active', async () => {
    const projects = [
      { id: 'proj-1', name: 'Toy Story', company_id: 'comp-001', status: 'active' },
      { id: 'proj-2', name: 'Blancanieves', company_id: 'comp-001', status: 'active' },
    ]
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: projects, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await listCompanyProjects('comp-001')

    expect(supabase.from).toHaveBeenCalledWith('projects')
    expect(mockChain.eq).toHaveBeenCalledWith('company_id', 'comp-001')
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'active')
    expect(result).toHaveLength(2)
  })

  it('retorna array vacío si la empresa no tiene proyectos activos', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    const result = await listCompanyProjects('comp-sin-proyectos')
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [Companies] si falla', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'table not found' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(listCompanyProjects('comp-001')).rejects.toThrow('[Companies] listCompanyProjects:')
  })
})

// ── updateCompanySettings ─────────────────────────────────────────

describe('updateCompanySettings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a update con sector y company_size filtrado por company_id', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await updateCompanySettings('company-abc', { sector: 'technology', company_size: '201-500' })

    expect(supabase.from).toHaveBeenCalledWith('companies')
    expect(mockChain.update).toHaveBeenCalledWith({
      sector:       'technology',
      company_size: '201-500',
    })
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'company-abc')
  })

  it('no lanza si error es null (happy path)', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(
      updateCompanySettings('company-abc', { sector: 'finance', company_size: '51-200' }),
    ).resolves.toBeUndefined()
  })

  it('lanza error con prefijo [Companies] si Supabase falla', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockResolvedValue({ error: { message: 'RLS policy violated' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(mockChain as never)

    await expect(
      updateCompanySettings('company-abc', { sector: 'retail', company_size: '1-10' }),
    ).rejects.toThrow('[Companies] updateCompanySettings:')
  })
})
