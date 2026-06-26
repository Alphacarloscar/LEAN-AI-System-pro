import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Input — D9 sistema de diseño
//
// Estados: default | focus | error | disabled
// Props adicionales: label, helperText, errorText, iconLeft, iconRight
// ─────────────────────────────────────────────────────────────

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:       string
  helperText?:  string
  errorText?:   string
  iconLeft?:    ReactNode
  iconRight?:   ReactNode
  fullWidth?:   boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorText,
      iconLeft,
      iconRight,
      fullWidth = true,
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const hasError  = Boolean(errorText)
    const inputId   = id ?? `input-${Math.random().toString(36).slice(2, 8)}`
    const helperId  = `${inputId}-helper`
    const errorId   = `${inputId}-error`

    const baseInput = [
      'h-10 w-full px-3 text-sm text-lean-black bg-white',
      'border rounded transition-all duration-150 outline-none',
      'placeholder:text-text-subtle',
      'dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-600',
      // Estado error
      hasError
        ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
        : 'border-border focus:border-navy focus:ring-2 focus:ring-navy/15',
      // Disabled
      disabled
        ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
        : '',
      // Padding con iconos
      iconLeft  ? 'pl-9'  : '',
      iconRight ? 'pr-9'  : '',
    ].join(' ')

    return (
      <div className={fullWidth ? 'w-full' : 'inline-block'}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-label font-medium text-lean-black mb-1.5 dark:text-gray-200"
          >
            {label}
          </label>
        )}

        {/* Input + iconos */}
        <div className="relative">
          {iconLeft && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            >
              {iconLeft}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-describedby={
              errorText ? errorId : helperText ? helperId : undefined
            }
            aria-invalid={hasError}
            className={`${baseInput} ${className}`}
            {...props}
          />

          {iconRight && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            >
              {iconRight}
            </span>
          )}
        </div>

        {/* Helper / Error text */}
        {errorText ? (
          <p id={errorId} className="mt-1.5 text-xs text-danger dark:text-danger-soft">
            {errorText}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1.5 text-xs text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
