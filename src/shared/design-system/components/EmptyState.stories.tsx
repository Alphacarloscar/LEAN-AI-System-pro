import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from './EmptyState'
import { Button } from './Button'

// Minimal inline SVG icons — no external dependency
const IconChart = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18M7 16l4-4 4 4 4-4" />
  </svg>
)

const IconFolder = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
)

const IconSearch = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5L21 21" />
  </svg>
)

const meta = {
  title:     'Design System/EmptyState',
  component:  EmptyState,
  tags:      ['autodocs'],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon:        IconChart,
    title:       'Sin datos todavía',
    description: 'Completa el Radar de Madurez para que el sistema pueda calcular los indicadores.',
  },
}

export const WithAction: Story = {
  args: {
    icon:        IconFolder,
    title:       'No hay proyectos',
    description: 'Crea tu primer proyecto para comenzar el diagnóstico de madurez IA.',
    action:      <Button size="sm">Crear proyecto</Button>,
  },
}

export const SearchNoResults: Story = {
  args: {
    icon:        IconSearch,
    title:       'Sin resultados',
    description: 'No se encontraron casos de uso que coincidan con tu búsqueda.',
    action:      <Button variant="ghost" size="sm">Limpiar filtros</Button>,
  },
}

export const NoIcon: Story = {
  args: {
    title:       'Esta sección está vacía',
    description: 'Aquí aparecerán los datos una vez que el consultor los complete.',
  },
}
