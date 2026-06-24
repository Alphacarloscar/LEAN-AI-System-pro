// ============================================================
// CompanyProfile — Componentes UI reutilizables
// ============================================================

import type { ReactNode } from 'react'

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle dark:text-gray-500 mb-3 flex items-center gap-2">
      <span className="inline-block h-px w-3 bg-current opacity-40" />
      {children}
    </p>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-subtle dark:text-gray-500 mb-1.5">
      {children}
    </label>
  )
}

export function LeanSelect({
  value, onChange, options, placeholder, disabled,
}: {
  value:       string
  onChange:    (v: string) => void
  options:     readonly string[]
  placeholder: string
  disabled?:   boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={[
          'w-full appearance-none px-4 py-2.5 rounded-lg text-sm transition-colors duration-150',
          'bg-white dark:bg-gray-900',
          'border border-border dark:border-white/8',
          'focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20',
          !value ? 'text-text-subtle dark:text-gray-500' : 'text-lean-black dark:text-gray-100',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-subtle dark:text-gray-500"
        viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      >
        <path d="M3 5l4 4 4-4" />
      </svg>
    </div>
  )
}

export function AreaChip({
  label, selected, onToggle, disabled,
}: {
  label:    string
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={[
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border',
        selected
          ? 'bg-navy text-white border-navy shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 border-border dark:border-white/8 hover:border-navy/40 hover:text-lean-black dark:hover:text-gray-200',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

export function ToggleChip<T extends string>({
  label, value, selected, onSelect, colorSelected,
}: {
  label:          T
  value:          T
  selected:       boolean
  onSelect:       (v: T) => void
  colorSelected?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={[
        'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 border',
        selected
          ? `border-transparent text-white ${colorSelected ?? 'bg-navy'}`
          : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 border-border dark:border-white/8 hover:border-gray-300 dark:hover:border-white/20',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

