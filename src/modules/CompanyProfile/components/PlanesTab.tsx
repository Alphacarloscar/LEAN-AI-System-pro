// ============================================================
// PlanesTab — Gestión de planes contratados a nivel empresa
//
// Muestra los 3 paquetes disponibles y permite activar/desactivar
// cuáles están habilitados para los proyectos de la empresa.
// Al guardar actualiza companies.contracted_packages.
// ============================================================

import { useState, useEffect } from 'react'
import { Button }              from '@shared/design-system/components'
import { supabase }            from '@/lib/supabaseClient'
import { reportError }         from '@/lib/reportError'
import { PACKAGE_GROUPS }      from '@/shared/components/AppSidebar'

interface PlanesTabProps {
  companyId: string
}

interface PackageMeta {
  id:          string
  label:       string
  description: string
  tools:       string
  color:       string
}

const PACKAGE_META: PackageMeta[] = [
  {
    id:          'boost_assessment',
    label:       'Boost Assessment',
    description: 'Diagnóstico de madurez IA, mapa de stakeholders y análisis de adopción.',
    tools:       'T1 · T2 · T7',
    color:       '#2563EB',  // blue
  },
  {
    id:          'portfolio_management',
    label:       'Portfolio Management',
    description: 'Gestión del portafolio de iniciativas IA, roadmap y gobierno operativo.',
    tools:       'T3 · T5 · T8 · T9 · T11',
    color:       '#7C3AED',  // violet
  },
  {
    id:          'legal_compliance',
    label:       'Legal & Compliance',
    description: 'Gestión de riesgos, gobierno IA y cumplimiento normativo ISO 42001.',
    tools:       'T6 · T12',
    color:       '#059669',  // green
  },
]

export function PlanesTab({ companyId }: PlanesTabProps) {
  const [packages, setPackages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving]   = useState(false)
  const [saveMsg, setSaveMsg]     = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('contracted_packages')
          .eq('id', companyId)
          .single()
        if (error) throw error
        setPackages((data?.contracted_packages as string[]) ?? [])
      } catch (err) {
        reportError('[PlanesTab] load', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [companyId])

  function toggle(pkgId: string) {
    setSaveMsg(null)
    setSaveError(null)
    setPackages(prev =>
      prev.includes(pkgId) ? prev.filter(p => p !== pkgId) : [...prev, pkgId]
    )
  }

  async function handleSave() {
    setIsSaving(true)
    setSaveMsg(null)
    setSaveError(null)
    try {
      const { error } = await supabase
        .from('companies')
        .update({ contracted_packages: packages })
        .eq('id', companyId)
      if (error) throw error
      setSaveMsg('Planes guardados correctamente.')
    } catch (err) {
      reportError('[PlanesTab] save', err)
      setSaveError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-lean-black dark:text-warm-50">Planes contratados</h2>
        <p className="text-xs text-text-muted dark:text-warm-300 mt-1">
          Define qué módulos del sistema GOBY están disponibles para los proyectos de esta empresa.
          Los planes activos determinan qué herramientas T1–T12 aparecen desbloqueadas en el menú lateral.
        </p>
      </div>

      <div className="space-y-4">
        {PACKAGE_META.map((pkg) => {
          const active = packages.includes(pkg.id)
          const toolCount = PACKAGE_GROUPS.find(g => g.packageId === pkg.id)?.tools.length ?? 0
          return (
            <div
              key={pkg.id}
              onClick={() => toggle(pkg.id)}
              className={[
                'relative flex items-start gap-4 p-5 rounded-xl border cursor-pointer transition-all duration-150',
                active
                  ? 'border-transparent shadow-sm'
                  : 'border-border dark:border-white/10 hover:border-black/20 dark:hover:border-white/20',
              ].join(' ')}
              style={active ? {
                borderColor:     pkg.color + '55',
                backgroundColor: pkg.color + '09',
              } : {}}
            >
              {/* Indicador color */}
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: active ? pkg.color : 'transparent', minHeight: '100%' }}
              />

              {/* Texto */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-lean-black dark:text-warm-50">
                    {pkg.label}
                  </span>
                  <span className="text-[10px] font-mono text-text-muted dark:text-warm-300">
                    {pkg.tools}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted dark:text-warm-400 border border-border dark:border-white/12 rounded px-1 py-0.5">
                    {toolCount} herramientas
                  </span>
                </div>
                <p className="text-xs text-text-muted dark:text-warm-300 mt-1 leading-relaxed">
                  {pkg.description}
                </p>
              </div>

              {/* Toggle */}
              <div className="shrink-0 mt-0.5">
                <div
                  className={[
                    'w-10 h-5 rounded-full transition-colors duration-200 relative',
                    active ? '' : 'bg-black/15 dark:bg-white/15',
                  ].join(' ')}
                  style={active ? { backgroundColor: pkg.color } : {}}
                >
                  <div className={[
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                    active ? 'translate-x-5' : 'translate-x-0.5',
                  ].join(' ')} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumen */}
      <div className="mt-5 px-4 py-3 rounded-lg bg-surface dark:bg-warm-800/50 border border-border dark:border-white/8">
        <p className="text-[10px] text-text-muted dark:text-warm-400">
          <span className="font-semibold text-lean-black dark:text-warm-200">
            {packages.length === 0 ? 'Sin planes activos' : `${packages.length} plan${packages.length > 1 ? 'es' : ''} activo${packages.length > 1 ? 's' : ''}`}
          </span>
          {' · '}
          Herramientas disponibles: T4 · T10
          {packages.includes('boost_assessment')    && ' · T1 · T2 · T7'}
          {packages.includes('portfolio_management') && ' · T3 · T5 · T8 · T9 · T11'}
          {packages.includes('legal_compliance')     && ' · T6 · T12'}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center gap-3 justify-end">
        {saveMsg   && <span className="text-[10px] text-green-600 dark:text-green-400 font-mono">{saveMsg}</span>}
        {saveError && <span className="text-[10px] text-danger font-mono">{saveError}</span>}
        <Button variant="primary" onClick={handleSave} loading={isSaving} disabled={isSaving}>
          Guardar planes
        </Button>
      </div>

      <p className="mt-4 text-[10px] text-text-muted dark:text-warm-500 leading-relaxed">
        Nota: los cambios en planes no actualizan retroactivamente los proyectos existentes.
        Para modificar los paquetes de un proyecto concreto, edita el proyecto desde la pestaña Proyectos.
      </p>
    </div>
  )
}
