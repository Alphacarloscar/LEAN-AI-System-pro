# FUNCTIONAL SPEC — GOBY / L.E.A.N. AI System Enterprise

**Versión:** 1.0 | **Fecha:** 2026-05-22 | **Propietario:** Alpha Consulting Solutions S.L.
**Complementa:** `TECHNICAL_SPEC.md` (arquitectura y código)
**Audiencias:** equipo consultor · dirección de cliente · incorporaciones nuevas · auditoría

---

## 1. QUÉ ES GOBY Y PARA QUÉ SIRVE

GOBY es la plataforma digital que soporta la metodología **L.E.A.N. AI System Enterprise**. Su función es guiar a una empresa cliente a través de un diagnóstico estructurado de 6 meses para adoptar inteligencia artificial de forma ordenada, priorizando los casos de uso con mayor impacto, gestionando los riesgos regulatorios y estableciendo un gobierno IA sostenible.

**Sin GOBY:** El consultor gestiona la información en Excel, PowerPoint y notas de entrevista dispersas. Los datos no se acumulan, no se conectan entre sí y no se pueden mostrar al cliente en tiempo real.

**Con GOBY:** Cada entrevista, score y decisión queda registrada. Los outputs de una herramienta alimentan automáticamente a las siguientes. El cliente puede ver el avance en tiempo real. Al final del sprint, el consultor tiene todos los entregables listos para exportar.

---

## 2. TIPOS DE ENTIDADES Y SUS RELACIONES

### 2.1 Empresas (`companies`)

Una **empresa** es el tenant raíz del sistema. Representa a la organización cliente.

- Una empresa puede tener múltiples **proyectos** (diagnósticos) a lo largo del tiempo.
- Una empresa tiene usuarios asociados: su equipo operativo (client_editor) y su dirección (client_viewer).
- Las empresas las crea el **superadmin** desde el panel `/admin`.
- Campos: nombre, slug (generado automáticamente), fecha de creación.

**Ejemplos de uso real:**
- Alpha crea la empresa "Nexus Industrial S.A." al iniciar un engagement.
- Crea el proyecto "Diagnóstico IA Q3 2026" y lo asocia a esa empresa.
- Invita al CIO de Nexus como `client_editor` y al CEO como `client_viewer`.

### 2.2 Proyectos (`projects`)

Un **proyecto** es la instancia de trabajo activa. Dentro de un proyecto se almacenan todos los datos de T1–T12.

- Un proyecto tiene una **fase activa** (`listen / evaluate / activate / normalize / closed`).
- Un proyecto tiene **miembros** con roles (`consultant` o `viewer`).
- Un consultor Alpha puede ser miembro de múltiples proyectos simultáneamente (multi-client).
- Los clientes solo ven los proyectos de su empresa.

**Ciclo de vida de un proyecto:**
```
Creación (superadmin) → Listen (T1, T2, T3, CompanyProfile)
→ Evaluate (T4, T5) → Activate (T6, T7, T8, T9)
→ Normalize (T10, T11, T12) → Closed
```

### 2.3 Usuarios y roles en detalle

| Rol | Quién es | Qué puede hacer | Qué NO puede hacer |
|---|---|---|---|
| **Superadmin** | Carlos (Alpha) | Todo: crear empresas, usuarios, proyectos, ver todos los datos | — |
| **Consultant** | Consultor de Alpha asignado | Acceder y editar todos los datos de sus proyectos asignados | Ver proyectos de otros consultores sin asignación |
| **Client Editor** | CIO, Head of Digital, PMO del cliente | Ver y editar datos de su empresa y proyectos | Ver otras empresas; acceder a `/admin` |
| **Client Viewer** | CEO, CFO, directivo del cliente | Ver dashboards y resultados de su empresa | Escribir o modificar ningún dato |

**Flujo de acceso de un usuario nuevo:**
1. El superadmin crea la empresa en `/admin → Empresas`.
2. El superadmin invita al usuario en `/admin → Usuarios` (email, nombre, empresa, rol).
3. El usuario recibe el email de invitación (pendiente de activar Edge Function, actualmente mockeado).
4. El usuario entra con su email y contraseña en `/login`.
5. Si tiene un solo proyecto, lo ve directamente. Si tiene varios, usa el selector.

---

## 3. NAVEGACIÓN GENERAL Y ESTRUCTURA DE PANTALLAS

### 3.1 Pantalla de login (`/login`)

**Qué hace:** Autenticación por email y contraseña.

**Interacción:**
- El usuario introduce email y contraseña.
- Si las credenciales son incorrectas, aparece el mensaje: *"Credenciales incorrectas. Verifica tu email y contraseña."*
- Si el usuario existe en Auth pero no tiene perfil en `profiles` (fallo del trigger de creación), aparece: *"Perfil de usuario no encontrado. Contacta con el administrador."*
- Enlace a `/reset-password` para recuperación de contraseña.
- Al hacer login correcto, redirige a `/` (T10 Dashboard).

**Dato importante:** Mientras la app comprueba si hay sesión activa (al recargar la página), muestra un spinner en lugar de redirigir a login. Esto evita el flash de login en usuarios ya autenticados.

### 3.2 Layout principal (Header + Sidebar)

Presente en todas las rutas protegidas. Compuesto por:

**Header:** Logo de Alpha Consulting + nombre del producto + selector de proyecto (si hay más de uno) + botón de logout.

**Selector de proyecto (EngagementSelector):** Permite al consultor multi-cliente cambiar entre proyectos activos sin cerrar sesión. El proyecto seleccionado se persiste en localStorage. Al cambiarlo, todos los stores se recargan automáticamente con los datos del nuevo proyecto.

**Sidebar (drawer lateral):** Se abre con el botón de hamburguesa siempre visible en el borde izquierdo. Contiene:
- Enlace a **Perfil de Empresa** (siempre visible, no pertenece a ninguna fase)
- Las **4 fases del sprint** L.E.A.N. como secciones colapsables (Listen, Evaluate, Activate, Normalize)
- Dentro de cada fase, las herramientas T1–T12 con un **status dot** de colores:
  - 🟢 Verde: completada
  - 🟡 Ámbar: en curso
  - ⬜ Gris: pendiente
  - 🔴 Rojo: bloqueada
