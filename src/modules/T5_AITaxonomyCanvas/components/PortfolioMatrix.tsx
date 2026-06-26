// ============================================================
// T5 — PortfolioMatrix
//
// Mapa de portfolio: 6 burbujas de dominio en espacio
// valor-negocio × madurez-técnica, con resolución de colisiones.
// Incluye tabla de adopción por departamento.
// ============================================================

import { useState, useMemo, useCallback } from 'react'
import { useIsDark } from '@/shared/hooks/useDarkMode'
import { Settings, Cpu, TrendingUp, MessageSquare, RefreshCw, Network } from 'lucide-react'
import {
  T5_DOMAIN_CONFIG,
  T5_RECOMMENDATION_CONFIG,
} from '../constants'
import { Card } from '@shared/design-system/components'
import type { T5Canvas, T5DomainCode } from '../types'
import { DeptCategoryModal } from './DeptCategoryModal'
import { deptCfg } from '@/modules/T7_AdoptionHeatmap/T7Constants'

const DOMAIN_ICON_MAP: Record<string, React.ReactElement> = {
  settings:        <Settings      size={14} strokeWidth={1.5} />,
  cpu:             <Cpu           size={14} strokeWidth={1.5} />,
  'trending-up':   <TrendingUp    size={14} strokeWidth={1.5} />,
  'message-square':<MessageSquare size={14} strokeWidth={1.5} />,
  'refresh-cw':    <RefreshCw     size={14} strokeWidth={1.5} />,
  network:         <Network       size={14} strokeWidth={1.5} />,
}

// ── Collision resolution ──────────────────────────────────────

const COLL_W   = 520
const COLL_H   = 295
const COLL_GAP = 10

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

    for (const p of result) {
      const r = p.size / 2
      p.xPx = Math.max(r + 2, Math.min(COLL_W - r - 2, p.xPx))
      p.yPx = Math.max(r + 2, Math.min(COLL_H - r - 2, p.yPx))
    }

    if (!anyMoved) break
  }

  return result
}


// ── All domain codes constant ─────────────────────────────────

const ALL_DOMAIN_CODES: T5DomainCode[] = [
  'automatizacion_rpa', 'automatizacion_inteligente',
  'analitica_predictiva', 'asistente_ia', 'optimizacion_proceso', 'agéntica',
]

