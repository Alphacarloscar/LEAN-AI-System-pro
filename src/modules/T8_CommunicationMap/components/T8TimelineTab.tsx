// ── T8 Tab 1: Timeline ────────────────────────────────────────

import { useState } from 'react'
import { Megaphone, GraduationCap, BarChart2, Handshake, Zap, Newspaper, ClipboardList,
  Mail, Building2, MessageSquare, Monitor, Video, FileText,
  Users, Target, User } from 'lucide-react'
import { PHASE_CFG, TYPE_CFG, CHANNEL_CFG, PRIORITY_CFG } from '../T8Generators'
import type { CommAction, CommPhase } from '../types'
import { Card, Badge } from '@shared/design-system/components'

const TYPE_ICON_MAP: Record<string, React.ReactElement> = {
  megaphone:       <Megaphone    size={16} strokeWidth={1.5} />,
  'graduation-cap':<GraduationCap size={16} strokeWidth={1.5} />,
  'bar-chart-2':   <BarChart2    size={16} strokeWidth={1.5} />,
  handshake:       <Handshake    size={16} strokeWidth={1.5} />,
  zap:             <Zap          size={16} strokeWidth={1.5} />,
  newspaper:       <Newspaper    size={16} strokeWidth={1.5} />,
  'clipboard-list':<ClipboardList size={16} strokeWidth={1.5} />,
}
const CHANNEL_ICON_MAP: Record<string, React.ReactElement> = {
  mail:            <Mail         size={12} strokeWidth={1.5} />,
  building:        <Building2    size={12} strokeWidth={1.5} />,
  'message-square':<MessageSquare size={12} strokeWidth={1.5} />,
  monitor:         <Monitor      size={12} strokeWidth={1.5} />,
  video:           <Video        size={12} strokeWidth={1.5} />,
  'file-text':     <FileText     size={12} strokeWidth={1.5} />,
}

export function TimelineTab({ actions }: { actions: CommAction[] }) {
  const [activePhase, setActivePhase] = useState<CommPhase | 'all'>('all')

  const phases: CommPhase[] = ['phase1', 'phase2', 'phase3']
  const filtered = activePhase === 'all' ? actions : actions.filter(a => a.phase === activePhase)

  return (
    <div className="space-y-5">
      {/* Filtro de fase */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mr-1">Filtrar por fase</span>
        <button
          onClick={() => setActivePhase('all')}
          className={['px-3 py-1 rounded-full text-xs font-medium border transition-all',
            activePhase === 'all' ? 'bg-navy-metallic text-white border-navy' : 'border-border text-text-muted hover:border-navy/30'
          ].join(' ')}
        >
          Todas
        </button>
        {phases.map(ph => {
          const cfg = PHASE_CFG[ph]
          return (
            <button
              key={ph}
              onClick={() => setActivePhase(ph)}
              className={['px-3 py-1 rounded-full text-xs font-medium border transition-all',
                activePhase === ph ? `${cfg.bg} ${cfg.color} ${cfg.border}` : 'border-border text-text-muted hover:border-navy/30'
              ].join(' ')}
            >
              {cfg.label} — {cfg.period}
            </button>
          )
        })}
      </div>

      {/* Acciones agrupadas por fase */}
      {phases.filter(ph => activePhase === 'all' || ph === activePhase).map(ph => {
        const phActions = filtered.filter(a => a.phase === ph)
        if (phActions.length === 0) return null
        const cfg = PHASE_CFG[ph]

        return (
          <div key={ph} className="space-y-3">
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${cfg.bg} border ${cfg.border}`}>
              <div>
                <span className={`text-xs font-bold font-mono ${cfg.color}`}>{cfg.label}</span>
                <span className="text-xs text-text-muted ml-2">{cfg.period}</span>
              </div>
              <span className={`ml-auto text-[10px] font-medium ${cfg.color}`}>{phActions.length} acciones</span>
            </div>

            <div className="space-y-2.5">
              {phActions.map(action => {
                const typeCfg    = TYPE_CFG[action.type]
                const channelCfg = CHANNEL_CFG[action.channel]
                const priCfg     = PRIORITY_CFG[action.priority]

                return (
                  <Card key={action.id} variant="outlined" padding="none" className="rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface border border-border dark:bg-warm-800 dark:border-white/10 flex items-center justify-center text-text-subtle">
                        {TYPE_ICON_MAP[typeCfg.icon] ?? <BarChart2 size={14} strokeWidth={1.5} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-1.5">
                          <div>
                            <p className="font-semibold text-sm text-lean-black dark:text-gray-100">{action.title}</p>
                            <p className="text-[10px] font-mono text-text-subtle mt-0.5">{action.week}</p>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${priCfg.color}`}>
                            {priCfg.label}
                          </span>
                        </div>

                        <p className="text-xs text-text-muted leading-relaxed mb-3">{action.message}</p>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="default" shape="pill" size="xs"><span className="inline-flex items-center gap-1"><Users size={10} strokeWidth={1.5} />{action.audience}</span></Badge>
                          <Badge variant="default" shape="pill" size="xs"><span className="inline-flex items-center gap-1">{CHANNEL_ICON_MAP[channelCfg.icon] ?? <Mail size={10} strokeWidth={1.5} />}{channelCfg.label}</span></Badge>
                          <Badge variant="default" shape="pill" size="xs"><span className="inline-flex items-center gap-1"><Target size={10} strokeWidth={1.5} />{typeCfg.label}</span></Badge>
                          <Badge variant="default" shape="pill" size="xs"><span className="inline-flex items-center gap-1"><User size={10} strokeWidth={1.5} />{action.owner}</span></Badge>
                        </div>

                        {action.materials && action.materials.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-text-subtle">Materiales:</span>
                            {action.materials.map((m, i) => (
                              <span key={i} className="text-[10px] text-navy dark:text-warm-100 bg-navy/8 dark:bg-navy/20 px-2 py-0.5 rounded-full">
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
