import { forwardRef, type InputHTMLAttributes } from 'react'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?:       string
  description?: string
  errorText?:   string
  indeterminate?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, errorText, indeterminate = false, className = '', disabled, id, ...props }, ref) => {
    const inputId = id ?? `checkbox-${Math.random().toString(36).slice(2, 8)}`

    return (
      <div className={`flex gap-3 ${className}`}>
        <div className="flex h-5 items-center">
          <input
            ref={(node) => {
              if (node) node.indeterminate = indeterminate
              if (typeof ref === 'function') ref(node)
              else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
            }}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            className={[
              'h-4 w-4 rounded border-border text-navy',
              'focus:ring-2 focus:ring-navy/20 focus:ring-offset-1',
              'transition-colors cursor-pointer',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              errorText ? 'border-danger' : '',
            ].join(' ')}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="min-w-0">
            {label && (
              <label
                htmlFor={inputId}
                className={`block text-sm font-medium cursor-pointer ${disabled ? 'opacity-50' : 'text-lean-black dark:text-gray-200'}`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            )}
            {errorText && (
              <p className="text-xs text-danger mt-0.5">{errorText}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

// Necesario para el ref con indeterminate
import React from 'react'
