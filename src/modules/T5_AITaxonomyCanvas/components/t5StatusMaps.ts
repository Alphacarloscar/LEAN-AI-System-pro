// ============================================================
// T5 — Inline status maps shared across modal components
// ============================================================

export const UC_STATUS_LABEL: Record<string, string> = {
  go: 'Go', en_piloto: 'En piloto', priorizado: 'Priorizado',
  candidato: 'Candidato', no_go: 'No-Go', completado: 'Completado',
}

export const UC_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  go:         { bg: 'bg-success-light', text: 'text-success-dark' },
  en_piloto:  { bg: 'bg-warning-light', text: 'text-warning-dark' },
  priorizado: { bg: 'bg-info-light',    text: 'text-info-dark' },
  candidato:  { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500' },
  no_go:      { bg: 'bg-danger-light',  text: 'text-danger-dark' },
  completado: { bg: 'bg-navy/10',       text: 'text-navy' },
}

export const PHASE_LABEL: Record<string, string> = {
  idea: 'Idea', validacion: 'Validación', piloto: 'Piloto',
  estandarizacion: 'Estandarización', escalado: 'Escalado',
}
