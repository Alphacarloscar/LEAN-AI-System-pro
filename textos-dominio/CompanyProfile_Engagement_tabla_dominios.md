# GOBY — Tabla de textos por dominio · Perfil de Empresa (CompanyProfile + Engagement)
> Total de textos: 54 · Generado 2026-08-31 · Pendiente de validación por Carlos
 
## CompanyProfileView.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Cargando perfil..." | CompanyProfileView.tsx:375 | texto de loading state (guard "cargando") | (igual) | (igual) | (igual) | (igual) |
| "Selecciona un proyecto" | CompanyProfileView.tsx:392 | título del empty state sin proyecto activo | (igual) | (igual) | (igual) | (igual) |
| "El perfil de empresa está vinculado al proyecto activo." | CompanyProfileView.tsx:394 | texto explicativo empty state | (igual) | (igual) | (igual) | "El perfil de la organización está vinculado a la iniciativa activa." |
| "Usa el selector" | CompanyProfileView.tsx:395 | texto explicativo empty state | (igual) | (igual) | (igual) | (igual) |
| "▾ Proyecto" | CompanyProfileView.tsx:395 | referencia al selector de la barra superior | (igual) | (igual) | (igual) | "▾ Iniciativa" |
| "en la barra superior." | CompanyProfileView.tsx:395 | texto explicativo empty state | (igual) | (igual) | (igual) | (igual) |
| "Volver al Dashboard" | CompanyProfileView.tsx:398 | botón del empty state | (igual) | (igual) | (igual) | (igual) |
| "Volver al dashboard" | CompanyProfileView.tsx:422 | botón de navegación en header | (igual) | (igual) | (igual) | (igual) |
| "Perfil de Empresa" | CompanyProfileView.tsx:435 | título principal (h1) del header | (igual) — genérico y correcto; el rediseño a "Configuración del proyecto" es cambio de arquitectura de info (BKL-036), no de dominio IA | "Perfil de Empresa" (título h1) — verificar tras BKL-035/036: si "Empresa" se separa a nivel company_id, este h1 debería dividirse en dos títulos independientes; hasta la migración, texto correcto tal cual | (igual) — término de dominio TD estándar; ver nota BKL-036 sobre renombrado funcional (no terminológico) | "Perfil de la Organización" |
| "{companyName}" | CompanyProfileView.tsx:437 | subtítulo dinámico con nombre de empresa (dato, no literal fijo) | (igual) | (igual) — dato dinámico, no requiere cambio de texto | (igual) | (igual) |
| "{saveError}" | CompanyProfileView.tsx:450 | mensaje de error dinámico (tab proyecto) | (igual) | (igual) | (igual) | (igual) |
| "Guardado {savedDate}" | CompanyProfileView.tsx:454 | estado de guardado con fecha (tab proyecto) | (igual) | (igual) | (igual) | (igual) |
| "Cambios sin guardar" | CompanyProfileView.tsx:459 | badge de estado dirty (tab proyecto) | (igual) | (igual) | (igual) | (igual) |
| "{companySaveError}" | CompanyProfileView.tsx:466 | mensaje de error dinámico (tab empresa) | (igual) | (igual) | (igual) | (igual) |
| "Guardando..." | CompanyProfileView.tsx:489 | estado del botón "Guardar empresa" mientras guarda | (igual) | (igual) | (igual) | (igual) |
| "Guardado" | CompanyProfileView.tsx:496 | estado del botón "Guardar empresa" tras éxito (flash) | (igual) | (igual) | (igual) | (igual) |
| "Guardar empresa" | CompanyProfileView.tsx:499 | texto por defecto del botón de guardado (tab empresa) | (igual) | (igual) | (igual) | "Guardar organización" |
| "Guardando..." | CompanyProfileView.tsx:521 | estado del botón "Guardar contexto" mientras guarda | (igual) | (igual) | (igual) | (igual) |
| "Guardado" | CompanyProfileView.tsx:529 | estado del botón "Guardar contexto" tras éxito (flash) | (igual) | (igual) | (igual) | (igual) |
| "Guardar contexto" | CompanyProfileView.tsx:537 | texto por defecto del botón de guardado (tab proyecto) | (igual) | (igual) | (igual) | "Guardar contexto de la iniciativa" |
| "Empresa" | CompanyProfileView.tsx:547 | etiqueta del tab "Empresa" | (igual) | (igual) — etiqueta de tab, consistente con entidad de datos "empresa" (company_id) | (igual) | "Organización" |
| "Contexto del proyecto" | CompanyProfileView.tsx:548 | etiqueta del tab "Contexto del proyecto" | (igual) | (igual) — consistente con entidad "proyecto" (engagement_id) | (igual) | "Contexto de la iniciativa" |
| "Datos de la empresa" | CompanyProfileView.tsx:576 | SectionLabel de la sección sector/tamaño | (igual) | (igual) | (igual) | "Datos de la organización" |
| "Información permanente de la empresa, compartida entre todos sus proyectos." | CompanyProfileView.tsx:578-579 | texto explicativo de la sección | (igual) | (igual) — describe correctamente el modelo de datos (company_id compartido entre engagements) | (igual) | "Información permanente de la organización, compartida entre todas sus iniciativas." |
| "Sector" | CompanyProfileView.tsx:584 | FieldLabel del select de sector | (igual) | (igual) | (igual) | (igual) |
| "Seleccionar sector..." | CompanyProfileView.tsx:589 | placeholder del select de sector | (igual) | (igual) | (igual) | (igual) |
| "Tamaño de empresa" | CompanyProfileView.tsx:594 | FieldLabel del select de tamaño | (igual) | (igual) | (igual) | "Tamaño de la organización" |
| "Seleccionar tamaño..." | CompanyProfileView.tsx:599 | placeholder del select de tamaño | (igual) | (igual) | (igual) | (igual) |
| "Departamentos de la empresa" | CompanyProfileView.tsx:609 | SectionLabel de la sección departamentos | (igual) | (igual) | (igual) | "Departamentos de la organización" |
| "Lista centralizada compartida entre todos los proyectos." | CompanyProfileView.tsx:611 | texto explicativo departamentos | (igual) | (igual) — correcto: departamentos viven a nivel company_id | (igual) | "Lista centralizada compartida entre todas las iniciativas." |
| "Disponible como selector en T2, T3, T4 y T8." | CompanyProfileView.tsx:612 | texto explicativo departamentos (referencia a otros módulos) | (igual) — referencia técnica interna válida | (igual) — verificar que sigue siendo cierta si cambian los selectores en esos módulos, pero el texto en sí no requiere cambio ahora | (igual) — referencia interna a herramientas, correcta | "Disponible como selector en los módulos relacionados." |
| "Contexto del proyecto" | CompanyProfileView.tsx:627 | SectionLabel de la sección de contexto (tab proyecto) | (igual) | (igual) | (igual) | "Contexto de la iniciativa" |
| "Nombre del proyecto" | CompanyProfileView.tsx:631 | FieldLabel | (igual) | (igual) | (igual) | "Nombre de la iniciativa" |
| "Ej: Conecta Professional Services — Sprint LEAN Q2 2026" | CompanyProfileView.tsx:637 | placeholder del input nombre de proyecto | (igual) — ejemplo ya alineado con metodología LEAN/IA Adoption | (igual) | (igual) | "Ej: Iniciativa de Mejora Operativa — Sprint Q2 2026" |
| "Objetivo principal con IA" | CompanyProfileView.tsx:645 | FieldLabel | (igual) — ya explícitamente de dominio IA | (igual) | (igual) | "Objetivo principal de la iniciativa" |
| "Seleccionar objetivo..." | CompanyProfileView.tsx:650 | placeholder select objetivo | (igual) | (igual) | (igual) | (igual) |
| "Horizonte esperado de valor" | CompanyProfileView.tsx:655 | FieldLabel | (igual) | (igual) | (igual) | (igual) |
| "Seleccionar horizonte..." | CompanyProfileView.tsx:660 | placeholder select horizonte | (igual) | (igual) | (igual) | (igual) |
| "Ecosistema tecnológico principal" | CompanyProfileView.tsx:669 | FieldLabel | (igual) — terminología ya adecuada al dominio (stack tecnológico de IA) | (igual) | (igual) | "Ecosistema o entorno principal" |
| "Seleccionar ecosistema..." | CompanyProfileView.tsx:674 | placeholder select ecosistema | (igual) | (igual) | (igual) | (igual) |
| "Restricciones relevantes" | CompanyProfileView.tsx:679 | FieldLabel | (igual) | (igual) | (igual) | (igual) |
| "Ej: presupuesto limitado, sistemas legacy, GDPR sector financiero..." | CompanyProfileView.tsx:685 | placeholder textarea restricciones | (igual) — ejemplo ya cubre restricciones típicas de adopción de IA (compliance, legacy) | (igual) | (igual) | "Ej: presupuesto limitado, sistemas legacy, normativa del sector..." |
| "Departamentos implicados en este proyecto" | CompanyProfileView.tsx:693 | FieldLabel del multi-select de áreas prioritarias | (igual) | (igual) — correcto: selección de subconjunto de datos de empresa a nivel de proyecto | (igual) | "Departamentos implicados en esta iniciativa" |
| "{N} departamento(s) seleccionado(s)" | CompanyProfileView.tsx:709 | texto contador dinámico (singular/plural) | (igual) | (igual) | (igual) | (igual) |
| "Configura primero los departamentos en la pestaña" | CompanyProfileView.tsx:715 | texto guía cuando no hay departamentos | (igual) | (igual) — nota: si BKL-035/036 mueven "Empresa" a otra ubicación, este texto de ayuda cruzada deberá reescribirse entonces; hoy es correcto | (igual) | (igual) |
| "Empresa" | CompanyProfileView.tsx:715 | referencia al tab "Empresa" dentro del texto guía | (igual) | (igual) | (igual) | "Organización" |
| "Fricciones y oportunidades detectadas" | CompanyProfileView.tsx:725 | SectionLabel | (igual) — ya usa vocabulario de diagnóstico de adopción de IA | (igual) | (igual) | (igual) |
| "Registra los problemas detectados durante las entrevistas." | CompanyProfileView.tsx:727 | texto explicativo | (igual) | (igual) | (igual) | (igual) |
| "Alimentan T4 (priorización) y T6 (governance)." | CompanyProfileView.tsx:728 | texto explicativo (referencia a otros módulos) | (igual) | (igual) | (igual) — referencia interna correcta | "Alimentan los módulos de priorización y gobierno." |
| "{N} registro(s)" | CompanyProfileView.tsx:733 | contador dinámico de fricciones | (igual) | (igual) | (igual) | (igual) |
| "No hay fricciones registradas." | CompanyProfileView.tsx:750 | texto empty state fricciones | (igual) | (igual) | (igual) | (igual) |
| "Se registran durante las entrevistas de diagnóstico." | CompanyProfileView.tsx:751 | texto ayuda empty state fricciones | (igual) | (igual) | (igual) | (igual) |
| "Añadir fricción / oportunidad" | CompanyProfileView.tsx:763 | botón añadir fricción | (igual) | (igual) | (igual) | (igual) |
| "Resumen" | CompanyProfileView.tsx:769 | título del bloque resumen de fricciones (visible si ≥2 fricciones) | (igual) | (igual) | (igual) | (igual) |
| "Alta frecuencia" | CompanyProfileView.tsx:772 | label del resumen | (igual) | (igual) | (igual) | (igual) |
| "Alto impacto" | CompanyProfileView.tsx:776 | label del resumen | (igual) | (igual) | (igual) | (igual) |
| "Registradas" | CompanyProfileView.tsx:780 | label del resumen | (igual) | (igual) | (igual) | (igual) |
| "Sin completar" | CompanyProfileView.tsx:784 | label del resumen | (igual) | (igual) | (igual) | (igual) |
 
