import { useState, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Accordion — secciones expandibles/colapsables
//
// Uso:
//   <Accordion items={[{ id:'a1', title:'Sección', content:<p>…</p> }]} />
//   <Accordion items={items} allowMultiple />
// ─────────────────────────────────────────────────────────────

export interface AccordionItem {
  id:        string
  title:     ReactNode
  content:   ReactNode
  disabled?: boolean
  badge?:    ReactNode
}

export interface AccordionProps {
  items:          AccordionItem[]
  allowMultiple?: boolean          // si true, varias secciones pueden estar abiertas
  defaultOpen?:   string[]         // ids abiertos por defecto
  className?:     string
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpen   = [],
  className     = '',
}: AccordionProps) {
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen))

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!allowMultiple) next.clear()
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className={`divide-y divide-border rounded-lg border border-border overflow-hidden ${className}`}>
      {items.map((item) => {
        const isOpen = open.has(item.id)

        return (
          <div key={item.id} className="bg-white dark:bg-gray-900">
            {/* Trigger */}
            <button
              id={`accordion-trigger-${item.id}`}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              disabled={item.disabled}
              onClick={() => !item.disabled && toggle(item.id)}
              className={[
                'flex w-full items-center justify-between gap-3 px-5 py-4',
                'text-left text-sm font-medium text-lean-black dark:text-gray-100',
                'hover:bg-surface dark:hover:bg-gray-800/50 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy',
                item.disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
              ].join(' ')}
            >
              <span className="flex items-center gap-2 min-w-0">
                {item.title}
                {item.badge && <span className="shrink-0">{item.badge}</span>}
              </span>
              {/* Chevron rotante */}
              <svg
                className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Panel */}
            {isOpen && (
              <div
                id={`accordion-panel-${item.id}`}
                role="region"
                aria-labelledby={`accordion-trigger-${item.id}`}
                className="px-5 pb-5 text-sm text-text-muted dark:text-gray-400 border-t border-border"
              >
                <div className="pt-4">{item.content}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