- Las fases con estado `locked` aparecen deshabilitadas y no son navegables.

---

## 4. PANTALLA A PANTALLA — DESCRIPCIÓN FUNCIONAL COMPLETA

---

### PERFIL DE EMPRESA (`/company-profile`)

**Quién la usa:** El consultor Alpha, con posible participación del cliente editor.
**Cuándo:** Al inicio del sprint, antes de empezar T1. Se actualiza a lo largo del proyecto.
**Para qué:** Captura el contexto estratégico de la empresa cliente. Este contexto alimenta automáticamente todos los generadores LLM de la plataforma (política IA, plan de cambio, mensajes por arquetipo, recomendaciones ejecutivas).

**Datos que se rellenan:**

| Campo | Tipo | Opciones | Para qué se usa |
|---|---|---|---|
| Nombre del proyecto | Texto libre | — | Identificación interna |
| Sector | Selector | Industria, Retail, Financiero, Salud, Educación, etc. | Sectoriza los outputs del LLM |
| Tamaño de empresa | Selector | <50, 50–200, 200–1.000, 1.000–5.000, >5.000 empleados | Escala las recomendaciones |
| Objetivo principal IA | Selector | Reducir costes, Aumentar ingresos, Mejorar experiencia cliente, Optimizar operaciones, etc. | Orienta los casos de uso priorizados |
| Horizonte de valor | Selector | 3, 6, 12, 18+ meses | Determina la urgencia de los quick wins |
| Ecosistema tecnológico | Selector | Microsoft 365, Google Workspace, SAP, Salesforce, etc. | Adapta recomendaciones de herramientas |
| Restricciones conocidas | Texto libre | — | Avisa al LLM de limitaciones del cliente |
| Áreas prioritarias | Chips multi-selección | RRHH, Finanzas, Operaciones, IT, Marketing, Ventas, Legal, etc. | Filtra y prioriza oportunidades |

**Fricciones identificadas:** El consultor añade fricciones observadas durante el diagnóstico. Cada fricción tiene:
- **Tipo** (ej. "Silos de datos", "Resistencia cultural", "Falta de talento técnico")
- **Área funcional** (ej. "RRHH", "Operaciones")
- **Frecuencia:** Baja / Media / Alta
- **Impacto:** Bajo / Medio / Alto
- **Notas** de contexto

Las fricciones se añaden con el botón "Añadir fricción". Cada una se muestra como tarjeta con pills de colores para frecuencia e impacto. Se pueden eliminar individualmente.

**Guardado:** Botón "Guardar cambios" en la parte inferior. UPSERT en `company_profiles` y `frictions` (se recalculan al guardar). En modo demo, el guardado no persiste en BD.

---

### T1 — AI MATURITY RADAR (`/t1`)

**Quién la usa:** Consultor Alpha durante sesiones de entrevista con el cliente.
**Cuándo:** Fase Listen. Primera herramienta a completar.
**Para qué:** Diagnosticar el nivel de madurez de IA de la organización en 6 dimensiones. El output es el radar de madurez que sirve de baseline para todo el sprint.

**Qué evalúa — 6 dimensiones × 4 subdimensiones = 24 puntos de evaluación:**

| Código | Dimensión | Peso | Qué mide |
|---|---|---|---|
| D1 | Estrategia | 18% | Visión IA, roadmap, presupuesto, patrocinio ejecutivo |
| D2 | Datos | 18% | Disponibilidad, calidad, volumen, privacidad |
| D3 | Tecnología | 14% | Infraestructura cloud, APIs, seguridad, MLOps |
| D4 | Talento | 16% | Capacidad técnica, formación, cultura experimental, gestión del cambio |
| D5 | Procesos | 16% | Identificación de oportunidades, rediseño con IA, ROI, metodología de pilotos |
| D6 | Gobernanza | 18% | Política IA, gestión de riesgos, catálogo de herramientas, ISO 42001 |

**Escala de scoring por subdimensión: 0–4**
- **0:** No existe nada relacionado
- **1:** Existe conciencia, pero nada formalizado
- **2:** En desarrollo o piloto parcial
- **3:** Implementado y funcional
- **4:** Maduro, revisado periódicamente, referente

Para cada subdimensión, la pantalla muestra:
- El nombre y descripción de qué evalúa
- Un **slider 0–4** para puntuar
- Al expandir "Ver criterios": la descripción exacta de cada nivel (0 al 4) para ese punto específico
- Un campo de texto para añadir **evidencia** (notas de entrevista, ejemplos concretos)

**Flujo de uso:**

1. El consultor añade un entrevistado: nombre, cargo, tipo (IT o Negocio).
2. Selecciona al entrevistado en el panel lateral izquierdo.
3. Para cada subdimensión, mueve el slider mientras el interlocutor responde preguntas.
4. Opcionalmente anota evidencias textuales.
5. Añade otro entrevistado (típicamente uno IT + uno de negocio).
6. El radar promedia automáticamente todos los entrevistados.

**Scores se guardan automáticamente** (debounce 800ms) sin necesidad de pulsar "Guardar".

**Gráfico — Radar Chart (spider chart):**
- 6 ejes (uno por dimensión), escala 0–4.
- Polígono exterior = score máximo posible (4 en todas).
- Polígono interior = scores reales del proyecto.
- Si hay múltiples entrevistados, se puede ver el radar individual de cada uno o el promedio consolidado.
- **Cómo interpretar:** La brecha entre el polígono real y el exterior marca las dimensiones con mayor gap de madurez. Las dimensiones con score < 2 son áreas críticas que requieren acción antes de escalar ningún proyecto IA.
- **Firma visual del patrón:** Cada patrón de disfunción tiene una forma característica del radar (ej. "Vendor Sprawl" → gobernanza muy baja, estrategia alta; "Pilot Chaos" → procesos muy bajos, talento medio).

