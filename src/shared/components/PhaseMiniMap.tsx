// ============================================================
// PhaseMiniMap — Indicador visual de posición en la metodología
//
// Muestra las 6 fases L.E.A.N. como nodos conectados.
// La fase activa se resalta en navy; las anteriores en azul
// apagado; las siguientes en gris.
//
// Uso:
//   <PhaseMiniMap phaseId="listen"   toolCode="T1" />
//   <PhaseMiniMap phaseId="evaluate" toolCode="T5" />
//   <PhaseMiniMap phaseId="activate" toolCode="T9" />
//
// Props:
//   phaseId  — id de la fase activa (ver LEAN_PHASES)
//   toolCode — código de la herramienta activa (T1–T9) para tooltip
//   dark     — forzar modo oscuro (si no se detecta via CSS class)
// ============================================================

// ── Definición estática de las 6 fases L.E.A.N. ───────────────
export type LeanPhaseId =
  | 'listen'
  | 'evaluate'
  | 'activate'
  | 'normalize'
  | 'iso'
  | 'handover'

const LEAN_PHASES: Array<{
  id:       LeanPhaseId
  letter:   string
  label:    string
  duration: string
  tools:    string[]
}> = [
  { id: 'listen',    letter: 'L', label: 'Listen',      duration: 'Semanas 1–3',  tools: ['T1','T2','T3'] },
  { id: 'evaluate',  letter: 'E', label: 'Evaluate',    duration: 'Semanas 4–8',  tools: ['T4','T5','T6'] },
  { id: 'activate',  letter: 'A', label: 'Activate',    duration: 'Semanas 9–16', tools: ['T7','T8','T9'] },
  { id: 'normalize', letter: 'N', label: 'Normalize',   duration: 'Meses 5–6',    tools: ['T10','T11','T12'] },
  { id: 'iso',       letter: 'I', label: 'ISO 42001',   duration: 'Semana 24',    tools: ['T13'] },
  { id: 'handover',  letter: '∞', label: 'Continuidad', duration: 'Post-sprint',  tools: [] },
]

const PHASE_ORDER = LEAN_PHASES.map((p) => p.id)

// ── Props ──────────────────────────────────────────────────────
interface PhaseMiniMapProps {
  phaseId:   LeanPhaseId
  toolCode?: string
  dark?:     boolean
}

// ── Componente ─────────────────────────────────────────────────
export function PhaseMiniMap({ phaseId, toolCode, dark = false }: PhaseMiniMapProps) {
  const activeIdx = PHASE_ORDER.indexOf(phaseId)

  return (
    <div
      className="flex items-center gap-0"
      title={`Fase ${activeIdx + 1}/6 — ${LEAN_PHASES[activeIdx]?.label ?? ''}${toolCode ? ` · ${toolCode}` : ''}`}
    >
      {LEAN_PHASES.map((phase, idx) => {
        const isActive  = idx === activeIdx
        const isBefore  = idx < activeIdx

        // ── Estilos por estado ──
        let nodeStyle: React.CSSProperties
        let letterStyle: React.CSSProperties

        if (isActive) {
          nodeStyle = {
            background:  dark ? '#C8860A' : '#2A2822',    // gold en dark, carbón en light
            border:      `1.5px solid ${dark ? '#C8860A' : '#2A2822'}`,
            boxShadow:   dark
              ? '0 0 0 2px rgba(200, 134, 10, 0.25)'
              : '0 0 0 2px rgba(42, 40, 34, 0.15)',
          }
          letterStyle = { color: dark ? '#1C1A16' : '#ffffff', fontWeight: 700 }
        } else if (isBefore) {
          nodeStyle = {
            background:  dark ? 'rgba(196,192,184,0.18)' : 'rgba(42,40,34,0.12)',
            border:      `1.5px solid ${dark ? 'rgba(196,192,184,0.35)' : 'rgba(42,40,34,0.25)'}`,
          }
          letterStyle = { color: dark ? 'rgba(196,192,184,0.7)' : 'rgba(42,40,34,0.55)', fontWeight: 600 }
        } else {
          // upcoming (idx > activeIdx)
          nodeStyle = {
            background:  dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border:      `1.5px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
          }
          letterStyle = { color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.22)', fontWeight: 400 }
        }

        return (
          <div key={phase.id} className="flex items-center">
            {/* ── Nodo de fase ── */}
            <div
              style={{
                width:         18,
                height:        18,
                borderRadius:  5,
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                flexShrink:    0,
                transition:    'all 0.15s ease',
                ...nodeStyle,
              }}
              title={`${phase.label} · ${phase.duration}${phase.tools.length ? ' · ' + phase.tools.join(', ') : ''}`}
            >
              <span
                style={{
                  fontSize:      9,
                  lineHeight:    1,
                  letterSpacing: phase.letter === '∞' ? 0 : '0.02em',
                  userSelect:    'none',
                  ...letterStyle,
                }}
              >
                {phase.letter}
              </span>
            </div>

            {/* ── Línea conectora (excepto después del último) ── */}
            {idx < LEAN_PHASES.length - 1 && (
              <div
                style={{
                  width:      10,
                  height:     1.5,
                  background: isBefore
                    ? (dark ? 'rgba(155,181,217,0.3)' : 'rgba(27,42,78,0.2)')
                    : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
