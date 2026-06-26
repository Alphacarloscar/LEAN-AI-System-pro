import { type ImgHTMLAttributes } from 'react'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  name?:      string    // para fallback con iniciales
  size?:      AvatarSize
  src?:       string
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6  w-6  text-xs',
  sm: 'h-8  w-8  text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// Colores deterministas basados en el nombre — siempre el mismo color para el mismo usuario
const AVATAR_COLORS = [
  'bg-info    text-info-dark',
  'bg-success text-success-dark',
  'bg-warning text-warning-dark',
  'bg-navy    text-white',
  'bg-silver  text-lean-black',
]

function getColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % AVATAR_COLORS.length
}

export function Avatar({ name, size = 'md', src, alt, className = '', ...props }: AvatarProps) {
  const sizeClass = sizeClasses[size]

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? 'Avatar'}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
        {...props}
      />
    )
  }

  if (name) {
    const colorClass = AVATAR_COLORS[getColorIndex(name)]
    return (
      <span
        className={[
          'inline-flex items-center justify-center rounded-full font-semibold select-none',
          sizeClass,
          colorClass,
          className,
        ].join(' ')}
        aria-label={name}
        title={name}
      >
        {getInitials(name)}
      </span>
    )
  }

  // Fallback sin nombre ni foto
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 ${sizeClass} ${className}`}
      aria-hidden="true"
    >
      <svg className="h-1/2 w-1/2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// AvatarGroup — stack de avatares solapados (ej. "3 consultores asignados")
// ─────────────────────────────────────────────────────────────
export interface AvatarGroupProps {
  users:      Array<{ name: string; src?: string }>
  max?:       number
  size?:      AvatarSize
  className?: string
}

export function AvatarGroup({ users, max = 4, size = 'sm', className = '' }: AvatarGroupProps) {
  const visible  = users.slice(0, max)
  const overflow = users.length - max

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visible.map((u, i) => (
        <Avatar
          key={i}
          name={u.name}
          src={u.src}
          size={size}
          className="ring-2 ring-white dark:ring-gray-900"
        />
      ))}
      {overflow > 0 && (
        <span
          className={[
            'inline-flex items-center justify-center rounded-full',
            'bg-gray-200 text-gray-600 text-xs font-medium',
            'ring-2 ring-white dark:ring-gray-900',
            sizeClasses[size],
          ].join(' ')}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
