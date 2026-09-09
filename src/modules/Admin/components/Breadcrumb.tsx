import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {idx > 0 && <ChevronRight size={14} className="text-text-muted" />}
          {item.current ? (
            <span className="text-lean-black dark:text-warm-50 font-medium">
              {item.label}
            </span>
          ) : (
            <Link to={item.href || '/'} className="text-text-muted hover:text-warm-700 transition-colors">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
