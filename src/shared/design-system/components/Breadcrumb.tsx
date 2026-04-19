import { type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Breadcrumb — ruta de navegación jerárquica
//
// Uso:
//   <Breadcrumb items={[
//     { label: 'Dashboard', href: '/' },
//     { label: 'Proyectos', href: '/proyectos' },
//     { label: 'Alpha Corp' },   // último = activo, sin href
//   ]} />
// ─────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label:    ReactNode
  href?:    string
  onClick?: () => void
}

export interface BreadcrumbProps {
  items:      BreadcrumbItem[]
  separator?: ReactNode
  className?: string
}

const DefaultSeparator = () => (
  <svg
    className="h-3.5 w-3.5 text-text-subtle shrink-0"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function Breadcrumb({
  items,
  separator,
  className = '',
}: BreadcrumbProps) {
  const sep = separator ?? <DefaultSeparator />

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && (
                <span aria-hidden="true">{sep}</span>
              )}

              {isLast ? (
                // Ítem activo — no es un enlace
                <span
                  aria-current="page"
                  className="font-medium text-lean-black dark:text-gray-100 truncate max-w-[180px]"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className={[
                    'text-text-muted hover:text-lean-black dark:hover:text-gray-100',
                    'transition-colors truncate max-w-[180px]',
                    'underline-offset-2 hover:underline',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-sm',
                  ].join(' ')}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  onClick={item.onClick}
                  className={[
                    'text-text-muted hover:text-lean-black dark:hover:text-gray-100',
                    'transition-colors truncate max-w-[180px]',
                    'underline-offset-2 hover:underline',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-sm',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
