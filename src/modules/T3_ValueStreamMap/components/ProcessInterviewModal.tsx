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

import { useState } from 'react'
import {
  computeProcessInterviewResult,
  generateOpportunities,
  getOpportunityLevel,
} from '../constants'
import type {
  InterviewAnswerCode,
  AICategoryCode,
  OrgReadinessLevel,
  NewValueStreamForm,
  ValueStream,
} from '../types'
import { Modal } from '@shared/design-system/components'
import { ProcessFormPhase }  from './ProcessFormPhase'
import { InterviewPhase }    from './InterviewPhase'
import { ResultPhase }       from './ResultPhase'

// ── Props ─────────────────────────────────────────────────────

interface ProcessInterviewModalProps {
  onClose:  () => void
  onSubmit: (process: Omit<ValueStream, 'id' | 'createdAt'>) => void
}

// ── Fases del modal ───────────────────────────────────────────

type Phase = 'form' | 'interview' | 'result'

// ── Modal principal ───────────────────────────────────────────

export function ProcessInterviewModal({ onClose, onSubmit }: ProcessInterviewModalProps) {
  const [phase, setPhase]       = useState<Phase>('form')
  const [formData, setFormData] = useState<NewValueStreamForm>({
    name: '', department: '', owner: '', ownerRole: '', description: '', phase: 'validacion',
  })
  const [answers, setAnswers]   = useState<Record<number, InterviewAnswerCode>>({})

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
