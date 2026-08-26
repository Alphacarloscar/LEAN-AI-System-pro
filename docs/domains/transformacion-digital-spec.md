# Transformación Digital — Especificación de Dominio

**Versión:** 1.0.0  
**Fecha:** 2026-08-25  
**Estado:** Diseño (pre-implementación)  
**Autor:** Claude Code (ADR-029 Fase 5 — Multi-Domain Generalization)

---

## A. Metadata del Dominio

| Campo | Valor |
|---|---|
| **slug** | `transformacion_digital` |
| **label** | `Transformación Digital` |
| **version** | `1.0.0` |
| **is_active** | `true` |
| **description** | Evalúa la madurez organizacional en transformación digital — desde liderazgo y visión ejecutiva hasta experiencia de cliente, infraestructura cloud y gobernanza del cambio. Orientado a organizaciones tradicionales en fase de modernización. |

### A.1 Diferencia conceptual respecto a AI Adoption

**AI Adoption** evalúa la **capacidad específica para adoptar IA** — asume una base digital mínima y se enfoca en tecnologías generativas, gobernanza IA-específica y talento especializado.

**Transformación Digital** evalúa la **base digital integral** que habilita cualquier iniciativa de modernización — incluye visión de negocio, datos y cloud, experiencia de cliente, y cambio organizativo. Es **anterior o paralela** a IA Adoption.

**Cliente tipo:** CIO/COO en fase de modernización. Mismo sponsor que AI Adoption pero en timeline anterior: antes de evaluar IA, necesita diagnosticar si la infraestructura, datos y cultura están listos.

**Relación:** Son dominios **complementarios, no alternativos**. Un cliente puede estar en Transformación Digital nivel 2 (desarrollo emergente) e IA Adoption nivel 1 (inicial). El progreso en TD habilita el progreso en IA.

---

## B. 6 Dimensiones Principales

### **D1: Visión y Liderazgo Digital**

| Campo | Valor |
|---|---|
| **code** | `digital_vision` |
| **label** | `Visión y Liderazgo Digital` |
| **dimNumber** | `D1` |
| **weight** | `0.20` |

**Descripción:**  
Evalúa si la organización tiene una visión clara de transformación digital, alineada con la estrategia de negocio y patrocinada activamente por el C-Suite. Es la dimensión más crítica en TD: sin liderazgo ejecutivo firme, la inversión en infraestructura y talento se disipa.

**Recomendaciones por nivel:**
- **Inicial:** Redactar una Visión Digital de 1 página y designar un CDO (Chief Digital Officer) o equivalente con mandato ejecutivo visible.
- **Exploración:** Elaborar un Digital Roadmap de 24 meses con quick wins en Q1-Q2, presupuesto aprobado y comunicación ejecutiva trimestral.
- **Desarrollo:** Integrar objetivos TD en el Business Plan anual. Establecer KPIs de transformación revisados mensualmente. CDO con asiento en Comité de Dirección.
- **Avanzado:** Transformación digital como filosofía organizativa. CEO/CDO es referente externo. Inversión en TD integrada en ciclos de estrategia a 3 años.

**Justificación del peso (0.20):**  
En AI Adoption, Liderazgo tiene 0.18 porque asume base digital existente. En TD, sube a 0.20 porque sin liderazgo ejecutivo visibles, ningún proyecto de infraestructura o cambio cultural prospera. Es la condición primera.

---

### **D2: Datos y Analítica**

| Campo | Valor |
|---|---|
| **code** | `data_analytics` |
| **label** | `Datos y Analítica` |
| **dimNumber** | `D2` |
| **weight** | `0.16` |

**Descripción:**  
Mide la calidad, accesibilidad y gobierno de datos corporativos. Incluye infraestructura de data warehouse, data catalog y capacidades de analítica empresarial. Sin datos limpiables y gobernados, no hay base para transformación digital sostenida.

**Recomendaciones por nivel:**
- **Inicial:** Auditar fuentes de datos críticas. Identificar 3 datasets prioritarios. Nombrar Data Owner corporativo.
- **Exploración:** Implementar data warehouse básico (cloud). Establecer SLAs de data quality. Publicar data catalog elemental.
- **Desarrollo:** Data platform cloud operativa con self-service. Monitorización de calidad en tiempo real. Privacidad by design institucionalizada.
- **Avanzado:** Plataforma de datos como activo competitivo. Machine Learning integrado en ingesta. Real-time analytics en todos los procesos core.

**Justificación del peso (0.16):**  
Baja de 0.18 (AI Adoption) a 0.16 porque en TD hay 6 dimensiones con mayor dispersión. Datos sigue siendo crítico, pero comparte peso con experiencia de cliente (que en AI no era factor).

---

### **D3: Infraestructura y Cloud**

| Campo | Valor |
|---|---|
| **code** | `infrastructure_cloud` |
| **label** | `Infraestructura y Cloud` |
| **dimNumber** | `D3` |
| **weight** | `0.16` |

