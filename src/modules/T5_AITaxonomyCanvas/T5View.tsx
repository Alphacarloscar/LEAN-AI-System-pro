// ============================================================
// T5 — AI Domain Architecture Canvas
// ============================================================

import { useState, useMemo } from 'react'
import type { T5Canvas, T5DomainCode, T5DomainScores, T5DomainAssessment } from './types'
import {
  T5_DOMAIN_CONFIG,
  T5_RECOMMENDATION_CONFIG,
  T5_DIMENSION_CONFIG,
  T5_MATURITY_CONFIG,
  computeT5Recommendation,
} from './constants'
import { useT5Store }    from './store'
import { useT3Store }    from '@/modules/T3_ValueStreamMap'
import { useT4Store }    from '@/modules/T4_UseCasePriorityBoard'
import { PhaseMiniMap }  from '@/shared/components/PhaseMiniMap'

// ── Collision resolution ──────────────────────────────────────
// Reference container dimensions for physics calculations

const COLL_W   = 520
const COLL_H   = 295
const COLL_GAP = 10   // minimum gap between bubble edges (px)

interface ChipPos {
  code: T5DomainCode
  xPx:  number
  yPx:  number
  size: number
}

function resolveChipCollisions(chips: ChipPos[]): ChipPos[] {
  const result = chips.map(c => ({ ...c }))

  for (let iter = 0; iter < 80; iter++) {
    let anyMoved = false

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]
        const b = result[j]
        const minDist = (a.size + b.size) / 2 + COLL_GAP
        const dx      = b.xPx - a.xPx
        const dy      = b.yPx - a.yPx
        const dist    = Math.sqrt(dx * dx + dy * dy)

        if (dist < minDist) {
          if (dist < 0.5) {
            a.xPx -= minDist / 2
            b.xPx += minDist / 2
          } else {
            const push = (minDist - dist) / 2 + 0.5
            const nx   = dx / dist
            const ny   = dy / dist
            a.xPx -= nx * push
            a.yPx -= ny * push
            b.xPx += nx * push
            b.yPx += ny * push
          }
          anyMoved = true
        }
      }
    }

    // Clamp to container
    for (const p of result) {
      const r = p.size / 2
      p.xPx = Math.max(r + 2, Math.min(COLL_W - r - 2, p.xPx))
      p.yPx = Math.max(r + 2, Math.min(COLL_H - r - 2, p.yPx))
    }

    if (!anyMoved) break
  }

  return result
}

// ── Inline status maps (avoid cross-module constants import) ──

const UC_STATUS_LABEL: Record<string, string> = {
  go: 'Go', en_piloto: 'En piloto', priorizado: 'Priorizado',
  candidato: 'Candidato', no_go: 'No-Go', completado: 'Completado',
}
const UC_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  go:         { bg: 'bg-success-light', text: 'text-success-dark' },
  en_piloto:  { bg: 'bg-warning-light', text: 'text-warning-dark' },
  priorizado: { bg: 'bg-info-light',    text: 'text-info-dark' },
  candidato:  { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500' },
  no_go:      { bg: 'bg-danger-light',  text: 'text-danger-dark' },
  completado: { bg: 'bg-navy/10',       text: 'text-navy' },
}
const PHASE_LABEL: Record<string, string> = {
  idea: 'Idea', validacion: 'Validación', piloto: 'Piloto',
  estandarizacion: 'Estandarización', escalado: 'Escalado',
}

// ── Maturity Badge ────────────────────────────────────────────

function MaturityBadge({ level }: { level: string }) {
  const cfg = T5_MATURITY_CONFIG[level as keyof typeof T5_MATURITY_CONFIG] ?? T5_MATURITY_CONFIG.inicial
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.hex }} />
      AI Maturity: {cfg.label}
    </span>
  )
}

// ── Dept × Category Detail Modal ─────────────────────────────

