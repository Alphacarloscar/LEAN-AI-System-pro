// ============================================================
// T1 — AI Readiness Assessment · Constantes de contenido
//
// Aquí vive el contenido que Carlos explica en demo:
// — qué evalúa cada dimensión
// — qué significa cada score (1–5)
// — qué hacer para mejorar (recomendación por gap)
// ============================================================

export interface DimensionDefinition {
  code:         string
  label:        string
  /** 1-2 frases de qué evalúa esta dimensión — para explicar en demo */
  description:  string
  /** Qué significa cada nivel 1–5 */
  scoreLabels:  Record<1|2|3|4|5, string>
  /** Recomendación para pasar del nivel X al siguiente */
  recommendations: Record<1|2|3|4, string>
  /** Peso en el cálculo del overall score (suma = 1) */
  weight:       number
}

export const DIMENSION_DEFINITIONS: DimensionDefinition[] = [
  {
    code:        'strategy',
    label:       'Estrategia',
    description:
      'Evalúa si la organización tiene una visión clara de cómo la IA contribuye a sus objetivos de negocio, ' +
      'con un roadmap definido y responsabilidad ejecutiva asignada.',
    weight: 0.15,
    scoreLabels: {
      1: 'No existe estrategia IA formal. Las iniciativas son oportunistas y sin alineación con el negocio.',
      2: 'Hay voluntad de adoptar IA pero sin roadmap, sin responsable y sin presupuesto asignado.',
      3: 'Estrategia IA documentada con objetivos claros. Aún no integrada en el plan de negocio global.',
      4: 'Estrategia IA integrada en el plan de negocio con KPIs definidos y responsable ejecutivo.',
      5: 'La IA es un diferenciador estratégico central con inversión continua y seguimiento en Consejo.',
    },
    recommendations: {
      1: 'Nombrar un responsable de IA (CIO o equivalente) y definir 3 casos de uso prioritarios con criterios de éxito medibles.',
      2: 'Elaborar un AI Roadmap de 12 meses con quick wins en Q1 y presupuesto piloto aprobado por el Comité.',
      3: 'Integrar los objetivos IA en el Business Plan anual y establecer KPIs de adopción revisados trimestralmente.',
      4: 'Crear un AI Center of Excellence que posicione a la empresa como referente del sector y atraiga talento.',
    },
  },
  {
    code:        'data',
    label:       'Datos',
    description:
      'Mide la calidad, accesibilidad y gobierno de los datos de la organización. ' +
      'Sin datos limpios y accesibles, ningún proyecto IA funciona a escala.',
    weight: 0.15,
    scoreLabels: {
      1: 'Los datos están fragmentados en silos sin gobierno. La calidad es baja o desconocida.',
      2: 'Hay iniciativas de datos aisladas. Acceso difícil y sin estándares corporativos.',
      3: 'Gobierno de datos en construcción. Calidad mejorable pero con procesos formales en marcha.',
      4: 'Datos accesibles, documentados y con gobierno formal. Listos para proyectos IA core.',
      5: 'Cultura data-driven madura. Los datos son un activo estratégico gestionado y monetizado.',
    },
    recommendations: {
      1: 'Auditar las fuentes de datos críticas e identificar los 3 datasets más importantes para los casos de uso IA priorizados.',
      2: 'Designar Data Owners por dominio de negocio y establecer un proceso de data quality básico.',
      3: 'Implementar un Data Catalog corporativo y definir SLAs de calidad de dato para proyectos IA.',
      4: 'Evolucionar hacia una Data Mesh o plataforma de datos en tiempo real que habilite IA generativa.',
    },
  },
  {
    code:        'technology',
    label:       'Tecnología',
    description:
      'Evalúa si la infraestructura tecnológica — cloud, APIs, MLOps — está preparada ' +
      'para desarrollar, desplegar y escalar proyectos de IA.',
    weight: 0.12,
    scoreLabels: {
      1: 'Infraestructura tecnológica no preparada para IA. Sin cloud ni APIs estructuradas.',
      2: 'Infraestructura cloud básica presente pero sin arquitectura IA definida.',
      3: 'Capacidades técnicas para proyectos piloto. Escalabilidad y MLOps limitados.',
      4: 'Stack tecnológico robusto con MLOps básico y capacidad real de escalar proyectos IA.',
      5: 'Infraestructura IA de nivel enterprise: MLOps maduro, datos en tiempo real, APIs abiertas.',
    },
    recommendations: {
      1: 'Migrar a cloud (AWS/Azure/GCP) y establecer una arquitectura de datos básica como prerequisito.',
      2: 'Definir el AI Tech Stack corporativo y realizar un piloto de MLOps en un caso de uso controlado.',
      3: 'Implementar un MLOps pipeline completo (CI/CD para modelos) y estandarizar el acceso a APIs IA.',
      4: 'Adoptar arquitectura de datos en streaming y habilitar IA generativa sobre los datos propios.',
    },
  },
  {
    code:        'talent',
    label:       'Talento',
    description:
      'Mide la capacidad interna de la organización para ejecutar proyectos IA: ' +
      'perfiles técnicos, upskilling del negocio y capacidad de retención.',
    weight: 0.12,
    scoreLabels: {
      1: 'No hay perfiles IA en la organización ni plan de desarrollo de capacidades.',
      2: 'Talento técnico básico presente pero sin especialización en IA/ML.',
      3: 'Equipo IA formándose. Capacidad para pilotos con soporte externo significativo.',
      4: 'Equipo IA interno capaz de ejecutar proyectos sin dependencia total de consultores externos.',
      5: 'Centro de Excelencia IA consolidado. Referente interno y externo. Atrae talento del sector.',
    },
    recommendations: {
      1: 'Identificar el "campeón IA" interno y darle formación y tiempo dedicado. Contratar 1 perfil técnico especializado.',
      2: 'Lanzar programa de upskilling IA para el negocio (no solo IT) y definir la AI Career Path interna.',
      3: 'Formar un equipo IA multidisciplinar (negocio + técnico) y establecer KPIs de desarrollo de talento.',
      4: 'Crear un AI Center of Excellence formal con presupuesto propio y programa de atracción de talento senior.',
    },
  },
  {
    code:        'processes',
    label:       'Procesos',
    description:
      'Evalúa si los procesos de negocio están documentados, analizados y preparados ' +
      'para integrar IA. Sin rediseño de procesos, la IA se injerta en flujos rotos.',
    weight: 0.12,
    scoreLabels: {
      1: 'Los procesos no están documentados ni analizados para oportunidades de automatización.',
      2: 'Algunos procesos documentados pero sin enfoque en IA ni rediseño para automatización.',
      3: 'Procesos clave identificados con potencial IA. Rediseño en curso en áreas prioritarias.',
      4: 'Procesos clave rediseñados para integrar IA. Flujos de trabajo optimizados y medidos.',
      5: 'Excelencia en procesos IA-nativos. Mejora continua sistemática como práctica institucional.',
    },
    recommendations: {
      1: 'Mapear los 5 procesos de mayor coste o mayor volumen de trabajo manual como candidatos IA prioritarios.',
      2: 'Seleccionar 1 proceso piloto, documentarlo con Value Stream Map y rediseñarlo con IA integrada.',
      3: 'Expandir el rediseño de procesos con IA a las 3 áreas de mayor impacto. Medir ahorro y calidad.',
      4: 'Institucionalizar el "AI Process Review" trimestral para identificar continuamente nuevas oportunidades.',
    },
  },
  {
    code:        'culture',
    label:       'Cultura',
    description:
      'Mide la disposición organizativa al cambio tecnológico y la experimentación. ' +
      'La cultura es el factor que más frecuentemente mata los proyectos IA en rollout.',
    weight: 0.13,
    scoreLabels: {
      1: 'La cultura organizativa rechaza activamente el cambio. Alta resistencia al uso de IA.',
      2: 'Resistencia pasiva. El personal usa tecnología por obligación, no por convicción.',
      3: 'Apertura al cambio presente en algunos equipos. Sin programa de gestión del cambio formal.',
      4: 'Cultura de experimentación activa. El personal adopta nuevas herramientas con naturalidad.',
      5: 'Cultura IA-first. La innovación continua y la experimentación son parte del ADN organizativo.',
    },
    recommendations: {
      1: 'Identificar los arquetipos de resistencia (T2) y diseñar un plan de gestión del cambio por perfil antes de lanzar ningún piloto.',
      2: 'Empezar con los Exploradores (máxima receptividad) para crear masa crítica y casos de éxito visibles internamente.',
      3: 'Lanzar programa formal de gestión del cambio con embajadores IA en cada área de negocio.',
      4: 'Institucionalizar el "AI Learning Day" y crear incentivos formales para la experimentación con IA.',
    },
  },
  {
    code:        'governance',
    label:       'Gobernanza',
    description:
      'Evalúa si la organización tiene políticas, procesos de aprobación y mecanismos ' +
      'de control para gestionar los riesgos de la IA de forma responsable.',
    weight: 0.13,
    scoreLabels: {
      1: 'Sin política IA, sin risk register y sin proceso de aprobación de herramientas IA.',
      2: 'Reglas informales sobre IA. Sin proceso formal de evaluación de riesgos ni catálogo aprobado.',
      3: 'Política IA básica en desarrollo. Primeras guías de uso responsable y proceso de compras incipiente.',
      4: 'Marco de gobernanza robusto: AI Policy, risk register, catálogo aprobado y auditoría periódica.',
      5: 'Gobernanza IA referente. Preparado para ISO 42001. Modelo para el sector y los reguladores.',
    },
    recommendations: {
      1: 'Redactar una AI Policy básica (2 páginas) y crear un proceso mínimo de aprobación de herramientas IA nuevas.',
      2: 'Elaborar el primer Risk Register IA con los 10 riesgos más relevantes y sus controles mitigantes.',
      3: 'Publicar el Catálogo de Herramientas IA Aprobadas y establecer auditoría semestral de compliance.',
      4: 'Iniciar el proceso de certificación ISO 42001. El AIMS está ~78% documentado al completar el sprint.',
    },
  },
  {
    code:        'leadership',
    label:       'Liderazgo',
    description:
      'Mide el nivel de patrocinio ejecutivo activo: si la dirección dedica tiempo, ' +
      'presupuesto y visibilidad pública a la adopción IA.',
    weight: 0.08,
    scoreLabels: {
      1: 'El liderazgo no patrocina activamente la adopción IA. Sin mandato ni visibilidad ejecutiva.',
      2: 'Interés directivo presente pero sin mandato formal ni presupuesto comprometido.',
      3: 'Sponsor ejecutivo identificado con compromiso visible pero con recursos y tiempo limitados.',
      4: 'Liderazgo comprometido con recursos, mensajes claros y seguimiento regular en Comité.',
      5: 'El CEO/CIO son referentes públicos en adopción IA. La dirección lidera con el ejemplo activamente.',
    },
    recommendations: {
      1: 'El CEO o CIO debe comunicar públicamente el compromiso con la IA en el All Hands del próximo trimestre.',
      2: 'Nombrar al CIO/CDO como AI Executive Sponsor con presupuesto y tiempo dedicado formalmente.',
      3: 'Incluir el seguimiento de la estrategia IA como punto fijo en el Comité de Dirección trimestral.',
      4: 'El CEO participa en eventos públicos sobre IA del sector. Posiciona a la empresa como referente.',
    },
  },
]

/** Mapa de acceso rápido por código de dimensión */
export const DIMENSION_MAP = Object.fromEntries(
  DIMENSION_DEFINITIONS.map((d) => [d.code, d])
) as Record<string, DimensionDefinition>