**Output que genera:** Datos del radar usados por T10 (dashboard ejecutivo), T11 (adaptación de cadencia operativa) y por los prompts LLM de toda la plataforma.

---

### T2 — AI STAKEHOLDER MATRIX (`/t2`)

**Quién la usa:** Consultor Alpha durante entrevistas individuales con cada stakeholder.
**Cuándo:** Fase Listen. Paralelamente o justo después de T1.
**Para qué:** Clasificar a cada persona clave de la organización en un arquetipo de adopción IA y un nivel de resistencia. Define cómo comunicar e intervenir con cada uno durante el sprint.

**Los 5 arquetipos propietarios:**

| Arquetipo | Perfil | Tagline | Color |
|---|---|---|---|
| **Adoptador** | Usuario activo, entusiasta | "Usa IA y quiere más. No lidera, pero multiplica." | Verde |
| **Ambassador** | Conector IT-Negocio con influencia | "Conecta IT y Negocio. El activo más escaso." | Azul |
| **Decisor** | Autoridad de presupuesto | "Firma el presupuesto. Necesita ROI, no demos." | Navy |
| **Crítico** | Escéptico activo con influencia | "Bloquea por convicción. Escucharle es la palanca." | Rojo |
| **Reticente** | Experto que teme ser reemplazado | "Sabe más que nadie. Teme que la IA lo reemplace." | Ámbar |

**Niveles de resistencia:** Baja · Media · Alta (determinados por el score de apertura en la entrevista).

**Flujo de uso:**

1. El consultor añade un stakeholder (nombre, cargo, departamento).
2. Opcionalmente registra herramientas de **Shadow AI** en uso (campo `unofficialTools`): herramientas de IA que el stakeholder usa por su cuenta sin aprobación corporativa (ej. "ChatGPT para redactar informes", "Midjourney para marketing").
3. Abre el modal de **entrevista estructurada** para ese stakeholder.
4. Responde 5 preguntas de opción múltiple (A/B/C/D) sobre: uso actual de IA, expectativa de impacto, posición ante nuevas tecnologías, influencia en decisiones de inversión y reacción ante automatización de su área.
5. Al completar la entrevista, el sistema calcula automáticamente el arquetipo y la resistencia.
6. El consultor puede ajustar manualmente el arquetipo si considera que el algoritmo no ha capturado bien el perfil (`manual_override=true`).

**Algoritmo de asignación (en orden de prioridad):**
1. Si `connector ≥ 3 AND influence ≥ 2.5 AND adoption ≥ 2` → Ambassador
2. Si `influence ≥ 2.5 AND adoption ≥ 2` → Decisor
3. Si `influence ≥ 2.5 AND adoption < 2` → Crítico
4. Si `adoption < 1.5 AND openness < 1.5` → Reticente
5. Resto → Adoptador

**Gráfico — Quadrant Chart (scatter plot):**
- Eje X: nivel de adopción (bajo → alto).
- Eje Y: nivel de influencia organizacional (bajo → alto).
- Cada stakeholder aparece como un punto con su nombre, coloreado por arquetipo.
- **Cómo interpretar:**
  - Cuadrante superior derecho (alta influencia + alta adopción) = Ambassadors y Decisores pro-IA: aceleran el proyecto.
  - Cuadrante superior izquierdo (alta influencia + baja adopción) = Críticos y Reticentes con poder: máximo riesgo de bloqueo.
  - Cuadrante inferior derecho (baja influencia + alta adopción) = Adoptadores: aliados de implementación.
  - Cuadrante inferior izquierdo: zona de menor impacto.

**Output que genera:**
- Para **T4:** Qué stakeholders participarán en el taller de scoring de casos de uso y con qué perfil.
- Para **T7:** Posicionamiento en la curva de Rogers para el plan de adopción.
- Para **T8:** Mensajes personalizados por arquetipo en el plan de comunicación.
- Para **T10:** Ratio de early adopters del equipo cliente.
- Para **T6/T10:** Indicador de riesgo Shadow AI (cuántos stakeholders usan herramientas no aprobadas).

---

### T3 — VALUE STREAM MAP (`/t3`)

**Quién la usa:** Consultor Alpha, con posible participación del responsable de cada proceso.
**Cuándo:** Fase Listen. Después o paralelamente a T1 y T2.
**Para qué:** Identificar los procesos de negocio con mayor potencial de mejora con IA. Cada proceso se evalúa mediante una entrevista estructurada que determina automáticamente la categoría de IA más adecuada.

**Flujo de uso:**

1. El consultor añade un proceso/value stream (nombre, departamento, responsable, fase de madurez actual).
2. Abre el modal de **entrevista de proceso** (MCQ sobre 5 dimensiones):
   - Automatización: ¿qué porcentaje del proceso es repetitivo y basado en reglas?
   - Datos: ¿qué calidad y disponibilidad tienen los datos del proceso?
   - Volumen: ¿con qué frecuencia y volumen se ejecuta?
   - Impacto: ¿cuánto vale mejorar este proceso para el negocio?
   - Readiness: ¿cómo es la disposición del equipo al cambio?
3. El algoritmo calcula un **score de oportunidad IA (0–4)** y asigna la **categoría IA**:

| Categoría | Cuándo se asigna | Ejemplo de uso |
|---|---|---|
| Automatización RPA | Alto potencial de automatización + datos escasos | Procesar facturas con reglas fijas |
| Automatización Inteligente | Alto auto + buenos datos | Clasificación automática de contratos |
| Analítica Predictiva | Buenos datos + alto impacto | Predicción de demanda, scoring de clientes |
| Asistente IA | Equipo receptivo + bajo auto | Copilot para agentes de soporte |
| Optimización de Proceso | Scores medios | Análisis de cuellos de botella |
| Agéntica | Máximo en todas | Agentes autónomos multi-paso |

