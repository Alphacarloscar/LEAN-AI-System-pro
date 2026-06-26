import { useForm, Controller } from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { usePermissions }      from '@/modules/Auth'
import { useUnsavedGuard }     from '@/shared/hooks/useUnsavedGuard'
import { Modal, Button, Badge } from '@shared/design-system/components'
import type { AIActClassification } from '../types'
import { computeAIActRisk }    from '../types'
import type { AIActScope }     from '../types'
import {
  aiActClassificationSchema,
  type AIActClassificationFormValues,
} from '@/lib/schemas/t6.schemas'
import { AIACT_RISK_CONFIG, AIACT_SCOPE_LABELS, AIACT_ICON_MAP } from './AIActClassificationModal.constants'

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

  const {
    handleSubmit,
    control,
    watch,
    formState: { isValid, isDirty },
  } = useForm<AIActClassificationFormValues>({
    resolver:     zodResolver(aiActClassificationSchema),
    mode:         'onChange',
    defaultValues: {
      scope:          undefined,
      personImpact:   undefined,
      sensitiveData:  undefined,
      explainability: undefined,
    },
  })

  useUnsavedGuard(isDirty, 'T6_AIActClassification')

  const values = watch()
  const previewRisk =
    values.scope && values.personImpact && values.sensitiveData !== undefined && values.explainability
      ? computeAIActRisk(
          values.scope,
          values.personImpact,
          values.sensitiveData,
          values.explainability,
        )
      : null

  const riskCfg = previewRisk ? AIACT_RISK_CONFIG[previewRisk] : null

  function onValid(data: AIActClassificationFormValues) {
    const riskLevel = computeAIActRisk(
      data.scope, data.personImpact, data.sensitiveData, data.explainability,
    )
    onSave({
      scope:          data.scope,
      personImpact:   data.personImpact,
      sensitiveData:  data.sensitiveData,
      explainability: data.explainability,
      riskLevel,
      classifiedAt:   new Date().toISOString(),
    })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
      {!isReadOnly && (
        <Button
          variant="primary"
          size="sm"
          type="submit"
          form="aiact-form"
          disabled={!isValid}
        >
          Guardar clasificación
        </Button>
      )}
    </div>
  )

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title={useCaseName}
      size="md"
      footer={footer}
    >
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="navy" shape="pill" size="xs" className="font-bold">AI Act</Badge>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Clasificación regulatoria
        </p>
      </div>
      <p className="text-[10px] text-text-subtle mb-5">
        Responde 4 preguntas para clasificar el riesgo regulatorio de este caso de uso.
      </p>

      <form id="aiact-form" onSubmit={handleSubmit(onValid)} className="flex flex-col gap-6">

        {/* P1 — Ámbito */}
        <Controller
          name="scope"
          control={control}
          render={({ field }) => (
            <div>
              <p className="text-xs font-semibold text-lean-black dark:text-warm-100 mb-0.5">
                P1 · ¿En qué ámbito opera este sistema?
              </p>
              <p className="text-[10px] text-text-subtle mb-2">
                El sector determina si aplica el Anexo III del AI Act (alto riesgo automático).
              </p>
              <div className="flex flex-col gap-1.5">
                {(Object.entries(AIACT_SCOPE_LABELS) as [AIActScope, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => field.onChange(key)}
                    className={[
                      'text-left px-3 py-2 rounded-xl border text-xs transition-all duration-100',
                      field.value === key
                        ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100 font-medium'
                        : 'border-border text-text-muted hover:border-navy/30 hover:text-lean-black dark:hover:text-warm-100',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        {/* P2 — Impacto en personas */}
        <Controller
          name="personImpact"
          control={control}
          render={({ field }) => (
            <div>
              <p className="text-xs font-semibold text-lean-black dark:text-warm-100 mb-0.5">
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
                    type="button"
                    onClick={() => field.onChange(v)}
                    className={[
                      'text-left px-3 py-2 rounded-xl border text-xs transition-all duration-100',
                      field.value === v
                        ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100 font-medium'
                        : 'border-border text-text-muted hover:border-navy/30 hover:text-lean-black dark:hover:text-warm-100',
                    ].join(' ')}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        {/* P3 — Datos sensibles */}
        <Controller
          name="sensitiveData"
          control={control}
          render={({ field }) => (
            <div>
              <p className="text-xs font-semibold text-lean-black dark:text-warm-100 mb-0.5">
                P3 · ¿Utiliza o procesa datos de salud, biométricos, religión, origen étnico o datos sexuales?
              </p>
              <p className="text-[10px] text-text-subtle mb-2">
                Categorías especiales RGPD Art. 9 y datos biométricos identificativos.
              </p>
              <div className="flex gap-2">
                {([{ v: false, l: 'No' }, { v: true, l: 'Sí' }] as { v: boolean; l: string }[]).map(({ v, l }) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => field.onChange(v)}
                    className={[
                      'flex-1 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-100',
                      field.value === v
                        ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100'
                        : 'border-border text-text-muted hover:border-navy/30',
                    ].join(' ')}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        {/* P4 — Explicabilidad */}
        <Controller
          name="explainability"
          control={control}
          render={({ field }) => (
            <div>
              <p className="text-xs font-semibold text-lean-black dark:text-warm-100 mb-0.5">
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
                    type="button"
                    onClick={() => field.onChange(v)}
                    className={[
                      'flex-1 text-left px-3 py-2 rounded-xl border text-xs transition-all duration-100',
                      field.value === v
                        ? 'border-navy bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100 font-medium'
                        : 'border-border text-text-muted hover:border-navy/30 hover:text-lean-black dark:hover:text-warm-100',
                    ].join(' ')}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        {/* Preview resultado */}
        {riskCfg && (
          <div className={`rounded-xl border px-4 py-3 ${riskCfg.badgeBg}`}>
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-1"
              style={{ color: riskCfg.hex }}
            >
              Clasificación resultante
            </p>
            <div className="flex items-center gap-2" style={{ color: riskCfg.hex }}>
              {(() => { const Icon = AIACT_ICON_MAP[riskCfg.icon] ?? AlertTriangle; return <Icon size={20} strokeWidth={1.5} /> })()}
              <span className="text-sm font-bold">{riskCfg.label}</span>
            </div>
            {previewRisk === 'prohibido' && (
              <p className="text-[10px] mt-1.5 text-red-600 dark:text-red-400 leading-relaxed flex items-start gap-1.5">
                <AlertTriangle size={12} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                Este sistema puede caer en la categoría de uso prohibido por el AI Act (Art. 5). Revisa con el equipo legal antes de proceder.
              </p>
            )}
            {previewRisk === 'alto' && (
              <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: riskCfg.hex }}>
                Requiere conformidad con el Anexo III del AI Act antes de despliegue. Documenta controles y supervisión humana.
              </p>
            )}
          </div>
        )}

      </form>
    </Modal>
  )
}
