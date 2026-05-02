// ============================================================
// T1 — Vista completa (AI Readiness Assessment)
//
// Layout: header sticky (breadcrumb + progreso + score)
//         + selector de entrevistado
//         + two-column (dimensiones | radar sticky)
//         + executive output (QW1) al final
//
// Novedad Sprint 2:
//   — 6 dimensiones × 4 subdimensiones (escala 0-4)
//   — Selector de entrevistados (IT vs. Negocio)
//   — Estado por entrevistado (scores independientes)
//   — Gap IT/Negocio en T1ExecutiveOutput
// ============================================================

import { useState, useMemo, useRef, useEffect } from 'react'
import type { DemoScenario }                    from '@/data/demo/types'
import { DIMENSION_DEFINITIONS, TOTAL_SUBDIMENSIONS } from './constants'
import type { T1DimensionState, T1SubdimensionState } from './types'
import { countScoredSubdimensions, computeOverallScore } from './types'
import { DimensionCard }                        from './components/DimensionCard'
import { T1RadarPanel }                         from './components/T1RadarPanel'
import { T1ExecutiveOutput }                    from './components/T1ExecutiveOutput'
import { PhaseMiniMap }                         from '@/shared/components/PhaseMiniMap'
import type { IntervieweeAggregate }            from './components/T1ExecutiveOutput'

interface T1ViewProps {
  scenario: DemoScenario
  onBack:   () => void
}

// ── Builder: T1DimensionState[] desde un entrevistado demo ────

function buildDimensionsForInterviewee(
  intervieweeScores: Record<string, number>,
  intervieweeEvidence: Record<string, string> = {}
): T1DimensionState[] {
  return DIMENSION_DEFINITIONS.map((def) => ({
    code:      def.code,
    label:     def.label,
    dimNumber: def.dimNumber,
    subdimensions: def.subdimensions.map((sub): T1SubdimensionState => ({
      code:          sub.code,
      label:         sub.label,
      dimensionCode: def.code,
      score:         intervieweeScores[sub.code] ?? null,
      evidence:      intervieweeEvidence[sub.code] ?? '',
      showCriteria:  false,
      showEvidence:  !!(intervieweeEvidence[sub.code]),
    })),
  }))
}

// ── Modal: nueva entrevista ───────────────────────────────────

interface NewIntervieweeForm {
  name: string
  role: string
  type: 'it' | 'business'
}

interface NewInterviewModalProps {
  onClose:  () => void
  onSubmit: (form: NewIntervieweeForm) => void
}

