// ============================================================
// T1 — AI Readiness Assessment · Constantes de contenido
//
// 6 dimensiones principales × 4 subdimensiones = 24 puntos de evaluación.
// Cada subdimensión tiene criterios descriptivos para los 5 niveles (0-4).
//
// Estructura:
//   D1 Estrategia    — Visión, roadmap, presupuesto, patrocinio ejecutivo
//   D2 Datos         — Disponibilidad, calidad, volumen, privacidad
//   D3 Tecnología    — Infraestructura, integración, seguridad, MLOps
//   D4 Talento       — Capacidad técnica, formación, cultura, cambio
//   D5 Procesos      — Identificación, rediseño, ROI, metodología pilotos
//   D6 Gobernanza    — Política IA, riesgos, catálogo, auditoría ISO
// ============================================================

// ── Interfaces de definición ──────────────────────────────────

export interface SubdimensionDefinition {
  /** Código único, e.g. 'data-availability' */
  code:         string
  /** Código de la dimensión padre, e.g. 'data' */
  dimensionCode: string
  /** Número de subdimensión visible en UI, e.g. 'D2.1' */
  subdimNumber: string
  /** Etiqueta corta para la UI */
  label:        string
  /** 1 frase de qué evalúa esta subdimensión */
  description:  string
  /** Criterio descriptivo para cada nivel 0-4 */
  criteria:     Record<0|1|2|3|4, string>
}

export interface DimensionDefinition {
  code:             string
  label:            string
  /** Número visible en UI: 'D1'–'D6' */
  dimNumber:        string
  /** 1-2 frases de qué evalúa esta dimensión */
  description:      string
  /** Peso en el cálculo del overall score (suma = 1) */
  weight:           number
  /** Recomendación por nivel de madurez de la dimensión */
  recommendations:  Record<'inicial'|'exploracion'|'desarrollo'|'avanzado', string>
  subdimensions:    SubdimensionDefinition[]
}

// ── D1: Estrategia ────────────────────────────────────────────

const D1: DimensionDefinition = {
  code:        'strategy',
  label:       'Estrategia',
  dimNumber:   'D1',
  description: 'Evalúa si la organización tiene visión clara, roadmap priorizado y patrocinio ejecutivo activo para la adopción de IA.',
  weight:      0.18,
  recommendations: {
    inicial:    'Nombrar un AI Executive Sponsor y documentar 3 casos de uso prioritarios con criterios de éxito medibles en Q1.',
    exploracion: 'Elaborar un AI Roadmap de 12 meses con quick wins en Q1, presupuesto piloto aprobado y sponsor con mandato formal.',
    desarrollo: 'Integrar los objetivos IA en el Business Plan anual y establecer KPIs de adopción revisados trimestralmente.',
    avanzado:   'Crear un AI Center of Excellence que posicione a la empresa como referente del sector y atraiga talento senior.',
  },
  subdimensions: [
    {
      code:          'strategy-vision',
      dimensionCode: 'strategy',
      subdimNumber:  'D1.1',
      label:         'Visión IA corporativa',
      description:   '¿Existe una visión formal de IA alineada con los objetivos de negocio y comunicada internamente?',
      criteria: {
        0: 'No existe ninguna visión ni declaración sobre el papel de la IA en la organización.',
        1: 'Hay interés en IA a nivel directivo pero sin documentación ni formalización.',
        2: 'Existe un documento de visión IA básico, pero no integrado en la estrategia de negocio.',
        3: 'La visión IA está formalizada, comunicada y alineada con los objetivos estratégicos.',
        4: 'La IA es un pilar estratégico central, revisado periódicamente por el Consejo de Administración.',
      },
    },
    {
      code:          'strategy-roadmap',
      dimensionCode: 'strategy',
      subdimNumber:  'D1.2',
      label:         'Roadmap y priorización',
      description:   '¿Hay un roadmap de iniciativas IA con casos de uso priorizados y criterios de éxito definidos?',
      criteria: {
        0: 'No existen iniciativas IA priorizadas ni criterios de selección de casos de uso.',
        1: 'Hay ideas de casos de uso IA pero sin priorización formal ni criterios de éxito definidos.',
        2: 'Existe un backlog de iniciativas IA con criterios básicos, sin roadmap temporal estructurado.',
        3: 'Roadmap IA formal con casos de uso priorizados, criterios de éxito y revisión trimestral.',
        4: 'El roadmap IA está integrado en el Plan de Negocio y se actualiza en cada ciclo estratégico.',
      },
    },
    {
      code:          'strategy-budget',
      dimensionCode: 'strategy',
      subdimNumber:  'D1.3',
      label:         'Presupuesto y recursos',
      description:   '¿Se ha asignado presupuesto específico y un responsable ejecutivo formal para la agenda IA?',
      criteria: {
        0: 'No hay presupuesto ni recursos asignados específicamente a iniciativas IA.',
        1: 'Iniciativas IA financiadas de forma oportunista mediante presupuesto IT general.',
        2: 'Presupuesto IA aprobado para pilotos, pero sin responsable ejecutivo formal designado.',
        3: 'Presupuesto IA específico con responsable ejecutivo (CIO/CDO) y revisión semestral.',
        4: 'Inversión IA estratégica con seguimiento en Comité de Dirección y KPIs de retorno definidos.',
      },
    },
    {
      code:          'strategy-sponsorship',
      dimensionCode: 'strategy',
      subdimNumber:  'D1.4',
      label:         'Patrocinio ejecutivo',
      description:   '¿El C-Suite patrocina activamente y con visibilidad pública la adopción de IA en la organización?',
      criteria: {
        0: 'La dirección no ha tomado posición pública ni comprometido recursos hacia la adopción IA.',
        1: 'Hay interés directivo verbal pero sin mandato formal ni visibilidad interna activa.',
        2: 'Un directivo actúa como sponsor informal con implicación limitada y sin presupuesto propio.',
        3: 'Sponsor ejecutivo designado formalmente con mandato, presupuesto y comunicación interna regular.',
        4: 'El CEO/CIO lidera públicamente la adopción IA, es referente externo e involucra al Consejo.',
      },
    },
  ],
}

