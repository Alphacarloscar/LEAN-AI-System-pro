import { type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Table — tabla de datos accesible con soporte a ordenación
//
// Uso:
//   <Table columns={cols} rows={data} />
//   <Table columns={cols} rows={data} onSort={handleSort} sortKey="name" sortDir="asc" />
// ─────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'

export interface TableColumn<T = Record<string, unknown>> {
  key:        string
  header:     ReactNode
  render?:    (row: T) => ReactNode
  sortable?:  boolean
  width?:     string   // ej. 'w-40', 'w-1/4'
  align?:     'left' | 'center' | 'right'
}

export interface TableProps<T = Record<string, unknown>> {
  columns:      TableColumn<T>[]
  rows:         T[]
  keyExtractor: (row: T) => string
  onSort?:      (key: string) => void
  sortKey?:     string
  sortDir?:     SortDirection
  loading?:     boolean
  emptyMessage?: string
  className?:   string
  stickyHeader?: boolean
}

const alignClasses: Record<'left' | 'center' | 'right', string> = {
  left:   'text-left',
  center: 'text-center',
  right:  'text-right',
}

function SortIcon({ active, direction }: { active: boolean; direction?: SortDirection }) {
  return (
    <svg
      className={`inline-block h-3.5 w-3.5 ml-1 transition-colors ${
        active ? 'text-navy dark:text-warm-100' : 'text-text-subtle'
      }`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {(!active || direction === 'asc') && (
        <path d="M8 3v10M8 3L4.5 6.5M8 3L11.5 6.5" strokeLinecap="round" strokeLinejoin="round"
          opacity={active && direction === 'asc' ? 1 : 0.4}
        />
      )}
      {(!active || direction === 'desc') && (
        <path d="M8 13V3M8 13L4.5 9.5M8 13L11.5 9.5" strokeLinecap="round" strokeLinejoin="round"
          opacity={active && direction === 'desc' ? 1 : 0.4}
        />
      )}
    </svg>
  )
}

export function Table<T = Record<string, unknown>>({
  columns,
  rows,
  keyExtractor,
  onSort,
  sortKey,
  sortDir,
  loading      = false,
  emptyMessage = 'No hay datos disponibles',
  className    = '',
  stickyHeader = false,
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-border ${className}`}>
      <table className="w-full text-sm">
        <thead className={[
          'bg-surface dark:bg-gray-800 border-b border-border',
          stickyHeader ? 'sticky top-0 z-10' : '',
        ].join(' ')}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={[
                  'px-4 py-3 font-medium text-text-muted',
                  alignClasses[col.align ?? 'left'],
                  col.width ?? '',
                  col.sortable && onSort
                    ? 'cursor-pointer select-none hover:text-lean-black dark:hover:text-gray-100 transition-colors'
                    : '',
                ].join(' ')}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                aria-sort={
                  sortKey === col.key
                    ? sortDir === 'asc' ? 'ascending' : 'descending'
                    : col.sortable ? 'none' : undefined
                }
              >
                {col.header}
                {col.sortable && onSort && (
                  <SortIcon
                    active={sortKey === col.key}
                    direction={sortKey === col.key ? sortDir : undefined}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-border bg-white dark:bg-gray-900">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-navy dark:text-warm-100" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Cargando…
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-surface dark:hover:bg-gray-800/50 transition-colors"
              >
                {columns.map((col) => {
                  const rawValue = (row as Record<string, unknown>)[col.key]
                  const cell = col.render
                    ? col.render(row)
                    : rawValue !== undefined && rawValue !== null
                      ? String(rawValue)
                      : '—'

                  return (
                    <td
                      key={col.key}
                      className={[
                        'px-4 py-3 text-lean-black dark:text-gray-100',
                        alignClasses[col.align ?? 'left'],
                      ].join(' ')}
                    >
                      {cell}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
