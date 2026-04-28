// ============================================================
// T6 — Risk & Governance View
//
// 3 tabs:
//   1. Política IA — documento corporativo dinámico + descarga PDF
//   2. Dashboard AI Act — distribución de riesgos + tabla por caso
//   3. ISO 42001 — checklist de 14 controles con progreso
// ============================================================

import { useState, useMemo } from 'react'
import { useT4Store }        from '@/modules/T4_UseCasePriorityBoard'
import { useT5Store }        from '@/modules/T5_AITaxonomyCanvas'
import { useT6Store }        from './store'
import {
  AIACT_RISK_CONFIG,
  ISO42001_CLAUSE_CONFIG,
  ISO42001_STATUS_CONFIG,
} from './constants'
import type { ISO42001Status } from './types'
import type { AIActRiskLevel } from '@/modules/T4_UseCasePriorityBoard/types'

// ── Types ─────────────────────────────────────────────────────

type T6Tab = 'politica' | 'riesgos' | 'iso42001'

// ── Helpers ───────────────────────────────────────────────────

const ALL_RISK_LEVELS: AIActRiskLevel[] = ['prohibido', 'alto', 'limitado', 'minimo', 'sin_clasificar']

// ── Tab selector ──────────────────────────────────────────────

function TabButton({
  active, label, badge, onClick,
}: {
  active:   boolean
  label:    string
  badge?:   string
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5',
        active
          ? 'border-navy/50 bg-navy/8 dark:bg-navy/15 text-navy dark:text-info-soft shadow-sm'
          : 'border-border dark:border-white/10 text-text-muted hover:border-navy/30 hover:text-navy/70',
      ].join(' ')}
    >
      {label}
      {badge && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-navy/15 dark:bg-navy/30 text-navy dark:text-info-soft">
          {badge}
        </span>
      )}
    </button>
  )
}

// ── ── ── Tab 1: POLÍTICA IA ── ── ──────────────────────────────

