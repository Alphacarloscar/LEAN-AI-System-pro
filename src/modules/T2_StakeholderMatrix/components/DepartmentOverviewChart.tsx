// ============================================================
// T2 — DepartmentOverviewChart
//
// Gráfico de barras apiladas metálicas (SVG) mostrando la
// composición por departamento y arquetipos.
// ============================================================

import { useMemo } from 'react'
import type { Stakeholder, ArchetypeCode } from '../types'
import { ARCHETYPE_HEX as ARCH_HEX } from './quadrantChartHelpers'

const ARCH_ORDER: ArchetypeCode[] = ['decisor', 'ambassador', 'adoptador', 'critico', 'reticente']

// Segmentos con altura < MIN_SEG_H no muestran número interno.
// El total siempre se muestra encima de la barra.
const MIN_SEG_H = 18

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

  const BW  = 36   // ancho de barra — mínimo 32px, aumentado a 36 para más respiro
  const GAP = 28   // gap entre barras ≤ BW (ratio 1:1)
  const LM  = 32   // margen izquierdo (eje Y)
  const RM  = 16   // margen derecho
  const CH  = 140  // altura del área de barras
  const TM  = 24   // margen superior (espacio para total encima de barra)
  // LH: espacio bajo las barras para labels rotadas + dot de riesgo
  // Labels de ~10ch a 9px, rotadas -35° → proyección vertical ≈ sin(35°)*longitud
  // Reservamos 72px para cubrir etiquetas largas como "Operaciones"
  const LH  = 76
  const VBW = LM + deptData.length * (BW + GAP) - GAP + RM
  const VBH = TM + CH + LH

  // Posición Y del baseline (donde arranca la zona de labels del eje X)
  const BASELINE_Y = TM + CH

  // Punto de anclaje de las labels del eje X: 14px bajo el baseline
  const LABEL_Y = BASELINE_Y + 14

  const yTicks = Array.from({ length: maxCount + 1 }, (_, i) => i)

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-warm-800 px-5 py-4">
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

          {/* Eje Y */}
          <line x1={LM} y1={TM} x2={LM} y2={BASELINE_Y} stroke="var(--color-border)" strokeWidth={0.5} />

          {/* Baseline del eje X */}
          <line x1={LM} y1={BASELINE_Y} x2={VBW - RM} y2={BASELINE_Y}
            stroke="#D4D0C8" strokeWidth={1} />

          {/* Grid horizontal + ticks del eje Y */}
          {yTicks.map((tick) => {
            const ty = TM + CH - (tick / maxCount) * CH
            return (
              <g key={tick}>
                {tick > 0 && (
                  <line x1={LM} y1={ty} x2={VBW - RM} y2={ty}
                    stroke="#D4D0C8" strokeWidth={0.5} strokeDasharray="3 4" opacity={0.5} />
                )}
                <text x={LM - 6} y={ty + 3} textAnchor="end" fontSize={9} fill="#9A9790"
                  fontFamily="ui-monospace,monospace">{tick}</text>
              </g>
            )
          })}

          {/* Barras por departamento */}
          {deptData.map(({ dept, segments, riskScore }, i) => {
            const bx = LM + i * (BW + GAP)
            let curY = BASELINE_Y
            const rects = segments.map(({ arch, count }) => {
              const segH = Math.max((count / maxCount) * CH, 1)
              const rectY = curY - segH
              curY = rectY
              return { arch, count, segH, rectY }
            })
            const topY    = rects[0]?.rectY ?? BASELINE_Y
            const topArch = rects[0]?.arch
            const isRisk  = riskScore > 0

            // Centro horizontal de la barra
            const cx = bx + BW / 2

            return (
              <g key={dept}>
                {/* Fondo de riesgo sutil */}
                {isRisk && (
                  <rect x={bx - 3} y={topY - 2} width={BW + 6} height={BASELINE_Y - topY + 2}
                    fill={ARCH_HEX.critico} opacity={0.06} rx={3} />
                )}

                {/* Segmentos apilados */}
                {rects.map(({ arch, count, segH, rectY }, ri) => (
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
                    {/* Separador entre segmentos */}
                    {ri < rects.length - 1 && (
                      <line x1={bx} y1={rectY + segH} x2={bx + BW} y2={rectY + segH}
                        stroke="white" strokeWidth={0.8} opacity={0.4} />
                    )}
                    {/* Número dentro del segmento: visible si hay altura suficiente y no es el segmento top (el total ya se muestra encima) */}
                    {segH >= MIN_SEG_H && ri !== 0 && (
                      <text
                        x={cx}
                        y={rectY + segH / 2 + 3}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight="600"
                        fill="white"
                        opacity={0.9}
                        fontFamily="ui-monospace,monospace"
                      >
                        {count}
                      </text>
                    )}
                  </g>
                ))}

                {/* Línea brillante en el top de la barra */}
                {topArch && (
                  <rect x={bx + 1} y={topY} width={BW - 2} height={0.6}
                    fill="white" opacity={0.35} rx={0.3} />
                )}


                {/* Etiqueta del departamento: rotada -35°, anclada al punto de inicio de rotación */}
                <text
                  x={cx}
                  y={LABEL_Y}
                  textAnchor="end"
                  fontSize={9}
                  fill={isRisk ? ARCH_HEX.critico : '#9A9790'}
                  fontFamily="Inter,system-ui,sans-serif"
                  transform={`rotate(-35, ${cx}, ${LABEL_Y})`}
                >
                  {dept}
                </text>

              </g>
            )
          })}
        </svg>
      </div>

    </div>
  )
}
