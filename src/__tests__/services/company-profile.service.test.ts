import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import {
  fetchCompanyProfile,
  upsertCompanyProfile,
  rowToCompanyProfile,
  rowToFriction,
} from '@/services/company-profile.service'
import type { CompanyProfileRow, FrictionRow } from '@/types/database.types'
import type { CompanyProfile, Friction } from '@/modules/CompanyProfile/types'

// ── Helpers ───────────────────────────────────────────────────

const ENG_ID = 'proj-abc-123'

function makeProfileRow(overrides: Partial<CompanyProfileRow> = {}): CompanyProfileRow {
  return {
    id:                    'cp-001',
    project_id:            ENG_ID,
    project_name:          'Proyecto Disney IA',
    sector:                'entretenimiento',
    tamano_empresa:        'grande',
    objetivo_principal_ia: 'Automatizar procesos de creación de contenido',
    horizonte_valor:       '12-18 meses',
    ecosistema_tecnologico: 'Azure + SAP',
    restricciones:         'Presupuesto limitado en Q1',
    areas_prioritarias:    ['Marketing', 'Producción'],
    saved_at:              '2026-01-15T10:00:00.000Z',
    created_at:            '2026-01-01T00:00:00.000Z',
    updated_at:            '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeFrictionRow(overrides: Partial<FrictionRow> = {}): FrictionRow {
  return {
    id:             'fr-001',
    project_id:     ENG_ID,
    tipo:           'proceso manual repetitivo',
    area_funcional: 'Finanzas',
    frecuencia:     'Baja',
    impacto:        'Alto',
    notas:          'Conciliación bancaria manual cada mañana',
    created_at:     '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeProfile(overrides: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    engagementName:          'Proyecto Disney IA',
    sector:                  'entretenimiento',
    tamanoEmpresa:           'grande',
    objetivoPrincipalIA:     'Automatizar procesos',
    horizonteEsperadoValor:  '12-18 meses',
    ecosistemaTecnologico:   'Azure + SAP',
    restriccionesRelevantes: 'Presupuesto limitado',
    areasPrioritarias:       ['Marketing'],
    fricciones:              [],
    savedAt:                 '2026-01-15T10:00:00.000Z',
    ...overrides,
  }
}

// ── rowToCompanyProfile ───────────────────────────────────────

describe('rowToCompanyProfile', () => {
  it('mapea todos los campos de BD a dominio correctamente', () => {
    const row    = makeProfileRow()
    const result = rowToCompanyProfile(row)

    expect(result.engagementName).toBe('Proyecto Disney IA')
    expect(result.sector).toBe('entretenimiento')
    expect(result.tamanoEmpresa).toBe('grande')
    expect(result.objetivoPrincipalIA).toBe('Automatizar procesos de creación de contenido')
    expect(result.horizonteEsperadoValor).toBe('12-18 meses')
    expect(result.ecosistemaTecnologico).toBe('Azure + SAP')
    expect(result.restriccionesRelevantes).toBe('Presupuesto limitado en Q1')
    expect(result.areasPrioritarias).toEqual(['Marketing', 'Producción'])
    expect(result.savedAt).toBe('2026-01-15T10:00:00.000Z')
  })

  it('devuelve fricciones como array vacío (se cargan por separado)', () => {
    const result = rowToCompanyProfile(makeProfileRow())
    expect(result.fricciones).toEqual([])
  })

  it('maneja campos nullables con string vacío por defecto', () => {
    const row    = makeProfileRow({ sector: '', tamano_empresa: '' })
    const result = rowToCompanyProfile(row)

    expect(result.sector).toBe('')
    expect(result.tamanoEmpresa).toBe('')
  })
})

// ── rowToFriction ─────────────────────────────────────────────

describe('rowToFriction', () => {
  it('mapea todos los campos correctamente', () => {
    const row    = makeFrictionRow()
    const result = rowToFriction(row)

    expect(result.id).toBe('fr-001')
    expect(result.tipo).toBe('proceso manual repetitivo')
    expect(result.areaFuncional).toBe('Finanzas')
    expect(result.frecuencia).toBe('Baja')
    expect(result.impacto).toBe('Alto')
    expect(result.notas).toBe('Conciliación bancaria manual cada mañana')
  })
})

// ── fetchCompanyProfile ───────────────────────────────────────

describe('fetchCompanyProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna profile + frictions cuando existen datos', async () => {
    const profileRow  = makeProfileRow()
    const frictionRow = makeFrictionRow()

    const mockFromChain = (table: string) => {
      if (table === 'company_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: profileRow, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        order:  vi.fn().mockResolvedValue({ data: [frictionRow], error: null }),
      }
    }
    vi.mocked(supabase.from).mockImplementation(mockFromChain as never)

    const result = await fetchCompanyProfile(ENG_ID)

    expect(result).not.toBeNull()
    expect(result!.profile.engagementName).toBe('Proyecto Disney IA')
    expect(result!.frictions).toHaveLength(1)
    expect(result!.frictions[0].tipo).toBe('proceso manual repetitivo')
  })

  it('retorna null si el engagement no tiene perfil aún', async () => {
    const mockFromChain = (table: string) => {
      if (table === 'company_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        order:  vi.fn().mockResolvedValue({ data: [], error: null }),
      }
    }
    vi.mocked(supabase.from).mockImplementation(mockFromChain as never)

    const result = await fetchCompanyProfile('nuevo-engagement')
    expect(result).toBeNull()
  })

  it('lanza error con prefijo [CompanyProfile] si falla company_profiles', async () => {
    const mockFromChain = (table: string) => {
      if (table === 'company_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'timeout' } }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        order:  vi.fn().mockResolvedValue({ data: [], error: null }),
      }
    }
    vi.mocked(supabase.from).mockImplementation(mockFromChain as never)

    await expect(fetchCompanyProfile(ENG_ID)).rejects.toThrow('[CompanyProfile] fetchCompanyProfile:')
  })

  it('lanza error con prefijo [CompanyProfile] si falla frictions', async () => {
    const mockFromChain = (table: string) => {
      if (table === 'company_profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq:     vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: makeProfileRow(), error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq:     vi.fn().mockReturnThis(),
        order:  vi.fn().mockResolvedValue({ data: null, error: { message: 'RLS' } }),
      }
    }
    vi.mocked(supabase.from).mockImplementation(mockFromChain as never)

    await expect(fetchCompanyProfile(ENG_ID)).rejects.toThrow('[CompanyProfile] fetchFrictions:')
  })
})

