import { useEffect, type ReactNode } from 'react'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  open:       boolean
  onClose:    () => void
  title?:     string
  size?:      ModalSize
  children:   ReactNode
  footer?:    ReactNode
  closeOnOverlay?: boolean
}

const sizeClasses: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-5xl',
}

export function Modal({
  open,
  onClose,
  title,
  size             = 'md',
  children,
  footer,
  closeOnOverlay   = true,
}: ModalProps) {
  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-lean-black/40 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={[
          'relative w-full rounded-lg bg-white shadow-xl animate-fade-in',
          'dark:bg-warm-800',
          sizeClasses[size],
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 shadow-line-bottom">
            <h2 id="modal-title" className="text-base font-semibold text-lean-black dark:text-warm-50">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1 rounded text-text-muted hover:text-lean-black hover:bg-[#F0EDE8] transition-colors dark:hover:bg-warm-700 dark:hover:text-warm-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Contenido */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 shadow-line-top bg-surface dark:bg-warm-800/50 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
