// ============================================================
// T12 — AI System Impact Assessment (ISO 42001)
//
// Layout:
//   Header sticky + barra de progreso global
//   Left sidebar: árbol de cláusulas con mini-progreso por sección
//   Main area: controles de la cláusula activa (cards expandibles)
//   Botón exportar: genera informe HTML para auditor
//
// Workflow de aprobación por control:
//   No iniciado → En progreso → Pendiente revisión → Aprobado
//
// Import desde T6: pre-popula controles mapeados con estado T6.
// ============================================================

import { useState, useMemo } from 'react'
import { useNavigate }       from 'react-router-dom'
import { useT12Store }       from './store'
import { useT6Store }        from '@/modules/T6_RiskGovernance/store'
import {
  T12_CLAUSE_CONFIG,
  T12_CLAUSE_ORDER,
  T12_STATUS_CONFIG,
} from './constants'
import { PhaseMiniMap }      from '@/shared/components/PhaseMiniMap'
import type { T12Clause, T12Control, T12Status } from './types'

// ── Helpers ───────────────────────────────────────────────────

function clauseProgress(controls: T12Control[], clause: T12Clause) {
  const subset = controls.filter((c) => c.clause === clause)
  return {
    total:       subset.length,
    aprobado:    subset.filter((c) => c.status === 'aprobado').length,
    pendiente:   subset.filter((c) => c.status === 'pendiente_revision').length,
    en_progreso: subset.filter((c) => c.status === 'en_progreso').length,
    no_iniciado: subset.filter((c) => c.status === 'no_iniciado').length,
    pct:         subset.length
      ? Math.round((subset.filter((c) => c.status === 'aprobado').length / subset.length) * 100)
      : 0,
  }
}

// ── Componente: badge de estado ───────────────────────────────

function StatusBadge({ status }: { status: T12Status }) {
  const cfg = T12_STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      <span>{cfg.dot}</span>
      {cfg.label}
    </span>
  )
}

// ── Componente: sidebar de cláusulas ─────────────────────────