// ── D2: Datos ────────────────────────────────────────────────

const D2: DimensionDefinition = {
  code:        'data',
  label:       'Datos',
  dimNumber:   'D2',
  description: 'Mide la calidad, accesibilidad y gobierno de los datos. Sin datos limpios y gobernados, ningún proyecto IA funciona a escala.',
  weight:      0.18,
  recommendations: {
    inicial:    'Auditar las fuentes de datos críticas e identificar los 3 datasets más importantes para los casos de uso IA priorizados.',
    exploracion: 'Designar Data Owners por dominio de negocio y establecer un proceso básico de data quality con SLAs.',
    desarrollo: 'Implementar un Data Catalog corporativo y estandarizar el proceso de Privacy Review para proyectos IA.',
    avanzado:   'Evolucionar hacia una plataforma de datos self-service con monitorización en tiempo real y capacidad generativa.',
  },
  subdimensions: [
    {
      code:          'data-availability',
      dimensionCode: 'data',
      subdimNumber:  'D2.1',
      label:         'Disponibilidad de datos',
      description:   '¿Los datos necesarios para los casos de uso IA identificados son accesibles y están documentados?',
      criteria: {
        0: 'Los datos relevantes para IA están dispersos, inaccesibles o no están identificados.',
        1: 'Los datos existen pero son difícilmente accesibles: silos, formatos heterogéneos, sin documentación.',
        2: 'Fuentes de datos principales identificadas y parcialmente accesibles, sin acceso estandarizado.',
        3: 'Datos clave documentados, accesibles y con proceso de onboarding establecido para proyectos IA.',
        4: 'Plataforma de datos integrada y self-service. Los datos son un activo accesible para toda la organización.',
      },
    },
    {
      code:          'data-quality',
      dimensionCode: 'data',
      subdimNumber:  'D2.2',
      label:         'Calidad y limpieza',
      description:   '¿Existen procesos formales de garantía de calidad del dato con métricas y responsables asignados?',
      criteria: {
        0: 'No se mide ni gestiona la calidad de los datos. Se desconoce el nivel real de integridad.',
        1: 'Los problemas de calidad de dato son conocidos pero no hay proceso de remediación activo.',
        2: 'Proceso básico de calidad de dato en marcha en algunas áreas, sin estándar corporativo.',
        3: 'Data Quality Framework corporativo con métricas, Data Owners designados y SLAs definidos.',
        4: 'Calidad de dato monitorizada en tiempo real, con alertas automáticas y mejora continua sistematizada.',
      },
    },
    {
      code:          'data-volume',
      dimensionCode: 'data',
      subdimNumber:  'D2.3',
      label:         'Volumen y variedad',
      description:   '¿El volumen y la diversidad de datos disponibles son suficientes para los casos de uso IA priorizados?',
      criteria: {
        0: 'El volumen de datos es insuficiente o demasiado limitado en variedad para entrenar o usar modelos IA.',
        1: 'Hay datos pero el volumen o variedad no cubren los casos de uso IA identificados como prioritarios.',
        2: 'Volumen aceptable para pilotos. Gaps de variedad identificados y con plan de recolección en curso.',
        3: 'Datasets de calidad suficiente para proyectos IA en producción. Variedad cubierta para casos core.',
        4: 'Datos ricos, históricos y multidimensionales. Capacidad de datos sintéticos cuando sea necesario.',
      },
    },
    {
      code:          'data-privacy',
      dimensionCode: 'data',
      subdimNumber:  'D2.4',
      label:         'Privacidad y compliance',
      description:   '¿Se gestiona el cumplimiento normativo (GDPR, AI Act) de los datos utilizados en proyectos IA?',
      criteria: {
        0: 'No existe ningún proceso de revisión de privacidad ni cumplimiento normativo para IA.',
        1: 'Se conoce la necesidad de compliance pero sin proceso formal de revisión antes de usar datos en IA.',
        2: 'Revisión de privacidad ad hoc en algunos proyectos IA. GDPR no integrado en el flujo de trabajo.',
        3: 'Privacy by Design integrado en el ciclo de vida IA. DPIAs realizadas cuando aplica.',
        4: 'Marco de privacidad IA maduro, auditado periódicamente. Certificaciones relevantes obtenidas o en proceso.',
      },
    },
  ],
}

