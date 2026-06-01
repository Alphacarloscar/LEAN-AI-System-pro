# Glosario — L.E.A.N. AI System Enterprise

Última actualización: 2026-06-01
AI-Ready Repository System v2.1.0

> Términos de dominio del producto. Toda la IA que trabaje en este repositorio
> debe usar estos términos de forma consistente en código, comentarios y documentación.
> Idioma del código y comentarios: inglés. Idioma de interacción con Carlos: español.

---

## Metodología L.E.A.N.

### Fases del sprint (6 meses)

| Fase | Nombre | Semanas | Objetivo |
|------|--------|---------|---------|
| **L** | Listen (Escucha) | 1-3 | Diagnóstico de madurez IA + identificación de stakeholders y fricciones |
| **E** | Explore (Exploración) | 4-8 | Priorización de casos de uso + gobierno de riesgos |
| **A** | Act (Acción) | 9-16 | Implementación de pilotos + comunicación ejecutiva |
| **N** | Navigate (Navegación) | 17-24 | Medición de valor + ritmo operativo sostenible |

### Herramientas (Tools T1-T13)

| Tool | Nombre | Fase | Input | Output principal |
|------|--------|------|-------|----------------|
| **T1** | Maturity Radar | L | Entrevistas directivos | Score de madurez IA por dimensión |
| **T2** | Stakeholder Matrix | L | Inventario de personas clave | Cuadrante poder/adopción + Licence Waste |
| **T3** | Value Stream Map | L | Procesos de la empresa | Mapa de procesos con fricciones IA identificadas |
| **T4** | Use Case Priority Board | E | T1+T2+T3 | Top 5 casos de uso priorizados por ROI/viabilidad |
| **T5** | AI Taxonomy Canvas | E | Inventario de herramientas IA | Canvas departamento × dominio de IA |
| **T6** | Risk & Governance | E | Perfil empresa + T4+T5 | Política IA corporativa (LLM) + ISO 42001 gaps |
| **T7** | Adoption Heatmap | A | Datos de uso piloto | Heatmap de adopción por departamento/rol |
| **T8** | Communication Map | A | T7 + contexto ejecutivo | Kits de comunicación por audiencia |
| **T9** | AI Roadmap | A | T4+T6+T7 | Roadmap de iniciativas IA con milestones |
| **T10** | AI Value Dashboard | N | Todos los anteriores | Dashboard ejecutivo de valor IA generado |
| **T11** | Operating Rhythm | N | T9+T10 | Rituales de seguimiento y governance periódica |
| **T12** | ISO Assessment | N | T6 + contexto regulatorio | Evaluación ISO 42001 completa |
| **T13** | *(pendiente de definición)* | N | — | — |

### Quick Wins (QW)

Los quick wins son outputs de alto valor visible para el C-suite, generados automáticamente en < 48h tras datos suficientes:

| QW | Herramienta | Entregable | Fase |
|----|------------|-----------|------|
| QW1 | T1 | Executive Briefing Pack (PDF 2 páginas) | L |
| QW2 | T6 | Shadow AI Scan — lista de herramientas IA no aprobadas | L |
| QW3 | T4 | Top 5 casos de uso con ROI estimado | E |
| QW4 | T2 | Licence Waste Report | E |
| QW5 | T7+T9 | Piloto simbólico lanzado | A |
| QW6 | T8 | Kits de comunicación ejecutiva auto-generados | A |

---

## Arquetipos de Stakeholder

Los 5 arquetipos de stakeholder del cliente (usados en T2 para clasificar personas):

| Arquetipo | Perfil | Actitud hacia IA | Estrategia de gestión |
|-----------|--------|-----------------|----------------------|
| **Explorer** | Evangelista interno, early adopter | Altamente positiva | Empoderar, dar herramientas, convertir en champion |
| **Operator** | Usuario operativo, pragmático | Neutral → positiva si hay ROI claro | Formación, quick wins tangibles |
| **Skeptic** | Crítico constructivo, busca evidencias | Negativa → neutral con datos | Datos y casos de éxito, no evangelismo |
| **Blocker** | Resistente activo, ve amenazas | Negativa activa | Gestión política, involucrar early, abordar miedos |
| **Observer** | Espectador, sin posición clara | Pasiva | Comunicación regular, evitar que se vuelva Blocker |

---

## Roles de Usuario en la Plataforma

Ver ADR-008 para la decisión técnica de roles.

| Rol técnico | Equivalente en negocio | Acceso |
|-------------|----------------------|--------|
| `superadmin` | Fundadores Alpha (Carlos + Óscar) | Todo el sistema, todos los clientes |
| `consultant` | Consultores de Alpha | Sus engagements asignados |
| `client_editor` | PM cliente / Technical Leader | Engagement de su empresa — lectura + escritura |
| `client_viewer` | C-suite del cliente | Engagement de su empresa — solo lectura (outputs y dashboards) |

---

## Términos Técnicos del Dominio

| Término | Definición técnica | Uso en código |
|---------|-------------------|--------------|
| **Engagement** | Proyecto de adopción IA de un cliente. Unidad principal de multi-tenancy. | `engagement_id` como discriminador en todas las tablas |
| **Snapshot** | Captura del estado completo de un engagement en un momento clave. | Tabla `snapshots` + tablas `*_snapshots` |
| **Score** | Puntuación de madurez IA en una dimensión/subdimensión. | `t1_dimension_scores.score` (0-5) |
| **Dimension / Subdimension** | Categorías del radar T1. Cada dimensión tiene subdimensiones evaluadas. | `dimension_code`, `subdimension_code` |
| **Interviewee** | Persona entrevistada en T1 (puede haber múltiples por engagement). | `interviewee_id`, `interviewee_type: 'it' \| 'business'` |
| **Friction** | Punto de fricción IA detectado en un value stream (T3). | Tabla `frictions` |
| **Use Case** | Caso de uso de IA priorizado en T4. | Tabla `use_cases` |
| **Go/No-Go** | Decisión de pasar a implementación de un use case. | `use_cases.goNoGo.decision: 'go' \| 'no_go' \| 'pending'` |
| **Demo mode** | Modo de demostración con datos simulados. Activado con `VITE_DEMO_ENABLED=true`. | `src/data/demo/` |
| **isReadOnly** | Hook que activa modo solo-lectura para `client_viewer`. | `useIsReadOnly()` en `src/shared/hooks/` |
| **Shadow AI** | Herramientas de IA usadas sin aprobación corporativa (riesgo de T6). | Detectadas en T2 → `unofficial_tools` |

---

## Abreviaturas usadas en el código

| Abreviatura | Significado |
|------------|-------------|
| `T[N]` | Tool N — herramienta del sistema LEAN |
| `QW[N]` | Quick Win N |
| `eng` / `engagement` | Proyecto de cliente |
| `RLS` | Row Level Security (PostgreSQL) |
| `BaaS` | Backend as a Service (Supabase) |
| `PRO` | Entorno de producción |
| `PRE` | Entorno de pre-producción / staging |
| `DEV` | Entorno de desarrollo local |
