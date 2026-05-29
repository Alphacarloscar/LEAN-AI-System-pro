// ============================================================
// loadTrace — Instrumentación de cargas por recurso
//
// Registra el ciclo de vida de cada llamada a ensureLoaded:
//   started → completed | skipped | error
//
// Solo activo en DEV (import.meta.env.DEV).
// En producción, logTrace() es un no-op.
// ============================================================

export interface LoadTrace {
  resourceName:   string
  projectId:      string
  requestId:      string
  reason?:        string
  status:         'started' | 'completed' | 'skipped' | 'error'
  durationMs?:    number
  rowsCount?:     number
  skippedReason?: string
  error?:         string
}

export function logTrace(trace: LoadTrace): void {
  if (!import.meta.env.DEV) return

  const icon =
    trace.status === 'completed' ? '✓' :
    trace.status === 'skipped'   ? '↷' :
    trace.status === 'error'     ? '✗' : '→'

  const parts: string[] = [
    `[LoadTrace:${trace.resourceName}]`,
    icon,
    trace.status.toUpperCase(),
  ]

  if (trace.reason)        parts.push(`reason=${trace.reason}`)
  if (trace.durationMs)    parts.push(`${trace.durationMs}ms`)
  if (trace.rowsCount != null) parts.push(`rows=${trace.rowsCount}`)
  if (trace.skippedReason) parts.push(`skip=${trace.skippedReason}`)
  if (trace.error)         parts.push(`err=${trace.error}`)

  console.log(parts.join(' '), { projectId: trace.projectId, requestId: trace.requestId })
}
