// ============================================================
// CompanyProfile — Tipos del módulo
//
// El perfil de empresa es el contexto global del engagement.
// Alimenta T1–T12 vía context_refs.
// Cuando se conecte Supabase: tabla company_profiles + friction_register.
// ============================================================

export type BusinessArea =
  | 'IT / Tecnología'
  | 'Operaciones'
  | 'Finanzas'
  | 'RRHH'
  | 'Ventas'
  | 'Marketing'
  | 'Atención al cliente'
  | 'Legal / Compliance'
  | 'Supply Chain'
  | 'Data / Analytics'
  | 'Dirección General'
  | 'Producto / Innovación'

export const ALL_BUSINESS_AREAS: BusinessArea[] = [
  'IT / Tecnología', 'Operaciones', 'Finanzas', 'RRHH',
  'Ventas', 'Marketing', 'Atención al cliente', 'Legal / Compliance',
  'Supply Chain', 'Data / Analytics', 'Dirección General', 'Producto / Innovación',
]

export const SECTOR_OPTIONS = [
  'Tecnología / Software',
  'Servicios Profesionales',
  'Industria / Manufactura',
  'Servicios Financieros / Banca',
  'Salud / Farmacia',
  'Retail / Consumo',
  'Energía / Utilities',
  'Logística / Distribución',
  'Educación',
  'Administración Pública',
  'Otro',
] as const

export const COMPANY_SIZE_OPTIONS = [
  '50–200 empleados',
  '201–500 empleados',
  '501–1.500 empleados',
  '1.501–5.000 empleados',
  '+5.000 empleados',
] as const

export const IA_OBJECTIVE_OPTIONS = [
  'Automatización de procesos operativos',
  'Mejora de la experiencia del cliente',
  'Análisis y toma de decisiones basada en datos',
  'Productividad del empleado / reducción de carga',
  'Innovación de producto o servicio',
  'Reducción de costes y eficiencia',
  'Gestión del riesgo y compliance',
] as const

export const VALUE_HORIZON_OPTIONS = [
  'Menos de 6 meses',
  '6–12 meses',
  '12–24 meses',
  'Más de 24 meses',
] as const

export const TECH_ECOSYSTEM_OPTIONS = [
  'Microsoft 365 / Azure',
  'Google Workspace / GCP',
  'SAP',
  'Salesforce',
  'AWS',
  'Mixto / Sin ecosistema dominante',
  'Otro',
] as const

// ── Fricciones ─────────────────────────────────────────────────

export type FrictionFrequency = 'Baja' | 'Media' | 'Alta'
export type FrictionImpact    = 'Bajo' | 'Medio' | 'Alto'

export const FRICTION_TYPE_OPTIONS = [
  'Baja adopción de herramientas tecnológicas',
  'Procesos manuales ineficientes',
  'Datos dispersos o de baja calidad',
  'Resistencia al cambio interna',
  'Falta de gobierno y políticas de IA',
  'Coste elevado de licencias sin ROI claro',
  'Shadow IT / herramientas IA no aprobadas',
  'Falta de talento / formación en IA',
  'Velocidad de decisión lenta',
  'Dependencia de proveedores externos',
  'Otro',
] as const

export interface Friction {
  id:           string
  tipo:         string
  areaFuncional: string
  frecuencia:   FrictionFrequency | null
  impacto:      FrictionImpact    | null
  notas:        string
}

// ── Perfil de empresa ─────────────────────────────────────────
//
// NOTA ARQUITECTÓNICA (Sprint 10):
//   sector y tamanoEmpresa son campos de NIVEL EMPRESA.
//   La fuente de verdad para escribirlos es la tabla `companies`
//   (Tab Empresa en CompanyProfileView escribe directamente ahí).
//   Se mantienen en este interface como campos de contexto de solo lectura
//   para que los context builders T1–T11 los puedan consumir sin cambios.
//   NO se escriben desde profileToUpsert (company-profile.service.ts).
//
//   areasPrioritarias es string[] — los valores son nombres de departamentos
//   del store centralizado company_departments (tabla company_departments).

export interface CompanyProfile {
  // Identificación del proyecto
  engagementName:            string
  // Contexto nivel empresa (readonly — fuente de verdad: tabla companies)
  sector:                    string
  tamanoEmpresa:             string
  // Contexto del proyecto
  objetivoPrincipalIA:       string
  horizonteEsperadoValor:    string
  ecosistemaTecnologico:     string
  restriccionesRelevantes:   string
  // Departamentos implicados en este proyecto (nombres de company_departments)
  areasPrioritarias:         string[]
  // Registro de fricciones
  fricciones:                Friction[]
  // Meta
  savedAt:                   string | null
}

export const EMPTY_PROFILE: CompanyProfile = {
  engagementName:          '',
  sector:                  '',
  tamanoEmpresa:           '',
  objetivoPrincipalIA:     '',
  horizonteEsperadoValor:  '',
  ecosistemaTecnologico:   '',
  restriccionesRelevantes: '',
  areasPrioritarias:       [],
  fricciones:              [],
  savedAt:                 null,
}
