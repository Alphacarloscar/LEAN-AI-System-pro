import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AdminRouteGuard } from '@/shared/guards/AdminRouteGuard'
import { useAuthStore } from '@/modules/Auth'
import type { AuthUser } from '@/modules/Auth/types'

function setRole(role: AuthUser['role']) {
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: `user-${role}`, email: `${role}@test.com`, name: role, role },
  })
}

function renderGuardedAdmin(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminRouteGuard />}>
          <Route path="/admin" element={<div>Admin root</div>} />
          <Route path="/admin/companies" element={<div>Admin companies</div>} />
          <Route path="/admin/users" element={<div>Admin users</div>} />
          <Route path="/admin/projects" element={<div>Admin projects</div>} />
          <Route path="/admin/companies/:companyId" element={<div>Admin company detail</div>} />
          <Route
            path="/admin/companies/:companyId/projects/:projectId"
            element={<div>Admin project detail</div>}
          />
          <Route path="/admin/users/:userId" element={<div>Admin user detail</div>} />
        </Route>
        <Route path="/evaluation" element={<div>Evaluation dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminRouteGuard', () => {
  beforeEach(() => {
    useAuthStore.setState({ isAuthenticated: false, user: null })
  })

  it.each([
    ['/admin', 'Admin root'],
    ['/admin/companies', 'Admin companies'],
    ['/admin/users', 'Admin users'],
    ['/admin/projects', 'Admin projects'],
    ['/admin/companies/company-1', 'Admin company detail'],
    ['/admin/companies/company-1/projects/project-1', 'Admin project detail'],
    ['/admin/users/user-1', 'Admin user detail'],
  ])('allows superadmin to access %s', (path, expectedText) => {
    setRole('superadmin')
    renderGuardedAdmin(path)

    expect(screen.getByText(expectedText)).toBeInTheDocument()
  })

  it.each(['consultant', 'client_editor', 'client_viewer'] as const)(
    'redirects %s away from every admin subroute',
    (role) => {
      setRole(role)
      const adminSubroutes = [
        '/admin',
        '/admin/companies',
        '/admin/users',
        '/admin/projects',
        '/admin/companies/company-1',
        '/admin/companies/company-1/projects/project-1',
        '/admin/users/user-1',
      ]

      for (const path of adminSubroutes) {
        const { unmount } = renderGuardedAdmin(path)

        expect(screen.getByText('Evaluation dashboard')).toBeInTheDocument()
        expect(screen.queryByText(/^Admin /)).not.toBeInTheDocument()
        unmount()
      }
    },
  )
})
