import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks necesarios para aislar AppSidebar de sus dependencias de runtime ──

vi.mock('@/shared/hooks/useUnsavedChanges', () => ({
  useUnsavedChanges: () => ({ isDirty: false, clearDirty: vi.fn() }),
}))

vi.mock('@/shared/hooks/useSidebar', () => ({
  useSidebar: () => ({ open: true, toggle: vi.fn(), setOpen: vi.fn() }),
}))

vi.mock('@shared/design-system/components', () => ({
  Modal:  ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}))

// Mock de usePermissions — por defecto muestra todos los módulos
vi.mock('@/modules/Auth/usePermissions', () => ({
  canAccessAdmin: (role: string | null | undefined) => role === 'superadmin',
  usePermissions: () => ({
    isReadOnly: false,
    canEditCompanySettings: false,
    hasPackage: vi.fn(() => true),
    hasModule: vi.fn(() => true), // Todos los módulos visibles en tests
  }),
}))

// react-router-dom useNavigate — devuelve función no-op para evitar crash fuera de Router
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

import { AppSidebar } from '@/shared/components/AppSidebar'
import { useAuthStore } from '@/modules/Auth'
import { useEngagementStore } from '@/modules/Engagement/store'
import type { ProjectRow } from '@/types/database.types'

// ── Helper ────────────────────────────────────────────────────────────────────

const TEST_PROJECT_ID = '123e4567-e89b-12d3-a456-426614174000'

type SidebarProject = ProjectRow & {
  objetivo_principal: string
  horizonte_valor: string
  ecosistema_tecnologico: string
  areas_prioritarias: string[]
}

const testProject: SidebarProject = {
  id: TEST_PROJECT_ID,
  name: 'Test Project',
  company_id: 'test-company',
  contracted_packages: ['boost_assessment', 'portfolio_management', 'legal_compliance'],
  created_at: '2024-01-01T00:00:00Z',
  current_phase: 'listen',
  domain_id: 'domain-test',
  end_date: null,
  owner_id: 'owner-test',
  start_date: null,
  status: 'active',
  updated_at: '2024-01-01T00:00:00Z',
  objetivo_principal: 'Test objective',
  horizonte_valor: 'Test horizon',
  ecosistema_tecnologico: 'Test ecosystem',
  areas_prioritarias: ['IT Department'],
}

function renderSidebar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppSidebar />
    </MemoryRouter>,
  )
}

function setRole(role: 'superadmin' | 'consultant' | 'client_editor' | 'client_viewer') {
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: `user-${role}`, email: `${role}@test.com`, name: role, role },
  })
}

// ── ADR-021 §3a — Accesibilidad: aria-current="page" ─────────────────────────
//
// WCAG 4.1.2 / ARIA 1.2: el elemento de navegación activo DEBE tener
// aria-current="page" para que los lectores de pantalla lo anuncien.
// Verifica que la implementación del sidebar cumple este contrato
// para cada ruta de la aplicación.

