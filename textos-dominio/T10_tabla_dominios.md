# GOBY — Tabla de textos por dominio · Herramienta T10 (AI Value Dashboard)
> Total de textos: 79 · Generado 2026-08-31 · Pendiente de validación por Carlos
 
## Nota BKL-031 y AI_CAT_META
 
**AI_CAT_META (T10View.tsx:477-482)** es el objeto que el backlog marca como pendiente de generalizar: mapea 4 claves de categoría de IA (`automatizacion_inteligente`, `analitica_predictiva`, `automatizacion_rpa`, `asistente_ia`) a labels en español y colores, hardcodeado directamente dentro del componente de vista, sin i18n ni configuración externa. Cualquier proceso T3 con `aiCategory` fuera de estas 4 claves cae al fallback literal `cat` (el código crudo sin traducir, línea 490) — fuga de texto no localizado visible al usuario. Además, las etiquetas de AI_CAT_META no coinciden con las categorías usadas en `demo-data.ts` P4 ("IA Generativa", "Automatización", "IA Predictiva"), dos taxonomías distintas conviviendo en el mismo módulo.
 
**Vista empresa vs proyecto (BKL-031)**: todo el módulo T10 asume un único `engagementId`/proyecto activo (guard de "Selecciona un proyecto", cabecera con `displayName`/`displaySector`/`displayTamano` de un solo proyecto). No hay ningún texto ni sección agregando datos a nivel empresa (multi-proyecto): confirma que la "vista de empresa" mencionada en BKL-031 no existe aún en T10 — sería una vista/paneles nuevos, no una simple generalización de copy existente.
 
## Notas de los expertos
 
