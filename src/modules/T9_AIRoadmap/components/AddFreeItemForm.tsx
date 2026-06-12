// ============================================================
// T9 — AddFreeItemForm
//
// Formulario inline para añadir iniciativas libres al roadmap.
// ============================================================

import { Card, Button, FormField } from '@shared/design-system/components'
import { MONTH_NAMES }             from '../t9GanttHelpers'
import type { AddFreeForm, FreeItemStatus, RoadmapRiskLevel } from '../types'

const MONTH_OPTIONS = MONTH_NAMES.map((name, i) => ({ value: i, label: name }))

const SELECT_CLS =
  'w-full text-xs border border-border dark:border-white/10 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-lean-black dark:text-warm-50 outline-none focus:ring-1 focus:ring-blue-300'

interface AddFormProps {
  form:      AddFreeForm
  onChange:  (updates: Partial<AddFreeForm>) => void
  onSave:    () => void
  onCancel:  () => void
}

export function AddFreeItemForm({ form, onChange, onSave, onCancel }: AddFormProps) {
  return (
    <Card variant="flat" padding="none" className="border-t border-border dark:border-white/6 px-5 py-4 bg-gray-50 dark:bg-gray-800/30">
      <p className="text-xs font-medium text-lean-black dark:text-warm-50 mb-3">
        Nueva iniciativa libre
      </p>

      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* Nombre — ocupa 2 columnas */}
        <div style={{ gridColumn: '1 / 3' }}>
          <FormField
            id="free-item-name"
            label="Nombre de la iniciativa *"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Ej: Migración ERP, Formación interna..."
          />
        </div>

        <div>
          <FormField
            id="free-item-department"
            label="Departamento"
            value={form.department}
            onChange={(e) => onChange({ department: e.target.value })}
            placeholder="IT, RRHH, Finanzas..."
          />
        </div>

        <div>
          <FormField
            id="free-item-responsible"
            label="Responsable"
            value={form.responsible}
            onChange={(e) => onChange({ responsible: e.target.value })}
            placeholder="Nombre y apellido"
          />
        </div>

        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Mes inicio</label>
          <select
            value={form.startMonth}
            onChange={(e) => {
              const s = Number(e.target.value)
              onChange({ startMonth: s, endMonth: Math.max(form.endMonth, s) })
            }}
            className={SELECT_CLS}
          >
            {MONTH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Mes fin</label>
          <select
            value={form.endMonth}
            onChange={(e) => onChange({ endMonth: Number(e.target.value) })}
            className={SELECT_CLS}
          >
            {MONTH_OPTIONS.filter((o) => o.value >= form.startMonth).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Nivel de riesgo</label>
          <select
            value={form.riskLevel}
            onChange={(e) => onChange({ riskLevel: e.target.value as RoadmapRiskLevel })}
            className={SELECT_CLS}
          >
            <option value="bajo">Bajo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-text-subtle block mb-1">Estado</label>
          <select
            value={form.status}
            onChange={(e) => onChange({ status: e.target.value as FreeItemStatus })}
            className={SELECT_CLS}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_curso">En curso</option>
            <option value="completado">Completado</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onSave} disabled={!form.name.trim()}>
          Añadir al roadmap
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </Card>
  )
}
