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

// ── Gráfico vertical de scores ────────────────────────────────

function ScoreBarChart({
  adoptionScore,
  influenceScore,
  opennessScore,
}: {
  adoptionScore:  number
  influenceScore: number
  opennessScore:  number
}) {
  const MAX  = 4
  const BW   = 15   // bar width
  const GAP  = 9    // gap between bars
  const LM   = 16   // left margin (for y-axis ticks)
  const CH   = 70   // chart height
  const TM   = 16   // top margin (for value labels)
  const LH   = 20   // label height at bottom
  const VBW  = LM + 3 * (BW + GAP) - GAP + 4
  const VBH  = TM + CH + LH

  const bars = [
    { key: 'ad',  label: 'Ad.',  value: adoptionScore,  color: '#5FAF8A' },
    { key: 'inf', label: 'Inf.', value: influenceScore, color: '#1B2A4E' },
    { key: 'ap',  label: 'Ap.',  value: opennessScore,  color: '#6A90C0' },
  ]

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} width={VBW} height={VBH}>
      {/* Baseline */}
      <line x1={LM} y1={TM + CH} x2={VBW - 2} y2={TM + CH} stroke="#E2E8F0" strokeWidth={0.8} />
      {/* Y-axis ticks at 1,2,3,4 */}
      {[1, 2, 3, 4].map((tick) => {
        const ty = TM + CH - (tick / MAX) * CH
        return (
          <g key={tick}>
            <line x1={LM - 3} y1={ty} x2={LM} y2={ty} stroke="#E2E8F0" strokeWidth={0.6} />
            <text x={LM - 5} y={ty + 2.5} textAnchor="end" fontSize={6} fill="#CBD5E1"
              fontFamily="ui-monospace,monospace">{tick}</text>
          </g>
        )
      })}
      {/* Bars */}
      {bars.map(({ key, label, value, color }, i) => {
        const bx  = LM + i * (BW + GAP)
        const bh  = (value / MAX) * CH
        const by  = TM + CH - bh
        return (
          <g key={key}>
            <rect x={bx} y={by} width={BW} height={bh} fill={color} opacity={0.88} rx={2} />
            {/* Value above bar */}
            <text x={bx + BW / 2} y={by - 3} textAnchor="middle" fontSize={7} fontWeight="700"
              fill="#475569" fontFamily="ui-monospace,monospace">
              {value.toFixed(1)}
            </text>
            {/* Short label below baseline */}
            <text x={bx + BW / 2} y={TM + CH + 12} textAnchor="middle" fontSize={6.5}
              fill="#94A3B8" fontFamily="ui-monospace,monospace">
              {label}
            </text>
          </g>
        )
      })}
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

      {/* Header del panel */}
      <div className={`px-5 py-4 border-b border-border ${isHighRisk ? 'bg-danger-light dark:bg-danger-dark/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
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

        {/* Alerta riesgo alto */}
        {isHighRisk && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-danger-light border border-danger-dark/20">
            <svg className="h-3.5 w-3.5 text-danger-dark mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clipRule="evenodd" />
            </svg>
            <p className="text-[11px] text-danger-dark font-medium">
              Perfil de riesgo alto — requiere intervención prioritaria antes del piloto.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <ArchetypeBadge archetype={stakeholder.archetype} />
          <ResistanceBadge resistance={stakeholder.resistance} />
          {stakeholder.manualOverride && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-text-subtle">
              Ajuste manual
            </span>
          )}
        </div>
      </div>

      {/* Body: split izquierda (info) | derecha (score bars) */}
      <div className="flex divide-x divide-border/40">

        {/* LEFT — arquetipo + intervenciones + notas */}
        <div className="flex-1 min-w-0 px-5 py-4 space-y-5">

          {/* Descripción del arquetipo */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-lean-black dark:text-gray-200 mb-1.5">
              Perfil — {cfg.label}
            </p>
            <p className="text-xs text-text-muted leading-relaxed">{cfg.description}</p>
            <p className="text-[11px] italic text-text-subtle mt-1">"{cfg.tagline}"</p>
          </div>

          {/* Intervenciones recomendadas */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-lean-black dark:text-gray-200 mb-2">
              Intervenciones recomendadas · {res.label}
            </p>
            <ol className="space-y-2">
              {interventions.map((item, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex-shrink-0 h-4 w-4 rounded-full bg-navy text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-text-muted leading-relaxed">{item}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Notas */}
          {stakeholder.notes && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-lean-black dark:text-gray-200 mb-1.5">
                Notas de sesión
              </p>
              <p className="text-xs text-text-muted leading-relaxed italic bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                {stakeholder.notes}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — gráfico vertical de scores */}
        {stakeholder.interview && (
          <div className="w-[84px] shrink-0 flex flex-col items-center justify-center py-4 px-1 gap-1">
            <p className="text-[8px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">
              Scores
            </p>
            <ScoreBarChart
              adoptionScore={stakeholder.interview.adoptionScore}
              influenceScore={stakeholder.interview.influenceScore}
              opennessScore={stakeholder.interview.opennessScore}
            />
          </div>
        )}
      </div>
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
  // expandedDepts = set de depts EXPANDIDOS (vacío por defecto → todos colapsados)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())

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

  const BW    = 38   // bar width
  const GAP   = 16   // gap between bars
  const LM    = 28   // left margin (y-axis)
  const RM    = 10   // right margin
  const CH    = 110  // chart area height
  const TM    = 16   // top margin (space for value labels)
  const LH    = 28   // bottom label height
  const VBW   = LM + deptData.length * (BW + GAP) - GAP + RM
  const VBH   = TM + CH + LH

  const yTicks = Array.from({ length: maxCount + 1 }, (_, i) => i)

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-gray-900 px-5 py-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
        Composición por departamento
      </p>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VBW} ${VBH}`}
          width={Math.max(VBW, 260)}
          height={VBH}
          style={{ minWidth: VBW }}
        >
          {/* Y-axis line */}
          <line x1={LM} y1={TM} x2={LM} y2={TM + CH} stroke="#E2E8F0" strokeWidth={0.8} />

          {/* Y-axis ticks */}
          {yTicks.map((tick) => {
            const ty = TM + CH - (tick / maxCount) * CH
            return (
              <g key={tick}>
                <line x1={LM - 3} y1={ty} x2={LM + VBW - LM - RM} y2={ty}
                  stroke="#F1F5F9" strokeWidth={0.6} />
                <line x1={LM - 4} y1={ty} x2={LM} y2={ty} stroke="#CBD5E1" strokeWidth={0.7} />
                <text x={LM - 6} y={ty + 2.5} textAnchor="end" fontSize={7} fill="#94A3B8"
                  fontFamily="ui-monospace,monospace">{tick}</text>
              </g>
            )
          })}

          {/* Bars per department */}
          {deptData.map(({ dept, total, segments }, i) => {
            const bx = LM + i * (BW + GAP)
            // Compute stacked segment rects (bottom → top)
            let curY = TM + CH
            const rects = segments.map(({ arch, count }) => {
              const segH = (count / maxCount) * CH
              const rectY = curY - segH
              curY = rectY
              return { arch, segH, rectY }
            })
            const topY   = rects[0]?.rectY ?? TM + CH
            const topArch = rects[0]?.arch
            const truncDept = dept.length > 8 ? dept.slice(0, 7) + '…' : dept

            return (
              <g key={dept}>
                {/* Stacked color segments */}
                {rects.map(({ arch, segH, rectY }) => (
                  <rect
                    key={arch}
                    x={bx} y={rectY}
                    width={BW} height={segH}
                    fill={ARCH_HEX[arch]}
                    opacity={0.85}
                  />
                ))}
                {/* Rounded top cap */}
                {topArch && (
                  <rect
                    x={bx} y={topY}
                    width={BW} height={Math.min(4, (total / maxCount) * CH)}
                    fill={ARCH_HEX[topArch]}
                    opacity={0.85}
                    rx={2}
                  />
                )}
                {/* Total count label above bar */}
                <text
                  x={bx + BW / 2} y={topY - 4}
                  textAnchor="middle" fontSize={8} fontWeight="700"
                  fill="#475569" fontFamily="ui-monospace,monospace"
                >
                  {total}
                </text>
                {/* Department label below baseline */}
                <text
                  x={bx + BW / 2} y={TM + CH + 14}
                  textAnchor="middle" fontSize={7}
                  fill="#64748B" fontFamily="ui-monospace,monospace"
                >
                  {truncDept}
                </text>
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

  const [activeStakeholder, setActiveStakeholder] = useState<Stakeholder | null>(null)
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
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-text-muted shrink-0">
              Fase Listen · Semanas 1–3
            </span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-[#1a2e44] shadow-sm active:scale-[0.98] transition-all duration-150 shrink-0"
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
