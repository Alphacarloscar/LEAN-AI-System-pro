import { type HTMLAttributes, type ReactNode } from 'react'

// ─── Types ─────────────────────────────────────────────────────

/**
 * flat     — sin borde ni sombra; para uso dentro de otros cards
 * elevated — sombra sin borde; para modales secundarios y paneles flotantes
 * outlined — borde visible sin sombra; variante de superficie estándar
 */
export type CardVariant = 'flat' | 'elevated' | 'outlined' | 'featured'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?:  CardVariant
  padding?:  CardPadding
  header?:   ReactNode
  footer?:   ReactNode
  children:  ReactNode
}

// ─── Variant classes ───────────────────────────────────────────

const variantClasses: Record<CardVariant, string> = {
  outlined: [
    'bg-white border border-border',
    'dark:bg-warm-800 dark:border-warm-600/30',
  ].join(' '),

  elevated: [
    'bg-white border border-transparent shadow-sm',
    'dark:bg-warm-800 dark:shadow-warm-card',
  ].join(' '),

  flat: 'bg-transparent border-transparent',

  featured: [
    'bg-white border border-warm-200 border-t-2 border-t-gold shadow-sm',
    'dark:bg-warm-800 dark:border-warm-600/30 dark:border-t-gold',
  ].join(' '),
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

// ─── Component ─────────────────────────────────────────────────

export function Card({
  variant  = 'outlined',
  padding  = 'md',
  header,
  footer,
  children,
  className = '',
  ...props
}: CardProps) {
  const hasSlots = Boolean(header || footer)

  return (
    <div
      className={[
        'rounded-xl border',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-border dark:border-warm-600/30">
          {header}
        </div>
      )}

      <div className={hasSlots ? 'px-6 py-4' : paddingClasses[padding]}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-border bg-surface rounded-b-lg dark:border-warm-600/30 dark:bg-warm-800/50">
          {footer}
        </div>
      )}
    </div>
  )
}