// ── upsertCompanyProfile ──────────────────────────────────────

describe('upsertCompanyProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hace upsert del perfil y sincroniza frictions (sin fricciones)', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const deleteMock = vi.fn().mockReturnThis()
    const eqMock     = vi.fn().mockResolvedValue({ error: null })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'company_profiles') return { upsert: upsertMock } as never
      return { delete: deleteMock, eq: eqMock } as never
    })

    const profile = makeProfile({ fricciones: [] })
    await upsertCompanyProfile(profile, ENG_ID)

    expect(upsertMock).toHaveBeenCalledOnce()
    expect(deleteMock).toHaveBeenCalledOnce()
  })

  it('re-inserta las fricciones después de borrarlas', async () => {
    const upsertProfileMock   = vi.fn().mockResolvedValue({ error: null })
    const deleteFromDbMock    = vi.fn().mockReturnThis()
    const eqDeleteMock        = vi.fn().mockResolvedValue({ error: null })
    const insertFrictionsMock = vi.fn().mockResolvedValue({ error: null })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'company_profiles') return { upsert: upsertProfileMock } as never
      if (table === 'frictions') {
        return {
          delete: deleteFromDbMock,
          eq:     eqDeleteMock,
          insert: insertFrictionsMock,
        } as never
      }
      return {} as never
    })

    const friction: Friction = {
      id: 'fr-1', tipo: 'proceso manual', areaFuncional: 'RRHH',
      frecuencia: 'Media', impacto: 'Medio', notas: '',
    }
    const profile = makeProfile({ fricciones: [friction] })
    await upsertCompanyProfile(profile, ENG_ID)

    expect(upsertProfileMock).toHaveBeenCalledOnce()
  })

  it('lanza error con prefijo [CompanyProfile] si falla el upsert del perfil', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'company_profiles') {
        return { upsert: vi.fn().mockResolvedValue({ error: { message: 'constraint violation' } }) } as never
      }
      return {} as never
    })

    await expect(upsertCompanyProfile(makeProfile(), ENG_ID)).rejects.toThrow(
      '[CompanyProfile] upsertCompanyProfile:',
    )
  })
})
