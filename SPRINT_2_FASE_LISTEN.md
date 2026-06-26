# SPRINT 2 — FASE LISTEN MVP COMPLETA

**Documento generado:** 2026-04-21  
**Estado:** Activo  
**Área:** [PRODUCTO] + [OPERACIONES]

---

## Objetivo del Sprint

Completar la Fase Listen del L.E.A.N. AI System en modo MVP funcional: CompanyProfile como módulo standalone, T1 finalizado con todos sus refinamientos, T2 construido desde cero, y T3 migrado y terminado. Al cierre del sprint, un consultor Alpha debe poder ejecutar un engagement real de Fase Listen end-to-end sin workarounds técnicos.

**Sprint goal en una frase:**
> Un consultor Alpha puede completar la Fase Listen completa —desde el contexto inicial hasta el VSM del primer caso de uso— con datos reales en Supabase, sin intervención técnica.

---

## Equipo y Capacidad

| Ejecutor | Rol | Disponibilidad |
|----------|-----|----------------|
| Carlos | Revisión, decisiones de producto, aprobación visual | Sesiones diarias |
| Claude | Arquitectura, código, deploy, documentación | Sesiones diarias |

**Unidad de estimación:** sesiones de trabajo (≈ 2-4h productivas cada una).  
**Capacidad estimada:** 15-20 sesiones en 3-4 semanas.  
**Buffer planificado:** 20% — no se llena el 100% de la capacidad. T3 tiene riesgo de overrun.

---

## Dependencias Críticas (orden de construcción)

```
CompanyProfile ──────────────────────────────┐
Login screen (paralelo)                       │
T1 refinements (paralelo)                     ├──→ T2 ──→ T3 ──→ QW1 data
T3 output contract (definir ANTES de T3)  ────┘
```

**Regla:** CompanyProfile debe estar funcional antes de empezar T2 o T3. Ambas leen `company_profile_id` vía `context_refs`.

---

## Backlog del Sprint

### P0 — Debe entregarse (bloquea todo lo demás)

| # | Ítem | Descripción | Estimación | Dependencias |
|---|------|-------------|------------|--------------|
| 1 | **CompanyProfile — módulo standalone** | Módulo accesible desde menú principal. Campos: sector, ecosistema tecnológico (suite principal), tamaño empresa, horizonte esperado de valor, objetivo principal con IA, ecosistema tecnológico, restricciones relevantes, áreas prioritarias de negocio. Editable en cualquier momento del engagement. Conexión Supabase: tabla `company_profiles` con FK a `engagement_id`. | 3 sesiones | Ninguna |
| 2 | **CompanyProfile — sección Fricciones** | Registro de fricciones y oportunidades dentro de CompanyProfile. Campos por fricción: tipo de problema, área funcional, frecuencia (Baja/Media/Alta), impacto (Bajo/Medio/Alto), notas. Añadible desde T1 durante entrevistas y editable directamente desde CompanyProfile. | 1 sesión | #1 |
| 3 | **Login screen** | Pantalla de autenticación con email + password. Roles: consultor_alpha, pm_cliente, viewer_csuite, admin_alpha, superadmin. Supabase Auth. Redirect post-login a dashboard principal. | 1 sesión | Ninguna |
| 4 | **MainLayout — menú persistente** | El toggle de navegación visible en todo momento, independientemente de qué herramienta esté activa. Cambio en `MainLayout.tsx` — aplica a todas las herramientas automáticamente. | 0.5 sesiones | Ninguna |

### P0 — T1 Refinamientos (ya construido, necesita finalización)

| # | Ítem | Descripción | Estimación | Dependencias |
|---|------|-------------|------------|--------------|
| 5 | **T1: Nueva entrevista + vista escalable** | Botón "Nueva entrevista" que abre drawer lateral. Vista por defecto: tabla/lista compacta con nombre, rol, arquetipo asignado, fecha, estado. Vista expandida al hacer click en un individuo. Escala a 100+ entrevistados sin coste de UX. | 1.5 sesiones | Ninguna |
| 6 | **T1: Acordeones contraídos por defecto** | Todos los acordeones de T1 en estado colapsado al cargar la herramienta. | 0.5 sesiones | Ninguna |
| 7 | **T1: Diferenciación de color IT vs Negocio** | Mayor contraste entre las líneas de datos de IT y Negocio en el radar. Colores claramente distinguibles (no solo sutilmente distintos). Actualizar design token correspondiente. | 0.5 sesiones | Ninguna |
| 8 | **T1: Mensaje dinámico de gap IT/Negocio** | Mensaje generado en base a la distancia del gap. Rule-based con 4-5 rangos definidos. Debe incluir: diagnóstico del patrón, riesgo asociado, pasos accionables. Ejemplo: gap IT>Negocio en +2pts → "IT está avanzando sin demanda interna validada — riesgo: bajo adoption rate en pilotos. Pasos: 1) identificar champions en negocio, 2) co-diseñar primer caso de uso con área prioritaria." | 1 sesión | Ninguna |
| 9 | **T1: Barras de puntuación más finas** | Reducir altura de progress bars en sección AI Readiness en ~2px. Si el componente es del design system compartido, verificar impacto en otras herramientas. | 0.5 sesiones | Ninguna |

