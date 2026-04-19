# IMPACTOS CRUZADOS — L.E.A.N. AI System

Documento vivo de gestión transversal. Cada decisión del proyecto genera ondas en múltiples áreas simultáneas. Este documento las captura y prioriza para que ninguna se pierda.

Última actualización: 2026-04-19
Propietario: Carlos Sánchez
Revisión: al cierre de cada sprint o cuando aparezca una decisión mayor

---

## Cómo usar este documento

1. **Lectura semanal** (15 min): Carlos revisa la columna "Próxima acción" de cada área. Identifica lo que puede ejecutar esta semana.
2. **Actualización por sprint**: al cerrar un sprint, las acciones completadas se marcan ✓ y se añaden las nuevas que el sprint haya generado.
3. **Priorización por urgencia × impacto**:
   - 🔴 **Crítico** — bloquea ventas, riesgo operativo o compromiso contractual.
   - 🟡 **Importante** — acelera ventas o reduce riesgo pero no bloquea.
   - 🟢 **Oportunidad** — aumenta diferencial pero tolera retraso.

---

## Índice de áreas

1. [PRICING](#1-pricing) — modelo de precios, rentabilidad, benchmarking
2. [VENTAS](#2-ventas) — funnel, mensajes, objeciones, materiales
3. [POSICIONAMIENTO](#3-posicionamiento) — narrativa de marca, diferenciación, mensajes por arquetipo
4. [OPERACIONES](#4-operaciones) — delivery, escalabilidad, procesos internos, riesgos operativos
5. [CONTENIDO Y REDES SOCIALES](#5-contenido-y-redes-sociales) — LinkedIn, whitepapers, thought leadership
6. [PRODUCTO](#6-producto) — evolución de la metodología y herramientas
7. [MERCADO](#7-mercado) — tendencias, competencia, segmentación

---

## 1. PRICING

### 1.1 Decisiones Sprint 0 con impacto en pricing

| Decisión origen | Impacto en pricing | Prioridad |
|---|---|---|
| D3 Multi-tenancy RLS con ruta a esquema/instancia | Permite pricing por tiers: **Basic** (RLS compartido) / **Premium** (esquema separado) / **Enterprise** (instancia dedicada) | 🟡 |
| D7 MFA universal + login formal | Argumento "security-by-design" sostiene pricing enterprise | 🟡 |
| D9 Sistema de diseño premium (Apple+Whoop) | Diferencia visual vs. consultoras con entregables PPT → sostiene pricing superior a Big4/mid-market en rango comparable | 🟡 |
| D8 Contratos de datos con snapshot versionado | Argumento "trazabilidad auditable ISO 42001" justifica fee de certificación posterior | 🟢 |
| Pregunta debate — ISO 42001 como Fase 2 (respuesta: opción C) | Abre **segunda venta** tras engagement base. Pricing separable: fase 1 (metodología 6M) + fase 2 (ISO ready, 3M adicionales) | 🔴 |
| Vía C — formación/certificación de PMs internos | Tercera línea de ingresos con pricing distinto (curso + examen + recurrencia por PM certificado) | 🟡 |
| Plan ruta open-source en 12-18 meses | Decisión pricing "core open + enterprise paid" a validar con datos de mercado | 🟢 |

### 1.2 Decisiones de pricing pendientes

- 🔴 **Fee del engagement base de 6 meses** — bloqueante para cerrar ventas. Sin esto Óscar no puede hacer outreach comercial con precio.
- 🔴 **Estructura fija vs. variable** — fee fijo de metodología + variable ligado a ROI de casos priorizados (QW3) es una hipótesis a evaluar.
- 🟡 **Pricing de Fase 2 ISO 42001** — definir al cerrar Sprint 2 (cuando T6 esté funcional y se pueda mostrar el camino real a ISO).
- 🟡 **Pricing de SaaS asistido por PM** — fee de setup + mensualidad + fee de formación/certificación del PM. Definir al cerrar Sprint 3.
- 🟡 **Pricing Vendor Management / Data Journey como ancla** — evaluar si se venden como "módulos" del engagement IA o como servicios independientes.

### 1.3 Costes de infraestructura (input al cálculo de rentabilidad)

| Recurso | Coste MVP (mes 1-6) | Coste escalado (10+ clientes) |
|---|---|---|
| Supabase (2 proyectos) | 0 € (Free tier) | 50 €/mes (2× Pro $25) |
| Vercel | 0 € (Hobby) | 20 €/mes (Pro) |
| GitHub | 0 € (privado gratis) | 0 €/mes (privado ilimitado con cuentas free) |
| Dominio | ~12 €/año (ya tienes consultoriaalpha.com) | ~12 €/año |
| Inter (tipografía) | 0 € (OFL) | 0 € |
| lucide-react, todas las libs | 0 € (open source) | 0 € |
| Backup S3 externo (post-MVP) | 0 € | ~5 €/mes (50GB) |
| **Total infra mensual** | **~1 €** | **~75 €** |

**Lectura para pricing:** el coste de infra es marginal. El coste real es tu tiempo y el de Claude. Esto libera el pricing de "coste de producto" y lo alinea con **valor percibido por el cliente** (la forma correcta de pricing en consultoría premium).

### 1.4 Próxima acción pricing

**🔴 Abrir chat `[PRICING]`** con estos inputs listos:
- Benchmarks de Big4 para proyectos de adopción IA (buscar datos públicos de rates).
- Benchmark de freelances IA en España (LinkedIn/Malt).
- Benchmark de aceleradoras IA corporativas (Zinkwork, Startupbootcamp, aceleradoras sectoriales).
- Coste hora real tuyo + Óscar (para ratios de rentabilidad mínima).

---

## 2. VENTAS

### 2.1 Decisiones Sprint 0 con impacto en ventas

| Decisión origen | Impacto en ventas | Prioridad |
|---|---|---|
| D9 Sistema de diseño premium | **Diferencial visual inmediato en demos**. Nadie en competencia directa entrega con estética "product premium" | 🔴 |
| D7 MFA universal | **Argumento "security-by-design"** para CIOs: NIS2, AI Act art. 13-14, ISO 27001. Bullet obligatorio en pitch deck | 🔴 |
| D8 Snapshot con versionado | Argumento "tu CIO tiene control, no caos" — diferencial vs. herramientas IA que cambian dato por detrás | 🟡 |
| Vercel preview URLs | Permite **mostrar al cliente el producto evolucionando** en tiempo real — efecto "involucrado desde el día 1" | 🟡 |
| Ruta ISO 42001 = Opción C | **Land and expand**: fase 1 (6M) cierra contrato + prepara camino; fase 2 (3M) certificación | 🔴 |
| T10 Dashboard con "número hero" | Formato **llevable a Comité de Dirección** sin retoque manual. Argumento: "llevas tu avance al Consejo cada trimestre" | 🟡 |
| QW4 Licence Waste Report | **Gancho comercial de primer valor** — ataca fricción "coste > valor" reportada por Javier y Pep | 🔴 |
| QW1 Executive Briefing Pack | Entregable en 48h tras 3 entrevistas — rompe la objeción "las consultoras tardan meses" | 🔴 |
| Opción C del horizonte (velocidad récord) | Permite cerrar ventas **mientras se construye**. Primer cliente puede firmar sin el ecosistema completo | 🟡 |

### 2.2 Argumentos de venta nuevos a incorporar

1. **"Metodología + producto, no consultoría pura"** — las 13 herramientas son un activo tangible que queda en el cliente al cerrar el engagement.
2. **"Security by design"** — MFA obligatorio, RLS multi-tenant, auditoría de versiones. Alineado con NIS2 (transposición española vigente) y AI Act.
3. **"Time-to-first-value en semanas, no meses"** — QW1 en 48h tras 3 entrevistas. QW4 en semana 2-3.
4. **"Preparación a ISO 42001 incluida"** — no es coste extra ni servicio separado, es resultado natural.
5. **"Doble modo: consultoría asistida o SaaS con PM interno formado"** — opciones según madurez del cliente.
6. **"Entregables visualmente premium"** — llevables directamente al Consejo de Administración sin retoque.

### 2.3 Materiales comerciales a generar/actualizar

| Material | Estado | Prioridad | Responsable sugerido |
|---|---|---|---|
| Pitch deck v2 (con paleta metálica nueva) | Pendiente refresh | 🔴 | Chat [POSICIONAMIENTO] + [CONTENIDO] |
| One-pager metodología L.E.A.N. | Pendiente | 🔴 | Chat [POSICIONAMIENTO] |
| Objection handling playbook (basado en Voss) | Pendiente | 🟡 | Chat [VENTAS] |
| Battle card vs. Big4 | Pendiente | 🟡 | Chat [VENTAS] |
| Battle card vs. freelances IA | Pendiente | 🟢 | Chat [VENTAS] |
| Caso de uso QW4 (anonimizado Javier+Susana) | Tras demo | 🟡 | Chat [CONTENIDO] |
| Demo script para Óscar (10-15 min en LinkedIn calls) | Pendiente | 🔴 | Chat [VENTAS] |

### 2.4 Demos inmediatas a preparar

- **Javier (Madison) + Susana — demo QW4 Licence Waste.** Incluir cuestionario post-demo con pregunta explícita sobre percepción del diseño: *"¿Te transmite la herramienta claridad y rigor, o complejidad?"*. Hipótesis a validar.
- **Pep (Suara)** — seguimiento tras entrevista inicial. Evaluar si está listo para demo QW4.

### 2.5 Próxima acción ventas

**🔴 Refresh urgente del pitch deck con paleta metálica nueva.** El sistema de diseño D9 y el branding antiguo (negro/blanco/gris) son incompatibles. Cualquier material comercial que se entregue con la paleta antigua diluye el posicionamiento.

---

## 3. POSICIONAMIENTO

### 3.1 Evolución de la narrativa de marca

**Antes de Sprint 0 (abril 2026):**
> "Metodología propietaria para adopción de IA en empresas"

**Después de Sprint 0 (versión larga):**
> "Metodología + ecosistema de 13 herramientas conectadas que lleva a tu empresa del diagnóstico de madurez IA a la certificación ISO 42001 en 6 meses, con entregables llevables al Consejo desde la semana 2."

**Versión corta para LinkedIn / CEO (confirmada 2026-04-19):**
> "Alpha Consulting está desarrollando un nuevo método acompañado de un software que rompe paradigmas y aporta valor diferencial a las empresas."

**Versión gancho para CEO (propuesta a validar):**
> "El método que convierte la IA en ventaja competitiva medible en 6 meses."

Elementos nuevos que la narrativa debe incorporar:
- **Ecosistema** (no herramientas sueltas) — las 13 están conectadas por contratos de datos explícitos.
- **Ritmo** — 6 meses + preparación ISO como fase 2.
- **Time-to-first-value** — quick wins en semanas, no meses.
- **Premium by design** — diseño como diferencial frente a Big4/mid-market.
- **Dual mode** — consultor Alpha (vía A) o PM interno formado (vía B).

### 3.2 Impactos del sistema de diseño (D9) en posicionamiento

| Elemento | Mensaje derivado |
|---|---|
| Paleta metálica (plata/navy) | "Premium, no corporativo genérico" |
| Inter + pesos calibrados | "Rigor tipográfico = rigor metodológico" |
| Light default + dark opcional | "Producto que respeta al usuario, no impone" |
| 12px radius + líneas finas | "Claridad visual = claridad de decisión" |
| Paleta pastel funcional | "Suavidad en el dato, no alarma innecesaria" |

**Impacto en [CONTENIDO]:** todos los posts de LinkedIn, PDFs descargables, whitepapers deben adoptar esta paleta. La coherencia visual entre producto y comunicación es en sí misma un argumento de posicionamiento.

### 3.3 Mensajes clave por arquetipo de comprador

**Scope ampliado 2026-04-19:** se incorpora **CEO** como arquetipo comprador prioritario (decisión Carlos para narrativa LinkedIn). Esto cambia el orden de prioridad de los mensajes.

| Arquetipo | Mensaje gancho | Referente visual que conecta | Prioridad |
|---|---|---|---|
| **CEO** | "Un nuevo paradigma para que tu empresa convierta la IA en ventaja competitiva, no en coste IT" | T9 Roadmap 6M (visión) + T10 Dashboard (resultado) | 🔴 NUEVO |
| **CIO** | "Del Shadow AI descontrolado a un AIMS auditable en 6 meses" | Dashboard T10 + Scan QW2 | 🔴 |
| **COO** | "Tu rotación de licencias IA ajustada al uso real, sin esperar a renovación anual" | QW4 Licence Waste | 🟡 |
| **Dirección General** | "IA integrada en el Comité como KPI, no como proyecto IT" | T9 Roadmap 6M + T11 Operating Rhythm | 🟡 |
| **CFO** | "ROI calculado por caso de uso antes de invertir" | T4 Use Case Prioritization con cuadrante ROI | 🟡 |
| **Compliance Officer** | "AI Act + ISO 42001 preparados sin trabajo manual paralelo" | T6 + T13 con mapping al 78% | 🟢 |

**Implicación crítica de añadir CEO como comprador prioritario:**
- CEOs no compran "adopción IA", compran **ventaja competitiva, transformación o supervivencia frente a competidores**.
- Su tiempo es ×5 más escaso que el de un CIO. Materiales comerciales para CEO deben caber en **una página + 3 minutos de pitch verbal**.
- Pricing tiende a ser **insensible al precio si el outcome es estratégico**. Esto sostiene fees superiores a los del segmento CIO/COO.
- Ciclo de venta más corto (decisión rápida) pero con más demanda de **referencias de pares CEOs** ("¿qué empresa similar a la mía ya lo está haciendo?").
- **Riesgo:** vender a CEO sin tener primer caso CEO ya cerrado es muy difícil. Los CEOs siguen a otros CEOs.
- **Implicación para [VENTAS] y [POSICIONAMIENTO]:** se necesita material comercial específico tipo "CEO brief" (1 página) además del pitch deck completo.

### 3.4 Posicionamiento vs. competencia

| Competencia | Cómo se posicionan | Nuestra contra-posición |
|---|---|---|
| Big4 (Deloitte, EY, PWC, KPMG) | Generalistas, entregables en PPT, precio alto, equipos grandes | "Metodología propietaria + producto premium, equipo pequeño y técnico, precio comparable con entregable superior" |
| Mid-market (Everis/NTT Data, Minsait, Altran) | IT-heavy, implementación, custom code | "Metodología testada antes de código custom, ROI estimado pre-inversión" |
| Freelances IA | Baratos, sin metodología, sin garantías | "Metodología replicable + equipo + certificación preparada" |
| Aceleradoras IA corporativas | Programas de 12-16 semanas tipo "bootcamp" | "Ecosistema permanente, no programa cerrado. Queda el producto en la empresa" |
| Herramientas Jira/Monday/ServiceNow | Framework genéricos agnósticos al dominio IA | "Especializado en IA enterprise, no adaptación forzada de un framework general" |

### 3.5 Próxima acción posicionamiento

**🔴 Definir el tagline definitivo** en chat [POSICIONAMIENTO]. Hipótesis de partida: *"De Shadow AI a AIMS auditable en 6 meses"*. Testear contra 2-3 alternativas con Óscar.

---

## 4. OPERACIONES

### 4.1 Riesgos operativos críticos identificados

| # | Riesgo | Origen | Mitigación | Prioridad |
|---|---|---|---|---|
| O1 | **Carlos como único superadmin** (Óscar saturado) — pérdida de acceso = pérdida de control total | Decisión 2026-04-19 | Recovery codes MFA offline + gestor de contraseñas robusto + revisar en 3 meses si Óscar entra | 🔴 |
| O2 | Migraciones SQL manuales con error humano en prod | D5 | Ejecutar siempre primero en dev + backup previo + rollback SQL documentado | 🔴 |
| O3 | Pérdida de contexto entre chats especializados | Estructura multi-chat | Documentos vivos (ARQUITECTURA, DECISIONES, BACKLOG, este) como source of truth leído al arrancar cada chat | 🟡 |
| O4 | Sistema de diseño se rompe con consultor externo | Modelo A (Claude guardian) | Storybook como validador automático + PR review obligatorio | 🟡 |
| O5 | Backup de BBDD no existe aún | No planificado en MVP | Programar `pg_dump` semanal a almacenamiento externo al cerrar Sprint 1 | 🟡 |
| O6 | Carlos sin capacidad de debugear si Claude no responde | Claude escribe 98% del código | Documentar workflow de "emergencia": cómo contactar soporte Vercel/Supabase desde cero | 🟢 |

### 4.2 Procesos operativos a establecer

| Proceso | Cuándo se establece | Herramienta |
|---|---|---|
| Revisión semanal de este documento (IMPACTOS_CRUZADOS) | Ya — desde esta semana | Carlos, 15 min/semana |
| Backup pg_dump semanal | Sprint 1 fin | Edge Function de Supabase + S3 externo |
| Monitoring de errores en prod | Sprint 2 | Sentry (plan gratis suficiente para MVP) |
| Registro de feedback de clientes | Ya | Tabla Supabase `client_feedback` + template en entrevistas |
| Revisión trimestral de decisiones de arquitectura | Cada 3 meses | Releer DECISIONES_ESTRATEGICAS + cuestionar si sigue válido |

### 4.3 Capacidad y escalabilidad del delivery

**Capacidad actual (abril 2026):**
- 1 consultor estratégico (Carlos) + Claude como co-arquitecto.
- 1 comercial (Óscar, saturado).
- Máximo 2-3 engagements concurrentes con calidad razonable.

**Implicación:** el modelo actual no escala más allá de 3-5 clientes activos sin contratar consultores o activar vía B (PM cliente formado) o vía C (formación/certificación para PMs externos).

**Decisión operativa pendiente:** ¿cuándo contratar al primer consultor adicional? Recomendación basada en datos: cuando el pipeline tenga **2 clientes firmados + 3 qualified leads** simultáneamente. Sin esa demanda visible, contratar es riesgo de caja.

### 4.4 Próxima acción operaciones

**🔴 Generar los recovery codes de MFA** al activarlo en Supabase y GitHub, guardarlos en lugar seguro offline. **Esta semana**, no el mes que viene.

---

## 5. CONTENIDO Y REDES SOCIALES

### 5.1 Oportunidades de contenido generadas por Sprint 0

| Contenido | Formato | Audiencia | Momento de publicación |
|---|---|---|---|
| "Cómo Alpha está redefiniendo la adopción de IA en empresas" — serie metodológica | LinkedIn post serie (6-8 posts) | CIOs, COOs, **CEOs**, Dirección General | Semanalmente desde Sprint 0.5 |
| "Shadow AI: el 60% de tu plantilla ya usa IA sin tu conocimiento" | Whitepaper 4-6 páginas | CIOs, Compliance | Tras Sprint 2 (QW2 funcional) |
| "El 40% de las licencias de IA en empresas están sin uso" (con datos anonimizados Javier+Pep) | LinkedIn post + carrusel | COOs, CFOs | Tras demo Javier+Susana |
| "AI Act + ISO 42001 en 6 meses: guía práctica" | Whitepaper 10+ páginas | CIOs, Compliance | Tras Sprint 4 (T13 funcional) |
| Screenshots del producto con Apple-style | LinkedIn carrusel visual | General profesional | Desde Sprint 1 |
| ~~"¿Por qué elegí React + Supabase para construir un SaaS enterprise sin ser developer?"~~ **DESCARTADO 2026-04-19** — incompatible con narrativa corporativa de Alpha | — | — | — |

### 5.2 Voces y canales

| Voz | Canal | Frecuencia sugerida |
|---|---|---|
| Carlos — técnico/metodológico | LinkedIn personal | 2-3 posts/semana |
| Óscar — comercial/relacional | LinkedIn personal | 1-2 posts/semana (menos técnicos, más de casos) |
| Alpha Consulting (corporativo) | LinkedIn company + web | 1 post/semana agregando ambas voces |

### 5.3 Coherencia visual

**Todos** los materiales visuales (infografías, carruseles, thumbnails de whitepapers, banners web) deben usar la paleta D9:
- Fondo: blanco/negro (según contexto)
- Acentos: plata metálico o azul marino metálico
- Tipografía: Inter (free, self-hosted en tu web si procede)
- Pastel funcional solo para gráficos/datos dentro del material

**Impacto en [OPERACIONES]:** plantillas de Canva/Figma/Keynote a refresh con paleta nueva antes de publicar contenido nuevo.

### 5.4 Narrativa de Alpha en LinkedIn (decidida 2026-04-19)

**Ángulo confirmado por Carlos:** *"Alpha Consulting está desarrollando un nuevo método acompañado de un software que rompe paradigmas y aporta valor diferencial a las empresas."*

**Lo que esto SÍ es:**
- Narrativa **corporativa** (Alpha como sujeto), no personal de Carlos como constructor.
- Énfasis en el **método** (innovación metodológica) + **software como acompañamiento** (no al revés).
- Tono de **autoría intelectual** ("creador de un método"), no de artesanía visible ("yo construyo esto con IA").
- Foco en **ruptura de paradigma y valor diferencial**, no en transparencia del proceso.

**Lo que esto NO es (descartado explícitamente):**
- NO narrativa "COO no-dev construyendo SaaS con IA" → descartada por Carlos. Riesgo: expone que no hay equipo técnico detrás, lo cual puede restar autoridad frente a CIOs/CEOs enterprise.
- NO transparencia del "behind the scenes" → el producto debe aparecer como fruto del método, no como artesanía en construcción.

**Reglas de contenido derivadas:**
1. Sujeto principal del discurso = **Alpha Consulting** o **el método L.E.A.N.**, no Carlos personalmente.
2. Posts de Carlos firman como **Carlos Sánchez, co-fundador de Alpha Consulting**, no como "COO".
3. Claude, Cursor, IA-asistencia, stack técnico → **nunca mencionados públicamente en LinkedIn**. Son herramientas internas.
4. El método como protagonista: siempre que se habla del software, se habla de él como **manifestación tangible del método**.
5. Los datos/casos/aprendizajes se comparten como **observaciones de Alpha**, no como diario de Carlos.

### 5.5 Próxima acción contenido

**🟡 Primer post LinkedIn de la serie** — "Por qué estoy construyendo un SaaS siendo COO no-developer, y qué acabo de decidir sobre mi stack". Esta semana o próxima, tras cerrar Sprint 0.5.

---

## 6. PRODUCTO

### 6.1 Implicaciones de D8 (contratos de datos) en el roadmap

| Herramienta | Implicación de producto |
|---|---|
| T2 (rediseño desde cero) | Retraso controlado de ~2 días en Sprint 1 pero evita deuda técnica en nodo central del grafo |
| T4 (nodo más central) | Requiere robustez máxima y tests exhaustivos. Es el "cerebro" del ecosistema |
| T13 (ISO 42001) | Solo viable al cerrar Sprint 4. **Producto sin T13 = producto sin ISO 42001 funcional.** Posicionamiento debe reflejarlo (→ fase 2) |
| T10 Dashboard | Único caso híbrido consumidor+productor. Requiere UX específica para `tracking_update[]` editables |

### 6.2 Quick wins como motor de ventas

Los 8 quick wins están priorizados por fase. Cada uno es un argumento comercial autónomo:

| QW | Fase | Gancho comercial principal | Madurez |
|---|---|---|---|
| QW1 — Executive Briefing Pack | L | "Resultados visibles en 48h" | Sprint 1 |
| QW2 — Shadow AI Scan | E | "Descubre quién usa IA sin tu permiso" | Sprint 2 |
| QW3 — Top 5 ROI | E | "5 casos con ROI antes de invertir 1€" | Sprint 2 |
| QW4 — Licence Waste | E | "Recupera X€ en licencias no usadas" | Sprint 2 |
| QW5 — Piloto simbólico | A | "Tu primer piloto en el mes 3, no en el 6" | Sprint 3 |
| QW6 — Comunicación auto-gen | A | "Kit de Comité listo sin escribir una diapo" | Sprint 3 |
| QW7 — Dashboard vivo | N | "KPIs de IA en el Comité cada mes" | Sprint 4 |
| QW8 — Backlog post-sprint | N | "Continuidad garantizada al cerrar el proyecto" | Sprint 4 |

### 6.3 Decisiones de producto pendientes

- 🟡 Modo SaaS asistido (vía B) — UX específica para PM cliente sin consultor presente. Sprint 3+.
- 🟡 Motor IA dinámico (Sprint 5) — elección de proveedor LLM (Claude API, OpenAI, Azure OpenAI). Datos de coste comparativos antes de decidir.
- 🟡 Formación/certificación de PMs (vía C) — definir currículo, método de examen, duración, recurrencia. Sprint 6.
- 🟢 Open source del core en 12-18 meses — decisión diferida.

### 6.4 Próxima acción producto

**🔴 Validar en la demo Javier+Susana** las hipótesis clave:
- ¿QW4 es realmente el gancho más potente? (vs. QW1, QW3)
- ¿El diseño premium refuerza o distrae?
- ¿El ritmo de 6 meses se percibe corto, justo o largo?

Incorporar las respuestas al backlog del Sprint 2.

---

## 7. MERCADO

### 7.1 Hipótesis de mercado a validar

| Hipótesis | Origen | Cómo validar | Prioridad |
|---|---|---|---|
| El "coste > valor" percibido es la fricción #1 de adopción IA en mid-market español | Entrevistas Javier + Pep | 5+ entrevistas adicionales con CIOs de empresas 200-2.000 empleados | 🔴 |
| CIOs perciben el diseño premium como "rigor", no como "caro" | Intuición + refs Apple/Whoop | Pregunta explícita en cuestionarios post-demo | 🔴 |
| El time-to-first-value <30 días rompe la objeción "ya tenemos proyecto interno" | Hipótesis estratégica | QW1 en demos reales + medir si acelera cierre | 🟡 |
| ISO 42001 será requisito de facto en RFPs de enterprise españolas en 12-18 meses | Tendencia regulatoria (AI Act aprobado 2024) | Monitorizar RFPs públicas + encuestas a CIOs sobre planes compliance | 🟡 |
| El modelo dual (consultor + SaaS asistido) cubre más del 80% del mid-market | Inferencia estratégica | Testear con 2-3 clientes friendly en Sprint 6 | 🟢 |

### 7.2 Competencia a monitorizar

- **Consultoras IA especializadas españolas emergentes** — mapear quién aparece en LinkedIn con "adopción IA", "AI strategy consulting".
- **Proveedores ISO 42001** — primeras certificadoras españolas acreditadas.
- **Herramientas SaaS de IA governance** — Credo AI, Holistic AI, Fairly AI. Vigilar pricing, features, posicionamiento.
- **Microsoft Copilot adoption services** — Microsoft empuja fuerte; partners como Plain Concepts capturan mercado corporativo.

### 7.3 Señales de mercado a captar sistemáticamente

Crear tabla `client_feedback` en Supabase (Sprint 1) con campos:
- Fecha, cliente, perspectiva (CIO/COO/otros), canal (entrevista/demo/referral).
- Fricción principal reportada.
- Valoración percibida del MVP.
- Precio que pagarían (open text + rango sugerido).
- Intent signals (próximos 3, 6, 12 meses).

Esta tabla alimenta decisiones futuras de pricing, producto y posicionamiento.

### 7.4 Próxima acción mercado

**🟡 Diseñar cuestionario estructurado** para entrevistas con CIOs en chat [MERCADO]. Objetivo: 5 entrevistas adicionales en próximos 2 meses para validar hipótesis #1 y #2.

---

## Resumen ejecutivo — acciones 🔴 esta semana

1. **[OPERACIONES]** Generar recovery codes MFA al activar en Supabase/GitHub y guardarlos offline.
2. **[PRICING]** Abrir chat [PRICING] con benchmarks Big4 / freelances / aceleradoras como inputs.
3. **[VENTAS]** Refresh pitch deck con paleta metálica D9 (eliminar cualquier material con branding gris antiguo).
4. **[POSICIONAMIENTO]** Definir tagline definitivo. Hipótesis de partida: "De Shadow AI a AIMS auditable en 6 meses".
5. **[VENTAS]** Preparar demo Javier+Susana con cuestionario post-demo explícito sobre percepción del diseño.
6. **[ARQUITECTURA]** Crear 2 proyectos Supabase (eu-west-3) y abrir chat Sprint 0.5 para arrancar.

---

## Resumen ejecutivo — acciones 🟡 próximas 4-6 semanas

1. **[CONTENIDO]** Primer post LinkedIn de la serie "COO construyendo SaaS enterprise con IA".
2. **[OPERACIONES]** Backup pg_dump semanal automatizado al cerrar Sprint 1.
3. **[MERCADO]** Cuestionario estructurado de entrevistas CIO + 5 entrevistas en pipeline.
4. **[PRODUCTO]** Incorporar respuestas de la demo Javier+Susana al backlog Sprint 2.
5. **[VENTAS]** One-pager + battle card vs. Big4.

---

## Mantenimiento del documento

- **Frecuencia de revisión**: semanal (15 min).
- **Actualización obligatoria**: al cerrar cada sprint.
- **Propietario**: Carlos (con asistencia de Claude en cada chat de área cuando cierre decisiones).
- **Regla**: si una decisión en un chat genera impacto en otra área y no está listada aquí, **añadirla inmediatamente**. Este documento es la red que evita que ideas se pierdan entre chats especializados.
