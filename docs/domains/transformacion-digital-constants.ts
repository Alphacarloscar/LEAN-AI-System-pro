// ============================================================
// Transformación Digital — Constantes de contenido (referencia)
//
// Equivalente a src/modules/T1_MaturityRadar/constants.ts
// para el dominio Transformación Digital.
//
// Estructura: 6 dimensiones principales × 4 subdimensiones = 24 puntos de evaluación.
// Cada subdimensión tiene criterios descriptivos para los 5 niveles (0-4).
//
// Uso futuro: Cuando T1 se generalice para múltiples dominios (Fase 6+ ADR-029),
// este archivo será la fuente para generar seed SQL y para cargar DIMENSION_DEFINITIONS
// dinámicamente desde BD según el dominio activo.
//
// Por ahora: archivo de documentación ejecutable — NO se importa en producción.
// ============================================================

// ── Interfaces de definición (idénticas a AI Adoption) ──────

export interface SubdimensionDefinition {
  /** Código único, e.g. 'td-vision-ambicion' */
  code:         string
  /** Código de la dimensión padre, e.g. 'digital_vision' */
  dimensionCode: string
  /** Número de subdimensión visible en UI, e.g. 'D1.1' */
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

// ── D1: Visión y Liderazgo Digital ────────────────────────────

const D1: DimensionDefinition = {
  code:        'digital_vision',
  label:       'Visión y Liderazgo Digital',
  dimNumber:   'D1',
  description: 'Evalúa si la organización tiene una visión clara de transformación digital, alineada con la estrategia de negocio y patrocinada activamente por el C-Suite. Es la dimensión más crítica en TD: sin liderazgo ejecutivo firme, la inversión en infraestructura y talento se disipa.',
  weight:      0.20,
  recommendations: {
    inicial:    'Redactar una Visión Digital de 1 página y designar un CDO (Chief Digital Officer) o equivalente con mandato ejecutivo visible.',
    exploracion: 'Elaborar un Digital Roadmap de 24 meses con quick wins en Q1-Q2, presupuesto aprobado y comunicación ejecutiva trimestral.',
    desarrollo: 'Integrar objetivos TD en el Business Plan anual. Establecer KPIs de transformación revisados mensualmente. CDO con asiento en Comité de Dirección.',
    avanzado:   'Transformación digital como filosofía organizativa. CEO/CDO es referente externo. Inversión en TD integrada en ciclos de estrategia a 3 años.',
  },
  subdimensions: [
    {
      code:          'td-vision-ambicion',
      dimensionCode: 'digital_vision',
      subdimNumber:  'D1.1',
      label:         'Visión Digital Corporativa',
      description:   '¿Existe una visión formal de transformación digital alineada con la estrategia de negocio y comunicada internamente?',
      criteria: {
        0: 'No existe ninguna declaración sobre transformación digital. El cambio es reactivo (respuesta a crisis o presión competitiva).',
        1: 'Hay interés directivo en digitalización, pero sin documento formal ni comunicación sistemática.',
        2: 'Documento de visión digital existe, pero está en silos IT sin alineación clara con objetivos de negocio.',
        3: 'Visión digital formalizada, comunicada anualmente, y alineada explícitamente con plan de negocio 3 años.',
        4: 'Transformación digital es pilar estratégico central. Revisado por Consejo. Accionistas entienden ventaja competitiva esperada.',
      },
    },
    {
      code:          'td-leadership-cdo',
      dimensionCode: 'digital_vision',
      subdimNumber:  'D1.2',
      label:         'Liderazgo Ejecutivo y CDO',
      description:   '¿El C-Suite está patrocinando activamente la transformación y existe un Chief Digital Officer u equivalente designado formalmente?',
      criteria: {
        0: 'Transformación digital delegada únicamente a TI. No hay sponsor ejecutivo de negocio ni CDO.',
        1: 'Hay un CIO o IT director con responsabilidad de TD, pero sin poder presupuestario ni participación en decisiones de negocio.',
        2: 'CDO designado informalmente o con rol de jornada parcial. Autoridad limitada en gasto de capital.',
        3: 'Chief Digital Officer (o equivalente) designado formalmente con presupuesto propio, reporta a CEO y participa en Comité.',
        4: 'CDO visibilidad pública. CEO y CFO respaldan públicamente TD. Transformación integrada en compensación ejecutiva.',
      },
    },
    {
      code:          'td-roadmap-prioritization',
      dimensionCode: 'digital_vision',
      subdimNumber:  'D1.3',
      label:         'Roadmap Digital y Priorización',
      description:   '¿Existe un roadmap de transformación digital estructurado con iniciativas priorizadas y criterios de éxito definidos?',
      criteria: {
        0: 'No existe roadmap. Las iniciativas digitales se ejecutan de forma oportunista o reactiva.',
        1: 'Ideas de iniciativas digitales identificadas, pero sin orden, criterios ni timeline formales.',
        2: 'Roadmap básico en construcción (6-12 meses). Incluye quick wins pero sin visión a 3 años.',
        3: 'Digital Roadmap formal de 24-36 meses con fases, milestones y revisión trimestral por steering committee.',
        4: 'Roadmap integrado en planes de negocio anuales y ciclos de planificación estratégica. Adaptación ágil semestral con datos de progreso.',
      },
    },
    {
      code:          'td-budget-investment',
      dimensionCode: 'digital_vision',
      subdimNumber:  'D1.4',
      label:         'Presupuesto y Financiación de TD',
      description:   '¿Se ha asignado presupuesto específico para transformación digital y existe un modelo de financiación transparente?',
      criteria: {
        0: 'No hay presupuesto dedicado a TD. Se financia con sobrantes de IT o presupuesto operativo.',
        1: 'Presupuesto TD ad hoc año a año, sin compromiso multianual. No es visible al negocio.',
        2: 'Presupuesto anual aprobado para TD pero pequeño (< 5% del IT total). Sin modelo de ROI claro.',
        3: 'Presupuesto TD multianual dedicado (5-10% IT). Modelo de financiación transparente: inversión capex vs. opex clara.',
        4: 'Inversión estratégica en TD (10-15% IT). ROI medido y reportado al Comité. Inversiones adicionales otorgadas según demanda validada.',
      },
    },
  ],
}

// ── D2: Datos y Analítica ────────────────────────────────────

const D2: DimensionDefinition = {
  code:        'data_analytics',
  label:       'Datos y Analítica',
  dimNumber:   'D2',
  description: 'Mide la calidad, accesibilidad y gobierno de datos corporativos. Incluye infraestructura de data warehouse, data catalog y capacidades de analítica empresarial. Sin datos limpiables y gobernados, no hay base para transformación digital sostenida.',
  weight:      0.16,
  recommendations: {
    inicial:    'Auditar fuentes de datos críticas. Identificar 3 datasets prioritarios. Nombrar Data Owner corporativo.',
    exploracion: 'Implementar data warehouse básico (cloud). Establecer SLAs de data quality. Publicar data catalog elemental.',
    desarrollo: 'Data platform cloud operativa con self-service. Monitorización de calidad en tiempo real. Privacidad by design institucionalizada.',
    avanzado:   'Plataforma de datos como activo competitivo. Machine Learning integrado en ingesta. Real-time analytics en todos los procesos core.',
  },
  subdimensions: [
    {
      code:          'td-data-availability',
      dimensionCode: 'data_analytics',
      subdimNumber:  'D2.1',
      label:         'Disponibilidad y Acceso a Datos',
      description:   '¿Los datos críticos de negocio son identificables, accesibles y están documentados?',
      criteria: {
        0: 'Datos dispersos en silos. Sin inventario. Acceso ad hoc requiere soporte IT manual.',
        1: 'Datos identificados pero en múltiples formatos (CSV, DBs propietarias, Excel). Acceso complicado.',
        2: 'Data warehouse básico piloto. Algunas fuentes centralizadas. Acceso mejorado pero documentación incompleta.',
        3: 'Data warehouse cloud operativo. Mayoría de fuentes centralizadas. Data catalog con self-service básico.',
        4: 'Plataforma de datos moderna (data lake/lakehouse). 100% de fuentes críticas integradas. Self-service avanzado con gobernanza automática.',
      },
    },
    {
      code:          'td-data-quality',
      dimensionCode: 'data_analytics',
      subdimNumber:  'D2.2',
      label:         'Calidad de Datos y Gobierno',
      description:   '¿Hay procesos de monitorización de calidad de datos y gobierno de datos corporativo establecido?',
      criteria: {
        0: 'No hay métricas de calidad. Los datos se aceptan tal cual. Errores descubiertos por usuarios finales.',
        1: 'Validaciones básicas en carga de datos. Sin SLAs de calidad ni propietarios de datos formales.',
        2: 'Procesos de data quality en construcción. Data Owners designados. Métricas de completitud y exactitud monitorizadas.',
        3: 'Data governance policy operativa. SLAs de calidad por dataset. Incidentes de calidad reportados y remediados formalmente.',
        4: 'Calidad de datos como métrica de éxito empresarial (publicada). Retraining automático de pipelines cuando drift detectado.',
      },
    },
    {
      code:          'td-data-privacy',
      dimensionCode: 'data_analytics',
      subdimNumber:  'D2.3',
      label:         'Privacy y Cumplimiento de Regulación de Datos',
      description:   '¿Se aplican controles de privacidad y compliance (GDPR, regulación sectorial) en gestión de datos?',
      criteria: {
        0: 'Sin procesos de privacidad o compliance. Riesgo GDPR/regulatorio no gestionado.',
        1: 'Conciencia de GDPR. Privacy Officer designado pero sin procesos sistemáticos de cumplimiento.',
        2: 'Data Protection Impact Assessments realizados ad hoc. Procesos de consent en construcción.',
        3: 'Privacy by design integrada. DPA con proveedores en vigor. Auditorías de compliance anuales.',
        4: 'Privacy como ventaja competitiva. Certificaciones (ISO 27001, etc.). Compliance verificado externamente. Datos trazables por sujeto.',
      },
    },
    {
      code:          'td-data-analytics',
      dimensionCode: 'data_analytics',
      subdimNumber:  'D2.4',
      label:         'Capacidades de Analítica y BI',
      description:   '¿Existe una plataforma de Business Intelligence y capacidades de analítica avanzada (predicción, segmentación)?',
      criteria: {
        0: 'Sin herramientas de BI. Reportes hechos manualmente en Excel por IT.',
        1: 'Herramienta BI básica en piloto. Pocos usuarios. Reportes estáticos.',
        2: 'Plataforma BI operativa con self-service limitado. KPIs corporativos documentados.',
        3: 'BI cloud con self-service. Dashboards en tiempo real para procesos críticos. Primeras correlaciones exploradas.',
        4: 'Advanced analytics operativa (predictive, clustering). Machine learning integrado en dashboards. Decisiones automatizadas en algunos procesos.',
      },
    },
  ],
}

// ── D3: Infraestructura y Cloud ───────────────────────────────

const D3: DimensionDefinition = {
  code:        'infrastructure_cloud',
  label:       'Infraestructura y Cloud',
  dimNumber:   'D3',
  description: 'Evalúa si la infraestructura soporta modernización: migración a cloud, capacidades de integración, escalabilidad y seguridad para cargas de trabajo modernas. Es el cimiento técnico de la transformación.',
  weight:      0.16,
  recommendations: {
    inicial:    'Seleccionar cloud partner (AWS/Azure/GCP). Definir cloud-first policy. Piloto: 1 app a cloud en Q1.',
    exploracion: '30% de carga de trabajo en cloud. VPN/integración on-prem–cloud operativa. Políticas de seguridad cloud en diseño.',
    desarrollo: '60% en cloud. Arquitectura multi-cloud en piloto. Auto-scaling y disaster recovery operativos.',
    avanzado:   '85%+ cloud. Arquitectura serverless normalizada. FinOps integrado. Multi-cloud activo con portabilidad.',
  },
  subdimensions: [
    {
      code:          'td-cloud-adoption',
      dimensionCode: 'infrastructure_cloud',
      subdimNumber:  'D3.1',
      label:         'Adopción Cloud y Modernización de Infraestructura',
      description:   '¿La organización ha migrado aplicaciones y workloads a cloud? ¿Existe una estrategia multi-cloud o single-cloud?',
      criteria: {
        0: '100% on-premise o legacy. Sin iniciativa de cloud.',
        1: 'Piloto de cloud con <5% carga de trabajo. Sin strategy definida. Herramientas por departamento.',
        2: '20-30% cloud. Estrategia single-cloud en construcción. On-prem aún es dominante.',
        3: '50-70% cloud. Estrategia cloud-first establecida. Hybrid cloud con integración operativa.',
        4: '80%+ cloud. Multi-cloud activo o single-cloud optimizado. Infraestructura as code normalizada. Portabilidad entre clouds.',
      },
    },
    {
      code:          'td-api-architecture',
      dimensionCode: 'infrastructure_cloud',
      subdimNumber:  'D3.2',
      label:         'Arquitectura de Integración y APIs',
      description:   '¿Existe una arquitectura de APIs e integración que permita comunicación fluida entre sistemas modernos y legacy?',
      criteria: {
        0: 'Sin APIs. Integraciones por batch o manual. Silos de negocio sin comunicación.',
        1: 'APIs ad hoc construidas para cada integración. Sin estándar. Documentación mínima.',
        2: 'API Gateway básico o ESB en construcción. Estándares REST/SOAP emergentes.',
        3: 'API management centralizado (API Gateway operativo). APIs versionadas, documentadas con Swagger/OpenAPI.',
        4: 'API-first architecture. Developer portal auto-servicio. Rate limiting, OAuth, monitorización integrada. APIs como activos de negocio.',
      },
    },
    {
      code:          'td-cloud-security',
      dimensionCode: 'infrastructure_cloud',
      subdimNumber:  'D3.3',
      label:         'Seguridad en Cloud y Ciberseguridad',
      description:   '¿Se aplican controles de seguridad específicos para workloads en cloud y hay programa de ciberseguridad activo?',
      criteria: {
        0: 'Sin controles cloud-específicos. Misma seguridad on-prem no se aplica a cloud.',
        1: 'Firewalls básicos. Sin Cloud Access Security Broker (CASB) ni políticas de identidad cloud.',
        2: 'Políticas de seguridad cloud en construcción (MFA, RBAC). Auditoría de accesos piloto.',
        3: 'Zero Trust iniciativa en progreso. MFA, RBAC, CASB operativos. Auditorías de seguridad cloud trimestral.',
        4: 'Zero Trust architecture implementada. DLP, SIEM, EDR operativos. Pen testing continuo. Compliance verificado (ISO 27001).',
      },
    },
    {
      code:          'td-devops-cicd',
      dimensionCode: 'infrastructure_cloud',
      subdimNumber:  'D3.4',
      label:         'DevOps, CI/CD y Automatización de Infraestructura',
      description:   '¿Hay pipelines CI/CD operativos y infraestructura automatizada (IaC) para acelerar despliegues?',
      criteria: {
        0: 'Despliegues manuales. Documentación en wiki. Cambios lentos y propensos a errores.',
        1: 'Algunos equipos tienen CI/CD manual. IaC no existe. Despliegues aún muy acoplados.',
        2: 'CI/CD pipeline básico en construcción. Terraform/CloudFormation en piloto. Despliegues siguen siendo lentos.',
        3: 'CI/CD operativo para aplicaciones en cloud. IaC estándar. Despliegues <1 hora. Test automáticos básicos.',
        4: 'GitOps normalizado. IaC para infraestructura y aplicación. Despliegues continuo múltiples veces al día. Auto-scaling y self-healing operativos.',
      },
    },
  ],
}

// ── D4: Talento y Cultura Digital ────────────────────────────

const D4: DimensionDefinition = {
  code:        'talent_culture',
  label:       'Talento y Cultura Digital',
  dimNumber:   'D4',
  description: 'Evalúa la capacidad organizativa de ejecutar transformación digital: perfiles especializados, programas de formación, cultura de experimentación y gestión del cambio. Sin talento y cambio, la tecnología no se adopta.',
  weight:      0.18,
  recommendations: {
    inicial:    'Identificar "campeones digitales" en cada área. Lanzar programa de formación digital básico (cloud, agile, no-code).',
    exploracion: 'Crear equipo Digital Transformation de 5-8 personas. Upskilling para 50% de staff en herramientas clave.',
    desarrollo: 'Digital Academy interna. Cambio culturally institucionalizado (safe-to-fail labs, agile teams, demos mensuales).',
    avanzado:   'Digital-first talent acquisition. AI upskilling para todos. Movilidad interna entre roles digitales. Innovación continua.',
  },
  subdimensions: [
    {
      code:          'td-talent-technical',
      dimensionCode: 'talent_culture',
      subdimNumber:  'D4.1',
      label:         'Perfiles y Capacidades Técnicas Digitales',
      description:   '¿Existen perfiles internos con conocimiento especializado en cloud, DevOps, arquitectura moderna?',
      criteria: {
        0: 'Sin perfiles cloud. Todo desarrollado por consultores externos.',
        1: '1-2 perfiles con formación cloud básica. Capacidad limitada a pilotos.',
        2: '5-10 perfiles con cloud y DevOps. Capacidad para gestionar 30-40% de carga en cloud.',
        3: 'Equipo digital consolidado (15+ perfiles: cloud architects, DevOps, full-stack). Autosuficiencia para 60-70% cloud.',
        4: 'Centro de excelencia digital. Perfiles especializados en micro-servicios, serverless, SRE. Atracción de talento senior. Capacidad de innovación propia.',
      },
    },
    {
      code:          'td-talent-training',
      dimensionCode: 'talent_culture',
      subdimNumber:  'D4.2',
      label:         'Formación y Upskilling Digital',
      description:   '¿Existe programa corporativo de formación en tecnologías y metodologías digitales?',
      criteria: {
        0: 'Sin formación digital. Los empleados aprenden por su cuenta o no aprenden.',
        1: 'Formación ad hoc: cursos online pagados por empleados. Sin presupuesto corporativo.',
        2: 'Programa de upskilling en construcción. Cloud y agile cubiertos. Alcance <30% del staff.',
        3: 'Academia Digital interna con itinerarios para IT y negocio. 50%+ staff con formación digital. Certificaciones cloud reconocidas.',
        4: 'Programa de transformación de talento: formación continua, career paths digitales, becas máster, partnerships con universidades.',
      },
    },
    {
      code:          'td-talent-experimentation',
      dimensionCode: 'talent_culture',
      subdimNumber:  'D4.3',
      label:         'Cultura de Experimentación y Innovación',
      description:   '¿La organización tolera el fracaso y fomenta la experimentación con nuevas tecnologías y metodologías?',
      criteria: {
        0: 'Cultura de "perfección". El fracaso se penaliza. Sin espacio para experimentar.',
        1: 'Tolerancia a experimentación en IT. En negocio no está institucionalizada.',
        2: 'Safe-to-fail pilots lanzados en algunas áreas. Documentación de aprendizajes iniciada.',
        3: 'Cultura de experimentación activa. Hackathons anuales. Innovation labs con presupuesto. Retrospectivas formales.',
        4: 'Innovación continua institucionalizada. Presupuesto de experimentación garantizado (10% tiempo). Startup mentality. Pivot rápido es valorado.',
      },
    },
    {
      code:          'td-talent-change',
      dimensionCode: 'talent_culture',
      subdimNumber:  'D4.4',
      label:         'Gestión del Cambio y Adopción Organizativa',
      description:   '¿Hay programa formal de gestión del cambio para transformación digital con comunicación y empoderamiento?',
      criteria: {
        0: 'Sin comunicación de cambios. La transformación "sucede" sin contexto o preparación del staff.',
        1: 'Comunicación ad hoc de cambios. Sin estrategia de adoption o empoderamiento de usuarios.',
        2: 'Plan de cambio para iniciativas prioritarias. Embajadores digitales en piloto.',
        3: 'Metodología de change management corporativa. Red de embajadores digitales activa. Sesiones de adopción formales.',
        4: 'Change management como capacidad core. Equipos certificados en metodología. Adopción medida y mejorada continuamente. Feedback loops cerrados.',
      },
    },
  ],
}

// ── D5: Experiencia de Cliente ───────────────────────────────

const D5: DimensionDefinition = {
  code:        'customer_experience',
  label:       'Experiencia de Cliente y Canales Digitales',
  dimNumber:   'D5',
  description: 'Mide la capacidad de la organización de ofrecer experiencias digitales modernas (omnichannel, mobile-first, personalizadas). Evalúa madurez de canales digitales y comprensión del customer journey. En TD, el cliente es el norte: la tecnología debe servir a experiencias diferenciadas.',
  weight:      0.16,
  recommendations: {
    inicial:    'Mapear customer journey. Diseñar 1 canal digital prioritario (web o mobile). Medir NPS.',
    exploracion: 'Operacionalizar omnichannel básico. Implementar personificación on-site. CRM cloud integrado.',
    desarrollo: 'Experiencias omnichannel fluidas. Recomendaciones personalizadas por ML. Self-service avanzado (chatbot, IVR inteligente).',
    avanzado:   'Experiencia de cliente proactiva (anticipación de necesidades). Integración 360° de touchpoints. Loyalty diferenciado por persona.',
  },
  subdimensions: [
    {
      code:          'td-customer-channels',
      dimensionCode: 'customer_experience',
      subdimNumber:  'D5.1',
      label:         'Canales Digitales y Omnichannel',
      description:   '¿La organización ofrece múltiples canales digitales integrados (web, mobile, conversacional, etc.)?',
      criteria: {
        0: 'Solo canal físico o web básico obsoleto. Sin mobile, sin integración.',
        1: 'Web y mobile existen pero separados. Sin UX integration ni sincronización de datos de cliente.',
        2: 'Canales emergentes (web + mobile + chat). Algunos datos sincronizados. Experiencia inconsistente entre canales.',
        3: 'Omnichannel operativo: web, mobile, contact center integrados. Datos de cliente sincronizados en tiempo real. UX consistente.',
        4: 'Experiencia omnichannel sofisticada: conversacional (IA), IoT, wearables integrados. Transacciones fluyen sin fricción entre canales.',
      },
    },
    {
      code:          'td-customer-personalization',
      dimensionCode: 'customer_experience',
      subdimNumber:  'D5.2',
      label:         'Personalización y Experiencia Contextual',
      description:   '¿Los canales digitales adaptan la experiencia según perfil, historial e intención del cliente?',
      criteria: {
        0: 'Experiencia genérica para todos. Sin personalización.',
        1: 'Personalización básica (saludos, recomendaciones de producto estáticas).',
        2: 'Personalización emergente: segmentación por cliente type. Recomendaciones dinámicas en web.',
        3: 'Personalización operativa: ML-powered recomendaciones, contenido adaptado por perfil, ofertas contextuales.',
        4: 'Hyper-personalización: experiencia predictiva por cliente. Anticipación de necesidades. Ofertas 1:1 en tiempo real.',
      },
    },
    {
      code:          'td-customer-selfservice',
      dimensionCode: 'customer_experience',
      subdimNumber:  'D5.3',
      label:         'Self-Service y Automatización de Soporte',
      description:   '¿Existen soluciones de autoservicio (FAQ, chatbot, IVR inteligente) que reducen dependencia en soporte humano?',
      criteria: {
        0: 'Sin self-service. Todo requiere contacto con agente.',
        1: 'FAQ estático en web. Chatbot con reglas simples.',
        2: 'Chatbot mejora en construcción. Self-service para operaciones comunes (consulta saldo, cambio contraseña).',
        3: 'Chatbot IA conversacional. Self-service para 60% de consultas. IVR inteligente en contact center.',
        4: 'Self-service avanzado: 85%+ de consultas resueltas sin agente. Escalación automática inteligente. Agentes empoderados por IA.',
      },
    },
    {
      code:          'td-customer-metrics',
      dimensionCode: 'customer_experience',
      subdimNumber:  'D5.4',
      label:         'Medición de Experiencia de Cliente (NPS, CSAT, CX Metrics)',
      description:   '¿Se miden y optimizan continuamente métricas de experiencia de cliente (NPS, CSAT, etc.)?',
      criteria: {
        0: 'Sin medición. Feedback de cliente no sistematizado.',
        1: 'NPS/CSAT medido anualmente. Sin análisis de drivers de insatisfacción.',
        2: 'Encuestas de CSAT trimestrales. Algunos drivers identificados. Acciones reactivas.',
        3: 'CX metrices medidas continuamente (NPS, CSAT, CES). Loops de mejora por canal. Targets de CX en objetivos de negocio.',
        4: 'Real-time CX sensing. Experiencia medida en cada touchpoint. Optimización continua basada en datos. CX es parte de compensación ejecutiva.',
      },
    },
  ],
}

// ── D6: Gobernanza y Gestión del Cambio ──────────────────────

const D6: DimensionDefinition = {
  code:        'governance_change',
  label:       'Gobernanza y Gestión del Cambio',
  dimNumber:   'D6',
  description: 'Evalúa la presencia de marcos de gobierno, procesos de aprobación de inversiones digitales y capacidad de gestión del cambio organizativo a escala. Incluye compliance normativo (GDPR, regulación sectorial) en iniciativas digitales.',
  weight:      0.14,
  recommendations: {
    inicial:    'Crear PMO Digital. Establecer governance básico (steering committee, go/no-go gates).',
    exploracion: 'Definir Digital Governance Policy. Procesos de change management formalizados para 3 iniciativas prioritarias.',
    desarrollo: 'Change management como capacidad institucional. Red de embajadores digitales. Auditoría trimestral de transformación.',
    avanzado:   'Continuous transformation governance. Feedback loops integrados. Adaptación ágil de roadmap. Compliance by design.',
  },
  subdimensions: [
    {
      code:          'td-governance-framework',
      dimensionCode: 'governance_change',
      subdimNumber:  'D6.1',
      label:         'Governance de Transformación Digital',
      description:   '¿Existe un framework de governance con roles, responsabilidades y cadencia de decisions claras?',
      criteria: {
        0: 'Sin governance formal. Decisiones ad hoc. Conflicto entre IT y negocio.',
        1: 'Steering committee informal de TD. Reuniones irregulares. Decisiones sin seguimiento.',
        2: 'Steering committee formal de TD con cadencia mensual. Roles claros pero documentación incompleta.',
        3: 'Governance framework operativo: roles RACI definidos, gates de go/no-go, reporteo de progreso formalizado.',
        4: 'Governance ágil: adaptación rápida sin burocracia. Comité de dirección empoderado para decisiones. Transparencia total de portfolio.',
      },
    },
    {
      code:          'td-governance-risk',
      dimensionCode: 'governance_change',
      subdimNumber:  'D6.2',
      label:         'Gestión de Riesgos de Transformación Digital',
      description:   '¿Se identifican y mitigan activamente riesgos de transformación digital (técnicos, organizacionales, de cambio)?',
      criteria: {
        0: 'Sin risk register. Riesgos emergen en crisis.',
        1: 'Algunos riesgos identificados informalmente. Sin plan de mitigación.',
        2: 'Risk register básico de TD. Riesgos priorizados pero sin dueños claros.',
        3: 'Risk register operativo: técnicos, organizacionales y cambio. Controles mitigantes identificados. Revisión trimestral.',
        4: 'Gestión proactiva de riesgos: early warning indicators, escenarios, simulaciones. Riesgos materializados raramente.',
      },
    },
    {
      code:          'td-governance-compliance',
      dimensionCode: 'governance_change',
      subdimNumber:  'D6.3',
      label:         'Compliance, Seguridad y Cumplimiento Normativo',
      description:   '¿Se aseguran el cumplimiento de regulaciones (GDPR, sector-específicas) en iniciativas de transformación digital?',
      criteria: {
        0: 'Sin proceso de compliance. Iniciativas digitales son riesgos regulatorios latentes.',
        1: 'Conciencia de regulaciones. Privacy Officer pero sin procesos sistemáticos en TD.',
        2: 'Due diligence de compliance por iniciativa. Auditorías internas ocasionales.',
        3: 'Compliance by design integrado. Auditorías anuales de iniciativas TD. Certificaciones sector-específicas (e.g., ISO 27001).',
        4: 'Compliance automatizado donde es posible. Auditorías continuas. Certificaciones múltiples. Referente de cumplimiento para el sector.',
      },
    },
    {
      code:          'td-governance-measurement',
      dimensionCode: 'governance_change',
      subdimNumber:  'D6.4',
      label:         'Monitorización y Medición de Progreso de TD',
      description:   '¿Se miden objetivamente el progreso, el impacto y el ROI de iniciativas de transformación digital?',
      criteria: {
        0: 'Sin métricas. Progreso es "sensación" subjetiva.',
        1: 'Algunas métricas de actividad (# de iniciativas lanzadas). Sin medición de impacto.',
        2: 'Métricas de impacto básicas: adopción de usuarios, time-to-market. Sin consolidación en scorecard.',
        3: 'Cuadro de mando de TD operativo: KPIs técnicos (uptime, deployment frequency) y negocio (revenue, eficiencia).',
        4: 'Digital Maturity Model medido continuamente. ROI de cada iniciativa rastreado. Datos de progreso transparentes para toda la organización.',
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
  DIMENSION_DEFINITIONS.flatMap((d) =>
    d.subdimensions.map((s) => [s.code, s])
  )
) as Record<string, SubdimensionDefinition>

/** Total de subdimensiones = 24 */
export const TOTAL_SUBDIMENSIONS = DIMENSION_DEFINITIONS.reduce(
  (sum, d) => sum + d.subdimensions.length,
  0
)
