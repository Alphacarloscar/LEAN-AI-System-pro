import * as Sentry from '@sentry/react'

export function initSentry(): void {
  const dsn     = import.meta.env.VITE_SENTRY_DSN as string | undefined
  const enabled = import.meta.env.VITE_SENTRY_ENABLED === 'true'

  if (!enabled || !dsn) return

  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_APP_ENV as string | undefined) ?? 'development',
    // Capture all traces in DEV/PRE; 10% sample in PRO to limit quota
    tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,
    // Replay only on errors (all envs)
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
  })
}
