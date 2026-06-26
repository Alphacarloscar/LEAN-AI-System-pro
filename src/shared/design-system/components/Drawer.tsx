import { useEffect, type ReactNode } from 'react'

export type DrawerSide = 'right' | 'left'

export interface DrawerProps {
  open:      boolean
  onClose:   () => void
  title?:    string
  side?:     DrawerSide
  width?:    string
  children:  ReactNode
  footer?:   ReactNode
}

export function Drawer({
  open,
  onClose,
  title,
  side    = 'right',
  width   = 'w-96',
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else      document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const slideClass = side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0'

  return (
    <div className="fixed inset-0 z-modal flex" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-lean-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral */}
      <div
        className={[
          'absolute top-0 bottom-0 flex flex-col',
          'bg-white shadow-xl dark:bg-gray-900',
          width,
          slideClass,
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shadow-line-bottom shrink-0">
          {title ? (
            <h2 className="text-base font-semibold text-lean-black dark:text-gray-100">{title}</h2>
          ) : <div />}
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            className="p-1 rounded text-text-muted hover:text-lean-black hover:bg-gray-100 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 shadow-line-top bg-surface dark:bg-gray-800/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
