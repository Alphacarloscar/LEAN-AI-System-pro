# BACKLOG DE DESARROLLO — L.E.A.N. AI System

Documento vivo. Sprints se actualizan al cierre de cada uno.
Última actualización: 2026-04-18

---

## Visión general

El desarrollo se organiza en sprints temáticos, no en sprints de tiempo fijo. El ritmo es Carlos+Claude trabajando casi a diario. La duración estimada de cada sprint es orientativa; lo que cierra el sprint son los criterios de éxito, no el calendario.

Cada sprint produce: (a) código que se merge a `develop`, (b) documentación de decisiones en `DECISIONES_ESTRATEGICAS.md`, (c) actualización del system prompt si aparecen elementos transversales.

**Filosofía:** producción estable + desarrollo evolutivo. Solo lo testeado pasa de `develop` a `main` y por tanto al MVP que ven los clientes.

---

## Sprint 0 — Arquitectura (CERRADO 2026-04-19)

**Objetivo:** desbloquear todo el desarrollo posterior con decisiones técnicas firmes y documentadas.

**Entregables completados:**
1. ✓ Modelo de datos Supabase: entidades, relaciones, claves, multi-tenancy vía RLS. Documentado en `ARQUITECTURA.md` sección 4.
2. ✓ Grafo de dependencias T1-T13 con hard/soft deps + snapshot con versionado. Sección 8.
3. ✓ Stack frontend: React + Vite + Tailwind + TypeScript + Recharts + SheetJS. Sección 3.
4. ✓ Plan de modularización: migración incremental herramienta por herramienta. Sección 9.
5. ✓ Workflow GitHub→Vercel→Supabase sin CLI. Sección 6.
6. ✓ Separación prod/dev a 3 niveles (Supabase × 2, Vercel × 2, ramas main/develop). Sección 6.
7. ✓ Identidad: 5 arquetipos con MFA universal. Sección 2 (D7) + Sección 4.
8. ✓ Sistema de diseño completo: tokens, paleta, tipografía Inter, componentes atómicos. Sección 7 (D9).
9. ✓ Documento `ARQUITECTURA.md` generado en la raíz del proyecto.

**Criterios de éxito alcanzados:**
- 9 decisiones técnicas cerradas (D1-D9) con justificación documentada.
- Cero decisiones arquitectónicas bloqueantes pendientes.
- ARQUITECTURA.md como source of truth.

---

## Sprint 0.5 — Sistema de diseño (PRÓXIMO)

**Objetivo:** construir el sistema de diseño antes de tocar ninguna herramienta. Garantiza consistencia visual en las 13.

**Duración estimada:** 4-5 días Carlos+Claude.

**Entregables:**
1. Scaffolding inicial del repo: Vite + React 18 + TypeScript + Tailwind configurados.
2. `tailwind.config.ts` con todos los design tokens (paleta metálica + pastel funcional + grises + tipografía Inter con escala de pesos).
3. Integración de Inter vía `@fontsource/inter` (self-hosted).
4. Componentes atómicos en `src/shared/design-system/components/`: Button, Input, Textarea, Select, Checkbox, Radio, Switch, Card, Panel, Modal, Drawer, Badge, Tag, Avatar, Alert, Toast, Table, Tabs, Accordion, Breadcrumb, Stepper, Skeleton.
5. `ChartWrapper` de Recharts con tokens aplicados (base para T1 radar, T2 burbujas, T7 heatmap, T10 dashboards).
6. `MetricHero` (número grande estilo Whoop) para dashboards y portadas ejecutivas.
7. `PrintLayout` con paleta plana para exports PDF.
8. Storybook desplegado en Vercel preview con todos los componentes navegables.
9. `MainLayout` con sidebar + toggle dark/light persistente.
10. Routing skeleton con `ProtectedRoute` + `RoleGate` (sin herramientas conectadas).

**Criterios de éxito:**
- Storybook accesible en URL Vercel con todos los componentes visibles.
- Carlos aprueba visualmente el Storybook ("¿lo enseñaría a un CIO sin avergonzarme?").
- Componentes cumplen contraste WCAG AA verificable.
- Export PDF de prueba con paleta plana funciona en cualquier impresora.
- Modo dark funcional como toggle, modo light por defecto.

**No incluye:** lógica de negocio, herramientas T1-T13, conexión completa a Supabase (solo cliente configurado + login placeholder).

---

## Sprint 1 — Migración fundacional + T1 MVP (CERRADO PARCIAL 2026-04-21)

**Objetivo:** convertir el HTML monolítico en arquitectura modular. T1 construido y funcional. QW1 UI lista.

**Entregables completados:**
1. ✓ Esqueleto modular desplegado en Vercel (entorno dev).
2. ✓ T1 AI Maturity Radar: gráfico radar, tabs B1/B2/B3/Dashboard/Reporte CIO, Supabase conectado.
3. ✓ QW1 Executive Briefing Pack: UI funcional (datos reales Supabase pendiente → Sprint 2 P2).