### P0 — T2 AI Stakeholder Matrix (construcción nueva)

| # | Ítem | Descripción | Estimación | Dependencias |
|---|------|-------------|------------|--------------|
| 10 | **T2: Framework de arquetipos** | Implementar los 5 arquetipos nuevos y deprecar los anteriores. Arquetipos: Adoptador, Ambassador, Decisor, Crítico, Especialista. Modificador de resistencia: Baja / Media / Alta — aplicable a cualquier arquetipo. "Decisor + Resistencia Alta" es el perfil de mayor riesgo → alerta visual + recomendaciones específicas. | 0.5 sesiones | Ninguna |
| 11 | **T2: Entrevista de 5 preguntas → auto-asignación** | Flujo de 5 preguntas que evalúan: percepción de IA, impacto del cambio, autoconocimiento IA, nivel de influencia, disposición a participar. Sistema de scoring que asigna arquetipo primario + nivel de resistencia automáticamente. El consultor puede ajustar manualmente si el algoritmo no coincide con lo observado. | 2 sesiones | #10 |
| 12 | **T2: Matriz visual — vista departamento** | Zona izquierda: distribución por departamento con distribución de arquetipos y niveles de resistencia. Mantiene estética circular/sectorial del legacy adaptada al sistema de diseño actual (paleta metálica, Inter). Zona derecha: panel lateral reactivo al click en stakeholder individual — muestra arquetipo, scores, razonamiento de clasificación y recomendaciones de intervención. Sin tabs separados: todo en una pantalla. | 2.5 sesiones | #11 |
| 13 | **T2: Recomendaciones de intervención dinámicas** | Por arquetipo + nivel de resistencia: recomendaciones específicas para el responsable del stakeholder. Ejemplos: Adoptador → "Formación general + acceso temprano a herramientas piloto"; Decisor/Resistencia Alta → "Sesión 1:1 con sponsor ejecutivo antes de cualquier piloto, quick win visible en su área en <30 días". Rule-based para MVP. | 1 sesión | #12 |
| 14 | **T2: Botones y persistencia Supabase** | Botones: Nueva entrevista, Guardar, Editar stakeholder. Lectura de `company_profile_id` del engagement activo. Escritura de stakeholders y resultados de entrevista en Supabase. | 1 sesión | #12 |

### P1 — T3 AI Value Stream Map (construcción nueva)

| # | Ítem | Descripción | Estimación | Dependencias |
|---|------|-------------|------------|--------------|
| 15 | **T3: Contrato de output hacia T4** | Definir antes de codificar qué campos expone T3 hacia T4 vía `context_refs`: casos de uso registrados, score de eficiencia por caso, áreas involucradas, lead time total, número de etapas, wastes y blockers identificados. Documentar en `ARQUITECTURA.md`. | 0.5 sesiones | Ninguna |
| 16 | **T3: Registro de caso — formulario multi-tab** | Tab "Datos": título, departamento, responsable de proceso, sponsor ejecutivo, rol, fase de madurez, prioridad, objetivo de negocio, problema a resolver. Tab "Entrevista": preguntas de descubrimiento del proceso. Tab "Etapas": añadir/editar etapas del flujo (nombre, tiempo de proceso, tiempo de espera, responsable, handoffs). Tab "Waste & Blockers": registro de desperdicios Lean y bloqueantes por etapa. | 2 sesiones | #15 |
| 17 | **T3: Visualización VSM por caso** | Vista visual de etapas en horizontal: cards por etapa con PROCESO/ESPERA, handoffs, marcadores de cuello de botella. Métricas superiores: Lead Time total, Proc. time, Espera, Eficiencia %, Wastes, Blockers. Indicador de estado del flujo (Saludable / Mejorable / Crítico) basado en eficiencia. Mantiene estética del legacy adaptada al sistema de diseño. | 3 sesiones | #16 |
| 18 | **T3: Portfolio de iniciativas** | Vista agregada de todos los casos registrados en el engagement. Ordenado por prioridad. Muestra KPIs clave por caso: eficiencia, lead time, estado. Permite navegar a cada caso individual. | 1 sesión | #16 |
| 19 | **T3: Resumen ejecutivo** | Vista auto-generada con: número de casos documentados, eficiencia media del portfolio, top 3 cuellos de botella, top 3 oportunidades de mejora con IA. Para presentación directa a CIO. | 1 sesión | #18 |
| 20 | **T3: Recomendaciones dinámicas automáticas** | Rule-based: si eficiencia < 50% → "Priorizar reducción de tiempos de espera antes de automatizar"; si handoffs > 5 → "Simplificar flujo antes del piloto IA"; si blockers > 0 → "Resolver bloqueos estructurales primero". Mínimo 3 reglas operativas para MVP. | 1 sesión | #17 |
| 21 | **T3: Botones y persistencia Supabase** | Botones: Nuevo caso, Guardar datos, Añadir etapa, Ver VSM. Escritura en Supabase. Output contract expuesto vía `context_refs` para T4. | 1 sesión | #17 |

