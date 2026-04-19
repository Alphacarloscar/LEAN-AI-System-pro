import { type HTMLAttributes } from 'react'

// ─────────────────────────────────────────────────────────────
// Skeleton — placeholder de carga con animación shimmer
//
// Shapes: text | rectangle | circle
// Se usa mientras los datos cargan desde Supabase.
// La animación shimmer está definida en tailwind.config.ts.
// ─────────────────────────────────────────────────────────────

export type SkeletonShape = 'text' | 'rectangle' | 'circle'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?:  SkeletonShape
  width?:  string   // ej. 'w-48', 'w-full', 'w-1/2'
  height?: string   // ej. 'h-4', 'h-32'
  lines?:  number   // para shape='text': múltiples líneas
}

const shimmerBase = [
  'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100',
  'bg-[length:200%_100%]',
  'animate-shimmer',
  'dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
].join(' ')

function SkeletonBlock({
  shape   = 'rectangle',
  width   = 'w-full',
  height  = 'h-4',
  className = '',
  ...props
}: Omit<SkeletonProps, 'lines'>) {
  const roundedClass =
    shape === 'circle'    ? 'rounded-full' :
    shape === 'text'      ? 'rounded'      :
    'rounded-lg'

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={[shimmerBase, roundedClass, width, height, className].join(' ')}
      {...props}
    />
  )
}

export function Skeleton({
  shape   = 'rectangle',
  width   = 'w-full',
  height  = 'h-4',
  lines   = 1,
  className = '',
  ...props
}: SkeletonProps) {
  // Múltiples líneas de texto
  if (shape === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBlock
            key={i}
            shape="text"
            // Última línea más corta — simula párrafo real
            width={i === lines - 1 ? 'w-3/4' : 'w-full'}
            height={height}
          />
        ))}
      </div>
    )
  }

  return (
    <SkeletonBlock
      shape={shape}
      width={width}
      height={height}
      className={className}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// SkeletonCard — preset para loading de tarjetas de herramienta
// ─────────────────────────────────────────────────────────────
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-lg border border-border space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton shape="circle"    width="w-10" height="h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton shape="text" width="w-1/3" height="h-4" />
          <Skeleton shape="text" width="w-1/2" height="h-3" />
        </div>
      </div>
      <Skeleton shape="rectangle" height="h-24" />
      <div className="flex gap-2">
        <Skeleton shape="text" width="w-16" height="h-6" />
        <Skeleton shape="text" width="w-16" height="h-6" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SkeletonTable — preset para loading de tablas
// ─────────────────────────────────────────────────────────────
export function SkeletonTable({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-border">
        <Skeleton shape="text" width="w-1/4" height="h-4" />
        <Skeleton shape="text" width="w-1/4" height="h-4" />
        <Skeleton shape="text" width="w-1/4" height="h-4" />
        <Skeleton shape="text" width="w-1/4" height="h-4" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-1">
          <Skeleton shape="text" width="w-1/4" height="h-4" />
          <Skeleton shape="text" width="w-1/4" height="h-4" />
          <Skeleton shape="text" width="w-1/4" height="h-4" />
          <Skeleton shape="text" width="w-1/4" height="h-4" />
        </div>
      ))}
    </div>
  )
}
