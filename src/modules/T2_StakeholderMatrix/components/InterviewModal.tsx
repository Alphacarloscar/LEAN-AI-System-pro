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

import { useState, useEffect, useRef }   from 'react'
import {
  INTERVIEW_QUESTIONS,
  ARCHETYPE_CONFIG,
  RESISTANCE_CONFIG,
  computeInterviewResult,
} from '../constants'
import type {
  InterviewAnswerCode,
  ArchetypeCode,
  ResistanceLevel,
  NewStakeholderForm,
  Stakeholder,
} from '../types'

// ── Props ─────────────────────────────────────────────────────

interface InterviewModalProps {
  onClose:  () => void
  onSubmit: (stakeholder: Omit<Stakeholder, 'id' | 'createdAt'>) => void
  /** Departamentos existentes para sugerencias en el autocomplete */
  existingDepartments: string[]
}

// ── Fases del modal ───────────────────────────────────────────

type Phase = 'form' | 'interview' | 'result'

// ── Subcomponentes ────────────────────────────────────────────

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

// ── Fase 1: formulario datos ──────────────────────────────────

function StakeholderFormPhase({
  onNext,
  existingDepartments,
}: {
  onNext: (form: NewStakeholderForm) => void
  existingDepartments: string[]
}) {
  const [form, setForm]       = useState<NewStakeholderForm>({ name: '', role: '', department: '' })
  const [showDepts, setShowDepts] = useState(false)
  const nameRef               = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const canContinue = form.name.trim() && form.role.trim() && form.department.trim()
  const filteredDepts = existingDepartments.filter((d) =>
    d.toLowerCase().includes(form.department.toLowerCase()) && d !== form.department
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (canContinue) onNext(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle">Nombre</label>
        <input
          ref={nameRef}
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ej. Javier Morales"
          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-border text-lean-black dark:text-gray-100 placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle">Cargo</label>
        <input
          type="text"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          placeholder="Ej. CIO, Head of Digital, CFO…"
          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-border text-lean-black dark:text-gray-100 placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
        />
      </div>

      <div className="space-y-1.5 relative">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle">Departamento</label>
        <input
          type="text"
          value={form.department}
          onChange={(e) => { setForm((f) => ({ ...f, department: e.target.value })); setShowDepts(true) }}
          onBlur={() => setTimeout(() => setShowDepts(false), 150)}
          placeholder="Ej. Operaciones, IT, Marketing…"
          className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-border text-lean-black dark:text-gray-100 placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 transition-all"
        />
        {showDepts && filteredDepts.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-border rounded-lg shadow-md z-10 overflow-hidden">
            {filteredDepts.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setForm((f) => ({ ...f, department: d })); setShowDepts(false) }}
                className="w-full text-left px-3 py-2 text-xs text-text-muted hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-text-subtle px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-border/60">
        A continuación, 5 preguntas que determinarán el arquetipo y el nivel de resistencia automáticamente.
      </p>

      <button
        type="submit"
        disabled={!canContinue}
        className={[
          'w-full py-2.5 rounded-lg text-xs font-semibold transition-all duration-150',
          canContinue
            ? 'bg-navy-metallic text-white hover:bg-navy-metallic-hover shadow-sm active:scale-[0.98]'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed',
        ].join(' ')}
      >
        Iniciar entrevista →
      </button>
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
        <p className="text-sm font-semibold text-lean-black dark:text-gray-100 leading-snug">
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
                  : 'border-border bg-white dark:bg-gray-800 text-text-muted hover:border-navy/30 hover:bg-gray-50 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              <span className="font-bold mr-2 opacity-50">{answer.code})</span>
              {answer.text}
            </button>
          )
        })}
      </div>

      {current > 0 && (
        <button
          onClick={() => setCurrent((c) => c - 1)}
          className="text-[10px] text-text-subtle hover:text-text-muted transition-colors"
        >
          ← Pregunta anterior
        </button>
      )}
    </div>
  )
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
  const res = RESISTANCE_CONFIG[resistance]

  const scoreBars = [
    { label: 'Adopción IA',  value: result.adoptionScore,  color: 'bg-success-dark' },
    { label: 'Influencia',   value: result.influenceScore, color: 'bg-navy' },
    { label: 'Apertura',     value: result.opennessScore,  color: 'bg-info-dark' },
  ]

  return (
    <div className="space-y-5">
      {/* Resultado automático */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Clasificación automática · {form.name}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${arc.badgeBg} ${arc.badgeText}`}>
            {arc.label}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${res.badgeBg} ${res.badgeText}`}>
            {res.label}
          </span>
          {isOverride && (
            <span className="text-[10px] text-warning-dark bg-warning-light px-2 py-0.5 rounded-full font-medium">
              Ajustado manualmente
            </span>
          )}
        </div>

        <p className="text-[11px] text-text-muted leading-relaxed">{arc.description}</p>

        {/* Scores */}
        <div className="space-y-1.5">
          {scoreBars.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-[10px] text-text-subtle w-20 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(ARCHETYPE_CONFIG) as ArchetypeCode[]).map((code) => {
            const a = ARCHETYPE_CONFIG[code]
            return (
              <button
                key={code}
                onClick={() => setArchetype(code)}
                className={[
                  'px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 text-center',
                  archetype === code
                    ? `${a.badgeBg} ${a.badgeText} border-transparent`
                    : 'border-border text-text-subtle hover:border-gray-300 dark:hover:border-gray-600',
                ].join(' ')}
              >
                {a.label}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 mt-1">
          {(['baja', 'media', 'alta'] as ResistanceLevel[]).map((r) => {
            const rc = RESISTANCE_CONFIG[r]
            return (
              <button
                key={r}
                onClick={() => setResistance(r)}
                className={[
                  'flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150',
                  resistance === r
                    ? `${rc.badgeBg} ${rc.badgeText} border-transparent`
                    : 'border-border text-text-subtle hover:border-gray-300 dark:hover:border-gray-600',
                ].join(' ')}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => onConfirm(archetype, resistance, isOverride)}
        className="w-full py-2.5 rounded-lg text-xs font-semibold bg-navy-metallic text-white hover:bg-navy-metallic-hover shadow-sm active:scale-[0.98] transition-all duration-150"
      >
        Añadir a la matrix
      </button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function InterviewModal({ onClose, onSubmit, existingDepartments }: InterviewModalProps) {
  const [phase,   setPhase]   = useState<Phase>('form')
  const [form,    setForm]    = useState<NewStakeholderForm>({ name: '', role: '', department: '' })
  const [answers, setAnswers] = useState<Record<number, InterviewAnswerCode>>({})

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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
      name:       form.name.trim(),
      role:       form.role.trim(),
      department: form.department.trim(),
      archetype,
      resistance,
      manualOverride,
      interview: {
        ...result,
        archetype,
        resistance,
        computedAt: new Date().toISOString(),
      },
    })
  }

  const phaseTitle: Record<Phase, string> = {
    form:      'Nuevo stakeholder',
    interview: 'Entrevista de clasificación',
    result:    'Resultado del assessment',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-2xl shadow-black/20 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 flex items-center justify-between px-6 py-4 border-b border-border z-10">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[10px] font-mono font-semibold text-navy dark:text-info-soft uppercase">
                T2
              </span>
              <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">
                {phaseTitle[phase]}
              </h3>
            </div>
            {phase !== 'form' && (
              <p className="text-[11px] text-text-subtle">{form.name} · {form.role}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-text-subtle hover:text-lean-black dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l11 11M12 1L1 12" />
            </svg>
          </button>
        </div>

        {/* Contenido por fase */}
        <div className="px-6 py-5">
          {phase === 'form'      && <StakeholderFormPhase  onNext={handleFormNext}               existingDepartments={existingDepartments} />}
          {phase === 'interview' && <InterviewPhase         onComplete={handleInterviewComplete} />}
          {phase === 'result'    && <ResultPhase            form={form} answers={answers}         onConfirm={handleConfirm} />}
        </div>
      </div>
    </div>
  )
}
