import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { RadarDimension } from '@/shared/components/charts/LeanRadarChart'
import { P1MaturityPanel } from '@/modules/T10_AIValueDashboard/components/panels/P1MaturityPanel'

vi.mock('@/modules/Auth', () => ({
  usePermissions: vi.fn(),
}))

import { usePermissions } from '@/modules/Auth'

const mockUsePermissions = usePermissions as any

const mockRadar: RadarDimension[] = [
  { dimension: 'Estrategia', current: 2.5, target: 4 },
  { dimension: 'Talento', current: 1.8, target: 4 },
  { dimension: 'Tecnología', current: 3.0, target: 4 },
  { dimension: 'Datos', current: 2.2, target: 4 },
  { dimension: 'Procesos', current: 2.0, target: 4 },
]

const defaultProps = {
  radar: mockRadar,
  avg: 2.3,
  tier: 'Exploración',
  weakest: 'Talento',
  breakdown: {
    itAvg: 2.8,
    bizAvg: 1.9,
    gapPts: 0.9,
    gapSign: 'IT',
    interviewsCount: 5,
  },
  expanded: false,
  onToggle: vi.fn(),
  onNavigate: vi.fn(),
}

describe('P1MaturityPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cuando el paquete está activo (boost_assessment)', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        hasPackage: (pkg: string) => pkg === 'boost_assessment',
        isReadOnly: false,
      })
    })

    it('renderiza el contenido del panel', () => {
      render(<P1MaturityPanel {...defaultProps} />)
      expect(screen.getByText('T1 · Readiness')).toBeInTheDocument()
      expect(screen.getByText('5 dimensiones · Score 2.3/4')).toBeInTheDocument()
    })

    it('no renderiza PackagePreviewBanner', () => {
      render(<P1MaturityPanel {...defaultProps} />)
      expect(screen.queryByText('Paquete no disponible')).not.toBeInTheDocument()
    })

    it('muestra dimensiones de madurez', () => {
      render(<P1MaturityPanel {...defaultProps} />)
      expect(screen.getByText('Estrategia')).toBeInTheDocument()
      expect(screen.getByText('Talento')).toBeInTheDocument()
      expect(screen.getByText('Tecnología')).toBeInTheDocument()
    })

    it('no renderiza ExpandedSection cuando expanded=false', () => {
      render(<P1MaturityPanel {...defaultProps} expanded={false} />)
      expect(screen.queryByText('Abrir T1 Assessment')).not.toBeInTheDocument()
    })

    it('renderiza ExpandedSection cuando expanded=true', () => {
      render(<P1MaturityPanel {...defaultProps} expanded={true} />)
      expect(screen.getByText('Abrir T1 Assessment')).toBeInTheDocument()
      expect(screen.getByText('Exploración')).toBeInTheDocument()
    })

    it('muestra breakdown IT vs Negocio en expanded', () => {
      render(<P1MaturityPanel {...defaultProps} expanded={true} />)
      expect(screen.getByText('IT (avg)')).toBeInTheDocument()
      expect(screen.getByText('Negocio (avg)')).toBeInTheDocument()
    })
  })

  describe('cuando el paquete NO está activo', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        hasPackage: (pkg: string) => pkg !== 'boost_assessment',
        isReadOnly: false,
      })
    })

    it('renderiza PackagePreviewBanner', () => {
      render(<P1MaturityPanel {...defaultProps} />)
      expect(screen.getByText('Paquete no disponible')).toBeInTheDocument()
    })

    it('muestra módulos incluidos', () => {
      render(<P1MaturityPanel {...defaultProps} />)
      expect(screen.getByText('T1')).toBeInTheDocument()
    })

    it('no renderiza dimensiones de madurez', () => {
      render(<P1MaturityPanel {...defaultProps} />)
      expect(screen.queryByText('Estrategia')).not.toBeInTheDocument()
      expect(screen.queryByText('Talento')).not.toBeInTheDocument()
    })

    it('no renderiza ExpandedSection incluso cuando expanded=true', () => {
      render(<P1MaturityPanel {...defaultProps} expanded={true} />)
      expect(screen.queryByText('Abrir T1 Assessment')).not.toBeInTheDocument()
    })

    it('renderiza CTA con mailto', () => {
      render(<P1MaturityPanel {...defaultProps} />)
      const link = screen.getByRole('link', { name: /contactar/i })
      expect(link).toHaveAttribute('href', 'mailto:info@consultoriaalpha.com')
    })
  })

  describe('cuando hay 0 entrevistas', () => {
    const propsNoInterviews = {
      ...defaultProps,
      breakdown: { ...defaultProps.breakdown, interviewsCount: 0 },
    }

    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        hasPackage: (pkg: string) => pkg === 'boost_assessment',
        isReadOnly: false,
      })
    })

    it('muestra mensaje cuando expanded', () => {
      render(<P1MaturityPanel {...propsNoInterviews} expanded={true} />)
      expect(screen.getByText(/Sin entrevistas registradas/)).toBeInTheDocument()
    })
  })
})
