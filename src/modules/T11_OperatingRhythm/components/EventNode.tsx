// EventNode — nodo clicable del Big Picture

import { T11_LEVEL_CONFIG, T11_FREQUENCY_LABEL } from '../constants'
import type { T11Event } from '../types'

export function EventNode({
  event,
  isUnlocked,
  onClick,
}: {
  event:      T11Event
  isUnlocked: boolean
  onClick:    () => void
}) {
  const lcfg = T11_LEVEL_CONFIG[event.level]

  // Extraer códigos de herramientas de los dataInputs
  const toolCodes = event.dataInputs
    .flatMap((d) => d.match(/T\d+/g) ?? [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4)

  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={!isUnlocked}
      className={[
        'w-full text-left p-3.5 rounded-xl border transition-all duration-150',
        isUnlocked
          ? [
              'bg-white dark:bg-warm-600',
              lcfg.border,
              'hover:shadow-sm hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]',
            ].join(' ')
          : 'border-border bg-surface dark:bg-warm-800 opacity-40 cursor-not-allowed',
      ].join(' ')}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${lcfg.badge} ${lcfg.badgeText}`}>
          {T11_FREQUENCY_LABEL[event.frequency]}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {event.isCritical && (
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">★</span>
          )}
          {!isUnlocked && (
            <svg className="h-3 w-3 text-text-subtle" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9 5V4a3 3 0 00-6 0v1H2v6h8V5H9zM5 4a1 1 0 012 0v1H5V4z" />
            </svg>
          )}
          <span className="text-[9px] font-mono text-text-subtle">{event.duration}</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-lean-black dark:text-warm-50 leading-snug mb-0.5">
        {event.title}
      </p>
      <p className="text-[10px] text-text-subtle dark:text-warm-300 leading-snug line-clamp-2 mb-2.5">
        {event.owner}
      </p>

      {/* Tool badges */}
      {isUnlocked && toolCodes.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {toolCodes.map((code) => (
            <span
              key={code}
              className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
              style={{ backgroundColor: lcfg.hex + 'CC' }}
            >
              {code}
            </span>
          ))}
          {isUnlocked && (
            <span className="ml-auto text-[9px]" style={{ color: lcfg.hex }}>
              Ver detalle →
            </span>
          )}
        </div>
      )}
    </button>
  )
}
