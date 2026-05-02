// ============================================================
// T2 — AI Stakeholder Matrix
//
// Layout: header sticky + two-column (matrix izq | panel der)
//
// Columna izquierda: stakeholders agrupados por departamento.
//   Cada departamento muestra chips de arquetipo y badges
//   de resistencia. Click en stakeholder → activa panel.
//
// Columna derecha (sticky): detalle del stakeholder activo.
//   Arquetipo + resistencia + scores + intervenciones.
//
// Sprint 2 MVP: datos en Zustand (persist local).
// Sprint 3+: leer/escribir desde Supabase.
// ============================================================

import { useState, useMemo }             from 'react'
import { useNavigate }                   from 'react-router-dom'
import { useT2Store }                    from './store'
import { ARCHETYPE_CONFIG, RESISTANCE_CONFIG } from './constants'
import { InterviewModal }                from './components/InterviewModal'
import { StakeholderQuadrantChart }      from './components/StakeholderQuadrantChart'
import type { Stakeholder, ArchetypeCode, ResistanceLevel } from './types'
import { PhaseMiniMap }                  from '@/shared/components/PhaseMiniMap'

// Colores hex por arquetipo (para SVG — mirrors StakeholderQuadrantChart)
const ARCH_HEX: Record<ArchetypeCode, string> = {
  adoptador:    '#5FAF8A',
  ambassador:   '#6A90C0',
  decisor:      '#1B2A4E',
  critico:      '#C06060',
  especialista: '#D4A85C',
}

const ARCH_ORDER: ArchetypeCode[] = ['decisor', 'ambassador', 'adoptador', 'critico', 'especialista']

// ── Utilidades de UI ──────────────────────────────────────────

function ArchetypeDot({ archetype, size = 'sm' }: { archetype: ArchetypeCode; size?: 'sm' | 'md' }) {
  const cfg = ARCHETYPE_CONFIG[archetype]
  const s   = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
  return <span className={`${s} rounded-full ${cfg.dotBg} shrink-0`} />
}

function ArchetypeBadge({ archetype }: { archetype: ArchetypeCode }) {
  const cfg = ARCHETYPE_CONFIG[archetype]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {cfg.label}
    </span>
  )
}

function ResistanceBadge({ resistance }: { resistance: ResistanceLevel }) {
  const cfg = RESISTANCE_CONFIG[resistance]
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      {resistance === 'alta' ? '▲ ' : resistance === 'media' ? '◆ ' : '● '}
      {resistance.charAt(0).toUpperCase() + resistance.slice(1)}
    </span>
  )
}

// ── Barras metálicas horizontales (scores) ────────────────────
// Inspiración: líneas ultra-finas con gradiente metálico y brillo sutil.
// No Excel: sin rellenos planos, sin bordes, solo luz y sombra.

const SCORE_BARS_META = [
  { key: 'ad',  label: 'ADOPCIÓN IA', hex: '#5FAF8A', light: '#B4E4CF' },
  { key: 'inf', label: 'INFLUENCIA',  hex: '#6A90C0', light: '#B8D0E8' },
  { key: 'ap',  label: 'APERTURA',    hex: '#9AAEC8', light: '#C8DAE8' },
] as const

