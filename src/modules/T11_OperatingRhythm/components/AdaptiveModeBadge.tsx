// AdaptiveModeBadge — badge de modo adaptativo de cadencia

import type { T11AdaptiveMode } from '../types'

const ADAPTIVE_MODE_CONFIG: Record<T11AdaptiveMode, {
  label:       string
  description: string
  bg:          string
  text:        string
  border:      string
  dot:         string
}> = {
  basic: {
    label:       'Modo Básico',
    description: 'Solo ceremonias esenciales. Amplía la cadencia cuando tu madurez supere 2.0.',
    bg:          'bg-red-50 dark:bg-red-900/15',
    text:        'text-red-700 dark:text-red-400',
    border:      'border-red-200 dark:border-red-800/40',
    dot:         'bg-red-400 dark:bg-red-500',
  },
  standard: {
    label:       'Modo Estándar',
    description: 'Cadencia adaptada a tu nivel de madurez actual.',
    bg:          'bg-blue-50 dark:bg-blue-900/15',
    text:        'text-blue-700 dark:text-blue-400',
    border:      'border-blue-200 dark:border-blue-800/40',
    dot:         'bg-blue-400 dark:bg-blue-500',
  },
  full: {
    label:       'SAFe Completo',
    description: 'Tu madurez permite adoptar el catálogo SAFe completo.',
    bg:          'bg-emerald-50 dark:bg-emerald-900/15',
    text:        'text-emerald-700 dark:text-emerald-400',
    border:      'border-emerald-200 dark:border-emerald-800/40',
    dot:         'bg-emerald-400 dark:bg-emerald-500',
  },
}

export function AdaptiveModeBadge({ mode }: { mode: T11AdaptiveMode }) {
  const cfg = ADAPTIVE_MODE_CONFIG[mode]
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] ${cfg.bg} ${cfg.border}`}>
      <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
      <span className={`font-semibold ${cfg.text}`}>{cfg.label}</span>
      <span className="text-text-subtle dark:text-warm-400 hidden sm:inline">·</span>
      <span className="text-text-subtle dark:text-warm-400 hidden sm:inline">{cfg.description}</span>
    </div>
  )
}
