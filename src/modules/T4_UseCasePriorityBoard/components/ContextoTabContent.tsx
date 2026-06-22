// ============================================================
// T4 — ContextoTabContent (T1/T2 context)
// ============================================================

import { Check } from 'lucide-react'
import { Badge, Card } from '@shared/design-system/components'
import type { UseCase } from '../types'
import type { Stakeholder } from '@/modules/T2_StakeholderMatrix/types'

interface ContextoTabProps {
  useCase:        UseCase
  catHex:         string
  autoT1Context?: { weakDimensions: string[]; total: number } | null
  autoT2Context?: { champions: Stakeholder[]; blockers: Stakeholder[] } | null
}

export function ContextoTabContent({ useCase, catHex, autoT1Context, autoT2Context }: ContextoTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* T1 context */}
      <Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-lg bg-navy/10 dark:bg-navy/20 flex items-center justify-center text-xs font-bold text-navy dark:text-warm-100">T1</div>
          <p className="text-xs font-semibold text-lean-black dark:text-gray-200">Contexto de madurez IA (T1)</p>
        </div>
        {useCase.t1Context ? (
          <>
            {useCase.t1Context.relevantDimensions.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-mono text-text-subtle mb-1.5">Dimensiones relevantes</p>
                <div className="flex flex-wrap gap-1.5">
                  {useCase.t1Context.relevantDimensions.map((d) => (
                    <Badge key={d} shape="pill" size="xs" style={{ backgroundColor: 'rgba(42,40,34,0.08)', color: '#2A2822' }}>{d}</Badge>
                  ))}
                </div>
              </div>
            )}
            {useCase.t1Context.maturityNotes && <p className="text-xs text-text-muted leading-relaxed">{useCase.t1Context.maturityNotes}</p>}
          </>
        ) : autoT1Context ? (
          <>
            <p className="text-[10px] font-mono text-text-subtle mb-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-navy/40 inline-block" />
              Auto-calculado desde T1 · {autoT1Context.total} dimensiones evaluadas
            </p>
            {autoT1Context.weakDimensions.length > 0 ? (
              <div className="mb-2">
                <p className="text-[10px] font-mono text-warning-dark mb-1.5">Dimensiones con madurez baja (≤2)</p>
                <div className="flex flex-wrap gap-1.5">
                  {autoT1Context.weakDimensions.map((d) => <Badge key={d} variant="warning" shape="pill" size="xs">{d}</Badge>)}
                </div>
              </div>
            ) : (
              <p className="text-xs text-success-dark flex items-center gap-1"><Check size={12} strokeWidth={2} /> Madurez IA suficiente en todas las dimensiones</p>
            )}
          </>
        ) : (
          <p className="text-xs text-text-subtle italic">Sin datos de T1. Completa el Madurez Radar primero.</p>
        )}
      </Card>

      {/* T2 context */}
      <Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-lg bg-info-light flex items-center justify-center text-xs font-bold text-info-dark">T2</div>
          <p className="text-xs font-semibold text-lean-black dark:text-gray-200">Contexto de stakeholders (T2)</p>
        </div>
        {useCase.t2Context ? (
          <div className="flex flex-col gap-3">
            {useCase.t2Context.championArchetype && (
              <div>
                <p className="text-[10px] font-mono text-text-subtle mb-0.5">Champion</p>
                <p className="text-xs font-medium text-success-dark flex items-center gap-1"><Check size={12} strokeWidth={2} /> {useCase.t2Context.championArchetype}</p>
              </div>
            )}
            {useCase.t2Context.blockerArchetypes?.length ? (
              <div>
                <p className="text-[10px] font-mono text-text-subtle mb-0.5">Posibles bloqueos</p>
                {useCase.t2Context.blockerArchetypes.map((b) => <p key={b} className="text-xs font-medium text-danger-dark">▲ {b}</p>)}
              </div>
            ) : null}
            {useCase.t2Context.stakeholderNotes && <p className="text-xs text-text-muted leading-relaxed">{useCase.t2Context.stakeholderNotes}</p>}
          </div>
        ) : autoT2Context ? (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-mono text-text-subtle flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-navy/40 inline-block" />
              Auto-calculado desde T2 · {autoT2Context.champions.length + autoT2Context.blockers.length} stakeholders relevantes
            </p>
            {autoT2Context.champions.length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-success-dark mb-1">Champions potenciales</p>
                {autoT2Context.champions.map((s) => <p key={s.id} className="text-xs font-medium text-success-dark flex items-center gap-1"><Check size={12} strokeWidth={2} /> {s.name} · {s.role}</p>)}
              </div>
            )}
            {autoT2Context.blockers.length > 0 && (
              <div>
                <p className="text-[10px] font-mono text-danger-dark mb-1">Posibles bloqueos</p>
                {autoT2Context.blockers.map((s) => <p key={s.id} className="text-xs font-medium text-danger-dark">▲ {s.name} · {s.role}</p>)}
              </div>
            )}
            {autoT2Context.champions.length === 0 && autoT2Context.blockers.length === 0 && (
              <p className="text-xs text-text-muted">Sin perfiles críticos detectados en T2</p>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-subtle italic">Sin datos de T2. Completa la Stakeholder Matrix primero.</p>
        )}
      </Card>

      {/* AI Category */}
      <Card variant="outlined" padding="none" className="rounded-2xl px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: catHex }} />
          <p className="text-xs font-semibold text-lean-black dark:text-gray-200">Categoría IA</p>
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: catHex }}>{useCase.aiCategory}</p>
        {useCase.importedFromT3 && (
          <div className="mt-2">
            <p className="text-[10px] font-mono text-text-subtle mb-0.5">Proceso origen (T3)</p>
            <p className="text-xs text-text-muted">{useCase.importedFromT3.processName}</p>
            <p className="text-[10px] text-text-subtle mt-0.5">Opp. score T3: <span className="font-bold">{useCase.importedFromT3.opportunityScore.toFixed(2)}/4.0</span></p>
          </div>
        )}
      </Card>
    </div>
  )
}
