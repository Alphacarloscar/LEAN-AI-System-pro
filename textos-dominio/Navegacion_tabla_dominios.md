# GOBY — Tabla de textos por dominio · Navegación y componentes comunes
> Total de textos: 71 · Generado 2026-08-31 · Pendiente de validación por Carlos
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
 
## AppLayout.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Activar modo claro" | AppLayout.tsx:49 | aria-label toggle dark mode (cuando dark=true) | (igual) | (igual) | (igual) | (igual) |
| "Activar modo oscuro" | AppLayout.tsx:49 | aria-label toggle dark mode (cuando dark=false) | (igual) | (igual) | (igual) | (igual) |
| "Cerrar sesión" (+ nombre usuario) | AppLayout.tsx:85 | title del botón logout, formato `Cerrar sesión (Nombre)` | (igual) | (igual) | (igual) | (igual) |
| "Salir" | AppLayout.tsx:97 | texto visible botón logout si no hay user.name | (igual) | (igual) | (igual) | (igual) |
| "GOBY" | AppLayout.tsx:125 | marca fija en breadcrumb de header | (igual) | (igual) | (igual) | (igual) — nombre de marca/producto, fuera de alcance de generalización de dominio |
| "Reconectando y actualizando datos…" | AppLayout.tsx:177 | banner flotante de recuperación de sesión (estado 'reconnecting') | (igual) | (igual) | (igual) | (igual) |
| "La sesión ha expirado" | AppLayout.tsx:198 | título overlay sesión expirada | (igual) | (igual) | (igual) | (igual) |
| "Tu sesión se cerró por inactividad. Vuelve a iniciar sesión para continuar. Los datos no guardados en este momento pueden haberse perdido." | AppLayout.tsx:201-202 | texto explicativo overlay sesión expirada | (igual) | (igual) | (igual) | (igual) |
| "Volver a iniciar sesión" | AppLayout.tsx:211 | botón overlay sesión expirada | (igual) | (igual) | (igual) | (igual) |
 
## AppSidebar.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "AI Readiness Assessment" (T1) | AppSidebar.tsx:26 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | "Readiness Assessment" — evaluación de preparación de la organización para cualquier iniciativa, sin acoplar a IA |
| "Stakeholder Matrix" (T2) | AppSidebar.tsx:27 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | (igual) — ya agnóstico, aplica a cualquier iniciativa |
| "Value Stream Map" (T3) | AppSidebar.tsx:28 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | (igual) — ya agnóstico |
| "Use Case Priority Board" (T4) | AppSidebar.tsx:29 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | "Initiative Priority Board" — "use case" es terminología de proyectos de IA; en gobierno genérico se prioriza "iniciativas" |
| "AI Taxonomy Canvas" (T5) | AppSidebar.tsx:30 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | "Taxonomy Canvas" — clasificación de iniciativas/soluciones, sin acoplar a IA |
| "Risk & Governance" (T6) | AppSidebar.tsx:31 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | (igual) — ya agnóstico |
| "Adoption Heatmap" (T7) | AppSidebar.tsx:32 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | (igual) — ya agnóstico |
| "Communication Map" (T8) | AppSidebar.tsx:33 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | (igual) — ya agnóstico |
| "AI Roadmap" (T9) | AppSidebar.tsx:34 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | "Roadmap" — hoja de ruta de cualquier programa de iniciativas, sin acoplar a IA |
| "AI Value Dashboard" (T10) | AppSidebar.tsx:35 | nombre herramienta en sidebar (path '/') | (igual) | (igual) | (igual) | "Value Dashboard" — panel de valor generado por el conjunto de iniciativas, sin acoplar a IA |
| "Operating Rhythm" (T11) | AppSidebar.tsx:36 | nombre herramienta en sidebar | (igual) | (igual) | (igual) | (igual) — ya agnóstico |
| "ISO 42001 Assessment" (T12) | AppSidebar.tsx:37 | nombre herramienta en sidebar | (igual) — no hay T13 en el archivo fuente | (igual) | (igual) | "Compliance Assessment" (o "Standards Assessment") — ISO 42001 es específico de gestión de IA; en gobierno genérico se referencia el estándar de cumplimiento aplicable a cada iniciativa |
| "Cerrar menú" | AppSidebar.tsx:58 | aria-label toggle sidebar (abierto) | (igual) | (igual) | (igual) | (igual) |
| "Abrir menú" | AppSidebar.tsx:58 | aria-label toggle sidebar (cerrado) | (igual) | (igual) | (igual) | (igual) |
| "Herramientas" | AppSidebar.tsx:100 | título de sección en header del panel lateral | (igual) | (igual) | (igual) | (igual) |
| "T1 – T12" | AppSidebar.tsx:103 | badge de rango de herramientas en header del panel | (igual) | (igual) | (igual) | (igual) — etiqueta genérica de rango, no depende de dominio |
| "Perfil de Empresa" | AppSidebar.tsx:135 | entrada de menú global fija, antes de T1–T12 (target de BKL-036) | (igual) — cambio es de navegación de producto, no de dominio IA | "Configuración del proyecto" — target explícito de BKL-036; mezcla datos de empresa y de proyecto, mayoría es de proyecto; pendiente confirmar si "Empresa" se separa a menú de usuario (BKL-035) antes de renombrar | (igual) — cambio funcional/navegacional, no de redacción de dominio | "Configuración de la iniciativa/programa" — mismo criterio que BKL-036, aplicado al concepto genérico de iniciativa en vez de proyecto de IA |
| "Contexto · Fricciones" | AppSidebar.tsx:138 | subtítulo/descripción bajo "Perfil de Empresa" | (igual) | (igual) — coherente si la entrada pasa a "Configuración del proyecto" | (igual) | (igual) — coherente si la entrada pasa a "Configuración de la iniciativa/programa" |
| "GOBY · Alpha Consulting" | AppSidebar.tsx:189 | texto footer del panel lateral | (igual) | (igual) | (igual) | (igual) — nombre de marca/producto, fuera de alcance de generalización de dominio |
 