**Pendiente → pasa a Sprint 2:**
- T2, T3: no construidos. Redefinidos con contratos nuevos.
- CompanyProfile: extraído de T1, pasa a ser módulo standalone en Sprint 2.

---

## Sprint 2 — Fase Listen MVP Completa (ACTIVO 2026-04-21)

**Objetivo:** completar la Fase Listen del L.E.A.N. AI System en modo MVP funcional. Al cierre, un consultor Alpha puede ejecutar un engagement real de Fase Listen end-to-end sin workarounds técnicos.

**Foco:** MVP completo de las 3 herramientas + módulos de soporte. No demo-first — producto funcional primero.

**Entregables P0:**
1. **CompanyProfile** — módulo standalone desde menú principal. Campos: sector, ecosistema tecnológico, tamaño, objetivo, restricciones, áreas prioritarias. Editable en cualquier momento del engagement. Tabla `company_profiles` en Supabase.
2. **CompanyProfile — sección Fricciones** — registro de fricciones y oportunidades (tipo, área, frecuencia, impacto, notas). Añadible desde T1 y desde CompanyProfile directamente.
3. **Login screen** — pantalla de autenticación con 5 roles (Supabase Auth).
4. **MainLayout — menú persistente** — visible en todo momento, dentro y fuera de herramientas.
5. **T1 refinamientos** (5 mejoras):
   - Nueva entrevista: drawer lateral + vista lista/tabla escalable (hasta 100+ entrevistados).
   - Acordeones contraídos por defecto.
   - Colores IT vs Negocio claramente diferenciados en radar.
   - Mensaje dinámico de gap IT/Negocio (rule-based, 4-5 rangos, con pasos accionables).
   - Barras de puntuación AI Readiness 2px más finas.
6. **T2 AI Stakeholder Matrix** — construcción nueva:
   - 5 arquetipos: Adoptador, Ambassador, Decisor, Crítico, Especialista.
   - Modificador de resistencia (Baja/Media/Alta) aplicable a cualquier arquetipo.
   - Entrevista de 5 preguntas → auto-asignación de arquetipo.
   - Pantalla única: distribución por departamento (izquierda) + panel lateral individual (derecha).
   - Recomendaciones de intervención dinámicas por arquetipo + resistencia.
   - Conexión Supabase.

**Entregables P1:**
7. **T3 AI Value Stream Map** — construcción nueva:
   - Contrato output hacia T4 definido antes de codificar (campos: casos, eficiencia, áreas, lead time, wastes).
   - Formulario multi-tab: Datos / Entrevista / Etapas / Waste & Blockers.
   - Visualización VSM: cards horizontales por etapa, métricas superiores, indicador de estado del flujo.
   - Portfolio de iniciativas priorizado.
   - Resumen ejecutivo auto-generado.
   - Recomendaciones dinámicas rule-based.
   - Conexión Supabase + output hacia T4 via `context_refs`.

**Entregables P2 (stretch):**
8. **QW1 datos reales** — conectar Executive Briefing Pack a Supabase (UI ya existe).

**Criterios de éxito:**
- CompanyProfile, T1, T2 y T3 leen y escriben en Supabase dev.
- Un consultor Alpha ejecuta Fase Listen completa sin bugs bloqueantes ni workarounds.
- T3 expone output contract legible para T4 (próximo sprint).
- Design system aplicado consistentemente en los 3 tools + módulos.

**Estimación:** 25-30 sesiones Carlos+Claude. 3-4 semanas.
**Documento detallado:** `SPRINT_2_FASE_LISTEN.md`

---

## Sprint 3 — Fase Evaluate (T4, T5, T6)

**Objetivo:** completar la fase Evaluate con sus 3 herramientas conectadas al ecosistema.

**Entregables:**
1. T4 Use Case Prioritization Board:
   - Score compuesto + cuadrante de decisión.
   - Lectura de inputs desde T3 (output contract) y T5 (categorías priorizadas).
2. T5 AI Taxonomy Canvas:
   - 7 categorías evaluadas por prioridad/readiness/riesgo.
   - Output legible para CIO y Consejo.
3. T6 AI Risk & Governance Canvas:
   - AI Policy + risk register + catálogo aprobado.
   - **Quick Win QW2 (Shadow AI Scan)** instrumentado.
4. Mapping T6 ↔ ISO 42001 (preparación para T13).
5. **Quick Win QW3 y QW4 instrumentados:** Top 5 casos con ROI + Licence Waste Report.

**Criterios de éxito:**
- T4 y T5 consumen `context_refs` de T1-T3 sin dependencias directas entre módulos.
- T6 cubre controles mínimos requeridos por AI Act.
- QW3 y QW4 generan outputs sin intervención técnica de Carlos.

---

## Sprint 3 — Fase Activate (T7, T8, T9)

**Objetivo:** completar la fase Activate y conectar el sistema de comunicación.

