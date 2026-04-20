// ============================================================
// LEAN AI System — App root
//
// Sprint 1: demo mode con 5 patrones de gestión seleccionables.
// Todos los datos vienen de src/data/demo/ — tipados contra
// los mismos tipos que los componentes UI.
//
// Sprint 2 añadirá: BrowserRouter + rutas reales + AuthProvider.
// ============================================================

import { useState, useEffect }         from 'react'
import { PhaseRoadmap }                from '@/shared/components/PhaseRoadmap'
import { ChartWrapper, LeanRadarChart, LeanBarChart, DEMO_KPI_DATA } from '@/shared/components/charts'
import { MetricHeroGrid }              from '@/shared/components/MetricHero'
import { AppSidebar }                  from '@/shared/components/AppSidebar'
import {
  DEMO_SCENARIOS,
  DEFAULT_DEMO_SCENARIO,
  getDemoScenario,
  type DemoPattern,
  type DemoScenario,
} from '@/data/demo'
import { T1View } from '@/modules/T1_MaturityRadar'

// ── Tipos de vista de la app ──────────────────────────────────
type AppView = 'dashboard' | 't1-assessment'

// ── Dark mode hook ────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  return { dark, toggle: () => setDark((v) => !v) }
}

// ── Icono sol / luna ──────────────────────────────────────────
function DarkModeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={[
        'h-8 w-8 rounded-full flex items-center justify-center',
        'transition-colors duration-200',
        dark
          ? 'bg-white/10 hover:bg-white/20 text-white/70'
          : 'bg-black/5 hover:bg-black/10 text-black/40',
      ].join(' ')}
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="7.5" cy="7.5" r="2.5" />
          <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.2 3.2l1 1M10.8 10.8l1 1M10.8 3.2l-1 1M3.2 10.8l1-1" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 9A6 6 0 015 2a6 6 0 100 10 6 6 0 007-3z" />
        </svg>
      )}
    </button>
  )
}

// ── Logo slot ──────────────────────────────────────────────────
function LogoSlot({ src, alt, align = 'left' }: {
  src?:   string
  alt:    string
  align?: 'left' | 'right'
}) {
  if (src) return <img src={src} alt={alt} className="h-8 w-auto object-contain" />
  return (
    <div className={[
      'flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed',
      'border-black/20 text-[10px] font-mono text-black/30 select-none',
      align === 'right' ? 'flex-row-reverse' : '',
    ].join(' ')}>
      <svg className="h-3.5 w-3.5 opacity-50" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="3" width="14" height="10" rx="1.5" />
        <circle cx="5.5" cy="7" r="1.5" />
        <path d="M1 11l4-3 3 2.5 3-3 4 3.5" />
      </svg>
      {alt}
    </div>
  )
}

