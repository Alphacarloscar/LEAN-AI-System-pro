// ============================================================
// EditPersonModal — Editar nombre/cargo/departamento de una
// persona de la empresa (company_persons).
//
// Solo accesible para superadmin/consultant — ver CompanyPeopleSection.
// ============================================================

import { useState } from 'react'
import { useCompanyPersonStore, type CompanyPerson } from '../useCompanyPersonStore'
import type { Department } from '../useDepartmentStore'
import { Modal, Button, FormField, Select } from '@shared/design-system/components'
import type { SelectOption } from '@shared/design-system/components'

interface EditPersonModalProps {
  person:      CompanyPerson
  departments: Department[]
  onClose:     () => void
}

const NO_DEPARTMENT = ''

export function EditPersonModal({ person, departments, onClose }: EditPersonModalProps) {
  const { updatePerson, error } = useCompanyPersonStore()
  const [name,       setName]       = useState(person.name)
  const [role,       setRole]       = useState(person.role)
  const [department, setDepartment] = useState(person.department)
  const [isSaving,   setIsSaving]   = useState(false)

  // Legado: si el departamento actual de la persona no está en la lista
  // centralizada (texto libre pre-migración), lo añadimos como opción para
  // no perder el valor guardado al abrir el modal.
  const currentIsKnown = departments.some(
    (d) => d.name.toLowerCase() === person.department.trim().toLowerCase()
  )
  const departmentOptions: SelectOption[] = [
    { value: NO_DEPARTMENT, label: 'Sin departamento' },
    ...departments.map((d) => ({ value: d.name, label: d.name })),
    ...(person.department && !currentIsKnown
      ? [{ value: person.department, label: `${person.department} (no listado)` }]
      : []),
  ]

  const canSave = name.trim().length > 0 && !isSaving

  async function handleSave() {
    setIsSaving(true)
    const updated = await updatePerson(person.id, { name, role, department })
    setIsSaving(false)
    if (updated) onClose()
  }

  return (
    <Modal open={true} onClose={onClose} title="Editar persona" size="sm">
      <div className="space-y-4">
        <FormField
          id="edit-person-name"
          label="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <FormField
          id="edit-person-role"
          label="Cargo"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <Select
          id="edit-person-department"
          label="Departamento"
          options={departmentOptions}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />

        {error && (
          <p className="text-xs text-danger-dark bg-danger-light px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => void handleSave()}
            disabled={!canSave}
            loading={isSaving}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