4. El nivel de oportunidad se clasifica como: `baja / media / alta / crítica`.
5. Opcionalmente, el consultor puede añadir las **etapas del proceso** (VSM detallado): para cada etapa, el tiempo de proceso (horas), tiempo de espera, número de handoffs y valor que aporta (alta/media/baja/nula).
6. El sistema sugiere **oportunidades IA concretas** según la categoría asignada. El consultor valida o descarta cada una.

**Output que genera:**
- Para **T4:** Los procesos con oportunidad alta o crítica se pueden importar directamente como casos de uso (un click, "Importar desde T3"), pre-rellenando nombre, departamento, categoría IA y un score inicial de impacto en KPI.
- Para el portfolio de proyectos del cliente: visión completa de qué procesos son candidatos IA.

---

### T4 — USE CASE PRIORITY BOARD (`/t4`)

**Quién la usa:** Consultor Alpha como facilitador. Stakeholders del cliente como participantes del taller.
**Cuándo:** Fase Evaluate. Taller presencial o remoto de 3–4 horas.
**Para qué:** Priorizar los casos de uso IA mediante scoring multi-dimensional y decidir cuáles van a "Go" (implementar), cuáles a "No-Go" y cuáles merecen más análisis.

**Cómo entran los casos de uso:**
- **Importados desde T3:** Un click desde la pantalla T3 importa el proceso como caso de uso, heredando nombre, departamento y categoría IA.
- **Creados manualmente:** El consultor añade casos de uso no identificados en T3 (ej. iniciativas ya en marcha, ideas del cliente).

**Scoring en el taller — 4 dimensiones:**

| Dimensión | Escala | Dirección | Descripción |
|---|---|---|---|
| Impacto en KPI | 0–100 | Mayor = mejor | ¿Cuánto impacta en los KPIs de negocio si se implementa? |
| Facilidad de implementación | 0–100 | Mayor = mejor | ¿Qué fácil es técnica y organizativamente? |
| Riesgo IA / Regulatorio | 0–100 | Mayor = peor | ¿Qué riesgo de sesgos, privacidad, regulación? |
| Dependencia de datos | 0–100 | Mayor = peor | ¿Los datos están listos o hay que prepararlos? |

**Score compuesto = KPI×0,35 + Facilidad×0,30 + (100-Riesgo)×0,20 + (100-Datos)×0,15**

**Thresholds automáticos de recomendación:**
- Score ≥ 70 → Recomendación **GO** (color verde)
- Score 50–69 → Zona gris, **Revisar en profundidad** (color ámbar)
- Score < 50 → Recomendación **NO-GO** (color rojo)

**Modalidades de scoring:**
- **Taller colectivo:** Cada stakeholder puntúa individualmente desde su dispositivo. Los scores individuales se promedian en tiempo real. Esto evita el efecto "ancla" donde el primero en hablar condiciona al resto.
- **Consultor solo:** El consultor introduce los scores consolidados directamente.

**Decisión go/no-go:** Una vez el caso tiene score, el consultor formaliza la decisión: Go / No-Go / Pending, con rationale textual y quién decide.

**Calculadora de ROI:** Para cada caso con decisión Go, el consultor puede rellenar los parámetros económicos:
- Horas/semana del proceso actual
- Número de personas involucradas
- Ganancia de eficiencia esperada (puede usar benchmarks por categoría IA o introducirla manualmente)
- Coste/hora (puede usar presets: Administrativo ~35€/h, Técnico ~55€/h, Directivo ~85€/h)
- Coste de implementación estimado (benchmark o manual)

El sistema calcula en tiempo real: **ahorro anual, payback en meses y ROI a 3 años**.

**Clasificación AI Act:** Para cada caso de uso, el consultor puede responder 4 preguntas y obtener la clasificación regulatoria automática (Prohibido / Alto riesgo / Riesgo limitado / Riesgo mínimo). Esta clasificación alimenta directamente T6 (dashboard de riesgos AI Act).

**Ciclo de vida del caso de uso:**
```
Candidato → Priorizado → Go → En piloto → Completado
                      ↘ No-Go
```

**Output que genera:**
- Para **T5:** Los casos de uso clasificados por categoría IA informan qué dominios IA priorizar.
- Para **T6:** Las clasificaciones AI Act se agregan en el dashboard de riesgos regulatorios.
- Para **T9:** Los casos con decisión "Go" se importan automáticamente al Gantt de 6 meses.
- Para **T10:** El portfolio activo, el ahorro anual total y los casos de alto riesgo alimentan el dashboard ejecutivo.

---

### T5 — AI DOMAIN ARCHITECTURE CANVAS (`/t5`)

**Quién la usa:** Consultor Alpha en sesión estratégica con el CIO / CDO del cliente.
**Cuándo:** Fase Evaluate. Después de T4.
**Para qué:** Definir la estrategia de activación IA por dominio tecnológico: qué tipo de IA conviene desplegar primero, en qué orden y bajo qué condiciones de governance.

**6 dominios IA del L.E.A.N. System:**

| Dominio | Código | Qué abarca |
|---|---|---|
| Automatización RPA | `automatizacion_rpa` | Bots de reglas, automatización de tareas repetitivas sin decisión |
| Automatización Inteligente | `automatizacion_inteligente` | Automatización con comprensión de documentos, clasificación |
| Analítica Predictiva | `analitica_predictiva` | Modelos de predicción, forecasting, scoring |
| Asistente IA | `asistente_ia` | Copilots, chatbots, assistants para empleados o clientes |
| Optimización de Proceso | `optimizacion_proceso` | Análisis de procesos, detección de anomalías, mejora continua |
| Agéntica | `agéntica` | Agentes autónomos multi-paso con razonamiento complejo |

Para cada dominio, se evalúan 4 dimensiones (escala 0–100):
- **Valor de negocio:** ¿Cuánto puede aportar este dominio a la empresa?
- **Madurez técnica:** ¿Tiene la infraestructura y datos para soportarlo?
- **Readiness organizativa:** ¿Está el equipo preparado para adoptarlo?
- **Nivel de riesgo:** ¿Qué riesgo regulatorio y ético implica?

