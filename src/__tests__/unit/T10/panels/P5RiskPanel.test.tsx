import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { P5RiskPanel } from '@/modules/T10_AIValueDashboard/components/panels/P5RiskPanel'

vi.mock('@/modules/Auth', () => ({
  usePermissions: vi.fn(),
}))

import { usePermissions } from '@/modules/Auth'

const mockUsePermissions = usePermissions as any

const defaultProps = {
  p5data: {
    isoCompliance: 75,
    risks: { high: 2, medium: 5, low: 8, total: 15 },
    hasData: true,
  },
  riskSegments: [
    { pct: 13, color: '#FF0000' },
    { pct: 33, color: '#FFAA00' },
    { pct: 53, color: '#00AA00' },
  ],
  shadowAIPct: { pct: 25, total: 10, withTools: 3 },
  expanded: false,
  onToggle: vi.fn(),
  onNavigate: vi.fn(),
}

describe('P5RiskPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('cuando el paquete está activo (legal_compliance)', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        hasPackage: (pkg: string) => pkg === 'legal_compliance',
        isReadOnly: false,
      })
    })

    it('renderiza el contenido del panel', () => {
      render(<P5RiskPanel {...defaultProps} />)
      expect(screen.getByText('T6 + T12 · Riesgos')).toBeInTheDocument()
      expect(screen.getByText('15 casos mapeados · 75% ISO')).toBeInTheDocument()
    })

    it('no renderiza PackagePreviewBanner', () => {
      render(<P5RiskPanel {...defaultProps} />)
      expect(screen.queryByText('Paquete no disponible')).not.toBeInTheDocument()
      expect(screen.queryByText('Legal & Compliance')).not.toBeInTheDocument()
    })

    it('muestra datos de riesgo cuando hasData=true', () => {
      render(<P5RiskPanel {...defaultProps} />)
      expect(screen.getByText('15 casos mapeados · 75% ISO')).toBeInTheDocument()
    })

    it('no renderiza ExpandedSection cuando expanded=false', () => {
      render(<P5RiskPanel {...defaultProps} expanded={false} />)
      expect(screen.queryByText('Abrir T6 Riesgos')).not.toBeInTheDocument()
    })

    it('renderiza ExpandedSection cuando expanded=true', () => {
      render(<P5RiskPanel {...defaultProps} expanded={true} />)
      expect(screen.getByText('Abrir T6 Riesgos')).toBeInTheDocument()
      expect(screen.getByText('Abrir T12 ISO')).toBeInTheDocument()
    })
  })

  describe('cuando el paquete NO está activo', () => {
    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        hasPackage: (pkg: string) => pkg !== 'legal_compliance',
        isReadOnly: false,
      })
    })

    it('renderiza PackagePreviewBanner', () => {
      render(<P5RiskPanel {...defaultProps} />)
      expect(screen.getByText('Paquete no disponible')).toBeInTheDocument()
    })

    it('muestra módulos incluidos', () => {
      render(<P5RiskPanel {...defaultProps} />)
      expect(screen.getByText('T6')).toBeInTheDocument()
      expect(screen.getByText('T12')).toBeInTheDocument()
    })

    it('no renderiza datos reales del panel', () => {
      render(<P5RiskPanel {...defaultProps} />)
      expect(screen.queryByText('ISO 42001 cumplimiento')).not.toBeInTheDocument()
    })

    it('no renderiza ExpandedSection incluso cuando expanded=true', () => {
      render(<P5RiskPanel {...defaultProps} expanded={true} />)
      expect(screen.queryByText('Abrir T6 Riesgos')).not.toBeInTheDocument()
    })

    it('renderiza CTA con mailto', () => {
      render(<P5RiskPanel {...defaultProps} />)
      const link = screen.getByRole('link', { name: /contactar/i })
      expect(link).toHaveAttribute('href', 'mailto:info@consultoriaalpha.com')
    })
  })

  describe('cuando no hay datos', () => {
    const propsNoData = {
      ...defaultProps,
      p5data: { isoCompliance: 0, risks: { high: 0, medium: 0, low: 0, total: 0 }, hasData: false },
    }

    beforeEach(() => {
      mockUsePermissions.mockReturnValue({
        hasPackage: (pkg: string) => pkg === 'legal_compliance',
        isReadOnly: false,
      })
    })

    it('muestra mensaje de datos faltantes', () => {
      render(<P5RiskPanel {...propsNoData} />)
      expect(screen.getByText(/Completa T4.*y T12/)).toBeInTheDocument()
    })
  })
})