### P2 — Stretch (si queda capacidad)

| # | Ítem | Descripción | Estimación | Dependencias |
|---|------|-------------|------------|--------------|
| 22 | **QW1: Conexión a datos reales Supabase** | El Executive Briefing Pack (ya construido visualmente) lee datos reales del engagement activo desde Supabase. Top 3 fortalezas/mejoras calculadas dinámicamente. Brecha IT/Negocio desde datos de entrevistas reales. | 1 sesión | T1, T2 en Supabase |

---

## Resumen de Carga

| Prioridad | Ítems | Sesiones estimadas |
|-----------|-------|--------------------|
| P0 — Foundational | 4 ítems | 5 sesiones |
| P0 — T1 refinements | 5 ítems | 4 sesiones |
| P0 — T2 | 5 ítems | 7 sesiones |
| P1 — T3 | 7 ítems | 9.5 sesiones |
| P2 — QW1 | 1 ítem | 1 sesión |
| **Total P0+P1** | **21 ítems** | **~25.5 sesiones** |

> **Nota de honestidad:** esto es ambicioso para 3-4 semanas. Si T3 se extiende (riesgo real — es la pieza más compleja), QW1 pasa al siguiente sprint. T2 y T3 no pueden salir a medias — es preferible entregar T2 completo y T3 al 80% que los dos al 60%.

---

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| T3 VSM visual más complejo de lo estimado | Sprint no cierra T3 | Priorizar formulario + VSM básico; portfolio y resumen ejecutivo como P1.5 |
| Calibración de 5 preguntas T2 produce arquetipos incorrectos | Motor de recomendaciones falla en casos reales | Testear con datos de Javier y Pep antes de cerrar T2 |
| CompanyProfile schema requiere migración Supabase no planificada | Bloquea T2 y T3 | Diseñar schema completo de `company_profiles` antes de escribir código |
| Scope creep durante construcción | Sprint no cierra nada bien | Cualquier mejora no en este doc → va al backlog del siguiente sprint, no al actual |

---

## Definición de Done (por herramienta)

- [ ] Funcional sin bugs bloqueantes en flujo principal
- [ ] Lee y escribe desde Supabase (entorno dev)
- [ ] Un consultor Alpha puede completar un ciclo real sin workarounds
- [ ] Sigue design system: tokens, Inter, dark mode, 12px radius
- [ ] Código mergeado a rama `develop`
- [ ] Desplegado en Vercel dev y accesible en URL

---

## Fechas Clave (orientativas — sprint cierra por criterios, no por calendario)

| Hito | Criterio de cierre |
|------|-------------------|
| Semana 1 | CompanyProfile + Login + T1 refinements completos |
| Semana 2 | T2 funcional end-to-end con Supabase |
| Semana 3-4 | T3 completo o avanzado al 80% |
| Cierre sprint | Consultor Alpha ejecuta Fase Listen real sin bugs bloqueantes |

---

## Carryover del Sprint Anterior

| Ítem | Estado | Acción |
|------|--------|--------|
| T1 AI Maturity Radar | Construido, necesita 5 refinamientos | Incluido en P0 de este sprint |
| QW1 Executive Briefing Pack (UI) | UI funcional, sin datos reales Supabase | En P2 de este sprint |
| CompanyProfile (en T1 legacy) | Extraído y convertido a módulo standalone | En P0 de este sprint |

---

## Notas de Arquitectura

- `company_profiles`: tabla propia con FK a `engagement_id`. Campos base + JSONB para campos adicionales por engagement. Versionado simple: `updated_at`, sin historial complejo en MVP.
- `friction_register`: tabla hija de `company_profiles`. Campos: tipo, área_funcional, frecuencia, impacto, notas, `company_profile_id`.
- `stakeholders`: tabla con FK a `engagement_id`. Campos: nombre, rol, departamento, arquetipo, resistencia, scores JSONB, respuestas_entrevista JSONB.
- `vsm_cases`: tabla con FK a `engagement_id`. Campos: datos generales + JSONB para etapas y wastes. Output hacia T4 expuesto vía view o función Supabase.
- Todos los módulos consumen `company_profile_id` del contexto del engagement activo — nunca hacen JOIN directo a T1.
