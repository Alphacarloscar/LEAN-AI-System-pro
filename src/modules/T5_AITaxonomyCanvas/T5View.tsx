// ============================================================
// T5 — AI Domain Architecture Canvas
//
// Mapa de portafolio estratégico de los 6 dominios IA.
// Posiciona cada dominio en una matriz Valor vs. Madurez Técnica
// y genera recomendaciones de activación + governance matrix.
//
// Diseñado como entregable wow para CIOs y CEOs.
// ============================================================

import { useState } from 'react'
import type { T5Canvas, T5DomainCode, T5DomainScores, T5DomainAssessment } from './types'
import {
  T5_DOMAIN_CONFIG,
  T5_RECOMMENDATION_CONFIG,
  T5_DIMENSION_CONFIG,
  T5_MATURITY_CONFIG,
  computeT5Recommendation,
} from './constants'
import { useT5Store } from './store'

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

// ── Portfolio Matrix ──────────────────────────────────────────

function PortfolioMatrix({
  canvas,
  selectedDomain,
  onSelectDomain,
}: {
  canvas:          T5Canvas
  selectedDomain:  T5DomainCode
  onSelectDomain:  (c: T5DomainCode) => void
}) {
  const domains = Object.values(canvas.domains)

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border p-5 h-full flex flex-col">
      <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
        Portfolio map — 6 dominios IA
      </p>
      <p className="text-[10px] text-text-subtle mb-4">
        Haz clic en un dominio para ver su ficha de governance
      </p>

      <div className="flex gap-2 flex-1">
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

        {/* Chart + x-axis */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {/* Chart area */}
          <div className="relative flex-1 rounded-xl overflow-hidden border border-border/60 min-h-[260px]">

            {/* Quadrant backgrounds */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
              <div className="bg-warning-light/45 border-r border-b border-border/30" />
              <div className="bg-success-light/45 border-b border-border/30" />
              <div className="bg-gray-100/80 border-r border-border/30 dark:bg-gray-800/40" />
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

            {/* Domain chips */}
            {domains.map(d => {
              const domCfg     = T5_DOMAIN_CONFIG[d.domainCode]
              const recCfg     = T5_RECOMMENDATION_CONFIG[d.recommendation]
              const isSelected = selectedDomain === d.domainCode
              // Size proportional to use-case count
              const size = Math.max(64, Math.min(80, 64 + d.useCaseCount * 5))

              // X: technicalReady 0→100 maps to 6%→90%
              // Y (top): businessValue inverted — 100 → near top (6%), 0 → near bottom (90%)
              const xPct = 6 + (d.scores.technicalReady / 100) * 82
              const yPct = 6 + ((100 - d.scores.businessValue) / 100) * 82

              return (
                <button
                  key={d.domainCode}
                  title={`${domCfg.label} — ${recCfg.label}`}
                  onClick={() => onSelectDomain(d.domainCode)}
                  className="absolute group"
                  style={{
                    left:      `${xPct}%`,
                    top:       `${yPct}%`,
                    width:      size,
                    height:     size,
                    transform: 'translate(-50%, -50%)',
                    zIndex:    isSelected ? 10 : 5,
                  }}
                >
                  <div
                    className={`w-full h-full rounded-full flex flex-col items-center justify-center
                      transition-all duration-200 ${isSelected ? 'scale-115' : 'hover:scale-105'}`}
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
                      style={{ maxWidth: size - 10, wordBreak: 'break-word', padding: '0 3px' }}
                    >
                      {domCfg.shortLabel}
                    </span>
                    <span className="text-[8px] tabular-nums text-text-subtle select-none">
                      {d.priorityScore}
                    </span>
                  </div>

                  {/* Hover tooltip */}
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 whitespace-nowrap"
                  >
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
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border p-5 flex flex-col gap-4 h-full overflow-y-auto">

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
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Governance
        </p>

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
            <p className="text-[10px] text-warning-dark leading-relaxed">
              ⚠️ {assessment.governanceNotes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Activation Sequence ───────────────────────────────────────

function ActivationSequence({ canvas }: { canvas: T5Canvas }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-border p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
        Secuencia de activación recomendada
      </p>
      <p className="text-[10px] text-text-subtle mb-4">
        Orden de implementación basado en score compuesto y nivel de riesgo
      </p>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {canvas.activationSequence.map((code, idx) => {
          const d       = canvas.domains[code]
          const domCfg  = T5_DOMAIN_CONFIG[code]
          const recCfg  = T5_RECOMMENDATION_CONFIG[d.recommendation]
          const isLast  = idx === canvas.activationSequence.length - 1
          return (
            <div key={code} className="flex items-center gap-2 shrink-0">
              <div className="rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3 min-w-[155px]">
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
                  Score: {d.priorityScore}/100
                  {d.useCaseCount > 0 && (
                    <> · {d.useCaseCount} caso{d.useCaseCount > 1 ? 's' : ''}</>
                  )}
                </p>
              </div>
              {!isLast && (
                <span className="text-text-subtle text-sm shrink-0">→</span>
              )}
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

        {/* Sliders */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {(Object.entries(T5_DIMENSION_CONFIG) as Array<[keyof T5DomainScores, (typeof T5_DIMENSION_CONFIG)[keyof T5DomainScores]]>).map(([key, cfg]) => {
            const val    = scores[key]
            const lblIdx = Math.min(4, Math.floor(val / 20))
            return (
              <div key={key}>
                <div className="flex justify-between items-baseline mb-1.5">
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
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: cfg.hex }}
                />
                <p className="text-[9px] text-text-subtle mt-1">{cfg.description}</p>
              </div>
            )
          })}
        </div>

        {/* Preview recommendation */}
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
            className="px-4 py-2 rounded-xl bg-navy text-white text-sm font-medium hover:bg-navy/90 transition-colors"
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
  const [selectedDomain, setSelectedDomain] = useState<T5DomainCode>('automatizacion_inteligente')
  const [editingDomain,  setEditingDomain]  = useState<T5DomainCode | null>(null)

  return (
    <div className="max-w-[1200px] mx-auto space-y-5 px-8 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-lean-black dark:hover:text-gray-200 transition-colors"
          >
            ← Volver
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
            <p className="text-xs text-text-subtle">{companyName} · Fase Evaluate</p>
          </div>
        </div>
        <MaturityBadge level={canvas.maturityLevel} />
      </div>

      {/* ── Main grid: portfolio matrix + governance card ── */}
      <div className="grid grid-cols-12 gap-5 items-start">
        <div className="col-span-7">
          <PortfolioMatrix
            canvas={canvas}
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
      <ActivationSequence canvas={canvas} />

      {/* ── Edit modal ── */}
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
    </div>
  )
}
