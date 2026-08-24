// ============================================================
// PolicyTab — Tab 1 of T6View: Corporate AI Policy document
// ============================================================

import { AlertTriangle, Check, RefreshCw, Ban, AlertCircle, CheckCircle, Circle } from 'lucide-react'
import { useT4Kernel }       from '@/modules/T4_UseCasePriorityBoard/index.public'
import { useT5Store }        from '@/modules/T5_AITaxonomyCanvas'
import { useT6Store }        from '../store'
import { AIACT_RISK_CONFIG } from '../constants'
import { useCompanyProfileStore } from '@/modules/CompanyProfile/store'
import { usePermissions }    from '@/modules/Auth'
import { usePolicyGeneration } from '@/hooks/usePolicyGeneration'
import type { PolicyGenerationContext } from '@/hooks/usePolicyGeneration'
import { PolicyDownloadButton } from '../PolicyPDF'
import { PersistenceBanner } from '@/shared/components/PersistenceBanner'
import { Badge, StreamingIndicator } from '@shared/design-system/components'

const RISK_ICON_SM = {
  ban:              <Ban           size={12} strokeWidth={1.5} />,
  'alert-circle':   <AlertCircle  size={12} strokeWidth={1.5} />,
  'alert-triangle': <AlertTriangle size={12} strokeWidth={1.5} />,
  'check-circle':   <CheckCircle  size={12} strokeWidth={1.5} />,
  circle:           <Circle       size={12} strokeWidth={1.5} />,
} as const

interface PolicyTabProps {
  companyName:  string
  engagementId: string | null
}