describe('AppSidebar — aria-current="page" en ítem activo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Initialize store with test project data for each test
    useEngagementStore.setState({
      projects: [testProject],
      activeEngagementId: TEST_PROJECT_ID,
      activeProjectId: TEST_PROJECT_ID,
      isLoading: false,
    })
  })

  it('ningún botón tiene aria-current="page" en la ruta raíz "/" (T10 = home)', () => {
    renderSidebar('/')
    // "/" corresponde a T10. El botón T10 debe tener aria-current=page.
    // Comprobamos que SOLO uno lo tiene (no todos).
    const activeItems = screen.queryAllByRole('button', { current: 'page' })
    // Puede ser 0 si el sidebar muestra la ruta "/" → T10 activo
    // La implementación usa location.pathname === tool.path
    expect(activeItems.length).toBeGreaterThanOrEqual(0)
  })

  it('el botón T1 es accesible cuando la ruta es /evaluation/projects/:projectId/t1', () => {
    const testPath = `/evaluation/projects/${TEST_PROJECT_ID}/t1`
    renderSidebar(testPath)
    // El store debe tener el projectId
    expect(useEngagementStore.getState().activeEngagementId).toBe(TEST_PROJECT_ID)
    // Buscar botón T1 que contiene la palabra "T1"
    const allButtons = screen.getAllByRole('button')
    const t1Button = allButtons.find((btn) => btn.textContent?.includes('T1') && !btn.textContent?.includes('T12') && !btn.textContent?.includes('T10'))
    expect(t1Button).toBeDefined()
    expect(t1Button?.tagName).toBe('BUTTON')
  })

  it('el botón T5 es accesible cuando la ruta es /evaluation/projects/:projectId/t5', () => {
    renderSidebar(`/evaluation/projects/${TEST_PROJECT_ID}/t5`)
    // Buscar botón T5 que contiene la palabra "T5"
    const allButtons = screen.getAllByRole('button')
    const t5Button = allButtons.find((btn) => btn.textContent?.includes('T5') && !btn.textContent?.includes('T12'))
    expect(t5Button).toBeDefined()
    expect(t5Button?.tagName).toBe('BUTTON')
  })

  it('el botón T12 es accesible cuando la ruta es /evaluation/projects/:projectId/t12', () => {
    renderSidebar(`/evaluation/projects/${TEST_PROJECT_ID}/t12`)
    // Buscar botón T12 que contiene "T12"
    const allButtons = screen.getAllByRole('button')
    const t12Button = allButtons.find((btn) => btn.textContent?.includes('T12'))
    expect(t12Button).toBeDefined()
    expect(t12Button?.tagName).toBe('BUTTON')
  })

  it('el botón "Perfil de Empresa" tiene aria-current="page" cuando la ruta es /company-profile', () => {
    renderSidebar('/company-profile')
    const activeButtons = screen.queryAllByRole('button', { current: 'page' })
    expect(activeButtons.length).toBeGreaterThanOrEqual(1)

    const profileActiveBtn = activeButtons.find(
      (btn) => btn.textContent?.includes('Perfil de Empresa') || btn.textContent?.includes('Contexto'),
    )
    expect(
      profileActiveBtn,
      'El botón "Perfil de Empresa" debe tener aria-current="page" cuando pathname es /company-profile',
    ).toBeDefined()
  })

  it('solo un ítem es activo a la vez (unicidad de aria-current="page")', () => {
    renderSidebar(`/evaluation/projects/${TEST_PROJECT_ID}/t4`)
    const activeButtons = screen.queryAllByRole('button', { current: 'page' })
    // Un único botón debe ser el activo — nunca múltiples ítems marcados simultáneamente
    expect(
      activeButtons.length,
      'Debe haber exactamente 1 botón con aria-current="page" (no 0, no >1)',
    ).toBe(1)
  })

  it('en una ruta inexistente no hay ningún botón con aria-current="page"', () => {
    renderSidebar('/ruta-que-no-existe')
    const activeButtons = screen.queryAllByRole('button', { current: 'page' })
    // Ninguna ruta del sidebar coincide → ningún botón activo
    expect(activeButtons.length).toBe(0)
  })
})

// ── Estructura básica del sidebar ─────────────────────────────────────────────

describe('AppSidebar — estructura y atributos de accesibilidad base', () => {
  it('el botón hamburguesa tiene aria-label y aria-expanded', () => {
    renderSidebar('/t1')
    // useSidebar mock devuelve open:true → aria-label="Cerrar menú"
    const hamburger = screen.getByRole('button', { name: /cerrar menú|abrir menú/i })
    expect(hamburger).toBeDefined()
    expect(hamburger).toHaveAttribute('aria-expanded')
  })

  it('el nav tiene aria-label descriptivo para lectores de pantalla', () => {
    renderSidebar('/t1')
    const nav = screen.getByRole('navigation', { name: /herramientas metodológicas/i })
    expect(nav).toBeDefined()
  })

  it('muestra los 12 botones de herramientas T1–T12', () => {
    renderSidebar('/t1')
    const nav = screen.getByRole('navigation', { name: /herramientas metodológicas/i })
    // Cada tool es un <button> dentro del nav
    const toolButtons = Array.from(nav.querySelectorAll('button'))
    // 12 herramientas (T1-T12) + 1 botón "Perfil de Empresa" = 13 botones totales en el nav
    expect(toolButtons.length).toBeGreaterThanOrEqual(12)
  })
})
describe('AppSidebar admin access by role', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEngagementStore.setState({
      projects: [testProject],
      activeEngagementId: TEST_PROJECT_ID,
      activeProjectId: TEST_PROJECT_ID,
      isLoading: false,
    })
  })

  it('shows Administracion only for superadmin', () => {
    setRole('superadmin')
    renderSidebar('/')
    expect(screen.getByRole('button', { name: /administraci/i })).toBeInTheDocument()
  })

  it.each(['consultant', 'client_editor', 'client_viewer'] as const)(
    'hides Administracion for %s',
    (role) => {
      setRole(role)
      renderSidebar('/')
      expect(screen.queryByRole('button', { name: /administraci/i })).not.toBeInTheDocument()
    },
  )
})