// ── Selector de patrón de demo ────────────────────────────────
// Permite cambiar de escenario durante una demo en vivo.
// Diseño: chips horizontales, minimalistas, sin distraer del contenido.
function ScenarioSelector({
  active,
  onChange,
}: {
  active:   DemoPattern
  onChange: (p: DemoPattern) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mr-1">
        Patrón demo
      </span>
      {DEMO_SCENARIOS.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={[
            'px-3 py-1 rounded-full text-xs font-medium transition-all duration-150',
            active === s.id
              ? 'bg-navy text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted hover:bg-gray-200 dark:hover:bg-gray-700',
          ].join(' ')}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

// ── Tarjeta de empresa ────────────────────────────────────────
// Muestra el perfil de la empresa ficticia del escenario activo.
function CompanyCard({ scenario }: { scenario: DemoScenario }) {
  const { company, narrative } = scenario
  return (
    <div className="rounded-2xl bg-white dark-card px-8 py-6 card-border">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
            Empresa demo — {company.industry}
          </p>
          <h2 className="text-lg font-semibold text-lean-black dark:text-gray-100">
            {company.name}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            {company.employees.toLocaleString('es-ES')} empleados · {company.country}
          </p>
        </div>
        <div className="max-w-md">
          <p className="text-sm text-text-muted leading-relaxed italic">
            "{narrative.hook}"
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Preview de Quick Win (QW4) ────────────────────────────────
// Muestra el Licence Waste Report cuando el escenario tiene QW preview.
function QuickWinCard({ scenario }: { scenario: DemoScenario }) {
  const qw = scenario.quickWinPreview
  if (!qw?.licenceItems?.length) return null

  const riskColors = {
    low:    'text-success-dark bg-success-light',
    medium: 'text-warning-dark bg-warning-light',
    high:   'text-danger-dark  bg-danger-light',
  } as const

  const riskLabels = { low: 'Bajo', medium: 'Medio', high: 'Alto' } as const

  const total = qw.licenceItems.reduce((acc, item) => acc + item.annualWaste, 0)

  return (
    <div className="rounded-2xl bg-white dark-card px-8 py-6 card-border">
      {/* Cabecera */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy text-white">
              {qw.qwCode}
            </span>
            <p className="text-xs font-mono uppercase tracking-widest text-text-subtle">
              Quick Win — generado automáticamente
            </p>
          </div>
          <h3 className="text-base font-semibold text-lean-black dark:text-gray-100">
            {qw.title}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">{qw.subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-lean-black dark:text-gray-100 tabular-nums">
            {qw.totalValue}
          </p>
          <p className="text-xs text-text-subtle">ahorro potencial anual</p>
        </div>
      </div>

      {/* Tabla de licencias duplicadas */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-xs font-medium text-text-subtle">Categoría</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-text-subtle">Contratos</th>
              <th className="text-center py-2 px-3 text-xs font-medium text-text-subtle">Dptos.</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-text-subtle">Coste duplicado/año</th>
              <th className="text-center py-2 pl-3 text-xs font-medium text-text-subtle">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            {qw.licenceItems.map((item, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-lean-black dark:text-gray-200">{item.category}</p>
                  <p className="text-[11px] text-text-subtle mt-0.5">
                    {item.examples.slice(0, 3).join(' · ')}{item.examples.length > 3 ? ` +${item.examples.length - 3}` : ''}
                  </p>
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums font-medium text-lean-black dark:text-gray-200">
                  {item.contracts}
                </td>
                <td className="py-2.5 px-3 text-center tabular-nums text-text-muted">
                  {item.departments}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-lean-black dark:text-gray-200">
                  €{item.annualWaste.toLocaleString('es-ES')}
                </td>
                <td className="py-2.5 pl-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${riskColors[item.risk]}`}>
                    {riskLabels[item.risk]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={3} className="py-3 pr-4 text-xs font-medium text-text-muted">
                Total estimado de gasto duplicado
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-base font-bold text-lean-black dark:text-gray-100">
                €{total.toLocaleString('es-ES')}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {qw.impactSummary && (
        <p className="mt-4 text-xs text-text-muted border-t border-border pt-4">
          {qw.impactSummary}
        </p>
      )}
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────

export default function App() {
  const { dark, toggle }                  = useDarkMode()
  const [activePattern, setActivePattern] = useState<DemoPattern>(DEFAULT_DEMO_SCENARIO.id)
  const [currentView, setCurrentView]     = useState<AppView>('dashboard')

  const scenario = getDemoScenario(activePattern)

  // Navegación a herramienta desde Metro Map o Sidebar
  function handleToolClick(_phase: unknown, tool: { code: string }) {
    if (tool.code === 'T1') setCurrentView('t1-assessment')
    // Sprint 2: añadir T2, T3...
  }

  // ── T1 View ─────────────────────────────────────────────────
  if (currentView === 't1-assessment') {
    return (
      <T1View
        scenario={scenario}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-surface dark-page-bg">

      {/* ── Cabecera sticky ── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-3 backdrop-blur-sm header-border-bottom app-header-bg">
        <LogoSlot alt="Logo Alpha" align="left" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-black/25 dark:text-white/25">
          L.E.A.N. AI System
        </span>
        <div className="flex items-center gap-3">
          <DarkModeToggle dark={dark} onToggle={toggle} />
          <LogoSlot alt="Logo Cliente" align="right" />
        </div>
      </header>

      {/* ── Sidebar de herramientas ── */}
      <AppSidebar
        phases={scenario.phases}
        onToolSelect={handleToolClick}
      />

      <div className="max-w-5xl mx-auto space-y-8 px-8 py-8">

        {/* ── Sub-header + selector de patrón ── */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-1">
              {scenario.company.name} · Sprint L.E.A.N.
            </p>
            <h1 className="text-xl font-semibold text-lean-black dark:text-gray-100">
              Roadmap de adopción IA
            </h1>
          </div>
          <ScenarioSelector active={activePattern} onChange={setActivePattern} />
        </div>

        {/* ── Tarjeta de empresa ── */}
        <CompanyCard scenario={scenario} />

        {/* ── MetricHero — resumen ejecutivo ── */}
        <div className="rounded-2xl bg-white dark-card px-8 py-6 card-border">
          <p className="text-xs font-mono uppercase tracking-widest text-text-subtle mb-5">
            Indicadores de situación actual
          </p>
          <MetricHeroGrid
            cols={4}
            metrics={scenario.heroMetrics}
          />
        </div>

        {/* ── Metro Map — roadmap de fases ── */}
        <div className="rounded-2xl bg-white dark-card p-8 card-border">
          <PhaseRoadmap
            phases={scenario.phases}
            onToolClick={handleToolClick}
          />
        </div>

        {/* ── Charts — T1 radar + KPI bar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper
            title="AI Readiness Assessment — T1"
            subtitle={`Madurez IA por dimensión · ${scenario.company.name}`}
            height={320}
          >
            <LeanRadarChart data={scenario.t1Radar} showTarget />
          </ChartWrapper>

          <ChartWrapper
            title="KPI Dashboard"
            subtitle="Impacto medido vs. objetivo (%)"
            height={320}
          >
            <LeanBarChart
              data={DEMO_KPI_DATA}
              keys={['actual', 'target']}
              unit="%"
              referenceValue={70}
              referenceLabel="Umbral éxito"
            />
          </ChartWrapper>
        </div>

        {/* ── QW4 Preview — solo para vendor-sprawl ── */}
        <QuickWinCard scenario={scenario} />

      </div>
    </div>
  )
}
