// ============================================================
// T2 — DepartmentOverviewChart
//
// Gráfico de barras apiladas metálicas (SVG) mostrando la
// composición por departamento y arquetipos.
// ============================================================

import { useMemo } from 'react'
import type { Stakeholder, ArchetypeCode } from '../types'

const ARCH_HEX: Record<ArchetypeCode, string> = {
  adoptador:  '#5FAF8A',
  ambassador: '#6A90C0',
  decisor:    '#2A2822',
  critico:    '#C06060',
  reticente:  '#D4A85C',
}

const ARCH_ORDER: ArchetypeCode[] = ['decisor', 'ambassador', 'adoptador', 'critico', 'reticente']

interface DepartmentOverviewChartProps {
  stakeholders: Stakeholder[]
}

export function DepartmentOverviewChart({ stakeholders }: DepartmentOverviewChartProps) {
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
        riskScore: members.filter(
          (m) => m.archetype === 'critico' || m.resistance === 'alta'
        ).length,
        segments: ARCH_ORDER
          .map((arch) => ({ arch, count: members.filter((m) => m.archetype === arch).length }))
          .filter((seg) => seg.count > 0),
      }))
      .sort((a, b) => b.riskScore - a.riskScore || b.total - a.total)
  }, [stakeholders])

  if (deptData.length === 0) return null

  const maxCount = Math.max(...deptData.map((d) => d.total), 1)

  const BW    = 16
  const GAP   = 34
  const LM    = 32
  const RM    = 8
  const CH    = 140
  const TM    = 22
  const LH    = 42
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
            {ARCH_ORDER.map((arch) => {
              const hex = ARCH_HEX[arch]
              return (
                <linearGradient key={arch} id={`dmc-${arch}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor={hex}    stopOpacity="0.55" />
                  <stop offset="35%"  stopColor={hex}    stopOpacity="0.95" />
                  <stop offset="60%"  stopColor="white"  stopOpacity="0.18" />
                  <stop offset="100%" stopColor={hex}    stopOpacity="0.65" />
                </linearGradient>
              )
            })}
          </defs>

          <line x1={LM} y1={TM} x2={LM} y2={TM + CH} stroke="#E2E8F0" strokeWidth={0.5} />

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
                {isRisk && (
                  <rect x={bx - 3} y={topY - 2} width={BW + 6} height={TM + CH - topY + 2}
                    fill="#C06060" opacity={0.06} rx={3} />
                )}

                {rects.map(({ arch, segH, rectY }, ri) => (
                  <g key={arch}>
                    <rect x={bx} y={rectY} width={BW} height={segH}
                      fill={ARCH_HEX[arch]} opacity={0.82}
                      rx={ri === 0 ? 2 : 0}
                    />
                    <rect x={bx} y={rectY} width={BW} height={segH}
                      fill={`url(#dmc-${arch})`}
                      rx={ri === 0 ? 2 : 0}
                      style={{ mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'] }}
                    />
                    {ri < rects.length - 1 && (
                      <line x1={bx} y1={rectY + segH} x2={bx + BW} y2={rectY + segH}
                        stroke="white" strokeWidth={0.8} opacity={0.4} />
                    )}
                  </g>
                ))}

                {topArch && (
                  <rect x={bx + 1} y={topY} width={BW - 2} height={0.6}
                    fill="white" opacity={0.35} rx={0.3} />
                )}

                <text x={bx + BW / 2} y={topY - 6}
                  textAnchor="middle" fontSize={10} fontWeight="700"
                  fill={isRisk ? '#C06060' : '#64748B'}
                  fontFamily="ui-monospace,monospace"
                >
                  {total}
                </text>

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
                {isRisk && (
                  <circle cx={bx + BW / 2} cy={TM + CH + 36} r={2}
                    fill="#C06060" opacity={0.7} />
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
