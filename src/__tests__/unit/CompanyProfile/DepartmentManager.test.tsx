import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DepartmentManager } from '@/modules/CompanyProfile/DepartmentManager'
import { useDepartmentStore } from '@/modules/CompanyProfile/useDepartmentStore'

vi.mock('@/modules/Auth', () => ({
  usePermissions: () => ({ canManageOrganization: true }),
}))

vi.mock('@shared/design-system/components', () => ({
  Spinner: () => <span data-testid="spinner" />,
  SegmentedControl: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <button type="button" onClick={() => onChange(value)}>
      {value}
    </button>
  ),
}))

vi.mock('@/shared/components/ImpactWarningDialog', () => ({
  ImpactWarningDialog: ({
    isOpen,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
  }) =>
    isOpen ? (
      <div role="dialog">
        <button type="button" onClick={onConfirm}>
          Confirmar
        </button>
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    ) : null,
}))

vi.mock('@/services/department.service', () => ({
  fetchDepartments: vi.fn(),
  addDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  getDepartmentImpact: vi.fn().mockResolvedValue({ affectedPersons: [] }),
  deleteDepartment: vi.fn().mockResolvedValue(undefined),
}))

import { deleteDepartment } from '@/services/department.service'

const department = {
  id: 'dept-sales',
  company_id: 'company-1',
  name: 'Ventas',
  color: '#C8860A',
  type: 'negocio_ops',
  created_at: '2026-01-01T00:00:00Z',
} as const

describe('DepartmentManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDepartmentStore.setState({
      departments: [department],
      isLoading: false,
      error: null,
    })
  })

  it('deletes a department through a single service call', async () => {
    const user = userEvent.setup()
    render(<DepartmentManager companyId="company-1" />)

    await user.click(screen.getByRole('button', { name: /eliminar ventas/i }))
    await user.click(await screen.findByRole('button', { name: /confirmar/i }))

    await waitFor(() => {
      expect(deleteDepartment).toHaveBeenCalledTimes(1)
    })
    expect(useDepartmentStore.getState().departments).toEqual([])
  })
})