// ── D3: Tecnología ───────────────────────────────────────────

const D3: DimensionDefinition = {
  code:        'technology',
  label:       'Tecnología',
  dimNumber:   'D3',
  description: 'Evalúa si la infraestructura cloud, las APIs, la seguridad y el MLOps están preparados para desarrollar y escalar proyectos IA.',
  weight:      0.14,
  recommendations: {
    inicial:    'Migrar a cloud (AWS/Azure/GCP) y definir el AI Tech Stack corporativo como prerequisito mínimo.',
    exploracion: 'Documentar APIs de sistemas core y definir una política de seguridad específica para herramientas IA.',
    desarrollo: 'Implementar un MLOps pipeline básico (CI/CD para modelos) y estandarizar el acceso a APIs IA.',
    avanzado:   'Adoptar arquitectura de datos en streaming y habilitar IA generativa sobre los datos propios.',
  },
  subdimensions: [
    {
      code:          'tech-infrastructure',
      dimensionCode: 'technology',
      subdimNumber:  'D3.1',
      label:         'Infraestructura cloud',
      description:   '¿La infraestructura cloud soporta los requerimientos de carga, escalado y latencia de los proyectos IA?',
      criteria: {
        0: 'Sin infraestructura cloud ni capacidad de escalado para cargas de trabajo de IA.',
        1: 'Infraestructura cloud básica presente pero no dimensionada ni configurada para IA.',
        2: 'Capacidad cloud suficiente para pilotos, sin arquitectura IA formal ni escalado automático.',
        3: 'Stack cloud con servicios IA gestionados (Azure AI, AWS Bedrock, GCP Vertex) operativos y escalables.',
        4: 'Infraestructura IA enterprise: multi-cloud, escalado automático, coste optimizado y monitorizado.',
      },
    },
    {
      code:          'tech-integration',
      dimensionCode: 'technology',
      subdimNumber:  'D3.2',
      label:         'Integración y APIs',
      description:   '¿Existen APIs documentadas que permitan integrar herramientas IA con los sistemas core de la organización?',
      criteria: {
        0: 'Los sistemas core no tienen APIs documentadas. La integración IA requiere desarrollo a medida costoso.',
        1: 'APIs existentes pero sin documentación ni estándares. Las integraciones IA son frágiles y difíciles de mantener.',
        2: 'API Gateway básico en funcionamiento. Integraciones IA existentes pero no estandarizadas.',
        3: 'APIs documentadas y versionadas. Integraciones IA con sistemas core funcionales y mantenidas.',
        4: 'API-first architecture. Integración IA seamless con todos los sistemas core. Developer portal disponible.',
      },
    },
    {
      code:          'tech-security',
      dimensionCode: 'technology',
      subdimNumber:  'D3.3',
      label:         'Seguridad y control de acceso',
      description:   '¿Se aplican controles de seguridad y acceso específicos para los sistemas IA y los datos que consumen?',
      criteria: {
        0: 'Sin controles de seguridad específicos para IA: accesos no gestionados, datos sensibles expuestos.',
        1: 'Seguridad IT básica aplicada, pero sin políticas específicas para sistemas IA y datos sensibles.',
        2: 'Controles de acceso a herramientas IA en progreso. Clasificación de datos IA iniciada.',
        3: 'Política de seguridad IA formal: MFA, RBAC, auditoría de accesos y clasificación de datos implementados.',
        4: 'Zero Trust IA architecture. Auditorías de seguridad continuas, DLP y controles de terceros evaluados.',
      },
    },
    {
      code:          'tech-mlops',
      dimensionCode: 'technology',
      subdimNumber:  'D3.4',
      label:         'MLOps y despliegue de modelos',
      description:   '¿Existe un pipeline reproducible para desplegar, versionar y monitorizar modelos IA en producción?',
      criteria: {
        0: 'Sin capacidad de MLOps. Los modelos IA se despliegan manualmente o no llegan a producción.',
        1: 'Algunos experimentos IA en producción, pero sin pipeline reproducible ni monitorización de modelos.',
        2: 'Pipeline básico de despliegue de modelos en construcción. Monitorización manual y reactiva.',
        3: 'MLOps pipeline operativo: versionado de modelos, CI/CD, monitorización de drift y retraining planificado.',
        4: 'MLOps maduro con feature store, A/B testing de modelos, retraining automático y governance de modelos.',
      },
    },
  ],
}

