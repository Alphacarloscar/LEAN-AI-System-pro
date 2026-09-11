import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlanesTab } from '@/modules/CompanyProfile/components/PlanesTab'

const mockUsePermissions = vi.fn()
const mockLoadMyProjects = vi.fn()

vi.mock('@/modules/Auth', () => ({
  usePermissions: () => mockUsePermissions(),
}))

vi.mock('@/modules/Engagement/store', () => ({
  useEngagementStore: {
    getState: () => ({ loadMyProjects: mockLoadMyProjects }),
  },
}))

vi.mock('@shared/design-system/components', () => ({
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

vi.mock('@/services/company-plans.service', () => ({
  getCompanyContractedPackages: vi.fn(),
  updateCompanyContractedPackages: vi.fn(),
}))

import {
  getCompanyContractedPackages,
  updateCompanyContractedPackages,
} from '@/services/company-plans.service'

describe('PlanesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePermissions.mockReturnValue({ canManageContractedPlans: true })
    vi.mocked(getCompanyContractedPackages).mockResolvedValue(['boost_assessment'])
    vi.mocked(updateCompanyContractedPackages).mockResolvedValue(undefined)
    mockLoadMyProjects.mockResolvedValue(undefined)
  })

  it('allows an authorized user to change and save contracted plans through the service', async () => {
    const user = userEvent.setup()
    render(<PlanesTab companyId="company-1" />)

    await screen.findByText('Boost Assessment')
    await user.click(screen.getByText('Legal & Compliance'))
    await user.click(screen.getByRole('button', { name: /guardar planes/i }))

    await waitFor(() => {
      expect(updateCompanyContractedPackages).toHaveBeenCalledWith('company-1', [
        'boost_assessment',
        'legal_compliance',
      ])
    })
    expect(mockLoadMyProjects).toHaveBeenCalledTimes(1)
    expect(await screen.findByText(/planes guardados correctamente/i)).toBeInTheDocument()
  })

  it('renders contracted plans read-only when the user cannot manage contractual plans', async () => {
    const user = userEvent.setup()
    mockUsePermissions.mockReturnValue({ canManageContractedPlans: false })

    render(<PlanesTab companyId="company-1" />)

    await screen.findByText('Boost Assessment')
    expect(screen.queryByRole('button', { name: /guardar planes/i })).not.toBeInTheDocument()

    await user.click(screen.getByText('Legal & Compliance'))
    expect(screen.getByText(/1 plan activo/i)).toBeInTheDocument()
    expect(updateCompanyContractedPackages).not.toHaveBeenCalled()
  })

  it('surfaces atomic persistence failures without reporting success', async () => {
    const user = userEvent.setup()
    vi.mocked(updateCompanyContractedPackages).mockRejectedValue(new Error('transaction failed'))

    render(<PlanesTab companyId="company-1" />)

    await screen.findByText('Boost Assessment')
    await user.click(screen.getByText('Portfolio Management'))
    await user.click(screen.getByRole('button', { name: /guardar planes/i }))

    expect(await screen.findByText(/no se ha aplicado ningun cambio parcial/i)).toBeInTheDocument()
    expect(screen.queryByText(/planes guardados correctamente/i)).not.toBeInTheDocument()
    expect(mockLoadMyProjects).not.toHaveBeenCalled()
  })
})
