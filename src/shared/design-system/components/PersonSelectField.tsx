import { useEffect, useState } from 'react'
import { Select }  from './Select'
import { FormField } from './FormField'
import { Badge }    from './Badge'
import { Button }  from './Button'
import { useCompanyPersonStore, type CompanyPerson, type SourceTool } from '@/modules/CompanyProfile/useCompanyPersonStore'

const NEW_PERSON_VALUE = '__new__'

export interface PersonSelectFieldProps {
  projectId:         string
  companyId?:        string
  selectedPersonId?: string
  onChange:          (personId: string, person: CompanyPerson) => void
  sourceTool:        SourceTool
  label?:            string
}

export function PersonSelectField({
  projectId,
  companyId,
  selectedPersonId,
  onChange,
  sourceTool,
  label = 'Persona',
}: PersonSelectFieldProps) {
  const { persons, fetchPersons, addPerson } = useCompanyPersonStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName]       = useState('')
  const [newRole, setNewRole]       = useState('')
  const [newDept, setNewDept]       = useState('')

  useEffect(() => {
    void fetchPersons(projectId)
  }, [projectId, fetchPersons])

  const selectedPerson = persons.find((p) => p.id === selectedPersonId)

  const options = [
    ...persons.map((p) => ({ value: p.id, label: p.name })),
    { value: NEW_PERSON_VALUE, label: '+ Nueva persona' },
  ]

  const handleSelectChange = (value: string) => {
    if (value === NEW_PERSON_VALUE) {
      setIsCreating(true)
      return
    }
    setIsCreating(false)
    const person = persons.find((p) => p.id === value)
    if (person) onChange(person.id, person)
  }

  const handleConfirmNewPerson = async () => {
    const created = await addPerson({
      projectId,
      companyId,
      name:       newName,
      role:       newRole,
      department: newDept,
      sourceTool,
    })
    if (created) {
      setIsCreating(false)
      setNewName('')
      setNewRole('')
      setNewDept('')
      onChange(created.id, created)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Select
        id="person-select"
        label={label}
        placeholder="Selecciona una persona"
        options={options}
        value={isCreating ? NEW_PERSON_VALUE : (selectedPersonId ?? '')}
        onChange={(e) => handleSelectChange(e.target.value)}
      />

      {selectedPerson && !isCreating && (
        <div className="flex flex-wrap items-end gap-3">
          <FormField id="person-role" label="Cargo" value={selectedPerson.role} disabled readOnly />
          <FormField id="person-department" label="Departamento" value={selectedPerson.department} disabled readOnly />
          <Badge variant="navy-ghost" size="xs" className="rounded-md font-mono uppercase tracking-wider">
            {selectedPerson.source_tool}
          </Badge>
        </div>
      )}

      {isCreating && (
        <div className="flex flex-col gap-3 rounded border border-border p-3 dark:border-warm-600">
          <FormField
            id="new-person-name"
            label="Nombre completo"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <FormField
            id="new-person-role"
            label="Cargo"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          />
          <FormField
            id="new-person-department"
            label="Departamento"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void handleConfirmNewPerson()}
            disabled={!newName.trim()}
          >
            Guardar persona
          </Button>
        </div>
      )}
    </div>
  )
}
