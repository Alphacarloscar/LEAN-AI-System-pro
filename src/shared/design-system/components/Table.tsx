import { type ReactNode } from 'react'
import { Spinner } from './Spinner'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

// ─────────────────────────────────────────────────────────────
// Table — tabla de datos accesible con soporte a ordenación,
//         prioridad de columnas en mobile y vista cards.
//
// Uso básico:
//   <Table columns={cols} rows={data} keyExtractor={...} />
//
// Con prioridad de columnas (oculta 'low' en < md, 'medium' si no caben):
//   <Table columns={cols} rows={data} keyExtractor={...}
//          columnPriority={['high', 'low', 'medium']} />
//
// Con vista cards en mobile (< md):
//   <Table columns={cols} rows={data} keyExtractor={...}
//          mobileView="cards" />
//
// Nota: columnPriority y mobileView="cards" son capacidades listas
// para usar. La migración de T1–T12 es DEBT-026-bis (PR separado).
// ─────────────────────────────────────────────────────────────

export type SortDirection    = 'asc' | 'desc'
export type ColumnPriority   = 'high' | 'medium' | 'low'
export type MobileView       = 'scroll' | 'cards'

export interface TableColumn<T = Record<string, unknown>> {
  key:        string
  header:     ReactNode
  render?:    (row: T) => ReactNode
  sortable?:  boolean
  width?:     string   // ej. 'w-40', 'w-1/4'
  align?:     'left' | 'center' | 'right'
}

export interface TableProps<T = Record<string, unknown>> {
  columns:         TableColumn<T>[]
  rows:            T[]
  keyExtractor:    (row: T) => string
  onSort?:         (key: string) => void
  sortKey?:        string
  sortDir?:        SortDirection
  loading?:        boolean
  emptyMessage?:   string
  className?:      string
  stickyHeader?:   boolean
  /** Priority per column, aligned with the `columns` array. */
  columnPriority?: ColumnPriority[]
  /** How to render on mobile (< 640 px). Default: 'scroll'. */
  mobileView?:     MobileView
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

// ── Helpers ───────────────────────────────────────────────────

function getCellValue<T>(row: T, col: TableColumn<T>): ReactNode {
  if (col.render) return col.render(row)
  const raw = (row as Record<string, unknown>)[col.key]
  return raw !== undefined && raw !== null ? String(raw) : '—'
}

// ── Cards view (mobile) ───────────────────────────────────────
function CardsView<T>({
  columns,
  rows,
  keyExtractor,
  loading,
  emptyMessage,
}: Pick<TableProps<T>, 'columns' | 'rows' | 'keyExtractor' | 'loading' | 'emptyMessage'>) {
  if (loading) {
    return (
      <div className="px-4 py-8 text-center text-text-muted">
        <div className="flex items-center justify-center gap-2">
          <Spinner size="md" className="text-navy dark:text-warm-100" />
          Cargando…
        </div>
      </div>
    )
  }
  if (rows.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-text-muted text-sm">
        {emptyMessage}
      </div>
    )
  }
  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <div
          key={keyExtractor(row)}
          className="px-4 py-3 space-y-1.5 bg-white dark:bg-warm-800 hover:bg-surface dark:hover:bg-warm-700/50 transition-colors"
        >
          {columns.map((col) => (
            <div key={col.key} className="flex gap-2 text-sm">
              <span className="shrink-0 font-medium text-text-muted w-28 truncate">
                {col.header}
              </span>
              <span className="text-lean-black dark:text-warm-50 min-w-0 break-words">
                {getCellValue(row, col)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export function Table<T = Record<string, unknown>>({
  columns,
  rows,
  keyExtractor,
  onSort,
  sortKey,
  sortDir,
  loading        = false,
  emptyMessage   = 'No hay datos disponibles',
  className      = '',
  stickyHeader   = false,
  columnPriority,
  mobileView     = 'scroll',
}: TableProps<T>) {
  const isMd  = useMediaQuery('(min-width: 640px)')

  // In cards mode on mobile, bypass the table entirely
  if (!isMd && mobileView === 'cards') {
    return (
      <div className={`rounded-lg border border-border overflow-hidden ${className}`}>
        <CardsView
          columns={columns}
          rows={rows}
          keyExtractor={keyExtractor}
          loading={loading}
          emptyMessage={emptyMessage}
        />
      </div>
    )
  }

  // Resolve visible columns for scroll mode with column priority
  const visibleColumns = columns.filter((_col, idx) => {
    if (!columnPriority) return true
    const priority = columnPriority[idx]
    if (!priority || priority === 'high') return true
    // On mobile (< md), hide low and medium (no room for "maybe fits" logic in scroll)
    if (!isMd) return false
    return true
  })

  return (
    <div className={`overflow-x-auto rounded-lg border border-border ${className}`}>
      <table className="w-full text-sm">
        <thead className={[
          'bg-surface dark:bg-warm-700 border-b border-border',
          stickyHeader ? 'sticky top-0 z-10' : '',
        ].join(' ')}>
          <tr>
            {visibleColumns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={[
                  'px-4 py-3 font-medium text-text-muted',
                  alignClasses[col.align ?? 'left'],
                  col.width ?? '',
                  col.sortable && onSort
                    ? 'cursor-pointer select-none hover:text-lean-black dark:hover:text-warm-50 transition-colors'
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

        <tbody className="divide-y divide-border bg-white dark:bg-warm-800">
          {loading ? (
            <tr>
              <td colSpan={visibleColumns.length} className="px-4 py-8 text-center text-text-muted">
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="md" className="text-navy dark:text-warm-100" />
                  Cargando…
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length} className="px-4 py-10 text-center text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="hover:bg-surface dark:hover:bg-warm-700/50 transition-colors"
              >
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      'px-4 py-3 text-lean-black dark:text-warm-50',
                      alignClasses[col.align ?? 'left'],
                    ].join(' ')}
                  >
                    {getCellValue(row, col)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