function DeptCategoryModal({
  department,
  domainCode,
  canvas,
  onClose,
}: {
  department: string
  domainCode: T5DomainCode
  canvas:     T5Canvas
  onClose:    () => void
}) {
  const processes  = useT3Store(s => s.processes)
  const useCases   = useT4Store(s => s.useCases)
  const domCfg     = T5_DOMAIN_CONFIG[domainCode]
  const assessment = canvas.domains[domainCode]
  const recCfg     = T5_RECOMMENDATION_CONFIG[assessment.recommendation]

  const filteredUCs   = useCases.filter(uc => uc.aiCategory === domainCode && uc.department === department)
  const filteredProcs = processes.filter(p  => p.aiCategory  === domainCode && p.department  === department)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[82vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: domCfg.hex + '22', border: `1.5px solid ${domCfg.hex}55` }}
            >
              {domCfg.icon}
            </div>
            <div>
              <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">{department}</p>
              <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">{domCfg.label}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-subtle hover:text-lean-black dark:hover:text-gray-200 transition-colors text-lg w-7 h-7 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Quadrant / Recommendation summary */}
          <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${recCfg.badgeBg} ${recCfg.badgeText}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: recCfg.hex }} />
                {recCfg.label}
              </span>
              <span className="text-xl font-bold tabular-nums text-lean-black dark:text-gray-100">
                {assessment.priorityScore}
                <span className="text-[10px] text-text-subtle font-normal">/100</span>
              </span>
            </div>
            <div className="flex gap-4">
              <span className="text-[10px] text-text-subtle">
                Valor negocio: <strong className="text-lean-black dark:text-gray-200">{assessment.scores.businessValue}</strong>
              </span>
              <span className="text-[10px] text-text-subtle">
                Madurez técnica: <strong className="text-lean-black dark:text-gray-200">{assessment.scores.technicalReady}</strong>
              </span>
              <span className="text-[10px] text-text-subtle">
                Org readiness: <strong className="text-lean-black dark:text-gray-200">{assessment.scores.orgReadiness}</strong>
              </span>
            </div>
          </div>

          {/* T4 use cases */}
          {filteredUCs.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Casos de uso — T4 ({filteredUCs.length})
              </p>
              <div className="flex flex-col gap-2">
                {filteredUCs.map(uc => {
                  const style = UC_STATUS_STYLE[uc.status] ?? UC_STATUS_STYLE.candidato
                  return (
                    <div key={uc.id} className="px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{uc.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold ${style.bg} ${style.text}`}>
                            {UC_STATUS_LABEL[uc.status] ?? uc.status}
                          </span>
                          <span className="text-[10px] font-bold tabular-nums text-lean-black dark:text-gray-200 w-7 text-right">
                            {uc.priorityScore}
                          </span>
                        </div>
                      </div>
                      {uc.description && (
                        <p className="text-[10px] text-text-subtle leading-relaxed mt-0.5">{uc.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* T3 processes */}
          {filteredProcs.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Procesos — T3 ({filteredProcs.length})
              </p>
              <div className="flex flex-col gap-2">
                {filteredProcs.map(p => (
                  <div key={p.id} className="px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{p.name}</p>
                      <span className="text-[10px] text-text-subtle shrink-0 capitalize">
                        {PHASE_LABEL[p.phase] ?? p.phase}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-[10px] text-text-subtle leading-relaxed mt-0.5">{p.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredUCs.length === 0 && filteredProcs.length === 0 && (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 mb-3">
                <svg className="w-5 h-5 text-text-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M15 15l3 3" />
                </svg>
              </div>
              <p className="text-sm text-text-muted">
                Sin proyectos en <strong>{department.split('/')[0].trim()}</strong> para este dominio.
              </p>
              <p className="text-[11px] text-text-subtle mt-1">
                Completa el diagnóstico T3 y prioriza casos de uso en T4.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Department Adoption Chart ─────────────────────────────────

const ALL_DOMAIN_CODES: T5DomainCode[] = [
  'automatizacion_rpa', 'automatizacion_inteligente',
  'analitica_predictiva', 'asistente_ia', 'optimizacion_proceso', 'agéntica',
]

function DepartmentAdoptionChart({
  processes,
  canvas,
  onSelectDomain,
}: {
  processes:      Array<{ department: string; aiCategory: string }>
  canvas:         T5Canvas
  onSelectDomain: (c: T5DomainCode) => void
}) {
  const [selectedCell, setSelectedCell] = useState<{ dept: string; code: T5DomainCode } | null>(null)

  const deptCats: Record<string, Set<string>> = {}
  processes.forEach(p => {
    if (!deptCats[p.department]) deptCats[p.department] = new Set()
    deptCats[p.department].add(p.aiCategory)
  })
  const departments = Object.keys(deptCats).sort()
  if (!departments.length) return null

  return (
    <>
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
          Adopción por departamento
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="text-left pb-3 pr-3 font-medium text-text-subtle w-32" />
                {ALL_DOMAIN_CODES.map(code => {
                  const domCfg = T5_DOMAIN_CONFIG[code]
                  const recCfg = T5_RECOMMENDATION_CONFIG[canvas.domains[code].recommendation]
                  return (
                    <th key={code} className="text-center pb-3 px-1">
                      <button
                        onClick={() => onSelectDomain(code)}
                        title={domCfg.label}
                        className="mx-auto flex flex-col items-center justify-center rounded-full
                          transition-all duration-150 hover:scale-110 focus:outline-none"
                        style={{
                          width:           40,
                          height:          40,
                          border:          `2px solid ${recCfg.hex}`,
                          backgroundColor: recCfg.hex + '22',
                        }}
                      >
                        <span
                          className="text-[8px] font-bold leading-tight text-center text-lean-black dark:text-gray-200"
                          style={{ maxWidth: 34, wordBreak: 'break-word', padding: '0 2px' }}
                        >
                          {domCfg.shortLabel}
                        </span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {departments.map(dept => (
                <tr key={dept} className="border-t border-border/30">
                  <td className="py-1.5 pr-3 text-text-muted leading-tight">
                    {dept.split('/')[0].trim()}
                  </td>
                  {ALL_DOMAIN_CODES.map(code => {
                    const active = deptCats[dept]?.has(code)
                    const domCfg = T5_DOMAIN_CONFIG[code]
                    return (
                      <td key={code} className="py-1.5 px-1 text-center">
                        <button
                          onClick={() => setSelectedCell({ dept, code })}
                          title={`${dept.split('/')[0].trim()} × ${domCfg.label}`}
                          className={[
                            'inline-flex items-center justify-center rounded-full focus:outline-none',
                            'transition-all duration-150',
                            active
                              ? 'w-4 h-4 hover:scale-125 hover:shadow-sm'
                              : 'w-3 h-3 hover:scale-110 opacity-50 hover:opacity-80',
                          ].join(' ')}
                          style={{
                            backgroundColor: active ? domCfg.hex : 'transparent',
                            border:          active ? 'none' : '1.5px solid #CBD5E1',
                            cursor:          'pointer',
                          }}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] text-text-subtle/60 mt-2">
          Haz clic en cualquier punto para ver los proyectos del departamento en ese dominio
        </p>
      </div>

      {selectedCell && (
        <DeptCategoryModal
          department={selectedCell.dept}
          domainCode={selectedCell.code}
          canvas={canvas}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </>
  )
}

// ── Portfolio Matrix ──────────────────────────────────────────

function PortfolioMatrix({
  canvas,
  processes,
  selectedDomain,
  onSelectDomain,
}: {
  canvas:         T5Canvas
  processes:      Array<{ department: string; aiCategory: string }>
  selectedDomain: T5DomainCode
  onSelectDomain: (c: T5DomainCode) => void
}) {
  const domains = Object.values(canvas.domains)

  // Compute chip positions with collision avoidance
  const resolvedPositions = useMemo((): ChipPos[] => {
    const chips: ChipPos[] = domains.map(d => ({
      code: d.domainCode,
      xPx:  (6 + (d.scores.technicalReady / 100) * 82) / 100 * COLL_W,
      yPx:  (6 + ((100 - d.scores.businessValue) / 100) * 82) / 100 * COLL_H,
      size: Math.max(64, Math.min(80, 64 + d.useCaseCount * 5)),
    }))
    return resolveChipCollisions(chips)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas.domains])

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
        Portfolio map — 6 dominios IA
      </p>
      <p className="text-[10px] text-text-subtle mb-4">
        Haz clic en un dominio para ver su ficha de governance
      </p>

      <div className="flex gap-2">
        {/* Y-axis label */}
        <div className="flex flex-col justify-between items-center shrink-0 pb-7">
          <span className="text-[9px] font-semibold text-success-dark">Alto</span>
          <div className="flex-1 flex items-center justify-center">
            <span
              className="text-[9px] text-text-subtle whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Valor de negocio →
            </span>
          </div>
          <span className="text-[9px] font-semibold text-gray-400">Bajo</span>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {/* Chart area — fixed pixel height matching COLL_H reference */}
          <div
            className="relative rounded-xl overflow-hidden border border-border/60"
            style={{ height: COLL_H }}
          >
            {/* Quadrant backgrounds */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
              <div className="bg-warning-light/45 border-r border-b border-border/30" />
              <div className="bg-success-light/45 border-b border-border/30" />
              <div className="bg-gray-100/80 border-r border-border/30 dark:bg-gray-400/15" />
              <div className="bg-info-light/20" />
            </div>

            {/* Quadrant labels */}
            <span className="absolute top-2 left-3 text-[9px] font-semibold text-warning-dark/75 pointer-events-none select-none">
              Pilotar 90 días
            </span>
            <span className="absolute top-2 right-3 text-[9px] font-semibold text-success-dark/75 pointer-events-none select-none">
              Activar ahora
            </span>
            <span className="absolute bottom-2 left-3 text-[9px] font-semibold text-gray-400/80 pointer-events-none select-none">
              Preparar foundations
            </span>
            <span className="absolute bottom-2 right-3 text-[9px] font-semibold text-info-dark/60 pointer-events-none select-none">
              Evaluar viabilidad
            </span>

            {/* Domain chips — collision-resolved */}
            {domains.map(d => {
              const pos        = resolvedPositions.find(p => p.code === d.domainCode)
              if (!pos) return null
              const domCfg     = T5_DOMAIN_CONFIG[d.domainCode]
              const recCfg     = T5_RECOMMENDATION_CONFIG[d.recommendation]
              const isSelected = selectedDomain === d.domainCode

              return (
                <button
                  key={d.domainCode}
                  title={`${domCfg.label} — ${recCfg.label}`}
                  onClick={() => onSelectDomain(d.domainCode)}
                  className="absolute group"
                  style={{
                    left:      pos.xPx,
                    top:       pos.yPx,
                    width:     pos.size,
                    height:    pos.size,
                    transform: 'translate(-50%, -50%)',
                    zIndex:    isSelected ? 10 : 5,
                  }}
                >
                  <div
                    className={`w-full h-full rounded-full flex flex-col items-center justify-center
                      transition-all duration-200 ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                    style={{
                      border:          `2.5px solid ${recCfg.hex}`,
                      backgroundColor: recCfg.hex + (isSelected ? '38' : '20'),
                      boxShadow: isSelected
                        ? `0 0 0 4px ${recCfg.hex}35, 0 6px 20px ${recCfg.hex}45`
                        : `0 2px 8px ${recCfg.hex}25`,
                    }}
                  >
                    <span className="text-sm leading-none select-none">{domCfg.icon}</span>
                    <span
                      className="text-[8px] font-bold leading-tight text-center text-lean-black dark:text-gray-200 select-none"
                      style={{ maxWidth: pos.size - 10, wordBreak: 'break-word', padding: '0 3px' }}
                    >
                      {domCfg.shortLabel}
                    </span>
                    <span className="text-[8px] tabular-nums text-text-subtle select-none">
                      {d.priorityScore}
                    </span>
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 whitespace-nowrap">
                    <div className="bg-lean-black text-white text-[10px] rounded-lg px-3 py-1.5 shadow-xl">
                      <p className="font-semibold">{domCfg.label}</p>
                      <p style={{ color: recCfg.hex }}>{recCfg.label}</p>
                    </div>
                    <div className="w-2 h-2 bg-lean-black rotate-45 mx-auto -mt-1" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] text-gray-400">← Baja madurez técnica</span>
            <span className="text-[9px] text-info-dark">Alta madurez técnica →</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50">
        {(['activar_ahora', 'pilotar_90d', 'preparar_foundations', 'gobernar_primero'] as const).map(rec => {
          const cfg = T5_RECOMMENDATION_CONFIG[rec]
          return (
            <div key={rec} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.hex }} />
              <span className="text-[10px] text-text-muted">{cfg.label}</span>
            </div>
          )
        })}
      </div>

      {/* Department adoption chart */}
      <DepartmentAdoptionChart
        processes={processes}
        canvas={canvas}
        onSelectDomain={onSelectDomain}
      />
    </div>
  )
}

// ── Dimension Bars ────────────────────────────────────────────

function T5DimBars({ scores }: { scores: T5DomainScores }) {
  return (
    <div className="flex flex-col gap-3">
      {(Object.entries(T5_DIMENSION_CONFIG) as Array<[keyof T5DomainScores, (typeof T5_DIMENSION_CONFIG)[keyof T5DomainScores]]>).map(([key, cfg]) => {
        const val    = scores[key]
        const lblIdx = Math.min(4, Math.floor(val / 20))
        const isNeg  = cfg.direction === 'negative'
        return (
          <div key={key} className="flex items-center gap-3">
            <div className="w-36 shrink-0">
              <p className="text-[10px] font-semibold text-lean-black dark:text-gray-200 leading-tight">
                {cfg.label}
              </p>
              <p className="text-[9px] text-text-subtle mt-0.5">
                {cfg.scaleLabels[lblIdx]}{isNeg ? ' ↑ riesgo' : ''}
              </p>
            </div>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${val}%`, backgroundColor: cfg.hex, opacity: 0.85 }}
              />
            </div>
            <div className="shrink-0 w-8 text-right">
              <span className="text-[10px] font-bold tabular-nums text-lean-black dark:text-gray-200">{val}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Domain Governance Card ────────────────────────────────────

function DomainCard({
  assessment,
  onEdit,
}: {
  assessment: T5DomainAssessment
  onEdit:     () => void
}) {
  const domCfg = T5_DOMAIN_CONFIG[assessment.domainCode]
  const recCfg = T5_RECOMMENDATION_CONFIG[assessment.recommendation]

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: domCfg.hex + '22', border: `1.5px solid ${domCfg.hex}55` }}
          >
            {domCfg.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100 leading-tight">
              {domCfg.label}
            </h3>
            <p className="text-[10px] text-text-subtle mt-0.5 leading-tight">{domCfg.tagline}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="shrink-0 px-3 py-1.5 rounded-xl border border-navy/40 text-navy bg-navy/5 text-xs font-medium
            hover:bg-navy/10 transition-colors dark:text-info-soft dark:border-info-soft/30 dark:bg-info-soft/5"
        >
          Editar
        </button>
      </div>

      {/* Recommendation + score */}
      <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${recCfg.badgeBg} ${recCfg.badgeText}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: recCfg.hex }} />
            {recCfg.label}
          </span>
          <div className="text-right">
            <span className="text-xl font-bold tabular-nums text-lean-black dark:text-gray-100">
              {assessment.priorityScore}
            </span>
            <span className="text-[10px] text-text-subtle">/100</span>
          </div>
        </div>
        <p className="text-[10px] text-text-subtle leading-relaxed">{recCfg.description}</p>
      </div>

      {/* Dimension bars */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
          Evaluación por dimensión
        </p>
        <T5DimBars scores={assessment.scores} />
      </div>

      {/* Governance */}
      <div className="rounded-xl border border-border bg-gray-50/50 dark:bg-gray-800/30 px-4 py-4 flex flex-col gap-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">Governance</p>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <span className="text-sm shrink-0 mt-0.5">👤</span>
            <div>
              <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide">Owner sugerido</p>
              <p className="text-[11px] font-medium text-lean-black dark:text-gray-200 leading-tight mt-0.5">
                {assessment.suggestedOwner}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-sm shrink-0 mt-0.5">📊</span>
            <div>
              <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide">KPI principal</p>
              <p className="text-[11px] font-medium text-lean-black dark:text-gray-200 leading-tight mt-0.5">
                {assessment.primaryKPI}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-2">
            Condiciones de activación
          </p>
          <ul className="flex flex-col gap-1.5">
            {assessment.activationConditions.map((cond, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="mt-0.5 w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold"
                  style={{ backgroundColor: recCfg.hex + '30', color: recCfg.hex }}
                >
                  {i + 1}
                </span>
                <span className="text-[10px] text-text-muted leading-tight">{cond}</span>
              </li>
            ))}
          </ul>
        </div>

        {assessment.governanceNotes && (
          <div className="rounded-lg bg-warning-light/40 border border-warning-dark/20 px-3 py-2">
            <p className="text-[10px] text-warning-dark leading-relaxed">⚠️ {assessment.governanceNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Domain Projects Modal ─────────────────────────────────────

function DomainProjectsModal({
  domainCode,
  onClose,
}: {
  domainCode: T5DomainCode
  onClose:    () => void
}) {
  const processes = useT3Store(s => s.processes)
  const useCases  = useT4Store(s => s.useCases)
  const domCfg    = T5_DOMAIN_CONFIG[domainCode]

  const domainUCs   = useCases.filter(uc => uc.aiCategory === domainCode)
  const domainProcs = processes.filter(p  => p.aiCategory  === domainCode)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: domCfg.hex + '22', border: `1.5px solid ${domCfg.hex}55` }}
            >
              {domCfg.icon}
            </div>
            <div>
              <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">Proyectos identificados</p>
              <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">{domCfg.label}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-subtle hover:text-lean-black dark:hover:text-gray-200 transition-colors text-lg w-7 h-7 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* T4 use cases */}
          {domainUCs.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Casos de uso — T4 ({domainUCs.length})
              </p>
              <div className="flex flex-col gap-2">
                {domainUCs.map(uc => {
                  const style = UC_STATUS_STYLE[uc.status] ?? UC_STATUS_STYLE.candidato
                  return (
                    <div key={uc.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{uc.name}</p>
                        <p className="text-[10px] text-text-subtle mt-0.5">{uc.department}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold ${style.bg} ${style.text}`}>
                          {UC_STATUS_LABEL[uc.status] ?? uc.status}
                        </span>
                        <span className="text-[10px] font-bold tabular-nums text-lean-black dark:text-gray-200 w-8 text-right">
                          {uc.priorityScore}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* T3 processes */}
          {domainProcs.length > 0 && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
                Procesos — T3 ({domainProcs.length})
              </p>
              <div className="flex flex-col gap-2">
                {domainProcs.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-lean-black dark:text-gray-200 truncate">{p.name}</p>
                      <p className="text-[10px] text-text-subtle mt-0.5">{p.department}</p>
                    </div>
                    <span className="text-[10px] text-text-subtle shrink-0 capitalize">
                      {PHASE_LABEL[p.phase] ?? p.phase}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {domainUCs.length === 0 && domainProcs.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 mb-3">
                <svg className="w-5 h-5 text-text-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M15 15l3 3" />
                </svg>
              </div>
              <p className="text-sm text-text-muted">No hay proyectos identificados en este dominio todavía.</p>
              <p className="text-[11px] text-text-subtle mt-1">
                Completa el diagnóstico T3 y prioriza casos de uso en T4.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Activation Sequence ───────────────────────────────────────

function ActivationSequence({
  canvas,
  onCardClick,
}: {
  canvas:      T5Canvas
  onCardClick: (code: T5DomainCode) => void
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
        Secuencia de activación recomendada
      </p>
      <p className="text-[10px] text-text-subtle mb-4">
        Haz clic en cada dominio para ver los proyectos y procesos identificados
      </p>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {canvas.activationSequence.map((code, idx) => {
          const d       = canvas.domains[code]
          const domCfg  = T5_DOMAIN_CONFIG[code]
          const recCfg  = T5_RECOMMENDATION_CONFIG[d.recommendation]
          const isLast  = idx === canvas.activationSequence.length - 1
          return (
            <div key={code} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onCardClick(code)}
                className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3 min-w-[155px]
                  hover:border-navy/30 hover:bg-navy/4 transition-all duration-150 text-left group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: recCfg.hex }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-sm">{domCfg.icon}</span>
                  <span className="text-[11px] font-semibold text-lean-black dark:text-gray-200 leading-tight truncate">
                    {domCfg.label}
                  </span>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold ${recCfg.badgeBg} ${recCfg.badgeText}`}>
                  {recCfg.actionLabel}
                </span>
                <p className="text-[9px] text-text-subtle mt-1.5 tabular-nums">
                  {d.priorityScore}/100
                  {d.useCaseCount > 0 && <> · {d.useCaseCount} caso{d.useCaseCount > 1 ? 's' : ''}</>}
                </p>
                <p className="text-[9px] text-text-subtle/60 mt-0.5 group-hover:text-navy/50 transition-colors">
                  Ver proyectos →
                </p>
              </button>
              {!isLast && <span className="text-text-subtle text-sm shrink-0">→</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────

function EditModal({
  domainCode,
  assessment,
  onSave,
  onCancel,
}: {
  domainCode: T5DomainCode
  assessment: T5DomainAssessment
  onSave:     (scores: T5DomainScores) => void
  onCancel:   () => void
}) {
  const [scores, setScores] = useState<T5DomainScores>({ ...assessment.scores })
  const domCfg = T5_DOMAIN_CONFIG[domainCode]
  const rec    = computeT5Recommendation(scores)
  const recCfg = T5_RECOMMENDATION_CONFIG[rec]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xl">{domCfg.icon}</span>
            <div>
              <p className="text-[10px] text-text-subtle font-mono uppercase tracking-wide">Editar evaluación</p>
              <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">{domCfg.label}</h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-text-subtle hover:text-lean-black dark:hover:text-gray-200 transition-colors text-lg w-7 h-7 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Sliders — use browser default rendering with accentColor for visible track */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {(Object.entries(T5_DIMENSION_CONFIG) as Array<[keyof T5DomainScores, (typeof T5_DIMENSION_CONFIG)[keyof T5DomainScores]]>).map(([key, cfg]) => {
            const val    = scores[key]
            const lblIdx = Math.min(4, Math.floor(val / 20))
            return (
              <div key={key}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-semibold text-lean-black dark:text-gray-200">{cfg.label}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: cfg.hex }}>
                    {val} — {cfg.scaleLabels[lblIdx]}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={val}
                  onChange={e => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: cfg.hex }}
                />
                <p className="text-[9px] text-text-subtle mt-1">{cfg.description}</p>
              </div>
            )
          })}
        </div>

        {/* Preview */}
        <div className="mx-6 mb-4 rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5">
          <p className="text-[9px] font-mono text-text-subtle uppercase tracking-wide mb-1.5">
            Recomendación resultante
          </p>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${recCfg.badgeBg} ${recCfg.badgeText}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: recCfg.hex }} />
            {recCfg.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(scores)}
            className="px-4 py-2 rounded-xl bg-navy-metallic text-white text-sm font-medium hover:bg-navy-metallic-hover transition-colors shadow-sm"
          >
            Guardar evaluación
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────

export function T5View({
  companyName,
  onBack,
}: {
  companyName: string
  onBack:      () => void
}) {
  const { canvas, updateDomainScores } = useT5Store()
  const processes                      = useT3Store(s => s.processes)

  const [selectedDomain,  setSelectedDomain]  = useState<T5DomainCode>('automatizacion_inteligente')
  const [editingDomain,   setEditingDomain]    = useState<T5DomainCode | null>(null)
  const [projectsDomain,  setProjectsDomain]   = useState<T5DomainCode | null>(null)

  return (
    <div className="max-w-[1200px] mx-auto space-y-5 px-8 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-lean-black dark:hover:text-gray-200 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Volver
          </button>
          <div className="w-px h-5 bg-border" />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy text-white">
                T5
              </span>
              <h1 className="text-lg font-semibold text-lean-black dark:text-gray-100">
                AI Domain Architecture Canvas
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-text-subtle">{companyName}</p>
              <PhaseMiniMap phaseId="evaluate" toolCode="T5" />
            </div>
          </div>
        </div>
        <MaturityBadge level={canvas.maturityLevel} />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-12 gap-5 items-start">
        <div className="col-span-7">
          <PortfolioMatrix
            canvas={canvas}
            processes={processes}
            selectedDomain={selectedDomain}
            onSelectDomain={setSelectedDomain}
          />
        </div>
        <div className="col-span-5">
          <DomainCard
            assessment={canvas.domains[selectedDomain]}
            onEdit={() => setEditingDomain(selectedDomain)}
          />
        </div>
      </div>

      {/* ── Activation sequence ── */}
      <ActivationSequence
        canvas={canvas}
        onCardClick={setProjectsDomain}
      />

      {/* ── Modals ── */}
      {editingDomain && (
        <EditModal
          domainCode={editingDomain}
          assessment={canvas.domains[editingDomain]}
          onSave={(scores) => {
            updateDomainScores(editingDomain, scores)
            setEditingDomain(null)
          }}
          onCancel={() => setEditingDomain(null)}
        />
      )}

      {projectsDomain && (
        <DomainProjectsModal
          domainCode={projectsDomain}
          onClose={() => setProjectsDomain(null)}
        />
      )}
    </div>
  )
}
