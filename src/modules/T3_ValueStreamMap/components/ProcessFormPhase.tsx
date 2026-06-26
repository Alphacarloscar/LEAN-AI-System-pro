// ============================================================
// ProcessFormPhase — Step 1 of ProcessInterviewModal
// ============================================================

import { useEffect }                     from 'react'
import { useForm, Controller }           from 'react-hook-form'
import { zodResolver }                   from '@hookform/resolvers/zod'
import { processFormSchema, type ProcessFormValues } from '@/lib/schemas/t3.schemas'
import { PHASE_CONFIG }                  from '../constants'
import type { NewValueStreamForm, ProcessPhase } from '../types'
import { useDepartmentStore }            from '@/modules/CompanyProfile/useDepartmentStore'
import { Select }                        from '@/shared/design-system/components/Select'
import type { SelectOption }             from '@/shared/design-system/components/Select'
import { Button, FormField, SegmentedControl } from '@shared/design-system/components'

// ── Colores hex de fases para SegmentedControl activeColor ────

const PHASE_ACTIVE_COLOR: Record<ProcessPhase, string> = {
  idea:            '#F0EDE8',
  validacion:      '#FEF6E8',
  piloto:          '#EBF2FA',
  estandarizacion: '#E8F5EE',
  escalado:        'rgba(42,40,34,0.1)',
}

const PHASE_ORDER: ProcessPhase[] = ['idea', 'validacion', 'piloto', 'estandarizacion', 'escalado']

interface ProcessFormPhaseProps {
  onNext: (form: NewValueStreamForm) => void
}

export function ProcessFormPhase({ onNext }: ProcessFormPhaseProps) {
  const { departments, isLoading: isLoadingDepts } = useDepartmentStore()
  const deptOptions: SelectOption[] = departments.map((d) => ({ value: d.name, label: d.name }))
  const hasDepts = deptOptions.length > 0

  const {
    register,
    handleSubmit,
    control,
    setFocus,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProcessFormValues>({
    resolver: zodResolver(processFormSchema),
    defaultValues: {
      name: '', department: '', owner: '', ownerRole: '', description: '', phase: 'validacion',
    },
  })

  useEffect(() => {
    setFocus('name')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentPhase = watch('phase')

  function onValid(data: ProcessFormValues) {
    onNext({
      name:        data.name,
      department:  data.department,
      owner:       data.owner     || undefined,
      ownerRole:   data.ownerRole || undefined,
      description: data.description || undefined,
      phase:       data.phase,
    })
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
          Paso 1 de 3
        </p>
        <h3 className="text-base font-semibold text-lean-black dark:text-warm-100">
          Datos del proceso
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Identifica el proceso que quieres analizar. La entrevista determinará su potencial IA.
        </p>
      </div>

      <FormField
        id="process-name"
        label="Nombre del proceso"
        required
        type="text"
        placeholder="Ej: Gestión de incidencias TI, Conciliación financiera..."
        error={errors.name?.message}
        {...register('name')}
      />

      <Controller
        name="department"
        control={control}
        render={({ field }) => (
          <Select
            label="Departamento / Área"
            options={deptOptions}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            disabled={!hasDepts || isLoadingDepts}
            errorText={errors.department?.message}
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
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="process-owner"
          label="Responsable del proceso"
          type="text"
          placeholder="Nombre"
          error={errors.owner?.message}
          {...register('owner')}
        />
        <FormField
          id="process-owner-role"
          label="Rol / Cargo"
          type="text"
          placeholder="Ej: COO, Head of..."
          error={errors.ownerRole?.message}
          {...register('ownerRole')}
        />
      </div>

      <FormField
        id="process-description"
        label="Descripción breve"
        multiline
        rows={2}
        placeholder="¿Qué hace este proceso? ¿Cuál es su objetivo de negocio?"
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="flex flex-col gap-2">
        <p className="text-label font-medium text-lean-black dark:text-warm-50">
          Fase de madurez de la iniciativa <span className="ml-0.5 text-danger" aria-hidden="true">*</span>
        </p>
        <Controller
          name="phase"
          control={control}
          render={({ field }) => (
            <SegmentedControl
              aria-label="Fase de madurez de la iniciativa"
              value={field.value}
              onChange={(v) => field.onChange(v as ProcessPhase)}
              columns={3}
              options={PHASE_ORDER.map((p) => ({
                value:       p,
                label:       PHASE_CONFIG[p].label,
                activeColor: PHASE_ACTIVE_COLOR[p],
              }))}
            />
          )}
        />
        <p className="text-[11px] text-text-subtle">
          {currentPhase === 'idea'            && 'Identificado, sin validación formal todavía.'}
          {currentPhase === 'validacion'      && 'Análisis de viabilidad en curso.'}
          {currentPhase === 'piloto'          && 'Piloto activo en un área o equipo.'}
          {currentPhase === 'estandarizacion' && 'Escalando a otros equipos de la organización.'}
          {currentPhase === 'escalado'        && 'Operativo y normalizado en toda la organización.'}
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="sm"
        fullWidth
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        Continuar con la entrevista →
      </Button>
    </form>
  )
}
