// ============================================================
// CompanyProfile — FrictionCard
// ============================================================

import { FieldLabel, LeanSelect, ToggleChip } from './CompanyProfileHelpers'
import { FREQ_COLOR, IMPACT_COLOR } from './CompanyProfileHelpers.constants'
import { FRICTION_TYPE_OPTIONS, ALL_BUSINESS_AREAS as AREA_OPTIONS } from '../types'
import type { Friction, FrictionFrequency, FrictionImpact } from '../types'

interface FrictionCardProps {
  index:    number
  friction: Friction
  onUpdate: (partial: Partial<Friction>) => void
  onRemove: () => void
}

export function FrictionCard({ index, friction, onUpdate, onRemove }: FrictionCardProps) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-border dark:border-white/6 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-navy/10 dark:bg-navy/20 border border-navy/20 dark:border-navy/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-navy dark:text-warm-100">{index + 1}</span>
          </div>
          <span className="text-xs font-semibold text-lean-black dark:text-gray-300">Fricción / Oportunidad</span>
        </div>
        <button
          onClick={onRemove}
          className="h-6 w-6 rounded flex items-center justify-center text-text-subtle dark:text-gray-600 hover:text-danger-dark hover:bg-danger-light/20 transition-colors"
          aria-label="Eliminar fricción"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 2l10 10M12 2L2 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Tipo de problema</FieldLabel>
          <LeanSelect
            value={friction.tipo}
            onChange={(v) => onUpdate({ tipo: v })}
            options={FRICTION_TYPE_OPTIONS}
            placeholder="Seleccionar..."
          />
        </div>
        <div>
          <FieldLabel>Área funcional</FieldLabel>
          <LeanSelect
            value={friction.areaFuncional}
            onChange={(v) => onUpdate({ areaFuncional: v })}
            options={AREA_OPTIONS as unknown as string[]}
            placeholder="Opcional..."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <FieldLabel>Frecuencia</FieldLabel>
          <div className="flex gap-1.5 flex-wrap">
            {(['Baja', 'Media', 'Alta'] as FrictionFrequency[]).map((f) => (
              <ToggleChip
                key={f} label={f} value={f}
                selected={friction.frecuencia === f}
                onSelect={(v) => onUpdate({ frecuencia: v })}
                colorSelected={FREQ_COLOR[f]}
              />
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Impacto</FieldLabel>
          <div className="flex gap-1.5 flex-wrap">
            {(['Bajo', 'Medio', 'Alto'] as FrictionImpact[]).map((i) => (
              <ToggleChip
                key={i} label={i} value={i}
                selected={friction.impacto === i}
                onSelect={(v) => onUpdate({ impacto: v })}
                colorSelected={IMPACT_COLOR[i]}
              />
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Notas adicionales</FieldLabel>
          <textarea
            value={friction.notas}
            onChange={(e) => onUpdate({ notas: e.target.value })}
            rows={2}
            placeholder="Descripción adicional..."
            className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-gray-900 border border-border dark:border-white/8 text-lean-black dark:text-gray-200 placeholder-text-subtle dark:placeholder-gray-600 resize-none focus:outline-none focus:border-navy dark:focus:border-navy/60 focus:ring-2 focus:ring-navy/15 dark:focus:ring-navy/20 transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
