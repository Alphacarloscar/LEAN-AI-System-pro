import { forwardRef, type SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value:    string
  label:    string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:      string
  helperText?: string
  errorText?:  string
  options:     SelectOption[]
  placeholder?: string
  fullWidth?:  boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      errorText,
      options,
      placeholder,
      fullWidth = true,
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(errorText)
    const inputId  = id ?? `select-${Math.random().toString(36).slice(2, 8)}`
    const helperId = `${inputId}-helper`
    const errorId  = `${inputId}-error`

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

        {/* Wrapper para el chevron custom */}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-describedby={errorText ? errorId : helperText ? helperId : undefined}
            aria-invalid={hasError}
            className={[
              'h-10 w-full pl-3 pr-8 text-sm text-lean-black bg-white',
              'border rounded transition-all duration-150 outline-none',
              'appearance-none cursor-pointer',
              'dark:bg-gray-900 dark:text-gray-100',
              hasError
                ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
                : 'border-border focus:border-navy focus:ring-2 focus:ring-navy/15',
              disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : '',
              className,
            ].join(' ')}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Chevron custom — reemplaza la flecha nativa del OS */}
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

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

Select.displayName = 'Select'
