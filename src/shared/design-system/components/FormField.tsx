import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

// ─── Types ─────────────────────────────────────────────────────

export interface FormFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Required: connects <label> and <input> via htmlFor/id */
  id:          string
  label?:      string
  hint?:       string
  /** Error message — activates aria-invalid + aria-describedby */
  error?:      string
  /** Render a <textarea> instead of <input> */
  multiline?:  boolean
  /** Only used when multiline=true */
  rows?:       number
}

// ─── Shared class builder ───────────────────────────────────────

function fieldClasses(
  hasError:  boolean,
  disabled:  boolean | undefined,
  extra?:    string,
  textarea?: boolean,
): string {
  return [
    textarea ? 'w-full px-3 py-2' : 'h-10 w-full px-3',
    'text-sm text-lean-black bg-white',
    'border rounded transition-all duration-150 outline-none',
    'placeholder:text-text-subtle',
    'dark:bg-warm-800 dark:text-warm-50 dark:placeholder:text-warm-300',
    hasError
      ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20'
      : 'border-border focus:border-gold focus:ring-2 focus:ring-gold/20',
    disabled
      ? 'opacity-50 cursor-not-allowed bg-surface dark:bg-warm-700'
      : '',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ')
}

// ─── Component ─────────────────────────────────────────────────

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id,
      label,
      hint,
      error,
      required,
      disabled,
      className = '',
      multiline = false,
      rows,
      ...props
    },
    ref
  ) => {
    const hasError   = Boolean(error)
    const hintId     = `${id}-hint`
    const errorId    = `${id}-error`
    const describedBy = hasError ? errorId : hint ? hintId : undefined

    const labelEl = label && (
      <label
        htmlFor={id}
        className="text-label font-medium text-lean-black dark:text-warm-50"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">*</span>
        )}
      </label>
    )

    const messageEl = hasError ? (
      <p id={errorId} role="alert" className="text-xs text-danger dark:text-danger-soft">
        {error}
      </p>
    ) : hint ? (
      <p id={hintId} className="text-xs text-text-muted dark:text-warm-300">
        {hint}
      </p>
    ) : null

    if (multiline) {
      const { type: _type, ...textareaProps } = props as Record<string, unknown>
      void _type
      return (
        <div className="flex flex-col gap-1.5">
          {labelEl}
          <textarea
            id={id}
            rows={rows}
            required={required}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            className={fieldClasses(hasError, disabled, className, true)}
            {...(textareaProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
          {messageEl}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-1.5">
        {labelEl}
        <input
          ref={ref}
          id={id}
          required={required}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={fieldClasses(hasError, disabled, className)}
          {...props}
        />
        {messageEl}
      </div>
    )
  }
)

FormField.displayName = 'FormField'
