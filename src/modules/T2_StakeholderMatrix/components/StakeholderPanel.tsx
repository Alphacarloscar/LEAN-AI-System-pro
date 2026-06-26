// ============================================================
// T2 — StakeholderPanel
//
// Panel derecho con detalle de stakeholder activo:
// arquetipo, resistencia, scores, intervenciones.
// ============================================================

import { ARCHETYPE_CONFIG, RESISTANCE_CONFIG } from '../constants'
import type { Stakeholder }                     from '../types'
import { ArchetypeBadge, ResistanceBadge }       from './T2Badges'
import { MiniPositionMap }                       from './MiniPositionMap'
import { MetallicScoreBars }                     from './MetallicScoreBars'
import { Button }                                from '@shared/design-system/components'

interface StakeholderPanelProps {
  stakeholder:      Stakeholder
  onClose:          () => void
  onStartInterview: (s: Stakeholder) => void
}

export function StakeholderPanel({
  stakeholder,
  onClose,
  onStartInterview,
}: StakeholderPanelProps) {
  const cfg = ARCHETYPE_CONFIG[stakeholder.archetype] ?? ARCHETYPE_CONFIG.adoptador
  const res = RESISTANCE_CONFIG[stakeholder.resistance]
  const interventions = cfg?.interventions?.[stakeholder.resistance] ?? []

  const isHighRisk =
    (stakeholder.archetype === 'critico' || stakeholder.archetype === 'decisor') &&
    stakeholder.resistance === 'alta'

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-warm-800 overflow-hidden">

      {/* ── HEADER: identidad izquierda | notas derecha ── */}
      <div className={`border-b border-border ${isHighRisk ? 'bg-danger-light dark:bg-[#3A1A1A]' : 'bg-warm-50 dark:bg-warm-900/60'}`}>
        <div className="flex divide-x divide-border/40">

          {/* Identidad */}
          <div className="flex-1 min-w-0 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-lean-black dark:text-warm-50 truncate">
                  {stakeholder.name}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{stakeholder.role}</p>
                <p className="text-[10px] text-text-subtle mt-0.5">{stakeholder.department}</p>
              </div>
              <button
                onClick={onClose}
                className="h-6 w-6 rounded-md flex items-center justify-center text-text-subtle hover:bg-warm-200 dark:hover:bg-warm-600 transition-colors shrink-0"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M1 1l9 9M10 1L1 10" />
                </svg>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <ArchetypeBadge archetype={stakeholder.archetype} />
              <ResistanceBadge resistance={stakeholder.resistance} />
              {stakeholder.manualOverride && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-warm-100 dark:bg-warm-700 text-text-subtle">
                  Ajuste manual
                </span>
              )}
            </div>
          </div>

          {/* Notas de sesión — en el header, columna derecha */}
          {stakeholder.notes && (
            <div className="w-[168px] shrink-0 px-3 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1.5">
                Notas de sesión
              </p>
              <p className="text-[10px] text-text-muted leading-relaxed italic line-clamp-4">
                {stakeholder.notes}
              </p>
            </div>
          )}
        </div>

        {/* Alerta riesgo alto */}
        {isHighRisk && (
          <div className="mx-4 mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-danger-light border border-danger-dark/20">
            <svg className="h-3.5 w-3.5 text-danger-dark mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clipRule="evenodd" />
            </svg>
            <p className="text-[11px] text-danger-dark font-medium">
              Perfil de riesgo alto — requiere intervención prioritaria antes del piloto.
            </p>
          </div>
        )}
      </div>

      {/* ── BODY: mapa grande izquierda | intervenciones derecha ── */}
      <div className="flex divide-x divide-border/30">

        {/* LEFT — perfil + mapa de posición grande */}
        <div className="w-[210px] shrink-0 px-3 py-4 flex flex-col gap-3">

          {/* Perfil arquetipo */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-lean-black dark:text-warm-100 mb-1">
              Perfil — {cfg.label}
            </p>
            <p className="text-[10px] text-text-muted leading-relaxed">{cfg.description}</p>
            <p className="text-[10px] italic text-text-muted mt-1">"{cfg.tagline}"</p>
          </div>

          {/* Mapa de posición — protagonista visual a ancho completo */}
          {stakeholder.interview ? (
            <div className="flex justify-center mt-1">
              <MiniPositionMap
                adoptionScore={stakeholder.interview.adoptionScore}
                influenceScore={stakeholder.interview.influenceScore}
                archetype={stakeholder.archetype}
                name={stakeholder.name}
                size={160}
              /></div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 py-5">
              <div className="opacity-30">
                <svg className="h-7 w-7 text-text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-[10px] text-text-muted text-center leading-snug">Sin entrevista</p>
              <Button
                variant="primary"
                size="xs"
                onClick={() => onStartInterview(stakeholder)}
                icon={
                  <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M8 2v12M2 8h12" />
                  </svg>
                }
              >
                Iniciar entrevista
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT — intervenciones */}
        <div className="flex-1 min-w-0 px-4 py-4">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-lean-black dark:text-warm-100 mb-3">
            Intervenciones · {res.label}
          </p>
          <ol className="space-y-3">
            {interventions.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="flex-shrink-0 h-[15px] w-[15px] rounded-full bg-navy dark:bg-gold text-white dark:text-lean-black text-[8px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[11px] text-text-muted leading-relaxed">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── FOOTER: barras de scores a ancho completo ── */}
      {stakeholder.interview && (
        <div className="border-t border-border/40 px-5 py-4">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted mb-3">
            Scores de entrevista
          </p>
          <MetallicScoreBars
            adoptionScore={stakeholder.interview.adoptionScore}
            influenceScore={stakeholder.interview.influenceScore}
            opennessScore={stakeholder.interview.opennessScore}
            trackWidth={260}
          />
        </div>
      )}
    </div>
  )
}
