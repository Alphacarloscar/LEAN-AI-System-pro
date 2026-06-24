import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Tabs } from './Tabs'

const meta = {
  title:     'Design System/Tabs',
  component:  Tabs,
  tags:      ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['pill', 'underline'] },
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

// ── Pill ──────────────────────────────────────────────────────

export const Pill: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [tab, setTab] = useState('scoring')
    return (
      <div className="p-6 max-w-2xl">
        <Tabs
          aria-label="Secciones del caso de uso"
          variant="pill"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'scoring',  label: 'Scoring',        badge: '87' },
            { value: 'economia', label: 'Economía' },
            { value: 'roadmap',  label: 'Hoja de ruta' },
            { value: 'contexto', label: 'Contexto T1/T2' },
            { value: 'reg',      label: '⚖️ AI Act · Mínimo' },
          ]}
        />
        <p className="mt-4 text-sm text-text-muted">
          Tab activo: <strong>{tab}</strong>
        </p>
      </div>
    )
  },
  args: { tabs: [], value: 'scoring', onChange: () => {}, 'aria-label': '' },
}

// ── Pill with many tabs (wraps) ────────────────────────────────

export const PillWithBadges: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [tab, setTab] = useState('bigpicture')
    return (
      <div className="p-6 max-w-xl">
        <Tabs
          aria-label="Rhythm operating model"
          variant="pill"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'bigpicture', label: 'Vista Interactiva',    badge: 12 },
            { value: 'cadencia',   label: 'Cadencia Detallada',   badge: 12 },
            { value: 'objetivos',  label: 'Objetivos por Fase',   badge: 8 },
            { value: 'decisiones', label: 'Decisiones y Escalada',badge: 3 },
            { value: 'kpis',       label: 'Datos a Medir',        badge: 5 },
          ]}
        />
      </div>
    )
  },
  args: { tabs: [], value: 'bigpicture', onChange: () => {}, 'aria-label': '' },
}

// ── Underline ─────────────────────────────────────────────────

export const Underline: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [tab, setTab] = useState('oportunidades')
    return (
      <div className="p-6 max-w-xl">
        <Tabs
          aria-label="Detalle del proceso"
          variant="underline"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'oportunidades', label: 'Oportunidades IA' },
            { value: 'etapas',        label: 'Etapas del proceso' },
          ]}
        />
        <p className="mt-4 text-sm text-text-muted">
          Tab activo: <strong>{tab}</strong>
        </p>
      </div>
    )
  },
  args: { tabs: [], value: 'oportunidades', onChange: () => {}, 'aria-label': '' },
}

// ── Pill: two tabs (T6 pattern) ───────────────────────────────

export const TwoTabsPill: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [tab, setTab] = useState('politica')
    return (
      <div className="p-6">
        <Tabs
          aria-label="Riesgos y gobernanza"
          variant="pill"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'politica', label: '📄 Política IA Corporativa' },
            { value: 'riesgos',  label: '⚖️ Dashboard AI Act', badge: '2 alto' },
          ]}
        />
      </div>
    )
  },
  args: { tabs: [], value: 'politica', onChange: () => {}, 'aria-label': '' },
}