export function PolicyTab({ companyName, engagementId }: PolicyTabProps) {
  const { isReadOnly } = usePermissions()
  const { useCases }   = useT4Kernel()
  const { canvas }     = useT5Store()
  const { generatedPolicy, clearGeneratedPolicy, persistenceStatus, persistenceError, retrySave } = useT6Store()
  const profile        = useCompanyProfileStore((s) => s.profile)
  const { generate, status: genStatus, error: genError, clearError } = usePolicyGeneration()
  const isPending = genStatus === 'pending'
  const now            = new Date()
  const dateStr        = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const nextReviewStr  = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    .toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })

  const approvedCases  = useCases.filter((uc) => uc.status === 'go' || uc.status === 'en_piloto')
  const highRiskCases  = useCases.filter((uc) => uc.aiActClassification?.riskLevel === 'alto' || uc.aiActClassification?.riskLevel === 'prohibido')

  // Company context
  const sector        = profile?.sector || null
  const tamano        = profile?.tamanoEmpresa || null
  const objetivo      = profile?.objetivoPrincipalIA || null
  const horizonte     = profile?.horizonteEsperadoValor || null
  const ecosistema    = profile?.ecosistemaTecnologico || null
  const restricciones = profile?.restriccionesRelevantes || null
  const areas         = profile?.areasPrioritarias ?? []

  // Context para generación LLM de política
  const policyGenContext: PolicyGenerationContext = {
    company: {
      name:          companyName,
      sector:        sector        ?? 'No especificado',
      tamano:        tamano        ?? 'No especificado',
      objetivo:      objetivo      ?? 'No especificado',
      horizonte:     horizonte     ?? 'No especificado',
      ecosistema:    ecosistema    ?? 'No especificado',
      restricciones: restricciones ?? 'Ninguna',
      areas:         areas as string[],
    },
    aiActRisk: {
      total:         useCases.length,
      prohibido:     useCases.filter(uc => uc.aiActClassification?.riskLevel === 'prohibido').length,
      alto:          highRiskCases.filter(uc => uc.aiActClassification?.riskLevel === 'alto').length,
      limitado:      useCases.filter(uc => uc.aiActClassification?.riskLevel === 'limitado').length,
      minimo:        useCases.filter(uc => uc.aiActClassification?.riskLevel === 'minimo').length,
      sinClasificar: useCases.filter(uc => !uc.aiActClassification).length,
      highRiskCases: highRiskCases.slice(0, 5).map(uc => ({
        name: uc.name, department: uc.department ?? 'Sin departamento',
      })),
    },
    useCases: {
      total:  useCases.length,
      go:     useCases.filter(uc => uc.status === 'go').length,
      piloto: useCases.filter(uc => uc.status === 'en_piloto').length,
    },
    activeDomains: canvas.activationSequence?.slice(0, 4) ?? [],
  }

  // Principios a renderizar: LLM o plantilla por defecto
  const principios = generatedPolicy?.principios ?? [
    { title: 'Transparencia',        desc: 'Los usuarios deben saber cuándo interactúan con un sistema IA y comprender, en la medida de lo posible, cómo funciona.' },
    { title: 'Supervisión humana',   desc: 'Los sistemas IA de alto riesgo requieren supervisión humana efectiva antes de que sus decisiones tengan efecto.' },
    { title: 'Privacidad y datos',   desc: 'El tratamiento de datos personales por sistemas IA cumple el RGPD. Los datos sensibles requieren autorización explícita.' },
    { title: 'No discriminación',    desc: 'Los sistemas IA no pueden generar sesgos injustificados basados en características protegidas por la legislación.' },
    { title: 'Seguridad y robustez', desc: 'Los sistemas IA son seguros frente a manipulaciones y se monitorizan continuamente para detectar degradación del rendimiento.' },
    { title: 'Rendición de cuentas', desc: 'Cada sistema IA tiene un responsable designado (AI Owner) que garantiza su uso conforme a esta política.' },
  ]
  const activeDomains = canvas.activationSequence?.slice(0, 3) ?? []

  const pdfData = {
    companyName,
    dateStr,
    nextReviewStr,
    approvedCases,
    highRiskCases,
    activeDomains:   activeDomains.map(code => ({ code, domain: canvas.domains[code] })),
    ownerDomains:    Object.values(canvas.domains).slice(0, 4),
    generatedPolicy: generatedPolicy ?? null,
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          {generatedPolicy ? (
            <div className="flex items-center gap-2">
              <Badge variant="warning" shape="pill" size="xs">
                ✦ Generada con IA · {generatedPolicy.sector}
              </Badge>
              <button
                onClick={clearGeneratedPolicy}
                className="text-[10px] text-text-subtle hover:text-danger transition-colors"
              >
                Volver a plantilla
              </button>
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              Documento generado desde los datos de T4 y T5. Genera con IA para adaptarlo a tu sector.
            </p>
          )}
          {genError && (
            <p className="text-[11px] text-danger flex items-center gap-1">
              <AlertTriangle size={12} strokeWidth={1.5} className="shrink-0" /> {genError}
              <button onClick={clearError} className="underline hover:no-underline ml-1">Cerrar</button>
            </p>
          )}
          {(persistenceStatus === 'error' || persistenceStatus === 'saving') && (
            <PersistenceBanner
              error={persistenceError}
              isRetrying={persistenceStatus === 'saving'}
              onRetry={() => engagementId && retrySave(engagementId)}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              onClick={() => generate(policyGenContext, engagementId)}
              disabled={isPending}
              className={[
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150',
                isPending
                  ? 'border-border text-text-subtle bg-warm-50 dark:bg-warm-800 cursor-not-allowed'
                  : 'border-warning dark:border-warning-dark text-warning-dark dark:text-warning bg-warning-light dark:bg-warning/10 hover:bg-warning/20 dark:hover:bg-warning/20',
              ].join(' ')}
            >
              {isPending
                ? 'Generando…'
                : <>✦ {generatedPolicy ? 'Regenerar con IA' : 'Generar política con IA'}</>
              }
            </button>
          )}
          <PolicyDownloadButton data={pdfData} />
        </div>
      </div>

      {/* Streaming indicator — visible while LLM call is in flight */}
      {isPending && (
        <StreamingIndicator label="Generando política con IA…" variant="card-full" />
      )}

      {/* Documento */}
      <div
        id="lean-policy-document"
        className="rounded-xl border border-border bg-white dark:bg-warm-900 overflow-hidden print:border-none print:shadow-none"
      >
        {/* Portada */}
        <div className="px-10 py-8 border-b border-border dark:border-white/6 bg-navy text-white print:bg-navy">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest opacity-70 mb-2">
                Política Corporativa de Inteligencia Artificial
              </p>
              <h1 className="text-2xl font-bold leading-tight mb-1">{companyName}</h1>
              <p className="text-sm opacity-75">Versión 1.0 · {dateStr}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-white/15">
                GOBY · T6
              </span>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 flex flex-col gap-8">

          {/* 1. Declaración */}
          <section>
            <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-3 pb-2 border-b border-border dark:border-white/6">
              1. Declaración de Política
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              {generatedPolicy?.declaracion_opening ?? (
                `${companyName}${sector ? `, empresa del sector ${sector}${tamano ? ` con ${tamano}` : ''},` : ''} se compromete a adoptar la Inteligencia Artificial de forma responsable, ética y conforme a la regulación aplicable, en particular el Reglamento Europeo de Inteligencia Artificial (EU AI Act, Reglamento UE 2024/1689) y el Reglamento General de Protección de Datos (RGPD). Esta política establece los principios, responsabilidades y controles que rigen el desarrollo, adquisición y despliegue de sistemas IA en la organización.`
              )}
            </p>
            {!generatedPolicy && objetivo && (
              <p className="text-sm text-text-muted leading-relaxed mt-3">
                El objetivo estratégico principal de adopción IA de {companyName} es <strong className="text-lean-black dark:text-warm-200">{objetivo.toLowerCase()}</strong>
                {horizonte ? `, con un horizonte de generación de valor esperado de ${horizonte.toLowerCase()}` : ''}.
                Esta política enmarca y habilita dicha transformación dentro de los requisitos regulatorios aplicables.
              </p>
            )}
            <p className="text-sm text-text-muted leading-relaxed mt-3">
              {generatedPolicy?.declaracion_mandate ?? (
                `Todo sistema de IA operativo en ${companyName} debe ser identificado, evaluado en términos de riesgo regulatorio y documentado en el catálogo corporativo de IA antes de su despliegue en producción.`
              )}
            </p>
          </section>

          {/* 2. Alcance */}
          <section>
            <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-3 pb-2 border-b border-border dark:border-white/6">
              2. Alcance
            </h2>
            <p className="text-sm text-text-muted leading-relaxed mb-3">
              {generatedPolicy?.alcance_context ?? (
                `Esta política aplica a todos los sistemas de IA desarrollados internamente, adquiridos a terceros o utilizados como servicio (AIaaS) por ${companyName}, independientemente del departamento o función de negocio.${areas.length > 0 ? ` Las áreas prioritarias en el programa actual de adopción son: ${(areas as string[]).join(', ')}.` : ''}`
              )}
            </p>
            {(ecosistema || restricciones) && (
              <div className="rounded-xl border border-border dark:border-white/6 bg-warm-50 dark:bg-warm-800/50 px-4 py-3 mb-3 flex flex-col gap-2">
                {ecosistema && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">Ecosistema tecnológico base</p>
                    <p className="text-xs text-text-muted">{ecosistema}</p>
                  </div>
                )}
                {restricciones && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">Restricciones relevantes</p>
                    <p className="text-xs text-text-muted">{restricciones}</p>
                  </div>
                )}
              </div>
            )}
            {activeDomains.length > 0 && (
              <div className="rounded-xl border border-border dark:border-white/6 bg-warm-50 dark:bg-warm-800/50 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                  Dominios IA activos en el scope actual
                </p>
                <ul className="flex flex-col gap-1">
                  {activeDomains.map((code) => {
                    const d = canvas.domains[code]
                    return (
                      <li key={code} className="text-xs text-text-muted flex items-center gap-2">
                        <span className="text-navy">▶</span>
                        <strong className="text-lean-black dark:text-warm-200">
                          {code.replace(/_/g, ' ').replace('agéntica', 'Agéntica')}
                        </strong>
                        {' '}— Prioridad {d.priorityScore}/100
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* 3. Principios */}
          <section>
            <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-3 pb-2 border-b border-border dark:border-white/6">
              3. Principios de IA Responsable
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {principios.map(({ title, desc }) => (
                <div key={title} className="rounded-xl border border-border dark:border-white/6 bg-warm-50 dark:bg-warm-800/30 px-4 py-3">
                  <p className="text-xs font-bold text-lean-black dark:text-warm-100 mb-1">{title}</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3b. Contexto regulatorio sectorial (solo si fue generado por LLM) */}
          {generatedPolicy?.contexto_sectorial && (
            <section>
              <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-3 pb-2 border-b border-border dark:border-white/6">
                4. Contexto Regulatorio Sectorial
              </h2>
              <p className="text-sm text-text-muted leading-relaxed">
                {generatedPolicy.contexto_sectorial}
              </p>
            </section>
          )}

          {/* 4/5. Catálogo de IA aprobada */}
          <section>
            <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-3 pb-2 border-b border-border dark:border-white/6">
              4. Catálogo de IA Aprobada
            </h2>
            <p className="text-sm text-text-muted leading-relaxed mb-4">
              Los siguientes sistemas IA han sido evaluados, aprobados (Go) e incorporados al
              pipeline de implementación de {companyName} a la fecha de emisión de esta política.
            </p>
            {approvedCases.length === 0 ? (
              <p className="text-xs text-text-subtle italic">Sin casos de uso aprobados todavía. Completa el proceso Go/No-Go en T4.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border dark:border-white/6">
                      <th className="text-left py-2 pr-4 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Sistema IA</th>
                      <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Departamento</th>
                      <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Riesgo AI Act</th>
                      <th className="text-left py-2 pl-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedCases.map((uc) => {
                      const riskLevel = uc.aiActClassification?.riskLevel ?? 'sin_clasificar'
                      const riskCfg   = AIACT_RISK_CONFIG[riskLevel]
                      return (
                        <tr key={uc.id} className="border-b border-border/40 dark:border-white/4">
                          <td className="py-2 pr-4">
                            <p className="text-xs font-medium text-lean-black dark:text-warm-200">{uc.name}</p>
                          </td>
                          <td className="py-2 px-3 text-xs text-text-muted">{uc.department}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold ${riskCfg.badgeBg} ${riskCfg.badgeText}`}>
                              <span className="inline-flex items-center gap-1">{RISK_ICON_SM[riskCfg.icon as keyof typeof RISK_ICON_SM]} {riskCfg.shortLabel}</span>
                            </span>
                          </td>
                          <td className="py-2 pl-3 text-[10px] text-success-dark font-semibold">
                            {uc.status === 'go'
                              ? <span className="inline-flex items-center gap-1"><Check size={10} strokeWidth={1.5} /> Aprobado</span>
                              : <span className="inline-flex items-center gap-1"><RefreshCw size={10} strokeWidth={1.5} /> En piloto</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 5. Controles de alto riesgo */}
          {highRiskCases.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-3 pb-2 border-b border-border dark:border-white/6">
                5. Medidas de Control — Sistemas de Alto Riesgo
              </h2>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                Los siguientes sistemas han sido clasificados como alto riesgo según el Annex III del
                AI Act. Requieren las siguientes medidas antes de su despliegue en producción:
              </p>
              <div className="flex flex-col gap-3">
                {highRiskCases.map((uc) => (
                  <div key={uc.id} className="rounded-xl border border-border bg-surface dark:bg-warm-800/40 border-l-2 border-l-warning px-4 py-3">
                    <p className="text-xs font-bold text-warning-dark dark:text-warning mb-1">{uc.name} — {uc.department}</p>
                    <ul className="flex flex-col gap-1 mt-2">
                      {['Evaluación de conformidad documentada', 'Sistema de gestión de riesgos operativo', 'Supervisión humana definida y comunicada al equipo', 'Registro en base de datos EU de sistemas IA de alto riesgo'].map((m) => (
                        <li key={m} className="text-[11px] text-warning-dark dark:text-warning flex items-start gap-1.5">
                          <span>▶</span><span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Roles y responsabilidades */}
          <section>
            <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-3 pb-2 border-b border-border dark:border-white/6">
              {highRiskCases.length > 0 ? '6.' : '5.'} Roles y Responsabilidades
            </h2>
            <div className="flex flex-col gap-2">
              {Object.values(canvas.domains).slice(0, 4).map((d) => (
                <div key={d.domainCode} className="flex items-start gap-3 py-2 border-b border-border/40 dark:border-white/4">
                  <span className="text-[9px] font-mono text-text-subtle uppercase w-32 shrink-0 pt-0.5">AI Owner</span>
                  <div>
                    <p className="text-xs font-medium text-lean-black dark:text-warm-200">{d.suggestedOwner}</p>
                    <p className="text-[10px] text-text-subtle">
                      Responsable del dominio: {d.domainCode.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Revisión */}
          <section>
            <h2 className="text-lg font-semibold text-lean-black dark:text-warm-50 mb-3 pb-2 border-b border-border dark:border-white/6">
              {highRiskCases.length > 0 ? '7.' : '6.'} Revisión y Vigencia
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Esta política será revisada anualmente o ante cambios regulatorios significativos
              (nuevas disposiciones del AI Act, actualizaciones del RGPD o cambios en el catálogo
              de sistemas IA de {companyName}). La siguiente revisión programada es{' '}
              <strong className="text-lean-black dark:text-warm-200">
                {new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
              </strong>.
            </p>
            <p className="text-[11px] text-text-subtle mt-3 pt-3 border-t border-border dark:border-white/6">
              Documento generado automáticamente por el GOBY — powered by Alpha Consulting (T6 — Risk &amp; Governance).
              Alpha Consulting Solutions S.L. · {dateStr}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
