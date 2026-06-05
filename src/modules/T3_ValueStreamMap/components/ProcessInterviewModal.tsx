// ============================================================
// T3 — ProcessInterviewModal
//
// Flujo de 6 preguntas MCQ → auto-asignación de categoría IA
// + nivel de readiness + score de oportunidad.
//
// Fases:
//   1. Datos del proceso (nombre, dpto., responsable, descripción)
//   2. Preguntas 1-6 (una a la vez, auto-avance 300ms)
//   3. Resultado: categoría IA + scores + oportunidades generadas
// ============================================================

import { useState, useRef }   from 'react'
import {
  INTERVIEW_QUESTIONS,
  AI_CATEGORY_CONFIG,
  READINESS_CONFIG,
  PHASE_CONFIG,
  computeProcessInterviewResult,
  generateOpportunities,
  getOpportunityLevel,
} from '../constants'
import type {
  InterviewAnswerCode,
  AICategoryCode,
  OrgReadinessLevel,
  ProcessPhase,
  NewValueStreamForm,
  ValueStream,
} from '../types'
import { useDepartmentStore }            from '@/modules/CompanyProfile/useDepartmentStore'
import { Select }                        from '@/shared/design-system/components/Select'
import type { SelectOption }             from '@/shared/design-system/components/Select'
import { Modal, Button, FormField, Badge, SegmentedControl } from '@shared/design-system/components'
import { CategoryBadge } from './T3Badges'

// ── Props ─────────────────────────────────────────────────────

interface ProcessInterviewModalProps {
  onClose:  () => void
  onSubmit: (process: Omit<ValueStream, 'id' | 'createdAt'>) => void
}

// ── Fases del modal ───────────────────────────────────────────

type Phase = 'form' | 'interview' | 'result'

// ── Barra de progreso ─────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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

// ── Colores hex de fases para SegmentedControl activeColor ────
const PHASE_ACTIVE_COLOR: Record<ProcessPhase, string> = {
  idea:            '#F3F4F6',  // gray-100
  validacion:      '#FAF0D7',  // warning-light
  piloto:          '#DDE8F5',  // info-light
  estandarizacion: '#D4EDE3',  // success-light
  escalado:        'rgba(42,40,34,0.1)',  // navy/10
}

// ── Fase 1: formulario datos del proceso ─────────────────────

const PHASE_ORDER: ProcessPhase[] = ['idea', 'validacion', 'piloto', 'estandarizacion', 'escalado']