El sistema genera automáticamente la **recomendación de activación** por dominio:
- **Activar ahora:** Condiciones cumplidas → lanzar este trimestre
- **Pilotar 90 días:** Perfil prometedor → piloto controlado antes de escalar
- **Preparar foundations:** El valor es claro pero faltan prerequisites (datos, equipo, infraestructura)
- **Gobernar primero:** El riesgo es demasiado alto para desplegar sin governance establecido

Para cada dominio también se definen: responsable sugerido, KPI principal, condiciones de activación y notas de governance.

El canvas concluye con la **secuencia de activación recomendada** (en qué orden desplegar cada dominio) y el **nivel de madurez IA global** de la organización (`inicial / emergente / operativo / avanzado`).

---

### T6 — RISK & GOVERNANCE (`/t6`)

**Quién la usa:** Consultor Alpha + posiblemente el DPO o responsable legal del cliente.
**Cuándo:** Fase Activate. Después de T4 y T5.
**Para qué:** Tres outputs en uno: política IA corporativa descargable en PDF, dashboard de cumplimiento AI Act y checklist de controles ISO 42001.

**Tab 1 — Política IA Corporativa:**

La política se genera automáticamente combinando:
- Datos estructurados de T4 (catálogo de casos de uso con su clasificación AI Act)
- Datos del perfil de empresa (sector, tamaño, ecosistema)
- Texto narrativo generado por Claude API (apertura, principios éticos, contexto sectorial)

**Estructura de la política generada:**
1. Declaración de principios (con párrafo de apertura adaptado al sector)
2. Alcance (qué sistemas y procesos cubre)
3. 6 principios éticos (transparencia, equidad, privacidad, responsabilidad, seguridad, sostenibilidad) — con descripción sectorizada
4. Contexto regulatorio específico del sector (EU AI Act, GDPR para IA, normativa sectorial)
5. Catálogo de sistemas IA activos y clasificados
6. Roles y responsabilidades (quién aprueba, quién audita, quién opera)
7. Proceso de evaluación y aprobación de nuevos sistemas IA

El consultor puede regenerar la política con un click para actualizar el contenido narrativo.
**Descarga en PDF** mediante `@react-pdf/renderer`.

**Tab 2 — Dashboard AI Act:**

Muestra el resumen de riesgos del portfolio de T4:
- Total de casos de uso en el proyecto
- Breakdown por nivel de riesgo: ¿Cuántos son prohibidos / alto / limitado / mínimo?
- % de casos clasificados vs. pendientes de clasificar
- Tarjeta por nivel con descripción de las obligaciones regulatorias:
  - **Prohibido:** Requiere revisión legal inmediata antes de cualquier desarrollo
  - **Alto riesgo:** Evaluación de conformidad obligatoria antes de agosto 2026 (deadline EU AI Act)
  - **Riesgo limitado:** Obligación de informar al usuario que interactúa con IA
  - **Riesgo mínimo:** Sin obligaciones específicas; documentar como buena práctica

**Tab 3 — ISO 42001:**

Checklist de 14 controles clave organizados en 7 cláusulas de la norma ISO/IEC 42001:
- Cláusula 4: Contexto de la organización
- Cláusula 5: Liderazgo
- Cláusula 6: Planificación
- Cláusula 7: Apoyo
- Cláusula 8: Operación
- Cláusula 9: Evaluación del desempeño
- Cláusula 10: Mejora

Cada control tiene: código (ej. "5.2"), título, descripción de qué implica, y estado: `No iniciado / En progreso / Implementado`. Algunos controles se marcan automáticamente como en progreso si los datos de T4/T5 indican que existe gobernanza relevante (`autoInferred=true`).

El consultor puede añadir notas de evidencia a cada control.

**Output que genera:** La política PDF es un entregable directo al cliente. El dashboard AI Act y el checklist ISO son la base del informe de governance final del sprint.

---

### T7 — ADOPTION HEATMAP (`/t7`)

**Quién la usa:** Consultor Alpha para diseñar la estrategia de adopción.
**Cuándo:** Fase Activate.
**Para qué:** Segmentar a los stakeholders de T2 en la curva de Rogers para diseñar el plan de adopción por fases.

**Gráfico — Curva de Rogers (Campana de adopción):**

La curva tiene 5 segmentos con sus porcentajes teóricos:
- **Innovators (2,5%):** Los primeros en adoptar cualquier tecnología
- **Early Adopters (13,5%):** Líderes de opinión que adoptan por convicción propia
- **Early Majority (34%):** Pragmáticos que adoptan cuando ven evidencia
- **Late Majority (34%):** Escépticos que adoptan por presión social o necesidad
- **Laggards (16%):** Últimos en adoptar, a veces nunca

Los stakeholders de T2 se posicionan en la curva según su arquetipo y nivel de resistencia:
- Adoptadores / Ambassadors con resistencia baja → Early Adopters / Innovators
- Decisores pro-IA → Early Majority
- Reticentes y Críticos con resistencia alta → Late Majority / Laggards

**Cómo interpretar el heatmap:**
- Si la mayoría de stakeholders están en Late Majority/Laggards → la estrategia debe centrarse en cambio cultural y comunicación antes que en tecnología.
- Si hay pocas personas en Early Adopters → encontrar y apoyar a los embajadores internos es la prioridad.
- Si hay muchos en Early Majority → una demostración sólida de ROI es suficiente para mover al grupo.

**Plan de cambio generado por LLM:** Claude API genera un plan de 3–4 fases (ej. "Mes 1–2", "Mes 3–4", "Mes 5–6") con:
- Título y objetivo de cada fase
- Qué segmentos de Rogers son el foco de cada fase
- 3–4 acciones concretas por fase
- El riesgo principal de cada fase
- Una nota de contexto sobre el patrón crítico observado en este cliente

---

### T8 — COMMUNICATION MAP (`/t8`)

