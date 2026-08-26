// ============================================================
// Domain-aware ecosystem options and labels
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

export const DEFAULT_ECOSYSTEM_OPTIONS = [
  'Microsoft Azure AI / Copilot',
  'Google Vertex AI / Gemini',
  'AWS Bedrock / SageMaker',
  'OpenAI / ChatGPT Enterprise',
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

export function getFrictionLabel(domainSlug?: string | null): string {
  if (domainSlug && domainSlug in FRICTION_LABELS) {
    return FRICTION_LABELS[domainSlug as keyof typeof FRICTION_LABELS]
  }
  return DEFAULT_FRICTION_LABEL
}