## EngagementSelector.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Proyecto Demo" | EngagementSelector.tsx:130 | label en el trigger cuando no hay proyecto activo y demo está habilitado | (igual) | (igual) | (igual) | (igual) |
| "Seleccionar proyecto" | EngagementSelector.tsx:130 | label del trigger cuando no hay proyecto activo ni demo | (igual) | (igual) | (igual) | (igual) |
| "No se pudieron cargar las empresas" | EngagementSelector.tsx:117 | error al cargar listado de empresas (solo superadmin) | (igual) | (igual) | (igual) | (igual) |
| "Selecciona una empresa antes de crear el proyecto." | EngagementSelector.tsx:138 | error de validación de formulario de creación | (igual) | (igual) | (igual) | (igual) |
| "Error al crear proyecto" | EngagementSelector.tsx:150 | mensaje de error fallback si falla createAndSelect | (igual) | (igual) | (igual) | (igual) |
| "Demo" | EngagementSelector.tsx:236 | badge/chip junto a "Proyecto Demo" en el dropdown | (igual) | (igual) | (igual) | (igual) |
| "activo" | EngagementSelector.tsx:240, :284 | indicador de proyecto seleccionado actualmente | (igual) | (igual) | (igual) | (igual) |
| "Sin proyectos disponibles" | EngagementSelector.tsx:293 | mensaje cuando la lista de proyectos está vacía | (igual) | (igual) | (igual) | (igual) |
| "Vista" | EngagementSelector.tsx:278 | badge junto a proyectos que el usuario no posee (isOwn=false) | (igual) | (igual) | (igual) | (igual) |
| "activo · solo lectura" | EngagementSelector.tsx:284 | indicador de proyecto activo en modo lectura (no propio) | (igual) | (igual) | (igual) | (igual) |
| "Nombre del proyecto..." | EngagementSelector.tsx:312 | placeholder del input de creación | (igual) | (igual) | (igual) | (igual) |
| "Cargando empresas…" | EngagementSelector.tsx:326 | estado de carga del selector de empresa | (igual) | (igual) | (igual) | (igual) |
| "Empresa (obligatorio)…" | EngagementSelector.tsx:339 | opción por defecto del select de empresa | (igual) | (igual) — correcto: asignación company_id al crear proyecto (rol superadmin) | (igual) | (igual) |
| "Creando…" | EngagementSelector.tsx:358 | estado del botón submit mientras crea | (igual) | (igual) | (igual) | (igual) |
| "Crear proyecto" | EngagementSelector.tsx:358 | texto del botón submit (estado normal) | (igual) | (igual) | (igual) | (igual) |
| "Nuevo proyecto" | EngagementSelector.tsx:379 | botón para abrir el formulario de creación | (igual) | (igual) | (igual) | (igual) |
 
