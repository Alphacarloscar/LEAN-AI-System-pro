// ============================================================
// T9 — AddFreeItemForm
//
// Formulario inline para añadir iniciativas libres al roadmap.
// ============================================================

import { useForm, Controller }         from 'react-hook-form'
import { zodResolver }                 from '@hookform/resolvers/zod'
import { Card, Button, FormField, PersonSelectField } from '@shared/design-system/components'
import type { CompanyPerson }          from '@/modules/CompanyProfile/useCompanyPersonStore'
import { useUnsavedGuard }             from '@/shared/hooks/useUnsavedGuard'
import { AddFreeItemSchema }           from '@/lib/schemas/t9.schemas'
import type { AddFreeItemFormValues }  from '@/lib/schemas/t9.schemas'
import { MONTH_NAMES }                 from '../t9GanttHelpers'

const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({ value: i, label: name }))

const SELECT_CLS =
  'w-full text-xs border border-border dark:border-white/10 rounded-lg px-3 py-1.5 bg-white dark:bg-warm-700 text-lean-black dark:text-warm-50 outline-none focus:ring-1 focus:ring-gold/20 focus:border-gold'

interface AddFormProps {
  onSave:    (data: AddFreeItemFormValues) => void
  onCancel:  () => void
  projectId: string
}

export function AddFreeItemForm({ onSave, onCancel, projectId }: AddFormProps) {
  const { register, handleSubmit, control, watch, setValue, formState } =
    useForm<AddFreeItemFormValues>({
      resolver: zodResolver(AddFreeItemSchema),
      defaultValues: {
        name:        '',
        department:  '',
        responsible: '',
        startMonth:  0,
        endMonth:    1,
        riskLevel:   'bajo',
        status:      'pendiente',
      },
    })

  useUnsavedGuard(formState.isDirty, 'T9_AddFreeItem')

  const startMonth = watch('startMonth')

  function handlePersonSelected(_personId: string, person: CompanyPerson) {
    setValue('responsible', person.name, { shouldValidate: true, shouldDirty: true })
    if (person.department) setValue('department', person.department, { shouldValidate: true, shouldDirty: true })
  }

  return (
    <Card variant="flat" padding="none" className="border-t border-border dark:border-white/6 px-5 py-4 bg-warm-50 dark:bg-warm-800/60">
      <p className="text-xs font-medium text-lean-black dark:text-warm-50 mb-3">
        Nueva iniciativa libre
      </p>

      <form onSubmit={handleSubmit(onSave)}>
        <div className="mb-3">
          <PersonSelectField
            projectId={projectId}
            sourceTool="t9"
            label="Responsable"
            onChange={handlePersonSelected}
          />
        </div>

        <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {/* Nombre — ocupa 2 columnas */}
          <div style={{ gridColumn: '1 / 3' }}>
            <FormField
              id="free-item-name"
              label="Nombre de la iniciativa *"
              placeholder="Ej: Migración ERP, Formación interna..."
              {...register('name')}
              error={formState.errors.name?.message}
            />
          </div>

          <div>
            <FormField
              id="free-item-department"
              label="Departamento"
              placeholder="IT, RRHH, Finanzas..."
              {...register('department')}
            />
          </div>

          <div>
            <FormField
              id="free-item-responsible"
              label="Responsable (texto libre)"
              placeholder="Nombre y apellido"
              {...register('responsible')}
            />
          </div>

          <div>
            <label className="text-[10px] text-text-muted block mb-1">Mes inicio</label>
            <Controller
              name="startMonth"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className={SELECT_CLS}
                >
                  {MONTH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
            <label className="text-[10px] text-text-muted block mb-1">Mes fin</label>
            <Controller
              name="endMonth"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className={SELECT_CLS}
                >
                  {MONTH_OPTIONS.filter((o) => o.value >= startMonth).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
            <label className="text-[10px] text-text-muted block mb-1">Nivel de riesgo</label>
            <select {...register('riskLevel')} className={SELECT_CLS}>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto">Alto</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-text-muted block mb-1">Estado</label>
            <select {...register('status')} className={SELECT_CLS}>
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
              <option value="completado">Completado</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" variant="primary" size="sm">
            Añadir al roadmap
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
