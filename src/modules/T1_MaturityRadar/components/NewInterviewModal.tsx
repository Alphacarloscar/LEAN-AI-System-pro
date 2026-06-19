// ============================================================
// NewInterviewModal — Modal to add a new interviewee to T1
// ============================================================

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal, Button, FormField, SegmentedControl } from '@/shared/design-system/components'
import { TOTAL_SUBDIMENSIONS } from '../constants'
import { useUnsavedGuard } from '@/shared/hooks/useUnsavedGuard'
import { newIntervieweeSchema, type NewIntervieweeFormValues } from './NewInterviewModal.schema'

// Re-export for backwards compatibility with T1View's onSubmit signature
export type { NewIntervieweeFormValues as NewIntervieweeForm }

interface NewInterviewModalProps {
  onClose:     () => void
  onSubmit:    (form: NewIntervieweeFormValues) => Promise<void>
  departments: { name: string }[]
}

export function NewInterviewModal({ onClose, onSubmit, departments }: NewInterviewModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<NewIntervieweeFormValues>({
    resolver:      zodResolver(newIntervieweeSchema),
    defaultValues: {
      name:       '',
      role:       '',
      type:       'business',
      department: '',
    },
  })

  // Protege los datos introducidos si el usuario intenta cerrar el modal
  // navegando fuera del engagement (isDirty = hay texto en algún campo)
  useUnsavedGuard(isDirty, 'T1_NewInterview')

  async function onValid(values: NewIntervieweeFormValues) {
    // La lógica de persistencia (upsertAllScoresForInterviewee) queda intacta en el padre
    await onSubmit(values)
  }

  return (
    <Modal open={true} onClose={onClose} title="Nueva entrevista" size="sm">
      <p className="text-[11px] text-text-subtle -mt-1 mb-3">
        Añade un nuevo entrevistado al assessment en curso
      </p>
      <form onSubmit={handleSubmit(onValid)} noValidate className="space-y-4">

        <FormField
          id="new-interviewee-name"
          label="Nombre"
          type="text"
          {...register('name')}
          placeholder="Ej. Javier Morales"
          required
          error={errors.name?.message}
        />

        <FormField
          id="new-interviewee-role"
          label="Cargo"
          type="text"
          {...register('role')}
          placeholder="Ej. CIO, Head of Digital, COO…"
          required
          error={errors.role?.message}
        />

        {/* Tipo IT / Negocio — controlado porque SegmentedControl no es un input nativo */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle">
            Perfil
          </span>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <SegmentedControl
                aria-label="Perfil del entrevistado"
                value={field.value}
                onChange={(v) => field.onChange(v as 'it' | 'business')}
                options={[
                  { value: 'it',       label: 'IT / Tecnología', activeColor: '#2A2822' },
                  { value: 'business', label: 'Negocio / Ops',   activeColor: '#5FAF8A' },
                ]}
              />
            )}
          />
          {errors.type && (
            <p className="text-xs text-danger dark:text-danger-soft" role="alert">
              {errors.type.message}
            </p>
          )}
        </div>

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
              {...register('department')}
              aria-invalid={!!errors.department}
              aria-describedby={errors.department ? 'dept-error' : undefined}
              className={[
                'w-full px-3 py-2 rounded-lg text-sm text-lean-black dark:text-gray-100',
                'bg-gray-50 dark:bg-gray-800 border transition-all duration-150',
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
          <FormField
            id="new-interviewee-dept"
            label="Departamento"
            type="text"
            {...register('department')}
            placeholder="Ej. Finanzas, Tecnología, RRHH…"
            required
            error={errors.department?.message}
          />
        )}

        <p className="text-[11px] text-text-subtle px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-border/60">
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
            className="flex-1"
          >
            Crear entrevista
          </Button>
        </div>
      </form>
    </Modal>
  )
}