- **IA (ROL-26, Cassie Kozyrkov)**: propone dinamizar "Sprint 3 / 6" y "Mayo 2026"; limpiar "T4 · Portfolio IA  ★" (doble espacio y estrella fija); unificar Shadow AI entre P3 y P5; dar fallback legible a la categoría IA no mapeada; alinear "Early Majority"/"Early Adopters" al español; desambiguar "Opp crítica/alta".
- **DT (Jeanne Ross)**: enfatiza valor de negocio y vocabulario "empresa vs proyecto" (p. ej. "Índice de valor IA de la empresa", "Madurez IA de la empresa"); mismas correcciones de hardcodeos, Shadow AI y fallback de categoría; refuerza "empresa vs proyecto" en 2 textos clave sin inventar una vista de empresa inexistente.
- **Data (ROL-29, Redman/Ladley, BORRADOR BKL-018 no confirmado)**: foco en trazabilidad y gobierno del dato — marca "Sprint 3 / 6" y "Mayo 2026" como "datos huérfanos" sin fuente; exige diccionario único de categorías de IA (AI_CAT_META vs demo-data.ts); fallback de categoría como "Otra ({cat})"; unificar trazabilidad Shadow AI P3/P5; vocabulario Rogers duplicado sin fuente única de verdad.
- Todas las fuentes coinciden en 4 problemas transversales: (1) "Sprint 3 / 6" y "Mayo 2026" deben calcularse dinámicamente; (2) limpiar "T4 · Portfolio IA  ★"; (3) unificar el copy de Shadow AI entre P3 y P5; (4) dar fallback legible al código crudo de categoría IA no mapeada.
## Tabla de textos
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Selecciona un proyecto" | T10View.tsx:574 | h2 del guard "sin proyecto seleccionado" | (igual) | (igual) | (igual) | (igual) |
| "El dashboard de adopción IA está vinculado al proyecto activo. Usa el selector ▾ Proyecto en la barra superior para seleccionar uno existente o crear uno nuevo." | T10View.tsx:577-578 | texto de ayuda del guard 1 | (igual) | (igual) | "Este dashboard muestra el valor generado por la IA en un proyecto concreto de tu empresa. Usa el selector ▾ Proyecto en la barra superior para elegir uno existente o crear uno nuevo." | "El dashboard de valor está vinculado a la iniciativa activa. Usa el selector ▾ Iniciativa en la barra superior para seleccionar una existente o crear una nueva." |
| "No hay datos suficientes para calcular el valor" | T10View.tsx:604 | h2 del guard "T1 sin datos" | "Aún no hay datos suficientes para calcular el valor de la IA" | "No hay datos suficientes para calcular el valor — fuente: Radar de Madurez (T1) sin registros" | (igual) | "No hay datos suficientes para calcular el valor generado por la iniciativa" |
| "El dashboard se construye a partir de las herramientas del programa L.E.A.N. Comienza completando el Radar de Madurez (T1) para que el sistema pueda calcular los indicadores de adopción IA de tu empresa." | T10View.tsx:607-608 | texto de ayuda del guard 2 | (igual) | (igual) | (igual) | "El dashboard se construye a partir de las herramientas del programa. Comienza completando el Radar de Madurez (T1) para que el sistema pueda calcular los indicadores de adopción de la iniciativa en tu organización." |
| "Ruta de activación recomendada" | T10View.tsx:617 | encabezado del checklist de activación | (igual) | (igual) | (igual) | (igual) |
| "Radar de Madurez" | T10View.tsx:621 | label del paso T1 en la ruta de activación | (igual) | (igual) | (igual) | (igual) |
| "Matriz de Stakeholders" | T10View.tsx:622 | label del paso T2 | (igual) | (igual) | (igual) | (igual) |
| "Mapa de Procesos" | T10View.tsx:623 | label del paso T3 | (igual) | (igual) | (igual) | (igual) |
| "Portfolio de Casos de Uso" | T10View.tsx:624 | label del paso T4 | (igual) | (igual) | (igual) | "Portfolio de Iniciativas" |
| "Comenzar con T1 — Radar de Madurez" | T10View.tsx:648 | texto del botón CTA | (igual) | (igual) | (igual) | (igual) |
| "Índice IA global" | T10View.tsx:692 | label del hero metric de cabecera | (igual) | (igual) | "Índice de valor IA de la empresa" | "Índice de valor global de la iniciativa" |
| "/ 4.0" | T10View.tsx:697 | sufijo de escala junto al índice IA | (igual) | (igual) | (igual) | (igual) |
| "Sprint 3 / 6" | T10View.tsx:703 | badge de sprint en cabecera (valor fijo hardcodeado) | "Sprint {actual} / {total}" — calculado dinámicamente | "Sprint {n} / {total}" — dato calculado, no literal fijo (dato de demo filtrado a producción) | "Sprint {actual} / {total}" — pasar a valor calculado | "Fase {actual} / {total}" — calculado dinámicamente sobre el ciclo de la iniciativa |
| "Mayo 2026" | T10View.tsx:705 | fecha fija hardcodeada bajo el badge de sprint | "{mesActual}" — calculada dinámicamente | "{fecha_referencia_calculada}" — derivar de la fecha real del proyecto/sprint | "{mesActual} {añoActual}" — pasar a valor calculado | "{mesActual} {añoActual}" — derivado de la fecha real de la iniciativa |
| "Proyecto de tu empresa · Solo lectura — no puedes guardar cambios en este proyecto" | T10View.tsx:718 | banner de solo lectura | (igual) | (igual) | "Proyecto de tu empresa · Vista de solo lectura — los cambios se gestionan desde el proyecto original" | "Iniciativa de tu organización · Vista de solo lectura — los cambios se gestionan desde la iniciativa original" |
| "T1 · Readiness" | T10View.tsx:733 | tag del panel P1 | (igual) | (igual) | (igual) | (igual) |
| "Madurez IA" | T10View.tsx:734 | título del panel P1 (y label reutilizado en HeroMetric, línea 736) | (igual) | (igual) | "Madurez IA de la empresa" | "Madurez de la iniciativa" |
| "IT (avg)" | T10View.tsx:754 | label en sección expandida P1 | "IT (media)" | (igual) | "TI (media)" | "Área técnica (media)" |
| "Negocio (avg)" | T10View.tsx:770 | label en sección expandida P1 | "Negocio (media)" | (igual) | "Negocio (media)" | "Negocio (media)" |
| "Sin entrevistas registradas aún — abre T1 para añadir la primera." | T10View.tsx:782-783 | estado vacío de entrevistas en P1 | (igual) | (igual) | (igual) | (igual) |
| "Nº entrevistas:" | T10View.tsx:788 | label en sección expandida P1 | (igual) | (igual) | (igual) | (igual) |
| "Área más débil:" | T10View.tsx:793 | label en sección expandida P1 | (igual) | (igual) | (igual) | (igual) |
| "Abrir T1 Assessment" | T10View.tsx:796 | botón de navegación | (igual) | (igual) | (igual) | (igual) |
| "T4 · Portfolio IA  ★" | T10View.tsx:804 | tag del panel P2 (doble espacio y estrella hardcodeados) | "T4 · Portfolio IA" — elimina doble espacio y estrella fija; estrella debe ser condicional a un dato real | "T4 · Portfolio IA ★" — corregir doble espacio (defecto de calidad de dato de presentación) | "T4 · Portfolio IA" — eliminar doble espacio y estrella hardcodeada | "T4 · Portfolio de Iniciativas" — eliminar doble espacio y estrella hardcodeada |
| "Iniciativas activas" | T10View.tsx:805 | título del panel P2 | (igual) | (igual) | (igual) | (igual) |
| "Inversión total" | T10View.tsx:807 | label del HeroMetric de P2 | (igual) | (igual) | (igual) | (igual) |
| "Ahorro anual est." | T10View.tsx:812 | label de MetricChip | (igual) | (igual) | "Ahorro anual estimado" | "Ahorro anual estimado" |
| "Payback promedio" | T10View.tsx:813 | label de MetricChip | (igual) | (igual) | (igual) | (igual) |
| "ROI 3 años" | T10View.tsx:814 | label de MetricChip | (igual) | (igual) | "ROI a 3 años" | "ROI del proyecto a 3 años" |
| "Activa" | T10View.tsx:826 | badge de estado de iniciativa top | (igual) | (igual) | (igual) | (igual) |
| "Validando" | T10View.tsx:826 | badge de estado de iniciativa top | (igual) | (igual) | (igual) | (igual) |
| "Sin iniciativas priorizadas aún" | T10View.tsx:833 | estado vacío de top iniciativas | (igual) | (igual) | (igual) | (igual) |
| "ROI estimado:" | T10View.tsx:837 | label en sección expandida P2 | (igual) | (igual) | (igual) | (igual) |
| "Abrir T4 Portfolio" | T10View.tsx:840 | botón de navegación | (igual) | (igual) | (igual) | (igual) |
| "T2 + T7 · Adopción" | T10View.tsx:848 | tag del panel P3 | (igual) | (igual) | (igual) | (igual) |
| "Velocidad de adopción" | T10View.tsx:849 | título del panel P3 | (igual) | (igual) | (igual) | (igual) |
| "Adopción activa" | T10View.tsx:851 | label del HeroMetric de P3 | (igual) | (igual) | (igual) | (igual) |
| "Composición por departamento" | T10View.tsx:856 | encabezado de sección en P3 | (igual) | (igual) | (igual) | (igual) |
| "Sin stakeholders registrados aún" | T10View.tsx:860 | estado vacío de departamentos | (igual) | (igual) | (igual) | (igual) |
| "Score de cambio" | T10View.tsx:879 | label en sección expandida P3 | (igual) | (igual) | "Índice de gestión del cambio" | "Índice de gestión del cambio" |
| "/ 5" | T10View.tsx:880 | unidad junto al score de cambio | (igual) | (igual) | (igual) | (igual) |
| "Fase de difusión" | T10View.tsx:883 | label en sección expandida P3 | (igual) | (igual) | "Fase de difusión (curva de adopción)" | "Fase de difusión (curva de adopción)" |
| "Riesgo de Shadow AI" | T10View.tsx:897 | label del bloque Shadow AI (junto a emoji ⚠️ hardcodeado) | (igual) | (igual) | (igual) | "Riesgo de herramientas no gobernadas" |
| "perfiles declaran herramientas externas · Ver detalle en T6" | T10View.tsx:911 | texto compuesto del indicador Shadow AI en P3 | (igual) | (igual) — mantener como copy canónico | (igual) | "perfiles declaran herramientas externas no autorizadas · Ver detalle en T6" |
| "Abrir T2" | T10View.tsx:917 | botón de navegación | (igual) | (igual) | "Abrir T2 Stakeholders" | "Abrir T2 Stakeholders" |
| "Abrir T7" | T10View.tsx:918 | botón de navegación | (igual) | (igual) | "Abrir T7 Adopción" | "Abrir T7 Adopción" |
| "T3 · Ecosistema IA" | T10View.tsx:927 | tag del panel P4 | (igual) | (igual) | (igual) | "T3 · Ecosistema de la iniciativa" |
| "Ecosistema IA" | T10View.tsx:928 | título del panel P4 | (igual) | (igual) | "Ecosistema IA de la empresa" | "Ecosistema de la iniciativa" |
| "Sin procesos mapeados aún" | T10View.tsx:931 | subtítulo del panel P4 cuando no hay datos | (igual) | (igual) | (igual) | (igual) |
| "Eficiencia" | T10View.tsx:934 | label del HeroMetric de P4 | (igual) | (igual) | "Eficiencia de procesos" | "Eficiencia de procesos" |
| "Mayor espera:" | T10View.tsx:960 | label del bottleneck en P4 | (igual) | (igual) | (igual) | (igual) |
| "Abre T3 para mapear los procesos de la empresa y ver la distribución de tipos de IA." | T10View.tsx:966 | estado vacío del panel P4 | (igual) | (igual) | (igual) | "Abre T3 para mapear los procesos de la organización y ver la distribución de tipos de iniciativa." |
| "Mapeados" | T10View.tsx:974 | label de MetricChip (sección expandida P4) | (igual) | (igual) | "Procesos mapeados" | "Procesos mapeados" |
| "Opp crítica" | T10View.tsx:975 | label de MetricChip | "Oportunidad crítica" — evitar abreviatura ambigua | (igual) | "Oportunidad crítica" | "Oportunidad crítica" |
| "Opp alta" | T10View.tsx:976 | label de MetricChip | "Oportunidad alta" | (igual) | "Oportunidad alta" | "Oportunidad alta" |
| "Abrir T3 Procesos" | T10View.tsx:979 | botón de navegación | (igual) | (igual) | (igual) | (igual) |
| "T6 + T12 · Riesgos" | T10View.tsx:987 | tag del panel P5 | (igual) | (igual) | (igual) | (igual) |
| "Riesgo + ISO 42001" | T10View.tsx:988 | título del panel P5 | (igual) | (igual) | (igual) | "Riesgo + Cumplimiento normativo" |
| "Pendiente de mapeo" | T10View.tsx:991 | subtítulo del panel P5 sin datos | (igual) | (igual) | (igual) | (igual) |
| "ISO 42001" | T10View.tsx:994 | label del HeroMetric de P5 | (igual) | (igual) | (igual) | "Cumplimiento normativo" |
| "Alto" | T10View.tsx:1010 | etiqueta de nivel de riesgo (leyenda donut) | (igual) | (igual) | (igual) | (igual) |
| "Medio" | T10View.tsx:1015 | etiqueta de nivel de riesgo | (igual) | (igual) | (igual) | (igual) |
| "Bajo" | T10View.tsx:1020 | etiqueta de nivel de riesgo | (igual) | (igual) | (igual) | (igual) |
| "ISO 42001 cumplimiento" | T10View.tsx:1027 | label de la barra de progreso ISO | "Cumplimiento ISO 42001" | (igual) | "Cumplimiento ISO 42001" | "Cumplimiento normativo del proyecto" |
| "Shadow AI" | T10View.tsx:1041 | label corto del bloque Shadow AI en P5 (junto a emoji ⚠️) | (igual) | (igual) | (igual) | "Herramientas no gobernadas" |
| "perfiles declaran herramientas externas" | T10View.tsx:1057 | texto compuesto Shadow AI en P5 (sin "Ver detalle en T6" — inconsistencia con P3) | "perfiles declaran herramientas externas · Ver detalle en T6" — unificar con P3 | "perfiles declaran herramientas externas · Ver detalle en T6" — unificar con P3 | "perfiles declaran herramientas externas · Ver detalle en T6" — unificar con P3 | "perfiles declaran herramientas externas no autorizadas · Ver detalle en T6" — unificar con P3 |
| "Completa T4 (casos de uso) y T12 (ISO 42001) para ver el mapa de riesgo real del proyecto." | T10View.tsx:1064-1065 | estado vacío del panel P5 | (igual) | (igual) | (igual) | "Completa T4 (portfolio de iniciativas) y T12 (cumplimiento) para ver el mapa de riesgo real del proyecto." |
| "Abrir T6 Riesgos" | T10View.tsx:1071 | botón de navegación | (igual) | (igual) | (igual) | (igual) |
| "Abrir T12 ISO" | T10View.tsx:1072 | botón de navegación | (igual) | (igual) | (igual) | "Abrir T12 Cumplimiento" |
| "T8 · T9 · T11 · Gobierno" | T10View.tsx:1081 | tag del panel P6 | (igual) | (igual) | (igual) | (igual) |
| "Gobierno activo" | T10View.tsx:1082 | título del panel P6 (reutilizado como label del HeroMetric, línea 1088) | (igual) | (igual) | "Gobierno IA activo" | "Gobierno de la iniciativa activo" |
| "Pendiente de configurar" | T10View.tsx:1085 | subtítulo del panel P6 sin datos | (igual) | (igual) | (igual) | (igual) |
| "Casos en GO" | T10View.tsx:1106 | label de MetricChip | (igual) | (igual) | "Casos en GO" | "Iniciativas aprobadas (GO)" |
| "Candidatos" | T10View.tsx:1107 | label de MetricChip | (igual) | (igual) | (igual) | (igual) |
| "Completados" | T10View.tsx:1108 | label de MetricChip | (igual) | (igual) | (igual) | (igual) |
| "Riesgo alto" | T10View.tsx:1109 | label de MetricChip | (igual) | (igual) | (igual) | (igual) |
| "Usa T4 (Portfolio) y T9 (Roadmap) para construir el panel de gobierno del proyecto." | T10View.tsx:1114-1115 | estado vacío del panel P6 | (igual) | (igual) | (igual) | "Usa T4 (Portfolio de iniciativas) y T9 (Roadmap) para construir el panel de gobierno del proyecto." |
| "Abrir T11 Gobierno" | T10View.tsx:1121 | botón de navegación | (igual) | (igual) | (igual) | (igual) |
| "Abrir T9 Roadmap" | T10View.tsx:1122 | botón de navegación | (igual) | (igual) | (igual) | (igual) |
| "Abrir T8 Vendors" | T10View.tsx:1123 | botón de navegación | (igual) | (igual) | (igual) | (igual) |
| "Recomendaciones IA — Programa de Adopción" | T10View.tsx:1135 | título del RecommendationPanel | (igual) | (igual) | (igual) | "Recomendaciones — Programa de Adopción de la iniciativa" |
| "Generadas por Claude · Visión ejecutiva del programa completo" | T10View.tsx:1136 | subtítulo del RecommendationPanel | (igual) | (igual) | (igual) | "Generadas automáticamente · Visión ejecutiva del programa completo" |
| "Iniciación" | T10View.tsx:40 | maturityLabel() para avg < 1 | (igual) | (igual) | (igual) | (igual) |
| "Exploración" | T10View.tsx:41 | maturityLabel() para avg < 2 | (igual) | (igual) | (igual) | (igual) |
| "Desarrollo" | T10View.tsx:42 | maturityLabel() para avg < 3 | (igual) | (igual) | (igual) | (igual) |
| "Avanzado" | T10View.tsx:43 | maturityLabel() para avg < 3.5 | (igual) | (igual) | (igual) | (igual) |
| "Líder" | T10View.tsx:44 | maturityLabel() para avg >= 3.5 | (igual) | (igual) | (igual) | (igual) |
| "—" | T10View.tsx:48 | weakestDimension() valor por defecto sin datos | (igual) | (igual) | (igual) | (igual) |
| "Early Majority" (rogersPhase) | T10View.tsx:432 | rogersPhase cuando activePercent > 50 | "Mayoría temprana" — consistencia de idioma en la taxonomía Rogers | (igual) | (igual) | "Mayoría temprana" |
| "Early Adopters" | T10View.tsx:413/432 | rogersPhase por defecto o activePercent <= 50 | "Adoptantes tempranos" — consistencia de idioma | (igual) | (igual) | "Adoptantes tempranos" |
| "Innovadores" | T10View.tsx:434 | label de grupo de adopción (categoría hardcodeada) | (igual) | (igual) | (igual) | (igual) |
| "Early Majority" (label de grupo) | T10View.tsx:435 | label de grupo de adopción, duplica rogersPhase | "Mayoría temprana" — ver nota anterior; duplica rogersPhase | "Mayoría Temprana" — evitar duplicar el concepto en dos formas de idioma sin fuente única | (igual) — nota: duplicación es problema de lógica, fuera de alcance de copy | "Mayoría temprana" — evitar duplicar el concepto en dos formas de idioma |
| "Rezagados" | T10View.tsx:436 | label de grupo de adopción (categoría hardcodeada) | (igual) | (igual) | (igual) | (igual) |
| "Activas {n}" / "Validando {n}" / "Backlog {n}" / "Paradas {n}" | T10View.tsx:666-669 | labels de segmentos de StatusBar (interpolados) | (igual) | (igual) | (igual) | (igual) |
| "Sin datos" | T10View.tsx:670 | label del segmento de StatusBar cuando no hay iniciativas | (igual) | (igual) | (igual) | (igual) |
| "Mes {n}" | T10View.tsx:530 | formato de fecha de hitos (upcomingEvents) en P6 | (igual) | (igual) | (igual) | (igual) |
| "Automatización Inteligente" | T10View.tsx:478 (AI_CAT_META) | label de categoría IA (clave `automatizacion_inteligente`) | (igual) | (igual) — ver nota de gobierno del diccionario completo | (igual) | "Automatización de procesos" |
| "Analítica Predictiva" | T10View.tsx:479 (AI_CAT_META) | label de categoría IA (clave `analitica_predictiva`) | (igual) | (igual) | (igual) | "Analítica avanzada" |
| "RPA" | T10View.tsx:480 (AI_CAT_META) | label de categoría IA (clave `automatizacion_rpa`) | (igual) | (igual) | "RPA (Automatización Robótica)" | "Automatización robótica de procesos" |
| "Asistente IA" | T10View.tsx:481 (AI_CAT_META) | label de categoría IA (clave `asistente_ia`) | (igual) | (igual) | (igual) | "Asistente digital" |
| (fallback) código de categoría sin traducir (`cat`) | T10View.tsx:490 (AI_CAT_META) | fallback literal cuando la categoría no está mapeada | "Otra categoría IA" — nunca mostrar identificador técnico crudo | "Otra ({cat})" — fuga de dato no gobernado, requiere entrada de fallback gobernada (BKL-018) | "Otra categoría IA" — evitar fuga de código crudo al usuario | "Otra categoría de iniciativa" — nunca mostrar identificador técnico crudo |
 
