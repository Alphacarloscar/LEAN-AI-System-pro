import { type HTMLAttributes, type ReactNode } from 'react'

// ─── Types ─────────────────────────────────────────────────────

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'navy'
  | 'navy-ghost'
  | 'gold'

export type BadgeShape = 'rounded' | 'pill'
export type BadgeSize  = 'xs' | 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:  BadgeVariant
  shape?:    BadgeShape
  size?:     BadgeSize
  /** Color dot rendered before the text */
  dot?:      boolean
  children:  ReactNode
}

// ─── Variant classes ───────────────────────────────────────────

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-warm-100/60 text-warm-800 dark:bg-warm-700 dark:text-warm-100',
  success: 'bg-success-light text-success-dark dark:bg-success/20 dark:text-success',
  warning: 'bg-warning-light text-warning-dark dark:bg-warning/20 dark:text-warning',
  danger:  'bg-danger-light  text-danger-dark  dark:bg-danger/20  dark:text-danger',
  info:    'bg-info-light    text-info-dark    dark:bg-info/20    dark:text-info',
  navy:         'bg-navy-metallic dark:bg-gold-metallic text-white dark:text-lean-black',
  'navy-ghost': 'bg-navy/10 dark:bg-warm-600 text-navy dark:text-warm-50 dark:border dark:border-warm-500',
  gold:         'bg-gold/10 text-gold dark:bg-gold/20 dark:text-gold-hover',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-warm-400',
  success: 'bg-success-dark',
  warning: 'bg-warning-dark',
  danger:  'bg-danger-dark',
  info:    'bg-info-dark',
  navy:         'bg-white',
  'navy-ghost': 'bg-navy',
  gold:         'bg-gold',
}

// ─── Size classes ──────────────────────────────────────────────

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'px-2   py-0.5 text-[10px] font-semibold gap-1',
  sm: 'px-2   py-0.5 text-xs    gap-1',
  md: 'px-2.5 py-1   text-label gap-1.5',
}

// ─── Component ─────────────────────────────────────────────────

export function Badge({
  variant   = 'default',
  shape     = 'rounded',
  size      = 'sm',
  dot       = false,
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