// ── D4: Talento ──────────────────────────────────────────────

const D4: DimensionDefinition = {
  code:        'talent',
  label:       'Talento',
  dimNumber:   'D4',
  description: 'Mide la capacidad interna para ejecutar proyectos IA: perfiles técnicos, upskilling del negocio, cultura de experimentación y gestión del cambio.',
  weight:      0.16,
  recommendations: {
    inicial:    'Identificar el "campeón IA" interno y darle formación y tiempo dedicado. Contratar 1 perfil técnico especializado.',
    exploracion: 'Lanzar un programa de upskilling IA para negocio (no solo IT) y abrir espacio seguro para experimentación.',
    desarrollo: 'Formar un equipo IA multidisciplinar (negocio + técnico) y lanzar red de embajadores IA por área.',
    avanzado:   'Crear un AI Center of Excellence con presupuesto propio, AI Career Path y programa de atracción de talento.',
  },
  subdimensions: [
    {
      code:          'talent-technical',
      dimensionCode: 'talent',
      subdimNumber:  'D4.1',
      label:         'Capacidad técnica IA',
      description:   '¿Existen perfiles internos con conocimiento técnico especializado en IA (ML, GenAI, prompt engineering)?',
      criteria: {
        0: 'No hay perfiles con conocimiento técnico de IA en la organización.',
        1: 'Perfiles IT con formación técnica genérica, sin especialización en IA/ML/GenAI.',
        2: '1-3 perfiles técnicos con conocimiento de IA. Capacidad para pilotos simples con soporte externo.',
        3: 'Equipo IA interno con perfiles especializados (ML Engineer, Data Scientist, AI Product Manager).',
        4: 'AI Center of Excellence consolidado. Capacidad de investigación aplicada y atracción de talento senior.',
      },
    },
    {
      code:          'talent-training',
      dimensionCode: 'talent',
      subdimNumber:  'D4.2',
      label:         'Formación y upskilling',
      description:   '¿Existe un programa corporativo de formación en IA con itinerarios diferenciados para IT y negocio?',
      criteria: {
        0: 'No existe ningún programa de formación en IA para empleados técnicos ni de negocio.',
        1: 'Formación IA ad hoc a iniciativa individual. Sin programa corporativo ni presupuesto dedicado.',
        2: 'Programa de formación IA en diseño o piloto. Cubre IT, pendiente de extenderse a negocio.',
        3: 'Programa de upskilling IA estructurado con itinerarios para IT y negocio, y métricas de progreso.',
        4: 'Academia IA interna. Certificaciones reconocidas, AI literacy extendida y AI Career Path definida.',
      },
    },
    {
      code:          'talent-culture',
      dimensionCode: 'talent',
      subdimNumber:  'D4.3',
      label:         'Cultura de experimentación',
      description:   '¿La organización tolera el fracaso de pilotos y fomenta activamente la experimentación con IA?',
      criteria: {
        0: 'La organización penaliza el error. No hay espacio seguro para experimentar con IA.',
        1: 'Tolerancia a la experimentación en equipos técnicos, pero no es una práctica institucionalizada.',
        2: 'Cultura de experimentación presente en algunas áreas. Sin mecanismos formales de aprendizaje del fallo.',
        3: 'Cultura de experimentación activa con "safe-to-fail" pilots, retrospectivas formales y lecciones compartidas.',
        4: 'Innovación continua como práctica institucional: hackathons, AI labs, métricas de experimentación y budget propio.',
      },
    },
    {
      code:          'talent-change',
      dimensionCode: 'talent',
      subdimNumber:  'D4.4',
      label:         'Gestión del cambio',
      description:   '¿Hay programas formales de gestión del cambio para la adopción de herramientas y procesos IA?',
      criteria: {
        0: 'No existe ningún proceso de gestión del cambio para la adopción de herramientas IA.',
        1: 'La adopción IA se gestiona como una iniciativa IT más, sin plan de cambio organizativo.',
        2: 'Plan de gestión del cambio en diseño para 1-2 iniciativas IA. Sin metodología corporativa.',
        3: 'Metodología de change management IA aplicada sistemáticamente. Red de embajadores IA por área.',
        4: 'Change management IA como competencia organizativa: equipos certificados y métricas de adopción continuas.',
      },
    },
  ],
}

