import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectDetailAdminView } from '@/modules/Admin/components/ProjectDetailAdminView'
import type { CompanyRow, ProjectRow } from '@/types/database.types'

vi.mock('@/services/projects.service', () => ({
  getProjectById: vi.fn(),
  updateProjectStatus: vi.fn(),
  updateProjectInfo: vi.fn(),
  removeProjectMember: vi.fn(),
  updateProjectMemberRole: vi.fn(),
  getProjectMembers: vi.fn(),
  deleteProject: vi.fn(),
  addProjectMember: vi.fn(),
}))

vi.mock('@/services/companies.service', () => ({
  getCompanyById: vi.fn(),
  listCompanyUsers: vi.fn(),
}))

vi.mock('@/services/company-profile.service', () => ({
  fetchCompanyProfile: vi.fn(),
  upsertCompanyProfile: vi.fn(),
}))

vi.mock('@/services/department.service', () => ({
  fetchDepartments: vi.fn(),
}))

vi.mock('@/services/company-person.service', () => ({
  fetchPersonsByCompany: vi.fn(),
}))

vi.mock('@shared/design-system/components', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    Spinner: () => <span data-testid="spinner" />,
  }
})

import {
  addProjectMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  removeProjectMember,
  updateProjectInfo,
  updateProjectMemberRole,
  updateProjectStatus,
} from '@/services/projects.service'
import { getCompanyById, listCompanyUsers } from '@/services/companies.service'
import { fetchCompanyProfile } from '@/services/company-profile.service'
import { fetchDepartments } from '@/services/department.service'
import { fetchPersonsByCompany } from '@/services/company-person.service'

const disneyCompany = {
  company_size: '',
  contracted_packages: [],
  created_at: '2026-01-01T00:00:00Z',
  id: 'company-disney',
  is_active: true,
  name: 'DISNEY',
  sector: '',
  slug: 'disney',
  updated_at: '2026-01-01T00:00:00Z',
} satisfies CompanyRow

const toyStoryProject = {
  company_id: 'company-disney',
  contracted_packages: [],
  created_at: '2026-01-01T00:00:00Z',
  current_phase: 'listen',
  domain_id: 'domain-lean-ai',
  end_date: null,
  id: 'project-toy-story',
  name: 'Toy Story',
  owner_id: 'user-superadmin',
  start_date: null,
  status: 'active',
  updated_at: '2026-01-01T00:00:00Z',
} satisfies ProjectRow

function renderView(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/admin/companies/:companyId/projects/:projectId"
          element={<ProjectDetailAdminView />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

function mockBaseLoad(project = toyStoryProject) {
  vi.mocked(getCompanyById).mockResolvedValue(disneyCompany)
  vi.mocked(getProjectById).mockResolvedValue(project)
  vi.mocked(getProjectMembers).mockResolvedValue([])
  vi.mocked(listCompanyUsers).mockResolvedValue([])
  vi.mocked(fetchCompanyProfile).mockResolvedValue(null)
  vi.mocked(fetchPersonsByCompany).mockResolvedValue([])
  vi.mocked(fetchDepartments).mockResolvedValue([])
}

describe('ProjectDetailAdminView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the real company name in the breadcrumb', async () => {
    mockBaseLoad()
    renderView('/admin/companies/company-disney/projects/project-toy-story')

    expect(await screen.findByRole('link', { name: 'DISNEY' })).toHaveAttribute(
      'href',
      '/admin/companies/company-disney',
    )
    expect(screen.getAllByText('Toy Story').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /^Empresa$/ })).not.toBeInTheDocument()
  })

  it('shows a safe error state when the company cannot be loaded', async () => {
    vi.mocked(getCompanyById).mockRejectedValue(new Error('Company not found'))
    vi.mocked(getProjectById).mockResolvedValue(toyStoryProject)

    renderView('/admin/companies/company-missing/projects/project-toy-story')

    expect(await screen.findByText('Company not found')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Empresa$/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'DISNEY' })).not.toBeInTheDocument()
  })

  it('blocks project administration when project does not belong to route company', async () => {
    mockBaseLoad({ ...toyStoryProject, company_id: 'company-acme' })
    renderView('/admin/companies/company-disney/projects/project-toy-story')

    expect(await screen.findByText(/no pertenece a la empresa/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /agregar miembro/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /editar configuraci/i })).not.toBeInTheDocument()
    })
  })

  it('does not load company-scoped operational data when project belongs to another company', async () => {
    mockBaseLoad({ ...toyStoryProject, company_id: 'company-acme' })
    renderView('/admin/companies/company-disney/projects/project-toy-story')

    expect(await screen.findByText(/no pertenece a la empresa/i)).toBeInTheDocument()
    expect(getProjectMembers).not.toHaveBeenCalled()
    expect(listCompanyUsers).not.toHaveBeenCalled()
    expect(fetchCompanyProfile).not.toHaveBeenCalled()
    expect(fetchPersonsByCompany).not.toHaveBeenCalled()
    expect(fetchDepartments).not.toHaveBeenCalled()
  })

  it('does not invoke admin mutations when rendering a mismatched company/project route', async () => {
    mockBaseLoad({ ...toyStoryProject, company_id: 'company-acme' })
    renderView('/admin/companies/company-disney/projects/project-toy-story')

    expect(await screen.findByText(/no pertenece a la empresa/i)).toBeInTheDocument()
    expect(updateProjectStatus).not.toHaveBeenCalled()
    expect(updateProjectInfo).not.toHaveBeenCalled()
    expect(removeProjectMember).not.toHaveBeenCalled()
    expect(updateProjectMemberRole).not.toHaveBeenCalled()
    expect(deleteProject).not.toHaveBeenCalled()
    expect(addProjectMember).not.toHaveBeenCalled()
  })
})
