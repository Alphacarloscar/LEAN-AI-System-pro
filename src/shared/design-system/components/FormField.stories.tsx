import type { Meta, StoryObj } from '@storybook/react'
import { FormField } from './FormField'

const meta = {
  title:     'Design System/FormField',
  component:  FormField,
  tags:      ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
    multiline: { control: 'boolean' },
    disabled:  { control: 'boolean' },
    required:  { control: 'boolean' },
  },
} satisfies Meta<typeof FormField>

export default meta
type Story = StoryObj<typeof meta>

// ── Default ───────────────────────────────────────────────────

export const Default: Story = {
  args: {
    id:          'company-name',
    label:       'Nombre de la empresa',
    placeholder: 'Ej. Acme Corporation S.L.',
  },
}

// ── With hint ─────────────────────────────────────────────────

export const WithHint: Story = {
  args: {
    id:          'email',
    label:       'Correo electrónico',
    type:        'email',
    placeholder: 'nombre@empresa.com',
    hint:        'Recibirás el informe en esta dirección.',
  },
}

// ── With error ────────────────────────────────────────────────

export const WithError: Story = {
  args: {
    id:          'sector',
    label:       'Sector',
    placeholder: 'Ej. Manufactura',
    error:       'El sector es obligatorio para generar el diagnóstico.',
  },
}

// ── Required ──────────────────────────────────────────────────

export const Required: Story = {
  args: {
    id:          'project-name',
    label:       'Nombre del proyecto',
    placeholder: 'Ej. GOBY — Diagnóstico inicial',
    required:    true,
  },
}

// ── Disabled ──────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    id:       'readonly-field',
    label:    'Identificador',
    value:    'PROJ-2024-001',
    disabled: true,
  },
}

// ── Password ──────────────────────────────────────────────────

export const Password: Story = {
  args: {
    id:          'password',
    label:       'Nueva contraseña',
    type:        'password',
    placeholder: '••••••••',
    hint:        'Mínimo 8 caracteres.',
  },
}

// ── No label (for embedded use) ───────────────────────────────

export const NoLabel: Story = {
  args: {
    id:          'search',
    type:        'text',
    placeholder: 'Buscar empresa…',
  },
}

// ── Multiline (textarea) ──────────────────────────────────────

export const Multiline: Story = {
  args: {
    id:          'observations',
    label:       'Observaciones',
    multiline:   true,
    rows:        4,
    placeholder: 'Escribe aquí las observaciones de la sesión…',
    hint:        'El campo se guarda automáticamente.',
  },
}

export const MultilineWithError: Story = {
  args: {
    id:          'description',
    label:       'Descripción del caso de uso',
    multiline:   true,
    rows:        3,
    placeholder: 'Describe el caso de uso en detalle…',
    error:       'La descripción es obligatoria para continuar.',
    required:    true,
  },
}