// ── D5: Procesos ─────────────────────────────────────────────

const D5: DimensionDefinition = {
  code:        'processes',
  label:       'Procesos',
  dimNumber:   'D5',
  description: 'Evalúa si los procesos están documentados, rediseñados para integrar IA de forma nativa, y si se mide el impacto real de cada iniciativa.',
  weight:      0.16,
  recommendations: {
    inicial:    'Mapear los 5 procesos de mayor coste o volumen manual como candidatos IA prioritarios con criterios de éxito.',
    exploracion: 'Seleccionar 1 proceso piloto, rediseñarlo con IA integrada y medir el impacto en los KPIs de ese proceso.',
    desarrollo: 'Expandir el rediseño de procesos con IA a las 3 áreas de mayor impacto e institucionalizar la metodología.',
    avanzado:   'Implementar un "AI Process Review" trimestral y un pipeline continuo de identificación de oportunidades IA.',
  },
  subdimensions: [
    {
      code:          'process-identification',
      dimensionCode: 'processes',
      subdimNumber:  'D5.1',
      label:         'Identificación de oportunidades',
      description:   '¿Existe un proceso formal para identificar y priorizar casos de uso IA en los procesos de negocio?',
      criteria: {
        0: 'No existe ningún proceso para identificar ni priorizar oportunidades IA en los procesos de negocio.',
        1: 'Las oportunidades IA se identifican de forma oportunista, sin metodología ni criterios formales.',
        2: 'Workshops de identificación de casos de uso realizados. Sin proceso continuo ni priorización estructurada.',
        3: 'Proceso formal de AI Opportunity Assessment trimestral con criterios de impacto y viabilidad.',
        4: 'Pipeline continuo de oportunidades IA con scoring automático, integrado en el ciclo de planificación.',
      },
    },
    {
      code:          'process-redesign',
      dimensionCode: 'processes',
      subdimNumber:  'D5.2',
      label:         'Rediseño con IA',
      description:   '¿Los procesos candidatos se han rediseñado para integrar IA de forma nativa, no superpuesta?',
      criteria: {
        0: 'Los procesos no se han rediseñado para IA. La IA se superpone sobre flujos de trabajo existentes y rotos.',
        1: 'Algunos procesos modificados para incluir herramientas IA, sin rediseño estructural del flujo.',
        2: '1-3 procesos piloto rediseñados con IA integrada de forma nativa. Metodología en construcción.',
        3: 'Los procesos de mayor impacto están rediseñados para IA. Metodología de AI Process Design formalizada.',
        4: 'Excelencia en procesos IA-nativos. Todos los procesos core evaluados y optimizados para IA.',
      },
    },
    {
      code:          'process-roi',
      dimensionCode: 'processes',
      subdimNumber:  'D5.3',
      label:         'Medición de impacto y ROI',
      description:   '¿Se mide el impacto real de las iniciativas IA sobre los KPIs de negocio y se reporta al Comité?',
      criteria: {
        0: 'No se mide el impacto de las iniciativas IA. No hay KPIs de proceso post-implementación definidos.',
        1: 'Hay sensación de mejora con IA pero sin métricas formales que la cuantifiquen.',
        2: 'Métricas básicas de uso (nº usuarios, frecuencia). Sin medición de impacto real en KPIs de negocio.',
        3: 'ROI medido en proyectos principales: tiempo ahorrado, reducción de errores, impacto en revenue.',
        4: 'Business case IA medido y reportado al Comité. Decisiones de inversión basadas en ROI demostrado.',
      },
    },
    {
      code:          'process-pilots',
      dimensionCode: 'processes',
      subdimNumber:  'D5.4',
      label:         'Metodología de pilotos',
      description:   '¿Existe una metodología estándar para lanzar, evaluar y escalar pilotos IA a producción?',
      criteria: {
        0: 'No existe ninguna metodología para lanzar, gestionar ni evaluar pilotos IA.',
        1: 'Los pilotos IA se lanzan ad hoc. Sin criterios de éxito ni proceso de escalado a producción.',
        2: 'Plantilla básica de piloto IA en uso en algunos equipos. Sin estándar corporativo.',
        3: 'Metodología de pilotos IA corporativa: Go/No-Go gates, criterios de escalado y registro de aprendizajes.',
        4: 'AI Pilot Factory: pilotos estructurados, tiempo medio a producción < 90 días, lecciones institucionalizadas.',
      },
    },
  ],
}