### Subcomponente FrictionCard (definido en CompanyProfileView.tsx)
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Fricción / Oportunidad" | CompanyProfileView.tsx:191 | título de cada tarjeta de fricción | (igual) | (igual) | (igual) | (igual) |
| "Eliminar fricción" | CompanyProfileView.tsx:196 | aria-label del botón eliminar | (igual) | (igual) | (igual) | (igual) |
| "Tipo de problema" | CompanyProfileView.tsx:206 | FieldLabel | (igual) | (igual) | (igual) | (igual) |
| "Seleccionar..." | CompanyProfileView.tsx:211 | placeholder select tipo de problema | (igual) | (igual) | (igual) | (igual) |
| "Área funcional" | CompanyProfileView.tsx:215 | FieldLabel | (igual) | (igual) | (igual) | (igual) |
| "Opcional..." | CompanyProfileView.tsx:220 | placeholder select área funcional | (igual) | (igual) | (igual) | (igual) |
| "Frecuencia" | CompanyProfileView.tsx:227 | FieldLabel | (igual) | (igual) | (igual) | (igual) |
| "Impacto" | CompanyProfileView.tsx:240 | FieldLabel | (igual) | (igual) | (igual) | (igual) |
| "Baja" / "Media" / "Alta" | CompanyProfileView.tsx:229 | valores de los chips de frecuencia (ToggleChip) | (igual) | (igual) | (igual) | (igual) |
| "Bajo" / "Medio" / "Alto" | CompanyProfileView.tsx:242 | valores de los chips de impacto (ToggleChip) | (igual) | (igual) | (igual) | (igual) |
| "Notas adicionales" | CompanyProfileView.tsx:253 | FieldLabel | (igual) | (igual) | (igual) | (igual) |
| "Descripción adicional..." | CompanyProfileView.tsx:258 | placeholder textarea notas | (igual) | (igual) | (igual) | (igual) |
 
