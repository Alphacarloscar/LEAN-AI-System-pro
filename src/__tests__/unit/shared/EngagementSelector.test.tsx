import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EngagementSelector } from '@/shared/components/EngagementSelector'

const mockUsePermissions = vi.fn()
const mockUseAuthStore = vi.fn()

vi.mock('@/modules/Auth', () => ({
  useAuthStore: () => mockUseAuthStore(),
  usePermissions: () => mockUsePermissions(),
}))

vi.mock('@/modules/Engagement/store', () => ({
  useEngagementStore: () => ({
    projects: [],
    activeEngagementId: null,
    isLoading: false,
    selectEngagement: vi.fn(),
    createAndSelect: vi.fn(),
    activeCompanyId: null,
  }),
}))

vi.mock('@shared/design-system/components', () => ({
  Spinner: () => <span data-testid="spinner" />,
}))

vi.mock('@/shared/hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: () => ({ isDirty: false, clearDirty: vi.fn() }),
}))

vi.mock('@/shared/components/UnsavedChangesModal', () => ({
  UnsavedChangesModal: () => null,
}))

describe('EngagementSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'admin@test.dev',
        name: 'Admin',
        role: 'superadmin',
      },
    })
  })

  it('hides project creation when the action permission is closed even for a privileged role', async () => {
    const user = userEvent.setup()
    mockUsePermissions.mockReturnValue({ canCreateProjects: false })

    render(
      <MemoryRouter>
        <EngagementSelector dark={false} />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /selector de proyecto/i }))

    expect(screen.queryByRole('button', { name: /nuevo proyecto/i })).not.toBeInTheDocument()
  })
})