**Descripción:**  
Evalúa si la infraestructura soporta modernización: migración a cloud, capacidades de integración, escalabilidad y seguridad para cargas de trabajo modernas. Es el cimiento técnico de la transformación.

**Recomendaciones por nivel:**
- **Inicial:** Seleccionar cloud partner (AWS/Azure/GCP). Definir cloud-first policy. Piloto: 1 app a cloud en Q1.
- **Exploración:** 30% de carga de trabajo en cloud. VPN/integración on-prem–cloud operativa. Políticas de seguridad cloud en diseño.
- **Desarrollo:** 60% en cloud. Arquitectura multi-cloud en piloto. Auto-scaling y disaster recovery operativos.
- **Avanzado:** 85%+ cloud. Arquitectura serverless normalizada. FinOps integrado. Multi-cloud activo con portabilidad.

**Justificación del peso (0.16):**  
Igual a AI Adoption (0.14 → 0.16 sube porque TD enfatiza infraestructura más que IA). Soporte técnico para experiencia de cliente y datos es crítico.

---

### **D4: Talento y Cultura Digital**

| Campo | Valor |
|---|---|
| **code** | `talent_culture` |
| **label** | `Talento y Cultura Digital` |
| **dimNumber** | `D4` |
| **weight** | `0.18` |

**Descripción:**  
Evalúa la capacidad organizativa de ejecutar transformación digital: perfiles especializados, programas de formación, cultura de experimentación y gestión del cambio. Sin talento y cambio, la tecnología no se adopta.

**Recomendaciones por nivel:**
- **Inicial:** Identificar "campeones digitales" en cada área. Lanzar programa de formación digital básico (cloud, agile, no-code).
- **Exploración:** Crear equipo Digital Transformation de 5-8 personas. Upskilling para 50% de staff en herramientas clave.
- **Desarrollo:** Digital Academy interna. Cambio culturally institutionalizado (safe-to-fail labs, agile teams, demos mensuales).
- **Avanzado:** Digital-first talent acquisition. AI upskilling para todos. Movilidad interna entre roles digitales. Innovación continua.

**Justificación del peso (0.18):**  
En AI es 0.16; en TD sube a 0.18 porque la transformación es **cultural** antes que técnica. Cambio fallido mata inversión en infraestructura.

---

### **D5: Experiencia de Cliente y Canales Digitales**

| Campo | Valor |
|---|---|
| **code** | `customer_experience` |
| **label** | `Experiencia de Cliente y Canales Digitales` |
| **dimNumber** | `D5` |
| **weight** | `0.16` |

**Descripción:**  
Mide la capacidad de la organización de ofrecer experiencias digitales modernas (omnichannel, mobile-first, personalizadas). Evalúa madurez de canales digitales y comprensión del customer journey. En TD, el cliente es el norte: la tecnología debe servir a experiencias diferenciadas.

**Recomendaciones por nivel:**
- **Inicial:** Mapear customer journey. Diseñar 1 canal digital prioritario (web o mobile). Medir NPS.
- **Exploración:** Operacionalizar omnichannel básico. Implementar personificación on-site. CRM cloud integrado.
- **Desarrollo:** Experiencias omnichannel fluidas. Recomendaciones personalizadas por ML. Self-service avanzado (chatbot, IVR inteligente).
- **Avanzado:** Experiencia de cliente proactiva (anticipación de necesidades). Integración 360° de touchpoints. Loyalty diferenciado por persona.

**Justificación del peso (0.16):**  
Exclusivo de TD (no presente en AI Adoption). Representa el valor de negocio final de la transformación. Ponderable 0.16 porque existe tensión con otros esfuerzos, pero es critico para ROI.

---

### **D6: Gobernanza y Gestión del Cambio**

| Campo | Valor |
|---|---|
| **code** | `governance_change` |
| **label** | `Gobernanza y Gestión del Cambio` |
| **dimNumber** | `D6` |
| **weight** | `0.14` |

**Descripción:**  
Evalúa la presencia de marcos de gobierno, procesos de aprobación de inversiones digitales y capacidad de gestión del cambio organizativo a escala. Incluye compliance normativo (GDPR, regulación sectorial) en iniciativas digitales.

**Recomendaciones por nivel:**
- **Inicial:** Crear PMO Digital. Establecer governance básico (steering committee, go/no-go gates).
- **Exploración:** Definir Digital Governance Policy. Procesos de change management formalizados para 3 iniciativas prioritarias.
- **Desarrollo:** Change management como capacidad institucional. Red de embajadores digitales. Auditoría trimestral de transformación.
- **Avanzado:** Continuous transformation governance. Feedback loops integrados. Adaptación ágil de roadmap. Compliance by design.

**Justificación del peso (0.14):**  
Más baja que en AI (0.18) porque TD asume menos especialización regulatoria en fase temprana. Sube a criticidad en fases avanzadas cuando compliance sectorial se torna exigente.

---

## **B.1 Verificación de Pesos**

