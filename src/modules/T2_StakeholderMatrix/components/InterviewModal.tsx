// ============================================================
// T2 — InterviewModal
//
// Flujo de 5 preguntas paso a paso → auto-asignación de
// arquetipo + nivel de resistencia con explicación del scoring.
//
// Fases:
//   1. Datos del stakeholder (nombre, cargo, departamento)
//   2. Pregunta 1 — 5 (una a la vez, con barra de progreso)
//   3. Resultado: arquetipo + resistencia + opción de ajuste manual
// ============================================================

import { useState, useEffect }           from 'react'
import { useForm, Controller }           from 'react-hook-form'
import { zodResolver }                   from '@hookform/resolvers/zod'
import {
  INTERVIEW_QUESTIONS,
  ARCHETYPE_CONFIG,
  computeInterviewResult,
} from '../constants'
import type {
  InterviewAnswerCode,
  ArchetypeCode,
  ResistanceLevel,
  NewStakeholderForm,
  Stakeholder,
} from '../types'
import { stakeholderFormSchema, type StakeholderFormValues } from '@/lib/schemas/t2.schemas'
import { useDepartmentStore }            from '@/modules/CompanyProfile/useDepartmentStore'
import { Select }                        from '@/shared/design-system/components/Select'
import type { SelectOption }             from '@/shared/design-system/components/Select'
import { Modal, Button, FormField, Badge, SegmentedControl, PersonSelectField } from '@shared/design-system/components'
import type { CompanyPerson }            from '@/modules/CompanyProfile/useCompanyPersonStore'
import { ArchetypeBadge, ResistanceBadge } from './T2Badges'

// ── Props ─────────────────────────────────────────────────────

interface InterviewModalProps {
  onClose:   () => void
  onSubmit:  (stakeholder: Omit<Stakeholder, 'id' | 'createdAt'>) => void
  projectId: string
  companyId?: string
  /**
   * Si se pasa, el modal OMITE la fase de formulario y empieza directamente
   * en la entrevista. Útil para entrevistar stakeholders importados desde T1.
   */
  existingStakeholder?: Pick<Stakeholder, 'name' | 'role' | 'department' | 'archetype' | 'resistance' | 'notes' | 'manualOverride' | 'unofficialTools'>
}

// ── Fases del modal ───────────────────────────────────────────

type Phase = 'form' | 'interview' | 'result'

// ── Subcomponentes ────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-warm-100 dark:bg-warm-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-navy rounded-full transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-text-subtle shrink-0">
        {current}/{total}
      </span>
    </div>
  )
}

// ── Fase 1: formulario datos ──────────────────────────────────

