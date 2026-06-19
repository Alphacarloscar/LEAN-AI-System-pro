import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

// ─── Types ─────────────────────────────────────────────────────

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  open:             boolean
  onClose:          () => void
  title?:           string
  /** Sets aria-describedby on the dialog for assistive tech */
  description?:     string
  size?:            ModalSize
  children:         ReactNode
  footer?:          ReactNode
  closeOnOverlay?:  boolean
}

// ─── Constants ─────────────────────────────────────────────────

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),' +
  'select:not([disabled]),textarea:not([disabled]),' +
  '[tabindex]:not([tabindex="-1"])'

const sizeClasses: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-5xl',
}

// ─── Component ─────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  description,
  size            = 'md',
  children,
  footer,
  closeOnOverlay  = true,
}: ModalProps) {
  const uid     = useId()
  const titleId = `${uid}-title`
  const descId  = `${uid}-desc`
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Lock body scroll ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // ── Close on Escape ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // ── Focus trap: auto-focus + restore on close ─────────────────
  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement as HTMLElement | null

    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current
      if (!panel) return
      const first = panel.querySelector<HTMLElement>(FOCUSABLE)
      ;(first ?? panel).focus()
    })

    return () => {
      cancelAnimationFrame(raf)
      trigger?.focus()
    }
  }, [open])

  // ── Focus trap: cycle Tab within panel ───────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return
    const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (nodes.length === 0) return
    const first = nodes[0]
    const last  = nodes[nodes.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus() }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus() }
    }
  }, [])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title       ? titleId : undefined}
      aria-describedby={description ? descId  : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-lean-black/40 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={[
          'relative w-full rounded-lg bg-white shadow-xl outline-none animate-fade-in',
          'dark:bg-warm-800',
          sizeClasses[size],
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-warm-600/30">
            <h2
              id={titleId}
              className="text-base font-semibold text-lean-black dark:text-warm-50"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className={[
                'p-1 rounded text-text-muted transition-colors',
                'hover:text-lean-black hover:bg-warm-50',
                'focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none',
                'dark:hover:bg-warm-700 dark:hover:text-warm-50',
              ].join(' ')}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* Optional description (visually hidden, for screen readers) */}
        {description && (
          <p id={descId} className="sr-only">{description}</p>
        )}

        {/* Content */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-surface rounded-b-lg dark:border-warm-600/30 dark:bg-warm-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
