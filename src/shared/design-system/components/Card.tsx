import { type HTMLAttributes, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Card — contenedor principal del sistema (12px radius — D9)
//
// Variants:
//   default  → fondo blanco, borde sutil
//   elevated → sombra sin borde (para modales secundarios, paneles flotantes)
//   flat     → sin borde ni sombra (para uso dentro de otros cards)
// ─────────────────────────────────────────────────────────────

export type CardVariant = 'default' | 'elevated' | 'flat'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?:  CardVariant
  padding?:  CardPadding
  header?:   ReactNode
  footer?:   ReactNode
  children:  ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  default:  'bg-white border-border shadow-border dark:bg-gray-900 dark:shadow-border-dark',
  elevated: 'bg-white shadow-lg border-transparent dark:bg-gray-900',
  flat:     'bg-transparent border-transparent',
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

export function Card({
  variant  = 'default',
  padding  = 'md',
  header,
  footer,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-lg border',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {/* Header opcional */}
      {header && (
        <div className="px-6 py-4 shadow-line-bottom">
          {header}
        </div>
      )}

      {/* Contenido */}
      <div className={header || footer ? 'px-6 py-4' : paddingClasses[padding]}>
        {children}
      </div>

      {/* Footer opcional */}
      {footer && (
        <div className="px-6 py-4 shadow-line-top bg-surface dark:bg-gray-800/50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  )
}