## Nota del experto — Generalización (Gobierno de Proyectos)
 
La mayoría de los textos de T10 ya son agnósticos de dominio (etiquetas de estado, navegación, escalas numéricas) y quedan marcados "(igual)". El grueso de la generalización recae en un conjunto pequeño y repetido de sustituciones léxicas: "IA" → "de la iniciativa/del proyecto", "empresa" → "organización" cuando se refiere al agregado multi-proyecto, "Shadow AI" → "herramientas no gobernadas", "ISO 42001" → "cumplimiento normativo" (genérico, sin comprometerse a un estándar concreto), y "Portfolio de Casos de Uso IA" → "Portfolio de Iniciativas". Estas sustituciones son puramente de copy: no cambian ninguna lógica de cálculo, umbral ni estructura de datos subyacente. Los tres defectos transversales ya señalados por los expertos (fechas/sprints hardcodeados, doble espacio + estrella fija en el tag T4, inconsistencia Shadow AI P3/P5, fallback crudo de categoría) siguen aplicando igual en la versión genérica y deben resolverse antes o durante la generalización, no después. AI_CAT_META en particular necesita renombrarse a algo como `INITIATIVE_CATEGORY_META` con etiquetas neutras ("Automatización de procesos", "Analítica avanzada", "Automatización robótica de procesos", "Asistente digital") para que el dashboard sirva a cualquier tipo de iniciativa, no solo a las de IA.