```
D1 (Visión): 0.20
D2 (Datos): 0.16
D3 (Infraestructura): 0.16
D4 (Talento): 0.18
D5 (Experiencia): 0.16
D6 (Gobernanza): 0.14
───────────────
TOTAL: 1.00 ✅
```

---

## C. 24 Subdimensiones (4 por Dimensión)

### D1: Visión y Liderazgo Digital

#### **D1.1 — Visión Digital Corporativa**
- **code:** `td-vision-ambicion`
- **description:** ¿Existe una visión formal de transformación digital alineada con la estrategia de negocio y comunicada internamente?
- **Criterios:**
  - **0:** No existe ninguna declaración sobre transformación digital. El cambio es reactivo (respuesta a crisis o presión competitiva).
  - **1:** Hay interés directivo en digitalización, pero sin documento formal ni comunicación sistemática.
  - **2:** Documento de visión digital existe, pero está en silos IT sin alineación clara con objetivos de negocio.
  - **3:** Visión digital formalizada, comunicada anualmente, y alineada explícitamente con plan de negocio 3 años.
  - **4:** Transformación digital es pilar estratégico central. Revisado por Consejo. Accionistas entienden ventaja competitiva esperada.

#### **D1.2 — Liderazgo Ejecutivo y CDO**
- **code:** `td-leadership-cdo`
- **description:** ¿El C-Suite está patrocinando activamente la transformación y existe un Chief Digital Officer u equivalente designado formalmente?
- **Criterios:**
  - **0:** Transformación digital delegada únicamente a TI. No hay sponsor ejecutivo de negocio ni CDO.
  - **1:** Hay un CIO o IT director con responsabilidad de TD, pero sin poder presupuestario ni participación en decisiones de negocio.
  - **2:** CDO designado informalmente o con rol de jornada parcial. Autoridad limitada en gasto de capital.
  - **3:** Chief Digital Officer (o equivalente) designado formalmente con presupuesto propio, reporta a CEO y participa en Comité.
  - **4:** CDO visibilidad pública. CEO y CFO respaldan públicamente TD. Transformación integrada en compensación ejecutiva.

#### **D1.3 — Roadmap Digital y Priorización**
- **code:** `td-roadmap-prioritization`
- **description:** ¿Existe un roadmap de transformación digital estructurado con iniciativas priorizadas y criterios de éxito definidos?
- **Criterios:**
  - **0:** No existe roadmap. Las iniciativas digitales se ejecutan de forma oportunista o reactiva.
  - **1:** Ideas de iniciativas digitales identificadas, pero sin orden, criterios ni timeline formales.
  - **2:** Roadmap básico en construcción (6-12 meses). Incluye quick wins pero sin visión a 3 años.
  - **3:** Digital Roadmap formal de 24-36 meses con fases, milestones y revisión trimestral por steering committee.
  - **4:** Roadmap integrado en planes de negocio anuales y ciclos de planificación estratégica. Adaptación ágil semestral con datos de progreso.

#### **D1.4 — Presupuesto y Financiación de TD**
- **code:** `td-budget-investment`
- **description:** ¿Se ha asignado presupuesto específico para transformación digital y existe un modelo de financiación transparente?
- **Criterios:**
  - **0:** No hay presupuesto dedicado a TD. Se financia con sobrantes de IT o presupuesto operativo.
  - **1:** Presupuesto TD ad hoc año a año, sin compromiso multianual. No es visible al negocio.
  - **2:** Presupuesto anual aprobado para TD pero pequeño (< 5% del IT total). Sin modelo de ROI claro.
  - **3:** Presupuesto TD multianual dedicado (5-10% IT). Modelo de financiación transparente: inversión capex vs. opex clara.
  - **4:** Inversión estratégica en TD (10-15% IT). ROI medido y reportado al Comité. Inversiones adicionales otorgadas según demanda validada.

---

### D2: Datos y Analítica

#### **D2.1 — Disponibilidad y Acceso a Datos**
- **code:** `td-data-availability`
- **description:** ¿Los datos críticos de negocio son identificables, accesibles y están documentados?
- **Criterios:**
  - **0:** Datos dispersos en silos. Sin inventario. Acceso ad hoc requiere soporte IT manual.
  - **1:** Datos identificados pero en múltiples formatos (CSV, DBs propietarias, Excel). Acceso complicado.
  - **2:** Data warehouse básico piloto. Algunas fuentes centralizadas. Acceso mejorado pero documentación incompleta.
  - **3:** Data warehouse cloud operativo. Mayoría de fuentes centralizadas. Data catalog con self-service básico.
  - **4:** Plataforma de datos moderna (data lake/lakehouse). 100% de fuentes críticas integradas. Self-service avanzado con gobernanza automática.

#### **D2.2 — Calidad de Datos y Gobierno**
- **code:** `td-data-quality`
- **description:** ¿Hay procesos de monitorización de calidad de datos y gobierno de datos corporativo establecido?
- **Criterios:**
  - **0:** No hay métricas de calidad. Los datos se aceptan tal cual. Errores descubiertos por usuarios finales.
  - **1:** Validaciones básicas en carga de datos. Sin SLAs de calidad ni propietarios de datos formales.
  - **2:** Procesos de data quality en construcción. Data Owners designados. Métricas de completitud y exactitud monitorizadas.
  - **3:** Data governance policy operativa. SLAs de calidad por dataset. Incidentes de calidad reportados y remediados formalmente.
  - **4:** Calidad de datos como métrica de éxito empresarial (publicada). Retraining automático de pipelines cuando drift detectado.

