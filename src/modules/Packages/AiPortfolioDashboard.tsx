// ============================================================
// Packages — AiPortfolioDashboard.tsx  (FDR-002, Fase 1 · Bloque 3)
//
// RENDER del dashboard derivado del paquete "AI Portfolio Management".
// Lectura pura: NO escribe, NO crea métricas nuevas. Orquesta:
//   loader (useAiPortfolioDashboardLoader) → carga secuencial.
//   adapter (useAiPortfolioDashboard)      → modelo read-only de cards.
//
// Jerarquía de render — convergencia a tres bandas (GPT + Gemini + Claude):
//   1. HERO EJECUTIVO    → contexto de empresa (CompanyProfile) + resumen
//      global de 1 línea + badge de estado. Ataca la objeción P4 (abrumo):
//      lo primero que ve el comprador es una síntesis, no 12 herramientas.
//   2. SEÑALES TEMPRANAS → T4 (casos · GO) y T3 (procesos). Las fuentes que
//      cargan antes y narran valor (NO T1/T11 — Gemini).
//   3. EVIDENCIA METODOLÓGICA (subordinada) → detalle por tool (T3,T4,T5,T9).
//   4. CADENCIA (inferior) → T11 como bloque metodológico, no como gancho.
//
// REGLA DE ORO (frío ≠ vacío): mientras una fuente no esté 'settled' su card
// es 'loading' → se pinta skeleton, NUNCA "0 casos / 0 procesos". Eso evita
// el falso vacío que mataría el momento comercial en la demo.
//
// COPY HONESTO (Gemini): el contexto de empresa usa copy neutral
// ("Contexto de empresa pendiente"), nunca "Falta perfil": un fallo de red
// no debe leerse como dato ausente. (Deuda: CompanyProfile no expone
// loadError — documentada en TECH-DEBT.md.)
//
// ADR-011: no toca Supabase; solo lee stores ya hidratados por el loader.
// ============================================================

import { useEngagementStore }      from '@/modules/Engagement/store'
import { useCompanyProfileStore }  from '@/modules/CompanyProfile/store'
import type { PackageId }          from '@/config/salesPackages'
import { getPackageById }          from '@/config/salesPackages'
import { toolLabel }               from '@/config/toolMetadata'

import { useAiPortfolioDashboardLoader } from './hooks/useAiPortfolioDashboardLoader'
import { useAiPortfolioDashboard }       from './hooks/useAiPortfolioDashboard'
import type { ToolCardState, ToolCardStatus, PortfolioGlobalStatus }
  from './selectors/aiPortfolioDashboard.selectors'
import type { ToolCode } from '@/types'

// ── Config visual de estado (badge global) ───────────────────

const GLOBAL_BADGE: Record<PortfolioGlobalStatus, { label: string; cls: string }> = {
  complete: { label: 'Completo',  cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  partial:  { label: 'Parcial',   cls: 'bg-[#C8860A]/12 text-[#C8860A]' },
  loading:  { label: 'Cargando',  cls: 'bg-black/5 text-text-subtle dark:bg-white/8 dark:text-gray-400' },
  empty:    { label: 'Sin datos', cls: 'bg-black/5 text-text-subtle dark:bg-white/8 dark:text-gray-400' },
  error:    { label: 'Atención',  cls: 'bg-red-500/10 text-red-600 dark:text-red-400' },
}

// Punto de color por estado de card (señal visual discreta).
const STATUS_DOT: Record<ToolCardStatus, string> = {
  loaded:  'bg-emerald-500',
  empty:   'bg-gray-300 dark:bg-gray-600',
  loading: 'bg-[#C8860A] animate-pulse',
  error:   'bg-red-500',
}

// ── Subcomponentes ────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-black/8 dark:bg-white/10 ${className}`} />
}

/** Tile prominente del hero (señal temprana de valor: T4, T3). */
function ValueSignal({ card }: { card: ToolCardState | undefined }) {
  if (!card) return null
  const label = toolLabel(card.code)

  return (
    <div className="flex-1 rounded-2xl border border-border dark:border-warm-600/30 bg-white dark:bg-warm-800 p-5">
      <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2 truncate">
        {label}
      </p>

      {card.status === 'loading' ? (
        <Skeleton className="h-6 w-3/4 mt-1" />
      ) : card.status === 'loaded' ? (
        <p className="text-lg font-semibold text-lean-black dark:text-gray-100 leading-snug">
          {card.metric}
        </p>
      ) : (
        <p className="text-sm text-text-subtle dark:text-gray-400 leading-snug">
          {card.note ?? '—'}
        </p>
      )}
    </div>
  )
}