**Quién la usa:** Consultor Alpha + posiblemente el RRHH o Communications Manager del cliente.
**Cuándo:** Fase Activate.
**Para qué:** Plan de comunicación operativo: qué decirle a quién, cuándo, por qué canal y en qué tono.

**3 tabs de outputs:**

**Tab 1 — Plan de acciones de comunicación:**
Lista de acciones organizadas en 3 fases temporales (alineadas con el plan de cambio de T7):
- Fase 1: Concienciación y early adopters
- Fase 2: Capacitación y Early Majority
- Fase 3: Normalización y Late Majority

Cada acción de comunicación incluye:
- Semana de ejecución (ej. "Semana 1–2")
- Tipo: anuncio / formación / actualización / sesión bilateral / workshop / newsletter / presentación ejecutiva
- Audiencia específica (ej. "Equipo de RRHH", "Comité de Dirección")
- Mensaje clave a transmitir
- Canal recomendado: email / reunión presencial / Teams/Slack / presentación / vídeo / documento
- Responsable de ejecutarlo
- Prioridad: Alta / Media / Baja

**Tab 2 — Mensajes por arquetipo (generados por Claude API):**
Para cada uno de los 5 arquetipos de T2, el sistema genera:
- **Headline:** El mensaje central adaptado al perfil del arquetipo
- **Key points:** 3–4 argumentos en el lenguaje que resuena con este perfil
- **Qué NO decir:** Lo que activa la resistencia de este arquetipo
- **Opening line:** Cómo empezar la conversación
- **Canal recomendado:** El canal más efectivo para cada perfil
- **Nota de resistencia:** Qué gestionar específicamente con este grupo

Ejemplo para arquetipo **Decisor:** el mensaje gira en torno al ROI cuantificado, el riesgo de no actuar, y la ventaja competitiva. Se evita el lenguaje técnico y las demos sin caso de negocio previo.

Ejemplo para arquetipo **Reticente:** el mensaje enfatiza que la IA amplifica al experto en lugar de reemplazarlo, y que su conocimiento de dominio es irremplazable en el diseño del sistema.

**Tab 3 — Kit por departamento:**
Para cada departamento con stakeholders identificados:
- Score de readiness del departamento (0–100)
- Preocupación principal del departamento
- Enfoque de comunicación recomendado
- Acciones de comunicación específicas
- Canal preferente para ese departamento
- Embajadores internos identificados (personas del departamento con arquetipo Adoptador o Ambassador)

---

### T9 — AI ROADMAP 6M (`/t9`)

**Quién la usa:** Consultor Alpha + el PMO del cliente.
**Cuándo:** Fase Activate. Después de T4 (necesita los casos de uso con decisión Go).
**Para qué:** Crear el plan de implementación de 6 meses en formato Gantt, asignando responsables y ventanas temporales a cada iniciativa.

**Gráfico — Gantt de 6 meses:**

El eje X representa los meses 1–6 del sprint de implementación. El eje Y lista las iniciativas.

**Dos tipos de filas en el Gantt:**
- **Iniciativas importadas desde T4** (casos de uso con decisión "Go"): Se importan automáticamente. El nivel de riesgo AI Act se muestra visualmente (barra roja = alto riesgo, ámbar = limitado, verde = mínimo). El consultor puede ajustar el mes de inicio/fin y el responsable.
- **Iniciativas libres:** El consultor añade manualmente iniciativas de soporte (formación, cambios de proceso, migraciones técnicas) que no son casos de uso IA pero son parte del plan.

**Cómo usar el Gantt:**
1. Los casos de uso Go de T4 aparecen como filas pre-cargadas con fechas estimadas.
2. El consultor ajusta el inicio/fin de cada barra arrastrando (o editando los campos mes inicio/fin).
3. Asigna un responsable a cada iniciativa.
4. Añade iniciativas de soporte (formación, habilitación técnica, governance).
5. El resultado es el plan de implementación visible para el cliente y el equipo.

**Cómo interpretar el Gantt:**
- Barras rojas o ámbar en los primeros meses indican alto riesgo regulatorio que necesita atención antes de implementar.
- Iniciativas muy solapadas en los primeros meses pueden indicar sobrecarga del equipo → reescalonar.
- Iniciativas sin responsable asignado son un riesgo de delivery.

---

### T10 — AI VALUE DASHBOARD (`/` — HOME)

**Quién la usa:** Todos los roles, pero principalmente el cliente viewer (C-Suite) y el consultor.
**Cuándo:** En cualquier momento del sprint. Es la pantalla de inicio.
**Para qué:** Vista ejecutiva del estado del programa IA. Responde "¿Cómo vamos?" en 30 segundos.

**Métricas del dashboard — 4 secciones:**

**1. Madurez IA (desde T1):**
- Score global de madurez (0–4, promedio ponderado de las 6 dimensiones)
- Dimensión con mayor score (fortaleza)
- Gap crítico (dimensión con menor score → donde hay más trabajo)

**2. Portfolio de casos de uso (desde T4):**
- Número de casos activos (Go + En piloto)
- Ahorro anual total proyectado (suma de todos los ROI calculados)
- Casos de alto riesgo AI Act (requieren atención regulatoria)

**3. Adopción (desde T2):**
- Total de stakeholders mapeados
- Ratio de early adopters (% con arquetipo Adoptador o Ambassador)
- Stakeholders sin entrevistar (aún pendientes de clasificar)

**4. Governance (desde T11):**
- Tier de madurez operativa (Fundacional / En desarrollo / Avanzado / Optimizado)
- Número de ceremonias de gobierno críticas recomendadas
- Número de decisiones con responsable asignado

**Recomendaciones ejecutivas (LLM):** Debajo de los KPIs, el sistema muestra 3–4 recomendaciones priorizadas generadas por Claude API basadas en el estado actual del programa. Ejemplos:
- *"El gap crítico está en Datos (D2: 1.8/4). Sin mejorar la calidad de datos, los casos de uso de analítica predictiva no llegarán a producción."*
- *"El 67% de stakeholders están en Late Majority. Refuerza la comunicación con Decisores antes de escalar el piloto."*

