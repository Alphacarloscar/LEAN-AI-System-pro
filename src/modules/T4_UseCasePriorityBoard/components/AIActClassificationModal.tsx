import { useState } from 'react'
import { usePermissions } from '@/modules/Auth'
import type { AIActScope, AIActClassification } from '../types'
import { computeAIActRisk } from '../types'

export const AIACT_RISK_CONFIG = {
  prohibido:      { label: 'Prohibido',       badgeBg: 'bg-red-100 dark:bg-red-900/30',      badgeText: 'text-red-700 dark:text-red-300',   hex: '#DC2626', icon: '🚫' },
  alto:           { label: 'Alto riesgo',     badgeBg: 'bg-danger-light dark:bg-red-900/20', badgeText: 'text-danger-dark',                 hex: '#EA580C', icon: '🔴' },
  limitado:       { label: 'Riesgo limitado', badgeBg: 'bg-warning-light',                  badgeText: 'text-warning-dark',                hex: '#D97706', icon: '🟡' },
  minimo:         { label: 'Riesgo mínimo',   badgeBg: 'bg-success-light',                  badgeText: 'text-success-dark',                hex: '#16A34A', icon: '🟢' },
  sin_clasificar: { label: 'Sin clasificar',  badgeBg: 'bg-warm-100 dark:bg-warm-700',       badgeText: 'text-gray-500 dark:text-gray-400', hex: '#94A3B8', icon: '⬜' },
} as const

export const AIACT_SCOPE_LABELS: Record<AIActScope, string> = {
  rrhh:                 'RRHH — Selección, evaluación o formación de personas',
  financiero_clientes:  'Financiero — Crédito, scoring o seguros a clientes',
  salud:                'Salud o servicios sanitarios',
  infraestructura:      'Infraestructura crítica (energía, transporte, agua)',
  seguridad:            'Seguridad — Identificación o control de acceso',
  educacion:            'Educación — Evaluación o acceso a formación',
  administracion:       'Administración pública o justicia',
  operaciones_internas: 'Operaciones internas (back-office, procesos)',
  cliente_marketing:    'Atención al cliente, marketing o ventas',
}