function PolicyTab({ companyName }: { companyName: string }) {
  const { useCases }     = useT4Store()
  const { canvas }       = useT5Store()
  const now              = new Date()
  const dateStr          = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })

  const approvedCases    = useCases.filter((uc) => uc.status === 'go' || uc.status === 'en_piloto')
  const highRiskCases    = useCases.filter((uc) => uc.aiActClassification?.riskLevel === 'alto' || uc.aiActClassification?.riskLevel === 'prohibido')
  const activeDomains    = canvas.activationSequence.slice(0, 3)

  function handlePrint() {
    window.print()
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted">
            Documento generado dinámicamente desde los datos de T4 y T5. Se actualiza con cada cambio.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold
            hover:bg-navy/90 transition-colors print:hidden"
        >
          ↓ Descargar PDF
        </button>
      </div>

      {/* Documento */}
      <div
        id="lean-policy-document"
        className="rounded-2xl border border-border bg-white dark:bg-gray-900 overflow-hidden print:border-none print:shadow-none"
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
                L.E.A.N. AI System · T6
              </span>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 flex flex-col gap-8">

          {/* 1. Declaración */}
          <section>
            <h2 className="text-base font-bold text-lean-black dark:text-gray-100 mb-3 pb-2 border-b border-border dark:border-white/6">
              1. Declaración de Política
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              {companyName} se compromete a adoptar la Inteligencia Artificial de forma responsable, ética
              y conforme a la regulación aplicable, en particular el Reglamento Europeo de Inteligencia
              Artificial (EU AI Act, Reglamento UE 2024/1689) y el Reglamento General de Protección de
              Datos (RGPD). Esta política establece los principios, responsabilidades y controles que
              rigen el desarrollo, adquisición y despliegue de sistemas IA en la organización.
            </p>
            <p className="text-sm text-text-muted leading-relaxed mt-3">
              Todo sistema de IA operativo en {companyName} debe ser identificado, evaluado en términos
              de riesgo regulatorio y documentado en el catálogo corporativo de IA antes de su
              despliegue en producción.
            </p>
          </section>

          {/* 2. Alcance */}
          <section>
            <h2 className="text-base font-bold text-lean-black dark:text-gray-100 mb-3 pb-2 border-b border-border dark:border-white/6">
              2. Alcance
            </h2>
            <p className="text-sm text-text-muted leading-relaxed mb-3">
              Esta política aplica a todos los sistemas de IA desarrollados internamente, adquiridos a
              terceros o utilizados como servicio (AIaaS) por {companyName}, independientemente del
              departamento o función de negocio.
            </p>
            {activeDomains.length > 0 && (
              <div className="rounded-xl border border-border dark:border-white/6 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
                  Dominios IA activos en el scope actual
                </p>
                <ul className="flex flex-col gap-1">
                  {activeDomains.map((code) => {
                    const d = canvas.domains[code]
                    return (
                      <li key={code} className="text-xs text-text-muted flex items-center gap-2">
                        <span className="text-navy">▶</span>
                        <strong className="text-lean-black dark:text-gray-200">
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
            <h2 className="text-base font-bold text-lean-black dark:text-gray-100 mb-3 pb-2 border-b border-border dark:border-white/6">
              3. Principios de IA Responsable
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Transparencia',       desc: 'Los usuarios deben saber cuándo interactúan con un sistema IA y comprender, en la medida de lo posible, cómo funciona.' },
                { title: 'Supervisión humana',  desc: 'Los sistemas IA de alto riesgo requieren supervisión humana efectiva antes de que sus decisiones tengan efecto.' },
                { title: 'Privacidad y datos',  desc: 'El tratamiento de datos personales por sistemas IA cumple el RGPD. Los datos sensibles requieren autorización explícita.' },
                { title: 'No discriminación',   desc: 'Los sistemas IA no pueden generar sesgos injustificados basados en características protegidas por la legislación.' },
                { title: 'Seguridad y robustez', desc: 'Los sistemas IA son seguros frente a manipulaciones y se monitorizan continuamente para detectar degradación del rendimiento.' },
                { title: 'Rendición de cuentas', desc: 'Cada sistema IA tiene un responsable designado (AI Owner) que garantiza su uso conforme a esta política.' },
              ].map(({ title, desc }) => (
                <div key={title} className="rounded-xl border border-border dark:border-white/6 bg-gray-50 dark:bg-gray-800/30 px-4 py-3">
                  <p className="text-xs font-bold text-lean-black dark:text-gray-100 mb-1">{title}</p>
                  <p className="text-[11px] text-text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Catálogo de IA aprobada */}
          <section>
            <h2 className="text-base font-bold text-lean-black dark:text-gray-100 mb-3 pb-2 border-b border-border dark:border-white/6">
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
                            <p className="text-xs font-medium text-lean-black dark:text-gray-200">{uc.name}</p>
                          </td>
                          <td className="py-2 px-3 text-xs text-text-muted">{uc.department}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold ${riskCfg.badgeBg} ${riskCfg.badgeText}`}>
                              {riskCfg.icon} {riskCfg.shortLabel}
                            </span>
                          </td>
                          <td className="py-2 pl-3 text-[10px] text-success-dark font-semibold">
                            {uc.status === 'go' ? '✓ Aprobado' : '⟳ En piloto'}
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
              <h2 className="text-base font-bold text-lean-black dark:text-gray-100 mb-3 pb-2 border-b border-border dark:border-white/6">
                5. Medidas de Control — Sistemas de Alto Riesgo
              </h2>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                Los siguientes sistemas han sido clasificados como alto riesgo según el Annex III del
                AI Act. Requieren las siguientes medidas antes de su despliegue en producción:
              </p>
              <div className="flex flex-col gap-3">
                {highRiskCases.map((uc) => (
                  <div key={uc.id} className="rounded-xl border border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-900/10 px-4 py-3">
                    <p className="text-xs font-bold text-orange-700 dark:text-orange-300 mb-1">{uc.name} — {uc.department}</p>
                    <ul className="flex flex-col gap-1 mt-2">
                      {['Evaluación de conformidad documentada', 'Sistema de gestión de riesgos operativo', 'Supervisión humana definida y comunicada al equipo', 'Registro en base de datos EU de sistemas IA de alto riesgo'].map((m) => (
                        <li key={m} className="text-[11px] text-orange-600 dark:text-orange-400 flex items-start gap-1.5">
                          <span>▶</span><span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 6. Roles y responsabilidades */}
          <section>
            <h2 className="text-base font-bold text-lean-black dark:text-gray-100 mb-3 pb-2 border-b border-border dark:border-white/6">
              {highRiskCases.length > 0 ? '6.' : '5.'} Roles y Responsabilidades
            </h2>
            <div className="flex flex-col gap-2">
              {Object.values(canvas.domains).slice(0, 4).map((d) => (
                <div key={d.domainCode} className="flex items-start gap-3 py-2 border-b border-border/40 dark:border-white/4">
                  <span className="text-[9px] font-mono text-text-subtle uppercase w-32 shrink-0 pt-0.5">AI Owner</span>
                  <div>
                    <p className="text-xs font-medium text-lean-black dark:text-gray-200">{d.suggestedOwner}</p>
                    <p className="text-[10px] text-text-subtle">
                      Responsable del dominio: {d.domainCode.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Revisión */}
          <section>
            <h2 className="text-base font-bold text-lean-black dark:text-gray-100 mb-3 pb-2 border-b border-border dark:border-white/6">
              {highRiskCases.length > 0 ? '7.' : '6.'} Revisión y Vigencia
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Esta política será revisada anualmente o ante cambios regulatorios significativos
              (nuevas disposiciones del AI Act, actualizaciones del RGPD o cambios en el catálogo
              de sistemas IA de {companyName}). La siguiente revisión programada es{' '}
              <strong className="text-lean-black dark:text-gray-200">
                {new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
              </strong>.
            </p>
            <p className="text-[11px] text-text-subtle mt-3 pt-3 border-t border-border dark:border-white/6">
              Documento generado automáticamente por el L.E.A.N. AI System Enterprise (T6 — Risk &amp; Governance).
              Alpha Consulting Solutions S.L. · {dateStr}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

// ── ── ── Tab 2: RIESGOS AI ACT ── ── ─────────────────────────

function RiskDashboardTab() {
  const { useCases } = useT4Store()
  const [selectedLevel, setSelectedLevel] = useState<AIActRiskLevel | null>(null)

  const summary = useMemo(() => {
    const byLevel = ALL_RISK_LEVELS.reduce((acc, l) => ({ ...acc, [l]: 0 }), {} as Record<AIActRiskLevel, number>)
    let classified = 0
    useCases.forEach((uc) => {
      const level = uc.aiActClassification?.riskLevel ?? 'sin_clasificar'
      byLevel[level]++
      if (uc.aiActClassification) classified++
    })
    return {
      total:           useCases.length,
      byLevel,
      classified,
      unclassified:    useCases.length - classified,
      coveragePercent: useCases.length > 0 ? Math.round((classified / useCases.length) * 100) : 0,
    }
  }, [useCases])

  const filteredCases = selectedLevel
    ? useCases.filter((uc) => (uc.aiActClassification?.riskLevel ?? 'sin_clasificar') === selectedLevel)
    : useCases

  return (
    <div className="flex flex-col gap-5">

      {/* KPI cards — una por nivel */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {ALL_RISK_LEVELS.map((level) => {
          const cfg   = AIACT_RISK_CONFIG[level]
          const count = summary.byLevel[level]
          const isActive = selectedLevel === level
          return (
            <button
              key={level}
              onClick={() => setSelectedLevel(isActive ? null : level)}
              className={[
                'rounded-2xl border px-4 py-4 text-left transition-all duration-150',
                isActive
                  ? `${cfg.badgeBg} border-2`
                  : 'border-border bg-white dark:bg-gray-900 hover:border-navy/30',
              ].join(' ')}
              style={{ borderColor: isActive ? cfg.hex : undefined }}
            >
              <p className="text-2xl mb-1">{cfg.icon}</p>
              <p className="text-2xl font-bold tabular-nums text-lean-black dark:text-gray-100">{count}</p>
              <p className={`text-[10px] font-semibold ${isActive ? cfg.badgeText : 'text-text-muted'}`}>
                {cfg.shortLabel}
              </p>
            </button>
          )
        })}
      </div>

      {/* Cobertura */}
      <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            Cobertura de clasificación AI Act
          </p>
          <span className="text-sm font-bold text-lean-black dark:text-gray-100 tabular-nums">
            {summary.classified}/{summary.total} casos ({summary.coveragePercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width:           `${summary.coveragePercent}%`,
              backgroundColor: summary.coveragePercent === 100 ? '#16A34A' : summary.coveragePercent >= 50 ? '#D97706' : '#EA580C',
            }}
          />
        </div>
        {summary.unclassified > 0 && (
          <p className="text-[10px] text-text-subtle mt-2">
            {summary.unclassified} caso{summary.unclassified > 1 ? 's' : ''} pendiente{summary.unclassified > 1 ? 's' : ''} de clasificación. Accede a T4 → tab Regulatorio para clasificarlos.
          </p>
        )}
      </div>

      {/* Tabla de casos */}
      <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-5 py-3 border-b border-border dark:border-white/6 flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            {selectedLevel ? `Casos — ${AIACT_RISK_CONFIG[selectedLevel].label}` : 'Todos los casos de uso'}
            <span className="ml-2 font-bold text-lean-black dark:text-gray-200">({filteredCases.length})</span>
          </p>
          {selectedLevel && (
            <button onClick={() => setSelectedLevel(null)} className="text-[10px] text-navy dark:text-info-soft hover:underline">
              Ver todos ×
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-white/6">
                <th className="text-left py-2 px-5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Caso de uso</th>
                <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Departamento</th>
                <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Categoría IA</th>
                <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Estado</th>
                <th className="text-left py-2 px-3 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Riesgo AI Act</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((uc) => {
                const riskLevel = uc.aiActClassification?.riskLevel ?? 'sin_clasificar'
                const riskCfg   = AIACT_RISK_CONFIG[riskLevel]
                return (
                  <tr key={uc.id} className="border-b border-border/40 dark:border-white/4 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-2.5 px-5">
                      <p className="text-xs font-medium text-lean-black dark:text-gray-200 leading-tight">{uc.name}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-text-muted">{uc.department}</td>
                    <td className="py-2.5 px-3 text-[11px] text-text-muted capitalize">{uc.aiCategory.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-medium capitalize text-text-muted">{uc.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold ${riskCfg.badgeBg} ${riskCfg.badgeText}`}>
                        {riskCfg.icon} {riskCfg.shortLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── ── ── Tab 3: ISO 42001 ── ── ───────────────────────────────

function ISO42001Tab() {
  const { controls, updateControl } = useT6Store()
  const { useCases }                = useT4Store()

  // Auto-inferir estado de algunos controles desde datos reales
  const enrichedControls = useMemo(() => {
    const classifiedCount = useCases.filter((uc) => uc.aiActClassification).length
    const approvedCount   = useCases.filter((uc) => uc.status === 'go' || uc.status === 'en_piloto').length

    return controls.map((c) => {
      // Si ya fue editado manualmente, no sobreescribir
      if (!c.autoInferred && c.status !== 'no_iniciado') return c

      let inferred: typeof c.status = c.status
      if (c.id === '5.2')   inferred = 'en_progreso'   // política existe (este documento)
      if (c.id === '6.1.2') inferred = classifiedCount > 0 ? 'en_progreso' : 'no_iniciado'
      if (c.id === '6.1')   inferred = useCases.length > 0 ? 'en_progreso' : 'no_iniciado'
      if (c.id === '8.1')   inferred = approvedCount > 0 ? 'en_progreso' : 'no_iniciado'
      if (c.id === '7.5')   inferred = useCases.length > 0 ? 'en_progreso' : 'no_iniciado'

      return { ...c, status: inferred, autoInferred: inferred !== c.status }
    })
  }, [controls, useCases])

  const implemented = enrichedControls.filter((c) => c.status === 'implementado').length
  const inProgress  = enrichedControls.filter((c) => c.status === 'en_progreso').length
  const total       = enrichedControls.length
  const progress    = Math.round(((implemented + inProgress * 0.5) / total) * 100)

  // Agrupar por cláusula
  const byClause = useMemo(() => {
    const groups: Record<string, typeof enrichedControls> = {}
    enrichedControls.forEach((c) => {
      if (!groups[c.clause]) groups[c.clause] = []
      groups[c.clause].push(c)
    })
    return groups
  }, [enrichedControls])

  return (
    <div className="flex flex-col gap-5">

      {/* Progress header */}
      <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 px-6 py-5">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-1">
              Progreso hacia ISO 42001
            </p>
            <p className="text-3xl font-bold tabular-nums text-lean-black dark:text-gray-100">
              {progress}%
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {implemented} implementados · {inProgress} en progreso · {total - implemented - inProgress} no iniciados
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            {Object.entries(ISO42001_STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="text-sm" style={{ color: cfg.hex }}>{cfg.dot}</span>
                <span className="text-[10px] text-text-muted">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Progress bar segmentada */}
        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
          <div
            className="h-full bg-success-dark transition-all duration-500"
            style={{ width: `${(implemented / total) * 100}%` }}
          />
          <div
            className="h-full bg-warning-dark transition-all duration-500"
            style={{ width: `${(inProgress / total) * 100}%` }}
          />
        </div>
        <p className="text-[9px] text-text-subtle mt-2">
          14 controles clave seleccionados de las cláusulas 4–10 del estándar ISO/IEC 42001:2023.
          Haz clic en cualquier control para actualizar su estado.
        </p>
      </div>

      {/* Controles agrupados por cláusula */}
      {Object.entries(byClause).map(([clause, clauseControls]) => {
        const clauseCfg = ISO42001_CLAUSE_CONFIG[clause as keyof typeof ISO42001_CLAUSE_CONFIG]
        return (
          <div key={clause} className="rounded-2xl border border-border bg-white dark:bg-gray-900 overflow-hidden">
            <div
              className="px-5 py-3 border-b border-border dark:border-white/6"
              style={{ borderLeftWidth: 3, borderLeftColor: clauseCfg.hex }}
            >
              <p className="text-xs font-semibold" style={{ color: clauseCfg.hex }}>
                {clauseCfg.label}
              </p>
            </div>
            <div className="divide-y divide-border/40 dark:divide-white/4">
              {clauseControls.map((control) => {
                const statusCfg = ISO42001_STATUS_CONFIG[control.status]
                const STATUS_CYCLE: ISO42001Status[] = ['no_iniciado', 'en_progreso', 'implementado']
                const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(control.status) + 1) % STATUS_CYCLE.length]

                return (
                  <div key={control.id} className="px-5 py-3 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    {/* Status toggle */}
                    <button
                      onClick={() => updateControl(control.id, nextStatus)}
                      title={`Cambiar a: ${ISO42001_STATUS_CONFIG[nextStatus].label}`}
                      className="shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110"
                      style={{ color: statusCfg.hex }}
                    >
                      {statusCfg.dot}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[9px] font-mono text-text-subtle">{control.code}</span>
                        <p className="text-xs font-semibold text-lean-black dark:text-gray-200">{control.title}</p>
                        {control.autoInferred && (
                          <span className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-navy/10 text-navy dark:text-info-soft">
                            auto
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-subtle leading-relaxed">{control.description}</p>
                    </div>

                    {/* Badge */}
                    <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold ${statusCfg.badgeBg} ${statusCfg.badgeText}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ── ── Main View ── ── ────────────────────────────────────────

export function T6View({
  companyName,
  onBack,
}: {
  companyName: string
  onBack:      () => void
}) {
  const [tab, setTab] = useState<T6Tab>('politica')
  const { useCases }  = useT4Store()

  const unclassified = useCases.filter((uc) => !uc.aiActClassification).length
  const highRisk     = useCases.filter((uc) =>
    uc.aiActClassification?.riskLevel === 'alto' ||
    uc.aiActClassification?.riskLevel === 'prohibido'
  ).length

  return (
    <div className="max-w-[1100px] mx-auto space-y-5 px-8 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap print:hidden">
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
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy text-white">T6</span>
              <h1 className="text-lg font-semibold text-lean-black dark:text-gray-100">
                Risk &amp; Governance
              </h1>
            </div>
            <p className="text-xs text-text-subtle">{companyName} · Fase Evaluate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {highRisk > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              🔴 {highRisk} caso{highRisk > 1 ? 's' : ''} alto riesgo
            </span>
          )}
          {unclassified > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500">
              ⬜ {unclassified} sin clasificar
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap print:hidden">
        <TabButton active={tab === 'politica'}  label="📄 Política IA Corporativa"   onClick={() => setTab('politica')} />
        <TabButton active={tab === 'riesgos'}   label="⚖️ Dashboard AI Act"          badge={highRisk > 0 ? `${highRisk} alto` : undefined} onClick={() => setTab('riesgos')} />
        <TabButton active={tab === 'iso42001'}  label="✅ Controles ISO 42001"        onClick={() => setTab('iso42001')} />
      </div>

      {/* Tab content */}
      {tab === 'politica'  && <PolicyTab companyName={companyName} />}
      {tab === 'riesgos'   && <RiskDashboardTab />}
      {tab === 'iso42001'  && <ISO42001Tab />}
    </div>
  )
}