function NewInterviewModal({ onClose, onSubmit }: NewInterviewModalProps) {
  const [form, setForm] = useState<NewIntervieweeForm>({
    name: '',
    role: '',
    type: 'business',
  })
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const canSubmit = form.name.trim().length > 0 && form.role.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(form)
  }

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Card del modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-2xl shadow-black/20">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[10px] font-mono font-semibold text-navy dark:text-warm-100 uppercase">
                T1
              </span>
              <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">
                Nueva entrevista
              </h3>
            </div>
            <p className="text-[11px] text-text-subtle">
              Añade un nuevo entrevistado al assessment en curso
            </p>
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle">
              Nombre
            </label>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Javier Morales"
              className={[
                'w-full px-3 py-2 rounded-lg text-sm text-lean-black dark:text-gray-100',
                'bg-gray-50 dark:bg-gray-800 border border-border',
                'placeholder:text-text-subtle',
                'focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40',
                'transition-all duration-150',
              ].join(' ')}
            />
          </div>

          {/* Cargo */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle">
              Cargo
            </label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="Ej. CIO, Head of Digital, COO…"
              className={[
                'w-full px-3 py-2 rounded-lg text-sm text-lean-black dark:text-gray-100',
                'bg-gray-50 dark:bg-gray-800 border border-border',
                'placeholder:text-text-subtle',
                'focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40',
                'transition-all duration-150',
              ].join(' ')}
            />
          </div>

          {/* Tipo IT / Negocio */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle">
              Perfil
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['it', 'business'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={[
                    'py-2 rounded-lg text-xs font-semibold border transition-all duration-150',
                    form.type === t
                      ? t === 'it'
                        ? 'bg-navy-metallic text-white border-navy shadow-sm'
                        : 'bg-success-dark text-white border-success-dark shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-text-muted border-border hover:border-gray-300',
                  ].join(' ')}
                >
                  {t === 'it' ? 'IT / Tecnología' : 'Negocio / Ops'}
                </button>
              ))}
            </div>
          </div>

          {/* Nota informativa */}
          <p className="text-[11px] text-text-subtle px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-border/60">
            Se crearán <span className="font-medium text-text-muted">{TOTAL_SUBDIMENSIONS} subdimensiones</span> en blanco para este entrevistado. Puntúalas en la sesión.
          </p>

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-xs font-medium text-text-muted border border-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={[
                'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                canSubmit
                  ? 'bg-navy-metallic text-white hover:bg-navy-metallic-hover shadow-sm active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed',
              ].join(' ')}
            >
              Crear entrevista
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export function T1View({ scenario, onBack }: T1ViewProps) {

  const [showNewModal,      setShowNewModal]      = useState(false)
  const [showInterviewees,  setShowInterviewees]  = useState(false)

  // Lista de entrevistados: los del scenario + los añadidos en vivo
  const [liveInterviewees, setLiveInterviewees] = useState(scenario.interviewees)

  // Estado por entrevistado: Record<id, T1DimensionState[]>
  const [intervieweeStates, setIntervieweeStates] = useState<Record<string, T1DimensionState[]>>(
    () => Object.fromEntries(
      scenario.interviewees.map((i) => [
        i.id,
        buildDimensionsForInterviewee(i.scores, i.evidence ?? {}),
      ])
    )
  )

  const [activeId, setActiveId] = useState<string>(scenario.interviewees[0]?.id ?? '')

  // Añadir nuevo entrevistado en vivo
  function addInterviewee(form: NewIntervieweeForm) {
    const newId = `live-${Date.now()}`
    const newPerson = {
      id:        newId,
      name:      form.name.trim(),
      role:      form.role.trim(),
      archetype: form.type === 'it' ? 'Perfil IT' : 'Perfil Negocio',
      type:      form.type,
      scores:    {} as Record<string, number>,
    }
    setLiveInterviewees((prev) => [...prev, newPerson])
    setIntervieweeStates((prev) => ({
      ...prev,
      [newId]: buildDimensionsForInterviewee({}),
    }))
    setActiveId(newId)
    setShowNewModal(false)
  }

  // Dimensiones activas del entrevistado seleccionado
  const activeDimensions = intervieweeStates[activeId] ?? []

  // Actualizar una dimensión del entrevistado activo
  function updateDimension(updated: T1DimensionState) {
    setIntervieweeStates((prev) => ({
      ...prev,
      [activeId]: prev[activeId].map((d) => d.code === updated.code ? updated : d),
    }))
  }

  // Métricas de progreso del entrevistado activo
  const scoredCount  = useMemo(
    () => countScoredSubdimensions(activeDimensions),
    [activeDimensions]
  )
  const overallScore = useMemo(
    () => computeOverallScore(activeDimensions),
    [activeDimensions]
  )

  // Datos para el gap IT/Negocio en T1ExecutiveOutput
  const allIntervieweeAggregates: IntervieweeAggregate[] = liveInterviewees.map((i) => ({
    id:         i.id,
    name:       i.name,
    role:       i.role,
    type:       i.type,
    dimensions: intervieweeStates[i.id] ?? [],
  }))

  const activeInterviewee = liveInterviewees.find((i) => i.id === activeId)

  // Dimensiones agregadas: promedio de todos los entrevistados → para el QW1 Executive Output
  // El score del header sigue siendo individual (el del entrevistado activo).
  const aggregateDimensions = useMemo((): T1DimensionState[] => {
    const allStates = Object.values(intervieweeStates)
    if (allStates.length === 0) return []
    const template = allStates[0]
    return template.map((dim) => ({
      ...dim,
      subdimensions: dim.subdimensions.map((sub) => {
        const scores = allStates
          .map((state) =>
            state.find((d) => d.code === dim.code)
              ?.subdimensions.find((s) => s.code === sub.code)?.score ?? null
          )
          .filter((s): s is number => s !== null)
        const avg = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null
        return { ...sub, score: avg }
      }),
    }))
  }, [intervieweeStates])

  return (
    <div className="min-h-screen bg-surface dark-page-bg">

      {/* ── Header de herramienta ── */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-border px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">

          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-lean-black dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Volver al dashboard
          </button>

          <span className="text-text-subtle">·</span>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[10px] font-mono font-semibold text-navy dark:text-warm-100 uppercase tracking-wider">
              T1
            </span>
            <h1 className="text-sm font-semibold text-lean-black dark:text-gray-100 truncate">
              AI Readiness Assessment
            </h1>
            <PhaseMiniMap phaseId="listen" toolCode="T1" />
          </div>

          {/* Nueva entrevista — acceso directo desde header (U-04) */}
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-metallic text-white hover:bg-navy-metallic-hover transition-colors shadow-sm shrink-0"
          >
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M8 2v12M2 8h12" />
            </svg>
            Nueva entrevista
          </button>

          {/* Progreso + score */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-text-subtle tabular-nums">
              <span className="font-semibold text-lean-black dark:text-gray-200">{scoredCount}</span>
              /{TOTAL_SUBDIMENSIONS} subdimensiones puntuadas
            </span>
            <div className="text-right">
              <span className="text-xl font-bold tabular-nums text-lean-black dark:text-gray-100">
                {overallScore.toFixed(1)}
              </span>
              <span className="text-sm font-light text-text-muted"> / 4</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Empresa + contexto ── */}
      <div className="max-w-6xl mx-auto px-8 pt-6 pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-sm font-semibold text-lean-black dark:text-gray-100">
            {scenario.company.name}
          </p>
          <span className="text-text-subtle">·</span>
          <p className="text-xs text-text-muted">{scenario.company.industry}</p>
          <span className="text-text-subtle">·</span>
          <p className="text-xs text-text-muted">
            {scenario.company.employees.toLocaleString('es-ES')} empleados
          </p>
        </div>
        <p className="text-xs text-text-subtle mt-1 max-w-xl">
          Selecciona el entrevistado y ajusta los scores en tiempo real. El informe ejecutivo se genera automáticamente.
        </p>
      </div>

      {/* ── Selector de entrevistados — collapsible ── */}
      <div className="max-w-6xl mx-auto px-8 py-3">
        <div className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">

          {/* Toggle bar */}
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer
            hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => setShowInterviewees((v) => !v)}
          >
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                Entrevistado activo
              </span>
              <span className="px-2 py-0.5 rounded-full bg-navy/8 dark:bg-navy/15 text-[10px]
                font-semibold text-navy dark:text-warm-100">
                {liveInterviewees.length} entrevistados
              </span>
              <span className="text-[10px] text-text-subtle">
                {liveInterviewees.filter((i) => i.type === 'it').length} IT ·{' '}
                {liveInterviewees.filter((i) => i.type !== 'it').length} BIZ
              </span>
              {activeInterviewee && (
                <span className="text-[10px] text-text-muted">
                  Puntuando: <span className="font-semibold text-lean-black dark:text-gray-200">
                    {activeInterviewee.name}
                  </span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <svg
                className={`h-3.5 w-3.5 text-text-subtle transition-transform duration-200 ${showInterviewees ? 'rotate-180' : ''}`}
                viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </div>

          {/* Expandido: lista de entrevistados */}
          {showInterviewees && (
            <div className="border-t border-border px-4 py-3">
              <div className="flex gap-2 flex-wrap">
                {liveInterviewees.map((person) => {
                  const personDims   = intervieweeStates[person.id] ?? []
                  const personScored = countScoredSubdimensions(personDims)
                  const isActive     = person.id === activeId
                  const isComplete   = personScored === TOTAL_SUBDIMENSIONS

                  return (
                    <button
                      key={person.id}
                      onClick={() => setActiveId(person.id)}
                      className={[
                        'flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all duration-150',
                        isActive
                          ? 'bg-navy-metallic text-white border-navy shadow-sm'
                          : 'bg-white dark:bg-gray-900 border-border hover:border-navy/30 hover:bg-gray-50 dark:hover:bg-gray-800',
                      ].join(' ')}
                    >
                      <span className={[
                        'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
                        isActive
                          ? 'bg-white/20 text-white'
                          : person.type === 'it'
                            ? 'bg-navy/10 text-navy dark:bg-navy/20 dark:text-warm-100'
                            : 'bg-warning-light text-warning-dark',
                      ].join(' ')}>
                        {person.type === 'it' ? 'IT' : 'BIZ'}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-lean-black dark:text-gray-100'}`}>
                          {person.name}
                        </p>
                        <p className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-text-muted'}`}>
                          {person.role}
                        </p>
                      </div>
                      <span className={`text-[10px] tabular-nums shrink-0 ${isActive ? 'text-white/70' : 'text-text-subtle'}`}>
                        {isComplete ? (
                          <svg className="h-3.5 w-3.5 text-current" viewBox="0 0 16 16" fill="currentColor">
                            <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.78 5.22a.75.75 0 010 1.06l-4 4a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06L7.25 9.69l3.47-3.47a.75.75 0 011.06 0z" />
                          </svg>
                        ) : (
                          `${personScored}/${TOTAL_SUBDIMENSIONS}`
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Layout two-column ── */}
      <div className="max-w-6xl mx-auto px-8 pb-6">
        <div className="flex gap-6 items-start">

          {/* Columna izquierda — 6 DimensionCards */}
          <div className="flex-1 min-w-0 space-y-3">
            {activeDimensions.map((dim) => {
              const def = DIMENSION_DEFINITIONS.find((d) => d.code === dim.code)
              if (!def) return null
              return (
                <DimensionCard
                  key={dim.code}
                  state={dim}
                  definition={def}
                  onChange={updateDimension}
                />
              )
            })}
          </div>

          {/* Columna derecha — RadarPanel sticky */}
          <div className="w-72 xl:w-80 shrink-0 sticky top-20">
            <T1RadarPanel dimensions={activeDimensions} />
          </div>

        </div>

        {/* ── Executive Output (QW1) — usa el promedio de TODOS los entrevistados ── */}
        <div className="mt-8">
          <T1ExecutiveOutput
            dimensions={aggregateDimensions}
            companyName={scenario.company.name}
            allInterviewees={allIntervieweeAggregates}
          />
        </div>
      </div>

      {/* ── Modal nueva entrevista ── */}
      {showNewModal && (
        <NewInterviewModal
          onClose={() => setShowNewModal(false)}
          onSubmit={addInterviewee}
        />
      )}
    </div>
  )
}