#### **D2.3 — Privacy y Cumplimiento de Regulación de Datos**
- **code:** `td-data-privacy`
- **description:** ¿Se aplican controles de privacidad y compliance (GDPR, regulación sectorial) en gestión de datos?
- **Criterios:**
  - **0:** Sin procesos de privacidad o compliance. Riesgo GDPR/regulatorio no gestionado.
  - **1:** Conciencia de GDPR. Privacy Officer designado pero sin procesos sistemáticos de cumplimiento.
  - **2:** Data Protection Impact Assessments realizados ad hoc. Procesos de consent en construcción.
  - **3:** Privacy by design integrada. DPA con proveedores en vigor. Auditorías de compliance anuales.
  - **4:** Privacy como ventaja competitiva. Certificaciones (ISO 27001, etc.). Compliance verificado externamente. Datos trazables por sujeto.

#### **D2.4 — Capacidades de Analítica y BI**
- **code:** `td-data-analytics`
- **description:** ¿Existe una plataforma de Business Intelligence y capacidades de analítica avanzada (predicción, segmentación)?
- **Criterios:**
  - **0:** Sin herramientas de BI. Reportes hechos manualmente en Excel por IT.
  - **1:** Herramienta BI básica en piloto. Pocos usuarios. Reportes estáticos.
  - **2:** Plataforma BI operativa con self-service limitado. KPIs corporativos documentados.
  - **3:** BI cloud con self-service. Dashboards en tiempo real para procesos críticos. Primeras correlaciones exploradas.
  - **4:** Advanced analytics operativa (predictive, clustering). Machine learning integrado en dashboards. Decisiones automatizadas en algunos procesos.

---

### D3: Infraestructura y Cloud

#### **D3.1 — Adopción Cloud y Modernización de Infraestructura**
- **code:** `td-cloud-adoption`
- **description:** ¿La organización ha migrado aplicaciones y workloads a cloud? ¿Existe una estrategia multi-cloud o single-cloud?
- **Criterios:**
  - **0:** 100% on-premise o legacy. Sin iniciativa de cloud.
  - **1:** Piloto de cloud con <5% carga de trabajo. Sin strategy definida. Herramientas por departamento.
  - **2:** 20-30% cloud. Estrategia single-cloud en construcción. On-prem aún es dominante.
  - **3:** 50-70% cloud. Estrategia cloud-first establecida. Hybrid cloud con integración operativa.
  - **4:** 80%+ cloud. Multi-cloud activo o single-cloud optimizado. Infraestructura as code normalizada. Portabilidad entre clouds.

#### **D3.2 — Arquitectura de Integración y APIs**
- **code:** `td-api-architecture`
- **description:** ¿Existe una arquitectura de APIs e integración que permita comunicación fluida entre sistemas modernos y legacy?
- **Criterios:**
  - **0:** Sin APIs. Integraciones por batch o manual. Silos de negocio sin comunicación.
  - **1:** APIs ad hoc construidas para cada integración. Sin estándar. Documentación mínima.
  - **2:** API Gateway básico o ESB en construcción. Estándares REST/SOAP emergentes.
  - **3:** API management centralizado (API Gateway operativo). APIs versionadas, documentadas con Swagger/OpenAPI.
  - **4:** API-first architecture. Developer portal auto-servicio. Rate limiting, OAuth, monitorización integrada. APIs como activos de negocio.

#### **D3.3 — Seguridad en Cloud y Ciberseguridad**
- **code:** `td-cloud-security`
- **description:** ¿Se aplican controles de seguridad específicos para workloads en cloud y hay programa de ciberseguridad activo?
- **Criterios:**
  - **0:** Sin controles cloud-específicos. Misma seguridad on-prem no se aplica a cloud.
  - **1:** Firewalls básicos. Sin Cloud Access Security Broker (CASB) ni políticas de identidad cloud.
  - **2:** Políticas de seguridad cloud en construcción (MFA, RBAC). Auditoría de accesos piloto.
  - **3:** Zero Trust iniciativa en progreso. MFA, RBAC, CASB operativos. Auditorías de seguridad cloud trimestral.
  - **4:** Zero Trust architecture implementada. DLP, SIEM, EDR operativos. Pen testing continuo. Compliance verificado (ISO 27001).

