import type { PackageId } from '@/types/packages'
import type { ToolCode } from '@/types'

export interface ToolNavItem {
  code: ToolCode
  moduleCode: ToolCode
  label: string
  path: string
}

export interface PackageGroup {
  packageId: PackageId
  label: string
  tools: ToolNavItem[]
}

export const PACKAGE_GROUPS: PackageGroup[] = [
  {
    packageId: 'boost_assessment',
    label: 'Boost Assessment',
    tools: [
      { code: 'T1', moduleCode: 'T1', label: 'AI Readiness Assessment', path: '/evaluation/projects' },
      { code: 'T2', moduleCode: 'T2', label: 'Stakeholder Matrix', path: '/evaluation/projects' },
      { code: 'T7', moduleCode: 'T7', label: 'Adoption Heatmap', path: '/evaluation/projects' },
    ],
  },
  {
    packageId: 'portfolio_management',
    label: 'Portfolio Management',
    tools: [
      { code: 'T3', moduleCode: 'T3', label: 'Value Stream Map', path: '/evaluation/projects' },
      { code: 'T5', moduleCode: 'T5', label: 'AI Taxonomy Canvas', path: '/evaluation/projects' },
      { code: 'T8', moduleCode: 'T8', label: 'Communication Map', path: '/evaluation/projects' },
      { code: 'T9', moduleCode: 'T9', label: 'AI Roadmap', path: '/evaluation/projects' },
      { code: 'T11', moduleCode: 'T11', label: 'Operating Rhythm', path: '/evaluation/projects' },
    ],
  },
  {
    packageId: 'legal_compliance',
    label: 'Legal & Compliance',
    tools: [
      { code: 'T6', moduleCode: 'T6', label: 'Risk & Governance', path: '/evaluation/projects' },
      { code: 'T12', moduleCode: 'T12', label: 'ISO 42001 Assessment', path: '/evaluation/projects' },
    ],
  },
]

export interface PackageMeta {
  id: PackageId
  label: string
  description: string
  tools: string
  color: string
}

export const PACKAGE_META: PackageMeta[] = [
  {
    id: 'boost_assessment',
    label: 'Boost Assessment',
    description: 'Diagnostico de madurez IA, mapa de stakeholders y analisis de adopcion.',
    tools: 'T1 - T2 - T7',
    color: '#2563EB',
  },
  {
    id: 'portfolio_management',
    label: 'Portfolio Management',
    description: 'Gestion del portafolio de iniciativas IA, roadmap y gobierno operativo.',
    tools: 'T3 - T5 - T8 - T9 - T11',
    color: '#7C3AED',
  },
  {
    id: 'legal_compliance',
    label: 'Legal & Compliance',
    description: 'Gestion de riesgos, gobierno IA y cumplimiento normativo ISO 42001.',
    tools: 'T6 - T12',
    color: '#059669',
  },
]
