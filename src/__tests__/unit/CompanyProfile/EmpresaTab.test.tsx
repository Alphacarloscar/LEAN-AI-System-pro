import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EmpresaTab } from '@/modules/CompanyProfile/components/EmpresaTab'

const settings = {
  sector: 'Retail / Consumo',
  company_size: '50–200 empleados',
}

describe('EmpresaTab', () => {
  it('renders company data controls read-only when company data editing is closed', () => {
    render(
      <EmpresaTab
        companyId="company-1"
        companySettings={settings}
        onSettingsChange={vi.fn()}
        canEditCompanyData={false}
      />,
    )

    expect(screen.getByDisplayValue('Retail / Consumo')).toBeDisabled()
    expect(screen.getByDisplayValue('50–200 empleados')).toBeDisabled()
  })

  it('renders company data controls editable when company data editing is allowed', () => {
    render(
      <EmpresaTab
        companyId="company-1"
        companySettings={settings}
        onSettingsChange={vi.fn()}
        canEditCompanyData={true}
      />,
    )

    expect(screen.getByDisplayValue('Retail / Consumo')).not.toBeDisabled()
    expect(screen.getByDisplayValue('50–200 empleados')).not.toBeDisabled()
  })
})
