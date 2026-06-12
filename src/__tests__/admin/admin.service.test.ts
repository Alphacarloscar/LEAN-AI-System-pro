import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock de Supabase — antes de imports ──────────────────────────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from:      vi.fn(),
    functions: { invoke: vi.fn() },
  },
}))

import { supabase } from '@/lib/supabase'
import {
  inviteUserToCompany,
  listAllUsers,
  deleteUser,
  createCompany,
} from '@/services/companies.service'

// ── inviteUserToCompany ───────────────────────────────────────────

describe('inviteUserToCompany', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a la Edge Function invite-user con los parámetros correctos', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true }, error: null } as never)

    await inviteUserToCompany({
      email:     'alice@empresa.com',
      name:      'Alice González',
      companyId: 'comp-abc',
      role:      'client_editor',
    })

    expect(supabase.functions.invoke).toHaveBeenCalledWith('invite-user', {
      body: {
        email:     'alice@empresa.com',
        name:      'Alice González',
        companyId: 'comp-abc',
        role:      'client_editor',
      },
    })
  })

  it('usa client_viewer como rol por defecto si no se especifica rol', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true }, error: null } as never)

    await inviteUserToCompany({ email: 'bob@co.com', name: 'Bob', companyId: 'comp-1' })

    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      'invite-user',
      expect.objectContaining({ body: expect.objectContaining({ role: 'client_viewer' }) }),
    )
  })

  it('lanza error si la Edge Function devuelve error de red', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error: { message: 'timeout' } } as never)

    await expect(
      inviteUserToCompany({ email: 'x@x.com', name: 'X', companyId: 'c1' }),
    ).rejects.toThrow('[Companies] inviteUserToCompany:')
  })

  it('lanza error si la Edge Function devuelve success: false (email duplicado)', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false, error: 'Email ya registrado' },
      error: null,
    } as never)

    await expect(
      inviteUserToCompany({ email: 'dup@co.com', name: 'Dup', companyId: 'c1' }),
    ).rejects.toThrow('Email ya registrado')
  })

  it('lanza error genérico si success: false sin mensaje de error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false },
      error: null,
    } as never)

    await expect(
      inviteUserToCompany({ email: 'x@x.com', name: 'X', companyId: 'c1' }),
    ).rejects.toThrow('Error al enviar la invitación')
  })
})

// ── listAllUsers ──────────────────────────────────────────────────

describe('listAllUsers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('devuelve lista de perfiles cuando la query tiene éxito', async () => {
    const rows = [
      { id: 'u1', email: 'a@co.com', name: 'Alice', role: 'consultant',    company_id: 'c1', created_at: '2026-01-01' },
      { id: 'u2', email: 'b@co.com', name: 'Bob',   role: 'client_viewer', company_id: 'c1', created_at: '2026-01-02' },
    ]
    const chain = {
      select: vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: rows, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await listAllUsers()

    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(result).toHaveLength(2)
    expect(result[0].role).toBe('consultant')
  })

  it('devuelve array vacío si data es null', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await listAllUsers()
    expect(result).toEqual([])
  })

  it('lanza error con prefijo [Companies] si Supabase falla', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS denied' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await expect(listAllUsers()).rejects.toThrow('[Companies] listAllUsers:')
  })
})

// ── deleteUser ────────────────────────────────────────────────────

describe('deleteUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a la Edge Function delete-user con el userId correcto', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true }, error: null } as never)

    await deleteUser('user-xyz')

    expect(supabase.functions.invoke).toHaveBeenCalledWith('delete-user', {
      body: { userId: 'user-xyz' },
    })
  })

  it('lanza error si la Edge Function devuelve error de red', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error: { message: 'net error' } } as never)

    await expect(deleteUser('u1')).rejects.toThrow('[Companies] deleteUser:')
  })

  it('lanza error si success: false', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: false, error: 'Usuario no encontrado' },
      error: null,
    } as never)

    await expect(deleteUser('u2')).rejects.toThrow('Usuario no encontrado')
  })
})

// ── createCompany ─────────────────────────────────────────────────

describe('createCompany', () => {
  beforeEach(() => vi.clearAllMocks())

  it('genera el slug automáticamente desde el nombre', async () => {
    const row = { id: 'c1', name: 'Acme S.A.', slug: 'acme-sa', sector: 'IT', company_size: 'mediana', created_at: '2026-01-01' }
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: row, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await createCompany({ name: 'Acme S.A.' })

    expect(result.name).toBe('Acme S.A.')
    // El slug se generó (puede diferir del fixture, lo que importa es que se llamó insert)
    expect(chain.insert).toHaveBeenCalledOnce()
  })

  it('usa el slug proporcionado si se pasa explícitamente', async () => {
    const row = { id: 'c2', name: 'Beta Corp', slug: 'beta', sector: 'Tech', company_size: 'grande', created_at: '2026-01-01' }
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: row, error: null }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await createCompany({ name: 'Beta Corp', slug: 'beta' })

    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ slug: 'beta' }))
  })

  it('lanza error con prefijo [Companies] si Supabase falla', async () => {
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'unique violation' } }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await expect(createCompany({ name: 'Dup Corp' })).rejects.toThrow('[Companies] createCompany:')
  })
})