export function AIActClassificationModal({
  useCaseName,
  onSave,
  onCancel,
}: {
  useCaseName: string
  onSave:      (classification: AIActClassification) => void
  onCancel:    () => void
}) {
  const { isReadOnly } = usePermissions()
  const [scope,          setScope]          = useState<AIActScope | ''>('')
  const [personImpact,   setPersonImpact]   = useState<'no' | 'human_review' | 'autonomous' | ''>('')
  const [sensitiveData,  setSensitiveData]  = useState<boolean | null>(null)
  const [explainability, setExplainability] = useState<'yes' | 'no' | ''>('')

  const allAnswered = scope && personImpact !== '' && sensitiveData !== null && explainability

  const previewRisk = allAnswered
    ? computeAIActRisk(
        scope as AIActScope,
        personImpact as 'no' | 'human_review' | 'autonomous',
        sensitiveData!,
        explainability as 'yes' | 'no',
      )
    : null

  const riskCfg = previewRisk ? AIACT_RISK_CONFIG[previewRisk] : null

  function handleSave() {
    if (!allAnswered) return
    onSave({
      scope:          scope as AIActScope,
      personImpact:   personImpact as 'no' | 'human_review' | 'autonomous',
      sensitiveData:  sensitiveData!,
      explainability: explainability as 'yes' | 'no',
      riskLevel:      previewRisk!,
      classifiedAt:   new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-warm-800 rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy text-white">
                AI Act
              </span>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
                Clasificación regulatoria
              </p>
            </div>
            <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100 leading-tight">
              {useCaseName}
            </h3>
            <p className="text-[10px] text-text-subtle mt-1">
              Responde 4 preguntas para clasificar el riesgo regulatorio de este caso de uso.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-text-subtle hover:text-lean-black dark:hover:text-gray-200 text-lg w-7 h-7 flex items-center justify-center shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* P1 — Ámbito */}
          <div>
            <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">
              P1 · ¿En qué ámbito opera este sistema?
            </p>
            <p className="text-[10px] text-text-subtle mb-2">
              El sector determina si aplica el Anexo III del AI Act (alto riesgo automático).
            </p>
            <div className="flex flex-col gap-1.5">
              {(Object.entries(AIACT_SCOPE_LABELS) as [AIActScope, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setScope(key)}
                  className={[
                    'text-left px-3 py-2 rounded-xl border text-xs transition-all duration-100',
                    scope === key
                      ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100 font-medium'
                      : 'border-border text-text-muted hover:border-navy/30 hover:text-lean-black dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* P2 — Impacto en personas */}
          <div>
            <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">
              P2 · ¿El sistema toma decisiones que afectan a personas físicas?
            </p>
            <p className="text-[10px] text-text-subtle mb-2">
              No incluye decisiones sobre procesos o datos agregados de la empresa.
            </p>
            <div className="flex flex-col gap-1.5">
              {([
                { v: 'no',           l: 'No — opera sobre procesos o datos internos de la empresa' },
                { v: 'human_review', l: 'Sí — pero un humano revisa y aprueba cada decisión antes de aplicarla' },
                { v: 'autonomous',   l: 'Sí — de forma autónoma o con supervisión mínima' },
              ] as { v: 'no' | 'human_review' | 'autonomous'; l: string }[]).map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setPersonImpact(v)}
                  className={[
                    'text-left px-3 py-2 rounded-xl border text-xs transition-all duration-100',
                    personImpact === v
                      ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100 font-medium'
                      : 'border-border text-text-muted hover:border-navy/30 hover:text-lean-black dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* P3 — Datos sensibles */}
          <div>
            <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">
              P3 · ¿Utiliza o procesa datos de salud, biométricos, religión, origen étnico o datos sexuales?
            </p>
            <p className="text-[10px] text-text-subtle mb-2">
              Categorías especiales RGPD Art. 9 y datos biométricos identificativos.
            </p>
            <div className="flex gap-2">
              {([{ v: false, l: 'No' }, { v: true, l: 'Sí' }] as { v: boolean; l: string }[]).map(({ v, l }) => (
                <button
                  key={String(v)}
                  onClick={() => setSensitiveData(v)}
                  className={[
                    'flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-100',
                    sensitiveData === v
                      ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100'
                      : 'border-border text-text-muted hover:border-navy/30',
                  ].join(' ')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* P4 — Explicabilidad */}
          <div>
            <p className="text-xs font-semibold text-lean-black dark:text-gray-200 mb-0.5">
              P4 · ¿El output del sistema es explicable o trazable para el usuario afectado?
            </p>
            <p className="text-[10px] text-text-subtle mb-2">
              El sistema puede justificar por qué tomó una decisión o recomendación concreta.
            </p>
            <div className="flex gap-2">
              {([
                { v: 'yes', l: 'Sí — hay trazabilidad o explicación disponible' },
                { v: 'no',  l: 'No — el output es opaco o no se comunica' },
              ] as { v: 'yes' | 'no'; l: string }[]).map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setExplainability(v)}
                  className={[
                    'flex-1 text-left px-3 py-2 rounded-xl border text-xs transition-all duration-100',
                    explainability === v
                      ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100 font-medium'
                      : 'border-border text-text-muted hover:border-navy/30 hover:text-lean-black dark:hover:text-gray-200',
                  ].join(' ')}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Preview resultado */}
          {riskCfg && (
            <div className={`rounded-xl border px-4 py-3 ${riskCfg.badgeBg}`}>
              <p
                className="text-[10px] font-mono uppercase tracking-widest mb-1"
                style={{ color: riskCfg.hex }}
              >
                Clasificación resultante
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg">{riskCfg.icon}</span>
                <span className="text-sm font-bold" style={{ color: riskCfg.hex }}>
                  {riskCfg.label}
                </span>
              </div>
              {previewRisk === 'prohibido' && (
                <p className="text-[10px] mt-1.5 text-red-600 dark:text-red-400 leading-relaxed">
                  ⚠️ Este sistema puede caer en la categoría de uso prohibido por el AI Act (Art. 5). Revisa con el equipo legal antes de proceder.
                </p>
              )}
              {previewRisk === 'alto' && (
                <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: riskCfg.hex }}>
                  Requiere conformidad con el Anexo III del AI Act antes de despliegue. Documenta controles y supervisión humana.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:bg-warm-50 dark:hover:bg-warm-700 transition-colors"
          >
            Cancelar
          </button>
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={!allAnswered}
              className="px-4 py-2 rounded-xl bg-navy-metallic text-white text-sm font-medium
                hover:bg-navy-metallic-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Guardar clasificación
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
