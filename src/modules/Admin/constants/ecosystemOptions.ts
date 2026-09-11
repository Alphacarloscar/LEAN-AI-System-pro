// ============================================================
// Domain-aware options: ecosystem, friction types, labels
// Used in ProjectsTab form for domain-conditional fields
// ============================================================

export const ECOSYSTEM_OPTIONS: Record<string, string[]> = {
  ai_adoption: [
    'Microsoft Azure AI / Copilot',
    'Google Vertex AI / Gemini',
    'AWS Bedrock / SageMaker',
    'OpenAI / ChatGPT Enterprise',
    'IBM watsonx',
    'Ecosistema propio / on-premise',
    'Mixto / Híbrido',
  ],
  transformacion_digital: [
    'Microsoft 365 / Power Platform',
    'Google Workspace',
    'Salesforce',
    'SAP',
    'Oracle Cloud',
    'Infraestructura legacy / on-premise',
    'Mixto / Híbrido',
  ],
}

// Prácticas y frameworks de transformación digital
export const PRACTICES_OPTIONS: Record<string, string[]> = {
  transformacion_digital: [
    'Agile / Scrum',
    'Lean',
    'DevOps',
    'Design Thinking',
    'Digital-first culture',
    'Cloud-native',
    'Microservicios',
  ],
}

// Tipos de problemas / fricciones específicos por dominio
export const FRICTION_TYPES_BY_DOMAIN: Record<string, string[]> = {
  ai_adoption: [
    'Falta de talento / formación en IA',
    'Datos dispersos o de baja calidad',
    'Falta de gobierno y políticas de IA',
    'Resistencia al cambio interna',
    'Coste elevado sin ROI claro',
    'Shadow IT / herramientas IA no aprobadas',
    'Baja adopción de herramientas tecnológicas',
    'Velocidad de decisión lenta',
  ],
  transformacion_digital: [
    'Procesos manuales ineficientes',
    'Sistemas legacy sin integración',
    'Falta de cultura digital',
    'Resistencia al cambio organizacional',
    'Falta de inversión en tecnología',
    'Talento insuficiente en transformación',
    'Silos departamentales',
    'Falta de estrategia digital clara',
  ],
}

export const DEFAULT_ECOSYSTEM_OPTIONS = [
  'Microsoft 365 / Power Platform',
  'Google Workspace',
  'ERP / CRM existente',
  'Infraestructura legacy / on-premise',
  'Mixto / Híbrido',
  'Otro / Personalizado',
]

export const FRICTION_LABELS: Record<string, string> = {
  ai_adoption: 'Fricciones y oportunidades de IA detectadas',
  transformacion_digital: 'Fricciones y oportunidades de transformación detectadas',
}

export const DEFAULT_FRICTION_LABEL = 'Fricciones y oportunidades detectadas'

export const HORIZON_OPTIONS = [
  { value: 'Corto plazo (<6m)', label: 'Corto plazo (<6 meses)' },
  { value: 'Medio plazo (6-18m)', label: 'Medio plazo (6-18 meses)' },
  { value: 'Largo plazo (>18m)', label: 'Largo plazo (>18 meses)' },
]

export function getEcosystemOptions(domainSlug?: string | null): string[] {
  if (domainSlug && domainSlug in ECOSYSTEM_OPTIONS) {
    return ECOSYSTEM_OPTIONS[domainSlug as keyof typeof ECOSYSTEM_OPTIONS]
  }
  return DEFAULT_ECOSYSTEM_OPTIONS
}

export function getEcosystemLabel(domainSlug?: string | null): string {
  if (domainSlug === 'transformacion_digital') {
    return 'Prácticas y frameworks de transformación'
  }
  return 'Ecosistema tecnológico'
}

export function getPracticesOptions(domainSlug?: string | null): string[] {
  if (domainSlug && domainSlug in PRACTICES_OPTIONS) {
    return PRACTICES_OPTIONS[domainSlug as keyof typeof PRACTICES_OPTIONS]
  }
  return []
}

export function getFrictionTypes(domainSlug?: string | null): string[] {
  if (domainSlug && domainSlug in FRICTION_TYPES_BY_DOMAIN) {
    return FRICTION_TYPES_BY_DOMAIN[domainSlug as keyof typeof FRICTION_TYPES_BY_DOMAIN]
  }
  // Default fallback
  return [
    'Falta de talento / formación',
    'Datos de baja calidad',
    'Falta de gobierno',
    'Resistencia al cambio',
    'Coste elevado sin ROI',
    'Herramientas no aprobadas',
    'Baja adopción tecnológica',
    'Velocidad de decisión lenta',
  ]
}

export function getFrictionLabel(domainSlug?: string | null): string {
  if (domainSlug && domainSlug in FRICTION_LABELS) {
    return FRICTION_LABELS[domainSlug as keyof typeof FRICTION_LABELS]
  }
  return DEFAULT_FRICTION_LABEL
}
