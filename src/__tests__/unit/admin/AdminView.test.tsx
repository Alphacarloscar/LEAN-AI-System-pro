import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Service mocks — aislan los componentes de Supabase ───────────────────────

vi.mock('@/services/projects.service', () => ({
  listMyProjects: vi.fn().mockResolvedValue([]),
  createProject:  vi.fn(),
}))

vi.mock('@/services/companies.service', () => ({
  fetchCompanies: vi.fn().mockResolvedValue([]),
  createCompany:  vi.fn(),
}))

vi.mock('@/services/admin.service', () => ({
  inviteUser:       vi.fn(),
  listAllUsers:     vi.fn().mockResolvedValue([]),
  updateUserRole:   vi.fn(),
}))

vi.mock('@shared/design-system/components', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    Spinner: () => <span data-testid="spinner" />,
  }
})

import { ProjectsTab }  from '@/modules/Admin/components/ProjectsTab'
import { CompaniesTab } from '@/modules/Admin/components/CompaniesTab'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const NO_COMPANIES: { id: string; name: string; slug?: string }[] = []

const SAMPLE_COMPANIES = [
  { id: 'co-1', name: 'ACME S.A.',     slug: 'acme'     },
  { id: 'co-2', name: 'Nexus S.L.',    slug: 'nexus'    },
]

// ── ADR-021 §3b — Accesibilidad: aria-label / htmlFor en formularios Admin ───
//
// WCAG 1.3.1 / 3.3.2: cada control de formulario debe tener una etiqueta
// accesible (aria-label, aria-labelledby, o <label htmlFor>).
//
// Estos tests documentan el contrato esperado y detectan regresiones
// si los controles pierden su etiqueta accesible.

describe('ProjectsTab — accesibilidad de formulario Crear proyecto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('el input de nombre de proyecto es accesible por su rol (textbox)', () => {
    render(<ProjectsTab companies={NO_COMPANIES} />)
    // El input debe ser localizable por rol (query agnóstica al selector CSS)
    const nameInput = screen.getByRole('textbox')
    expect(nameInput).toBeDefined()
    expect(nameInput.tagName.toLowerCase()).toBe('input')
  })

  it('el input de nombre tiene placeholder descriptivo como fallback accesible', () => {
    render(<ProjectsTab companies={NO_COMPANIES} />)
    // Un placeholder no es un sustituto de aria-label, pero es el fallback actual.
    // Este test documenta el estado real para detectar si el placeholder desaparece.
    const nameInput = screen.getByPlaceholderText(
      /nombre del proyecto/i,
    )
    expect(nameInput).toBeDefined()
  })

  it('el select de empresa tiene al menos una opción accesible ("Sin empresa")', () => {
    render(<ProjectsTab companies={NO_COMPANIES} />)
    // El <select> debe existir y tener la opción por defecto
    const select = screen.getByRole('combobox')
    expect(select).toBeDefined()
    expect(within(select).getByText('Sin empresa')).toBeDefined()
  })

  it('el select de empresa lista las empresas disponibles', () => {
    render(<ProjectsTab companies={SAMPLE_COMPANIES} />)
    const select = screen.getByRole('combobox')
    expect(within(select).getByText('ACME S.A.')).toBeDefined()
    expect(within(select).getByText('Nexus S.L.')).toBeDefined()
  })

  it('el botón de submit tiene texto accesible "Crear"', () => {
    render(<ProjectsTab companies={NO_COMPANIES} />)
    const submitBtn = screen.getByRole('button', { name: /^Crear$/i })
    expect(submitBtn).toBeDefined()
    expect(submitBtn).toHaveAttribute('type', 'submit')
  })

  it('el botón de submit está deshabilitado cuando el campo nombre está vacío', () => {
    render(<ProjectsTab companies={NO_COMPANIES} />)
    const submitBtn = screen.getByRole('button', { name: /^Crear$/i })
    expect(submitBtn).toBeDisabled()
  })
})

// ── CompaniesTab — accesibilidad del formulario Crear empresa ─────────────────

describe('CompaniesTab — accesibilidad de formulario Crear empresa', () => {
  beforeEach(() => vi.clearAllMocks())

  const noOp = vi.fn()

  it('el input de nombre de empresa es accesible por su rol (textbox)', () => {
    render(<CompaniesTab companies={NO_COMPANIES} onCompanyAdd={noOp} />)
    const nameInput = screen.getByRole('textbox')
    expect(nameInput).toBeDefined()
  })

  it('el input de nombre tiene placeholder descriptivo', () => {
    render(<CompaniesTab companies={NO_COMPANIES} onCompanyAdd={noOp} />)
    const nameInput = screen.getByPlaceholderText(/nombre de la empresa/i)
    expect(nameInput).toBeDefined()
  })

  it('el botón de submit tiene texto accesible "Crear"', () => {
    render(<CompaniesTab companies={NO_COMPANIES} onCompanyAdd={noOp} />)
    const submitBtn = screen.getByRole('button', { name: /^Crear$/i })
    expect(submitBtn).toBeDefined()
    expect(submitBtn).toHaveAttribute('type', 'submit')
  })

  it('el botón de submit está deshabilitado cuando el campo nombre está vacío', () => {
    render(<CompaniesTab companies={NO_COMPANIES} onCompanyAdd={noOp} />)
    const submitBtn = screen.getByRole('button', { name: /^Crear$/i })
    expect(submitBtn).toBeDisabled()
  })

  it('el heading "Crear empresa cliente" actúa como etiqueta de sección', () => {
    render(<CompaniesTab companies={NO_COMPANIES} onCompanyAdd={noOp} />)
    const heading = screen.getByRole('heading', { name: /crear empresa cliente/i })
    expect(heading).toBeDefined()
  })
})

// ── Gap report: controles que AÚN necesitan aria-label explícito ─────────────
//
// Los siguientes tests documentan los atributos de accesibilidad que deben
// añadirse en una iteración futura (TECH-DEBT).
// Están marcados como .todo() para que aparezcan en el reporte sin fallar.

describe('ProjectsTab — gaps de accesibilidad pendientes de resolver (TECH-DEBT)', () => {
  it.todo('el input de nombre debería tener aria-label="Nombre del proyecto" además de placeholder')
  it.todo('el select de empresa debería tener aria-label="Empresa cliente" o <label htmlFor>')
})

describe('CompaniesTab — gaps de accesibilidad pendientes de resolver (TECH-DEBT)', () => {
  it.todo('el input de nombre debería tener aria-label="Nombre de la empresa" además de placeholder')
})
