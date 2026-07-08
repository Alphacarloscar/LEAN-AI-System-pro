// ============================================================
// GOBY — PackageDashboardView (FDR-002, Fase 1 · Bloque 2 → 3)
//
// Dashboard de un paquete comercial. Router de presentación:
//   — ai-portfolio (Bloque 3) → AiPortfolioDashboard: render derivado
//     read-only (hero ejecutivo + señales + evidencia + cadencia).
//   — resto de paquetes → ficha estática de Bloque 2 (nombre comercial,
//     dolor que ataca, tools que lo componen) hasta que cada uno reciba
//     su propio dashboard derivado (ai-maturity, ai-compliance).
//
// La ficha de Bloque 2 no lee Supabase ni stores de datos: solo
// metadatos estáticos del paquete (salesPackages) + navegación.
// Seguro para flag-on demo.
// ============================================================

import { useNavigate }            from 'react-router-dom'
import type { PackageId }         from '@/config/salesPackages'
import { getPackageById }         from '@/config/salesPackages'
import { buildPackageToolPath }   from '@/config/toolRoutes'
import { toolLabel }              from '@/config/toolMetadata'
import { AiPortfolioDashboard }   from './AiPortfolioDashboard'

interface PackageDashboardViewProps {
  packageId: PackageId
}

export function PackageDashboardView({ packageId }: PackageDashboardViewProps) {
  const navigate = useNavigate()
  const pkg      = getPackageById(packageId)

  // El routing ya valida packageId con isPackageId antes de montar,
  // pero defendemos por si se renderiza fuera de su ruta.
  if (!pkg) return null

  // Bloque 3 — ai-portfolio estrena dashboard derivado. El resto sigue
  // con la ficha estática de Bloque 2 hasta su propio dashboard.
  if (packageId === 'ai-portfolio') {
    return <AiPortfolioDashboard packageId={packageId} />
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

      {/* ── Cabecera del paquete ── */}
      <header className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#C8860A]">
          {pkg.dashboardLabel}
        </p>
        <h1 className="text-2xl font-semibold text-lean-black dark:text-gray-100">
          {pkg.commercialName}
        </h1>
        <p className="text-sm text-text-subtle dark:text-gray-400 max-w-2xl leading-relaxed">
          {pkg.description}
        </p>
      </header>

      {/* ── Dolor del comprador ── */}
      <section className="rounded-2xl border border-border dark:border-warm-600/30 bg-white dark:bg-warm-800 p-5">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle mb-2">
          Dolor que resuelve
        </p>
        <p className="text-sm text-lean-black dark:text-gray-200 italic leading-relaxed">
          “{pkg.primaryBuyerPain}”
        </p>
      </section>

      {/* ── Tools del paquete ── */}
      <section className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
          Herramientas del paquete
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {pkg.tools.map((code) => (
            <button
              key={code}
              onClick={() => navigate(buildPackageToolPath(pkg.id, code))}
              className="flex items-center gap-3 rounded-xl border border-border dark:border-warm-600/30
                bg-white dark:bg-warm-800 px-4 py-3 text-left
                hover:border-[#C8860A]/50 hover:bg-[#C8860A]/5 transition-colors duration-150"
            >
              <span className="font-mono text-[11px] text-[#C8860A] shrink-0 w-7 text-center">
                {code}
              </span>
              <span className="text-sm text-lean-black dark:text-gray-200 truncate">
                {toolLabel(code)}
              </span>
            </button>
          ))}
        </div>
      </section>

    </div>
  )
}
