// ============================================================
// T11 — AI Operating Rhythm
//
// Centro de operaciones: cadencia SAFe-adaptada, objetivos por
// fase, matriz de decisiones, datos a medir.
//
// Sprint 5: lectura de scenario + T6/T12 stores.
// Supabase persistence en Sprint 6.
// ============================================================

import { useState, useMemo }        from 'react'
import { PhaseMiniMap }             from '@/shared/components/PhaseMiniMap'
import { buildOperatingModel }      from './engine'
import { T11_LEVEL_CONFIG, T11_FREQUENCY_LABEL, T11_MATURITY_CONFIG } from './constants'
import type { T11Event, T11Level, T11MaturityTier, T11DecisionNode, T11PhaseObjective, T11KpiGroup } from './types'
import type { RadarDimension }      from '@/shared/components/charts/LeanRadarChart'

// ── Props ─────────────────────────────────────────────────────

interface T11ViewProps {
  companyName: string
  t1Radar:     RadarDimension[]
  employees?:  number
  onBack:      () => void
}

// ── Tipos de tab ──────────────────────────────────────────────

type T11Tab = 'cadencia' | 'objetivos' | 'decisiones' | 'kpis'

const TABS: { id: T11Tab; label: string }[] = [
  { id: 'cadencia',   label: 'Cadencia Operativa' },
  { id: 'objetivos',  label: 'Objetivos por Fase' },
  { id: 'decisiones', label: 'Decisiones y Escalada' },
  { id: 'kpis',       label: 'Datos a Medir' },
]

// ── Sub-componentes ───────────────────────────────────────────

function MaturityPill({ tier, avg }: { tier: T11MaturityTier; avg: number }) {
  const cfg = T11_MATURITY_CONFIG[tier]
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className="h-2 w-5 rounded-sm transition-all"
            style={{
              backgroundColor: s <= cfg.stars ? cfg.hex : '#E5E7EB',
            }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: cfg.hex }}>
        {cfg.label}
      </span>
      <span className="text-[10px] text-text-subtle">({avg.toFixed(1)}/4)</span>
    </div>
  )
}

// ── EventCard ─────────────────────────────────────────────────

