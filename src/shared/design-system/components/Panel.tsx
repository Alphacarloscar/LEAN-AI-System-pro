import { type HTMLAttributes, type ReactNode } from 'react'

// Panel — sección destacada dentro de una página
// Más ligero que Modal — no interrumpe el flujo, es inline.
// Usado en dashboards T10, resúmenes de herramienta, secciones de formulario.

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?:    string
  subtitle?: string
  action?:   ReactNode   // botón/link en la esquina superior derecha
  children:  ReactNode
  noPadding?: boolean
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  noPadding = false,
  className = '',
  ...props
}: PanelProps) {
  return (
    <section
      className={[
        'rounded-lg border border-border bg-white dark:bg-gray-900 dark:border-gray-700',
        className,
      ].join(' ')}
      {...props}
    >
      {/* Header */}
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-6 py-4 shadow-line-bottom">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* Contenido */}
      <div className={noPadding ? '' : 'px-6 py-4'}>
        {children}
      </div>
    </section>
  )
}
