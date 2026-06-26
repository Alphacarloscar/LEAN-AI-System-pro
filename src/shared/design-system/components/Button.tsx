import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg'

// Base props shared by all button shapes
type BaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?:   ButtonVariant
  size?:      ButtonSize
  loading?:   boolean
  /** Icon rendered on the left (or centered when no children) */
  icon?:      ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

// Text button — children required, aria-label optional
type WithChildren = BaseProps & {
  children: ReactNode
  'aria-label'?: string
}

// Icon-only button — aria-label is required for accessibility
type IconOnly = BaseProps & {
  children?: never
  'aria-label': string
}

export type ButtonProps = WithChildren | IconOnly

// ─── Variant classes ───────────────────────────────────────────
const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-navy-metallic text-white border-transparent',
    'hover:bg-navy-metallic-hover active:scale-[0.98]',
    'dark:bg-gold-metallic dark:text-lean-black dark:hover:bg-gold-metallic-hover',
    'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    'shadow-sm',
  ].join(' '),

  secondary: [
    'bg-white text-navy border border-navy/30',
    'hover:border-navy hover:bg-surface active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    'dark:bg-transparent dark:text-warm-50 dark:border-warm-400',
    'dark:hover:border-warm-300 dark:hover:bg-white/5',
  ].join(' '),

  ghost: [
    'bg-transparent text-navy border-transparent',
    'hover:bg-navy/5 hover:text-lean-black active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
    'dark:text-warm-100 dark:hover:bg-white/5',
  ].join(' '),

  danger: [
    'bg-danger text-white border-transparent',
    'hover:bg-danger-dark active:scale-[0.98]',
    'focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
  ].join(' '),

  // No background, no border, no fixed height — lives inline in text rows.
  // Font-size inherits from context (no text-* imposed here).
  link: [
    'bg-transparent border-transparent text-gold-text',
    'hover:underline',
    'dark:text-gold dark:hover:text-gold-hover',
    'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
}

// ─── Size classes (text + icon-only) ──────────────────────────
const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7  px-2.5 text-[10px] gap-1',
  sm: 'h-8  px-3   text-label gap-1.5',
  md: 'h-10 px-4   text-label gap-2',
  lg: 'h-12 px-6   text-sm   gap-2.5',
}

// Square dimensions for icon-only buttons
const iconOnlySize: Record<ButtonSize, string> = {
  xs: 'h-7  w-7',
  sm: 'h-8  w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

// ─── Spinner ───────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
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
  )
}

// ─── Component ─────────────────────────────────────────────────
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      loading   = false,
      icon,
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
    const isLink     = variant === 'link'
    const isIconOnly = !isLink && !children && icon !== undefined

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={[
          'inline-flex items-center justify-center',
          'font-medium rounded transition-all duration-150',
          'select-none outline-none',
          variantClasses[variant],
          isLink ? 'gap-1 p-0' : (isIconOnly ? iconOnlySize[size] : sizeClasses[size]),
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading ? (
          <Spinner />
        ) : icon ? (
          <span className="shrink-0" aria-hidden="true">{icon}</span>
        ) : null}

        {children != null && <span>{children}</span>}

        {!loading && iconRight ? (
          <span className="shrink-0" aria-hidden="true">{iconRight}</span>
        ) : null}
      </button>
    )
  }
)

Button.displayName = 'Button'
