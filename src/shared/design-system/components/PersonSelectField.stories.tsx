import type { Meta, StoryObj } from '@storybook/react'
import { PersonSelectField } from './PersonSelectField'

const meta = {
  title:     'Design System/PersonSelectField',
  component:  PersonSelectField,
  tags:      ['autodocs'],
  argTypes: {
    sourceTool: {
      control: 'select',
      options: ['t1', 't2', 't3', 't9', 'company_profile'],
    },
  },
} satisfies Meta<typeof PersonSelectField>

export default meta
type Story = StoryObj<typeof meta>

// ── Empty (sin personas registradas aún) ────────────────────────

export const Empty: Story = {
  args: {
    projectId:  'demo-project-empty',
    sourceTool: 't2',
    label:      'Persona',
    onChange:   () => {},
    onCreateNew: () => {},
  },
}

// ── With persons (proyecto con personas ya registradas) ─────────

export const WithPersons: Story = {
  args: {
    projectId:  'demo-project-with-persons',
    sourceTool: 't2',
    label:      'Persona',
    onChange:   () => {},
    onCreateNew: () => {},
  },
}

// ── New person mode (flujo "+ Nueva persona") ────────────────────
// El padre habilita sus propios campos de Nombre/Cargo/Departamento
// cuando isCreatingNew=true — PersonSelectField ya no los duplica.

export const NewPersonMode: Story = {
  args: {
    projectId:  'demo-project-new-person',
    sourceTool: 't3',
    label:      'Responsable',
    isCreatingNew: true,
    onChange:   () => {},
    onCreateNew: () => {},
  },
}
