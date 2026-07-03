// ============================================================
// NewInterviewModal — Modal to add a new interviewee to T1
// ============================================================

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal, Button, FormField, PersonSelectField } from '@/shared/design-system/components'
import type { CompanyPerson } from '@/modules/CompanyProfile/useCompanyPersonStore'
import type { DepartmentType } from '@/modules/CompanyProfile/useDepartmentStore'
import { DEPARTMENT_TYPE_ICON, DEPARTMENT_TYPE_LABEL } from '@/modules/CompanyProfile/departmentDisplay'
import { TOTAL_SUBDIMENSIONS } from '../constants'
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard'
import { newIntervieweeSchema, type NewIntervieweeFormValues } from './NewInterviewModal.schema'

// Re-export for backwards compatibility with T1View's onSubmit signature
export type { NewIntervieweeFormValues as NewIntervieweeForm }

// T1 clasifica el perfil como 'it' | 'business'; company_departments usa
// 'it' | 'negocio_ops' — mapeo entre ambos vocabularios.
const DEPARTMENT_TYPE_TO_T1_TYPE: Record<DepartmentType, 'it' | 'business'> = {
  it:          'it',
  negocio_ops: 'business',
}

interface NewInterviewModalProps {
  onClose:     () => void
  onSubmit:    (form: NewIntervieweeFormValues) => Promise<void>
  departments: { name: string; type: DepartmentType }[]
  projectId:   string
}

export function NewInterviewModal({ onClose, onSubmit, departments, projectId }: NewInterviewModalProps) {
  // 'personSelected' habilita Nombre/Cargo/Departamento: al elegir una persona
  // existente (personId conocido) o al iniciar el alta de una nueva (isCreatingNew).
  const [personSelected, setPersonSelected] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>(undefined)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<NewIntervieweeFormValues>({
    resolver:      zodResolver(newIntervieweeSchema),
    defaultValues: {
      name:       '',
      role:       '',
      type:       'business',
      department: '',
      personId:   null,
    },
  })

  const selectedDepartment = watch('department')
  const derivedType = departments.find((d) => d.name === selectedDepartment)?.type

  function handlePersonSelected(personId: string, person: CompanyPerson) {
    setValue('name', person.name, { shouldValidate: true, shouldDirty: true })
    setValue('role', person.role, { shouldValidate: true, shouldDirty: true })
    if (person.department) setValue('department', person.department, { shouldValidate: true, shouldDirty: true })
    setValue('personId', personId)
    setIsCreatingNew(false)
    setPersonSelected(true)
    setSelectedPersonId(personId)
  }

  function handleCreateNew() {
    // Limpia cualquier persona seleccionada previamente — los campos pasan
    // a capturar los datos de la persona nueva, sin duplicar formularios.
    reset({ name: '', role: '', type: 'business', department: '', personId: null })
    setSelectedPersonId(undefined)
    setIsCreatingNew(true)
    setPersonSelected(true)
  }

  function handleDepartmentChange(deptName: string) {
    setValue('department', deptName, { shouldValidate: true, shouldDirty: true })
  }

  // Protege los datos introducidos si el usuario intenta cerrar el modal
  // navegando fuera del engagement (isDirty = hay texto en algún campo)
  useUnsavedGuard(isDirty, 'T1_NewInterview')

  async function onValid(values: NewIntervieweeFormValues) {
    // 'type' se deriva del departamento elegido, nunca lo edita el usuario directamente
    const type = derivedType ? DEPARTMENT_TYPE_TO_T1_TYPE[derivedType] : values.type
    // La lógica de persistencia (upsertAllScoresForInterviewee) queda intacta en el padre.
    // personId viaja para que el padre solo cree la persona en company_persons si es nueva.
    await onSubmit({ ...values, type })
  }

  return (
    <Modal open={true} onClose={onClose} title="Nueva entrevista" size="sm">
      <p className="text-[11px] text-text-subtle -mt-1 mb-3">
        Añade un nuevo entrevistado al assessment en curso
      </p>
      <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">

        <PersonSelectField
          projectId={projectId}
          selectedPersonId={selectedPersonId}
          isCreatingNew={isCreatingNew}
          sourceTool="t1"
          label="Persona"
          onChange={handlePersonSelected}
          onCreateNew={handleCreateNew}
        />
        {isCreatingNew && (
          <p className="text-[11px] text-text-subtle -mt-2">
            Rellena los datos de la nueva persona abajo.
          </p>
        )}

        <FormField
          id="new-interviewee-name"
          label="Nombre"
          type="text"
          {...register('name')}
          placeholder="Ej. Javier Morales"
          required
          disabled={!isCreatingNew}
          error={errors.name?.message}
        />

        <FormField
          id="new-interviewee-role"
          label="Cargo"
          type="text"
          {...register('role')}
          placeholder="Ej. CIO, Head of Digital, COO…"
          required
          disabled={!isCreatingNew}
          error={errors.role?.message}
        />

        {/* Departamento */}
        {departments.length > 0 ? (
          <div className="space-y-1.5">
            <label
              htmlFor="new-interviewee-dept"
              className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle"
            >
              Departamento <span className="text-danger-dark" aria-hidden="true">*</span>
            </label>
            <select
              id="new-interviewee-dept"
              {...register('department', { onChange: (e) => handleDepartmentChange(e.target.value) })}
              disabled={!isCreatingNew}
              aria-invalid={!!errors.department}
              aria-describedby={errors.department ? 'dept-error' : undefined}
              className={[
                'w-full px-3 py-2 rounded-lg text-sm text-lean-black dark:text-warm-50',
                'bg-warm-50 dark:bg-warm-700 border transition-all duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                errors.department
                  ? 'border-danger focus:outline-none focus:ring-2 focus:ring-danger/20'
                  : 'border-border focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40',
              ].join(' ')}
            >
              <option value="">Selecciona un departamento…</option>
              {departments.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
            {errors.department && (
              <p id="dept-error" role="alert" className="text-xs text-danger dark:text-danger-soft">
                {errors.department.message}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-warning-dark bg-warning-light border border-warning/30 rounded-lg px-3 py-2">
            Esta empresa no tiene departamentos configurados. Ve a{' '}
            <span className="font-semibold">Perfil de empresa → Departamentos</span>{' '}
            para crearlos antes de añadir un entrevistado.
          </p>
        )}

        {/* Perfil — puramente informativo, se arrastra del departamento elegido */}
        {derivedType && (
          <div className="space-y-1.5">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle">
              Perfil
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border dark:border-white/8 bg-warm-50 dark:bg-warm-700 text-text-muted dark:text-warm-300">
              {(() => {
                const TypeIcon = DEPARTMENT_TYPE_ICON[derivedType]
                return <TypeIcon size={12} strokeWidth={1.5} aria-hidden="true" />
              })()}
              {DEPARTMENT_TYPE_LABEL[derivedType]}
            </div>
          </div>
        )}

        <p className="text-[11px] text-text-subtle px-3 py-2 rounded-lg bg-warm-50 dark:bg-warm-700/50 border border-border/60">
          Se crearán <span className="font-medium text-text-muted">{TOTAL_SUBDIMENSIONS} subdimensiones</span> en blanco para este entrevistado. Puntúalas en la sesión.
        </p>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={departments.length === 0 || !personSelected}
            className="flex-1"
          >
            Crear entrevista
          </Button>
        </div>
      </form>
    </Modal>
  )
}
