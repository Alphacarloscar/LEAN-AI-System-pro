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

      <div className="px-5 py-4 space-y-5">

        {/* Descripción del arquetipo */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
            Perfil — {cfg.label}
          </p>
          <p className="text-xs text-text-muted leading-relaxed">{cfg.description}</p>
          <p className="text-[11px] italic text-text-subtle mt-1">"{cfg.tagline}"</p>
        </div>

        {/* Scores de entrevista */}
        {stakeholder.interview && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
              Scores de entrevista
            </p>
            <div className="space-y-1.5">
              {[
                { label: 'Adopción IA',  value: stakeholder.interview.adoptionScore,  color: 'bg-success-dark' },
                { label: 'Influencia',   value: stakeholder.interview.influenceScore, color: 'bg-navy' },
                { label: 'Apertura',     value: stakeholder.interview.opennessScore,  color: 'bg-info-dark' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] text-text-subtle w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${(value / 4) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-text-muted tabular-nums w-6 text-right">
                    {value.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intervenciones recomendadas */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
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
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
              Notas de sesión
            </p>
            <p className="text-xs text-text-muted leading-relaxed italic bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
              {stakeholder.notes}
            </p>
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

      {/* Departamentos */}
      {Array.from(departments.entries()).map(([dept, members]) => {
        return (
          <div key={dept} className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">

            {/* Header departamento */}
            <div className="px-5 py-3 border-b border-border bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">{dept}</p>
                <span className="text-[10px] text-text-subtle">{members.length} persona{members.length > 1 ? 's' : ''}</span>
              </div>
              {/* Mini-leyenda de arquetipos en este dpto */}
              <div className="flex gap-1">
                {members.map((s) => (
                  <ArchetypeDot key={s.id} archetype={s.archetype} />
                ))}
              </div>
            </div>

            {/* Filas de stakeholders */}
            <div className="divide-y divide-border/50">
              {members.map((s) => {
                const isActive  = s.id === activeId
                const isRisk    = s.resistance === 'alta' && (s.archetype === 'critico' || s.archetype === 'decisor')
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
                    {/* Dot arquetipo */}
                    <ArchetypeDot archetype={s.archetype} size="md" />

                    {/* Nombre + cargo */}
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

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ArchetypeBadge archetype={s.archetype} />
                      <ResistanceBadge resistance={s.resistance} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
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

            {/* Matrix por departamento */}
            <DepartmentMatrix
              stakeholders={stakeholders}
              activeId={activeStakeholder?.id ?? null}
              onSelect={setActiveStakeholder}
            />
          </div>

          {/* Columna derecha: panel sticky */}
          <div className="w-80 shrink-0 sticky top-20">
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