function MetallicScoreBars({
  adoptionScore,
  influenceScore,
  opennessScore,
  trackWidth = 88,
}: {
  adoptionScore:  number
  influenceScore: number
  opennessScore:  number
  trackWidth?:    number
}) {
  const MAX      = 4
  const LBL_W    = 76    // label column — ampliado para fuente mayor
  const G1       = 10    // gutter label→track
  const TRACK_W  = trackWidth
  const G2       = 8     // gutter track→value
  const VAL_COL  = 32    // value text area
  const VBW      = LBL_W + G1 + TRACK_W + G2 + VAL_COL
  const TX       = LBL_W + G1   // track origin x
  const ROW_H    = 52    // más espacio por fila
  const VBH      = SCORE_BARS_META.length * ROW_H + 8

  const values = [adoptionScore, influenceScore, opennessScore]

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {SCORE_BARS_META.map(({ key, hex, light }, i) => {
          const fillW = Math.max((values[i] / MAX) * TRACK_W, 2)
          return (
            <linearGradient
              key={key}
              id={`mb-${key}`}
              x1={TX} y1="0" x2={TX + fillW} y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%"   stopColor={hex}   stopOpacity="0.15" />
              <stop offset="30%"  stopColor={hex}   stopOpacity="0.92" />
              <stop offset="58%"  stopColor={light} stopOpacity="1" />
              <stop offset="85%"  stopColor={hex}   stopOpacity="0.80" />
              <stop offset="100%" stopColor={hex}   stopOpacity="0.40" />
            </linearGradient>
          )
        })}
      </defs>

      {SCORE_BARS_META.map(({ key, label, hex, light }, i) => {
        const val   = values[i]
        const fillW = Math.max((val / MAX) * TRACK_W, 2)
        const cy    = i * ROW_H + ROW_H / 2 + 3

        return (
          <g key={key}>
            {/* Label */}
            <text x={0} y={cy + 4} fontSize={10} fill="#64748B"
              fontFamily="ui-monospace,monospace" letterSpacing="0.04em" fontWeight="600">
              {label}
            </text>

            {/* Track guide — barely visible */}
            <rect x={TX} y={cy - 0.4} width={TRACK_W} height={0.8}
              fill={hex} opacity={0.08} rx={0.4} />

            {/* Glow halo — wider and softer */}
            <rect x={TX} y={cy - 3} width={fillW} height={6}
              fill={hex} opacity={0.10} rx={3} />
            <rect x={TX} y={cy - 1.5} width={fillW} height={3}
              fill={hex} opacity={0.10} rx={1.5} />

            {/* Main metallic bar — 3px */}
            <rect x={TX} y={cy - 1.5} width={fillW} height={3}
              fill={`url(#mb-${key})`} rx={1.5} />

            {/* Top shine — hairline */}
            <rect x={TX + fillW * 0.08} y={cy - 2}
              width={fillW * 0.45} height={0.7}
              fill={light} opacity={0.60} rx={0.35} />

            {/* Value */}
            <text
              x={TX + TRACK_W + G2} y={cy + 4}
              fontSize={11} fontWeight="600" fill="#94A3B8"
              fontFamily="ui-monospace,monospace"
            >
              {val.toFixed(1)}<tspan fontSize={8} opacity={0.5}>/4</tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Mini mapa de posición (cuadrante) ─────────────────────────
// Muestra al stakeholder como punto en el espacio adopción × influencia.
// Orientación espacial instantánea sin palabras.

function MiniPositionMap({
  adoptionScore,
  influenceScore,
  archetype,
  size = 56,
}: {
  adoptionScore:  number
  influenceScore: number
  archetype:      ArchetypeCode
  size?:          number
}) {
  const S   = size
  const P   = Math.round(S * 0.12)   // padding scales with size
  const IN  = S - P * 2

  const dx  = P + (adoptionScore  / 4) * IN
  const dy  = P + (1 - influenceScore / 4) * IN
  const hex = ARCH_HEX[archetype]
  const MID = P + IN / 2

  // Scale-dependent sizes
  const dotR    = S * 0.040
  const glow1R  = S * 0.110
  const glow2R  = S * 0.065
  const lblSize = Math.max(S * 0.080, 5)
  const strokeW = Math.max(S * 0.006, 0.35)

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} style={{ display: 'block' }}>
      {/* Quadrant fills — more visible at larger sizes */}
      <rect x={P}       y={P}       width={IN/2-0.5} height={IN/2-0.5} fill="#C06060" opacity={0.07} rx={1} />
      <rect x={MID+0.5} y={P}       width={IN/2-0.5} height={IN/2-0.5} fill="#1B2A4E" opacity={0.07} rx={1} />
      <rect x={P}       y={MID+0.5} width={IN/2-0.5} height={IN/2-0.5} fill="#D4A85C" opacity={0.07} rx={1} />
      <rect x={MID+0.5} y={MID+0.5} width={IN/2-0.5} height={IN/2-0.5} fill="#5FAF8A" opacity={0.07} rx={1} />
      {/* Grid border */}
      <rect x={P} y={P} width={IN} height={IN} fill="none" stroke="#E2E8F0" strokeWidth={0.5} rx={2} />
      {/* Crosshair */}
      <line x1={MID} y1={P}   x2={MID} y2={P+IN} stroke="#94A3B8" strokeWidth={strokeW} opacity={0.22} />
      <line x1={P}   y1={MID} x2={P+IN} y2={MID} stroke="#94A3B8" strokeWidth={strokeW} opacity={0.22} />
      {/* Axis labels */}
      <text x={MID} y={S - P * 0.3} textAnchor="middle" fontSize={lblSize}
        fill="#94A3B8" fontFamily="ui-monospace,monospace">adopción</text>
      <text x={P * 0.35} y={MID + 1} textAnchor="middle" fontSize={lblSize}
        fill="#94A3B8" fontFamily="ui-monospace,monospace"
        transform={`rotate(-90,${P * 0.35},${MID})`}>influencia</text>
      {/* Glow halos */}
      <circle cx={dx} cy={dy} r={glow1R} fill={hex} opacity={0.08} />
      <circle cx={dx} cy={dy} r={glow2R} fill={hex} opacity={0.20} />
      {/* Main dot */}
      <circle cx={dx} cy={dy} r={dotR} fill={hex} opacity={0.92} />
      {/* Shine */}
      <ellipse cx={dx - dotR * 0.32} cy={dy - dotR * 0.32}
        rx={dotR * 0.38} ry={dotR * 0.24}
        fill="rgba(255,255,255,0.60)" />
    </svg>
  )
}

// ── Panel derecho: detalle de stakeholder ─────────────────────

function StakeholderPanel({
  stakeholder,
  onClose,
}: {
  stakeholder: Stakeholder
  onClose:     () => void
}) {
  const cfg = ARCHETYPE_CONFIG[stakeholder.archetype]
  const res = RESISTANCE_CONFIG[stakeholder.resistance]
  const interventions = cfg.interventions[stakeholder.resistance]

  const isHighRisk =
    (stakeholder.archetype === 'critico' || stakeholder.archetype === 'decisor') &&
    stakeholder.resistance === 'alta'

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">

      {/* ── HEADER: identidad izquierda | notas derecha ── */}
      <div className={`border-b border-border ${isHighRisk ? 'bg-danger-light dark:bg-danger-dark/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
        <div className="flex divide-x divide-border/40">

          {/* Identidad */}
          <div className="flex-1 min-w-0 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-lean-black dark:text-gray-100 truncate">
                  {stakeholder.name}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{stakeholder.role}</p>
                <p className="text-[10px] text-text-subtle mt-0.5">{stakeholder.department}</p>
              </div>
              <button
                onClick={onClose}
                className="h-6 w-6 rounded-md flex items-center justify-center text-text-subtle hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
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
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-text-subtle">
                  Ajuste manual
                </span>
              )}
            </div>
          </div>

          {/* Notas de sesión — en el header, columna derecha */}
          {stakeholder.notes && (
            <div className="w-[168px] shrink-0 px-3 py-3">
              <p className="text-[8px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
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
            <p className="text-[8px] font-mono uppercase tracking-widest text-lean-black dark:text-gray-200 mb-1">
              Perfil — {cfg.label}
            </p>
            <p className="text-[10px] text-text-muted leading-relaxed">{cfg.description}</p>
            <p className="text-[9px] italic text-text-subtle mt-1">"{cfg.tagline}"</p>
          </div>

          {/* Mapa de posición — protagonista visual a ancho completo */}
          {stakeholder.interview ? (
            <div className="flex justify-center mt-1">
              <MiniPositionMap
                adoptionScore={stakeholder.interview.adoptionScore}
                influenceScore={stakeholder.interview.influenceScore}
                archetype={stakeholder.archetype}
                size={160}
              /></div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-1 opacity-35 py-6">
              <svg className="h-8 w-8 text-text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-[9px] text-text-subtle text-center leading-snug">Sin entrevista</p>
            </div>
          )}
        </div>

        {/* RIGHT — intervenciones */}
        <div className="flex-1 min-w-0 px-4 py-4">
          <p className="text-[8px] font-mono font-bold uppercase tracking-widest text-lean-black dark:text-gray-200 mb-3">
            Intervenciones · {res.label}
          </p>
          <ol className="space-y-3">
            {interventions.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="flex-shrink-0 h-[15px] w-[15px] rounded-full bg-navy text-white text-[8px] font-bold flex items-center justify-center mt-0.5">
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
          <p className="text-[8px] font-mono font-bold uppercase tracking-widest text-text-subtle mb-3">
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

// ── Columna izquierda: matrix por departamento ────────────────

function DepartmentMatrix({
  stakeholders,
  activeId,
  onSelect,
}: {
  stakeholders: Stakeholder[]
  activeId:     string | null
  onSelect:     (s: Stakeholder) => void
}) {
  // expandedDepts = set de depts EXPANDIDOS. Por defecto: primer departamento expandido (U-05)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(() => {
    if (stakeholders.length === 0) return new Set<string>()
    return new Set<string>([stakeholders[0].department])
  })

  function toggleDept(dept: string) {
    setExpandedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept)
      else next.add(dept)
      return next
    })
  }

  // Agrupar por departamento
  const departments = useMemo(() => {
    const map = new Map<string, Stakeholder[]>()
    stakeholders.forEach((s) => {
      if (!map.has(s.department)) map.set(s.department, [])
      map.get(s.department)!.push(s)
    })
    return map
  }, [stakeholders])

  if (stakeholders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <p className="text-sm font-medium text-lean-black dark:text-gray-200">Sin stakeholders registrados</p>
        <p className="text-xs text-text-subtle mt-1">Usa el botón "Nueva entrevista" para añadir el primero.</p>
      </div>
    )
  }

  // Resumen de distribución de arquetipos
  const archetypeCounts = useMemo(() => {
    const counts: Partial<Record<ArchetypeCode, number>> = {}
    stakeholders.forEach((s) => { counts[s.archetype] = (counts[s.archetype] ?? 0) + 1 })
    return counts
  }, [stakeholders])

  const highRiskCount = stakeholders.filter(
    (s) => s.resistance === 'alta' && (s.archetype === 'critico' || s.archetype === 'decisor')
  ).length

  return (
    <div className="space-y-6">

      {/* Resumen global */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-900 px-5 py-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            Distribución de arquetipos
          </p>
          <span className="text-[10px] font-mono text-text-subtle">
            {stakeholders.length} stakeholders · {departments.size} departamentos
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(archetypeCounts) as [ArchetypeCode, number][]).map(([code, count]) => {
            const cfg = ARCHETYPE_CONFIG[code]
            return (
              <div key={code} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${cfg.badgeBg} ${cfg.badgeText}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotBg}`} />
                {cfg.label}
                <span className="font-bold">{count}</span>
              </div>
            )
          })}
        </div>
        {highRiskCount > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-danger-light border border-danger-dark/20">
            <svg className="h-3.5 w-3.5 text-danger-dark shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clipRule="evenodd" />
            </svg>
            <p className="text-[11px] text-danger-dark font-medium">
              {highRiskCount} perfil{highRiskCount > 1 ? 'es' : ''} de riesgo alto — acción requerida antes del piloto
            </p>
          </div>
        )}
      </div>

      {/* Departamentos — colapsables */}
      {Array.from(departments.entries()).map(([dept, members]) => {
        const isCollapsed = !expandedDepts.has(dept)
        return (
          <div key={dept} className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">

            {/* Header departamento — clickable para colapsar */}
            <button
              onClick={() => toggleDept(dept)}
              className="w-full px-5 py-3 border-b border-border bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between hover:bg-gray-100/60 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {/* Chevron — apunta derecha cuando colapsado, abajo cuando expandido */}
                <svg
                  className={`h-3 w-3 text-text-subtle transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                  viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M4 2l4 4-4 4" />
                </svg>
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">{dept}</p>
                <span className="text-[10px] text-text-subtle">{members.length} persona{members.length > 1 ? 's' : ''}</span>
              </div>
              {/* Mini-dots de arquetipos */}
              <div className="flex gap-1">
                {members.map((s) => (
                  <ArchetypeDot key={s.id} archetype={s.archetype} />
                ))}
              </div>
            </button>

            {/* Filas de stakeholders — ocultas si colapsado */}
            {!isCollapsed && (
              <div className="divide-y divide-border/50">
                {members.map((s) => {
                  const isActive = s.id === activeId
                  const isRisk   = s.resistance === 'alta' && (s.archetype === 'critico' || s.archetype === 'decisor')
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelect(s)}
                      className={[
                        'w-full flex items-center gap-3 px-5 py-3 text-left transition-all duration-150',
                        isActive
                          ? 'bg-navy/5 dark:bg-navy/10 border-l-2 border-navy'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent',
                      ].join(' ')}
                    >
                      <ArchetypeDot archetype={s.archetype} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-navy dark:text-info-soft' : 'text-lean-black dark:text-gray-200'}`}>
                          {s.name}
                          {isRisk && (
                            <svg className="inline h-3 w-3 text-danger-dark ml-1" viewBox="0 0 16 16" fill="currentColor">
                              <path fillRule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clipRule="evenodd" />
                            </svg>
                          )}
                        </p>
                        <p className="text-[11px] text-text-subtle truncate">{s.role}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ArchetypeBadge archetype={s.archetype} />
                        <ResistanceBadge resistance={s.resistance} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Gráfico resumen por departamento ─────────────────────────

function DepartmentOverviewChart({ stakeholders }: { stakeholders: Stakeholder[] }) {
  const deptData = useMemo(() => {
    const map = new Map<string, Stakeholder[]>()
    stakeholders.forEach((s) => {
      if (!map.has(s.department)) map.set(s.department, [])
      map.get(s.department)!.push(s)
    })
    return Array.from(map.entries())
      .map(([dept, members]) => ({
        dept,
        total: members.length,
        // Riesgo = crítico + alta resistencia en cualquier arquetipo
        riskScore: members.filter(
          (m) => m.archetype === 'critico' || m.resistance === 'alta'
        ).length,
        segments: ARCH_ORDER
          .map((arch) => ({ arch, count: members.filter((m) => m.archetype === arch).length }))
          .filter((seg) => seg.count > 0),
      }))
      // Ordenar: mayor concentración de riesgo primero
      .sort((a, b) => b.riskScore - a.riskScore || b.total - a.total)
  }, [stakeholders])

  if (deptData.length === 0) return null

  const maxCount = Math.max(...deptData.map((d) => d.total), 1)

  // Barras metálicas — pilares verticales más anchos y altos para mayor legibilidad
  const BW    = 16   // bar width — wider for visibility
  const GAP   = 34   // generous gap for spatial feel
  const LM    = 32   // left margin (y-axis)
  const RM    = 8    // right margin
  const CH    = 140  // chart area height — taller
  const TM    = 22   // top margin (value labels)
  const LH    = 42   // bottom label height — more space for larger text
  const VBW   = LM + deptData.length * (BW + GAP) - GAP + RM
  const VBH   = TM + CH + LH

  const yTicks = Array.from({ length: maxCount + 1 }, (_, i) => i)

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900 px-5 py-4">
      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-subtle mb-3">
        Composición por departamento
      </p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VBW} ${VBH}`}
          width={Math.max(VBW, 240)}
          height={VBH}
          style={{ minWidth: VBW, overflow: 'visible' }}
        >
          <defs>
            {/* Metallic shine overlay — applied via clip per segment */}
            {ARCH_ORDER.map((arch) => {
              const hex = ARCH_HEX[arch]
              return (
                <linearGradient key={arch} id={`dmc-${arch}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor={hex}  stopOpacity="0.55" />
                  <stop offset="35%"  stopColor={hex}  stopOpacity="0.95" />
                  <stop offset="60%"  stopColor="white" stopOpacity="0.18" />
                  <stop offset="100%" stopColor={hex}  stopOpacity="0.65" />
                </linearGradient>
              )
            })}
          </defs>

          {/* Y-axis hairline */}
          <line x1={LM} y1={TM} x2={LM} y2={TM + CH} stroke="#E2E8F0" strokeWidth={0.5} />

          {/* Y-axis ticks + horizontal grid guides */}
          {yTicks.map((tick) => {
            const ty = TM + CH - (tick / maxCount) * CH
            return (
              <g key={tick}>
                <line x1={LM} y1={ty} x2={VBW - RM} y2={ty}
                  stroke="#F1F5F9" strokeWidth={0.5} strokeDasharray="2 3" />
                <text x={LM - 6} y={ty + 3} textAnchor="end" fontSize={9} fill="#CBD5E1"
                  fontFamily="ui-monospace,monospace">{tick}</text>
              </g>
            )
          })}

          {/* Pilares por departamento */}
          {deptData.map(({ dept, total, segments, riskScore }, i) => {
            const bx = LM + i * (BW + GAP)
            let curY = TM + CH
            const rects = segments.map(({ arch, count }) => {
              const segH = Math.max((count / maxCount) * CH, 1)
              const rectY = curY - segH
              curY = rectY
              return { arch, count, segH, rectY }
            })
            const topY    = rects[0]?.rectY ?? TM + CH
            const topArch = rects[0]?.arch
            const isRisk  = riskScore > 0

            return (
              <g key={dept}>
                {/* Subtle glow behind pilar if risk dept */}
                {isRisk && (
                  <rect x={bx - 3} y={topY - 2} width={BW + 6} height={TM + CH - topY + 2}
                    fill="#C06060" opacity={0.06} rx={3} />
                )}

                {/* Stacked metallic segments */}
                {rects.map(({ arch, segH, rectY }, ri) => (
                  <g key={arch}>
                    {/* Base color */}
                    <rect x={bx} y={rectY} width={BW} height={segH}
                      fill={ARCH_HEX[arch]} opacity={0.82}
                      rx={ri === 0 ? 2 : 0}
                    />
                    {/* Metallic shine overlay */}
                    <rect x={bx} y={rectY} width={BW} height={segH}
                      fill={`url(#dmc-${arch})`}
                      rx={ri === 0 ? 2 : 0}
                      style={{ mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'] }}
                    />
                    {/* Segment separator (thin gap between stack layers) */}
                    {ri < rects.length - 1 && (
                      <line x1={bx} y1={rectY + segH} x2={bx + BW} y2={rectY + segH}
                        stroke="white" strokeWidth={0.8} opacity={0.4} />
                    )}
                  </g>
                ))}

                {/* Top shine hairline */}
                {topArch && (
                  <rect x={bx + 1} y={topY} width={BW - 2} height={0.6}
                    fill="white" opacity={0.35} rx={0.3} />
                )}

                {/* Total count label */}
                <text x={bx + BW / 2} y={topY - 6}
                  textAnchor="middle" fontSize={10} fontWeight="700"
                  fill={isRisk ? '#C06060' : '#64748B'}
                  fontFamily="ui-monospace,monospace"
                >
                  {total}
                </text>

                {/* Department label — two lines with larger font */}
                {(() => {
                  const words = dept.split(/[\s/]+/)
                  const mid   = Math.ceil(words.length / 2)
                  const line1 = words.slice(0, mid).join(' ')
                  const line2 = words.slice(mid).join(' ')
                  return (
                    <>
                      <text x={bx + BW / 2} y={TM + CH + 16}
                        textAnchor="middle" fontSize={10}
                        fill={isRisk ? '#C06060' : '#64748B'} fontFamily="ui-sans-serif,sans-serif">
                        {line1}
                      </text>
                      {line2 && (
                        <text x={bx + BW / 2} y={TM + CH + 29}
                          textAnchor="middle" fontSize={10}
                          fill={isRisk ? '#C06060' : '#64748B'} fontFamily="ui-sans-serif,sans-serif">
                          {line2}
                        </text>
                      )}
                    </>
                  )
                })()}
                {/* Risk dot under label if dept tiene riesgo */}
                {isRisk && (
                  <circle cx={bx + BW / 2} cy={TM + CH + 36} r={2}
                    fill="#C06060" opacity={0.7} />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Archetype legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
        {ARCH_ORDER.map((arch) => {
          const count = stakeholders.filter((s) => s.archetype === arch).length
          if (count === 0) return null
          const cfg = ARCHETYPE_CONFIG[arch]
          return (
            <div key={arch} className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-3.5 rounded-sm inline-block shrink-0"
                style={{ backgroundColor: ARCH_HEX[arch] }}
              />
              <span className="text-[9px] text-text-subtle">{cfg.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────

interface T2ViewProps {
  companyName: string
  onBack:      () => void
}

export function T2View({ companyName, onBack }: T2ViewProps) {
  const { stakeholders, addStakeholder } = useT2Store()
  const navigate = useNavigate()

  // Pre-seleccionar primer stakeholder al cargar (U-12 — demo flow)
  const [activeStakeholder, setActiveStakeholder] = useState<Stakeholder | null>(
    () => stakeholders[0] ?? null
  )
  const [showModal,         setShowModal]         = useState(false)

  const existingDepartments = useMemo(
    () => [...new Set(stakeholders.map((s) => s.department))],
    [stakeholders]
  )

  function handleAddStakeholder(s: Omit<Stakeholder, 'id' | 'createdAt'>) {
    addStakeholder(s)
    setShowModal(false)
    // Seleccionar el recién añadido (último en la lista)
    // Hacemos un pequeño delay para que el store se actualice
    setTimeout(() => {
      const latest = useT2Store.getState().stakeholders.at(-1)
      if (latest) setActiveStakeholder(latest)
    }, 50)
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-border px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">

          <button
            onClick={() => { onBack(); navigate('/') }}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-lean-black dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Volver al dashboard
          </button>

          <span className="text-text-subtle">·</span>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[10px] font-mono font-semibold text-navy dark:text-info-soft uppercase tracking-wider">
              T2
            </span>
            <h1 className="text-sm font-semibold text-lean-black dark:text-gray-100 truncate">
              AI Stakeholder Matrix
            </h1>
            <PhaseMiniMap phaseId="listen" toolCode="T2" />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy-metallic text-white text-xs font-semibold hover:bg-navy-metallic-hover shadow-sm active:scale-[0.98] transition-all duration-150 shrink-0"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v12M2 8h12" />
            </svg>
            Nueva entrevista
          </button>
        </div>
      </div>

      {/* ── Subheader: empresa ── */}
      <div className="max-w-6xl mx-auto px-8 pt-5 pb-1">
        <p className="text-sm font-semibold text-lean-black dark:text-gray-100">{companyName}</p>
        <p className="text-xs text-text-subtle mt-0.5">
          Haz clic en un stakeholder para ver su perfil y las intervenciones recomendadas.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="max-w-6xl mx-auto px-8 py-5">
        <div className="flex gap-6 items-start">

          {/* Columna izquierda: gráfico + matrix */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Mapa de cuadrantes */}
            <StakeholderQuadrantChart
              stakeholders={stakeholders}
              activeId={activeStakeholder?.id ?? null}
              onSelect={setActiveStakeholder}
            />

            {/* Gráfico de composición por departamento */}
            {stakeholders.length > 0 && (
              <DepartmentOverviewChart stakeholders={stakeholders} />
            )}

            {/* Matrix por departamento */}
            <DepartmentMatrix
              stakeholders={stakeholders}
              activeId={activeStakeholder?.id ?? null}
              onSelect={setActiveStakeholder}
            />
          </div>

          {/* Columna derecha: panel sticky */}
          <div className="w-96 shrink-0 sticky top-20">
            {activeStakeholder ? (
              <StakeholderPanel
                stakeholder={activeStakeholder}
                onClose={() => setActiveStakeholder(null)}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-white/50 dark:bg-gray-900/50 p-6 flex flex-col items-center justify-center text-center gap-2 min-h-[200px]">
                <svg className="h-8 w-8 text-text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
                <p className="text-xs text-text-subtle">Selecciona un stakeholder para ver su perfil e intervenciones</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Modal nueva entrevista ── */}
      {showModal && (
        <InterviewModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddStakeholder}
          existingDepartments={existingDepartments}
        />
      )}
    </div>
  )
}
