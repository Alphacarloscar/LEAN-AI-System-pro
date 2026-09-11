import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectDetailView } from '@/modules/CompanyProfile/ProjectDetailView'

const mockUsePermissions = vi.fn()
const mockLoadMyProjects = vi.fn()

vi.mock('@/modules/Auth', () => ({
  usePermissions: () => mockUsePermissions(),
}))

vi.mock('@/modules/CompanyProfile/useDepartmentStore', () => ({
  useDepartmentStore: () => ({
    departments: [{ id: 'dept-1', name: 'Ventas' }],
  }),
}))

vi.mock('@/modules/Engagement/store', () => ({
  useEngagementStore: {
    getState: () => ({ loadMyProjects: mockLoadMyProjects }),
  },
}))

vi.mock('@shared/design-system/components', () => ({
  Spinner: () => <span data-testid="spinner" />,
  Button: ({
    children,
    disabled,
    loading,
    onClick,
  }: {
    children: React.ReactNode
    disabled?: boolean
    loading?: boolean
    onClick?: () => void
  }) => (
    <button type="button" disabled={disabled || loading} onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock('@/services/projects.service', () => ({
  getProjectById: vi.fn(),
  updateProject: vi.fn(),
}))

import { getProjectById } from '@/services/projects.service'

const project = {
  id: 'project-1',
  company_id: 'company-1',
  name: 'Proyecto Alpha',
  objetivo_principal: 'Reducir carga manual',
  restricciones: 'Sin integraciones legacy',
  horizonte_valor: '3 meses',
  ecosistema_tecnologico: 'Microsoft 365 / Azure',
  fricciones_oportunidades: [
    {
      id: 'friction-1',
      tipo: 'Proceso manual',
      areaFuncional: 'Ventas',
      frecuencia: 'Alta',
      impacto: 'Alto',
      notas: 'Reentrada de datos',
    },
  ],
  areas_prioritarias: ['Ventas'],
}

describe('ProjectDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProjectById).mockResolvedValue(project as any)
    mockLoadMyProjects.mockResolvedValue(undefined)
  })

  it('renders all project controls read-only when project editing is not allowed', async () => {
    mockUsePermissions.mockReturnValue({ canEditProjects: false })

    render(<ProjectDetailView projectId="project-1" companyId="company-1" onClose={vi.fn()} />)

    await screen.findByDisplayValue('Proyecto Alpha')
    expect(screen.getByDisplayValue('Proyecto Alpha')).toBeDisabled()
    expect(screen.getByDisplayValue('Reducir carga manual')).toBeDisabled()
    expect(screen.queryByRole('button', { name: /guardar cambios/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /eliminar fricci/i })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ventas' })).toBeDisabled()
    })
  })

  it('renders project editing actions when project editing is allowed', async () => {
    mockUsePermissions.mockReturnValue({ canEditProjects: true })

    render(<ProjectDetailView projectId="project-1" companyId="company-1" onClose={vi.fn()} />)

    await screen.findByDisplayValue('Proyecto Alpha')
    expect(screen.getByDisplayValue('Proyecto Alpha')).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /eliminar fricci/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ventas' })).not.toBeDisabled()
  })
})
