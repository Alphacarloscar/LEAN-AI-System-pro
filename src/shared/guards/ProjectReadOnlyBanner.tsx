// ============================================================
// ProjectReadOnlyBanner — Status banner for paused/archived/completed projects
//
// Modeled after PersistenceBanner/RetryBanner pattern.
// Displays reason for read-only mode and suggests next steps.
// ============================================================

import { AlertCircle } from 'lucide-react'

export function ProjectReadOnlyBanner({
  status,
}: {
  status?: 'paused' | 'archived' | 'completed'
}) {
  const statusText = {
    paused: { label: 'Proyecto pausado', color: 'bg-amber-100 text-amber-900' },
    archived: { label: 'Proyecto archivado', color: 'bg-slate-200 text-slate-900' },
    completed: { label: 'Proyecto completado', color: 'bg-slate-200 text-slate-900' },
  }

  const config = status ? statusText[status] : null

  if (!config) return null

  return (
    <div className={`flex items-center gap-3 border-b px-4 py-3 ${config.color}`}>
      <AlertCircle className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
      <div className="text-sm">
        <strong>{config.label}.</strong> Este proyecto está en modo solo lectura.
        Contacta con el administrador si necesitas habilitarlo nuevamente.
      </div>
    </div>
  )
}
