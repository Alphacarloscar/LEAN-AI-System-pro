import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Modal } from './Modal'
import { Button } from './Button'

const meta = {
  title:     'Design System/Modal',
  component:  Modal,
  tags:      ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl', 'full'] },
    closeOnOverlay: { control: 'boolean' },
  },
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

// ── Siempre abierto para canvas ───────────────────────────────

export const Default: Story = {
  args: {
    open:     true,
    title:    'Confirmar acción',
    children: 'Esta acción no se puede deshacer. ¿Deseas continuar?',
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancelar</Button>
        <Button variant="danger">Eliminar</Button>
      </div>
    ),
  },
}

export const NoTitle: Story = {
  args: {
    open:        true,
    description: 'Diálogo sin título con descripción para lectores de pantalla.',
    children:    'El contenido ocupa todo el espacio sin cabecera.',
  },
}

export const Large: Story = {
  args: {
    open:     true,
    title:    'Importar desde T1 — Radar de Madurez',
    size:     'lg',
    children: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted">Selecciona las dimensiones que deseas importar.</p>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <span className="text-sm font-medium">Dimensión {i + 1}</span>
          </div>
        ))}
      </div>
    ),
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Cancelar</Button>
        <Button>Importar selección</Button>
      </div>
    ),
  },
}

export const NoOverlayClose: Story = {
  args: {
    open:           true,
    title:          'Acción obligatoria',
    closeOnOverlay: false,
    children:       'No puedes cerrar este modal haciendo clic fuera. Usa el botón × o Escape.',
  },
}

// ── Interactivo con toggle ─────────────────────────────────────

export const WithTrigger: Story = {
  args: {
    open:     false,
    title:    'Modal interactivo',
    children: 'Abre y cierra con el botón de abajo. El foco vuelve al botón al cerrar.',
  },
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div className="p-8">
        <Button onClick={() => setOpen(true)}>Abrir modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)} />
      </div>
    )
  },
}