## DepartmentManager.tsx
 
| Texto original | Ubicación | Contexto | IA | Data | Transformación Digital | Generalización (Gobierno de Proyectos e Iniciativas) |
|---|---|---|---|---|---|---|
| "Cargando departamentos..." | DepartmentManager.tsx:93 | texto loading state | (igual) | (igual) | (igual) | (igual) |
| "{dept.name}" | DepartmentManager.tsx:104 | nombre de cada chip de departamento (dato, no literal fijo) | (igual) | (igual) | (igual) | (igual) |
| "Eliminar {dept.name}" | DepartmentManager.tsx:109 | aria-label dinámico del botón eliminar por chip | (igual) | (igual) | (igual) | (igual) |
| "Sin departamentos configurados. Añade los departamentos de esta empresa para que estén disponibles en T2, T3, T4 y T8." | DepartmentManager.tsx:123 | texto empty state | (igual) | (igual) — describe correctamente el alcance del dato (company_id) y su reutilización en otros módulos | (igual) | "Sin departamentos configurados. Añade los departamentos de esta organización para que estén disponibles en los módulos relacionados." |
| "Nombre del departamento..." | DepartmentManager.tsx:138 | placeholder del input de alta | (igual) | (igual) | (igual) | (igual) |
| "Añadir" | DepartmentManager.tsx:170 | texto del botón de alta de departamento | (igual) | (igual) | (igual) | (igual) |
| "{activeError}" | DepartmentManager.tsx:177 | mensaje de error dinámico (store o local) | (igual) | (igual) | (igual) | (igual) |
 
