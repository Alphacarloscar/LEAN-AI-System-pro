import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Button — D9 sistema de diseño
//
// Variants:
//   primary  → navy-metallic gradient — CTAs principales
//   secondary → borde navy + fondo blanco — acciones secundarias
//   ghost    → sin borde ni fondo — acciones terciarias/destructurales
//   danger   → rojo pastel — acciones destructivas
//
// Sizes: sm | md (default) | lg
// States: default | hover | focus | disabled | loading
// ─────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  loading?:   boolean
  iconLeft?:  ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
  children:   ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-navy-metallic text-white border-transparent',
    'hover:bg-navy-metallic-hover',
    'focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'shadow-sm',
  ].join(' '),

  secondary: [
    'bg-white text-navy border border-navy/30',
    'hover:border-navy hover:bg-gray-50',
    'focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'dark:bg-transparent dark:text-gray-100 dark:border-gray-600',
    'dark:hover:border-gray-400 dark:hover:bg-white/5',
  ].join(' '),

  ghost: [
    'bg-transparent text-navy border-transparent',
    'hover:bg-navy/5 hover:text-navy-dark',
    'focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'dark:text-gray-200 dark:hover:bg-white/5',
  ].join(' '),

  danger: [
    'bg-danger text-white border-transparent',
    'hover:bg-danger-dark',
    'focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8  px-3  text-label gap-1.5',
  md: 'h-10 px-4  text-label gap-2',
  lg: 'h-12 px-6  text-sm   gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      loading   = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          // Base
          'inline-flex items-center justify-center',
          'font-medium rounded transition-all duration-150',
          'select-none outline-none',
          // Variant + size
          variantClasses[variant],
          sizeClasses[size],
          // Full width
          fullWidth ? 'w-full' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {/* Spinner cuando loading */}
        {loading ? (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : iconLeft ? (
          <span className="shrink-0" aria-hidden="true">{iconLeft}</span>
        ) : null}

        <span>{children}</span>

        {!loading && iconRight ? (
          <span className="shrink-0" aria-hidden="true">{iconRight}</span>
        ) : null}
      </button>
    )
  }
)

Button.displayName = 'Button'
