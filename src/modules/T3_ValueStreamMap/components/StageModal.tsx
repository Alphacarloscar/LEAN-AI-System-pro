// ============================================================
// StageModal — Add/Edit/Delete stage modal for T3 StagesTab
// ============================================================

import { useForm, Controller }            from 'react-hook-form'
import { zodResolver }                    from '@hookform/resolvers/zod'
import { stageFormSchema, type StageFormValues } from '@/lib/schemas/t3.schemas'
import { useT3Store }                     from '../store'
import { useEngagementStore }             from '@/modules/Engagement/store'
import { useDepartmentStore }             from '@/modules/CompanyProfile/useDepartmentStore'
import { useUnsavedGuard }                from '@/shared/hooks/useUnsavedGuard'
import { Modal, Button, FormField, SegmentedControl } from '@shared/design-system/components'
import { Select }                         from '@/shared/design-system/components/Select'
import type { SelectOption }              from '@/shared/design-system/components/Select'
import { T3_VALUE_BAR_COLORS, T3_VALUE_ACTIVE_BG } from '@shared/design-system/charts/chartTokens'
import type { ProcessStage }              from '../types'

// ── Paleta de valor ──────────────────────────────────────────

const VALUE_CONFIG = {
  alta:  { label: 'Valor alto',  barColor: T3_VALUE_BAR_COLORS.alta,  chipBg: 'bg-success-light',  chipText: 'text-success-dark'  },
  media: { label: 'Valor medio', barColor: T3_VALUE_BAR_COLORS.media, chipBg: 'bg-info-light',     chipText: 'text-info-dark'     },
  baja:  { label: 'Valor bajo',  barColor: T3_VALUE_BAR_COLORS.baja,  chipBg: 'bg-warning-light',  chipText: 'text-warning-dark'  },
  nula:  { label: 'Sin valor',   barColor: T3_VALUE_BAR_COLORS.nula,  chipBg: 'bg-danger-light',   chipText: 'text-danger-dark'   },
} as const

const VALUE_ACTIVE_COLOR: Record<ProcessStage['valueContribution'], string> = T3_VALUE_ACTIVE_BG

interface StageModalProps {
  processId: string
  stage?:    ProcessStage
  onClose:   () => void
}

export function StageModal({ processId, stage, onClose }: StageModalProps) {
  const { addStage, updateStage, removeStage } = useT3Store()
  const engagementId = useEngagementStore((s) => s.activeEngagementId)

  const { departments, isLoading: isLoadingDepts } = useDepartmentStore()
  const deptOptions: SelectOption[] = departments.map((d) => ({ value: d.name, label: d.name }))
  const hasDepts = deptOptions.length > 0

  const isEdit = !!stage

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<StageFormValues>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: stage
      ? {
          name:              stage.name,
          responsible:       stage.responsible       ?? '',
          department:        stage.department        ?? '',
          system:            stage.system            ?? '',
          procTimeHours:     stage.procTimeHours,
          waitTimeHours:     stage.waitTimeHours,
          handoffs:          stage.handoffs,
          valueContribution: stage.valueContribution,
          notes:             stage.notes             ?? '',
        }
      : {
          name:              '',
          responsible:       '',
          department:        '',
          system:            '',
          procTimeHours:     0.5,
          waitTimeHours:     1,
          handoffs:          0,
          valueContribution: 'media',
          notes:             '',
        },
  })

  useUnsavedGuard(isDirty, 'T3_StageModal')

  function onValid(data: StageFormValues) {
    const payload = {
      name:              data.name.trim(),
      responsible:       data.responsible  || undefined,
      department:        data.department   || undefined,
      system:            data.system       || undefined,
      procTimeHours:     data.procTimeHours,
      waitTimeHours:     data.waitTimeHours,
      handoffs:          data.handoffs,
      valueContribution: data.valueContribution,
      notes:             data.notes        || undefined,
    }
    if (isEdit) updateStage(processId, stage!.id, payload, engagementId)
    else        addStage(processId, payload, engagementId)
    onClose()
  }

  function handleDelete() {
    if (!stage) return
    removeStage(processId, stage.id, engagementId)
    onClose()
  }

  const footer = (
    <div className="flex items-center justify-between">
      {isEdit ? (
        <Button variant="danger" size="sm" onClick={handleDelete}>
          Eliminar etapa
        </Button>
      ) : <div />}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" size="sm" type="submit" form="stage-form">
          {isEdit ? 'Guardar cambios' : 'Añadir etapa'}
        </Button>
      </div>
    </div>
  )

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={isEdit ? 'Editar etapa' : 'Añadir etapa'}
      size="md"
      footer={footer}
    >
      <form id="stage-form" onSubmit={handleSubmit(onValid)} className="space-y-4">

        <FormField
          id="stage-name"
          label="Nombre de la etapa"
          required
          placeholder="Ej: Clasificación y routing"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="stage-responsible"
            label="Responsable"
            placeholder="Ej: Técnico L1"
            error={errors.responsible?.message}
            {...register('responsible')}
          />
          <Controller
            name="department"
            control={control}
            render={({ field }) => (
              <Select
                label="Departamento"
                options={deptOptions}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                disabled={!hasDepts || isLoadingDepts}
                placeholder={
                  isLoadingDepts
                    ? 'Cargando...'
                    : hasDepts
                    ? 'Selecciona (opcional)'
                    : 'Sin departamentos'
                }
                helperText={
                  !hasDepts && !isLoadingDepts
                    ? 'Configura departamentos en Perfil de Empresa.'
                    : undefined
                }
              />
            )}
          />
        </div>

        <FormField
          id="stage-system"
          label="Sistema / Herramienta"
          placeholder="Ej: ServiceDesk Pro, SAP, Excel"
          error={errors.system?.message}
          {...register('system')}
        />

        <div className="grid grid-cols-3 gap-3">
          <FormField
            id="stage-proc-time"
            label="Tiempo proceso (h)"
            type="number"
            min="0"
            step="0.25"
            error={errors.procTimeHours?.message}
            {...register('procTimeHours', { valueAsNumber: true })}
          />
          <FormField
            id="stage-wait-time"
            label="Tiempo espera (h)"
            type="number"
            min="0"
            step="0.25"
            error={errors.waitTimeHours?.message}
            {...register('waitTimeHours', { valueAsNumber: true })}
          />
          <FormField
            id="stage-handoffs"
            label="Handoffs"
            type="number"
            min="0"
            step="1"
            error={errors.handoffs?.message}
            {...register('handoffs', { valueAsNumber: true })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-medium text-lean-black dark:text-warm-50">
            Contribución de valor
          </p>
          <Controller
            name="valueContribution"
            control={control}
            render={({ field }) => (
              <SegmentedControl
                aria-label="Contribución de valor de la etapa"
                value={field.value}
                onChange={(v) => field.onChange(v as ProcessStage['valueContribution'])}
                columns={2}
                options={(['alta', 'media', 'baja', 'nula'] as const).map((v) => ({
                  value:       v,
                  label:       VALUE_CONFIG[v].label,
                  activeColor: VALUE_ACTIVE_COLOR[v],
                }))}
              />
            )}
          />
        </div>

        <FormField
          id="stage-notes"
          label="Notas (opcional)"
          multiline
          rows={2}
          placeholder="Observaciones, mejoras potenciales..."
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  )
}