function StakeholderFormPhase({
  onNext,
  initialValues,
  projectId,
  companyId,
}: {
  onNext:         (form: NewStakeholderForm) => void
  initialValues?: NewStakeholderForm
  projectId:      string
  companyId?:     string
}) {
  const { departments, isLoading: isLoadingDepts } = useDepartmentStore()
  const deptOptions: SelectOption[] = departments.map((d) => ({ value: d.name, label: d.name }))
  const hasDepts = deptOptions.length > 0
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(initialValues?.personId ?? null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<StakeholderFormValues>({
    resolver: zodResolver(stakeholderFormSchema),
    defaultValues: initialValues ?? { name: '', role: '', department: '', unofficialTools: '' },
  })

  useEffect(() => {
    if (!initialValues?.name) setFocus('name')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onValid(data: StakeholderFormValues) {
    onNext({ ...data, personId: selectedPersonId })
  }

  function handlePersonSelected(personId: string, person: CompanyPerson) {
    setSelectedPersonId(personId)
    setValue('name', person.name, { shouldValidate: true })
    setValue('role', person.role, { shouldValidate: true })
    if (person.department) setValue('department', person.department, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4">
      <PersonSelectField
        projectId={projectId}
        companyId={companyId}
        sourceTool="t2"
        label="Persona"
        onChange={handlePersonSelected}
      />

      <FormField
        id="stakeholder-name"
        label="Nombre"
        type="text"
        placeholder="Ej. Javier Morales"
        error={errors.name?.message}
        {...register('name')}
      />

      <FormField
        id="stakeholder-role"
        label="Cargo"
        type="text"
        placeholder="Ej. CIO, Head of Digital, CFO…"
        error={errors.role?.message}
        {...register('role')}
      />

      {/* Shadow AI — campo empático, opcional */}
      <FormField
        id="stakeholder-unofficial-tools"
        label="Herramientas externas (opcional)"
        multiline
        rows={2}
        placeholder="Herramientas externas (IA o digitales) que empleas por tu cuenta para agilizar cuellos de botella diarios"
        hint="Ej. ChatGPT, Notion AI, Zapier… Su uso no implica incumplimiento; nos ayuda a entender el flujo real de trabajo."
        {...register('unofficialTools')}
      />

      {/* Departamento — Select centralizado desde company_departments */}
      <Controller
        name="department"
        control={control}
        render={({ field }) => (
          <Select
            label="Departamento"
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

      <p className="text-[11px] text-text-subtle px-3 py-2 rounded-lg bg-warm-50 dark:bg-warm-700/50 border border-border/60">
        A continuación, 5 preguntas que determinarán el arquetipo y el nivel de resistencia automáticamente.
      </p>

      <Button
        type="submit"
        variant="primary"
        size="sm"
        fullWidth
        disabled={isSubmitting}
        loading={isSubmitting}
      >
        Iniciar entrevista →
      </Button>
    </form>
  )
}

// ── Fase 2: preguntas ─────────────────────────────────────────

function InterviewPhase({
  onComplete,
}: {
  onComplete: (answers: Record<number, InterviewAnswerCode>) => void
}) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, InterviewAnswerCode>>({})

  const question = INTERVIEW_QUESTIONS[current]
  const selected = answers[question.id]

  function handleAnswer(code: InterviewAnswerCode) {
    const updated = { ...answers, [question.id]: code }
    setAnswers(updated)

    if (current < INTERVIEW_QUESTIONS.length - 1) {
      // Avanzar automáticamente tras 300ms (feedback visual)
      setTimeout(() => setCurrent((c) => c + 1), 300)
    } else {
      // Última pregunta — completar
      setTimeout(() => onComplete(updated), 300)
    }
  }

  const answerColors: Record<InterviewAnswerCode, string> = {
    A: 'border-success-dark/50 bg-success-light text-success-dark',
    B: 'border-info-dark/50 bg-info-light text-info-dark',
    C: 'border-warning-dark/50 bg-warning-light text-warning-dark',
    D: 'border-danger-dark/50 bg-danger-light text-danger-dark',
  }

  return (
    <div className="space-y-5">
      <ProgressBar current={current + 1} total={INTERVIEW_QUESTIONS.length} />

      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
          Pregunta {current + 1} de {INTERVIEW_QUESTIONS.length}
        </p>
        <p className="text-sm font-semibold text-lean-black dark:text-warm-50 leading-snug">
          {question.text}
        </p>
        {question.hint && (
          <p className="text-[11px] text-text-subtle mt-1">{question.hint}</p>
        )}
      </div>

      <div className="space-y-2">
        {question.answers.map((answer) => {
          const isSelected = selected === answer.code
          return (
            <button
              key={answer.code}
              onClick={() => handleAnswer(answer.code)}
              className={[
                'w-full text-left px-4 py-3 rounded-xl border text-xs font-medium transition-all duration-150',
                isSelected
                  ? answerColors[answer.code]
                  : 'border-border bg-white dark:bg-warm-700 text-text-muted hover:border-navy/30 hover:bg-warm-50 dark:hover:bg-warm-600',
              ].join(' ')}
            >
              <span className="font-bold mr-2 opacity-50">{answer.code})</span>
              {answer.text}
            </button>
          )
        })}
      </div>

      {current > 0 && (
        <Button
          variant="link"
          className="text-[10px]"
          onClick={() => setCurrent((c) => c - 1)}
        >
          ← Pregunta anterior
        </Button>
      )}
    </div>
  )
}

// ── Color de dominio para los selectores de ajuste manual ─────
// Hex equivalentes de los tokens Tailwind en ARCHETYPE_CONFIG/RESISTANCE_CONFIG.
const ARCHETYPE_ACTIVE_COLOR: Record<string, string> = {
  adoptador:    '#E8F5EE',  // success-light
  ambassador:   '#EBF2FA',  // info-light
  decisor:      'rgba(42,40,34,0.1)',  // navy/10
  critico:      '#FDECEC',  // danger-light
  reticente:    '#FEF6E8',  // warning-light
  especialista: '#FEF6E8',  // backward-compat alias → mismo que reticente
}

const RESISTANCE_ACTIVE_COLOR: Record<string, string> = {
  baja:  '#E8F5EE',  // success-light
  media: '#FEF6E8',  // warning-light
  alta:  '#FDECEC',  // danger-light
}

// ── Fase 3: resultado ─────────────────────────────────────────

function ResultPhase({
  form,
  answers,
  onConfirm,
}: {
  form:      NewStakeholderForm
  answers:   Record<number, InterviewAnswerCode>
  onConfirm: (archetype: ArchetypeCode, resistance: ResistanceLevel, manualOverride: boolean) => void
}) {
  const result = computeInterviewResult(answers)
  const [archetype,  setArchetype]  = useState<ArchetypeCode>(result.archetype)
  const [resistance, setResistance] = useState<ResistanceLevel>(result.resistance)
  const isOverride = archetype !== result.archetype || resistance !== result.resistance

  const arc = ARCHETYPE_CONFIG[archetype]

  const scoreBars = [
    { label: 'Adopción IA',  value: result.adoptionScore,  color: 'bg-gold' },
    { label: 'Influencia',   value: result.influenceScore, color: 'bg-gold' },
    { label: 'Apertura',     value: result.opennessScore,  color: 'bg-gold' },
  ]

  return (
    <div className="space-y-5">
      {/* Resultado automático */}
      <div className="p-4 rounded-xl bg-warm-50 dark:bg-warm-700/50 border border-border space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Clasificación automática · {form.name}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <ArchetypeBadge archetype={archetype} />
          <ResistanceBadge resistance={resistance} />
          {isOverride && (
            <Badge variant="warning" shape="pill" size="sm" className="!text-[10px] !font-semibold">
              Ajustado manualmente
            </Badge>
          )}
        </div>

        <p className="text-[11px] text-text-muted leading-relaxed">{arc.description}</p>

        {/* Scores */}
        <div className="space-y-1.5">
          {scoreBars.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-text-subtle w-20 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-warm-200 dark:bg-warm-600 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${(value / 4) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-text-muted w-6 text-right tabular-nums">
                {value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ajuste manual — archetype */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Ajuste manual (opcional)
        </p>
        <SegmentedControl
          aria-label="Arquetipo del stakeholder"
          value={archetype}
          onChange={(v) => setArchetype(v as ArchetypeCode)}
          columns={3}
          options={(Object.keys(ARCHETYPE_CONFIG) as ArchetypeCode[]).map((code) => ({
            value:       code,
            label:       ARCHETYPE_CONFIG[code].label,
            activeColor: ARCHETYPE_ACTIVE_COLOR[code],
          }))}
        />

        <div className="mt-1">
          <SegmentedControl
            aria-label="Nivel de resistencia al cambio"
            value={resistance}
            onChange={(v) => setResistance(v as ResistanceLevel)}
            options={[
              { value: 'baja',  label: 'Baja',  activeColor: RESISTANCE_ACTIVE_COLOR.baja },
              { value: 'media', label: 'Media', activeColor: RESISTANCE_ACTIVE_COLOR.media },
              { value: 'alta',  label: 'Alta',  activeColor: RESISTANCE_ACTIVE_COLOR.alta },
            ]}
          />
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={() => onConfirm(archetype, resistance, isOverride)}
      >
        Añadir a la matrix
      </Button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function InterviewModal({ onClose, onSubmit, projectId, companyId, existingStakeholder }: InterviewModalProps) {
  // Si hay stakeholder existente con departamento REAL (no 'Sin asignar'), saltamos el formulario.
  // 'Sin asignar' se asigna automáticamente en el import de T1 → hay que forzar el form para que el consultor lo corrija.
  const dept = existingStakeholder?.department?.trim() ?? ''
  const hasDepartment = dept.length > 0 && dept !== 'Sin asignar'
  const [phase,   setPhase]   = useState<Phase>(existingStakeholder && hasDepartment ? 'interview' : 'form')
  const [form,    setForm]    = useState<NewStakeholderForm>(
    existingStakeholder
      ? {
          name:       existingStakeholder.name,
          role:       existingStakeholder.role,
          // Si el departamento es 'Sin asignar' (auto-asignado en import), dejarlo vacío
          // para que el consultor escriba el real sin tener que borrar nada primero.
          department:      hasDepartment ? existingStakeholder.department : '',
          unofficialTools: existingStakeholder.unofficialTools ?? '',
        }
      : { name: '', role: '', department: '', unofficialTools: '' }
  )
  const [answers, setAnswers] = useState<Record<number, InterviewAnswerCode>>({})

  function handleFormNext(f: NewStakeholderForm) {
    setForm(f)
    setPhase('interview')
  }

  function handleInterviewComplete(a: Record<number, InterviewAnswerCode>) {
    setAnswers(a)
    setPhase('result')
  }

  function handleConfirm(archetype: ArchetypeCode, resistance: ResistanceLevel, manualOverride: boolean) {
    const result = computeInterviewResult(answers)
    onSubmit({
      name:            form.name.trim(),
      role:            form.role.trim(),
      department:      form.department.trim(),
      archetype,
      resistance,
      manualOverride,
      notes:           existingStakeholder?.notes,
      unofficialTools: form.unofficialTools?.trim() || undefined,
      personId:        form.personId ?? null,
      interview: {
        ...result,
        archetype,
        resistance,
        computedAt: new Date().toISOString(),
      },
    })
  }

  const phaseTitle: Record<Phase, string> = {
    form:      existingStakeholder ? 'Entrevista de clasificación' : 'Nuevo stakeholder',
    interview: 'Entrevista de clasificación',
    result:    'Resultado del assessment',
  }

  return (
    <Modal open={true} onClose={onClose} title={phaseTitle[phase]} size="md">
      {/* Subtitle — nombre · cargo (visible en fases interview y result) */}
      {phase !== 'form' && (
        <p className="text-[11px] text-text-subtle -mt-2 mb-4">{form.name} · {form.role}</p>
      )}

      {phase === 'form'      && <StakeholderFormPhase  onNext={handleFormNext} initialValues={existingStakeholder ? form : undefined} projectId={projectId} companyId={companyId} />}
      {phase === 'interview' && <InterviewPhase         onComplete={handleInterviewComplete} />}
      {phase === 'result'    && <ResultPhase            form={form} answers={answers}         onConfirm={handleConfirm} />}
    </Modal>
  )
}
