import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'

// ─────────────────────────────────────────────────────────────
// Toast — notificación efímera con cola FIFO (máx. 3)
//
// Uso:
//   // 1. Envuelve el árbol en App.tsx:
//   <ToastProvider><App /></ToastProvider>
//
//   // 2. En cualquier componente:
//   const { toast } = useToast()
//   toast.success('Guardado correctamente')
//   toast.warning('Revisa los datos', { persistent: true })
// ─────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id:          string
  variant:     ToastVariant
  message:     string
  duration?:   number
  persistent?: boolean
}

// Duraciones por defecto por variante (ms)
const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 3000,
  info:    4000,
  warning: 6000,
  error:   8000,
}

const MAX_TOASTS = 3

// ── Iconos por variante ──
const icons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg className="h-5 w-5 text-success-dark" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-danger-dark" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-warning-dark" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-info-dark" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
}

const bgClasses: Record<ToastVariant, string> = {
  success: 'border-l-4 border-success bg-white dark:bg-warm-800',
  error:   'border-l-4 border-danger  bg-white dark:bg-warm-800',
  warning: 'border-l-4 border-warning bg-white dark:bg-warm-800',
  info:    'border-l-4 border-info    bg-white dark:bg-warm-800',
}

// ── Opciones de showToast ──
export interface ShowToastOptions {
  duration?:   number
  persistent?: boolean
}

// ── Contexto ──
interface ToastContextValue {
  toasts: ToastItem[]
  remove: (id: string) => void
  toast: {
    success: (msg: string, opts?: ShowToastOptions) => void
    error:   (msg: string, opts?: ShowToastOptions) => void
    warning: (msg: string, opts?: ShowToastOptions) => void
    info:    (msg: string, opts?: ShowToastOptions) => void
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

// ── Provider ──
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((
    variant: ToastVariant,
    message: string,
    opts: ShowToastOptions = {},
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const duration = opts.persistent
      ? undefined
      : (opts.duration ?? DEFAULT_DURATIONS[variant])

    setToasts((prev) => {
      const next = [...prev, { id, variant, message, duration, persistent: opts.persistent }]
      // Cola FIFO: si supera MAX_TOASTS, descarta el más antiguo
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
  }, [])

  const toast = {
    success: (msg: string, opts?: ShowToastOptions) => add('success', msg, opts),
    error:   (msg: string, opts?: ShowToastOptions) => add('error',   msg, opts),
    warning: (msg: string, opts?: ShowToastOptions) => add('warning', msg, opts),
    info:    (msg: string, opts?: ShowToastOptions) => add('info',    msg, opts),
  }

  return (
    <ToastContext.Provider value={{ toasts, remove, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

// ── Hook público ──
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>')
  }
  return ctx
}

// ── Componente individual ──
function ToastItemComponent({
  item,
  onRemove,
}: {
  item: ToastItem
  onRemove: (id: string) => void
}) {
  useEffect(() => {
    if (item.persistent || item.duration == null) return
    const t = setTimeout(() => onRemove(item.id), item.duration)
    return () => clearTimeout(t)
  }, [item, onRemove])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex items-start gap-3 p-4 rounded-lg shadow-lg',
        'w-[calc(100vw-32px)] sm:min-w-[280px] sm:w-auto sm:max-w-sm',
        'animate-fade-in',
        bgClasses[item.variant],
      ].join(' ')}
    >
      <span className="shrink-0 mt-0.5" aria-hidden="true">{icons[item.variant]}</span>
      <p className="flex-1 text-sm text-lean-black dark:text-warm-50">{item.message}</p>
      {/* X siempre visible en persistent; también presente en auto-close para cierre manual */}
      <button
        onClick={() => onRemove(item.id)}
        aria-label="Cerrar"
        className="shrink-0 -mt-0.5 -mr-0.5 p-1 rounded text-text-muted hover:text-lean-black transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ── Contenedor de toasts — responsive ──
// Mobile (< sm): top-center, full width menos 16px padding
// Desktop (>= sm): bottom-right
export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts:   ToastItem[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      className={[
        'fixed z-toast flex flex-col gap-2',
        // Mobile: top-center
        'top-4 left-1/2 -translate-x-1/2 items-center',
        // Desktop: bottom-right (reset mobile transforms)
        'sm:top-auto sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0 sm:items-end',
      ].join(' ')}
    >
      {toasts.map((t) => (
        <ToastItemComponent key={t.id} item={t} onRemove={onRemove} />
      ))}
    </div>
  )
}
