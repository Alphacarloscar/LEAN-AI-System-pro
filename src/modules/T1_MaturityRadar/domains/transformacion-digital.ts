// ============================================================
// T1 — Dominio: Transformación Digital (TD)
// Versión: 2.0.0 | 2026-08-28
// Panel de referencia: Jeanne Ross (MIT CISR) · John Thorp (Val IT) ·
//   Redman+Ladley (Data Governance) · García Gasulla (DORA/NIS2) · Westerman (TD Readiness)
// Marcos: COBIT 2019 · DORA · NIS2 · ITIL 4 · ISO 27001 · Val IT
// ============================================================

import type { DimensionDefinition } from '../constants'
import type { MaturityTier, TierConfig } from '../types'

export const TD_DIMENSION_DEFINITIONS: DimensionDefinition[] = [

  // ── D1 · Estrategia ────────────────────────────────────────
  {
    code:        'digital_vision',
    label:       'Estrategia Digital',
    dimNumber:   'D1',
    weight:      0.17,
    description: 'Evalúa si la organización tiene una visión clara de transformación digital, un roadmap estructurado con iniciativas priorizadas, presupuesto asignado y liderazgo ejecutivo comprometido con el cambio.',
    recommendations: {
      inicial: 'Formalizar una visión de transformación digital y constituir un comité de gobierno con patrocinio ejecutivo.',
      exploracion: 'Documentar el roadmap digital con iniciativas priorizadas, asignar presupuesto específico y designar responsable ejecutivo (CDO/CIO).',
      desarrollo: 'Institucionalizar la visión digital en la estrategia corporativa, integrar métricas de transformación en OKRs del Comité de Dirección y acelerar el roadmap.',
      avanzado: 'Establecer ciclos de revisión regular del roadmap digital, medir retorno de inversión sistematicamente y comunicar avances públicamente como diferenciador estratégico.',
    },
    subdimensions: [
      {
        code:          'td-vision-ambicion',
        dimensionCode: 'digital_vision',
        subdimNumber:  'D1.1',
        label:         'Visión de Transformación Digital',
        description:   '¿Existe una visión formal de transformación digital alineada con los objetivos de negocio y comunicada a toda la organización?',
        criteria: {
          0: 'No existe ninguna visión ni declaración sobre el papel de la tecnología digital en la estrategia de la organización.',
          1: 'Hay interés en digitalización a nivel directivo pero sin documentación ni formalización de la visión.',
          2: 'Existe un documento de visión digital básico, pero no integrado en la estrategia de negocio ni comunicado formalmente.',
          3: 'La visión de transformación digital está formalizada, comunicada y alineada con los objetivos estratégicos.',
          4: 'La transformación digital es un pilar estratégico central, con narrativa pública de liderazgo y revisión periódica por el Consejo de Administración.',
        },
      },
      {
        code:          'td-roadmap-prioritization',
        dimensionCode: 'digital_vision',
        subdimNumber:  'D1.2',
        label:         'Roadmap y Priorización Digital',
        description:   '¿Hay un roadmap de iniciativas de transformación digital con proyectos priorizados, criterios de selección y métricas de éxito definidas?',
        criteria: {
          0: 'No existen iniciativas digitales priorizadas ni criterios de selección de proyectos.',
          1: 'Hay ideas de proyectos de digitalización pero sin priorización formal ni criterios de éxito definidos.',
          2: 'Existe un backlog de iniciativas digitales con criterios básicos, sin roadmap temporal estructurado ni horizon planning.',
          3: 'Roadmap de transformación digital formal con iniciativas priorizadas, criterios de éxito y revisión trimestral.',
          4: 'El roadmap digital está integrado en el Plan de Negocio, incluye horizontes de innovación y se actualiza en cada ciclo estratégico.',
        },
      },
      {
        code:          'td-budget-investment',
        dimensionCode: 'digital_vision',
        subdimNumber:  'D1.3',
        label:         'Inversión y Gobierno del Presupuesto Digital',
        description:   '¿Se ha asignado presupuesto específico y un responsable ejecutivo formal (CDO/CIO/CTO) para la agenda de transformación digital?',
        criteria: {
          0: 'No hay presupuesto ni recursos asignados específicamente a iniciativas de transformación digital.',
          1: 'Iniciativas digitales financiadas de forma oportunista mediante el presupuesto IT general, sin trazabilidad de valor.',
          2: 'Presupuesto digital aprobado para pilotos, pero sin responsable ejecutivo formal designado ni seguimiento de ROI.',
          3: 'Presupuesto digital específico con responsable ejecutivo (CDO/CIO) designado formalmente y revisión semestral del retorno.',
          4: 'Inversión digital estratégica con seguimiento en Comité de Dirección, KPIs de valor digital definidos y portfolio de inversión gestionado activamente.',
        },
      },
      {
        code:          'td-leadership-cdo',
        dimensionCode: 'digital_vision',
        subdimNumber:  'D1.4',
        label:         'Liderazgo y Patrocinio Ejecutivo',
        description:   '¿El C-Suite patrocina activamente y con visibilidad pública la transformación digital, generando compromiso interno y cultura de cambio?',
        criteria: {
          0: 'La dirección no ha tomado posición pública ni comprometido recursos hacia la transformación digital.',
          1: 'Hay interés directivo verbal pero sin mandato formal, comunicación interna activa ni visibilidad del avance.',
          2: 'Un directivo actúa como sponsor informal con implicación limitada y sin presupuesto ni métricas propias.',
          3: 'Sponsor ejecutivo (CDO/CEO) designado formalmente con mandato, presupuesto y comunicación interna regular sobre avances digitales.',
          4: 'El CEO/CDO lidera públicamente la transformación digital, es referente externo del sector e involucra al Consejo en los hitos estratégicos.',
        },
      },
    ],
  },

  // ── D2 · Datos ─────────────────────────────────────────────
  {
    code:        'data_analytics',
    label:       'Datos',
    dimNumber:   'D2',
    weight:      0.17,
    description: 'Mide la madurez del dato como activo estratégico: arquitectura analítica, gobierno, calidad y uso sistemático en la toma de decisiones. Sin datos gobernados y accesibles, la transformación digital no genera valor sostenible.',
    recommendations: {
      inicial: 'Inventariar fuentes de datos clave, diseñar arquitectura básica de datos y establecer roles de gobernanza (Data Owners) para fuentes críticas.',
      exploracion: 'Implementar plataforma analítica básica (data warehouse o data lake), establecer estándares de calidad de dato y crear centro de excelencia en datos.',
      desarrollo: 'Automatizar la calidad de dato, extender data governance a todos los sistemas core, implementar analytics autoservicio y crear catálogo de datos empresarial.',
      avanzado: 'Adoptar arquitectura moderna (data lakehouse), implementar modelos predictivos operativos, establecer data literacy corporativa y monetizar datos como activo de negocio.',
    },
    subdimensions: [
      {
        code:          'td-data-availability',
        dimensionCode: 'data_analytics',
        subdimNumber:  'D2.1',
        label:         'Arquitectura de Datos y Capacidad Analítica',
        description:   '¿La organización dispone de una arquitectura de datos (data warehouse, data lake o plataforma analítica) que soporte la toma de decisiones basada en datos?',
        criteria: {
          0: 'No existe arquitectura de datos centralizada. Los datos están dispersos en silos no conectados y el reporting es manual.',
          1: 'Herramientas de reporting básicas activas por áreas. Sin arquitectura de datos integrada ni plataforma analítica corporativa.',
          2: 'Data warehouse o plataforma analítica básica en construcción. Cobertura parcial de fuentes clave de negocio.',
          3: 'Plataforma analítica corporativa operativa con fuentes integradas, cuadros de mando y acceso autoservicio básico.',
          4: 'Data platform moderna (data lakehouse, analytics en tiempo real) con autoservicio completo, integración con sistemas operacionales y capacidad predictiva.',
        },
      },
      {
        code:          'td-data-quality',
        dimensionCode: 'data_analytics',
        subdimNumber:  'D2.2',
        label:         'Calidad y Gobierno del Dato',
        description:   '¿Existen procesos formales de gobierno del dato con Data Owners designados, políticas de calidad activas y métricas de integridad definidas?',
        criteria: {
          0: 'No se mide ni gestiona la calidad de los datos. No hay roles de gobierno del dato ni políticas activas.',
          1: 'Los problemas de calidad de dato son conocidos pero no hay proceso de remediación activo ni responsables formales.',
          2: 'Proceso básico de calidad de dato en marcha en algunas áreas. Sin Data Owners ni estándar corporativo de gobierno.',
          3: 'Data Governance Framework corporativo: Data Owners designados, políticas de calidad activas y SLAs de integridad definidos.',
          4: 'Calidad de dato monitorizada en tiempo real con alertas automáticas, catálogo de datos corporativo y programa de mejora continua sistematizado.',
        },
      },
      {
        code:          'td-data-analytics',
        dimensionCode: 'data_analytics',
        subdimNumber:  'D2.3',
        label:         'Dato como Activo Estratégico y Decisiones Basadas en Datos',
        description:   '¿La organización utiliza los datos de forma sistemática para tomar decisiones de negocio y generar ventaja competitiva, más allá del reporting operativo?',
        criteria: {
          0: 'Las decisiones se toman basándose en intuición o experiencia personal. No existe cultura data-driven ni métricas de negocio compartidas.',
          1: 'Uso ocasional de datos en decisiones. Dependencia de hojas de cálculo, reporting manual y criterios subjetivos.',
          2: 'Cuadros de mando operativos activos en algunas áreas. Inicio de cultura data-driven sin extensión corporativa ni framework de decisión compartido.',
          3: 'Decisiones de negocio principales apoyadas en datos. Data literacy extendida a mandos intermedios y cultura data-driven activa.',
          4: 'Organización genuinamente data-driven: experimentos controlados, modelos predictivos operativos y datos como fuente reconocida de ventaja competitiva.',
        },
      },
      {
        code:          'td-data-privacy',
        dimensionCode: 'data_analytics',
        subdimNumber:  'D2.4',
        label:         'Privacidad, Seguridad del Dato y Compliance',
        description:   '¿Se gestiona el cumplimiento normativo (GDPR, DORA, NIS2) en el tratamiento de datos y en la operación de los sistemas digitales críticos?',
        criteria: {
          0: 'No existe ningún proceso de revisión de privacidad ni cumplimiento normativo para datos o sistemas digitales.',
          1: 'Se conoce la necesidad de compliance (GDPR, DORA, NIS2) pero sin proceso formal integrado en el flujo de trabajo digital.',
          2: 'Revisión de privacidad ad hoc en algunos proyectos. GDPR aplicado de forma reactiva. Evaluación inicial de DORA/NIS2 pendiente.',
          3: 'Privacy by Design integrado en el ciclo de vida digital. DPIAs realizadas cuando aplica. Alineación formal con DORA/NIS2 en curso.',
          4: 'Marco de compliance digital maduro (GDPR + DORA + NIS2), auditado periódicamente. Certificaciones obtenidas o en proceso. Referente sectorial en resiliencia normativa.',
        },
      },
    ],
  },

  // ── D3 · Tecnología ────────────────────────────────────────
  {
    code:        'infrastructure_cloud',
    label:       'Tecnología',
    dimNumber:   'D3',
    weight:      0.17,
    description: 'Evalúa si la infraestructura cloud, la integración de sistemas, la ciberseguridad y la automatización están preparadas para soportar y escalar la transformación digital de forma segura y ágil.',
    recommendations: {
      inicial: 'Definir estrategia cloud (híbrida, multi-cloud), establecer equipo de Cloud Architecture y iniciar inventario de sistemas legacy candidatos a modernización.',
      exploracion: 'Implementar primeras migraciones cloud no críticas, diseñar API Gateway corporativo básico, fortalecer ciberseguridad con estándares mínimos.',
      desarrollo: 'Ejecutar roadmap de modernización acelerado, implementar arquitectura API-first, automatizar procesos críticos con RPA/BPM y alcanzar cumplimiento NIS2 inicial.',
      avanzado: 'Alcanzar cloud-native por defecto, implementar Zero Trust architecture, operacionalizar automatización inteligente con IA y certificar cumplimiento DORA/NIS2.',
    },
    subdimensions: [
      {
        code:          'td-cloud-adoption',
        dimensionCode: 'infrastructure_cloud',
        subdimNumber:  'D3.1',
        label:         'Arquitectura Cloud y Modernización Tecnológica',
        description:   '¿La infraestructura tecnológica está modernizada o en proceso activo de migración hacia arquitecturas cloud-native que soporten la escala y agilidad de la transformación digital?',
        criteria: {
          0: 'Infraestructura on-premise legacy dominante. Sin estrategia de cloud ni modernización tecnológica activa.',
          1: 'Primeras iniciativas cloud aisladas (lift & shift). Sin arquitectura cloud corporativa ni estrategia de modernización del legacy.',
          2: 'Cloud adoption en progreso para cargas no críticas. Estrategia de modernización definida pero no ejecutada de forma sistemática.',
          3: 'Arquitectura cloud híbrida o multi-cloud operativa para cargas críticas. Roadmap de decommissioning del legacy activo y gobernado.',
          4: 'Cloud-native por defecto. Sistemas legacy eliminados o modernizados. Arquitectura resiliente, escalable, securizada y con coste optimizado en tiempo real.',
        },
      },
      {
        code:          'td-api-architecture',
        dimensionCode: 'infrastructure_cloud',
        subdimNumber:  'D3.2',
        label:         'Integración Digital y Ecosistema de APIs',
        description:   '¿Los sistemas digitales están interconectados a través de APIs documentadas y la organización puede integrar nuevas herramientas, datos y partners de forma ágil y mantenible?',
        criteria: {
          0: 'Los sistemas core operan en silos. Sin APIs ni capacidad de integración digital ágil. Integraciones a medida costosas y frágiles.',
          1: 'Integraciones punto a punto existentes, sin documentación ni estándares. Difíciles de mantener y escalar.',
          2: 'API Gateway básico en funcionamiento. Algunas integraciones estandarizadas, sin arquitectura API-first ni estrategia de plataforma.',
          3: 'APIs documentadas y versionadas para sistemas core. Integraciones digitales funcionales, mantenibles y con gobierno de cambios establecido.',
          4: 'API-first architecture. Ecosistema digital integrado con partners y plataformas externas. Developer portal disponible y modelo de plataforma activo.',
        },
      },
      {
        code:          'td-cloud-security',
        dimensionCode: 'infrastructure_cloud',
        subdimNumber:  'D3.3',
        label:         'Ciberseguridad y Resiliencia Digital',
        description:   '¿La organización aplica controles de ciberseguridad adecuados y avanza en el cumplimiento de los marcos de resiliencia digital (NIS2, DORA) relevantes para su sector?',
        criteria: {
          0: 'Sin controles de ciberseguridad formales ni evaluación de riesgos digitales. Resiliencia operativa no gestionada.',
          1: 'Controles básicos de seguridad IT aplicados, sin marco de ciberseguridad formal ni evaluación de cumplimiento NIS2/DORA.',
          2: 'Plan de ciberseguridad en desarrollo. Evaluación inicial de cumplimiento NIS2/DORA iniciada en áreas o sistemas críticos.',
          3: 'Marco de ciberseguridad corporativo activo: políticas, controles técnicos, gestión de incidentes y evaluación NIS2/DORA completada.',
          4: 'Zero Trust architecture implementada. Resiliencia operativa digital certificada. Alineación plena y auditada con DORA, NIS2 e ISO 27001.',
        },
      },
      {
        code:          'td-devops-cicd',
        dimensionCode: 'infrastructure_cloud',
        subdimNumber:  'D3.4',
        label:         'Automatización e Inteligencia de Procesos',
        description:   '¿La organización utiliza tecnologías de automatización (RPA, BPM, process mining, intelligent automation) para optimizar procesos y liberar capacidad operativa?',
        criteria: {
          0: 'Sin ningún nivel de automatización de procesos. Procesos manuales y repetitivos dominantes sin hoja de ruta.',
          1: 'Automatización aislada de tareas simples. Sin visión corporativa de automatización ni tecnologías formales adoptadas.',
          2: 'Proyectos RPA o BPM en marcha en algunas áreas. Sin plataforma corporativa ni governance de automatización.',
          3: 'Plataforma de automatización corporativa operativa. RPA, BPM y process mining integrados con gobierno definido y métricas de valor.',
          4: 'Intelligent automation con capacidades de IA integradas. Automatización end-to-end de procesos core. Centro de Excelencia de Automatización activo y con roadmap propio.',
        },
      },
    ],
  },

  // ── D4 · Talento ───────────────────────────────────────────
  {
    code:        'talent_culture',
    label:       'Talento',
    dimNumber:   'D4',
    weight:      0.17,
    description: 'Mide la capacidad interna para ejecutar la transformación digital: perfiles digitales especializados, programas de upskilling, cultura ágil e innovadora, y gestión del cambio organizativo.',
    recommendations: {
      inicial: 'Reclutar perfiles digitales clave (Cloud Architect, Data Engineer, Product Owner), iniciar programa de formación digital y establecer embajadores de cambio por área.',
      exploracion: 'Crear Academia Digital con itinerarios de formación, adoptar metodologías ágiles en equipos técnicos, iniciar transformación cultural con hackathons internos.',
      desarrollo: 'Extender formación digital a mandos intermedios y negocio, instaurar innovación como valor corporativo, crear Centro de Excelencia Digital y establecer digital career paths.',
      avanzado: 'Alcanzar organización digital-native con autonomous teams, culture of experimentation institutionalized, AI literacy extendida y continuous learning infrastructure.',
    },
    subdimensions: [
      {
        code:          'td-talent-technical',
        dimensionCode: 'talent_culture',
        subdimNumber:  'D4.1',
        label:         'Capacidad Digital Interna',
        description:   '¿Existen perfiles internos con competencias digitales especializadas (arquitectura cloud, datos, desarrollo de producto, ciberseguridad, automatización)?',
        criteria: {
          0: 'No hay perfiles con competencias digitales especializadas en la organización. La capacidad de ejecución digital es nula.',
          1: 'Perfiles IT con formación técnica genérica, sin especialización en tecnologías digitales actuales ni en metodologías ágiles.',
          2: '1-3 perfiles digitales especializados. Capacidad para proyectos básicos con soporte externo significativo y continuo.',
          3: 'Equipo digital interno con perfiles especializados: Cloud Architect, Data Engineer, Product Owner digital, Security Engineer.',
          4: 'Digital Center of Excellence consolidado. Capacidad de innovación interna, investigación aplicada y atracción competitiva de talento digital senior.',
        },
      },
      {
        code:          'td-talent-training',
        dimensionCode: 'talent_culture',
        subdimNumber:  'D4.2',
        label:         'Formación y Digital Upskilling',
        description:   '¿Existe un programa corporativo de formación en competencias digitales con itinerarios diferenciados para perfiles técnicos y de negocio, y métricas de progreso?',
        criteria: {
          0: 'No existe ningún programa de formación en competencias digitales para ningún perfil de la organización.',
          1: 'Formación digital ad hoc a iniciativa individual. Sin programa corporativo, sin presupuesto dedicado ni seguimiento.',
          2: 'Programa de formación digital en diseño o piloto. Cubre perfiles técnicos, pendiente de extenderse a negocio y mandos intermedios.',
          3: 'Programa de digital upskilling estructurado con itinerarios para IT y negocio, certificaciones reconocidas y métricas de progreso.',
          4: 'Academia Digital interna activa. Digital Career Path definida, AI & digital literacy extendida a toda la organización y badge system corporativo.',
        },
      },
      {
        code:          'td-talent-experimentation',
        dimensionCode: 'talent_culture',
        subdimNumber:  'D4.3',
        label:         'Cultura Ágil y Mentalidad Digital',
        description:   '¿La organización adopta metodologías ágiles de forma sistemática y promueve activamente una cultura de innovación, experimentación y aprendizaje continuo?',
        criteria: {
          0: 'Cultura organizativa resistente al cambio. Metodologías waterfall dominantes. Sin espacio institucional para innovación digital.',
          1: 'Equipos técnicos con cierta agilidad informal. Sin adopción formal de metodologías ágiles ni cultura de innovación corporativa.',
          2: 'Agile adoptado en algunos equipos o proyectos. Cultura digital emergente en bolsas sin institucionalización corporativa.',
          3: 'Cultura ágil extendida: squads, sprints y retrospectivas. Design thinking y lean startup aplicados en iniciativas estratégicas de forma sistemática.',
          4: 'Organización digital-native: autonomous teams, OKRs, innovación continua como práctica institucional y hackathons internos con presupuesto propio.',
        },
      },
      {
        code:          'td-talent-change',
        dimensionCode: 'talent_culture',
        subdimNumber:  'D4.4',
        label:         'Gestión del Cambio para la Transformación Digital',
        description:   '¿Hay programas formales de gestión del cambio que acompañen la adopción de nuevas tecnologías, procesos digitales y formas de trabajo, reduciendo la resistencia y acelerando la adopción?',
        criteria: {
          0: 'No existe ningún proceso de gestión del cambio para la adopción de tecnologías o nuevas formas de trabajo digitales.',
          1: 'La transformación digital se gestiona como un proyecto IT, sin plan de cambio organizativo, sin comunicación interna estructurada.',
          2: 'Plan de gestión del cambio en diseño para 1-2 iniciativas digitales concretas. Sin metodología corporativa replicable.',
          3: 'Metodología de change management digital aplicada sistemáticamente a iniciativas estratégicas. Red de embajadores digitales activa por área de negocio.',
          4: 'Change management digital como competencia organizativa certificada: equipos entrenados, métricas de adopción continuas y mejora del modelo probada entre iniciativas.',
        },
      },
    ],
  },

  // ── D5 · Procesos ──────────────────────────────────────────
  {
    code:        'digital_processes',
    label:       'Procesos',
    dimNumber:   'D5',
    weight:      0.16,
    description: 'Evalúa si los procesos están mapeados, rediseñados con tecnología digital de forma nativa, automatizados inteligentemente y si se mide el impacto real sobre los resultados de negocio.',
    recommendations: {
      inicial: 'Mapear procesos core de negocio, identificar oportunidades de digitalización con criterios de impacto y constituir equipo de Process Transformation.',
      exploracion: 'Realizar 2-3 pilotos de rediseño digital, documentar Digital Process Design methodology, establecer baseline de métricas de eficiencia y ROI.',
      desarrollo: 'Escalar rediseño digital a procesos de mayor impacto, automatizar flujos repetitivos, integrar analytics en el ciclo de optimización, generar business cases documentados.',
      avanzado: 'Alcanzar excelencia en procesos digital-native, implementar continuous optimization loops, monetizar eficiencia y medir ROI como driver de cartera de innovación.',
    },
    subdimensions: [
      {
        code:          'td-process-mapping',
        dimensionCode: 'digital_processes',
        subdimNumber:  'D5.1',
        label:         'Mapeo e Identificación de Oportunidades de Digitalización',
        description:   '¿Existe un proceso formal y continuo para identificar, priorizar y seleccionar los procesos de negocio candidatos a ser digitalizados, automatizados o transformados?',
        criteria: {
          0: 'No existe ningún proceso para mapear ni priorizar oportunidades de digitalización en los procesos de negocio.',
          1: 'Las oportunidades de digitalización se identifican de forma oportunista, sin metodología ni criterios formales de selección.',
          2: 'Workshops de mapeo de procesos realizados puntualmente. Sin proceso continuo ni priorización estructurada de candidatos.',
          3: 'Proceso formal de Digital Opportunity Assessment con criterios de impacto, viabilidad y revisión trimestral de la cartera de candidatos.',
          4: 'Pipeline continuo de oportunidades de digitalización con scoring automatizado, integrado en el ciclo de planificación estratégica anual.',
        },
      },
      {
        code:          'td-process-redesign',
        dimensionCode: 'digital_processes',
        subdimNumber:  'D5.2',
        label:         'Digitalización y Rediseño de Procesos con Tecnología Nativa',
        description:   '¿Los procesos candidatos se han rediseñado e implementado con tecnología digital de forma nativa, más allá de simplemente digitalizar formularios o replicar procesos manuales en soporte digital?',
        criteria: {
          0: 'Los procesos no se han rediseñado. La tecnología digital se usa para replicar procesos manuales existentes sin cambio estructural.',
          1: 'Algunos procesos parcialmente digitalizados mediante formularios web o herramientas básicas, sin rediseño del flujo subyacente.',
          2: '1-3 procesos piloto completamente rediseñados con tecnología digital nativa. Metodología en construcción, no estandarizada.',
          3: 'Los procesos de mayor impacto están rediseñados con tecnología digital nativa. Metodología de Digital Process Design formalizada y replicable.',
          4: 'Excelencia en procesos digital-native. Todos los procesos core evaluados, rediseñados, digitalizados y optimizados en ciclos continuos.',
        },
      },
      {
        code:          'td-process-roi',
        dimensionCode: 'digital_processes',
        subdimNumber:  'D5.3',
        label:         'Medición de Impacto y ROI Digital',
        description:   '¿Se mide el impacto real de las iniciativas de transformación digital sobre los KPIs de negocio (eficiencia, ingresos, experiencia de cliente) y se reporta formalmente al Comité de Dirección?',
        criteria: {
          0: 'No se mide el impacto de las iniciativas digitales. No hay KPIs de transformación ni baseline definido.',
          1: 'Hay percepción de mejora con las iniciativas digitales pero sin métricas formales que la cuantifiquen.',
          2: 'Métricas básicas de adopción digital (número de usuarios, frecuencia de uso). Sin medición de impacto real en KPIs de negocio.',
          3: 'ROI digital medido en proyectos principales: tiempo ahorrado, reducción de costes operativos e impacto cuantificado en revenue o satisfacción cliente.',
          4: 'Business case digital medido, reportado al Comité de Dirección y usado como base para decisiones de inversión. Modelo de valor digital maduro y auditado.',
        },
      },
      {
        code:          'td-process-methodology',
        dimensionCode: 'digital_processes',
        subdimNumber:  'D5.4',
        label:         'Metodología Corporativa de Transformación (Agile/Lean Digital)',
        description:   '¿Existe una metodología estándar corporativa para lanzar, evaluar y escalar iniciativas digitales desde concepto hasta producción, con criterios de Go/No-Go y registro de aprendizajes?',
        criteria: {
          0: 'No existe ninguna metodología para lanzar, gestionar ni evaluar iniciativas de transformación digital.',
          1: 'Las iniciativas digitales se lanzan ad hoc. Sin criterios de éxito predefinidos ni proceso de escalado a producción.',
          2: 'Plantilla básica de proyecto digital en uso en algunos equipos. Sin estándar corporativo ni governance de metodología.',
          3: 'Metodología corporativa de transformación digital: Go/No-Go gates, criterios de escalado y registro activo de aprendizajes entre iniciativas.',
          4: 'Digital Transformation Factory: iniciativas estructuradas, time-to-production optimizado (<90 días para pilotos), lecciones institucionalizadas y mejora continua del método.',
        },
      },
    ],
  },

  // ── D6 · Gobernanza ────────────────────────────────────────
  {
    code:        'governance_change',
    label:       'Gobernanza',
    dimNumber:   'D6',
    weight:      0.16,
    description: 'Evalúa si la organización tiene un modelo de gobierno digital maduro, gestión activa de riesgos digitales, portfolio de inversión TI gestionado por valor y avance hacia marcos como COBIT 2019, ITIL 4 o DORA.',
    recommendations: {
      inicial: 'Formalizar modelo de gobierno digital con roles (CDO, Digital Board) y responsabilidades, establecer risk register digital inicial y definir criterios de priorización de portfolio.',
      exploracion: 'Crear órgano de decisión digital (Digital Board), implementar Digital Risk Framework, iniciar gap analysis vs. COBIT 2019/DORA y documentar políticas de governance.',
      desarrollo: 'Institucionalizar governance digital en ciclos de planificación estratégica, integrar portfolio digital en gestión de inversiones corporativa, avanzar hacia compliance DORA/NIS2.',
      avanzado: 'Alcanzar gobierno digital maduro certificado (ISO 27001, compliance DORA/NIS2 verificado), modelo de Portfolio Management optimizado y transformación digital como riesgo gestionado explícitamente.',
    },
    subdimensions: [
      {
        code:          'td-governance-framework',
        dimensionCode: 'governance_change',
        subdimNumber:  'D6.1',
        label:         'Modelo de Gobierno de la Transformación Digital',
        description:   '¿La organización tiene un modelo de gobierno digital con roles, responsabilidades y órganos de decisión claramente definidos que supervisen el avance y el valor de la transformación?',
        criteria: {
          0: 'No existe modelo de gobierno para la transformación digital. Las decisiones tecnológicas se toman sin estructura ni criterios compartidos.',
          1: 'Hay algunas directrices informales sobre gobierno digital, sin estructura formal ni aprobación directiva.',
          2: 'Borrador de modelo de gobierno digital en elaboración. Roles parcialmente definidos, sin órgano de decisión formal constituido.',
          3: 'Modelo de gobierno digital aprobado: CDO/responsable designado formalmente, Digital Board o Comité TI con mandato y agenda regular.',
          4: 'Governance model maduro: Digital Board con representación CxO, OKRs digitales corporativos, portfolio gestionado y revisión periódica del valor generado.',
        },
      },
      {
        code:          'td-governance-risk',
        dimensionCode: 'governance_change',
        subdimNumber:  'D6.2',
        label:         'Gestión de Riesgos Digitales',
        description:   '¿Existe un risk register específico de transformación digital con riesgos tecnológicos, de ciberseguridad y operativos identificados, con controles mitigantes asignados y responsables designados?',
        criteria: {
          0: 'Sin evaluación de riesgos digitales. Los riesgos de las iniciativas de transformación no están identificados ni gestionados.',
          1: 'Algunos riesgos digitales identificados informalmente, sin proceso formal, sin responsables asignados ni seguimiento.',
          2: 'Risk register digital básico elaborado para 1-2 iniciativas concretas. Sin Digital Risk Framework corporativo.',
          3: 'Digital Risk Framework corporativo: risk register activo, controles mitigantes, revisión semestral y alineación con DORA/NIS2.',
          4: 'Gestión de riesgos digitales integrada en Enterprise Risk Management. Alineada con DORA, NIS2, COBIT 2019 e ISO 27001. Auditoría externa periódica.',
        },
      },
      {
        code:          'td-governance-portfolio',
        dimensionCode: 'governance_change',
        subdimNumber:  'D6.3',
        label:         'Portfolio y Gestión del Valor de las Inversiones Digitales',
        description:   '¿Existe un proceso centralizado de gestión del portfolio de inversiones digitales con criterios de priorización, seguimiento activo del valor generado y racionalización del legacy tecnológico?',
        criteria: {
          0: 'Sin gestión de portfolio digital. Las inversiones TI se aprueban caso a caso sin visión de conjunto ni criterios de valor.',
          1: 'Inventario parcial de proyectos digitales construido a demanda. Sin criterios de priorización ni seguimiento de retorno.',
          2: 'Portfolio de inversiones digitales básico en construcción. Proceso de aprobación centralizado en diseño, sin seguimiento de valor.',
          3: 'Portfolio digital gestionado activamente: priorización estructurada, seguimiento de valor generado y racionalización del legacy tecnológico en curso.',
          4: 'IT Portfolio Management maduro: value realization tracking, optimización continua del mix inversión-mantenimiento-innovación y deuda técnica gestionada como riesgo explícito.',
        },
      },
      {
        code:          'td-governance-audit',
        dimensionCode: 'governance_change',
        subdimNumber:  'D6.4',
        label:         'Marcos de Referencia, Auditoría y Compliance Digital',
        description:   '¿Se realizan auditorías periódicas de las iniciativas digitales y se avanza hacia marcos de referencia reconocidos como COBIT 2019, ITIL 4, DORA o ISO 27001?',
        criteria: {
          0: 'Sin ningún proceso de auditoría ni iniciativa de cumplimiento normativo digital.',
          1: 'Conciencia de requisitos normativos (DORA, NIS2, ISO 27001) pero sin proceso de cumplimiento activo ni evaluación de gaps.',
          2: 'Auditoría digital ad hoc realizada puntualmente. Gap analysis respecto a COBIT 2019 o DORA iniciado o planificado.',
          3: 'Auditorías digitales periódicas establecidas. Marco de referencia (COBIT 2019, ITIL 4) en adopción activa y verificable con plan de implantación.',
          4: 'Certificación ISO 27001 obtenida o en fase final. Compliance DORA/NIS2 verificado externamente. Referente de gobierno digital para el sector.',
        },
      },
    ],
  },
]