#### **D3.4 — DevOps, CI/CD y Automatización de Infraestructura**
- **code:** `td-devops-cicd`
- **description:** ¿Hay pipelines CI/CD operativos y infraestructura automatizada (IaC) para acelerar despliegues?
- **Criterios:**
  - **0:** Despliegues manuales. Documentación en wiki. Cambios lentos y propensos a errores.
  - **1:** Algunos equipos tienen CI/CD manual. IaC no existe. Despliegues aún muy acoplados.
  - **2:** CI/CD pipeline básico en construcción. Terraform/CloudFormation en piloto. Despliegues siguen siendo lentos.
  - **3:** CI/CD operativo para aplicaciones en cloud. IaC estándar. Despliegues <1 hora. Test automáticos básicos.
  - **4:** GitOps normalizado. IaC para infraestructura y aplicación. Despliegues continuo múltiples veces al día. Auto-scaling y self-healing operativos.

---

### D4: Talento y Cultura Digital

#### **D4.1 — Perfiles y Capacidades Técnicas Digitales**
- **code:** `td-talent-technical`
- **description:** ¿Existen perfiles internos con conocimiento especializado en cloud, DevOps, arquitectura moderna?
- **Criterios:**
  - **0:** Sin perfiles cloud. Todo desarrollado por consultores externos.
  - **1:** 1-2 perfiles con formación cloud básica. Capacidad limitada a pilotos.
  - **2:** 5-10 perfiles con cloud y DevOps. Capacidad para gestionar 30-40% de carga en cloud.
  - **3:** Equipo digital consolidado (15+ perfiles: cloud architects, DevOps, full-stack). Autosuficiencia para 60-70% cloud.
  - **4:** Centro de excelencia digital. Perfiles especializados en micro-servicios, serverless, SRE. Atracción de talento senior. Capacidad de innovación propia.

#### **D4.2 — Formación y Upskilling Digital**
- **code:** `td-talent-training`
- **description:** ¿Existe programa corporativo de formación en tecnologías y metodologías digitales?
- **Criterios:**
  - **0:** Sin formación digital. Los empleados aprenden por su cuenta o no aprenden.
  - **1:** Formación ad hoc: cursos online pagados por empleados. Sin presupuesto corporativo.
  - **2:** Programa de upskilling en construcción. Cloud y agile cubiertos. Alcance <30% del staff.
  - **3:** Academia Digital interna con itinerarios para IT y negocio. 50%+ staff con formación digital. Certificaciones cloud reconocidas.
  - **4:** Programa de transformación de talento: formación continua, career paths digitales, becas máster, partnerships con universidades.

#### **D4.3 — Cultura de Experimentación y Innovación**
- **code:** `td-talent-experimentation`
- **description:** ¿La organización tolera el fracaso y fomenta la experimentación con nuevas tecnologías y metodologías?
- **Criterios:**
  - **0:** Cultura de "perfección". El fracaso se penaliza. Sin espacio para experimentar.
  - **1:** Tolerancia a experimentación en IT. En negocio no está institucionalizada.
  - **2:** Safe-to-fail pilots lanzados en algunas áreas. Documentación de aprendizajes iniciada.
  - **3:** Cultura de experimentación activa. Hackathons anuales. Innovation labs con presupuesto. Retrospectivas formales.
  - **4:** Innovación continua institucionalizada. Presupuesto de experimentación garantizado (10% tiempo). Startup mentality. Pivot rápido es valorado.

#### **D4.4 — Gestión del Cambio y Adopción Organizativa**
- **code:** `td-talent-change`
- **description:** ¿Hay programa formal de gestión del cambio para transformación digital con comunicación y empoderamiento?
- **Criterios:**
  - **0:** Sin comunicación de cambios. La transformación "sucede" sin contexto o preparación del staff.
  - **1:** Comunicación ad hoc de cambios. Sin estrategia de adoption o empoderamiento de usuarios.
  - **2:** Plan de cambio para iniciativas prioritarias. Embajadores digitales en piloto.
  - **3:** Metodología de change management corporativa. Red de embajadores digitales activa. Sesiones de adopción formales.
  - **4:** Change management como capacidad core. Equipos certificados en metodología. Adopción medida y mejorada continuamente. Feedback loops cerrados.

---

### D5: Experiencia de Cliente y Canales Digitales

#### **D5.1 — Canales Digitales y Omnichannel**
- **code:** `td-customer-channels`
- **description:** ¿La organización ofrece múltiples canales digitales integrados (web, mobile, conversacional, etc.)?
- **Criterios:**
  - **0:** Solo canal físico o web básico obsoleto. Sin mobile, sin integración.
  - **1:** Web y mobile existen pero separados. Sin UX integration ni sincronización de datos de cliente.
  - **2:** Canales emergentes (web + mobile + chat). Algunos datos sincronizados. Experiencia inconsistente entre canales.
  - **3:** Omnichannel operativo: web, mobile, contact center integrados. Datos de cliente sincronizados en tiempo real. UX consistente.
  - **4:** Experiencia omnichannel sofisticada: conversacional (IA), IoT, wearables integrados. Transacciones fluyen sin fricción entre canales.

