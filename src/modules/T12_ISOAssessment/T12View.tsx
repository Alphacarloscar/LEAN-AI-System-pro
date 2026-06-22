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

import { useState, useMemo, useEffect } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { useT12Store }                  from './store'
import { useT6Store }                   from '@/modules/T6_RiskGovernance/store'
import { useEngagementStore }           from '@/modules/Engagement/store'
import { useCompanyProfileStore }       from '@/modules/CompanyProfile/store'
import {
  T12_CLAUSE_CONFIG,
  T12_STATUS_CONFIG,
} from './constants'
import { PhaseMiniMap }      from '@/shared/components/PhaseMiniMap'
import type { T12Clause, T12Status } from './types'
import { usePermissions }    from '@/modules/Auth'
import { Button, ToolHeader } from '@shared/design-system/components'
import { ClauseSidebar }     from './components/ClauseSidebar'
import { ControlCard }       from './components/ControlCard'
import { generateAuditReport } from './components/auditReport'

// ── Vista principal ───────────────────────────────────────────

interface T12ViewProps {
  onBack?: () => void
}

export function T12View({ onBack }: T12ViewProps) {
  const navigate                    = useNavigate()
  const { isReadOnly } = usePermissions()
  const { controls, updateControl, importFromT6, syncEngagement: syncT12 } = useT12Store()
  const t6Controls                  = useT6Store((s) => s.controls)
  const engagementId                = useEngagementStore((s) => s.activeEngagementId)
  const companyName                 = useCompanyProfileStore((s) => s.profile.engagementName)

  // stable Zustand action — mount-only: sincronizar al cambiar engagement
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { syncT12(engagementId) }, [engagementId])

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
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Header sticky ── */}
      <ToolHeader
        sticky
        onBack={() => { onBack?.(); navigate('/') }}
        backLabel="Volver al dashboard"
        toolCode="T12"
        title="AI System Impact Assessment — ISO 42001"
        phaseMiniMap={<PhaseMiniMap phaseId="normalize" toolCode="T12" />}
        cta={
          <>
            {!isReadOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImportFromT6}
                icon={<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v10M4 8l4 4 4-4M2 14h12" /></svg>}
              >
                Importar desde T6
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              icon={<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8M4 6l4 4 4-4M2 14h12" /></svg>}
            >
              Exportar para auditor
            </Button>
          </>
        }
        below={
          <div className="flex items-center gap-3">
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
        }
      />

      {/* ── Toast de confirmación de import ── */}
      {importMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-lean-black text-white text-xs font-medium shadow-lg animate-fade-in">
          {importMsg}
        </div>
      )}

      {/* ── Subheader: empresa ── */}
      <div className="max-w-7xl mx-auto px-8 pt-4 pb-1">
        <p className="text-sm font-semibold text-lean-black dark:text-warm-50">{companyName}</p>
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
                <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50">
                  {T12_CLAUSE_CONFIG[activeClause].label}
                </h2>
              </div>
              <p className="text-[10px] text-text-subtle">
                {activeControls.filter((c) => c.status === 'aprobado').length} de {activeControls.length} controles aprobados
              </p>
            </div>
            <Button variant="link" size="sm" onClick={() => setExpandAll((v) => !v)}>
              {expandAll ? 'Colapsar todos' : 'Expandir todos'}
            </Button>
          </div>

          {/* Cards de controles */}
          <div className="space-y-2">
            {activeControls.map((control) => (
              <ControlCard
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
