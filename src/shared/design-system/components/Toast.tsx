import { useEffect, useState, useCallback, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Toast — notificación efímera en esquina de pantalla
//
// Uso:
//   const { toasts, toast } = useToast()
//   toast.success('Guardado correctamente')
//   toast.error('Error al conectar')
//   <ToastContainer toasts={toasts} onRemove={remove} />
// ─────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id:       string
  variant:  ToastVariant
  message:  string
  duration?: number
}

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
  success: 'border-l-4 border-success bg-white dark:bg-gray-900',
  error:   'border-l-4 border-danger  bg-white dark:bg-gray-900',
  warning: 'border-l-4 border-warning bg-white dark:bg-gray-900',
  info:    'border-l-4 border-info    bg-white dark:bg-gray-900',
}

// ── Componente individual ──
function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(item.id), item.duration ?? 4000)
    return () => clearTimeout(t)
  }, [item, onRemove])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex items-start gap-3 p-4 rounded-lg shadow-lg min-w-[280px] max-w-sm',
        'animate-fade-in',
        bgClasses[item.variant],
      ].join(' ')}
    >
      <span className="shrink-0 mt-0.5" aria-hidden="true">{icons[item.variant]}</span>
      <p className="flex-1 text-sm text-lean-black dark:text-gray-100">{item.message}</p>
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

// ── Contenedor de toasts ──
export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts:   ToastItem[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-toast flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} item={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

// ── Hook useToast ──
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((variant: ToastVariant, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => [...prev, { id, variant, message, duration }])
  }, [])

  const toast = {
    success: (msg: string, dur?: number) => add('success', msg, dur),
    error:   (msg: string, dur?: number) => add('error',   msg, dur),
    warning: (msg: string, dur?: number) => add('warning', msg, dur),
    info:    (msg: string, dur?: number) => add('info',    msg, dur),
  }

  return { toasts, toast, remove }
}