// ── Department Adoption Chart (inner) ────────────────────────

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
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">
          Adopción por departamento
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="text-left pb-3 pr-3 font-medium text-text-muted w-32" />
                {ALL_DOMAIN_CODES.map(code => {
                  const domCfg = T5_DOMAIN_CONFIG[code]
                  return (
                    <th key={code} className="text-center pb-3 px-1 align-top">
                      <button
                        onClick={() => onSelectDomain(code)}
                        title={domCfg.label}
                        className="mx-auto flex flex-col items-center gap-1.5
                          transition-all duration-150 hover:scale-105 focus:outline-none"
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0
                            border-2 border-warm-200 dark:border-warm-600 bg-warm-100 dark:bg-warm-700
                            text-warm-600 dark:text-warm-300"
                        >
                          {DOMAIN_ICON_MAP[domCfg.icon] ?? <Settings size={14} strokeWidth={1.5} />}
                        </span>
                        <span className="text-[10px] font-medium tracking-tight text-warm-600 dark:text-warm-400 text-center leading-tight" style={{ maxWidth: 72, minHeight: '2.5em' }}>
                          {domCfg.label}
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
                  <td className="py-1.5 pr-3 leading-tight max-w-[128px]" title={dept}>
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: deptCfg(dept).fill }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium text-lean-black dark:text-warm-100">
                        {dept.split('/')[0].trim()}
                      </span>
                    </span>
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
                            backgroundColor: active ? deptCfg(dept).fill : 'transparent',
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
        <p className="text-xs text-text-muted mt-2">
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

// ── Portfolio Matrix (main export) ───────────────────────────

interface PortfolioMatrixProps {
  canvas:         T5Canvas
  processes:      Array<{ department: string; aiCategory: string }>
  selectedDomain: T5DomainCode
  onSelectDomain: (c: T5DomainCode) => void
}

export function PortfolioMatrix({
  canvas,
  processes,
  selectedDomain,
  onSelectDomain,
}: PortfolioMatrixProps) {
  const isDark  = useIsDark()
  const domains = Object.values(canvas.domains)
  const [hoveredCode, setHoveredCode] = useState<T5DomainCode | null>(null)
  const handleMouseEnter = useCallback((code: T5DomainCode) => setHoveredCode(code), [])
  const handleMouseLeave = useCallback(() => setHoveredCode(null), [])

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
    <Card variant="outlined" padding="none" className="rounded-xl p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-text-muted mb-1">
        Portfolio map — 6 dominios IA
      </p>
      <p className="text-[10px] text-text-muted mb-4">
        Haz clic en un dominio para ver su ficha de governance
      </p>

      <div className="flex gap-2">
        {/* Y-axis label */}
        <div className="flex flex-col justify-between items-center shrink-0 pb-7">
          <span className="text-[9px] font-semibold text-success-dark">Alto</span>
          <div className="flex-1 flex items-center justify-center">
            <span
              className="text-[9px] text-text-muted whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Valor de negocio →
            </span>
          </div>
          <span className="text-[9px] font-semibold text-text-muted">Bajo</span>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          {/* Chart area */}
          <div
            className="relative rounded-xl border border-border/60"
            style={{ height: COLL_H }}
          >
            {/* Quadrant backgrounds */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
              <div className="bg-warning-light/45 dark:bg-warm-800/40 border-r border-b border-border/30" />
              <div className="bg-success-light/45 dark:bg-warm-800/30 border-b border-border/30" />
              <div className="bg-info-light/25 dark:bg-warm-700/35 border-r border-border/30" />
              <div className="bg-danger-light/20 dark:bg-warm-800/20" />
            </div>

            {/* Quadrant labels */}
            <span className="absolute top-2 left-3 text-[11px] font-semibold text-warning-dark/80 pointer-events-none select-none">
              Pilotar 90 días
            </span>
            <span className="absolute top-2 right-3 text-[11px] font-semibold text-success-dark/80 pointer-events-none select-none">
              Activar ahora
            </span>
            <span className="absolute bottom-2 left-3 text-[11px] font-semibold text-info-dark/70 pointer-events-none select-none">
              Preparar foundations
            </span>
            <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-danger-dark/70 pointer-events-none select-none">
              Gobernar antes de expandir
            </span>

            {/* Domain chips */}
            {domains.map(d => {
              const pos        = resolvedPositions.find(p => p.code === d.domainCode)
              if (!pos) return null
              const domCfg     = T5_DOMAIN_CONFIG[d.domainCode]
              const recCfg     = T5_RECOMMENDATION_CONFIG[d.recommendation]
              const isSelected = selectedDomain === d.domainCode

              const isHovered = hoveredCode === d.domainCode
              return (
                <button
                  key={d.domainCode}
                  title={`${domCfg.label} — ${recCfg.label}`}
                  onClick={() => onSelectDomain(d.domainCode)}
                  onMouseEnter={() => handleMouseEnter(d.domainCode)}
                  onMouseLeave={handleMouseLeave}
                  className="absolute"
                  style={{
                    left:      pos.xPx,
                    top:       pos.yPx,
                    width:     pos.size,
                    height:    pos.size,
                    transform: 'translate(-50%, -50%)',
                    zIndex:    isHovered ? 30 : isSelected ? 10 : 5,
                  }}
                >
                  <div
                    className="w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-200"
                    style={{
                      transform:       isSelected ? 'scale(1.12)' : isHovered ? 'scale(1.05)' : 'scale(1)',
                      border:          isSelected
                        ? '2.5px solid #C8860A'
                        : isHovered
                          ? '2.5px solid rgba(138,133,124,0.7)'
                          : '2px solid rgba(138,133,124,0.35)',
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(200,134,10,0.18)' : 'rgba(200,134,10,0.10)')
                        : (isDark ? 'rgba(42,40,34,0.55)'   : 'rgba(247,244,238,0.80)'),
                      boxShadow: isSelected
                        ? '0 0 0 3px rgba(200,134,10,0.18), 0 6px 20px rgba(200,134,10,0.20)'
                        : isHovered
                          ? '0 4px 12px rgba(138,133,124,0.20)'
                          : '0 1px 4px rgba(138,133,124,0.12)',
                      color: isSelected ? '#C8860A' : isDark ? '#9A9790' : '#6B6864',
                    }}
                  >
                    <span className="leading-none select-none">{DOMAIN_ICON_MAP[domCfg.icon] ?? <Settings size={14} strokeWidth={1.5} />}</span>
                    <span
                      className="text-[8px] font-bold leading-tight text-center select-none"
                      style={{
                        maxWidth:  pos.size - 10,
                        wordBreak: 'break-word',
                        padding:   '0 3px',
                        color:     isSelected ? '#C8860A' : isDark ? '#C4C0B8' : '#2A2822',
                      }}
                    >
                      {domCfg.shortLabel}
                    </span>
                    <span
                      className="text-[8px] tabular-nums select-none"
                      style={{ color: isSelected ? 'rgba(200,134,10,0.75)' : isDark ? '#6B6864' : '#9A9790' }}
                    >
                      {d.priorityScore}
                    </span>
                  </div>

                  {/* Tooltip — visible cuando isHovered, encima de todo por z-index del padre */}
                  {isHovered && (() => {
                    const above = pos.yPx > COLL_H / 2
                    return (
                      <div className={[
                        'absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center',
                        'whitespace-nowrap',
                        above ? 'bottom-full mb-1.5 flex-col' : 'top-full mt-1.5 flex-col-reverse',
                      ].join(' ')}>
                        <div className="bg-lean-black text-white text-[10px] rounded-lg px-3 py-2 shadow-md">
                          <p className="font-semibold mb-1.5 text-warm-200">{domCfg.label}</p>
                          <p className="text-white/60">Valor de negocio: <span className="text-white font-medium">{d.scores.businessValue}</span></p>
                          <p className="text-white/60">Madurez técnica: <span className="text-white font-medium">{d.scores.technicalReady}</span></p>
                          <p className="text-white/60">Casos de uso: <span className="text-white font-medium">{d.useCaseCount}</span></p>
                        </div>
                        <div className="w-2 h-2 bg-lean-black rotate-45 shrink-0" style={{ marginTop: above ? -4 : 0, marginBottom: above ? 0 : -4 }} />
                      </div>
                    )
                  })()}
                </button>
              )
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] text-text-muted">← Baja madurez técnica</span>
            <span className="text-[9px] text-info-dark">Alta madurez técnica →</span>
          </div>
        </div>
      </div>


      {/* Department adoption chart */}
      <DepartmentAdoptionChart
        processes={processes}
        canvas={canvas}
        onSelectDomain={onSelectDomain}
      />
    </Card>
  )
}
