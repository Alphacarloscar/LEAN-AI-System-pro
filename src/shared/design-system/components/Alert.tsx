import { type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Alert — notificación full-width con icono
//
// Variants: info | success | warning | danger
// Dismissible: opcional, llama a onDismiss
// ─────────────────────────────────────────────────────────────

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps {
  variant?:    AlertVariant
  title?:      string
  children:    ReactNode
  dismissible?: boolean
  onDismiss?:  () => void
  className?:  string
}

const variantConfig: Record<AlertVariant, {
  container: string
  icon:      ReactNode
  title:     string
  text:      string
}> = {
  info: {
    container: 'bg-info-light border-info dark:bg-info/10 dark:border-info/40',
    icon: (
      <svg className="h-5 w-5 text-info-dark dark:text-info" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    title: 'text-info-dark dark:text-info',
    text:  'text-info-dark/80 dark:text-info/80',
  },
  success: {
    container: 'bg-success-light border-success dark:bg-success/10 dark:border-success/40',
    icon: (
      <svg className="h-5 w-5 text-success-dark dark:text-success" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    title: 'text-success-dark dark:text-success',
    text:  'text-success-dark/80 dark:text-success/80',
  },
  warning: {
    container: 'bg-warning-light border-warning dark:bg-warning/10 dark:border-warning/40',
    icon: (
      <svg className="h-5 w-5 text-warning-dark dark:text-warning" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    title: 'text-warning-dark dark:text-warning',
    text:  'text-warning-dark/80 dark:text-warning/80',
  },
  danger: {
    container: 'bg-danger-light border-danger dark:bg-danger/10 dark:border-danger/40',
    icon: (
      <svg className="h-5 w-5 text-danger-dark dark:text-danger" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    title: 'text-danger-dark dark:text-danger',
    text:  'text-danger-dark/80 dark:text-danger/80',
  },
}

export function Alert({
  variant     = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  className   = '',
}: AlertProps) {
  const config = variantConfig[variant]

  return (
    <div
      role="alert"
      className={[
        'flex gap-3 p-4 rounded-lg border',
        config.container,
        className,
      ].join(' ')}
    >
      {/* Icono */}
      <span className="shrink-0 mt-0.5" aria-hidden="true">
        {config.icon}
      </span>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-sm font-semibold mb-0.5 ${config.title}`}>
            {title}
          </p>
        )}
        <div className={`text-sm ${config.text}`}>
          {children}
        </div>
      </div>

      {/* Dismiss */}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Cerrar alerta"
          className="shrink-0 -mt-0.5 -mr-0.5 p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
