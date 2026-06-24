import { useCallback, useId, useRef, type ReactNode } from 'react'

// ─── Types ─────────────────────────────────────────────────────

export interface TabItem {
  value:     string
  label:     string
  icon?:     ReactNode
  badge?:    string | number
  disabled?: boolean
  content?:  ReactNode   // self-contained mode: panel content per tab
}

export interface TabsProps {
  tabs:           TabItem[]
  /** Controlled: currently selected tab value */
  value:          string
  onChange:       (value: string) => void
  variant?:       'pill' | 'underline'
  /** Required for role="tablist" aria-label */
  'aria-label':   string
  className?:     string
  /** External panel content (controlled mode — renders below the tablist) */
  children?:      ReactNode
}

// ─── Style constants (pill = the GOBY pill-tab pattern) ────────

const PILL_BASE =
  'px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5'
const PILL_ACTIVE   = 'border-navy/50 bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100 shadow-sm'
const PILL_INACTIVE =
  'border-border dark:border-white/10 text-text-muted hover:border-navy/30 hover:text-navy/70 dark:hover:text-info-soft/70'

const UNDERLINE_BASE    = 'px-4 py-3 text-xs font-medium border-b-2 transition-colors'
const UNDERLINE_ACTIVE  = 'border-navy text-lean-black dark:text-warm-50'
const UNDERLINE_INACTIVE = 'border-transparent text-text-muted hover:text-text-default'

// ─── Component ─────────────────────────────────────────────────

export function Tabs({
  tabs,
  value,
  onChange,
  variant   = 'pill',
  'aria-label': ariaLabel,
  className = '',
  children,
}: TabsProps) {
  const uid      = useId()
  const tabRefs  = useRef<(HTMLButtonElement | null)[]>([])

  const enabledTabs = tabs.filter((t) => !t.disabled)

  // Stable id helpers — scoped to this Tabs instance via useId()
  const tabId   = (v: string) => `${uid}-tab-${v}`
  const panelId = (v: string) => `${uid}-panel-${v}`

  // ── Keyboard navigation ──────────────────────────────────────
  // Implements ARIA Tabs pattern: automatic activation on Arrow keys.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const currentTab   = tabs[index]
      const curEnabledIdx = enabledTabs.findIndex((t) => t.value === currentTab.value)
      let nextEnabledIdx  = -1

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          nextEnabledIdx = (curEnabledIdx + 1) % enabledTabs.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          nextEnabledIdx = (curEnabledIdx - 1 + enabledTabs.length) % enabledTabs.length
          break
        case 'Home':
          e.preventDefault()
          nextEnabledIdx = 0
          break
        case 'End':
          e.preventDefault()
          nextEnabledIdx = enabledTabs.length - 1
          break
        default:
          return
      }

      const targetValue = enabledTabs[nextEnabledIdx].value
      onChange(targetValue)
      const targetIndex = tabs.findIndex((t) => t.value === targetValue)
      requestAnimationFrame(() => tabRefs.current[targetIndex]?.focus())
    },
    [tabs, enabledTabs, onChange],
  )

  // ── Tab button class ─────────────────────────────────────────
  function tabClass(tab: TabItem): string {
    const isActive = tab.value === value
    const focusRing =
      variant === 'pill'
        ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/50'
        : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-sm'
    const disabledCls = tab.disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'

    if (variant === 'underline') {
      return [UNDERLINE_BASE, focusRing, isActive ? UNDERLINE_ACTIVE : UNDERLINE_INACTIVE, disabledCls].join(' ')
    }
    return [PILL_BASE, focusRing, isActive ? PILL_ACTIVE : PILL_INACTIVE, disabledCls].join(' ')
  }

  // ── Nav container class ──────────────────────────────────────
  // underline: consumer's wrapper provides the border-b (so it spans full width incl. padding)
  const navClass =
    variant === 'underline'
      ? 'flex gap-0'
      : 'flex gap-2 flex-wrap'

  const activeContent = tabs.find((t) => t.value === value)?.content

  return (
    <div className={className}>
      {/* Tablist */}
      <div role="tablist" aria-label={ariaLabel} className={navClass}>
        {tabs.map((tab, index) => (
          <button
            key={tab.value}
            ref={(el) => { tabRefs.current[index] = el }}
            role="tab"
            id={tabId(tab.value)}
            aria-selected={tab.value === value}
            aria-controls={panelId(tab.value)}
            tabIndex={tab.value === value ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.value)}
            onKeyDown={(e) => !tab.disabled && handleKeyDown(e, index)}
            className={tabClass(tab)}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                aria-label={`(${tab.badge})`}
                className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1
                  rounded-full bg-navy/15 dark:bg-navy/30 text-navy dark:text-warm-100
                  text-[9px] font-bold"
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel — renders when content is available */}
      {(children != null || activeContent != null) && (
        <div
          role="tabpanel"
          id={panelId(value)}
          aria-labelledby={tabId(value)}
        >
          {children ?? activeContent}
        </div>
      )}
    </div>
  )
}