#### **D5.2 — Personalización y Experiencia Contextual**
- **code:** `td-customer-personalization`
- **description:** ¿Los canales digitales adaptan la experiencia según perfil, historial e intención del cliente?
- **Criterios:**
  - **0:** Experiencia genérica para todos. Sin personalización.
  - **1:** Personalización básica (saludos, recomendaciones de producto estáticas).
  - **2:** Personalización emergente: segmentación por cliente type. Recomendaciones dinámicas en web.
  - **3:** Personalización operativa: ML-powered recomendaciones, contenido adaptado por perfil, ofertas contextuales.
  - **4:** Hyper-personalización: experiencia predictiva por cliente. Anticipación de necesidades. Ofertas 1:1 en tiempo real.

#### **D5.3 — Self-Service y Automatización de Soporte**
- **code:** `td-customer-selfservice`
- **description:** ¿Existen soluciones de autoservicio (FAQ, chatbot, IVR inteligente) que reducen dependencia en soporte humano?
- **Criterios:**
  - **0:** Sin self-service. Todo requiere contacto con agente.
  - **1:** FAQ estático en web. Chatbot con reglas simples.
  - **2:** Chatbot mejora en construcción. Self-service para operaciones comunes (consulta saldo, cambio contraseña).
  - **3:** Chatbot IA conversacional. Self-service para 60% de consultas. IVR inteligente en contact center.
  - **4:** Self-service avanzado: 85%+ de consultas resueltas sin agente. Escalación automática inteligente. Agentes empoderados por IA.

#### **D5.4 — Medición de Experiencia de Cliente (NPS, CSAT, CX Metrics)**
- **code:** `td-customer-metrics`
- **description:** ¿Se miden y optimizan continuamente métricas de experiencia de cliente (NPS, CSAT, etc.)?
- **Criterios:**
  - **0:** Sin medición. Feedback de cliente no sistematizado.
  - **1:** NPS/CSAT medido anualmente. Sin análisis de drivers de insatisfacción.
  - **2:** Encuestas de CSAT trimestrales. Algunos drivers identificados. Acciones reactivas.
  - **3:** CX metrices medidas continuamente (NPS, CSAT, CES). Loops de mejora por canal. Targets de CX en objetivos de negocio.
  - **4:** Real-time CX sensing. Experiencia medida en cada touchpoint. Optimización continua basada en datos. CX es parte de compensación ejecutiva.

---

### D6: Gobernanza y Gestión del Cambio

#### **D6.1 — Governance de Transformación Digital**
- **code:** `td-governance-framework`
- **description:** ¿Existe un framework de governance con roles, responsabilidades y cadencia de decisions claras?
- **Criterios:**
  - **0:** Sin governance formal. Decisiones ad hoc. Conflicto entre IT y negocio.
  - **1:** Steering committee informal de TD. Reuniones irregulares. Decisiones sin seguimiento.
  - **2:** Steering committee formal de TD con cadencia mensual. Roles claros pero documentación incompleta.
  - **3:** Governance framework operativo: roles RACI definidos, gates de go/no-go, reporteo de progreso formalizado.
  - **4:** Governance ágil: adaptación rápida sin burocracia. Comité de dirección empoderado para decisiones. Transparencia total de portfolio.

#### **D6.2 — Gestión de Riesgos de Transformación Digital**
- **code:** `td-governance-risk`
- **description:** ¿Se identifican y mitigan activamente riesgos de transformación digital (técnicos, organizacionales, de cambio)?
- **Criterios:**
  - **0:** Sin risk register. Riesgos emergen en crisis.
  - **1:** Algunos riesgos identificados informalmente. Sin plan de mitigación.
  - **2:** Risk register básico de TD. Riesgos priorizados pero sin dueños claros.
  - **3:** Risk register operativo: técnicos, organizacionales y cambio. Controles mitigantes identificados. Revisión trimestral.
  - **4:** Gestión proactiva de riesgos: early warning indicators, escenarios, simulaciones. Riesgos materializados raramente.

#### **D6.3 — Compliance, Seguridad y Cumplimiento Normativo**
- **code:** `td-governance-compliance`
- **description:** ¿Se aseguran el cumplimiento de regulaciones (GDPR, sector-específicas) en iniciativas de transformación digital?
- **Criterios:**
  - **0:** Sin proceso de compliance. Iniciativas digitales son riesgos regulatorios latentes.
  - **1:** Conciencia de regulaciones. Privacy Officer pero sin procesos sistemáticos en TD.
  - **2:** Due diligence de compliance por iniciativa. Auditorías internas ocasionales.
  - **3:** Compliance by design integrado. Auditorías anuales de iniciativas TD. Certificaciones sector-específicas (e.g., ISO 27001).
  - **4:** Compliance automatizado donde es posible. Auditorías continuas. Certificaciones múltiples. Referente de cumplimiento para el sector.