**En modo demo:** El dashboard muestra datos del escenario ficticio seleccionado. En producción con datos reales, los KPIs reflejan el estado actual del proyecto activo.

---

### T11 — AI OPERATING RHYTHM (`/t11`)

**Quién la usa:** Consultor Alpha + COO / CIO del cliente.
**Cuándo:** Fase Normalize. Cuando el programa IA empieza a tener múltiples iniciativas en marcha.
**Para qué:** Establecer la cadencia de reuniones, decisiones y KPIs para gobernar el programa IA de forma sostenible a largo plazo. Inspirado en SAFe (Scaled Agile Framework), adaptado a gobierno IA.

**El modelo se adapta automáticamente al score de madurez T1:**

| Score T1 promedio | Modo | Qué muestra |
|---|---|---|
| < 2.0 | Básico | Solo las ceremonias marcadas como críticas (las mínimas para gobernar) |
| 2.0–3.0 | Estándar | Ceremonias filtradas por tier de madurez |
| > 3.0 | Completo | Catálogo SAFe completo con todos los eventos |

**3 niveles de gobierno:**

| Nivel | Cadencia | Color | Participantes tipo |
|---|---|---|---|
| **Equipo** | Quincenal (sprint) | Verde | Product Owner IA, Tech Lead, equipo de proyecto |
| **Programa** | Mensual | Azul | CITO, PMO, responsables de área con casos de uso activos |
| **Dirección** | Trimestral | Ámbar | CEO, CFO, CDO, Comité de Dirección |

Para cada evento/ceremonia se muestra:
- Nombre y subtítulo
- Frecuencia y duración estimada
- Quién lo lidera (cargo)
- Quién asiste
- Qué datos se revisan (referencia a herramientas T1–T12)
- Puntos de agenda tipo
- KPIs que se miden en ese evento

**Matriz de decisiones:** Para cada tipo de decisión que aparece en el gobierno IA (ej. "Escalar un piloto a producción", "Aprobar un nuevo caso de uso", "Pausar una iniciativa por riesgo"):
- Qué desencadena la decisión
- Qué se decide exactamente
- Quién decide
- Quién valida
- A quién escalar si no hay consenso
- En cuánto tiempo debe resolverse

**Objetivos por fase del sprint:** Para cada una de las 5 fases del modelo L.E.A.N. (Listen, Enable, Accelerate, Normalize, Scale), qué objetivos concretos deben alcanzarse, qué eventos son clave y qué datos se necesitan.

---

### T12 — ISO 42001 ASSESSMENT (`/t12`)

**Quién la usa:** Consultor Alpha + responsable de calidad / compliance del cliente.
**Cuándo:** Fase Normalize. Cuando el cliente quiere avanzar hacia certificación.
**Para qué:** Evaluación formal y completa de la norma ISO/IEC 42001 (Sistema de Gestión de IA). Extiende el checklist parcial de T6 a la evaluación exhaustiva.

**Diferencia entre T6 y T12:**
- T6 → 14 controles clave como parte del output de governance del sprint
- T12 → Evaluación completa de todos los controles, con evidencias formales y orientación a certificación

**Cómo funciona:**
- El consultor revisa cada control de la norma por cláusula (4 → 10)
- Marca el estado: No iniciado / En progreso / Implementado
- Añade evidencias textuales para los controles implementados
- El progreso se visualiza por cláusula y en global
- Al completar la evaluación, el cliente tiene el gap analysis necesario para iniciar el proceso de certificación

---

### PANEL DE ADMINISTRACIÓN (`/admin`)

**Acceso exclusivo:** Solo usuarios con rol `superadmin` (Carlos).

**Tab Empresas:**
- Crear nueva empresa cliente: campo de nombre → auto-genera slug.
- Ver listado de todas las empresas registradas con nombre y slug.

**Tab Usuarios:**
- Formulario de invitación: nombre completo, email corporativo, empresa (selector), rol (selector con 4 opciones y descripción de cada una).
- Listado de todos los usuarios filtrable por rol y empresa.
- Badge visual de rol con color por nivel.
- **Estado actual:** El envío de invitación está mockeado. Los datos se registran en consola pero no se envía email real. Pendiente de activar Edge Function.

**Tab Proyectos:**
- Crear proyecto: nombre + empresa (opcional). Usa la función SQL `create_project` para resolver permisos RLS.
- Listado de proyectos activos con empresa asociada y fase actual.

---

## 5. RELACIONES ENTRE PANTALLAS — FLUJO DE DATOS

El siguiente diagrama muestra qué datos fluyen de qué herramienta a cuál:

```
CompanyProfile ──── sector, tamaño, objetivo IA ──────────────────► Todos los LLM
                                                                     (política, mensajes, recomendaciones)

T1 Maturity Radar ─── score promedio (0–4) ──────────────────────► T11 (adapta cadencia)
                  └── radar dimensions ──────────────────────────► T10 (KPI madurez)
                                                                  ► Prompts LLM globales

T2 Stakeholders ──── arquetipos + resistencia ───────────────────► T7 (curva de Rogers)
                 └── shadow AI tools ─────────────────────────► T6/T10 (riesgo shadow AI)
                 └── stakeholder list ────────────────────────► T4 (taller de scoring)
                                                               ► T8 (mensajes por arquetipo)
                                                               ► T10 (KPI adopción)

T3 Value Streams ─── procesos con oportunidad alta ──────────────► T4 (importar como caso de uso)

T4 Use Cases ────── clasificaciones AI Act ──────────────────────► T6 (dashboard regulatorio)
             ├──── casos con decisión Go ────────────────────────► T9 (importar al Gantt)
             ├──── portfolio + ahorro anual ─────────────────────► T10 (KPI portfolio)
             └──── categorías IA ────────────────────────────────► T5 (Canvas de dominios)

T5 Canvas ────────── dominios activos + governance ──────────────► T6 (auto-inferencia ISO 42001)

T6 ISO 42001 ────────────────────────────────────────────────────► T12 (evaluación completa)

T11 Operating Rhythm ─── tier de madurez + eventos críticos ────► T10 (KPI governance)
```

