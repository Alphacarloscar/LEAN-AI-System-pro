import { forwardRef, type InputHTMLAttributes } from 'react'

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?:       string
  description?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className = '', disabled, id, ...props }, ref) => {
    const inputId = id ?? `radio-${Math.random().toString(36).slice(2, 8)}`

    return (
      <div className={`flex gap-3 ${className}`}>
        <div className="flex h-5 items-center">
          <input
            ref={ref}
            id={inputId}
            type="radio"
            disabled={disabled}
            className={[
              'h-4 w-4 border-border text-navy',
              'focus:ring-2 focus:ring-navy/20 focus:ring-offset-1',
              'transition-colors cursor-pointer',
              'disabled:opacity-50 disabled:cursor-not-allowed',
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
          </div>
        )}
      </div>
    )
  }
)

Radio.displayName = 'Radio'

// ─────────────────────────────────────────────────────────────
// RadioGroup — wrapper para grupos de radios
// ─────────────────────────────────────────────────────────────

export interface RadioOption {
  value:        string
  label:        string
  description?: string
  disabled?:    boolean
}

export interface RadioGroupProps {
  name:       string
  value?:     string
  options:    RadioOption[]
  onChange?:  (value: string) => void
  label?:     string
  direction?: 'vertical' | 'horizontal'
  className?: string
}

export function RadioGroup({
  name,
  value,
  options,
  onChange,
  label,
  direction = 'vertical',
  className = '',
}: RadioGroupProps) {
  return (
    <fieldset className={className}>
      {label && (
        <legend className="text-label font-medium text-lean-black mb-2 dark:text-gray-200">
          {label}
        </legend>
      )}
      <div className={direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}>
        {options.map((opt) => (
          <Radio
            key={opt.value}
            name={name}
            value={opt.value}
            label={opt.label}
            description={opt.description}
            disabled={opt.disabled}
            checked={value === opt.value}
            onChange={() => onChange?.(opt.value)}
          />
        ))}
      </div>
    </fieldset>
  )
}
