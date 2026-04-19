import { useState, type ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────
// Tabs — navegación por pestañas (horizontal)
//
// Uso controlado (externo):
//   <Tabs activeTab={tab} onChange={setTab} tabs={[...]} />
//
// Uso no controlado (autogestión):
//   <Tabs tabs={[{ id:'t1', label:'Overview', content:<div/> }]} />
// ─────────────────────────────────────────────────────────────

export interface TabItem {
  id:       string
  label:    ReactNode
  content?: ReactNode     // usado en modo autogestionado
  disabled?: boolean
  badge?:   string | number
}

export interface TabsProps {
  tabs:        TabItem[]
  activeTab?:  string          // controlado externamente
  onChange?:   (id: string) => void
  defaultTab?: string          // solo para modo no controlado
  children?:   ReactNode       // contenido externo (modo controlado)
  variant?:    'underline' | 'pill'
  className?:  string
}

export function Tabs({
  tabs,
  activeTab: activeTabProp,
  onChange,
  defaultTab,
  children,
  variant   = 'underline',
  className = '',
}: TabsProps) {
  const [internalTab, setInternalTab] = useState<string>(
    defaultTab ?? tabs.find((t) => !t.disabled)?.id ?? ''
  )

  const isControlled = activeTabProp !== undefined
  const activeTab    = isControlled ? activeTabProp : internalTab

  function handleSelect(id: string) {
    if (!isControlled) setInternalTab(id)
    onChange?.(id)
  }

  const activeContent = tabs.find((t) => t.id === activeTab)?.content

  // ── Estilos por variante ──
  const navClass = variant === 'underline'
    ? 'flex border-b border-border gap-0'
    : 'flex bg-surface dark:bg-gray-800 rounded-lg p-1 gap-1'

  function tabClass(tab: TabItem) {
    const base = 'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded-sm'
    const isActive = tab.id === activeTab

    if (variant === 'underline') {
      return [
        base,
        'px-4 py-2.5 text-sm font-medium -mb-px border-b-2',
        isActive
          ? 'border-navy text-navy dark:border-info-soft dark:text-info-soft'
          : 'border-transparent text-text-muted hover:text-lean-black dark:hover:text-gray-100',
        tab.disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
      ].join(' ')
    }

    // pill
    return [
      base,
      'px-4 py-1.5 text-sm font-medium rounded-md',
      isActive
        ? 'bg-white dark:bg-gray-900 text-lean-black dark:text-gray-100 shadow-sm'
        : 'text-text-muted hover:text-lean-black dark:hover:text-gray-100',
      tab.disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer',
    ].join(' ')
  }

  return (
    <div className={className}>
      {/* Nav */}
      <nav role="tablist" aria-label="Pestañas" className={navClass}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleSelect(tab.id)}
            className={tabClass(tab)}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && (
                <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-navy/10 text-navy text-[10px] font-semibold dark:bg-info-soft/20 dark:text-info-soft">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </nav>

      {/* Panel */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="mt-4"
      >
        {children ?? activeContent}
      </div>
    </div>
  )
}
