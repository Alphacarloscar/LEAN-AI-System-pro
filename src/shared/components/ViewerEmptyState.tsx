// ============================================================
// ViewerEmptyState — estado vacío para usuarios client_viewer
//
// Se muestra cuando un client_viewer accede a una herramienta
// que aún no tiene datos guardados en la BD.
// Reemplaza el empty state estándar ("Crea tu primer dato").
//
// Uso:
//   const { isReadOnly } = usePermissions()
//   if (isReadOnly && items.length === 0) return <ViewerEmptyState />
// ============================================================

export function ViewerEmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Icono — reloj de arena / en progreso */}
      <div className="w-14 h-14 rounded-xl bg-[#F7F4EE] flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
             stroke="#C8860A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3h14M5 21h14M6 3v4l6 5-6 5v4M18 3v4l-6 5 6 5v4" />
        </svg>
      </div>

      <p className="text-sm font-medium text-[#2A2822] mb-2 max-w-xs">
        {message ?? 'Tu consultor o equipo está recopilando los datos para esta sección.'}
      </p>
      <p className="text-xs text-warm-400 max-w-xs">
        Los resultados aparecerán aquí pronto.
      </p>
    </div>
  )
}
