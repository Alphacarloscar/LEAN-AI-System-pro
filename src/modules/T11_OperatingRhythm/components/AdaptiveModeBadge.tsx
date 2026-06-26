// AdaptiveModeBadge — badge de modo adaptativo de cadencia

import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import type { T11AdaptiveMode } from '../types'

const ADAPTIVE_MODE_CONFIG: Record<T11AdaptiveMode, {
  label:       string
  description: string
  semantic:    'danger' | 'info' | 'success'
  icon:        React.ReactElement
}> = {
  basic: {
    label:       'Modo Básico',
    description: 'Solo ceremonias esenciales. Amplía la cadencia cuando tu madurez supere 2.0.',
    semantic:    'danger',
    icon:        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />,
  },
  standard: {
    label:       'Modo Estándar',
    description: 'Cadencia adaptada a tu nivel de madurez actual.',
    semantic:    'info',
    icon:        <Info className="h-3.5 w-3.5" strokeWidth={1.5} />,
  },
  full: {
    label:       'SAFe Completo',
    description: 'Tu madurez permite adoptar el catálogo SAFe completo.',
    semantic:    'success',
    icon:        <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />,
  },
}

const SEMANTIC_CLASSES: Record<'danger' | 'info' | 'success', { border: string; text: string }> = {
  danger:  { border: 'border-danger',  text: 'text-danger'  },
  info:    { border: 'border-info',    text: 'text-info'    },
  success: { border: 'border-success', text: 'text-success' },
}

export function AdaptiveModeBadge({ mode }: { mode: T11AdaptiveMode }) {
  const cfg     = ADAPTIVE_MODE_CONFIG[mode]
  const classes = SEMANTIC_CLASSES[cfg.semantic]
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-warm-50 dark:bg-warm-800 border-l-[3px] text-[11px] ${classes.border} ${classes.text}`}>
      {cfg.icon}
      <span className="font-semibold">{cfg.label}</span>
      <span className="text-text-subtle dark:text-warm-400 hidden sm:inline">·</span>
      <span className="text-text-subtle dark:text-warm-400 hidden sm:inline">{cfg.description}</span>
    </div>
  )
}
