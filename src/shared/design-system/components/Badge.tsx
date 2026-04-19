import { type HTMLAttributes, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Badge — etiqueta de estado pequeña
//
// Variants: default | success | warning | danger | info | navy
// Shape: rounded (8px) | pill (9999px — para scores y KPIs)
// ─────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'navy'
export type BadgeShape   = 'rounded' | 'pill'
export type BadgeSize    = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:  BadgeVariant
  shape?:    BadgeShape
  size?:     BadgeSize
  dot?:      boolean      // indicador de punto de color antes del texto
  children:  ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  success: 'bg-success-light text-success-dark dark:bg-success/20 dark:text-success',
  warning: 'bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning',
  danger:  'bg-danger-light  text-danger-dark  dark:bg-danger/20  dark:text-danger',
  info:    'bg-info-light    text-info-dark    dark:bg-info/20    dark:text-info',
  navy:    'bg-navy-metallic text-white',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  success: 'bg-success-dark',
  warning: 'bg-warning-dark',
  danger:  'bg-danger-dark',
  info:    'bg-info-dark',
  navy:    'bg-white',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-label gap-1.5',
}

export function Badge({
  variant  = 'default',
  shape    = 'rounded',
  size     = 'sm',
  dot      = false,
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center font-medium',
        shape === 'pill' ? 'rounded-full' : 'rounded',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {dot && (
        <span
          className={`shrink-0 h-1.5 w-1.5 rounded-full ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