## PersistenceBanner.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Contenido generado pero no guardado en la nube." | PersistenceBanner.tsx:46 | mensaje principal del banner | (igual) | (igual) | (igual) | (igual) |
| "Guardando…" | PersistenceBanner.tsx:77 | estado del botón mientras reintenta | (igual) | (igual) | (igual) | (igual) |
| "Reintentar guardado" | PersistenceBanner.tsx:88 | texto del botón (estado normal) | (igual) | (igual) | (igual) | (igual) |
 
## RetryBanner.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Reintentar" | RetryBanner.tsx:17 | valor por defecto de retryLabel, texto visible del botón | (igual) | (igual) | (igual) | (igual) |
| "Error al cargar los datos" | RetryBanner.tsx:41 | título del estado de error | (igual) | (igual) | (igual) | (igual) |
| (mensaje dinámico `{message}` — no es texto literal fijo, viene de loadError del store) | RetryBanner.tsx | mensaje dinámico | (igual) | (igual) | (igual) | (igual) |
 
## ToolLoadingScreen.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Cargando…" | ToolLoadingScreen.tsx:8 | valor por defecto de `label`, texto visible junto al spinner | (igual) | (igual) | (igual) | (igual) |
 
## ToolErrorState.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "No se pudieron cargar los datos de esta herramienta." | ToolErrorState.tsx:7 | mensaje por defecto de error | (igual) | (igual) | (igual) | (igual) |
| "Reintentar" | ToolErrorState.tsx:27 | texto del botón de reintento (si onRetry está definido) | (igual) | (igual) | (igual) | (igual) |
 
## ViewerEmptyState.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Tu consultor o equipo está recopilando los datos para esta sección." | ViewerEmptyState.tsx:25 | mensaje por defecto (client_viewer, sin datos) | (igual) | (igual) | (igual) | (igual) |
| "Los resultados aparecerán aquí pronto." | ViewerEmptyState.tsx:28 | subtexto fijo | (igual) | (igual) | (igual) | (igual) |
 
## PhaseRoadmap.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Completada" | PhaseRoadmap.tsx:76 | label de estado de herramienta (toolCfg.complete) | (igual) | (igual) | (igual) | (igual) |
| "En curso" | PhaseRoadmap.tsx:77 | label de estado de herramienta (toolCfg.in_progress) | (igual) | (igual) | (igual) | (igual) |
| "Pendiente" | PhaseRoadmap.tsx:78 | label de estado de herramienta (toolCfg.pending) | (igual) | (igual) | (igual) | (igual) |
| "Bloqueada" | PhaseRoadmap.tsx:79 | label de estado de herramienta (toolCfg.blocked) | (igual) | (igual) | (igual) | (igual) |
| "Fase {n}: {label}" | PhaseRoadmap.tsx:143 | aria-label dinámico de cada estación | (igual) | (igual) | (igual) | (igual) |
| "Sin herramientas asignadas a esta fase todavía" | PhaseRoadmap.tsx:275 | estado vacío del panel de detalle de fase | (igual) | (igual) | (igual) | (igual) |
| "En curso" (agrupación) | PhaseRoadmap.tsx:233 | groupLabels.in_progress (repetido, agrupación de herramientas) | (igual) | (igual) | (igual) | (igual) |
| "Bloqueadas" | PhaseRoadmap.tsx:234 | groupLabels.blocked | (igual) | (igual) | (igual) | (igual) |
| "Pendientes" | PhaseRoadmap.tsx:235 | groupLabels.pending | (igual) | (igual) | (igual) | (igual) |
| "Completadas" | PhaseRoadmap.tsx:236 | groupLabels.complete | (igual) | (igual) | (igual) | (igual) |
| "{done}/{total} herramientas" | PhaseRoadmap.tsx:258-259 | contador de progreso en header del panel | (igual) | (igual) | (igual) | (igual) |
| "{pct}% completado" | PhaseRoadmap.tsx:267 | porcentaje de avance de la fase | (igual) | (igual) | (igual) | (igual) |
| "{pct}%" | PhaseRoadmap.tsx:170 | porcentaje bajo cada estación | (igual) | (igual) | (igual) | (igual) |
 
