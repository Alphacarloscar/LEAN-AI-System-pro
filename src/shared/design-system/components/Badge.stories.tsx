import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta = {
  title:     'Design System/Badge',
  component:  Badge,
  tags:      ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger', 'info', 'navy', 'navy-ghost', 'gold'],
    },
    shape: { control: 'select',   options: ['rounded', 'pill'] },
    size:  { control: 'select',   options: ['xs', 'sm', 'md'] },
    dot:   { control: 'boolean' },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// ── Color variants ────────────────────────────────────────────

export const Default: Story = {
  args: { variant: 'default', children: 'Borrador' },
}

export const Success: Story = {
  args: { variant: 'success', children: 'Completado' },
}

export const Warning: Story = {
  args: { variant: 'warning', children: 'En revisión' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Bloqueado' },
}

export const Info: Story = {
  args: { variant: 'info', children: 'En progreso' },
}

export const Navy: Story = {
  args: { variant: 'navy', children: 'IA Activa' },
}

export const NavyGhost: Story = {
  args: { variant: 'navy-ghost', size: 'xs', children: 'T9', className: 'rounded-md font-mono uppercase tracking-wider' },
}

export const Gold: Story = {
  args: { variant: 'gold', children: 'LEAN Gold' },
}

// ── Shapes ────────────────────────────────────────────────────

export const Pill: Story = {
  args: { shape: 'pill', variant: 'success', children: '98 / 100' },
}

// ── Sizes ─────────────────────────────────────────────────────

export const ExtraSmall: Story = {
  args: { size: 'xs', variant: 'success', shape: 'pill', children: 'Adoptador' },
}

export const Medium: Story = {
  args: { size: 'md', children: 'Tamaño medio' },
}

// ── With dot ──────────────────────────────────────────────────

export const WithDot: Story = {
  args: { dot: true, variant: 'success', children: 'En línea' },
}

export const WithDotWarning: Story = {
  args: { dot: true, variant: 'warning', children: 'Degradado' },
}

// ── All variants at once (for visual review) ──────────────────

export const AllVariants: Story = {
  args: { children: '' },
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['default', 'success', 'warning', 'danger', 'info', 'navy', 'navy-ghost', 'gold'] as const).map(
        (v) => <Badge key={v} variant={v}>{v}</Badge>
      )}
    </div>
  ),
}
