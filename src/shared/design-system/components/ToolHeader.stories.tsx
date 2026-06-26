import type { Meta, StoryObj } from '@storybook/react'
import { ToolHeader } from './ToolHeader'
import { Button }     from './Button'
import { Badge }      from './Badge'

const meta = {
  title:     'Design System/ToolHeader',
  component:  ToolHeader,
  tags:      ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ToolHeader>

export default meta
type Story = StoryObj<typeof meta>

const PhaseMiniMapStub = ({ label }: { label: string }) => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-navy/10 text-navy dark:bg-navy/20 dark:text-warm-100">
    {label}
  </span>
)

// ── Mínima: sólo back + badge + title ────────────────────────────
export const Minimal: Story = {
  args: {
    onBack:   () => {},
    toolCode: 'T3',
    title:    'Value Stream Map',
    sticky:   false,
  },
}

// ── Con chips de estado (stat cards del header) ───────────────────
export const WithChips: Story = {
  args: {
    onBack:       () => {},
    toolCode:     'T3',
    title:        'Value Stream Map',
    subtitle:     'Acme Corp S.L.',
    phaseMiniMap: <PhaseMiniMapStub label="Listen" />,
    chips: (
      <div className="flex items-center gap-5">
        {[
          { label: 'Opp crítica', value: 3,  color: 'text-navy' },
          { label: 'Opp alta',    value: 7,  color: 'text-info-dark' },
          { label: 'Total',       value: 12, color: 'text-lean-black' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className={`text-xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
            <p className="text-[9px] text-text-subtle mt-0.5 whitespace-nowrap">{label}</p>
          </div>
        ))}
      </div>
    ),
    sticky: false,
  },
}

// ── Completa: cta + phaseMiniMap + sticky ─────────────────────────
export const WithCTAAndPhase: Story = {
  args: {
    onBack:       () => {},
    backLabel:    'Volver al dashboard',
    toolCode:     'T2',
    title:        'AI Stakeholder Matrix',
    subtitle:     'Acme Corp S.L.',
    phaseMiniMap: <PhaseMiniMapStub label="Listen" />,
    cta: (
      <>
        <Button variant="secondary" size="sm">Importar desde T1</Button>
        <Button variant="primary"   size="sm">Nueva entrevista</Button>
      </>
    ),
    sticky: true,
  },
}

// ── Con slot below (progress bar, T1) ────────────────────────────
export const WithBelow: Story = {
  args: {
    onBack:       () => {},
    toolCode:     'T1',
    title:        'Maturity Radar',
    subtitle:     'Acme Corp S.L.',
    phaseMiniMap: <PhaseMiniMapStub label="Listen" />,
    cta:          <Button size="sm">Exportar PDF</Button>,
    below: (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-navy/10">
          <div className="w-5/8 h-full rounded-full bg-navy" />
        </div>
        <span className="text-[10px] text-text-subtle shrink-0">5 / 8 dimensiones</span>
      </div>
    ),
    sticky: false,
  },
}

// ── CTA con año selector + export (T9/T10 pattern) ───────────────
export const WithYearSelectorCTA: Story = {
  args: {
    onBack:       () => {},
    toolCode:     'T9',
    title:        'AI Value Dashboard',
    subtitle:     'Acme Corp S.L.',
    phaseMiniMap: <PhaseMiniMapStub label="Navigate" />,
    cta: (
      <>
        <Badge variant="navy-ghost" size="xs">2025</Badge>
        <Button variant="secondary" size="sm">Exportar</Button>
        <Button variant="primary"   size="sm">Generar IA</Button>
      </>
    ),
    sticky: false,
  },
}