// ── Bandas de madurez global (adaptadas de AI Adoption) ──────
// Mismo rango/color que MATURITY_TIER_CONFIG (types.ts) — solo cambia
// el texto para hablar de "transformación digital" en vez de "IA".
// Fuente: panel ROL-24..29, doc "Textos dominio Transformación Digital" v2,
// sección "Textos de diagnóstico global — Bandas de madurez (widget score global)".
export const TD_MATURITY_TIER_CONFIG: Record<MaturityTier, TierConfig> = {
  inicial: {
    label:       'Iniciación',
    range:       [0, 1.0],
    description: 'La digitalización es experimental y no gobernada. Las iniciativas son oportunistas y sin alineación estratégica.',
    color:       'text-danger-dark bg-danger-light',
  },
  exploracion: {
    label:       'Exploración',
    range:       [1.0, 2.0],
    description: 'Hay conciencia del potencial digital pero faltan estructuras, procesos y gobierno formal.',
    color:       'text-warning-dark bg-warning-light',
  },
  desarrollo: {
    label:       'Desarrollo',
    range:       [2.0, 3.0],
    description: 'El ecosistema de transformación digital está en construcción. Hay bases sólidas pero la institucionalización no está completa.',
    color:       'text-info-dark bg-info-light',
  },
  avanzado: {
    label:       'Avanzado',
    range:       [3.0, 3.5],
    description: 'Gobierno robusto y transformación digital como palanca real de negocio. La organización puede ejecutar y escalar.',
    color:       'text-success-dark bg-success-light',
  },
  lider: {
    label:       'Líder',
    range:       [3.5, 4.0],
    description: 'Referente de industria. La transformación digital es un diferenciador estratégico central y el modelo de gobierno es referencia para el sector.',
    color:       'text-success-dark bg-success-light',
  },
}