## Engagement/store.ts
 
Confirmado: es exclusivamente lógica de estado (zustand store), sin JSX ni render de UI. No contiene ningún texto visible al usuario — solo mensajes de `console.debug` / `console.warn` / `console.error` para depuración interna (no llegan al usuario final). Excluido de la extracción según instrucción de la lista maestra. Sin filas de tabla (0 textos); IA, Data y DT coinciden en que no aplica revisión de dominio.
 
---
 
## Nota sobre BKL-035/036
 
El componente `CompanyProfileView.tsx` mezcla claramente dos dominios que el backlog propone separar:
 
**Contenido de EMPRESA** (candidato a mover al menú de usuario / nivel `company_id`, inmutable entre proyectos):
- Tab "Empresa" completo: "Datos de la empresa" (Sector, Tamaño de empresa) y "Departamentos de la empresa" (todo `DepartmentManager.tsx`).
- Textos que ya declaran explícitamente esta naturaleza: "Información permanente de la empresa, compartida entre todos sus proyectos." y "Lista centralizada compartida entre todos los proyectos."
- El nombre de empresa mostrado en el header ("{companyName}") y el botón/flujo "Guardar empresa".
- Permisos: todo este bloque ya está condicionado por `canEditCompanySettings`, lo cual facilita aislarlo como una pantalla de configuración de empresa independiente.
**Contenido de PROYECTO** (debe quedarse en, o pasar a, "Configuración del proyecto"):
- Tab "Contexto del proyecto" completo: nombre del proyecto, objetivo principal con IA, horizonte esperado de valor, ecosistema tecnológico, restricciones relevantes, departamentos implicados (selección desde los departamentos de empresa), y todo el bloque de "Fricciones y oportunidades detectadas" (incluye FrictionCard y el resumen agregado).
- El botón "Guardar contexto" y sus estados de guardado ("Guardado {fecha}", "Cambios sin guardar").
- El guard "Selecciona un proyecto" (empty state sin engagement activo) es lógica de nivel proyecto y debería mantenerse en el nuevo "Configuración del proyecto", no en el perfil de empresa movido al menú de usuario.
**Dependencia cruzada a vigilar en la migración:** el tab "Proyecto" depende de los departamentos cargados en el tab "Empresa" (mensaje "Configura primero los departamentos en la pestaña Empresa"). Si BKL-035/036 separan estas pantallas en ubicaciones distintas (menú de usuario vs. sidebar), este mensaje de ayuda cruzada deberá reescribirse para indicar la nueva ubicación de "Empresa", y el flujo de carga de `fetchDepartments(companyId)` deberá seguir disponible desde "Configuración del proyecto" aunque la gestión CRUD de departamentos viva en la nueva pantalla de empresa.
 