// ── D6: Gobernanza ───────────────────────────────────────────

const D6: DimensionDefinition = {
  code:        'governance',
  label:       'Gobernanza',
  dimNumber:   'D6',
  description: 'Evalúa si la organización tiene política IA, gestión de riesgos, catálogo de herramientas aprobadas y avance hacia estándares como ISO/IEC 42001.',
  weight:      0.18,
  recommendations: {
    inicial:    'Redactar una AI Policy básica (2 páginas) y crear un proceso mínimo de aprobación de herramientas IA nuevas.',
    exploracion: 'Elaborar el primer Risk Register IA con los 10 riesgos más relevantes y sus controles mitigantes.',
    desarrollo: 'Publicar el Catálogo de Herramientas IA Aprobadas y establecer un ciclo de auditoría semestral.',
    avanzado:   'Iniciar el proceso de certificación ISO/IEC 42001. El AIMS está ~78% documentado al completar el sprint L.E.A.N.',
  },
  subdimensions: [
    {
      code:          'gov-policy',
      dimensionCode: 'governance',
      subdimNumber:  'D6.1',
      label:         'Política de IA corporativa',
      description:   '¿La empresa tiene una AI Policy documentada, aprobada por dirección y comunicada a todos los empleados?',
      criteria: {
        0: 'No existe ninguna política de IA. El uso de herramientas IA no está regulado internamente.',
        1: 'Hay algunas directrices informales sobre IA, sin política documentada ni aprobada por dirección.',
        2: 'Borrador de AI Policy en elaboración. Aún no aprobado ni comunicado a la organización.',
        3: 'AI Policy corporativa aprobada, comunicada y con proceso de revisión anual establecido.',
        4: 'AI Policy enterprise: granular por caso de uso, alineada con EU AI Act y auditada externamente.',
      },
    },
    {
      code:          'gov-risk',
      dimensionCode: 'governance',
      subdimNumber:  'D6.2',
      label:         'Gestión de riesgos IA',
      description:   '¿Existe un risk register específico de IA con controles mitigantes y responsables asignados?',
      criteria: {
        0: 'Sin evaluación de riesgos específica para IA. Los riesgos de iniciativas IA no están identificados.',
        1: 'Algunos riesgos IA identificados informalmente, sin proceso formal ni responsables asignados.',
        2: 'Risk register IA básico elaborado para 1-2 iniciativas. Sin framework corporativo de riesgos IA.',
        3: 'AI Risk Framework corporativo: risk register activo, controles mitigantes y revisión semestral.',
        4: 'Gestión de riesgos IA integrada en Enterprise Risk Management. Alineada con EU AI Act e ISO 42001.',
      },
    },
    {
      code:          'gov-catalog',
      dimensionCode: 'governance',
      subdimNumber:  'D6.3',
      label:         'Catálogo y vendor management',
      description:   '¿Existe un inventario de herramientas IA aprobadas y un proceso centralizado de compra y evaluación?',
      criteria: {
        0: 'Sin inventario de herramientas IA. Se desconoce qué herramientas IA están activas en la organización.',
        1: 'Inventario parcial construido a demanda. Sin proceso de aprobación formal para nuevas herramientas.',
        2: 'Catálogo de herramientas IA básico en construcción. Proceso de compra centralizado en diseño.',
        3: 'Catálogo de herramientas IA aprobadas publicado y actualizado. Vendor management centralizado.',
        4: 'AI Vendor Management maduro: due diligence estándar, contratos con cláusulas IA y revisión periódica.',
      },
    },
    {
      code:          'gov-audit',
      dimensionCode: 'governance',
      subdimNumber:  'D6.4',
      label:         'Auditoría y compliance ISO',
      description:   '¿Se realizan auditorías periódicas de las iniciativas IA y se avanza hacia ISO/IEC 42001?',
      criteria: {
        0: 'Sin ningún proceso de auditoría ni iniciativa de cumplimiento normativo relacionada con IA.',
        1: 'Conciencia de requisitos normativos (EU AI Act, GDPR para IA) pero sin proceso de cumplimiento activo.',
        2: 'Auditoría IA ad hoc realizada. Gap analysis respecto a ISO/IEC 42001 iniciado o planificado.',
        3: 'Auditorías IA periódicas establecidas. AIMS (AI Management System) en construcción para ISO 42001.',
        4: 'Certificación ISO/IEC 42001 obtenida o en fase final. Referente de gobernanza IA para el sector.',
      },
    },
  ],
}

// ── Exports ──────────────────────────────────────────────────

export const DIMENSION_DEFINITIONS: DimensionDefinition[] = [D1, D2, D3, D4, D5, D6]

/** Mapa de acceso rápido por código de dimensión */
export const DIMENSION_MAP = Object.fromEntries(
  DIMENSION_DEFINITIONS.map((d) => [d.code, d])
) as Record<string, DimensionDefinition>

/** Mapa de acceso rápido por código de subdimensión */
export const SUBDIMENSION_MAP = Object.fromEntries(
  DIMENSION_DEFINITIONS.flatMap((d) => d.subdimensions.map((s) => [s.code, s]))
) as Record<string, SubdimensionDefinition>

/** Total de subdimensiones (siempre 24 en Sprint 1) */
export const TOTAL_SUBDIMENSIONS = DIMENSION_DEFINITIONS.reduce(
  (total, d) => total + d.subdimensions.length,
  0
)
