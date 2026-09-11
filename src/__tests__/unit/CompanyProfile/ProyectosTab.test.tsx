import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProyectosTab } from '@/modules/CompanyProfile/components/ProyectosTab'

const mockUsePermissions = vi.fn()

vi.mock('@/modules/Auth', () => ({
  usePermissions: () => mockUsePermissions(),
}))

vi.mock('@/modules/CompanyProfile/useDepartmentStore', () => ({
  useDepartmentStore: () => ({ departments: [] }),
}))

vi.mock('@/modules/Engagement/store', () => ({
  useEngagementStore: vi.fn(),
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
  Modal: ({ children, open, title }: { children: React.ReactNode; open: boolean; title: string }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
  FormField: ({
    id,
    label,
    value,
    onChange,
  }: {
    id: string
    label: string
    value: string
    onChange: React.ChangeEventHandler<HTMLInputElement>
  }) => (
    <label htmlFor={id}>
      {label}
      <input id={id} value={value} onChange={onChange} />
    </label>
  ),
}))

vi.mock('@/shared/components/ImpactWarningDialog', () => ({
  ImpactWarningDialog: () => null,
}))

vi.mock('@/modules/CompanyProfile/ProjectDetailView', () => ({
  ProjectDetailView: () => <div>Project detail</div>,
}))

vi.mock('@/services/projects.service', () => ({
  listProjectsByCompany: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn(),
}))

import { useEngagementStore } from '@/modules/Engagement/store'
import { createProject, listProjectsByCompany } from '@/services/projects.service'

const permissions = {
  canCreateProjects: false,
  canEditProjects: false,
  canDeleteProjects: false,
}

describe('ProyectosTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listProjectsByCompany).mockResolvedValue([{ id: 'project-1', name: 'Proyecto Alpha' }])
    vi.mocked(createProject).mockResolvedValue({ id: 'project-new', name: 'Proyecto Nuevo' } as any)
    vi.mocked(useEngagementStore).mockImplementation((selector) => {
      const state = {
        activeProjectId: 'active-project',
        activeEngagementId: 'active-project',
        projects: [
          {
            id: 'active-project',
            domain_id: 'domain-transformacion',
            governance_domains: {
              slug: 'transformacion_digital',
              label: 'Transformacion Digital',
            },
          },
        ],
      }
      return selector(state as any)
    })
  })

  it('hides project write actions when the role has read-only project permissions', async () => {
    mockUsePermissions.mockReturnValue(permissions)

    render(<ProyectosTab companyId="company-1" />)

    await screen.findByText('Proyecto Alpha')
    expect(screen.queryByRole('button', { name: /crear proyecto/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument()
  })

  it('allows client editors to create and edit projects without deleting them', async () => {
    mockUsePermissions.mockReturnValue({
      ...permissions,
      canCreateProjects: true,
      canEditProjects: true,
    })

    render(<ProyectosTab companyId="company-1" />)

    await screen.findByText('Proyecto Alpha')
    expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument()
  })

  it('allows administrators to create, edit and delete projects', async () => {
    mockUsePermissions.mockReturnValue({
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: true,
    })

    render(<ProyectosTab companyId="company-1" />)

    await waitFor(() => expect(screen.getByText('Proyecto Alpha')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument()
  })

  it('creates projects with the active project domain and domain-specific options', async () => {
    const user = userEvent.setup()
    mockUsePermissions.mockReturnValue({
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: false,
    })

    render(<ProyectosTab companyId="company-1" />)

    await screen.findByText('Proyecto Alpha')
    await user.click(screen.getByRole('button', { name: /crear proyecto/i }))

    expect(screen.getByRole('option', { name: 'Salesforce' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'OpenAI / ChatGPT Enterprise' })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/nombre del proyecto/i), 'Proyecto TD')
    await user.click(screen.getByRole('button', { name: /^crear$/i }))

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Proyecto TD',
        companyId: 'company-1',
        domainId: 'domain-transformacion',
      }))
    })
  })
})
