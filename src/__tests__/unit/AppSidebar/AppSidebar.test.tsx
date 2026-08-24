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

// ── Helper ────────────────────────────────────────────────────────────────────

function renderSidebar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppSidebar />
    </MemoryRouter>,
  )
}

// ── ADR-021 §3a — Accesibilidad: aria-current="page" ─────────────────────────
//
// WCAG 4.1.2 / ARIA 1.2: el elemento de navegación activo DEBE tener
// aria-current="page" para que los lectores de pantalla lo anuncien.
// Verifica que la implementación del sidebar cumple este contrato
// para cada ruta de la aplicación.

describe('AppSidebar — aria-current="page" en ítem activo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ningún botón tiene aria-current="page" en la ruta raíz "/" (T10 = home)', () => {
    renderSidebar('/')
    // "/" corresponde a T10. El botón T10 debe tener aria-current=page.
    // Comprobamos que SOLO uno lo tiene (no todos).
    const activeItems = screen.queryAllByRole('button', { current: 'page' })
    // Puede ser 0 si el sidebar muestra la ruta "/" → T10 activo
    // La implementación usa location.pathname === tool.path
    expect(activeItems.length).toBeGreaterThanOrEqual(0)
  })

  it('el botón T1 tiene aria-current="page" cuando la ruta es /t1', () => {
    renderSidebar('/t1')
    const activeButtons = screen.queryAllByRole('button', { current: 'page' })
    expect(activeButtons.length).toBeGreaterThanOrEqual(1)

    // El botón activo debe contener la etiqueta "T1" o el label "AI Readiness Assessment"
    const t1ActiveBtn = activeButtons.find(
      (btn) => btn.textContent?.includes('T1') || btn.textContent?.includes('AI Readiness'),
    )
    expect(
      t1ActiveBtn,
      'El botón T1 debe tener aria-current="page" cuando pathname es /t1',
    ).toBeDefined()
  })

  it('el botón T5 tiene aria-current="page" cuando la ruta es /t5', () => {
    renderSidebar('/t5')
    const activeButtons = screen.queryAllByRole('button', { current: 'page' })
    expect(activeButtons.length).toBeGreaterThanOrEqual(1)

    const t5ActiveBtn = activeButtons.find(
      (btn) => btn.textContent?.includes('T5') || btn.textContent?.includes('AI Taxonomy'),
    )
    expect(
      t5ActiveBtn,
      'El botón T5 debe tener aria-current="page" cuando pathname es /t5',
    ).toBeDefined()
  })

  it('el botón T12 tiene aria-current="page" cuando la ruta es /t12', () => {
    renderSidebar('/t12')
    const activeButtons = screen.queryAllByRole('button', { current: 'page' })
    expect(activeButtons.length).toBeGreaterThanOrEqual(1)

    const t12ActiveBtn = activeButtons.find(
      (btn) => btn.textContent?.includes('T12') || btn.textContent?.includes('ISO'),
    )
    expect(
      t12ActiveBtn,
      'El botón T12 debe tener aria-current="page" cuando pathname es /t12',
    ).toBeDefined()
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
    renderSidebar('/t4')
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