**Resumen del flujo completo:**
1. **CompanyProfile** → contexto base para todo
2. **T1** → madurez (diagnóstico de dónde está la organización)
3. **T2** → personas (quién apoya, quién bloquea)
4. **T3** → procesos (qué se puede mejorar con IA)
5. **T4** → decisiones (qué implementar, en qué orden, con qué ROI)
6. **T5** → arquitectura (qué tipo de IA desplegar primero)
7. **T6** → governance (política, regulación, ISO)
8. **T7** → adopción (cómo mover a la organización)
9. **T8** → comunicación (qué decirle a quién)
10. **T9** → plan (cuándo y quién implementa cada cosa)
11. **T10** → visión ejecutiva (estado del programa en tiempo real)
12. **T11** → operaciones (cómo gobernar el programa a largo plazo)
13. **T12** → certificación (evidencia formal de compliance ISO)

---

## 6. GRÁFICOS — GUÍA DE INTERPRETACIÓN

### Radar Chart (T1 — AI Maturity Radar)

**Qué es:** Gráfico de araña con 6 ejes, uno por dimensión de madurez.
**Cómo leerlo:**
- Cada eje va de 0 (centro) a 4 (extremo).
- El área coloreada es el área de madurez actual.
- Las dimensiones donde el polígono está más cerca del centro son los gaps prioritarios.
- Una forma equilibrada = madurez balanceada. Una forma muy asimétrica = desequilibrio que hay que corregir.
- **Benchmark orientativo:** Una empresa "lista para IA" tiene score ≥ 2.5 en todas las dimensiones. Una empresa que puede escalar IA tiene score ≥ 3.5 en Datos y Tecnología.

### Quadrant Chart (T2 — Stakeholder Matrix)

**Qué es:** Scatter plot con influencia (eje Y) vs. adopción (eje X).
**Cómo leerlo:**
- Cuadrante superior derecho: perfiles de máxima palanca (alta influencia + alta adopción). Prioridad 1: hacerlos sponsors.
- Cuadrante superior izquierdo: riesgo de bloqueo por influencia (alta influencia + baja adopción). Prioridad 1: gestionar activamente.
- Cuadrante inferior derecho: aliados de implementación sin mucha influencia organizacional.
- Cuadrante inferior izquierdo: bajo impacto en la dinámica del proyecto.

### Campana de Rogers (T7 — Adoption Heatmap)

**Qué es:** Curva de distribución normal que muestra cómo se distribuye la adopción en la organización.
**Cómo leerlo:**
- El "chasm" (abismo) se encuentra entre Early Adopters y Early Majority. La mayoría de programas IA mueren aquí.
- Una distribución muy cargada hacia la derecha (Late Majority + Laggards) indica que el proyecto necesita más tiempo y recursos de change management antes de escalar.
- Si hay pocas personas en Innovators/Early Adopters, hay que identificar activamente a los embajadores internos antes de lanzar el piloto.

### Gantt de 6 meses (T9 — AI Roadmap)

**Qué es:** Diagrama de barras horizontales por iniciativa y mes de ejecución.
**Cómo leerlo:**
- La longitud de la barra = duración estimada de la iniciativa.
- El color de la barra = nivel de riesgo AI Act (rojo = alto, ámbar = limitado, verde = mínimo/sin clasificar).
- Las barras superpuestas en los primeros meses = posible sobrecarga del equipo de implementación.
- Las iniciativas sin barra asignada = pendientes de planificación.

### Dashboard KPIs (T10 — AI Value Dashboard)

**Qué son:** Tarjetas de métricas con valores actuales y tendencia.
**Cómo leerlos:**
- Score de madurez 0–4: referencia directa al resultado de T1. Un 2.5 es el umbral de "organización con IA operativa".
- Ahorro anual: suma de todos los ROI calculados en T4. Es un número de potencial, no de retorno confirmado. El cliente lo usa para justificar internamente la inversión.
- Ratio early adopters: si está por debajo del 30%, el programa tiene riesgo de adopción. Si supera el 50%, tiene masa crítica para autosostenerse.

---

## 7. MODO DEMO — USO COMERCIAL

Cuando `VITE_DEMO_ENABLED=true`, la plataforma activa el modo demo para presentaciones comerciales con prospects.

**El selector de escenario** aparece en T10 y permite cambiar entre 5 patrones de disfunción empresarial:

| Patrón | Empresa ficticia | Pain de demostración |
|---|---|---|
| **Vendor Sprawl** | Empresa industrial | "Tenéis 23 contratos de IA en 8 departamentos que nadie coordina" |
| **Pilot Chaos** | Empresa de servicios | "7 pilotos activos y ninguno llegará a producción este año" |
| **Change Resistance** | Empresa de distribución | "La tecnología puede. La cultura no." |
| **Data Visibility** | Empresa retail | "IA activa pero sin saber si genera valor real" |
| **Slow Decisions** | Empresa financiera | "Los procesos de aprobación de IA duran más que el piloto mismo" |

Al seleccionar un escenario, toda la plataforma se actualiza con los datos ficticio del mismo: el radar de T1 adopta la "firma visual" del patrón, el dashboard T10 muestra los KPIs del escenario, y las fases del Metro Map reflejan dónde está ese cliente ficticio en su sprint.

**Para el consultor:** Esto permite hacer una demo completamente guionizada en 20–30 minutos, mostrando exactamente el dolor que el prospect reconoce en su propia empresa, con datos que lo cuantifican.

**El modo demo NO persiste nada en la base de datos.** Todos los cambios se hacen en memoria local. Al cambiar de escenario o recargar la página, los datos vuelven al estado original del fixture.

---

*Documento generado el 2026-05-22. Complementa `TECHNICAL_SPEC.md`. Referencia el código fuente en rama `main` en esa fecha.*
