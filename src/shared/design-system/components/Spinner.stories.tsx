import type { Meta, StoryObj } from '@storybook/react'
import { Spinner } from './Spinner'

const meta = {
  title:     'Design System/Spinner',
  component:  Spinner,
  tags:      ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { size: 'md' },
}

export const Small: Story = {
  args: { size: 'sm', label: 'Guardando…' },
}

export const Large: Story = {
  args: { size: 'lg', label: 'Procesando análisis…' },
}

export const AllSizes: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner size="sm" label="sm" />
      <Spinner size="md" label="md" />
      <Spinner size="lg" label="lg" />
    </div>
  ),
}

export const InContext: Story = {
  args: {},
  render: () => (
    <div className="flex items-center gap-2 text-sm text-text-muted">
      <Spinner size="sm" />
      <span>Cargando resultados…</span>
    </div>
  ),
}
