import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SegmentedControl } from './SegmentedControl'
import type { SegmentedControlProps } from './SegmentedControl'

const meta = {
  title:     'Design System/SegmentedControl',
  component:  SegmentedControl,
  tags:      ['autodocs'],
  argTypes: {
    size:    { control: 'select', options: ['sm', 'md'] },
    columns: { control: 'number' },
  },
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

// Controlled wrapper since Storybook doesn't manage state
function Controlled(props: Omit<SegmentedControlProps, 'value' | 'onChange'> & { initial?: string }) {
  const [val, setVal] = useState(props.initial ?? props.options[0]?.value ?? '')
  return <SegmentedControl {...props} value={val} onChange={setVal} />
}

// ── 2 opciones (IT / BIZ) ─────────────────────────────────────

export const TwoOptions: Story = {
  render: () => (
    <Controlled
      aria-label="Perfil del entrevistado"
      initial="it"
      options={[
        { value: 'it',       label: 'IT / Tecnología', activeColor: '#2A2822' },
        { value: 'business', label: 'Negocio / Ops',   activeColor: '#5FAF8A' },
      ]}
    />
  ),
  args: { options: [], value: '', onChange: () => {}, 'aria-label': '' },
}

// ── N opciones en grid (arquetipo T2) ─────────────────────────

export const FiveOptionsGrid: Story = {
  render: () => (
    <div className="w-72">
      <Controlled
        aria-label="Arquetipo del stakeholder"
        columns={3}
        initial="adoptador"
        options={[
          { value: 'adoptador',  label: 'Adoptador',  activeColor: '#D4EDE3' },
          { value: 'ambassador', label: 'Ambassador', activeColor: '#DDE8F5' },
          { value: 'decisor',    label: 'Decisor',    activeColor: 'rgba(42,40,34,0.1)' },
          { value: 'critico',    label: 'Crítico',    activeColor: '#F5DEDE' },
          { value: 'reticente',  label: 'Reticente',  activeColor: '#FAF0D7' },
        ]}
      />
    </div>
  ),
  args: { options: [], value: '', onChange: () => {}, 'aria-label': '' },
}

// ── Sin activeColor (token primario por defecto) ───────────────

export const DefaultPrimary: Story = {
  render: () => (
    <Controlled
      aria-label="Fase del proyecto"
      initial="listen"
      options={[
        { value: 'listen',   label: 'Listen' },
        { value: 'explore',  label: 'Explore' },
        { value: 'act',      label: 'Act' },
        { value: 'navigate', label: 'Navigate' },
      ]}
    />
  ),
  args: { options: [], value: '', onChange: () => {}, 'aria-label': '' },
}

// ── size="md" ─────────────────────────────────────────────────

export const SizeMd: Story = {
  render: () => (
    <Controlled
      aria-label="Resistencia al cambio"
      size="md"
      initial="media"
      options={[
        { value: 'baja',  label: 'Baja',  activeColor: '#D4EDE3' },
        { value: 'media', label: 'Media', activeColor: '#FAF0D7' },
        { value: 'alta',  label: 'Alta',  activeColor: '#F5DEDE' },
      ]}
    />
  ),
  args: { options: [], value: '', onChange: () => {}, 'aria-label': '' },
}
