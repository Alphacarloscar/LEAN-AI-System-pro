import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title:     'Design System/Button',
  component:  Button,
  tags:      ['autodocs'],
  argTypes: {
    variant:   { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger', 'link'] },
    size:      { control: 'select', options: ['xs', 'sm', 'md', 'lg'] },
    loading:   { control: 'boolean' },
    disabled:  { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// ── Variants ──────────────────────────────────────────────────

export const Primary: Story = {
  args: { variant: 'primary', children: 'Guardar cambios' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancelar' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ver detalles' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Eliminar registro' },
}

// ── States ────────────────────────────────────────────────────

export const Loading: Story = {
  args: { variant: 'primary', loading: true, children: 'Guardando…' },
}

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'No disponible' },
}

// ── Sizes ─────────────────────────────────────────────────────

export const ExtraSmall: Story = {
  args: { size: 'xs', children: 'Iniciar entrevista' },
}

export const Small: Story = {
  args: { size: 'sm', children: 'Pequeño' },
}

export const Large: Story = {
  args: { size: 'lg', children: 'Grande' },
}

// ── Icon ──────────────────────────────────────────────────────

export const WithIcon: Story = {
  args: { icon: '＋', children: 'Nueva entrevista' },
}

export const WithIconRight: Story = {
  args: { children: 'Exportar', iconRight: '↗' },
}

export const IconOnly: Story = {
  args: { 'aria-label': 'Añadir elemento', icon: '＋' },
}

// ── Layout ────────────────────────────────────────────────────

export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Iniciar diagnóstico' },
}

// ── Link variant ──────────────────────────────────────────────

export const Link: Story = {
  args: {
    variant:  'link',
    children: 'Ver criterios por nivel',
  },
}

export const LinkWithIcon: Story = {
  args: {
    variant:  'link',
    children: 'Añadir nota',
    icon: (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
           stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h12M2 8h8M2 12h10" />
      </svg>
    ),
  },
}

export const LinkInline: Story = {
  args: { variant: 'link', children: 'ver criterios por nivel' },
  render: () => (
    <p className="text-sm text-text-muted leading-relaxed">
      Puntúa las subdimensiones y luego{' '}
      <Button variant="link">ver criterios por nivel</Button>
      {' '}para entender la escala 0-4 aplicada a cada indicador.
    </p>
  ),
}

export const LinkDisabled: Story = {
  args: {
    variant:  'link',
    disabled: true,
    children: 'Acción no disponible',
  },
}
