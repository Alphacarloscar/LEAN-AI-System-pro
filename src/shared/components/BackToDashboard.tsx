// ============================================================
// BackToDashboard — Control canónico de vuelta al dashboard
//
// Único componente para el botón "Volver al dashboard" usado en
// las cabeceras de todas las herramientas T1–T12 y vistas afines.
// Sustituye a las ~13 variantes hand-rolled que existían antes
// (P1, Sprint 11). Patrón canónico: inline icono + texto.
//
// Comportamiento: navega a '/' (dashboard) por defecto. Acepta
// onClick para preservar el contrato `onBack` que App.tsx inyecta
// en cada vista (que ya equivale a navigate('/')).
//
// El texto es FIJO ("Volver al dashboard") y NO es parametrizable
// por diseño (FDR-001): así ninguna herramienta puede reintroducir
// variantes como "Volver", "Dashboard" o "Ir al dashboard".
//
// Uso:
//   <BackToDashboard onClick={onBack} />
//   <BackToDashboard />                 // auto-navega a '/'
//   <BackToDashboard className="mb-3" /> // margen contextual
// ============================================================

import { useNavigate } from 'react-router-dom'

interface BackToDashboardProps {
  /** Sobrescribe la acción de click. Si se omite, navega a '/'.
   *  Solo debe usarse para respetar la navegación canónica (delegar
   *  en el `onBack` del parent, que ya equivale a navigate('/')). */
  onClick?: () => void
  /** Clases extra para layout contextual (márgenes, etc.). */
  className?: string
}

export function BackToDashboard({
  onClick,
  className = '',
}: BackToDashboardProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={onClick ?? (() => navigate('/'))}
      className={`flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-lean-black dark:text-gray-400 dark:hover:text-gray-200 transition-colors ${className}`.trim()}
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 12L6 8l4-4" />
      </svg>
      Volver al dashboard
    </button>
  )
}