/** Fila compacta del bloque de evidencia metodológica (detalle subordinado). */
function ToolDetailRow({ card }: { card: ToolCardState }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border dark:border-warm-600/30 bg-white dark:bg-warm-800 px-4 py-3">
      <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[card.status]}`} />
      <span className="font-mono text-[11px] text-text-subtle shrink-0 w-7">{card.code}</span>
      <span className="text-sm text-lean-black dark:text-gray-200 shrink-0 min-w-0 truncate">
        {toolLabel(card.code)}
      </span>
      <span className="ml-auto text-right text-xs text-text-subtle dark:text-gray-400 truncate">
        {card.status === 'loading'
          ? <Skeleton className="h-3 w-24 inline-block align-middle" />
          : (card.metric ?? card.note ?? '—')}
      </span>
    </div>
  )
}

// ── Helpers de contexto de empresa (hero) ─────────────────────

function CompanyContextLine({ settled }: { settled: boolean }) {
  const profile = useCompanyProfileStore((s) => s.profile)

  if (!settled) return <Skeleton className="h-4 w-64 mt-1" />

  // Copy honesto: sin perfil guardado → neutral, nunca "Falta perfil"
  // (un fallo de red no debe leerse como dato ausente — Gemini).
  if (profile.savedAt === null) {
    return (
      <p className="text-sm text-text-subtle dark:text-gray-400">
        Contexto de empresa pendiente
      </p>
    )
  }

  const bits = [profile.engagementName, profile.sector, profile.tamanoEmpresa]
    .map((s) => s?.trim())
    .filter(Boolean)

  return (
    <p className="text-sm text-text-subtle dark:text-gray-300">
      {bits.length > 0 ? bits.join(' · ') : 'Contexto de empresa pendiente'}
    </p>
  )
}

// ── Componente principal ──────────────────────────────────────

interface AiPortfolioDashboardProps {
  packageId: PackageId
}

export function AiPortfolioDashboard({ packageId }: AiPortfolioDashboardProps) {
  const pkg       = getPackageById(packageId)
  const projectId = useEngagementStore((s) => s.activeEngagementId)

  const phases = useAiPortfolioDashboardLoader(projectId)
  const model  = useAiPortfolioDashboard(phases)

  if (!pkg) return null

  const cardOf = (code: ToolCode): ToolCardState | undefined =>
    model.cards.find((c) => c.code === code)

  const badge          = GLOBAL_BADGE[model.globalStatus]
  const profileSettled = phases.companyProfile === 'settled'

  // Evidencia metodológica = detalle por tool en orden de paquete (T3,T4,T5,T9).
  // T11 se extrae aparte (bloque de cadencia inferior).
  const detailCards = (['T3', 'T4', 'T5', 'T9'] as ToolCode[])
    .map(cardOf)
    .filter((c): c is ToolCardState => Boolean(c))
  const t11 = cardOf('T11')

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

      {/* ── 1 · HERO EJECUTIVO ── */}
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#C8860A]">
            {pkg.dashboardLabel}
          </p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-lean-black dark:text-gray-100">
          {pkg.commercialName}
        </h1>

        <CompanyContextLine settled={profileSettled} />

        {/* Resumen global de 1 línea (síntesis, no detalle) */}
        <p className="text-sm text-lean-black dark:text-gray-200 leading-relaxed max-w-2xl">
          {model.summary}
        </p>
      </header>

      {/* ── 2 · SEÑALES TEMPRANAS (T4, T3) ── */}
      <section className="flex flex-col sm:flex-row gap-4">
        <ValueSignal card={cardOf('T4')} />
        <ValueSignal card={cardOf('T3')} />
      </section>

      {/* ── 3 · EVIDENCIA METODOLÓGICA (subordinada) ── */}
      <section className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Evidencia metodológica
        </p>
        <div className="space-y-2">
          {detailCards.map((card) => (
            <ToolDetailRow key={card.code} card={card} />
          ))}
        </div>
      </section>

      {/* ── 4 · CADENCIA RECOMENDADA (T11, inferior) ── */}
      {t11 && (
        <section className="rounded-2xl border border-border dark:border-warm-600/30 bg-warm-50/60 dark:bg-warm-900/30 p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
            Cadencia recomendada de seguimiento
          </p>
          {t11.status === 'loading' ? (
            <Skeleton className="h-4 w-56" />
          ) : (
            <p className="text-sm text-lean-black dark:text-gray-200 leading-relaxed">
              {t11.status === 'loaded' ? t11.metric : t11.note}
            </p>
          )}
        </section>
      )}

    </div>
  )
}
