import { useEffect } from 'react'
import { Select }  from './Select'
import { useCompanyPersonStore, type CompanyPerson, type SourceTool } from '@/modules/CompanyProfile/useCompanyPersonStore'

const NEW_PERSON_VALUE = '__new__'

export interface PersonSelectFieldProps {
  projectId:         string
  selectedPersonId?: string
  /** true mientras el usuario está en el flujo "+ Nueva persona" (aún sin guardar) */
  isCreatingNew?:    boolean
  onChange:          (personId: string, person: CompanyPerson) => void
  /** Se dispara al elegir "+ Nueva persona" — el padre habilita sus propios campos para capturarla. */
  onCreateNew:       () => void
  sourceTool:        SourceTool
  label?:            string
}

/**
 * Selector puro de persona — no crea personas por sí mismo. Al elegir
 * "+ Nueva persona" delega en el padre (onCreateNew), que reutiliza sus
 * propios campos de Nombre/Cargo/Departamento para capturar los datos y
 * decide cuándo persistirlos (evita un doble formulario).
 */
export function PersonSelectField({
  projectId,
  selectedPersonId,
  isCreatingNew = false,
  onChange,
  onCreateNew,
  label = 'Persona',
}: PersonSelectFieldProps) {
  const { persons, fetchPersons } = useCompanyPersonStore()

  useEffect(() => {
    void fetchPersons(projectId)
  }, [projectId, fetchPersons])

  const options = [
    ...persons.map((p) => ({ value: p.id, label: p.name })),
    { value: NEW_PERSON_VALUE, label: '+ Nueva persona' },
  ]

  const handleSelectChange = (value: string) => {
    if (value === NEW_PERSON_VALUE) {
      onCreateNew()
      return
    }
    const person = persons.find((p) => p.id === value)
    if (person) onChange(person.id, person)
  }

  return (
    <Select
      id="person-select"
      label={label}
      placeholder="Selecciona una persona"
      options={options}
      value={isCreatingNew ? NEW_PERSON_VALUE : (selectedPersonId ?? '')}
      onChange={(e) => handleSelectChange(e.target.value)}
    />
  )
}
