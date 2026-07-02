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
  },
}

// ── With persons (proyecto con personas ya registradas) ─────────

export const WithPersons: Story = {
  args: {
    projectId:  'demo-project-with-persons',
    sourceTool: 't2',
    label:      'Persona',
    onChange:   () => {},
  },
}

// ── New person mode (flujo "+ Nueva persona") ────────────────────

export const NewPersonMode: Story = {
  args: {
    projectId:  'demo-project-new-person',
    sourceTool: 't3',
    label:      'Responsable',
    onChange:   () => {},
  },
}
