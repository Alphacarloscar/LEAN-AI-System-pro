// ============================================================
// InterviewPhase — Step 2 of ProcessInterviewModal (MCQ)
// ============================================================

import { useState } from 'react'
import { INTERVIEW_QUESTIONS } from '../constants'
import type { InterviewAnswerCode } from '../types'

// ── ProgressBar ───────────────────────────────────────────────

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

// ── InterviewPhase ────────────────────────────────────────────

interface InterviewPhaseProps {
  onComplete: (answers: Record<number, InterviewAnswerCode>) => void
}

export function InterviewPhase({ onComplete }: InterviewPhaseProps) {
  const [currentQ, setCurrentQ]     = useState(0)
  const [answers, setAnswers]       = useState<Record<number, InterviewAnswerCode>>({})
  const [pendingAnswer, setPending] = useState<InterviewAnswerCode | null>(null)
  const total = INTERVIEW_QUESTIONS.length

  function handleAnswer(code: InterviewAnswerCode) {
    if (pendingAnswer) return
    const qId  = INTERVIEW_QUESTIONS[currentQ].id
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
