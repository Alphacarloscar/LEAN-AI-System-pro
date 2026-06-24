// ============================================================
// T2 — DepartmentMatrix
//
// Columna izquierda: stakeholders agrupados por departamento.
// Cada departamento muestra chips de arquetipo y badges de
// resistencia. Click en stakeholder → activa panel derecho.
// ============================================================

import { useState, useMemo } from 'react'
import { usePermissions }    from '@/modules/Auth'
import { Card }              from '@shared/design-system/components'
import { ARCHETYPE_CONFIG }  from '../constants'
import type { Stakeholder, ArchetypeCode } from '../types'
import { ArchetypeDot, ArchetypeBadge, ResistanceBadge } from './T2Badges'

interface DepartmentMatrixProps {
  stakeholders: Stakeholder[]
  activeId:     string | null
  onSelect:     (s: Stakeholder) => void
}

export function DepartmentMatrix({
  stakeholders,
  activeId,
  onSelect,
}: DepartmentMatrixProps) {
  const { isReadOnly } = usePermissions()
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(() => {
    if (stakeholders.length === 0) return new Set<string>()
    return new Set<string>([stakeholders[0].department])
  })

  function toggleDept(dept: string) {
    setExpandedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept)
      else next.add(dept)
      return next
    })
  }

  const departments = useMemo(() => {
    const map = new Map<string, Stakeholder[]>()
    stakeholders.forEach((s) => {
      if (!map.has(s.department)) map.set(s.department, [])
      map.get(s.department)!.push(s)
    })
    return map
  }, [stakeholders])

  const archetypeCounts = useMemo(() => {
    const counts: Partial<Record<ArchetypeCode, number>> = {}
    stakeholders.forEach((s) => { counts[s.archetype] = (counts[s.archetype] ?? 0) + 1 })
    return counts
  }, [stakeholders])

  const highRiskCount = stakeholders.filter(
    (s) => s.resistance === 'alta' && (s.archetype === 'critico' || s.archetype === 'decisor')
  ).length

  if (stakeholders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-text-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <p className="text-sm font-medium text-lean-black dark:text-gray-200">Sin stakeholders registrados</p>
        {isReadOnly ? (
          <p className="text-xs text-text-subtle mt-1">Tu consultor está preparando los datos de esta sección.</p>
        ) : (
          <p className="text-xs text-text-subtle mt-1">Usa el botón "Nueva entrevista" para añadir el primero.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Resumen global */}
      <Card variant="outlined" padding="none" className="rounded-xl px-5 py-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle">
            Distribución de arquetipos
          </p>
          <span className="text-[10px] font-mono text-text-subtle">
            {stakeholders.length} stakeholders · {departments.size} departamentos
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(archetypeCounts) as [ArchetypeCode, number][]).map(([code, count]) => {
            const cfg = ARCHETYPE_CONFIG[code]
            return (
              <div key={code} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${cfg.badgeBg} ${cfg.badgeText}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotBg}`} />
                {cfg.label}
                <span className="font-bold">{count}</span>
              </div>
            )
          })}
        </div>
        {highRiskCount > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-danger-light border border-danger-dark/20">
            <svg className="h-3.5 w-3.5 text-danger-dark shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clipRule="evenodd" />
            </svg>
            <p className="text-[11px] text-danger-dark font-medium">
              {highRiskCount} perfil{highRiskCount > 1 ? 'es' : ''} de riesgo alto — acción requerida antes del piloto
            </p>
          </div>
        )}
      </Card>

      {/* Departamentos — colapsables */}
      {Array.from(departments.entries()).map(([dept, members]) => {
        const isCollapsed = !expandedDepts.has(dept)
        return (
          <div key={dept} className="rounded-xl border border-border bg-white dark:bg-gray-900 overflow-hidden">

            <button
              onClick={() => toggleDept(dept)}
              className="w-full px-5 py-3 border-b border-border bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between hover:bg-gray-100/60 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`h-3 w-3 text-text-subtle transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                  viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M4 2l4 4-4 4" />
                </svg>
                <p className="text-xs font-semibold text-lean-black dark:text-gray-200">{dept}</p>
                <span className="text-[10px] text-text-subtle">{members.length} persona{members.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex gap-1">
                {members.map((s) => (
                  <ArchetypeDot key={s.id} archetype={s.archetype} />
                ))}
              </div>
            </button>

            {!isCollapsed && (
              <div className="divide-y divide-border/50">
                {members.map((s) => {
                  const isActive = s.id === activeId
                  const isRisk   = s.resistance === 'alta' && (s.archetype === 'critico' || s.archetype === 'decisor')
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelect(s)}
                      className={[
                        'w-full flex items-center gap-3 px-5 py-3 text-left transition-all duration-150',
                        isActive
                          ? 'bg-navy/5 dark:bg-navy/10 border-l-2 border-navy'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent',
                      ].join(' ')}
                    >
                      <ArchetypeDot archetype={s.archetype} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-navy dark:text-warm-100' : 'text-lean-black dark:text-gray-200'}`}>
                          {s.name}
                          {isRisk && (
                            <svg className="inline h-3 w-3 text-danger-dark ml-1" viewBox="0 0 16 16" fill="currentColor">
                              <path fillRule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clipRule="evenodd" />
                            </svg>
                          )}
                        </p>
                        <p className="text-[11px] text-text-subtle truncate">{s.role}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <ArchetypeBadge archetype={s.archetype} />
                        <ResistanceBadge resistance={s.resistance} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
