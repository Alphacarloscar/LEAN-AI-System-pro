// ── T8 Tab 3: Materiales ──────────────────────────────────────

import { useState } from 'react'
import { CopyButton } from './T8CopyButton'
import type { MaterialTemplate } from '../types'
import { Card, Badge } from '@shared/design-system/components'

export function MaterialsTab({ materials }: { materials: MaterialTemplate[] }) {
  const [selected, setSelected] = useState(materials[0]?.id ?? null)
  const mat = materials.find(m => m.id === selected)

  return (
    <div className="flex gap-5 items-start">
      {/* Sidebar */}
      <div className="w-52 flex-shrink-0 space-y-1.5">
        {materials.map(m => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className={[
              'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border',
              selected === m.id
                ? 'bg-navy/8 dark:bg-navy/15 border-navy/30'
                : 'border-border dark:border-white/6 hover:border-navy/20 bg-white dark:bg-gray-900',
            ].join(' ')}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{m.icon}</span>
            <div className="min-w-0">
              <p className={`text-xs font-semibold leading-tight ${selected === m.id ? 'text-navy dark:text-warm-100' : 'text-lean-black dark:text-gray-100'}`}>
                {m.title}
              </p>
              <p className="text-[10px] text-text-subtle mt-0.5 leading-tight">{m.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Contenido */}
      {mat && (
        <Card variant="outlined" padding="none" className="flex-1 min-w-0 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border dark:border-white/6">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{mat.icon}</span>
              <div>
                <p className="font-semibold text-sm text-lean-black dark:text-gray-100">{mat.title}</p>
                <p className="text-xs text-text-muted">{mat.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {mat.tags.map(tag => (
                <Badge key={tag} variant="default" shape="pill" size="xs">
                  {tag}
                </Badge>
              ))}
              <CopyButton text={mat.content} />
            </div>
          </div>

          {/* Contenido copyable */}
          <pre className="px-6 py-5 text-xs text-text-muted leading-relaxed font-mono whitespace-pre-wrap overflow-auto max-h-[520px]">
            {mat.content}
          </pre>
        </Card>
      )}
    </div>
  )
}
