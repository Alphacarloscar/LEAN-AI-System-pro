import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrganizacionTab } from '@/modules/CompanyProfile/components/OrganizacionTab'
import { useDepartmentStore } from '@/modules/CompanyProfile/useDepartmentStore'

const mockUsePermissions = vi.fn()

vi.mock('@/modules/Auth', () => ({
  usePermissions: () => mockUsePermissions(),
}))

vi.mock('@shared/design-system/components', () => ({
  Spinner: () => <span data-testid="spinner" />,
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/modules/CompanyProfile/DepartmentManager', () => ({
  DepartmentManager: () => <div>Department manager</div>,
}))

vi.mock('@/shared/components/ImpactWarningDialog', () => ({
  ImpactWarningDialog: () => null,
}))

vi.mock('@/modules/CompanyProfile/components/EditPersonModal', () => ({
  EditPersonModal: ({ departments }: { departments: { name: string }[] }) => (
    <div role="dialog">
      Departments: {departments.length > 0 ? departments.map((department) => department.name).join(', ') : 'Sin departamentos'}
    </div>
  ),
}))

vi.mock('@/services/company-person.service', () => ({
  fetchPersonsByCompany: vi.fn(),
  getPersonImpact: vi.fn(),
  deletePerson: vi.fn(),
}))

import { fetchPersonsByCompany } from '@/services/company-person.service'

const person = {
  id: 'person-1',
  project_id: 'project-1',
  company_id: 'company-1',
  project_name: 'Project',
  name: 'Ana Perez',
  role: 'Product Owner',
  department: 'Ventas',
  source_tool: 'company_profile',
  created_at: '2026-01-01T00:00:00Z',
} as const

const departments = [
  {
    id: 'dept-sales',
    company_id: 'company-1',
    name: 'Ventas',
    color: '#C8860A',
    type: 'negocio_ops',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'dept-it',
    company_id: 'company-1',
    name: 'IT',
    color: '#C8860A',
    type: 'it',
    created_at: '2026-01-01T00:00:00Z',
  },
] as const

describe('OrganizacionTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePermissions.mockReturnValue({ canManageOrganization: true })
    vi.mocked(fetchPersonsByCompany).mockResolvedValue([person] as any)
    useDepartmentStore.setState({
      departments: departments as any,
      isLoading: false,
      error: null,
    })
  })

  it('passes real company departments to the person editor', async () => {
    const user = userEvent.setup()
    render(<OrganizacionTab companyId="company-1" />)

    await screen.findByText('Ana Perez')
    await user.click(screen.getByTitle('Editar'))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveTextContent('Departments: Ventas, IT')
    })
  })

  it('hides organization write actions when organization management is closed', async () => {
    mockUsePermissions.mockReturnValue({ canManageOrganization: false })

    render(<OrganizacionTab companyId="company-1" />)

    await screen.findByText('Ana Perez')
    expect(screen.getByText('Department manager')).toBeInTheDocument()
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Eliminar')).not.toBeInTheDocument()
  })

  it('shows a clear empty-departments state in the person editor', async () => {
    const user = userEvent.setup()
    useDepartmentStore.setState({
      departments: [],
      isLoading: false,
      error: null,
    })

    render(<OrganizacionTab companyId="company-1" />)

    await screen.findByText('Ana Perez')
    await user.click(screen.getByTitle('Editar'))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveTextContent('Departments: Sin departamentos')
    })
  })
})
