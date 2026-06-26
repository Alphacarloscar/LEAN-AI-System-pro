import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './Card'

const meta = {
  title:     'Design System/Card',
  component:  Card,
  tags:      ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['outlined', 'elevated', 'flat'] },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// ── Variants ──────────────────────────────────────────────────

export const Outlined: Story = {
  args: {
    variant:  'outlined',
    children: 'Contenido del card con borde visible y sin sombra.',
  },
}

export const Elevated: Story = {
  args: {
    variant:  'elevated',
    children: 'Contenido del card elevado con sombra, sin borde visible.',
  },
}

export const Flat: Story = {
  args: {
    variant:  'flat',
    children: 'Contenido plano, sin borde ni sombra. Útil dentro de otros cards.',
  },
}

// ── With header and footer ────────────────────────────────────

export const WithHeaderFooter: Story = {
  args: {
    header:   'Diagnóstico de madurez',
    children: 'Puntuación global: 3.2 / 5.0 — Nivel Definido.',
    footer:   'Última actualización: 03 jun 2026',
  },
}

// ── Padding sizes ─────────────────────────────────────────────

export const PaddingSm: Story = {
  args: { padding: 'sm', children: 'Padding pequeño (p-4).' },
}

export const PaddingLg: Story = {
  args: { padding: 'lg', children: 'Padding grande (p-8).' },
}

export const NoPadding: Story = {
  args: { padding: 'none', children: 'Sin padding — útil para tablas o listas a borde.' },
}