También revisar los textos de ayuda que referencian módulos T2/T3/T4/T8/T6 ("Disponible como selector en T2, T3, T4 y T8.", "Alimentan T4 (priorización) y T6 (governance).") — son válidos independientemente de dónde se ubique la pantalla, pero conviene confirmarlos tras el rediseño de navegación.
 
Engagement/store.ts no requiere ningún cambio de textos porque no contiene UI; solo gestiona `activeEngagementId`, que seguirá siendo necesario para "Configuración del proyecto" tal como hoy lo es para el tab "Proyecto".
 
## Notas de los expertos
 
**IA Adoption:** Los 54 textos son mayoritariamente administrativos/genéricos (loading, guardado, errores, labels de formulario) y no requieren adaptación al dominio IA Adoption: ya usan el vocabulario correcto donde corresponde (ej. "Objetivo principal con IA", "Ecosistema tecnológico principal", "Fricciones y oportunidades detectadas", referencias a T2/T3/T4/T6/T8). No se propone ningún cambio de texto (0 de 54 con IA distinta de "(igual)"); el único punto de atención de dominio es "Perfil de Empresa", ya cubierto por BKL-036 como cambio de IA (arquitectura de información), no de contenido.
 
**Transformación Digital:** Los 54 textos son en su mayoría genéricos de UI (labels, placeholders, estados de guardado, mensajes de error/carga) sin terminología específica del dominio Transformación Digital que requiera ajuste. Se revisó con especial atención "Perfil de Empresa" (única aparición terminológica de dominio relevante, ligada al rediseño funcional BKL-036, no a un problema de redacción) y las referencias cruzadas a herramientas (T2, T3, T4, T6, T8), que son correctas y consistentes con la numeración del sidebar. No se detectó ningún texto que requiera reescritura de dominio.
 
**Gobierno de Datos (ROL-29) — BORRADOR NO CONFIRMADO:** Este bloque de revisión es una propuesta desde la óptica de Gobierno de Datos y no ha sido validado ni aprobado. Todas las entradas marcadas "(igual)" se consideran correctas respecto al modelo de datos actual (`company_id` vs `engagement_id`); las observaciones señaladas (título "Perfil de Empresa" ante una eventual división de pantallas, y el texto de ayuda cruzada "Configura primero los departamentos...") requieren seguimiento tras la ejecución de BKL-035/BKL-036.
 
**Gobierno de Proyectos e Iniciativas (nueva columna) — BORRADOR NO CONFIRMADO:** La mayoría de los 54 textos son ya agnósticos de dominio (loading, guardado, errores, labels genéricos de formulario) y no requieren cambio para una herramienta genérica de gobierno de proyectos. Los términos específicos de "empresa" se generalizan a "organización" y los de "proyecto" a "iniciativa", manteniendo la distinción de dos niveles de datos (organización compartida vs. iniciativa concreta), que es exactamente el patrón que necesita cualquier dominio, no solo IA Adoption. Términos propios del dominio IA (p. ej. "Objetivo principal con IA", "Ecosistema tecnológico principal") se generalizan a conceptos neutros de gestión ("objetivo principal de la iniciativa", "ecosistema o entorno principal") sin perder la intención original del campo. Las referencias cruzadas a módulos concretos (T2, T3, T4, T6, T8) se generalizan a "módulos relacionados" para no atar el texto a una numeración de sidebar específica de esta implementación. No se requiere ningún cambio estructural: la generalización es puramente léxica y compatible con el modelo de datos actual (`company_id`/`engagement_id` pueden renombrarse conceptualmente a `organization_id`/`initiative_id` sin impacto en este documento). Pendiente de validación por Carlos antes de aplicarse al código.