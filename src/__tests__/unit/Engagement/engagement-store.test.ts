import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEngagementStore }                    from '@/modules/Engagement/store'
import type { ProjectRow }                       from '@/types/database.types'

// ── Mocks ─────────────────────────────────────────────────────

vi.mock('@/services/projects.service', () => ({
  listMyProjects: vi.fn(),
  createProject:  vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { company_id: 'company-1' } }),
    }),
  },
}))

vi.mock('@/lib/resetEngagementStores', () => ({
  resetAllEngagementStores: vi.fn(),
}))

import { listMyProjects, createProject } from '@/services/projects.service'
import { resetAllEngagementStores }      from '@/lib/resetEngagementStores'

// ── Helpers ───────────────────────────────────────────────────

function makeProject(id: string, name: string = 'Test Project'): ProjectRow {
  return { id, name, company_id: 'company-1', created_at: '2024-01-01T00:00:00Z' } as ProjectRow
}

// ── Tests ─────────────────────────────────────────────────────

describe('useEngagementStore — reset', () => {
  beforeEach(() => {
    useEngagementStore.setState({
      projects:           [makeProject('p-1')],
      activeEngagementId: 'p-1',
      isLoading:          false,
    })
  })

  it('reset limpia todos los campos', () => {
    useEngagementStore.getState().reset()
    const state = useEngagementStore.getState()
    expect(state.projects).toHaveLength(0)
    expect(state.activeEngagementId).toBeNull()
    expect(state.isLoading).toBe(false)
  })
})

describe('useEngagementStore — selectEngagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEngagementStore.setState({
      projects:           [makeProject('p-1'), makeProject('p-2')],
      activeEngagementId: 'p-1',
      isLoading:          false,
    })
  })

  it('cambia activeEngagementId al seleccionar uno diferente', () => {
    useEngagementStore.getState().selectEngagement('p-2')
    expect(useEngagementStore.getState().activeEngagementId).toBe('p-2')
  })

  it('llama a resetAllEngagementStores al cambiar proyecto', () => {
    useEngagementStore.getState().selectEngagement('p-2')
    expect(resetAllEngagementStores).toHaveBeenCalledOnce()
  })

  it('NO llama a resetAllEngagementStores si es el mismo proyecto (noop)', () => {
    useEngagementStore.getState().selectEngagement('p-1') // mismo que el activo
    expect(resetAllEngagementStores).not.toHaveBeenCalled()
  })

  it('acepta null para deseleccionar el engagement activo', () => {
    useEngagementStore.getState().selectEngagement(null)
    expect(useEngagementStore.getState().activeEngagementId).toBeNull()
    expect(resetAllEngagementStores).toHaveBeenCalledOnce()
  })
})

describe('useEngagementStore — loadMyProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEngagementStore.setState({ projects: [], activeEngagementId: null, isLoading: false })
  })

  it('carga proyectos y los guarda en el store', async () => {
    const projects = [makeProject('p-1'), makeProject('p-2')]
    vi.mocked(listMyProjects).mockResolvedValue(projects)

    await useEngagementStore.getState().loadMyProjects()

    expect(useEngagementStore.getState().projects).toHaveLength(2)
    expect(useEngagementStore.getState().isLoading).toBe(false)
  })

  it('auto-selecciona si hay exactamente un proyecto', async () => {
    vi.mocked(listMyProjects).mockResolvedValue([makeProject('p-solo')])

    await useEngagementStore.getState().loadMyProjects()

    expect(useEngagementStore.getState().activeEngagementId).toBe('p-solo')
  })

  it('NO reemplaza el engagement activo si sigue existiendo en la lista', async () => {
    useEngagementStore.setState({ activeEngagementId: 'p-existing' })
    vi.mocked(listMyProjects).mockResolvedValue([makeProject('p-existing'), makeProject('p-solo')])

    await useEngagementStore.getState().loadMyProjects()

    // El activo sigue en la lista → no se reemplaza
    expect(useEngagementStore.getState().activeEngagementId).toBe('p-existing')
  })

  it('reemplaza el engagement activo si ya no existe en la lista nueva', async () => {
    useEngagementStore.setState({ activeEngagementId: 'p-old' })
    vi.mocked(listMyProjects).mockResolvedValue([makeProject('p-new')])

    await useEngagementStore.getState().loadMyProjects()

    // p-old ya no existe → auto-selecciona el primero disponible
    expect(useEngagementStore.getState().activeEngagementId).toBe('p-new')
  })

  it('pone isLoading a false aunque falle la petición', async () => {
    vi.mocked(listMyProjects).mockRejectedValue(new Error('Network error'))

    await useEngagementStore.getState().loadMyProjects()

    expect(useEngagementStore.getState().isLoading).toBe(false)
  })
})

describe('useEngagementStore — createAndSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEngagementStore.setState({ projects: [], activeEngagementId: null, isLoading: false })
  })

  it('crea un proyecto y lo selecciona como activo', async () => {
    const newProject = makeProject('p-new', 'Nuevo Engagement')
    vi.mocked(createProject).mockResolvedValue(newProject)

    const result = await useEngagementStore.getState().createAndSelect('Nuevo Engagement', 'company-1')

    expect(result.id).toBe('p-new')
    expect(useEngagementStore.getState().activeEngagementId).toBe('p-new')
    expect(useEngagementStore.getState().projects).toHaveLength(1)
  })

  it('pone isLoading a false si falla la creación', async () => {
    vi.mocked(createProject).mockRejectedValue(new Error('Create failed'))

    await expect(
      useEngagementStore.getState().createAndSelect('Bad Project', 'company-1')
    ).rejects.toThrow('Create failed')

    expect(useEngagementStore.getState().isLoading).toBe(false)
  })
})
