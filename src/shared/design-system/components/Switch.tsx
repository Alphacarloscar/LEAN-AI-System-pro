import { type InputHTMLAttributes } from 'react'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?:       string
  description?: string
  size?:        'sm' | 'md'
  labelPosition?: 'left' | 'right'
}

const sizeConfig = {
  sm: { track: 'h-5 w-9',  thumb: 'h-4 w-4', translate: 'translate-x-4' },
  md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
}

export function Switch({
  label,
  description,
  size          = 'md',
  labelPosition = 'right',
  className     = '',
  disabled,
  checked,
  onChange,
  id,
  ...props
}: SwitchProps) {
  const inputId = id ?? `switch-${Math.random().toString(36).slice(2, 8)}`
  const s       = sizeConfig[size]

  const track = (
    <div className="relative inline-flex shrink-0">
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-checked={checked}
        className="sr-only peer"
        {...props}
      />
      {/* Track */}
      <label
        htmlFor={inputId}
        className={[
          s.track,
          'relative inline-flex items-center rounded-full cursor-pointer',
          'transition-colors duration-200',
          // Off: gris | On: navy
          'bg-gray-300 peer-checked:bg-navy',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-navy peer-focus-visible:ring-offset-2',
          'peer-disabled:opacity-50 peer-disabled:cursor-not-allowed',
          'dark:bg-gray-600 peer-checked:dark:bg-navy',
        ].join(' ')}
      >
        {/* Thumb */}
        <span
          className={[
            s.thumb,
            'absolute left-0.5 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            'peer-checked:translate-x-0', // fallback
            checked ? s.translate : 'translate-x-0',
          ].join(' ')}
        />
      </label>
    </div>
  )

  if (!label && !description) return <div className={className}>{track}</div>

  return (
    <div className={`flex items-start gap-3 ${labelPosition === 'left' ? 'flex-row-reverse justify-end' : ''} ${className}`}>
      {track}
      <div className="min-w-0">
        {label && (
          <p className={`text-sm font-medium ${disabled ? 'opacity-50' : 'text-lean-black dark:text-gray-200'}`}>
            {label}
          </p>
        )}
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}