## PhaseMiniMap.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Fase {n}/6 — {label}{ · toolCode}" | PhaseMiniMap.tsx:59 | atributo title del contenedor (tooltip) | (igual) | (igual) | (igual) | (igual) |
| "Listen" | PhaseMiniMap.tsx:35 | label de fase L.E.A.N. | (igual) — término de marco propio, no traducir | (igual) | (igual) — mantiene acrónimo en inglés | (igual) — el marco L.E.A.N. es agnóstico de dominio, aplica igual a cualquier programa de iniciativas |
| "Evaluate" | PhaseMiniMap.tsx:36 | label de fase L.E.A.N. | (igual) | (igual) | (igual) | (igual) |
| "Activate" | PhaseMiniMap.tsx:37 | label de fase L.E.A.N. | (igual) | (igual) | (igual) | (igual) |
| "Normalize" | PhaseMiniMap.tsx:38 | label de fase L.E.A.N. | (igual) | (igual) | (igual) | (igual) |
| "ISO 42001" | PhaseMiniMap.tsx:39 | label de fase L.E.A.N. | (igual) — estándar de referencia, correcto | (igual) | (igual) | "Cumplimiento normativo" (o el estándar aplicable a cada dominio de iniciativa) — ISO 42001 es específico de gestión de IA; en gobierno genérico la fase referencia el estándar/marco de cumplimiento correspondiente |
| "Continuidad" | PhaseMiniMap.tsx:40 | label de fase L.E.A.N. (post-sprint) | (igual) | (igual) | (igual) | (igual) |
| "{label} · {duration}{ · tools}" | PhaseMiniMap.tsx:108 | tooltip por nodo de fase individual | (igual) | (igual) | (igual) | (igual) |
| "Semanas 1–3" / "Semanas 4–8" / "Semanas 9–16" / "Meses 5–6" / "Semana 24" / "Post-sprint" | PhaseMiniMap.tsx:35-40 | duraciones textuales por fase, en tooltips | (igual) | (igual) | (igual) | (igual) |
 
## Nota sobre BKL-031/035/036
 
**BKL-036 (renombrar "Perfil de Empresa" → "Configuración del proyecto"):**
Confirmado. En `AppSidebar.tsx` (líneas 110-141) existe una entrada de menú global fija llamada exactamente **"Perfil de Empresa"** (con subtítulo "Contexto · Fricciones"), ubicada arriba del separador, antes de la lista T1–T12, con ruta `/company-profile`. Es la única aparición de este texto en los archivos auditados. El cambio de BKL-036 es una simple sustitución de string en la línea 135 (y posiblemente de icono/subtítulo si también se quiere reflejar el nuevo alcance "proyecto" en vez de "empresa"); no hay lógica adicional que dependa del texto. La columna Data propone explícitamente este rename, condicionado a decidir primero si el bloque "Empresa" se separa a un menú de usuario aparte (ver BKL-035).
 
**BKL-035 (icono/menú de usuario en barra superior):**
NO existe hoy ningún icono ni menú desplegable de usuario en el header. Lo que hay en `AppLayout.tsx` (líneas 259-263, sección "Derecha: controles de sesión") es un `LogoutButton` (botón plano con icono de salida + texto "Salir" o el nombre del usuario) y un `DarkModeToggle` (botón de sol/luna). No hay avatar, ni dropdown, ni acceso a perfil/ajustes de usuario — solo un botón de logout directo. BKL-035 requeriría **crear el menú de usuario desde cero** (posiblemente reemplazando o envolviendo el actual `LogoutButton`), no modificar uno existente.
 