function EventCard({ event }: { event: T11Event }) {
  const [expanded, setExpanded] = useState(false)
  const lcfg = T11_LEVEL_CONFIG[event.level]

  return (
    <div className={`rounded-xl border transition-all duration-200 ${lcfg.border} bg-white dark:bg-gray-900`}>

      {/* Header */}
      <button
        className="w-full text-left px-4 py-3.5 flex items-start gap-3"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Frequency badge */}
        <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${lcfg.badge} ${lcfg.badgeText}`}>
          {T11_FREQUENCY_LABEL[event.frequency]}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold text-lean-black dark:text-gray-100 leading-snug">
                  {event.title}
                </p>
                {event.isCritical && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    CRÍTICO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-subtle mt-0.5 leading-snug">{event.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-text-muted font-mono">{event.duration}</span>
              <svg
                className={`h-3 w-3 text-text-subtle transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-text-subtle mt-1">
            <span className="font-medium">Owner:</span> {event.owner}
          </p>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/50 px-4 py-4 space-y-4">

          {/* Participantes */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">Participantes</p>
            <div className="flex flex-wrap gap-1.5">
              {event.participants.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-gray-800 text-text-muted">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Datos de entrada */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">Datos a revisar</p>
            <ul className="space-y-1">
              {event.dataInputs.map((d) => (
                <li key={d} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: lcfg.hex }} />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Agenda tipo */}
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">Agenda tipo</p>
              <ol className="space-y-1 list-decimal list-inside">
                {event.agendaItems.map((a) => (
                  <li key={a} className="text-[11px] text-text-muted leading-snug">{a}</li>
                ))}
              </ol>
            </div>

            {/* KPIs que se revisan */}
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">KPIs que se revisan</p>
              <ul className="space-y-1">
                {event.kpisReviewed.map((k) => (
                  <li key={k} className="flex items-start gap-1.5 text-[11px] text-text-muted">
                    <span className="font-mono text-[10px] shrink-0" style={{ color: lcfg.hex }}>→</span>
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CadenciaTab ───────────────────────────────────────────────

function CadenciaTab({ events }: { events: T11Event[] }) {
  const levels: T11Level[] = ['team', 'program', 'direction']

  return (
    <div className="space-y-8">
      {levels.map((level) => {
        const lvEvents = events.filter((e) => e.level === level)
        if (!lvEvents.length) return null
        const lcfg = T11_LEVEL_CONFIG[level]

        return (
          <div key={level}>
            {/* Level header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
              <div className={`px-3 py-1 rounded-full text-[10px] font-semibold ${lcfg.badge} ${lcfg.badgeText}`}>
                {lcfg.label}
              </div>
              <p className="text-[10px] text-text-subtle">{lcfg.sublabel}</p>
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
            </div>

            {/* Events grid */}
            <div className="grid grid-cols-1 gap-3">
              {lvEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ObjetivosTab ──────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  listen:      '#6A90C0',
  enable:      '#7C3AED',
  accelerate:  '#D4A85C',
  normalize:   '#5FAF8A',
  scale:       '#C8860A',
}

function ObjetivosTab({ objectives }: { objectives: T11PhaseObjective[] }) {
  const [active, setActive] = useState<string>(objectives[0]?.phase ?? 'listen')
  const current = objectives.find((o) => o.phase === active)

  return (
    <div className="space-y-6">
      {/* Phase selector */}
      <div className="flex flex-wrap gap-2">
        {objectives.map((o) => {
          const color = PHASE_COLORS[o.phase]
          const isActive = active === o.phase
          return (
            <button
              key={o.phase}
              onClick={() => setActive(o.phase)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                isActive
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-text-muted border-border hover:border-border-hover'
              }`}
              style={isActive ? { backgroundColor: color, borderColor: color } : {}}
            >
              <span className="font-mono">{o.phaseLabel}</span>
              <span className="ml-2 opacity-70 font-normal">{o.sprintRange}</span>
            </button>
          )
        })}
      </div>

      {current && (
        <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 overflow-hidden">
          {/* Phase header */}
          <div
            className="px-6 py-4"
            style={{ backgroundColor: PHASE_COLORS[current.phase] + '15' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono text-white"
                style={{ backgroundColor: PHASE_COLORS[current.phase] }}
              >
                {current.phaseLabel}
              </span>
              <span className="text-sm font-semibold text-lean-black dark:text-gray-100">
                {current.sprintRange}
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Objetivos */}
            <div className="md:col-span-1">
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Objetivos del periodo
              </p>
              <ol className="space-y-2 list-decimal list-inside">
                {current.objectives.map((obj) => (
                  <li key={obj} className="text-xs text-text-muted leading-relaxed">{obj}</li>
                ))}
              </ol>
            </div>

            {/* Eventos clave */}
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Eventos clave
              </p>
              <ul className="space-y-1.5">
                {current.keyEvents.map((e) => (
                  <li key={e} className="flex items-start gap-2 text-xs text-text-muted">
                    <span
                      className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: PHASE_COLORS[current.phase] }}
                    />
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            {/* Datos necesarios */}
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Datos necesarios
              </p>
              <ul className="space-y-1.5">
                {current.dataNeeded.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-xs text-text-muted">
                    <span className="font-mono text-[10px] shrink-0" style={{ color: PHASE_COLORS[current.phase] }}>→</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── DecisionesTab ─────────────────────────────────────────────

function DecisionCard({ node }: { node: T11DecisionNode }) {
  const lcfg = T11_LEVEL_CONFIG[node.level]

  return (
    <div className={`rounded-xl border ${lcfg.border} bg-white dark:bg-gray-900 overflow-hidden`}>
      {/* Trigger */}
      <div className={`px-4 py-3 ${lcfg.bg}`}>
        <div className="flex items-start gap-2">
          <span className={`text-[9px] font-mono font-bold shrink-0 mt-0.5 ${lcfg.badgeText}`}>
            TRIGGER
          </span>
          <p className="text-xs font-semibold text-lean-black dark:text-gray-100 leading-snug">
            {node.trigger}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2.5">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">Decisión</p>
          <p className="text-[11px] text-lean-black dark:text-gray-200">{node.decision}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">Owner</p>
            <p className="text-[11px] text-text-muted">{node.owner}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">Valida</p>
            <p className="text-[11px] text-text-muted">{node.validator}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">Escala a</p>
            <p className="text-[11px] text-text-muted">{node.escalateTo}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <svg className="h-3 w-3 text-text-subtle shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5l2 1.5" />
          </svg>
          <p className="text-[10px] text-text-subtle">Plazo: <span className="font-medium text-text-muted">{node.timeline}</span></p>
        </div>
      </div>
    </div>
  )
}

function DecisionesTab({ decisions }: { decisions: T11DecisionNode[] }) {
  const levels: T11Level[] = ['team', 'program', 'direction']

  return (
    <div className="space-y-8">
      {levels.map((level) => {
        const lvDecisions = decisions.filter((d) => d.level === level)
        if (!lvDecisions.length) return null
        const lcfg = T11_LEVEL_CONFIG[level]

        return (
          <div key={level}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
              <div className={`px-3 py-1 rounded-full text-[10px] font-semibold ${lcfg.badge} ${lcfg.badgeText}`}>
                {lcfg.label}
              </div>
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lvDecisions.map((node) => (
                <DecisionCard key={node.id} node={node} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Nota */}
      <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-900/50 px-5 py-4">
        <p className="text-[11px] text-text-subtle leading-relaxed">
          <span className="font-semibold text-text-muted">Nota sobre escalada:</span> Si un decisor no está disponible en el plazo indicado, la decisión escala automáticamente al nivel superior. Ninguna decisión debe quedar bloqueada más de 2× el plazo base.
        </p>
      </div>
    </div>
  )
}

// ── KpisTab ───────────────────────────────────────────────────

function KpisTab({ kpiGroups }: { kpiGroups: T11KpiGroup[] }) {
  return (
    <div className="space-y-8">
      {kpiGroups.map((group) => {
        const lcfg = T11_LEVEL_CONFIG[group.level]

        return (
          <div key={group.level}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
              <div className={`px-3 py-1 rounded-full text-[10px] font-semibold ${lcfg.badge} ${lcfg.badgeText}`}>
                {group.label}
              </div>
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
            </div>

            <div className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">KPI</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle hidden sm:table-cell">Cómo se calcula</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Fuente</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Frecuencia</th>
                  </tr>
                </thead>
                <tbody>
                  {group.kpis.map((kpi, i) => (
                    <tr
                      key={kpi.name}
                      className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-lean-black dark:text-gray-200">{kpi.name}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-[11px] text-text-muted font-mono">{kpi.formula}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold text-white"
                          style={{ backgroundColor: lcfg.hex }}
                        >
                          {kpi.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] text-text-subtle">{kpi.cadence}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Export HTML ───────────────────────────────────────────────

function generateOperatingModelHTML(
  companyName: string,
  model: ReturnType<typeof buildOperatingModel>,
): string {
  const now = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const matCfg = T11_MATURITY_CONFIG[model.maturityTier]

  const eventsHTML = model.recommendedEvents.map((e) => {
    const lcfg = T11_LEVEL_CONFIG[e.level]
    return `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#1a1a1a;">${e.title}</td>
        <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${lcfg.label}</td>
        <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${T11_FREQUENCY_LABEL[e.frequency]}</td>
        <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${e.duration}</td>
        <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${e.owner}</td>
      </tr>
    `
  }).join('')

  const decisionsHTML = model.decisions.map((d) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 12px;font-size:11px;color:#374151;">${d.trigger}</td>
      <td style="padding:10px 12px;font-size:11px;font-weight:600;color:#1a1a1a;">${d.owner}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${d.escalateTo}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${d.timeline}</td>
    </tr>
  `).join('')

  const kpiHTML = model.kpiGroups.map((g) => `
    <h3 style="font-size:13px;font-weight:600;color:#374151;margin:24px 0 12px;">${g.label}</h3>
    ${g.kpis.map((k) => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid #f3f4f6;">
        <div>
          <p style="font-size:12px;font-weight:600;color:#1a1a1a;margin:0 0 2px;">${k.name}</p>
          <p style="font-size:10px;color:#9ca3af;font-family:monospace;margin:0;">${k.formula}</p>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:16px;">
          <span style="font-size:10px;background:#f3f4f6;padding:2px 6px;border-radius:4px;color:#374151;">${k.source}</span>
          <p style="font-size:10px;color:#9ca3af;margin:4px 0 0;">${k.cadence}</p>
        </div>
      </div>
    `).join('')}
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>AI Operating Rhythm — ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; margin: 0; padding: 40px; background: #fff; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    h2 { font-size: 15px; font-weight: 700; color: #374151; margin: 32px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #f3f4f6; }
    .kpi-row { display: flex; gap: 16px; margin: 24px 0; }
    .kpi { flex: 1; background: #f9fafb; border-radius: 12px; padding: 16px 20px; }
    .kpi-value { font-size: 28px; font-weight: 700; }
    .kpi-label { font-size: 11px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; }
    th { background: #f9fafb; text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
    <div>
      <p style="font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin:0 0 6px;">L.E.A.N. AI System · T11</p>
      <h1>AI Operating Rhythm</h1>
      <p style="font-size:13px;color:#6b7280;margin:4px 0 0;">${companyName}</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:10px;color:#9ca3af;margin:0;">Generado el ${now}</p>
      <p style="font-size:11px;font-weight:600;margin:4px 0 0;color:${matCfg.hex};">Madurez IA: ${matCfg.label} (${model.maturityAvg.toFixed(1)}/4)</p>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi">
      <div class="kpi-value" style="color:${matCfg.hex};">${model.maturityAvg.toFixed(1)}</div>
      <div class="kpi-label">Índice de madurez IA</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${model.recommendedEvents.length}</div>
      <div class="kpi-label">Eventos de gobierno recomendados</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${model.decisions.length}</div>
      <div class="kpi-label">Nodos de decisión mapeados</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${model.kpiGroups.reduce((acc, g) => acc + g.kpis.length, 0)}</div>
      <div class="kpi-label">KPIs definidos</div>
    </div>
  </div>

  <h2>Cadencia de Gobierno Recomendada</h2>
  <table>
    <thead>
      <tr>
        <th>Evento</th><th>Nivel</th><th>Frecuencia</th><th>Duración</th><th>Responsable</th>
      </tr>
    </thead>
    <tbody>${eventsHTML}</tbody>
  </table>

  <h2>Matriz de Decisiones y Escalada</h2>
  <table>
    <thead>
      <tr><th>Trigger</th><th>Owner de la decisión</th><th>Escala a</th><th>Plazo</th></tr>
    </thead>
    <tbody>${decisionsHTML}</tbody>
  </table>

  <h2>Indicadores Clave de Rendimiento (KPIs)</h2>
  ${kpiHTML}

  <p style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;">
    Documento generado por L.E.A.N. AI System Enterprise · Alpha Consulting Solutions S.L. · ${now}
  </p>
</body>
</html>`
}

// ── Vista principal ───────────────────────────────────────────

export function T11View({ companyName, t1Radar, employees = 500, onBack }: T11ViewProps) {
  const [activeTab, setActiveTab] = useState<T11Tab>('cadencia')

  const model = useMemo(
    () => buildOperatingModel({ radar: t1Radar, employees }),
    [t1Radar, employees],
  )

  const { maturityTier, maturityAvg, recommendedEvents, decisions, phaseObjectives, kpiGroups } = model
  const matCfg = T11_MATURITY_CONFIG[maturityTier]

  const criticalCount = recommendedEvents.filter((e) => e.isCritical).length
  const totalKpis     = kpiGroups.reduce((acc, g) => acc + g.kpis.length, 0)

  function handleExport() {
    const html     = generateOperatingModelHTML(companyName, model)
    const blob     = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url      = URL.createObjectURL(blob)
    const a        = document.createElement('a')
    a.href         = url
    a.download     = `OperatingRhythm_${companyName.replace(/\s+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-surface">

      {/* ── Header sticky ── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-950 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">

          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-text-subtle hover:text-text-muted transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 2L4 6l4 4" />
            </svg>
            Inicio
          </button>

          <div className="h-4 w-px bg-border" />

          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              T11
            </span>
            <span className="text-xs font-semibold text-lean-black dark:text-gray-100">
              AI Operating Rhythm
            </span>
          </div>

          <div className="flex-1 flex justify-center">
            <PhaseMiniMap phaseId="normalize" toolCode="T11" />
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-navy text-white hover:bg-navy/90 transition-colors"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 1v7M3 5l3 3 3-3M1 9v1.5A1.5 1.5 0 002.5 12h7A1.5 1.5 0 0011 10.5V9" />
            </svg>
            Exportar modelo operativo
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── Empresa + madurez ── */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border px-6 py-5">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
                {companyName} · Modelo Operativo IA
              </p>
              <h1 className="text-xl font-bold text-lean-black dark:text-gray-100">
                AI Operating Rhythm
              </h1>
              <p className="text-sm text-text-muted mt-1">
                Centro de operaciones basado en SAFe Agile + ISO 42001
              </p>
            </div>
            <div className="space-y-2">
              <MaturityPill tier={maturityTier} avg={maturityAvg} />
              <p className="text-[11px] text-text-subtle max-w-xs">{matCfg.description}</p>
            </div>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: recommendedEvents.length, label: 'Eventos de gobierno', sub: 'en la cadencia recomendada', color: '#C8860A' },
            { value: criticalCount,            label: 'Eventos críticos',    sub: 'de implementación inmediata', color: '#C06060' },
            { value: decisions.length,         label: 'Nodos de decisión',   sub: 'mapeados con escalada', color: '#6A90C0' },
            { value: totalKpis,                label: 'KPIs definidos',      sub: 'en los 3 niveles de gobierno', color: '#5FAF8A' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl bg-white dark:bg-gray-900 border border-border px-5 py-4">
              <p className="text-2xl font-bold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mt-0.5">{kpi.label}</p>
              <p className="text-[10px] text-text-subtle mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Descripción del modelo ── */}
        <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 px-6 py-5">
          <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">
            ¿Cómo funciona este modelo?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Cadencia de Sprint (Equipo)',
                body: 'Cada 2 semanas: planificación + review de use cases IA. El equipo sabe qué hacer, cuándo y con qué datos. Operación ágil sin burocracia.',
                color: T11_LEVEL_CONFIG.team.hex,
              },
              {
                title: 'Comités de Programa (Mensual)',
                body: 'Supervisión mensual de riesgos, compliance y proveedores. El CIO/COO tiene visibilidad sin estar en el día a día. Decisiones de programa con datos.',
                color: T11_LEVEL_CONFIG.program.hex,
              },
              {
                title: 'Dirección Estratégica (Trimestral)',
                body: 'PI Planning + Steering Committee: objetivos del trimestre, ROI, inversión. El C-suite gobierna la transformación IA sin microgestionar.',
                color: T11_LEVEL_CONFIG.direction.hex,
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-1">{item.title}</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div>
          {/* Tab selector */}
          <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 mb-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex-1 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-900 text-lean-black dark:text-gray-100 shadow-sm'
                    : 'text-text-muted hover:text-lean-black dark:hover:text-gray-200',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'cadencia'   && <CadenciaTab   events={recommendedEvents} />}
          {activeTab === 'objetivos'  && <ObjetivosTab  objectives={phaseObjectives} />}
          {activeTab === 'decisiones' && <DecisionesTab decisions={decisions} />}
          {activeTab === 'kpis'       && <KpisTab       kpiGroups={kpiGroups} />}
        </div>

        {/* ── SAFe attribution ── */}
        <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-900/50 px-5 py-4">
          <p className="text-[10px] text-text-subtle leading-relaxed">
            <span className="font-semibold text-text-muted">Metodología:</span> Este modelo operativo adapta el framework SAFe® (Scaled Agile Framework) al gobierno de sistemas IA, integrando los requisitos del estándar ISO 42001:2023 (AI Management System) y el EU AI Act (Reglamento 2024/1689). La cadencia recomendada se ajusta automáticamente al nivel de madurez IA de la organización medido en T1.
          </p>
        </div>
      </div>
    </div>
  )
}