**Entregables:**
1. T7 AI Adoption Heatmap:
   - Heatmap por área × arquetipo × herramienta.
   - 4 palancas de activación operativas.
2. T8 AI Communication Map:
   - Kits Top-down (Comité, managers) y Bottom-up (feedback).
   - **Quick Win QW6** (kits auto-generados) instrumentado.
3. T9 AI Roadmap 6M:
   - Ingesta de outputs de T2-T8 vía `context_refs`.
   - Roadmap visual ejecutivo + operativo.
4. Diseño UX del modo dual (consultor vs PM cliente vs viewer C-suite).
5. **Quick Win QW5** (piloto simbólico) — diseño del workflow para arrancar pilotos desde la herramienta.

**Criterios de éxito:**
- T8 produce kits comunicacionales sin reescritura manual.
- T9 muestra un Gantt útil para Comité de Dirección.
- El modo dual está implementado funcionalmente, no solo diseñado.

---

## Sprint 4 — Fase Normalize + ISO 42001 (T10, T11, T12, T13)

**Objetivo:** cerrar la metodología completa y habilitar la propuesta ISO 42001.

**Entregables:**
1. T10 AI Value Dashboard:
   - 4 dimensiones (adopción, valor, gobierno, productividad).
   - **Quick Win QW7** instrumentado.
2. T11 AI Operating Rhythm:
   - Daily/Weekly/Monthly/Quarterly templates.
   - Roles, agendas, formato de actas, escalado.
3. T12 AI Backlog Board:
   - **Quick Win QW8** instrumentado.
   - Punto central del servicio Managed Service post-proyecto.
4. T13 AI System Impact Assessment:
   - Plantilla ISO 42001 completa.
   - Mapping ~78% del AIMS desde outputs T1-T12.
5. Capa de acceso condicional por tipología de empresa × madurez × rol.

**Criterios de éxito:**
- Sprint completo de cliente puede ejecutarse end-to-end en la herramienta.
- T13 produce un AIMS auditable por una certificadora externa.
- Acceso condicional habilita/deshabilita herramientas según perfil.

---

## Sprint 5 — Motor IA dinámico

**Objetivo:** sustituir el rule-based estático por un motor de recomendaciones dinámico, capaz de generar propuestas accionables a partir del contexto del cliente.

**Entregables:**
1. Arquitectura del motor IA: capa que lee el estado del cliente desde Supabase y genera recomendaciones por herramienta.
2. Integración con LLM (provider y modelo a definir).
3. Loop de feedback: el usuario marca recomendaciones útiles/no útiles, el sistema aprende.
4. Migración de las 13 herramientas para consumir el motor en lugar de reglas estáticas.
5. Capa de facilitación IA para vía SaaS: entrevistas guiadas, auto-clasificación de arquetipos.

**Criterios de éxito:**
- Una empresa media obtiene 5+ recomendaciones específicas, accionables y diferentes de otra empresa con perfil distinto.
- Las recomendaciones son aceptables para CIO sin retoque manual del consultor.
- Coste por recomendación dentro de presupuesto sostenible para SaaS.

---

## Sprint 6 — Beta SaaS asistido

**Objetivo:** lanzar versión SaaS asistido con 2-3 clientes friendly.

**Entregables:**
1. Onboarding del PM cliente (formación incluida).
2. Multi-tenancy probado en producción con clientes reales.
3. Pricing y packaging "Tool + Training" definidos y ofrecidos.
4. Materiales de formación para certificación inicial de PMs.
5. Loop de feedback de mercado integrado.

**Criterios de éxito:**
- 2-3 clientes activos usando SaaS asistido sin soporte diario de Alpha.
- Recurrencia mensual real (no solo onboarding).
- Datos suficientes para iterar pricing y packaging.

---

## Iniciativas paralelas (no sprint-bound)

Estas no son secuenciales — corren en paralelo según oportunidad:

- **Recolección sistemática de feedback CIO:** seguir entrevistas (Javier+Susana, Pep, otros). Cada entrevista actualiza `MEMORIA` y puede generar nuevos quick wins.
- **BBDD de feedback de mercado:** registro estructurado para alimentar la decisión futura sobre el cambio de paradigma a plataforma multi-framework.
- **Materiales comerciales:** pitch deck, one-pagers, casos de uso. Generados por chats de área [ESTRATEGIA-PRODUCTO] y [CONTENIDO & MERCADO].
- **Pricing:** definición urgente bloqueante para cierre de ventas. Chat dedicado.

---

## Convenciones del backlog

- Cada herramienta T1-T13 vive como módulo independiente con su propia carpeta en el repo.
- Cada herramienta tiene un `README` interno: inputs esperados, outputs producidos, dependencias.
- Cambios en estructura del Excel "Descripción Detallada por Herramienta" generan un PR de actualización del módulo correspondiente.
- Quick wins están taggeados en código (`// QW4-LICENSE-WASTE`) para trazabilidad.
