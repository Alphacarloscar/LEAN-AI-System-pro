// ============================================================
// CompanyProfile — Tab Empresa
// ============================================================

import { DepartmentManager }  from '../DepartmentManager'
import { SectionLabel, FieldLabel, LeanSelect } from './CompanyProfileHelpers'
import { SECTOR_OPTIONS, COMPANY_SIZE_OPTIONS } from '../types'

interface CompanySettings {
  sector:       string
  company_size: string
}

interface EmpresaTabProps {
  companyId:              string | null
  companySettings:        CompanySettings
  onSettingsChange:       (patch: Partial<CompanySettings>) => void
  canEditCompanySettings: boolean
}

export function EmpresaTab({
  companyId, companySettings, onSettingsChange, canEditCompanySettings,
}: EmpresaTabProps) {
  return (
    <>
      {/* Sector y tamaño */}
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 p-6 space-y-5">
        <div>
          <SectionLabel>Datos de la empresa</SectionLabel>
          <p className="text-xs text-text-muted dark:text-gray-500 -mt-1">
            Información permanente de la empresa, compartida entre todos sus proyectos.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Sector</FieldLabel>
            <LeanSelect
              value={companySettings.sector}
              onChange={(v) => onSettingsChange({ sector: v })}
              options={SECTOR_OPTIONS}
              placeholder="Seleccionar sector..."
              disabled={!canEditCompanySettings || !companyId}
            />
          </div>
          <div>
            <FieldLabel>Tamaño de empresa</FieldLabel>
            <LeanSelect
              value={companySettings.company_size}
              onChange={(v) => onSettingsChange({ company_size: v })}
              options={COMPANY_SIZE_OPTIONS}
              placeholder="Seleccionar tamaño..."
              disabled={!canEditCompanySettings || !companyId}
            />
          </div>
        </div>
      </div>

      {/* Departamentos */}
      <div className="rounded-xl bg-white dark:bg-gray-900 border border-border dark:border-white/6 p-6 space-y-4">
        <div>
          <SectionLabel>Departamentos de la empresa</SectionLabel>
          <p className="text-xs text-text-muted dark:text-gray-500 -mt-1">
            Lista centralizada compartida entre todos los proyectos.
            Disponible como selector en T2, T3, T4 y T8.
          </p>
        </div>
        <DepartmentManager companyId={companyId} />
      </div>
    </>
  )
}