function ClauseSidebar({
  controls,
  active,
  onSelect,
}: {
  controls: T12Control[]
  active:   T12Clause
  onSelect: (c: T12Clause) => void
}) {
  const total    = controls.length
  const approved = controls.filter((c) => c.status === 'aprobado').length
  const globalPct = Math.round((approved / total) * 100)

  return (
    <aside className="w-56 shrink-0 flex flex-col gap-1">

      {/* Progreso global */}
      <div className="rounded-xl border border-border bg-white dark:bg-gray-900 px-4 py-3 mb-2">
        <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
          Progreso global
        </p>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-bold text-lean-black dark:text-gray-100 tabular-nums leading-none">
            {globalPct}%
          </span>
          <span className="text-[10px] text-text-subtle mb-0.5">aprobado</span>
        </div>
        {/* Barra multi-estado */}
        <div className="h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex">
          {(['aprobado', 'pendiente_revision', 'en_progreso'] as T12Status[]).map((s) => {
            const count = controls.filter((c) => c.status === s).length
            const pct   = (count / total) * 100
            if (pct === 0) return null
            return (
              <div
                key={s}
                style={{ width: `${pct}%`, backgroundColor: T12_STATUS_CONFIG[s].hex }}
                className="h-full transition-all duration-500"
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-text-subtle">{approved}/{total} controles</span>
          <span className="text-[9px] text-text-subtle">
            {controls.filter((c) => c.status === 'pendiente_revision').length} en revisión
          </span>
        </div>
      </div>

      {/* Lista de cláusulas */}
      {T12_CLAUSE_ORDER.map((clause) => {
        const cfg  = T12_CLAUSE_CONFIG[clause]
        const prog = clauseProgress(controls, clause)
        const isActive = clause === active

        return (
          <button
            key={clause}
            onClick={() => onSelect(clause)}
            className={[
              'w-full text-left rounded-xl border px-3 py-2.5 transition-all duration-150',
              isActive
                ? 'border-transparent shadow-sm'
                : 'border-border bg-white dark:bg-gray-900 hover:border-border-hover hover:bg-gray-50 dark:hover:bg-gray-800/50',
            ].join(' ')}
            style={isActive ? {
              backgroundColor: cfg.hex + '12',
              borderColor:     cfg.hex + '40',
            } : {}}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-4 w-4 rounded text-[9px] font-bold text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cfg.hex }}
                >
                  {cfg.number}
                </span>
                <span className={`text-[11px] font-semibold ${isActive ? 'text-lean-black dark:text-gray-100' : 'text-text-muted'}`}>
                  {cfg.shortLabel}
                </span>
              </div>
              <span className="text-[9px] font-mono text-text-subtle">
                {prog.aprobado}/{prog.total}
              </span>
            </div>
            {/* Mini barra */}
            <div className="h-1 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex">
              {prog.aprobado > 0 && (
                <div
                  style={{ width: `${prog.pct}%`, backgroundColor: cfg.hex }}
                  className="h-full transition-all duration-500"
                />
              )}
              {prog.pendiente > 0 && (
                <div
                  style={{ width: `${(prog.pendiente / prog.total) * 100}%`, backgroundColor: '#6A90C0' }}
                  className="h-full transition-all duration-500"
                />
              )}
              {prog.en_progreso > 0 && (
                <div
                  style={{ width: `${(prog.en_progreso / prog.total) * 100}%`, backgroundColor: '#D4A85C' }}
                  className="h-full transition-all duration-500"
                />
              )}
            </div>
          </button>
        )
      })}
    </aside>
  )
}

// ── Función de export para auditor ────────────────────────────

function generateAuditReport(controls: T12Control[], companyName: string): string {
  const now     = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const total   = controls.length
  const approved = controls.filter((c) => c.status === 'aprobado').length
  const pending  = controls.filter((c) => c.status === 'pendiente_revision').length
  const progress = controls.filter((c) => c.status === 'en_progreso').length
  const notStarted = controls.filter((c) => c.status === 'no_iniciado').length
  const globalPct = Math.round((approved / total) * 100)

  const statusLabel: Record<T12Status, string> = {
    no_iniciado:        'No iniciado',
    en_progreso:        'En progreso',
    pendiente_revision: 'Pendiente revisión',
    aprobado:           'Aprobado',
  }

  const clauseLabel: Record<T12Clause, string> = {
    context:     'Cláusula 4 — Contexto',
    leadership:  'Cláusula 5 — Liderazgo',
    planning:    'Cláusula 6 — Planificación',
    support:     'Cláusula 7 — Apoyo',
    operation:   'Cláusula 8 — Operación',
    evaluation:  'Cláusula 9 — Evaluación del desempeño',
    improvement: 'Cláusula 10 — Mejora',
  }

  const clauseSections = T12_CLAUSE_ORDER.map((clause) => {
    const subset = controls.filter((c) => c.clause === clause)
    const rows = subset.map((c) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:11px;color:#475569;">${c.code}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#2A2822;">${c.title}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#64748b;">${statusLabel[c.status]}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569;">${c.evidence || '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569;">${c.reviewNote || '—'}</td>
      </tr>
    `).join('')

    return `
      <h3 style="margin:28px 0 10px;font-size:14px;font-weight:700;color:#2A2822;border-bottom:2px solid #C8860A;padding-bottom:6px;">
        ${clauseLabel[clause]}
      </h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <thead>
          <tr style="background:#f8f5ef;">
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Código</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Control</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Estado</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Evidencia</th>
            <th style="padding:7px 10px;text-align:left;font-size:10px;font-family:monospace;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Notas revisión</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Informe ISO 42001 — ${companyName}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 40px; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color: #2A2822; background: #fff; max-width: 960px; margin: 0 auto; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div style="border-bottom:3px solid #2A2822;padding-bottom:20px;margin-bottom:24px;">
    <p style="font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;margin:0 0 6px;">
      L.E.A.N. AI System — AI System Impact Assessment
    </p>
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:800;color:#2A2822;">Informe ISO 42001</h1>
    <p style="margin:0;font-size:14px;color:#64748b;">${companyName} · Generado el ${now}</p>
  </div>

  <!-- Resumen ejecutivo -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
    <div style="background:#f8f5ef;border-radius:10px;padding:14px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:800;color:#2A2822;">${globalPct}%</p>
      <p style="margin:4px 0 0;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">Completado</p>
    </div>
    <div style="background:#f0fdf4;border-radius:10px;padding:14px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:800;color:#16a34a;">${approved}</p>
      <p style="margin:4px 0 0;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">Aprobados</p>
    </div>
    <div style="background:#eff6ff;border-radius:10px;padding:14px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:800;color:#2563eb;">${pending}</p>
      <p style="margin:4px 0 0;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">En revisión</p>
    </div>
    <div style="background:#fefce8;border-radius:10px;padding:14px;text-align:center;">
      <p style="margin:0;font-size:28px;font-weight:800;color:#d97706;">${progress}</p>
      <p style="margin:4px 0 0;font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">En progreso</p>
    </div>
  </div>

  ${clauseSections}

  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;font-family:monospace;">
    Generado por L.E.A.N. AI System Enterprise · Alpha Consulting Solutions S.L. · ${now}
    · ${total - notStarted}/${total} controles iniciados · Referencia normativa: ISO/IEC 42001:2023
  </div>
</body>
</html>`
}

// ── Vista principal ───────────────────────────────────────────

interface T12ViewProps {
  companyName: string
  onBack?:     () => void
}

export function T12View({ companyName, onBack }: T12ViewProps) {
  const navigate                    = useNavigate()
  const { controls, updateControl, importFromT6 } = useT12Store()
  const t6Controls                  = useT6Store((s) => s.controls)

  const [activeClause, setActiveClause] = useState<T12Clause>('context')
  const [importMsg, setImportMsg]       = useState<string | null>(null)
  const [expandAll, setExpandAll]       = useState(false)

  const activeControls = useMemo(
    () => controls.filter((c) => c.clause === activeClause),
    [controls, activeClause]
  )

  const total     = controls.length
  const approved  = controls.filter((c) => c.status === 'aprobado').length
  const pending   = controls.filter((c) => c.status === 'pendiente_revision').length
  const globalPct = Math.round((approved / total) * 100)

  function handleImportFromT6() {
    const count = importFromT6(
      t6Controls.map((c) => ({ id: c.id, status: c.status, notes: c.notes }))
    )
    setImportMsg(
      count > 0
        ? `${count} control${count > 1 ? 'es' : ''} importado${count > 1 ? 's' : ''} desde T6`
        : 'No hay controles nuevos para importar desde T6'
    )
    setTimeout(() => setImportMsg(null), 3500)
  }

  function handleExport() {
    const html  = generateAuditReport(controls, companyName)
    const blob  = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url   = URL.createObjectURL(blob)
    const a     = document.createElement('a')
    a.href      = url
    a.download  = `ISO42001_${companyName.replace(/\s+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950">

      {/* ── Header sticky ── */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-border px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">

          <button
            onClick={() => { onBack?.(); navigate('/') }}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-lean-black dark:hover:text-gray-200 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Volver al dashboard
          </button>

          <span className="text-text-subtle">·</span>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-navy/10 dark:bg-navy/20 text-[10px] font-mono font-semibold text-navy dark:text-warm-100 uppercase tracking-wider">
              T12
            </span>
            <h1 className="text-sm font-semibold text-lean-black dark:text-gray-100 truncate">
              AI System Impact Assessment — ISO 42001
            </h1>
            <PhaseMiniMap phaseId="normalize" toolCode="T12" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Import desde T6 */}
            <button
              onClick={handleImportFromT6}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-medium text-text-muted hover:text-lean-black dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v10M4 8l4 4 4-4M2 14h12" />
              </svg>
              Importar desde T6
            </button>

            {/* Exportar para auditor */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-metallic text-white text-xs font-semibold hover:bg-navy-metallic-hover shadow-sm active:scale-[0.98] transition-all duration-150"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v8M4 6l4 4 4-4M2 14h12" />
              </svg>
              Exportar para auditor
            </button>
          </div>
        </div>

        {/* Barra de progreso global — debajo del header */}
        <div className="max-w-7xl mx-auto mt-2.5 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex">
            {(['aprobado', 'pendiente_revision', 'en_progreso'] as T12Status[]).map((s) => {
              const pct = (controls.filter((c) => c.status === s).length / total) * 100
              if (pct === 0) return null
              return (
                <div
                  key={s}
                  style={{ width: `${pct}%`, backgroundColor: T12_STATUS_CONFIG[s].hex }}
                  className="h-full transition-all duration-700"
                />
              )
            })}
          </div>
          <span className="text-[10px] font-mono text-text-subtle shrink-0">
            {globalPct}% · {approved}/{total} aprobados · {pending} en revisión
          </span>
        </div>
      </div>

      {/* ── Toast de confirmación de import ── */}
      {importMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-lean-black text-white text-xs font-medium shadow-lg animate-fade-in">
          {importMsg}
        </div>
      )}

      {/* ── Subheader: empresa ── */}
      <div className="max-w-7xl mx-auto px-8 pt-4 pb-1">
        <p className="text-sm font-semibold text-lean-black dark:text-gray-100">{companyName}</p>
        <p className="text-xs text-text-subtle mt-0.5">
          Evaluación de cumplimiento ISO 42001:2023 · Selecciona una cláusula y gestiona el avance control por control.
        </p>
      </div>

      {/* ── Layout principal ── */}
      <div className="max-w-7xl mx-auto px-8 py-5 flex gap-6 items-start">

        {/* Sidebar de cláusulas */}
        <ClauseSidebar
          controls={controls}
          active={activeClause}
          onSelect={(c) => { setActiveClause(c); setExpandAll(false) }}
        />

        {/* Área principal — controles de la cláusula activa */}
        <div className="flex-1 min-w-0">

          {/* Header de sección */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-white"
                  style={{ backgroundColor: T12_CLAUSE_CONFIG[activeClause].hex }}
                >
                  Cláusula {T12_CLAUSE_CONFIG[activeClause].number}
                </span>
                <h2 className="text-sm font-semibold text-lean-black dark:text-gray-100">
                  {T12_CLAUSE_CONFIG[activeClause].label}
                </h2>
              </div>
              <p className="text-[10px] text-text-subtle">
                {activeControls.filter((c) => c.status === 'aprobado').length} de {activeControls.length} controles aprobados
              </p>
            </div>
            <button
              onClick={() => setExpandAll((v) => !v)}
              className="text-[11px] text-text-muted hover:text-lean-black dark:hover:text-gray-200 transition-colors"
            >
              {expandAll ? 'Colapsar todos' : 'Expandir todos'}
            </button>
          </div>

          {/* Cards de controles */}
          <div className="space-y-2">
            {activeControls.map((control) => (
              <ControlCardWrapper
                key={control.id}
                control={control}
                forceExpanded={expandAll}
                onUpdate={updateControl}
              />
            ))}
          </div>

          {/* Estado completo de la sección */}
          {activeControls.every((c) => c.status === 'aprobado') && activeControls.length > 0 && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-success-light border border-success-dark/20">
              <svg className="h-4 w-4 text-success-dark shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4L6 11l-3-3" />
              </svg>
              <p className="text-xs font-semibold text-success-dark">
                Todos los controles de esta cláusula han sido aprobados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Wrapper que soporta forceExpanded ─────────────────────────

function ControlCardWrapper({
  control,
  forceExpanded,
  onUpdate,
}: {
  control:       T12Control
  forceExpanded: boolean
  onUpdate:      (id: string, patch: Partial<Pick<T12Control, 'status' | 'evidence' | 'reviewNote'>>) => void
}) {
  const [localExpanded, setLocalExpanded] = useState(false)
  const expanded = forceExpanded || localExpanded

  const cfg       = T12_STATUS_CONFIG[control.status]
  const clauseCfg = T12_CLAUSE_CONFIG[control.clause]
  const nextCfg   = control.status !== 'aprobado' ? T12_STATUS_CONFIG[cfg.next!] : null

  return (
    <div
      className={[
        'rounded-xl border transition-all duration-200',
        expanded
          ? 'border-border shadow-sm bg-white dark:bg-gray-900'
          : 'border-border bg-white dark:bg-gray-900 hover:border-border-hover',
      ].join(' ')}
    >
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3"
        onClick={() => setLocalExpanded((v) => !v)}
      >
        <span
          className="mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shrink-0"
          style={{ backgroundColor: clauseCfg.hex }}
        >
          {control.code}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-lean-black dark:text-gray-100 leading-snug">
              {control.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {control.importedFromT6 && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                  T6
                </span>
              )}
              <StatusBadge status={control.status} />
              <svg
                className={`h-3 w-3 text-text-subtle transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            </div>
          </div>
          {!expanded && control.evidence && (
            <p className="text-[10px] text-text-subtle mt-1 italic line-clamp-1">
              {control.evidence}
            </p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-4 py-4 space-y-4">
          <p className="text-[11px] text-text-muted leading-relaxed">{control.description}</p>

          <div>
            <label className="block text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
              Evidencia / Notas del consultor
            </label>
            <textarea
              value={control.evidence}
              onChange={(e) => onUpdate(control.id, { evidence: e.target.value })}
              placeholder="Documenta aquí la evidencia de implementación, referencias a documentos, responsables, fechas…"
              rows={3}
              className="w-full text-[11px] text-lean-black dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-border rounded-lg px-3 py-2 placeholder:text-text-subtle resize-none focus:outline-none focus:ring-1 focus:ring-navy/30"
            />
          </div>

          {(control.status === 'pendiente_revision' || control.status === 'aprobado') && (
            <div>
              <label className="block text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">
                {control.status === 'aprobado' ? 'Nota del revisor' : 'Nota para el revisor (opcional)'}
              </label>
              <textarea
                value={control.reviewNote}
                onChange={(e) => onUpdate(control.id, { reviewNote: e.target.value })}
                placeholder="Observaciones para el revisor o notas de la aprobación…"
                rows={2}
                className="w-full text-[11px] text-lean-black dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border border-border rounded-lg px-3 py-2 placeholder:text-text-subtle resize-none focus:outline-none focus:ring-1 focus:ring-navy/30"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div>
              {control.status !== 'no_iniciado' && (
                <button
                  onClick={() => {
                    const order: T12Status[] = ['no_iniciado', 'en_progreso', 'pendiente_revision', 'aprobado']
                    const idx = order.indexOf(control.status)
                    if (idx > 0) onUpdate(control.id, { status: order[idx - 1] })
                  }}
                  className="text-[10px] text-text-subtle hover:text-text-muted transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ← Retroceder
                </button>
              )}
            </div>

            {cfg.next && nextCfg && (
              <button
                onClick={() => onUpdate(control.id, { status: cfg.next as T12Status })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all duration-150 active:scale-[0.98]"
                style={{ backgroundColor: nextCfg.hex }}
              >
                {cfg.nextLabel}
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 6h8M6 2l4 4-4 4" />
                </svg>
              </button>
            )}

            {control.status === 'aprobado' && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-success-dark dark:text-green-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 4L6 11l-3-3" />
                </svg>
                Control aprobado
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
