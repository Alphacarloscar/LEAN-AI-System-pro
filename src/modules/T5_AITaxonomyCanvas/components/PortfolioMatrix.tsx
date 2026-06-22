// ============================================================
// T5 — PortfolioMatrix
//
// Mapa de portfolio: 6 burbujas de dominio en espacio
// valor-negocio × madurez-técnica, con resolución de colisiones.
// Incluye tabla de adopción por departamento.
// ============================================================

import { useState, useMemo } from 'react'
import { Settings, Cpu, TrendingUp, MessageSquare, RefreshCw, Network } from 'lucide-react'
import {
  T5_DOMAIN_CONFIG,
  T5_RECOMMENDATION_CONFIG,
} from '../constants'
import { Card } from '@shared/design-system/components'
import type { T5Canvas, T5DomainCode } from '../types'
import { DeptCategoryModal } from './DeptCategoryModal'

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

// ── Department dot palette — tokens from tailwind.config.ts ──
// Mirrors T7 DEPT_CFG. Hex sourced exclusively from the token registry:
// info-dark=#6A90C0  success-dark=#5FAF8A  warning-dark=#D4A85C
// gold=#C8860A       danger-dark=#C06060   silver=#C4C0B8
const DEPT_DOT: Record<string, string> = {
  'Dirección General':     '#6A90C0',  // info-dark
  'Dirección':             '#6A90C0',  // info-dark
  'IT / Tecnología':       '#5FAF8A',  // success-dark
  'IT':                    '#5FAF8A',  // success-dark
  'Operaciones':           '#D4A85C',  // warning-dark
  'Marketing & Comercial': '#C8860A',  // gold
  'Marketing':             '#C8860A',  // gold
  'RRHH':                  '#C06060',  // danger-dark
}

function deptDotColor(dept: string): string {
  return DEPT_DOT[dept] ?? '#C4C0B8'  // silver fallback
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
                  const recCfg = T5_RECOMMENDATION_CONFIG[canvas.domains[code].recommendation]
                  return (
                    <th key={code} className="text-center pb-3 px-1">
                      <button
                        onClick={() => onSelectDomain(code)}
                        title={domCfg.label}
                        className="mx-auto flex flex-col items-center gap-1.5
                          transition-all duration-150 hover:scale-105 focus:outline-none"
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            border:          `2px solid ${recCfg.hex}`,
                            backgroundColor: recCfg.hex + '22',
                            color:           recCfg.hex,
                          }}
                        >
                          {DOMAIN_ICON_MAP[domCfg.icon] ?? <Settings size={14} strokeWidth={1.5} />}
                        </span>
                        <span className="text-[11px] font-medium tracking-tight text-slate-600 dark:text-slate-400 whitespace-nowrap">
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
                  <td className="py-1.5 pr-3 leading-tight max-w-[128px]" title={dept}>
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: deptDotColor(dept) }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium text-lean-black dark:text-gray-200">
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
        <p className="text-[9px] text-text-muted/60 mt-2">
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
  const domains = Object.values(canvas.domains)

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
    <Card variant="outlined" padding="none" className="rounded-2xl p-5">
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
            className="relative rounded-xl overflow-hidden border border-border/60"
            style={{ height: COLL_H }}
          >
            {/* Quadrant backgrounds */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
              <div className="bg-warning-light/45 dark:bg-amber-900/20 border-r border-b border-border/30" />
              <div className="bg-success-light/45 dark:bg-emerald-900/20 border-b border-border/30" />
              <div className="bg-gray-100/80 dark:bg-gray-700/35 border-r border-border/30" />
              <div className="bg-info-light/20 dark:bg-blue-900/20" />
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
                      color: recCfg.hex,
                    }}
                  >
                    <span className="leading-none select-none">{DOMAIN_ICON_MAP[domCfg.icon] ?? <Settings size={14} strokeWidth={1.5} />}</span>
                    <span
                      className="text-[8px] font-bold leading-tight text-center text-lean-black dark:text-gray-200 select-none"
                      style={{ maxWidth: pos.size - 10, wordBreak: 'break-word', padding: '0 3px' }}
                    >
                      {domCfg.shortLabel}
                    </span>
                    <span className="text-[8px] tabular-nums text-text-muted select-none">
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
            <span className="text-[9px] text-text-muted">← Baja madurez técnica</span>
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
    </Card>
  )
}
