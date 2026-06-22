// ============================================================
// ResultPhase — Step 3 of ProcessInterviewModal
// ============================================================

import { useState } from 'react'
import {
  AI_CATEGORY_CONFIG,
  READINESS_CONFIG,
  computeProcessInterviewResult,
} from '../constants'
import type { InterviewAnswerCode, AICategoryCode, OrgReadinessLevel, NewValueStreamForm } from '../types'
import { Select }  from '@/shared/design-system/components/Select'
import { Button, Badge } from '@shared/design-system/components'
import { CategoryBadge } from './T3Badges'
import { T3_QUADRANT_COLORS } from '@shared/design-system/charts/chartTokens'

interface ResultPhaseProps {
  formData:  NewValueStreamForm
  answers:   Record<number, InterviewAnswerCode>
  onConfirm: (
    aiCategory:   AICategoryCode,
    orgReadiness: OrgReadinessLevel,
    manualOverride: boolean
  ) => void
  onBack: () => void
}

export function ResultPhase({ formData, answers, onConfirm, onBack }: ResultPhaseProps) {
  const result = computeProcessInterviewResult(answers)
  const cfg    = AI_CATEGORY_CONFIG[result.aiCategory]

  const [aiCategory, setAiCategory]     = useState<AICategoryCode>(result.aiCategory)
  const [orgReadiness, setOrgReadiness] = useState<OrgReadinessLevel>(result.orgReadiness)
  const manualOverride = aiCategory !== result.aiCategory || orgReadiness !== result.orgReadiness

  const ALL_CATEGORIES: AICategoryCode[] = [
    'automatizacion_inteligente', 'automatizacion_rpa',
    'analitica_predictiva', 'asistente_ia', 'optimizacion_proceso', 'agéntica',
  ]
  const ALL_READINESS: OrgReadinessLevel[] = ['alta', 'media', 'baja']

  const scoreBars = [
    { label: 'AUTOMATIZACIÓN', value: result.automationScore, hex: '#6A90C0',                          light: '#B8D0E8' },
    { label: 'DATOS',          value: result.dataScore,       hex: T3_QUADRANT_COLORS.pilotarYa,       light: '#B4E4CF' },
    { label: 'VOLUMEN',        value: result.volumeScore,     hex: T3_QUADRANT_COLORS.quickWins,       light: '#C8DAE8' },
    { label: 'IMPACTO',        value: result.impactScore,     hex: T3_QUADRANT_COLORS.prepararTerreno, light: '#E8D0A0' },
    { label: 'READINESS',      value: result.readinessScore,  hex: '#C06060',                          light: '#DDA8A8' },
  ]

  const MAX = 4
  const LBL_W = 72, G1 = 8, TRACK_W = 120, G2 = 6, VAL_COL = 26
  const VBW = LBL_W + G1 + TRACK_W + G2 + VAL_COL
  const TX   = LBL_W + G1
  const ROW_H = 36, VBH = scoreBars.length * ROW_H + 8

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
          Paso 3 de 3 · Resultado del análisis
        </p>
        <h3 className="text-base font-semibold text-lean-black dark:text-gray-100">
          Categoría IA asignada
        </h3>
      </div>

      {/* Proceso identificado */}
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border border-border dark:border-white/6">
        <p className="text-xs font-medium text-text-muted">{formData.department}</p>
        <p className="text-sm font-semibold text-lean-black dark:text-gray-100">{formData.name}</p>
        {formData.owner && (
          <p className="text-xs text-text-subtle mt-0.5">{formData.owner} · {formData.ownerRole}</p>
        )}
      </div>

      {/* Categoría auto-asignada */}
      <div className="rounded-xl border border-border dark:border-white/10 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
          <CategoryBadge category={result.aiCategory} />
          <span className="text-[11px] text-text-subtle">
            Score oportunidad: <strong className="text-lean-black dark:text-gray-200">{result.opportunityScore.toFixed(2)}</strong>/4.00
          </span>
          {manualOverride && (
            <Badge variant="warning" shape="pill" size="xs" className="ml-auto">
              Ajuste manual
            </Badge>
          )}
        </div>
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">{cfg.tagline}</p>
          <p className="text-xs text-text-muted leading-relaxed">{cfg.description}</p>
        </div>
      </div>

      {/* Score bars */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
          Scores del diagnóstico
        </p>
        <svg viewBox={`0 0 ${VBW} ${VBH}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            {scoreBars.map(({ label, hex, light }, i) => {
              const fillW = Math.max((scoreBars[i].value / MAX) * TRACK_W, 2)
              return (
                <linearGradient
                  key={label}
                  id={`ri-bar-${i}`}
                  x1={TX} y1="0" x2={TX + fillW} y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%"   stopColor={hex}   stopOpacity="0.15" />
                  <stop offset="30%"  stopColor={hex}   stopOpacity="0.92" />
                  <stop offset="58%"  stopColor={light} stopOpacity="1" />
                  <stop offset="85%"  stopColor={hex}   stopOpacity="0.80" />
                  <stop offset="100%" stopColor={hex}   stopOpacity="0.40" />
                </linearGradient>
              )
            })}
          </defs>
          {scoreBars.map(({ label, value, hex, light }, i) => {
            const fillW = Math.max((value / MAX) * TRACK_W, 2)
            const cy    = i * ROW_H + ROW_H / 2 + 3
            return (
              <g key={label}>
                <text x={0} y={cy + 3} fontSize={7} fill={T3_QUADRANT_COLORS.axisLabel}
                  fontFamily="ui-monospace,monospace" letterSpacing="0.05em">
                  {label}
                </text>
                <rect x={TX} y={cy - 0.4} width={TRACK_W} height={0.8} fill={hex} opacity={0.08} rx={0.4} />
                <rect x={TX} y={cy - 3} width={fillW} height={6} fill={hex} opacity={0.10} rx={3} />
                <rect x={TX} y={cy - 1.5} width={fillW} height={3} fill={`url(#ri-bar-${i})`} rx={1.5} />
                <rect x={TX + fillW * 0.08} y={cy - 2} width={fillW * 0.45} height={0.7}
                  fill={light} opacity={0.60} rx={0.35} />
                <text x={TX + TRACK_W + G2} y={cy + 3} fontSize={8} fontWeight="600" fill={T3_QUADRANT_COLORS.evaluar}
                  fontFamily="ui-monospace,monospace">
                  {value.toFixed(1)}<tspan fontSize={6.5} opacity={0.5}>/4</tspan>
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Ajuste manual */}
      <div className="rounded-xl border border-border dark:border-white/10 px-4 py-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-3">
          Ajuste del consultor (opcional)
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Categoría IA"
            options={ALL_CATEGORIES.map((c) => ({ value: c, label: AI_CATEGORY_CONFIG[c].label }))}
            value={aiCategory}
            onChange={(e) => setAiCategory(e.target.value as AICategoryCode)}
          />
          <Select
            label="Readiness del equipo"
            options={ALL_READINESS.map((r) => ({ value: r, label: READINESS_CONFIG[r].label }))}
            value={orgReadiness}
            onChange={(e) => setOrgReadiness(e.target.value as OrgReadinessLevel)}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onBack}>
          ← Volver
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-[2]"
          onClick={() => onConfirm(aiCategory, orgReadiness, manualOverride)}
        >
          Añadir proceso al mapa
        </Button>
      </div>
    </div>
  )
}
