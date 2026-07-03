// ============================================================
// departmentDisplay — tokens visuales compartidos por tipo de
// departamento (IT vs Negocio/Ops).
//
// Usado por DepartmentManager (chips de departamento) y
// CompanyPeopleSection (chip de perfil por persona).
// ============================================================

import { Cpu, Briefcase } from 'lucide-react'
import type { DepartmentType } from '@/types/database.types'

export const DEPARTMENT_TYPE_LABEL: Record<DepartmentType, string> = {
  it:           'IT / Tecnología',
  negocio_ops:  'Negocio & Ops',
}

export const DEPARTMENT_CHIP_CLASS: Record<DepartmentType, string> = {
  it:          'border-navy/30 bg-navy/10 text-navy dark:border-navy/40 dark:bg-navy/20 dark:text-warm-100',
  negocio_ops: 'border-warning/30 bg-warning-light text-warning-dark dark:border-warning/40 dark:bg-warning/20 dark:text-warning-light',
}

export const DEPARTMENT_DOT_CLASS: Record<DepartmentType, string> = {
  it:          'bg-navy',
  negocio_ops: 'bg-warning-dark',
}

/** Icono semántico por tipo — refuerza la distinción visual más allá del color (ADR-021). */
export const DEPARTMENT_TYPE_ICON: Record<DepartmentType, typeof Cpu> = {
  it:          Cpu,
  negocio_ops: Briefcase,
}