**BKL-031 / T10 (selector de proyecto vs. visión empresa):**
El `EngagementSelector.tsx` (barra superior, izquierda, junto al logo) es hoy exclusivamente un **selector de proyecto individual** (`projects` de `useEngagementStore`): permite cambiar entre proyectos existentes o crear uno nuevo, sin ningún concepto de "vista de empresa" agregada ni selector de empresa visible en el header (el selector de empresa solo aparece internamente dentro del formulario de creación de proyecto, y únicamente para rol `superadmin`, para asignar el proyecto nuevo a una empresa). El nombre de la empresa se muestra de forma pasiva y no interactiva en el `ContextBreadcrumb` central del header (AppLayout.tsx líneas 107-155, tomado de `useCompanyProfileStore().profile.engagementName`), pero no hay ningún control para cambiar de empresa o ver una "vista consolidada" a nivel empresa. Cualquier trabajo de T10 sobre visión empresa-vs-proyecto tendría que añadir un mecanismo nuevo (toggle o selector de nivel superior) — hoy la UI solo entiende "proyecto activo", no "empresa activa" como entidad navegable.
 
## Notas de los expertos
 
**IA (IA Adoption):** Los 71 textos son mayoritariamente genéricos/administrativos (loading, errores, sesión, menú) y no requieren adaptación de dominio. Los 12 nombres de herramientas del sidebar (T1–T12) y las fases L.E.A.N. ya usan terminología correcta y consistente con el dominio IA Adoption; no se detecta ninguna T13 en el archivo fuente. "Perfil de Empresa" se mantiene igual como texto — su posible renombrado a "Configuración del proyecto" (BKL-036) es un cambio de navegación/IA de producto, no una corrección terminológica de dominio. 0 de 71 textos con propuesta de cambio desde IA.
 
**Transformación Digital (DT):** Los 71 textos son mayormente genéricos de navegación (menús, banners, estados de carga/error, tooltips). Se revisaron con especial atención los 12 nombres de herramientas del sidebar (T1–T12) — todos correctos y consistentes, sin cambios de dominio necesarios; nótese que el encargo mencionaba 13 herramientas pero el sidebar auditado solo contiene 12, no se encontró una T13. También se revisó "Perfil de Empresa", correcto terminológicamente (su posible renombrado es un cambio funcional de BKL-036, no de dominio). No se detectó ningún texto que requiera reescritura de dominio DT.
 
**Data (Gobierno de Datos) — BORRADOR NO CONFIRMADO:** Revisión de textos desde la óptica de Gobierno de Datos (ROL-29), no validada ni aprobada. Única propuesta de cambio relevante: "Perfil de Empresa" (AppSidebar.tsx:135) → "Configuración del proyecto", conforme a BKL-036, dado que el contenido bajo esa entrada mezcla datos de empresa (company_id) y datos de proyecto (engagement_id) y la mayoría es de proyecto. Requiere confirmación de negocio/UX antes de implementar.
 
**Generalización (Gobierno de Proyectos e Iniciativas):** De los 71 textos, la inmensa mayoría (navegación, sesión, banners de estado, errores, carga, selector de proyecto) ya son agnósticos de dominio y no requieren cambio alguno para servir a un producto genérico de gobierno de proyectos e iniciativas. Los únicos puntos de acoplamiento a IA están en los nombres de 5 de las 12 herramientas del sidebar (T1, T4, T5, T9, T10 usan "AI"/"Use Case", y T12 referencia "ISO 42001") y en la etiqueta de fase "ISO 42001" del mini-mapa L.E.A.N.; en todos los casos basta con retirar el prefijo/término específico de IA y sustituirlo por el concepto equivalente de "iniciativa" o "cumplimiento normativo" genérico, sin tocar estructura ni lógica. El marco L.E.A.N. (Listen, Evaluate, Activate, Normalize, Continuidad) es ya plenamente agnóstico y reutilizable tal cual. "Perfil de Empresa" sigue el mismo criterio que BKL-036 pero generalizado a "Configuración de la iniciativa/programa". No se identifican otros textos de navegación con dependencia de dominio.