// ============================================================
// T4 — RoadmapTabContent
// ============================================================

import { Card, FormField } from '@shared/design-system/components'
import { ROADMAP_QUARTERS } from '../constants'
import type { UseCase } from '../types'

interface RoadmapTabProps {
  useCase:          UseCase
  onUpdateRoadmap:  (patch: Partial<NonNullable<UseCase['roadmap']>>) => void
}

export function RoadmapTabContent({ useCase, onUpdateRoadmap }: RoadmapTabProps) {
  const rm = useCase.roadmap ?? {}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">Quarter de implementación</p>
          <div className="flex flex-wrap gap-2">
            {(ROADMAP_QUARTERS as readonly string[]).map((q) => {
              const isActive = rm.quarter === q
              return (
                <button
                  key={q}
                  onClick={() => onUpdateRoadmap({ quarter: isActive ? undefined : q })}
                  className={[
                    'px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                    isActive
                      ? 'bg-navy text-white border-navy shadow-sm'
                      : 'border-border dark:border-white/10 text-text-muted hover:border-navy/40 hover:text-lean-black dark:hover:text-warm-100',
                  ].join(' ')}
                >
                  {q}
                </button>
              )
            })}
          </div>
          {rm.quarter && <p className="mt-2 text-[10px] text-text-subtle">Click en el quarter activo para quitar la asignación.</p>}
        </div>

        <FormField id="rm-duration" label="Duración estimada" value={rm.estimatedDuration ?? ''} onChange={(e) => onUpdateRoadmap({ estimatedDuration: e.target.value || undefined })} placeholder="ej. 6 semanas, 3 meses…" />
        <FormField id="rm-start-date" label="Fecha de inicio" type="date" value={rm.startDate ?? ''} onChange={(e) => onUpdateRoadmap({ startDate: e.target.value || undefined })} hint="Si se especifica, tiene prioridad sobre el quarter en el Roadmap T9." />
        <FormField id="rm-end-date" label="Fecha de fin" type="date" value={rm.endDate ?? ''} onChange={(e) => onUpdateRoadmap({ endDate: e.target.value || undefined })} />
        <FormField id="rm-owner" label="Responsable de implementación" value={rm.owner ?? ''} onChange={(e) => onUpdateRoadmap({ owner: e.target.value || undefined })} placeholder="Nombre o rol responsable…" />
      </div>

      <div className="flex flex-col gap-6">
        <FormField id="rm-next-steps" label="Próximos pasos" multiline rows={4} value={rm.nextSteps ?? ''} onChange={(e) => onUpdateRoadmap({ nextSteps: e.target.value || undefined })} placeholder="Acciones concretas para arrancar este caso de uso…" />
        <FormField id="rm-dependencies" label="Dependencias" multiline rows={3} value={rm.dependencies ?? ''} onChange={(e) => onUpdateRoadmap({ dependencies: e.target.value || undefined })} placeholder="Dependencias con otros casos de uso, sistemas o equipos…" />
        {useCase.notes && (
          <Card variant="flat" padding="none" className="rounded-xl bg-warm-50 dark:bg-warm-800/40 border border-border dark:border-white/6 px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">Notas del consultor</p>
            <p className="text-xs text-text-muted leading-relaxed italic">{useCase.notes}</p>
          </Card>
        )}
      </div>
    </div>
  )
}