function ProcessFormPhase({
  onNext,
}: {
  onNext: (form: NewValueStreamForm) => void
}) {
  const [form, setForm] = useState<NewValueStreamForm>({
    name: '', department: '', owner: '', ownerRole: '', description: '', phase: 'validacion',
  })
  const nameRef = useRef<HTMLInputElement>(null)

  // Departamentos del store centralizado
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

      {/* Departamento — Select centralizado desde company_departments */}
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

      {/* Responsable + Rol */}
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

      {/* Fase de madurez */}
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

// ── Fase 2: entrevista MCQ ────────────────────────────────────

function InterviewPhase({
  onComplete,
}: {
  onComplete: (answers: Record<number, InterviewAnswerCode>) => void
}) {
  const [currentQ, setCurrentQ]       = useState(0)
  const [answers, setAnswers]         = useState<Record<number, InterviewAnswerCode>>({})
  const [pendingAnswer, setPending]   = useState<InterviewAnswerCode | null>(null)
  const total = INTERVIEW_QUESTIONS.length

  function handleAnswer(code: InterviewAnswerCode) {
    if (pendingAnswer) return
    const qId = INTERVIEW_QUESTIONS[currentQ].id
    const next = { ...answers, [qId]: code }
    setAnswers(next)
    setPending(code)
    setTimeout(() => {
      setPending(null)
      if (currentQ < total - 1) {
        setCurrentQ((q) => q + 1)
      } else {
        onComplete(next)
      }
    }, 320)
  }

  const q = INTERVIEW_QUESTIONS[currentQ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
          Paso 2 de 3 · Diagnóstico del proceso
        </p>
        <h3 className="text-base font-semibold text-lean-black dark:text-gray-100 mb-3">
          Entrevista estructurada
        </h3>
        <ProgressBar current={currentQ + 1} total={total} />
      </div>

      {/* Pregunta */}
      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 px-5 py-4 border border-border dark:border-white/6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
          Pregunta {String(currentQ + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
        <p className="text-sm font-semibold text-lean-black dark:text-gray-100 leading-relaxed">
          {q.text}
        </p>
        {q.hint && (
          <p className="text-[11px] text-text-subtle mt-1.5 italic">{q.hint}</p>
        )}
      </div>

      {/* Opciones */}
      <div className="flex flex-col gap-2">
        {q.answers.map((opt) => {
          const isSelected = pendingAnswer === opt.code
          const isOther    = pendingAnswer !== null && pendingAnswer !== opt.code
          return (
            <button
              key={opt.code}
              onClick={() => handleAnswer(opt.code)}
              disabled={pendingAnswer !== null}
              className={[
                'w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200',
                isSelected
                  ? 'border-navy bg-navy/5 dark:bg-navy/20 text-lean-black dark:text-gray-100 font-medium'
                  : isOther
                  ? 'border-border dark:border-white/6 opacity-40 text-text-muted'
                  : 'border-border dark:border-white/10 text-text-muted hover:border-navy/40 hover:bg-gray-50 dark:hover:bg-gray-800/50',
              ].join(' ')}
            >
              <span className="inline-flex items-center gap-3">
                <span className={[
                  'shrink-0 w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center',
                  isSelected
                    ? 'border-navy bg-navy text-white'
                    : 'border-gray-300 dark:border-gray-600 text-text-subtle',
                ].join(' ')}>
                  {opt.code}
                </span>
                {opt.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mini-historial */}
      {currentQ > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {INTERVIEW_QUESTIONS.slice(0, currentQ).map((pq) => (
            <span
              key={pq.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-navy/5 dark:bg-navy/15 text-[10px] text-navy dark:text-warm-100 font-medium"
            >
              P{pq.id} <span className="opacity-60">·</span> {answers[pq.id]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Fase 3: resultado ─────────────────────────────────────────

function ResultPhase({
  formData,
  answers,
  onConfirm,
  onBack,
}: {
  formData:  NewValueStreamForm
  answers:   Record<number, InterviewAnswerCode>
  onConfirm: (
    aiCategory:   AICategoryCode,
    orgReadiness: OrgReadinessLevel,
    manualOverride: boolean
  ) => void
  onBack: () => void
}) {
  const result = computeProcessInterviewResult(answers)
  const cfg    = AI_CATEGORY_CONFIG[result.aiCategory]

  const [aiCategory, setAiCategory]     = useState<AICategoryCode>(result.aiCategory)
  const [orgReadiness, setOrgReadiness] = useState<OrgReadinessLevel>(result.orgReadiness)
  const manualOverride = aiCategory !== result.aiCategory || orgReadiness !== result.orgReadiness

  const ALL_CATEGORIES: AICategoryCode[] = [
    'automatizacion_inteligente', 'automatizacion_rpa',
    'analitica_predictiva', 'asistente_ia', 'optimizacion_proceso', 'agéntica',
  ]
  const ALL_READINESS: OrgReadinessLevel[] = ['alta', 'media', 'baja']

  const scoreBars = [
    { label: 'AUTOMATIZACIÓN', value: result.automationScore, hex: '#6A90C0', light: '#B8D0E8' },
    { label: 'DATOS',          value: result.dataScore,       hex: '#5FAF8A', light: '#B4E4CF' },
    { label: 'VOLUMEN',        value: result.volumeScore,     hex: '#9AAEC8', light: '#C8DAE8' },
    { label: 'IMPACTO',        value: result.impactScore,     hex: '#D4A85C', light: '#E8D0A0' },
    { label: 'READINESS',      value: result.readinessScore,  hex: '#C06060', light: '#DDA8A8' },
  ]

  const MAX = 4
  const LBL_W = 72, G1 = 8, TRACK_W = 120, G2 = 6, VAL_COL = 26
  const VBW = LBL_W + G1 + TRACK_W + G2 + VAL_COL
  const TX  = LBL_W + G1
  const ROW_H = 36, VBH = scoreBars.length * ROW_H + 8

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
          Paso 3 de 3 · Resultado del análisis
        </p>
        <h3 className="text-base font-semibold text-lean-black dark:text-gray-100">
          Categoría IA asignada
        </h3>
      </div>

      {/* Proceso identificado */}
      <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border border-border dark:border-white/6">
        <p className="text-xs font-medium text-text-muted">{formData.department}</p>
        <p className="text-sm font-semibold text-lean-black dark:text-gray-100">{formData.name}</p>
        {formData.owner && (
          <p className="text-xs text-text-subtle mt-0.5">{formData.owner} · {formData.ownerRole}</p>
        )}
      </div>

      {/* Categoría auto-asignada */}
      <div className="rounded-2xl border border-border dark:border-white/10 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
          <CategoryBadge category={result.aiCategory} />
          <span className="text-[11px] text-text-subtle">
            Score oportunidad: <strong className="text-lean-black dark:text-gray-200">{result.opportunityScore.toFixed(2)}</strong>/4.00
          </span>
          {manualOverride && (
            <Badge variant="warning" shape="pill" size="xs" className="ml-auto">
              Ajuste manual
            </Badge>
          )}
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">{cfg.tagline}</p>
          <p className="text-xs text-text-muted leading-relaxed">{cfg.description}</p>
        </div>
      </div>

      {/* Score bars */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
          Scores del diagnóstico
        </p>
        <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            {scoreBars.map(({ label, hex, light }, i) => {
              const fillW = Math.max((scoreBars[i].value / MAX) * TRACK_W, 2)
              return (
                <linearGradient
                  key={label}
                  id={`ri-bar-${i}`}
                  x1={TX} y1="0" x2={TX + fillW} y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%"   stopColor={hex}   stopOpacity="0.15" />
                  <stop offset="30%"  stopColor={hex}   stopOpacity="0.92" />
                  <stop offset="58%"  stopColor={light} stopOpacity="1" />
                  <stop offset="85%"  stopColor={hex}   stopOpacity="0.80" />
                  <stop offset="100%" stopColor={hex}   stopOpacity="0.40" />
                </linearGradient>
              )
            })}
          </defs>
          {scoreBars.map(({ label, value, hex, light }, i) => {
            const fillW = Math.max((value / MAX) * TRACK_W, 2)
            const cy    = i * ROW_H + ROW_H / 2 + 3
            return (
              <g key={label}>
                <text x={0} y={cy + 3} fontSize={7} fill="#64748B"
                  fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
                  {label}
                </text>
                <rect x={TX} y={cy - 0.4} width={TRACK_W} height={0.8} fill={hex} opacity={0.08} rx={0.4} />
                <rect x={TX} y={cy - 3} width={fillW} height={6} fill={hex} opacity={0.10} rx={3} />
                <rect x={TX} y={cy - 1.5} width={fillW} height={3} fill={`url(#ri-bar-${i})`} rx={1.5} />
                <rect x={TX + fillW * 0.08} y={cy - 2} width={fillW * 0.45} height={0.7}
                  fill={light} opacity={0.60} rx={0.35} />
                <text x={TX + TRACK_W + G2} y={cy + 3} fontSize={8} fontWeight="600" fill="#94A3B8"
                  fontFamily="ui-monospace,monospace">
                  {value.toFixed(1)}<tspan fontSize={6.5} opacity={0.5}>/4</tspan>
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Ajuste manual (consultor) — selects con label asociado vía DS Select */}
      <div className="rounded-2xl border border-border dark:border-white/10 px-4 py-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
          Ajuste del consultor (opcional)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Categoría IA"
            options={ALL_CATEGORIES.map((c) => ({ value: c, label: AI_CATEGORY_CONFIG[c].label }))}
            value={aiCategory}
            onChange={(e) => setAiCategory(e.target.value as AICategoryCode)}
          />
          <Select
            label="Readiness del equipo"
            options={ALL_READINESS.map((r) => ({ value: r, label: READINESS_CONFIG[r].label }))}
            value={orgReadiness}
            onChange={(e) => setOrgReadiness(e.target.value as OrgReadinessLevel)}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onBack}>
          ← Volver
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-[2]"
          onClick={() => onConfirm(aiCategory, orgReadiness, manualOverride)}
        >
          Añadir proceso al mapa ✓
        </Button>
      </div>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────

export function ProcessInterviewModal({
  onClose, onSubmit,
}: ProcessInterviewModalProps) {
  const [phase, setPhase]         = useState<Phase>('form')
  const [formData, setFormData]   = useState<NewValueStreamForm>({
    name: '', department: '', owner: '', ownerRole: '', description: '', phase: 'validacion',
  })
  const [answers, setAnswers]     = useState<Record<number, InterviewAnswerCode>>({})

  function handleFormNext(f: NewValueStreamForm) {
    setFormData(f)
    setPhase('interview')
  }

  function handleInterviewComplete(a: Record<number, InterviewAnswerCode>) {
    setAnswers(a)
    setPhase('result')
  }

  function handleConfirm(
    aiCategory: AICategoryCode,
    orgReadiness: OrgReadinessLevel,
    manualOverride: boolean
  ) {
    const result      = computeProcessInterviewResult(answers)
    const oppLevel    = getOpportunityLevel(result.opportunityScore)
    const processTemp = `new-${Date.now()}`
    const opportunities = generateOpportunities(aiCategory, processTemp)

    const process: Omit<ValueStream, 'id' | 'createdAt'> = {
      name:             formData.name.trim(),
      department:       formData.department.trim(),
      owner:            formData.owner?.trim() || undefined,
      ownerRole:        formData.ownerRole?.trim() || undefined,
      description:      formData.description?.trim() || undefined,
      phase:            formData.phase,
      aiCategory,
      orgReadiness,
      opportunityLevel: oppLevel,
      interview: {
        ...result,
        computedAt: new Date().toISOString(),
      },
      opportunities,
      manualOverride: manualOverride || undefined,
    }

    onSubmit(process)
  }

  const phaseTitle: Record<Phase, string> = {
    form:      'Nuevo proceso',
    interview: 'Diagnóstico del proceso',
    result:    'Categoría IA asignada',
  }

  return (
    <Modal open={true} onClose={onClose} size="lg" title={phaseTitle[phase]}>
      <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle -mt-2 mb-4">
        T3 — Value Stream Map
      </p>

      {phase === 'form' && (
        <ProcessFormPhase onNext={handleFormNext} />
      )}
      {phase === 'interview' && (
        <InterviewPhase onComplete={handleInterviewComplete} />
      )}
      {phase === 'result' && (
        <ResultPhase
          formData={formData}
          answers={answers}
          onConfirm={handleConfirm}
          onBack={() => setPhase('interview')}
        />
      )}
    </Modal>
  )
}
