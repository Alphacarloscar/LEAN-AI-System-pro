// ============================================================
// StageModal — Add/Edit/Delete stage modal for T3 StagesTab
// ============================================================

import { useState } from 'react'
import { useT3Store }         from '../store'
import { useEngagementStore } from '@/modules/Engagement/store'
import { useDepartmentStore } from '@/modules/CompanyProfile/useDepartmentStore'
import { Modal, Button, FormField, SegmentedControl } from '@shared/design-system/components'
import { Select }             from '@/shared/design-system/components/Select'
import type { SelectOption }  from '@/shared/design-system/components/Select'
import type { ProcessStage }  from '../types'

// ── Paleta de valor ──────────────────────────────────────────

const VALUE_CONFIG = {
  alta:  { label: 'Valor alto',  barColor: '#5FAF8A', chipBg: 'bg-success-light',  chipText: 'text-success-dark'  },
  media: { label: 'Valor medio', barColor: '#6A90C0', chipBg: 'bg-info-light',     chipText: 'text-info-dark'     },
  baja:  { label: 'Valor bajo',  barColor: '#D4A85C', chipBg: 'bg-warning-light',  chipText: 'text-warning-dark'  },
  nula:  { label: 'Sin valor',   barColor: '#C06060', chipBg: 'bg-danger-light',   chipText: 'text-danger-dark'   },
} as const

const VALUE_ACTIVE_COLOR: Record<ProcessStage['valueContribution'], string> = {
  alta:  '#D4EDE3',
  media: '#DDE8F5',
  baja:  '#FAF0D7',
  nula:  '#F5DEDE',
}

const EMPTY_FORM = {
  name:              '',
  responsible:       '',
  department:        '',
  system:            '',
  procTimeHours:     0.5,
  waitTimeHours:     1,
  handoffs:          0,
  valueContribution: 'media' as ProcessStage['valueContribution'],
  notes:             '',
}

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

  const [form, setForm] = useState(
    stage
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
      : { ...EMPTY_FORM }
  )

  const isEdit = !!stage
  const setF   = (k: keyof typeof form, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }))

  function handleSave() {
    if (!form.name.trim()) return
    const payload = {
      name:              form.name.trim(),
      responsible:       form.responsible  || undefined,
      department:        form.department   || undefined,
      system:            form.system       || undefined,
      procTimeHours:     Number(form.procTimeHours),
      waitTimeHours:     Number(form.waitTimeHours),
      handoffs:          Number(form.handoffs),
      valueContribution: form.valueContribution,
      notes:             form.notes        || undefined,
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
        <Button
          variant="primary"
          size="sm"
          disabled={!form.name.trim()}
          onClick={handleSave}
        >
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
      <div className="space-y-4">

        <FormField
          id="stage-name"
          label="Nombre de la etapa"
          required
          value={form.name}
          onChange={(e) => setF('name', e.target.value)}
          placeholder="Ej: Clasificación y routing"
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            id="stage-responsible"
            label="Responsable"
            value={form.responsible}
            onChange={(e) => setF('responsible', e.target.value)}
            placeholder="Ej: Técnico L1"
          />
          <div>
            <Select
              label="Departamento"
              options={deptOptions}
              value={form.department}
              onChange={(e) => setF('department', e.target.value)}
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
          </div>
        </div>

        <FormField
          id="stage-system"
          label="Sistema / Herramienta"
          value={form.system}
          onChange={(e) => setF('system', e.target.value)}
          placeholder="Ej: ServiceDesk Pro, SAP, Excel"
        />

        <div className="grid grid-cols-3 gap-3">
          <FormField
            id="stage-proc-time"
            label="Tiempo proceso (h)"
            type="number"
            min="0"
            step="0.25"
            value={String(form.procTimeHours)}
            onChange={(e) => setF('procTimeHours', parseFloat(e.target.value) || 0)}
          />
          <FormField
            id="stage-wait-time"
            label="Tiempo espera (h)"
            type="number"
            min="0"
            step="0.25"
            value={String(form.waitTimeHours)}
            onChange={(e) => setF('waitTimeHours', parseFloat(e.target.value) || 0)}
          />
          <FormField
            id="stage-handoffs"
            label="Handoffs"
            type="number"
            min="0"
            step="1"
            value={String(form.handoffs)}
            onChange={(e) => setF('handoffs', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-label font-medium text-lean-black dark:text-warm-50">
            Contribución de valor
          </p>
          <SegmentedControl
            aria-label="Contribución de valor de la etapa"
            value={form.valueContribution}
            onChange={(v) => setF('valueContribution', v as ProcessStage['valueContribution'])}
            columns={2}
            options={(['alta', 'media', 'baja', 'nula'] as const).map((v) => ({
              value:       v,
              label:       VALUE_CONFIG[v].label,
              activeColor: VALUE_ACTIVE_COLOR[v],
            }))}
          />
        </div>

        <FormField
          id="stage-notes"
          label="Notas (opcional)"
          multiline
          rows={2}
          value={form.notes}
          onChange={(e) => setF('notes', e.target.value)}
          placeholder="Observaciones, mejoras potenciales..."
        />
      </div>
    </Modal>
  )
}
