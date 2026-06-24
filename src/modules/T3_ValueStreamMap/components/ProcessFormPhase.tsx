// ============================================================
// ProcessFormPhase — Step 1 of ProcessInterviewModal
// ============================================================

import { useState, useRef } from 'react'
import { PHASE_CONFIG } from '../constants'
import type { NewValueStreamForm, ProcessPhase } from '../types'
import { useDepartmentStore }  from '@/modules/CompanyProfile/useDepartmentStore'
import { Select }              from '@/shared/design-system/components/Select'
import type { SelectOption }   from '@/shared/design-system/components/Select'
import { Button, FormField, SegmentedControl } from '@shared/design-system/components'

// ── Colores hex de fases para SegmentedControl activeColor ────

const PHASE_ACTIVE_COLOR: Record<ProcessPhase, string> = {
  idea:            '#F3F4F6',
  validacion:      '#FAF0D7',
  piloto:          '#DDE8F5',
  estandarizacion: '#D4EDE3',
  escalado:        'rgba(42,40,34,0.1)',
}

const PHASE_ORDER: ProcessPhase[] = ['idea', 'validacion', 'piloto', 'estandarizacion', 'escalado']

interface ProcessFormPhaseProps {
  onNext: (form: NewValueStreamForm) => void
}

export function ProcessFormPhase({ onNext }: ProcessFormPhaseProps) {
  const [form, setForm] = useState<NewValueStreamForm>({
    name: '', department: '', owner: '', ownerRole: '', description: '', phase: 'validacion',
  })
  const nameRef = useRef<HTMLInputElement>(null)

  const { departments, isLoading: isLoadingDepts } = useDepartmentStore()
  const deptOptions: SelectOption[] = departments.map((d) => ({ value: d.name, label: d.name }))
  const hasDepts = deptOptions.length > 0

  const canContinue = form.name.trim() && form.department.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canContinue) return
    onNext(form)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
          Paso 1 de 3
        </p>
        <h3 className="text-base font-semibold text-lean-black dark:text-gray-100">
          Datos del proceso
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Identifica el proceso que quieres analizar. La entrevista determinará su potencial IA.
        </p>
      </div>

      <FormField
        id="process-name"
        ref={nameRef}
        label="Nombre del proceso"
        required
        type="text"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Ej: Gestión de incidencias TI, Conciliación financiera..."
      />

      <Select
        label="Departamento / Área"
        options={deptOptions}
        value={form.department}
        onChange={(e) => setForm({ ...form, department: e.target.value })}
        disabled={!hasDepts || isLoadingDepts}
        placeholder={
          isLoadingDepts
            ? 'Cargando departamentos...'
            : hasDepts
            ? 'Selecciona un departamento'
            : 'Configura los departamentos en el Perfil de Empresa primero'
        }
        helperText={
          !hasDepts && !isLoadingDepts
            ? 'Ve a Perfil de Empresa → Departamentos para configurarlos.'
            : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="process-owner"
          label="Responsable del proceso"
          type="text"
          value={form.owner ?? ''}
          onChange={(e) => setForm({ ...form, owner: e.target.value })}
          placeholder="Nombre"
        />
        <FormField
          id="process-owner-role"
          label="Rol / Cargo"
          type="text"
          value={form.ownerRole ?? ''}
          onChange={(e) => setForm({ ...form, ownerRole: e.target.value })}
          placeholder="Ej: COO, Head of..."
        />
      </div>

      <FormField
        id="process-description"
        label="Descripción breve"
        multiline
        rows={2}
        value={form.description ?? ''}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="¿Qué hace este proceso? ¿Cuál es su objetivo de negocio?"
      />

      <div className="flex flex-col gap-2">
        <p className="text-label font-medium text-lean-black dark:text-warm-50">
          Fase de madurez de la iniciativa <span className="ml-0.5 text-danger" aria-hidden="true">*</span>
        </p>
        <SegmentedControl
          aria-label="Fase de madurez de la iniciativa"
          value={form.phase}
          onChange={(v) => setForm({ ...form, phase: v as ProcessPhase })}
          columns={3}
          options={PHASE_ORDER.map((p) => ({
            value:       p,
            label:       PHASE_CONFIG[p].label,
            activeColor: PHASE_ACTIVE_COLOR[p],
          }))}
        />
        <p className="text-[11px] text-text-subtle">
          {form.phase === 'idea'            && 'Identificado, sin validación formal todavía.'}
          {form.phase === 'validacion'      && 'Análisis de viabilidad en curso.'}
          {form.phase === 'piloto'          && 'Piloto activo en un área o equipo.'}
          {form.phase === 'estandarizacion' && 'Escalando a otros equipos de la organización.'}
          {form.phase === 'escalado'        && 'Operativo y normalizado en toda la organización.'}
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="sm"
        fullWidth
        disabled={!canContinue}
      >
        Continuar con la entrevista →
      </Button>
    </form>
  )
}
