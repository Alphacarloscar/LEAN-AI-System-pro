import { forwardRef, type TextareaHTMLAttributes } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:      string
  helperText?: string
  errorText?:  string
  fullWidth?:  boolean
  resize?:     'none' | 'vertical' | 'horizontal' | 'both'
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      errorText,
      fullWidth = true,
      resize    = 'vertical',
      className = '',
      disabled,
      rows      = 4,
      id,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(errorText)
    const inputId  = id ?? `textarea-${Math.random().toString(36).slice(2, 8)}`
    const helperId = `${inputId}-helper`
    const errorId  = `${inputId}-error`

    const resizeClass = {
      none:       'resize-none',
      vertical:   'resize-y',
      horizontal: 'resize-x',
      both:       'resize',
    }[resize]

    return (
      <div className={fullWidth ? 'w-full' : 'inline-block'}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-label font-medium text-lean-black mb-1.5 dark:text-gray-200"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          aria-describedby={errorText ? errorId : helperText ? helperId : undefined}
          aria-invalid={hasError}
          className={[
            'w-full px-3 py-2.5 text-sm text-lean-black bg-white',
            'border rounded transition-all duration-150 outline-none',
            'placeholder:text-text-subtle',
            'dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-600',
            hasError
              ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
              : 'border-border focus:border-navy focus:ring-2 focus:ring-navy/15',
            disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : '',
            resizeClass,
            className,
          ].join(' ')}
          {...props}
        />

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

Textarea.displayName = 'Textarea'