#### **D6.4 — Monitorización y Medición de Progreso de TD**
- **code:** `td-governance-measurement`
- **description:** ¿Se miden objetivamente el progreso, el impacto y el ROI de iniciativas de transformación digital?
- **Criterios:**
  - **0:** Sin métricas. Progreso es "sensación" subjetiva.
  - **1:** Algunas métricas de actividad (# de iniciativas lanzadas). Sin medición de impacto.
  - **2:** Métricas de impacto básicas: adopción de usuarios, time-to-market. Sin consolidación en scorecard.
  - **3:** Cuadro de mando de TD operativo: KPIs técnicos (uptime, deployment frequency) y negocio (revenue, eficiencia).
  - **4:** Digital Maturity Model medido continuamente. ROI de cada iniciativa rastreado. Datos de progreso transparentes para toda la organización.

---

## C.1 Verificación de Estructura

✅ **24 subdimensiones totales** (4 × 6)  
✅ **Códigos prefijados con `td-`** — evita colisión con AI Adoption  
✅ **Criterios 0-4 para cada una** — escala de madurez consistente  
✅ **Descripciones claras y unívocas** — evaluables sin ambigüedad  

---

## D. Análisis de Reutilización T1 y Bloqueadores de Activación

### D.1 Reutilización sin cambios de T1

✅ **Motor de scoring:** T1 usa promedio aritmético de subdimensiones para cada dimensión, luego suma ponderada. **Reusable para TD** sin cambios.

✅ **Interfaz de entrevista:** Pantalla T1 (selector de subdimensión, criterios expandibles, campo de evidencia) **reutilizable directamente** si se parametriza `DIMENSION_DEFINITIONS` por dominio.

✅ **Output QW1 (Executive Summary):** Gráfico de radar, identificación de strengths/gaps, recomendaciones por nivel — **aplicable a TD sin cambios conceptuales**, solo generación de texto context-aware.

### D.2 Partes que requieren parametrización

⚠️ **DIMENSION_DEFINITIONS hardcoded en constants.ts** — Actualmente está solo para AI Adoption. Para activar TD:
- Opción A: Crear `transformacion-digital-constants.ts` con idéntica estructura (mantenida en `/docs/domains/`)
- Opción B: Mover DIMENSION_DEFINITIONS a BD (`evaluation_dimensions` + subdimensiones) y cargar dinámicamente en T1 (**fuera de scope Fase 5**, es Fase 6+)

⚠️ **LLM prompts de T1** — El prompt de generación de recomendaciones (system prompt en `t1ContextBuilder.ts`) asume lenguaje de "IA Adoption". Para TD:
- Necesita parametrización: `{{domain_label}}`, `{{dimension_context}}`, etc.
- Está parcialmente hecho en `llm_prompt_templates` table, pero T1 aún no lo consume
- **Bloqueante para producción:** T1 ignora actualmente `useDomainFramework()` hook

### D.3 Partes bloqueantes para producción

🔴 **T1 no consume dominio del proyecto** — `t1ContextBuilder.ts` no inyecta `domain_id` en el prompt del LLM.

**Impacto:** Si se activa TD, T1 podría lanzarse indistintamente en AI Adoption o TD, pero:
- El contexto LLM sería siempre AI Adoption (literales hardcodeados)
- Las recomendaciones no estarían contextualizadas al dominio
- Output sería confuso para cliente

**Solución:** En Fase 6, extender `t1ContextBuilder.ts` para inyectar `domain_id` → cargar prompt desde `llm_prompt_templates` → interpolar `{{domain_label}}` y dimensiones de `evaluation_dimensions`.

### D.4 Pendientes Type 1 y Type 2 (Fase 5 ADR-029)

De la auditoría de Fase 5:

- **Type 1 (Tipo 1) — Domain labels:** `ai_adoption`, `transformacion_digital` → **DONE** (governance_domains table)
- **Type 2 (Tipo 2) — Dimension labels:** `evaluacion_dimensiones`, `subdimension_labels` → **PENDING SEED** (evaluation_dimensions table vacía)
- **Type 3 (Tipo 3) — Framework labels:** `ai_act_*`, etc. → **DONE** (framework_controls seeded 20260826)
- **Type 4 (Tipo 4) — LLM prompts:** `t1_radar_system_prompt`, etc. → **PARTIALLY DONE** (llm_prompt_templates seeded para AI Adoption, no TD)
- **Type 5 (Tipo 5) — Module labels:** `T1`, `T2`, etc. → Out of scope ADR-029

**Implicación para TD:**
- No bloquea implementación de la tabla schema (ya existe)
- **Bloquea activación de T1 en TD** porque las dimensiones y subdimensiones Type 2 no estarían seeded en `evaluation_dimensions`
- Solución: En Fase 6, ejecutar seed SQL para TD (`evaluation_dimensions` + subdimensiones de esta especificación)

---

## E. Escenario de Demo: "Parálisis en Modernización Legacy"

### E.1 Empresa Ficticia

| Aspecto | Valor |
|---|---|
| **Nombre** | Seguros Peninsular (ficticia) |
| **Sector** | Seguros generales |
| **Empleados** | 850 |
| **País** | España (Madrid HQ) |
| **Contexto** | Aseguradora tradicional con 40 años. Sistemas core en mainframe (COBOL). Competencia fintech emergente. Presión de regulación PSD2 y Solvencia II. |

**Descripción del problema:**

"Nos vendimos como empresa digital, pero bajo el capó está el caos. Tenemos webs modernas que hablan con APIs que hablan con bases de datos de 1992. El CIO dice que hay que hacer cloud, pero sin dinero real. Una de cada tres iniciativas de transformación se cancela a mitad. Los empleados usan SaaS shadow IT para lo que el sistema no hace. La junta directiva me dice: '¿Por qué CompetitorX lanza 5 productos digitales al año y nosotros 1?'"

*— María González, COO, Seguros Peninsular*

### E.2 Patrón Diagnóstico

**Denominación:** "Parálisis en Modernización Legacy"

**Descripción:** Organización reconoce necesidad de transformación digital. Hay inversión, hay visión. Pero **arquitectura heredada es un ancla**. Datos en silos. Cada iniciativa nueva requiere integraciones costosas. Talento digital no está atrayéndose porque infraestructura es "lo opuesto a lo que aprendí en la uni". Cambio organizativo se percibe como "modernización TI" (problema de otros) no como "reconfiguración del negocio" (problema de todos).

### E.3 Valores del T1 Radar para TD

| Dimensión | Score Actual | Target |
|---|---|---|
| D1 Visión y Liderazgo | **2.2** | 3.5 |
| D2 Datos y Analítica | **1.5** | 3.0 |
| D3 Infraestructura | **1.8** | 3.5 |
| D4 Talento y Cultura | **1.4** | 3.0 |
| D5 Experiencia de Cliente | **2.6** | 3.5 |
| D6 Gobernanza | **2.0** | 3.0 |

**Overall Score:** `(2.2 + 1.5 + 1.8 + 1.4 + 2.6 + 2.0) / 6 = **1.92** ≈ **Inicial-Exploración** (fase de transición)

**Maturity Tier:** `exploracion` (punto de ruptura: o acelera o retrocede)

### E.4 Hero Metrics

```json
[
  {
    "value": "40",
    "label": "Aplicaciones críticas en mainframe",
    "sublabel": "sin roadmap de modernización",
    "trend": "down",
    "deltaLabel": "bloqueador de 60% de iniciativas"
  },
  {
    "value": "18 meses",
    "label": "Tiempo promedio de un proyecto digital",
    "sublabel": "desde ideación a producción",
    "trend": "down",
    "deltaLabel": "vs 6 meses en competencia"
  },
  {
    "value": "€ 2.3M",
    "label": "Presupuesto anual TD",
    "sublabel": "crecimiento año a año",
    "trend": "up",
    "deltaLabel": "pero fragmentado en 12+ iniciativas"
  },
  {
    "value": "23%",
    "label": "Brecha de talento digital",
    "sublabel": "puestos open en equipos de transformación",
    "trend": "down",
    "deltaLabel": "principal razón: infraestructura heredada poco atractiva"
  }
]
```

### E.5 Narrativa del Cliente

**CIO, Seguros Peninsular:**

"La junta dice 'somos digitales'. Pero somos tan digitales como una gasolinera que tiene app para pagar la gasolina mientras todo lo demás sigue siendo 1990. Mi equipo de arquitectos pasa 40% del tiempo integrando legacy con lo nuevo. Los jóvenes ingenieros que contrato duran 2 años: aprenden el stack moderno, ven que todo termina en Oracle de 1997 y se van a Mercadona Tech. He pedido 5 años para modernizar core, pero el negocio quiere resultados en 18 meses. ¿Cómo lo hago? Necesito un plan que sea realista y que le hable tanto a la junta como a mi equipo."

**Impacto esperado de T1 Transformación Digital:**
- Identifica exactamente dónde está el cuello de botella (D2 y D4 son los críticos, no D1)
- Propone hoja de ruta: primero data architecture (D2), luego talento (D4), luego infraestructura (D3)
- Valida que la inversión en TD es correcta, pero requiere paciencia: no es "falta de visión" sino "arquitectura bloqueadora"
- Abre conversación con junta: "Necesitamos decidir: ¿modernizamos core o contratamos talent externo?"

---

## F. Checklist de Aceptación

- ✅ Metadata del dominio completa (slug, label, version, descripción)
- ✅ Diferencia conceptual respecto a AI Adoption documentada
- ✅ 6 dimensiones con pesos justificados, suma = 1.00
- ✅ 24 subdimensiones con código `td-` prefijado
- ✅ Criterios 0-4 para cada subdimensión
- ✅ Recomendaciones por nivel para cada dimensión
- ✅ Análisis de reutilización T1 con bloqueadores identificados
- ✅ Type 1 y Type 2 pendientes de Fase 5 mapeados al contexto de TD
- ✅ Escenario de demo con valores numéricos concretos
- ✅ Narrativa de cliente contextualizada
- ✅ Cero archivos de producción modificados (documento de referencia)

---

**Siguiente paso:** Crear `/docs/domains/transformacion-digital-constants.ts` con estructura DimensionDefinition[] e `/docs/domains/transformacion-digital-seed.sql` con INSERT SQL para tablas de BD.

