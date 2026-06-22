// ── T8 Tab 2: Mensajes por Arquetipo ──────────────────────────

import { useState } from 'react'
import { AlertTriangle, Lightbulb,
  Mail, Building2, MessageSquare, Monitor, Video, FileText } from 'lucide-react'
import { ARCHETYPE_CONFIG, CHANNEL_CFG } from '../T8Generators'

const CHANNEL_ICON_MAP: Record<string, React.ReactElement> = {
  mail:            <Mail          size={12} strokeWidth={2} />,
  building:        <Building2     size={12} strokeWidth={2} />,
  'message-square':<MessageSquare size={12} strokeWidth={2} />,
  monitor:         <Monitor       size={12} strokeWidth={2} />,
  video:           <Video         size={12} strokeWidth={2} />,
  'file-text':     <FileText      size={12} strokeWidth={2} />,
}
import type { ArchetypeCode } from '@/modules/T2_StakeholderMatrix/types'
import type { ArchetypeMessage } from '../types'
import { Card } from '@shared/design-system/components'

export function ArchetypeMessagesTab({ messages }: { messages: ArchetypeMessage[] }) {
  const [selected, setSelected] = useState(messages[0]?.archetypeCode ?? null)
  const msg = messages.find(m => m.archetypeCode === selected)

  const DEPT_CFG_LOCAL: Record<string, { badgeBg: string; badgeText: string; fill: string }> = {
    adoptador:    { fill: '#10B981', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700' },
    ambassador:   { fill: '#6366F1', badgeBg: 'bg-indigo-100',  badgeText: 'text-indigo-700'  },
    decisor:      { fill: '#2A2822', badgeBg: 'bg-slate-100',   badgeText: 'text-slate-700'   },
    reticente:    { fill: '#F97316', badgeBg: 'bg-orange-100',  badgeText: 'text-orange-700'  },
    critico:      { fill: '#EF4444', badgeBg: 'bg-red-100',     badgeText: 'text-red-700'     },
  }

  return (
    <div className="flex gap-5 items-start">
      {/* Sidebar de arquetipos */}
      <div className="w-44 flex-shrink-0 space-y-1.5">
        {messages.map(m => {
          const cfg = ARCHETYPE_CONFIG[m.archetypeCode as ArchetypeCode]
          const lcfg = DEPT_CFG_LOCAL[m.archetypeCode]
          return (
            <button
              key={m.archetypeCode}
              onClick={() => setSelected(m.archetypeCode)}
              className={[
                'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all border text-xs',
                selected === m.archetypeCode
                  ? 'bg-navy/8 dark:bg-navy/15 border-navy/30 text-navy dark:text-warm-100'
                  : 'border-border dark:border-white/6 text-text-muted hover:border-navy/20 bg-white dark:bg-gray-900',
              ].join(' ')}
            >
              <span
                className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: lcfg?.fill ?? '#94A3B8' }}
              >
                {m.archetypeLabel.slice(0, 2).toUpperCase()}
              </span>
              <span className="font-medium leading-tight">{cfg?.label ?? m.archetypeLabel}</span>
            </button>
          )
        })}
      </div>

      {/* Contenido */}
      {msg && (
        <div className="flex-1 min-w-0 space-y-4">
          {/* Headline */}
          <Card variant="outlined" padding="none" className="rounded-xl p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">Mensaje headline</p>
            <p className="text-base font-semibold text-lean-black dark:text-gray-100 leading-snug">
              "{msg.headline}"
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key points */}
            <Card variant="outlined" padding="none" className="rounded-xl p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">Puntos clave a comunicar</p>
              <div className="space-y-2.5">
                {msg.keyPoints.map((pt, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-navy/10 dark:bg-navy/25 flex items-center justify-center text-[9px] font-bold text-navy dark:text-warm-100 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-xs text-text-muted leading-relaxed">{pt}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Do not say + Opening */}
            <div className="space-y-4">
              <Card variant="flat" padding="none" className="rounded-xl border border-danger-light bg-danger-light/20 p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-danger-dark mb-2 flex items-center gap-1"><AlertTriangle size={11} strokeWidth={2} /> No decir</p>
                <p className="text-xs text-danger-dark leading-relaxed">{msg.doNotSay}</p>
              </Card>
              <Card variant="outlined" padding="none" className="rounded-xl p-4">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">Apertura sugerida para 1:1</p>
                <p className="text-xs text-text-muted leading-relaxed italic">{msg.openingLine}</p>
              </Card>
            </div>
          </div>

          {/* Resistance note + Channel */}
          <Card variant="flat" padding="none" className="rounded-xl border border-border dark:border-white/6 bg-gray-50 dark:bg-gray-800/50 p-4 flex items-start gap-3">
            <Lightbulb size={16} strokeWidth={2} className="flex-shrink-0 text-text-subtle" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">Nota de resistencia</p>
              <p className="text-xs text-text-muted leading-relaxed">{msg.resistanceNote}</p>
              <p className="text-[10px] text-text-subtle mt-2">
                Canal recomendado: <span className="font-medium text-text-muted inline-flex items-center gap-1">{CHANNEL_ICON_MAP[CHANNEL_CFG[msg.channel]?.icon ?? ''] ?? null} {CHANNEL_CFG[msg.channel]?.label ?? msg.channel}</span>
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
