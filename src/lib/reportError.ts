import * as Sentry from '@sentry/react'

/**
 * Reporta un error a console.error + Sentry (no-op si Sentry no está inicializado).
 * Usar en catch blocks de operaciones de background — no para validación de input.
 */
export function reportError(context: string, err: unknown): void {
  console.error(context, err)
  Sentry.captureException(err, { tags: { context } })
}
