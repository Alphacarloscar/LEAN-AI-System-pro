# TECHNICAL SPEC — GOBY / L.E.A.N. AI System Enterprise

**Versión:** 1.0 | **Fecha:** 2026-05-22 | **Propietario:** Alpha Consulting Solutions S.L.
**Audiencias:** equipo técnico · dirección de cliente · auditoría técnica

---

## 1. VISIÓN GENERAL DEL PRODUCTO

**GOBY** (nombre de plataforma) implementa la metodología propietaria **L.E.A.N. AI System Enterprise** de Alpha Consulting Solutions S.L. Es una aplicación web SPA (Single Page Application) que actúa como plataforma de diagnóstico, priorización y gobierno de la adopción de inteligencia artificial en empresas B2B medianas y grandes.

La plataforma estructura un sprint de 6 meses en cuatro fases (Listen → Evaluate → Activate → Normalize) mediante 12 herramientas propietarias (T1–T12). Cada herramienta produce un output estructurado que alimenta a las siguientes, creando un flujo de datos encadenado sin duplicaciones manuales.

### Casos de uso principales
- Un **consultor Alpha** gestiona el diagnóstico de IA de una empresa cliente de forma estructurada, con datos persistidos en la nube.
- Un **cliente operativo** completa formularios de entrevista, revisa outputs y realiza un seguimiento del progreso.
- Un **cliente directivo** (C-Suite) visualiza dashboards ejecutivos en modo solo lectura.
- **Alpha** (superadmin) administra empresas, usuarios y proyectos desde un panel de control centralizado.

---

## 2. STACK TECNOLÓGICO

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Frontend framework | React | 18.3 | UI reactiva |
| Lenguaje | TypeScript | 5.7 | Tipado estático estricto |
| Build tool | Vite | 6.0 | Dev server + bundler |
| Routing | React Router DOM | 6.28 | SPA routing declarativo |
| Estado global | Zustand | 5.0 | Stores por módulo |
| Backend / BaaS | Supabase | 2.45 | Auth + PostgreSQL + RLS |
| Estilos | Tailwind CSS | 3.4 | Utility-first CSS |
| Gráficos | Recharts | 2.13 | Radar, bar, line charts |
| PDF export | @react-pdf/renderer | 3.4 | Generación de política IA en PDF |
| Formularios | React Hook Form + Zod | 7.54 / 3.23 | Formularios con validación tipada |
| CSV/Excel | Papaparse + xlsx | 5.4 / 0.18 | Import/export de datos |
| Iconos | Lucide React | 0.468 | Iconografía consistente |
| Fechas | date-fns | 3.6 | Manejo de fechas |
| IA (LLM) | Claude API (Anthropic) | — | Generación de contenido narrativo |
| Despliegue | Vercel | — | CI/CD + hosting |
| Storybook | Storybook + Chromatic | 8.4 | Componentes visuales (dev) |

### Aliases de path (Vite)
```
@  →  ./src
@shared  →  ./src/shared
@services  →  ./src/services
@modules  →  ./src/modules
```

### Chunking de build (Rollup)
El build separa vendors en chunks independientes para maximizar cache hit del navegador:
`vendor` · `supabase` · `charts` · `ui` · `forms` · `state`

---

## 3. ARQUITECTURA DEL SISTEMA

### 3.1 Estructura de directorios

```
src/
├── App.tsx                  # Root: rutas, ProtectedRoute, DemoContext
├── main.tsx                 # Entry point React
├── lib/
│   ├── supabase.ts          # Cliente Supabase (punto único)
│   └── config.ts            # Feature flags (isDemoEnabled)
├── types/
│   ├── database.types.ts    # Tipos Supabase (fuente de verdad de BD)
│   ├── domain.types.ts      # Tipos de negocio independientes de BD
│   └── index.ts             # Re-exports
├── services/                # Capa de acceso a datos (Supabase)
│   ├── companies.service.ts
│   ├── engagements.service.ts
│   ├── projects.service.ts
│   ├── t1.service.ts
│   ├── t2.service.ts
│   ├── t3.service.ts
│   ├── t4.service.ts
│   └── company-profile.service.ts
├── modules/                 # Módulos de negocio (uno por herramienta)
│   ├── Auth/
│   ├── Admin/
│   ├── Engagement/
│   ├── CompanyProfile/
│   ├── T1_MaturityRadar/
│   ├── T2_StakeholderMatrix/
│   ├── T3_ValueStreamMap/
│   ├── T4_UseCasePriorityBoard/
│   ├── T5_AITaxonomyCanvas/
│   ├── T6_RiskGovernance/
│   ├── T7_AdoptionHeatmap/
│   ├── T8_CommunicationMap/
│   ├── T9_AIRoadmap/
│   ├── T10_AIValueDashboard/
│   ├── T11_OperatingRhythm/
│   └── T12_ISOAssessment/
├── shared/
│   ├── layouts/AppLayout.tsx
│   ├── components/          # Componentes transversales
│   └── hooks/
├── stores/
│   └── recommendationCache.store.ts
├── hooks/                   # Hooks de generación LLM
│   ├── useRecommendations.ts
│   ├── usePolicyGeneration.ts
│   ├── useChangePlanGeneration.ts
│   └── useT8Generation.ts
├── components/
│   └── RecommendationPanel.tsx
└── data/
    └── demo/                # Fixtures tipados para modo demo
```

### 3.2 Patrón por módulo

Cada módulo T(n) sigue la misma estructura interna:

```
T(n)_NombreModulo/
├── index.ts           # Re-export público del módulo
├── types.ts           # Tipos locales del módulo
├── constants.ts       # Constantes, configuraciones, lógica pura
├── store.ts           # Zustand store (estado + acciones)
├── T(n)View.tsx       # Componente raíz de la vista
├── t(n)ContextBuilder.ts  # Serializa el estado para el LLM
└── components/        # Subcomponentes específicos del módulo
```

### 3.3 Flujo de datos entre módulos

Los módulos no se llaman entre sí directamente. El flujo es unidireccional:

```
CompanyProfile → T1 → T2 → T3 → T4 → T5 → T6
                              ↓         ↓
                              T7        T9
                              ↓
                              T8
                              ↓
                             T10 (agrega T1+T2+T4+T11)
                             T11 (consume T1 para adaptación)
                             T12 (consume T6/ISO 42001)
```

Los módulos downstream leen datos upstream desde sus respectivos Zustand stores, no desde la BD directamente. Esto permite que el flujo funcione también en modo demo sin Supabase.

---

## 4. BASE DE DATOS (SUPABASE / POSTGRESQL)

### 4.1 Tablas

| Tabla | Descripción | Clave primaria |
|---|---|---|
| `companies` | Empresas cliente (tenants) | `id` (UUID) |
| `profiles` | Usuarios de la plataforma | `id` (UUID, = auth.uid()) |
| `projects` | Proyectos/engagements | `id` (UUID) |
| `project_members` | Membresía usuario↔proyecto | `(project_id, user_id)` |
| `company_profiles` | Perfil estratégico del cliente | `id` (UUID) |
| `frictions` | Fricciones identificadas en diagnóstico | `id` (UUID) |
| `t1_dimension_scores` | Scores T1 por entrevistado/subdimensión | `id` (UUID) |
| `stakeholders` | Stakeholders del mapa T2 | `id` (UUID) |
| `value_streams` | Procesos del VSM T3 | `id` (UUID) |
| `use_cases` | Casos de uso T4 | `id` (UUID) |
| `t5_canvas` | Canvas de dominios IA T5 | `id` (UUID) |
| `iso42001_controls` | Controles ISO 42001 T6/T12 | `id` (UUID) |

### 4.2 Campos clave destacados

**`stakeholders`:** El campo `unofficial_tools` (text) captura herramientas de Shadow AI declaradas por el stakeholder durante la entrevista T2. Este dato alimenta el indicador de riesgo Shadow AI en T6 y T10.

**`use_cases`:** Campos JSON complejos:
- `stakeholder_scores` → array de `StakeholderScore[]` (scoring por participante del taller)
- `scores` → `UseCaseScores` (promedio consensuado)
- `economics` → `UseCaseEconomics` (inputs para cálculo ROI)
- `go_no_go` → `GoNoGoDecision`
- `roadmap` → `UseCaseRoadmap`
- `ai_act_classification` → `AIActClassification`

**`t1_dimension_scores`:** Cada fila representa el score de una subdimensión para un entrevistado concreto. Un proyecto con 2 entrevistados y 8 dimensiones × 3 subdimensiones genera 48 filas.

### 4.3 Funciones SQL (SECURITY DEFINER)

| Función | Propósito |
|---|---|
| `create_project(p_name, p_company_id, p_phase)` | Crea proyecto + añade al creador como miembro. Evita el desajuste `auth.uid()` en RLS para clientes. |
| `is_project_member(pid)` | Devuelve `boolean` — usado en políticas RLS para leer/escribir datos de proyecto. |
| `can_write_project(pid)` | `true` si el usuario tiene rol `consultant` en el proyecto. |
| `is_platform_admin()` | `true` si el perfil del usuario es `superadmin` o `consultant`. |

### 4.4 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Las políticas siguen este esquema de acceso:

**`companies`:**
- `superadmin` → SELECT/INSERT/UPDATE sin restricción.
- `consultant` → SELECT de todas las empresas (necesita ver los clientes asignados).
- `client_editor` / `client_viewer` → SELECT solo de su propia `company_id`.

**`profiles`:**
- `superadmin` → SELECT de todos.
- Resto → SELECT solo de su propio perfil.

**`projects`:**
- `superadmin` → acceso global.
- `consultant` → acceso a proyectos donde es `project_member`.
- `client_editor` / `client_viewer` → acceso a proyectos de su empresa donde son miembros.

**Tablas de datos de proyecto** (`t1_dimension_scores`, `stakeholders`, `value_streams`, `use_cases`, etc.):
- SELECT: `is_project_member(project_id) = true`
- INSERT/UPDATE: `can_write_project(project_id) = true` (excluye `client_viewer`)
- `superadmin`: acceso global mediante `is_platform_admin()`

**Principio de diseño RLS:** Un `client_viewer` nunca puede escribir datos de proyecto, aunque tenga acceso a la ruta en el frontend. La restricción es a nivel de BD, no solo de UI.

---

## 5. AUTENTICACIÓN Y ROLES

### 5.1 Sistema de autenticación

Se usa **Supabase Auth** (email + password). No hay OAuth en producción actual.

**Flujo de sesión:**
1. `App.tsx` llama a `useAuthStore().initialize()` al montar — restaura sesión existente desde cookie/localStorage sin redirigir a `/login`.
2. `login()` llama a `supabase.auth.signInWithPassword()` y carga el perfil extendido desde `profiles`.
3. `supabase.auth.onAuthStateChange()` escucha eventos de sesión: `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`.
4. En `SIGNED_OUT`: se limpian **todos** los stores de datos de cliente (T1–T12, CompanyProfile, Engagement) para evitar data leakage entre sesiones.

**`ProtectedRoute`:** Componente que envuelve todas las rutas autenticadas. Muestra spinner mientras `isInitializing=true` y redirige a `/login` si `isAuthenticated=false`. Evita el flash de redirección al recargar página.

### 5.2 Roles del sistema (4 niveles)

| Rol | Código | Descripción | Acceso |
|---|---|---|---|
| **Superadmin** | `superadmin` | Platform admin de Alpha (Carlos) | Acceso global a todas las empresas y proyectos. Panel `/admin` exclusivo. |
| **Consultor Alpha** | `consultant` | Consultor de Alpha asignado a proyectos | Edita datos en los proyectos donde es `project_member`. |
| **Cliente editor** | `client_editor` | Usuario operativo del cliente | Ve y edita proyectos de su propia empresa. No accede a otras empresas. |
| **Cliente viewer** | `client_viewer` | Directivo del cliente | Solo lectura de proyectos de su empresa. No puede escribir en BD. |

El rol se almacena en `profiles.role` (PostgreSQL enum). No existe en Supabase Auth directamente — siempre se lee desde la tabla `profiles`.

### 5.3 Guard en frontend

Además de RLS en BD, el frontend implementa guards adicionales:
- `ProtectedRoute` bloquea acceso a todas las rutas si no autenticado.
- `AdminView` redirige a `/` si `user.role !== 'superadmin'` (doble guard: componente + useEffect).
- El modo demo se activa/desactiva por `isDemoEnabled` (variable de entorno), que oculta o muestra el selector de escenarios.

---

## 6. GESTIÓN DE ESTADO (ZUSTAND)

Cada módulo tiene su propio store Zustand. Todos siguen el mismo contrato:

```typescript
interface ModuleStore {
  // Estado
  data: DataType[]
  isLoading: boolean

  // Acciones de carga
  load(engagementId: string): Promise<void>

  // Acciones de sincronización (local + Supabase)
  upsert(...): Promise<void>
  remove(...): Promise<void>

  // Limpieza
  reset(): void  // Llamado por Auth store en SIGNED_OUT
}
```

### Stores destacados

**`useEngagementStore`** — Store central de selección de proyecto. Persiste `activeEngagementId` en `localStorage` (`zustand/middleware/persist`). Auto-selecciona el proyecto si solo hay uno. Tiene timeout de seguridad de 10s para `isLoading`.

**`useT1Store`** — Implementa debounce de 800ms en `setScore` y 1200ms en `setEvidence` para evitar flood de UPSERTs mientras el usuario mueve sliders. El UPSERT se ejecuta en background (fire-and-forget) sin bloquear la UI.

**`useAuthStore`** — Orquesta el lifecycle completo de sesión. Al `SIGNED_OUT` llama a `reset()` en cada store de módulo para limpiar datos del cliente anterior.

**`recommendationCache.store.ts`** — Cache en memoria de recomendaciones LLM para evitar regenerarlas en cada render.

---

## 7. MÓDULOS T1–T12

### T1 — AI Maturity Radar (`/t1`)
**Fase:** Listen | **Objetivo:** Diagnóstico de madurez IA de la organización.

Evalúa 8 dimensiones (Estrategia, Datos, Tecnología, Talento, Procesos, Cultura, Gobernanza, Liderazgo) mediante entrevistas semi-estructuradas. Cada dimensión tiene subdimensiones con scoring 0–4.

**Funcionamiento:**
- El consultor añade entrevistados (nombre, rol, tipo IT/Negocio).
- Para cada entrevistado, puntúa cada subdimensión con un slider 0–4 y opcionalmente añade evidencia textual.
- Los scores se promedian automáticamente para generar el radar del conjunto.
- El output (radar chart + gaps críticos) alimenta T4 (scoring de madurez) y T11 (adaptación de cadencia).

**Persistencia:** Tabla `t1_dimension_scores`. Una fila por `(project_id, interviewee_id, subdimension_code)`. UPSERT debounced (800ms). Timeout de load: 15s con guard anti-doble-load.

**Modos:**
- Demo: `initFromScenario()` carga fixtures del escenario seleccionado.
- Real: `load(engagementId)` fetcha desde Supabase.

---

### T2 — AI Stakeholder Matrix (`/t2`)
**Fase:** Listen | **Objetivo:** Clasificar stakeholders por arquetipo y nivel de resistencia.

**5 arquetipos propietarios:**
| Código | Perfil |
|---|---|
| `adoptador` | Early adopter, bajo fricción, impulsa uso |
| `ambassador` | Connector IT-Negocio, multiplica adopción |
| `decisor` | Autoridad presupuestaria, necesita ROI claro |
| `critico` | Escéptico activo, puede bloquear |
| `reticente` | Conocimiento profundo, baja adopción y openness |

**Entrevista estructurada MCQ:** 4–5 preguntas con 4 opciones (A/B/C/D). Cada opción suma puntos a las dimensiones `adoption`, `influence`, `openness`, `connector`. Los scores normalizados determinan el arquetipo automáticamente.

**Shadow AI:** Campo `unofficialTools` por stakeholder — herramientas de IA no oficiales que el stakeholder declara usar. Dato crítico: alimenta el indicador "Riesgo Shadow AI" en T6 y T10.

**Matrix visual:** Cuadrante influencia × adopción (scatter plot) con los stakeholders posicionados por arquetipo.

**Persistencia:** Tabla `stakeholders`. El campo `manual_override=true` permite al consultor ajustar la asignación automática sin perder los datos de entrevista.

---

### T3 — Value Stream Map (`/t3`)
**Fase:** Listen | **Objetivo:** Mapear procesos de negocio y evaluar su potencial IA.

**Entrevista estructurada por proceso:** 5 dimensiones evaluadas mediante MCQ.

| Dimensión | Qué mide |
|---|---|
| `automation` | Potencial de automatización del proceso |
| `data` | Disponibilidad y calidad de datos |
| `volume` | Volumen y frecuencia |
| `impact` | Impacto en negocio de una mejora |
| `readiness` | Disposición del equipo |

**Score compuesto de oportunidad IA (0–4):** Determina la `opportunityLevel` (`baja/media/alta/critica`) y asigna automáticamente una **categoría IA**:

| Categoría | Cuándo |
|---|---|
| `automatizacion_rpa` | Alto auto + datos bajos |
| `automatizacion_inteligente` | Alto auto + altos datos |
| `analitica_predictiva` | Datos altos + impacto alto |
| `asistente_ia` | Readiness alto + auto bajo |
| `optimizacion_proceso` | Scores medios |
| `agéntica` | Máximo en todas las dimensiones |

**VSM detallado:** Cada proceso puede tener `ProcessStage[]` (etapas con tiempo de proceso, tiempo de espera, handoffs, valor aportado). Permite identificar cuellos de botella y oportunidades de mejora.

**Puente T3→T4:** Los procesos con oportunidad alta o crítica se pueden importar directamente a T4 como casos de uso pre-rellenados (nombre, departamento, categoría IA, opportunityScore como base del scoring inicial).

---

### T4 — Use Case Priority Board (`/t4`)
**Fase:** Evaluate | **Objetivo:** Priorizar casos de uso IA mediante scoring multi-dimensional.

**Scoring (escala 0–100 por cada dimensión):**
| Dimensión | Tipo |
|---|---|
| `kpiImpact` | Impacto en KPI de negocio — mayor = mejor |
| `feasibility` | Facilidad de implementación — mayor = mejor |
| `aiRisk` | Riesgo IA/regulatorio — mayor = peor (se invierte) |
| `dataDependency` | Dependencia de datos — mayor = peor (se invierte) |

**Score compuesto = `(kpiImpact + feasibility + (100-aiRisk) + (100-dataDependency)) / 4`**

**Taller de scoring:** Cada stakeholder puntúa individualmente. Los scores individuales se promedian automáticamente en los `scores` consolidados del caso de uso.

**Economía y ROI:** Calculador financiero por caso de uso con tres modos de entrada:
- `efficiencyGainMode`: `benchmark` (usa benchmarks por categoría IA) o `manual`
- `hourlyRateMode`: `preset` (administrativo/técnico/directivo) o `manual`
- `implementationCostMode`: `benchmark` o `manual`

Fórmulas calculadas en runtime (no almacenadas):
- `annualSaving = processHoursPerWeek × headcount × 52 × efficiencyGain × hourlyRate`
- `paybackMonths = implementationCost / (annualSaving / 12)`
- `roi3year (%) = (annualSaving×3 - implementationCost) / implementationCost × 100`

**Clasificación AI Act:** Cada caso de uso puede clasificarse bajo el EU AI Act mediante 4 preguntas:
1. Ámbito/sector del sistema (`AIActScope`)
2. Impacto en personas físicas (`no / human_review / autonomous`)
3. Datos sensibles (boolean)
4. Explicabilidad del output (`yes / no`)

La función `computeAIActRisk()` aplica las reglas del Reglamento:
- Prohibido: datos sensibles + seguridad + autónomo.
- Alto riesgo: sectores del Annex III (RRHH, financiero, salud, infraestructura, seguridad, educación, administración).
- Limitado: sistemas cara-al-cliente o que impactan personas.
- Mínimo: operaciones internas sin datos sensibles.

**Ciclo de vida del caso de uso:** `candidato → priorizado → go / no_go → en_piloto → completado`

---

### T5 — AI Domain Architecture Canvas (`/t5`)
**Fase:** Evaluate | **Objetivo:** Estrategia de activación por dominio IA.

Evalúa 6 dominios IA del L.E.A.N. System en 4 dimensiones (escala 0–100):
- `businessValue` — valor potencial de negocio
- `technicalReady` — madurez técnica y de datos
- `orgReadiness` — preparación organizativa/cultural
- `riskLevel` — nivel de riesgo regulatorio/ético

Para cada dominio genera una **recomendación de activación**:
| Recomendación | Cuándo |
|---|---|
| `activar_ahora` | Condiciones cumplidas → lanzar este trimestre |
| `pilotar_90d` | Perfil prometedor → piloto controlado |
| `preparar_foundations` | Valor claro, prerequisites pendientes |
| `gobernar_primero` | Riesgo crítico → governance antes que despliegue |

El canvas incluye: `suggestedOwner`, `primaryKPI`, `activationConditions`, `governanceNotes`, secuencia de activación recomendada y nivel de madurez IA global (`inicial/emergente/operativo/avanzado`).

---

### T6 — Risk & Governance (`/t6`)
**Fase:** Activate | **Objetivo:** Política IA corporativa + governance AI Act + ISO 42001.

Genera automáticamente tres outputs desde los datos de T4 y T5:

**1. Política IA Corporativa (PDF descargable):**
Documento estructurado con: declaración de principios, alcance, 6 principios éticos (sectorializados por LLM), contexto regulatorio específico del sector, catálogo de casos de uso clasificados, roles y responsabilidades.
La parte narrativa (párrafos de apertura, principios, contexto sectorial) se genera vía Claude API (`usePolicyGeneration` hook).

**2. Dashboard de riesgos AI Act:**
Agregado de clasificaciones de riesgo de T4 (`AIActRiskSummary`):
- Total de casos, breakdown por nivel de riesgo, % de casos clasificados vs. sin clasificar.

**3. Checklist ISO 42001:**
14 controles clave organizados por cláusula (4-Contexto, 5-Liderazgo, 6-Planificación, 7-Apoyo, 8-Operación, 9-Evaluación, 10-Mejora). Los controles pueden marcarse como `no_iniciado / en_progreso / implementado`. Algunos se infieren automáticamente desde datos de T4/T5 (`autoInferred=true`).

---

### T7 — Adoption Heatmap (`/t7`)
**Fase:** Activate | **Objetivo:** Segmentación de adopción por curva de Rogers + plan de cambio.

Posiciona a los stakeholders de T2 en la **Curva de Rogers**:
`innovators → early_adopters → early_majority → late_majority → laggards`

La asignación a segmento se determina por el `archetype` y `resistance` de T2:
- `adoptador` → early_adopters/innovators
- `ambassador` → early_adopters
- `decisor` → early_majority
- `reticente` → late_majority/laggards
- `critico` → late_majority/laggards (según resistencia)

**Plan de cambio generado por LLM** (`useChangePlanGeneration` hook): Produce un plan de 3–4 fases temporales con objetivos, acciones concretas y riesgos por fase, adaptado al perfil específico de distribución de adopción del cliente.

---

### T8 — Communication Map (`/t8`)
**Fase:** Activate | **Objetivo:** Plan de comunicación por arquetipo y departamento.

Genera tres outputs:

1. **Plan de acciones de comunicación** por fase (Phase 1/2/3) con: semana de ejecución, tipo (`anuncio/formación/actualización/workshop/etc.`), audiencia, mensaje clave, canal, responsable y prioridad.

2. **Mensajes por arquetipo T2** (generados vía LLM con `useT8Generation`): Para cada arquetipo, un `headline`, `keyPoints[]`, `doNotSay`, `openingLine`, canal recomendado y nota de resistencia.

3. **Kit por departamento**: Readiness score, preocupación principal, enfoque de comunicación, acciones concretas, embajadores internos y canal preferente.

---

### T9 — AI Roadmap 6M (`/t9`)
**Fase:** Activate | **Objetivo:** Gantt de implementación de 6 meses.

Dos tipos de fila en el Gantt:
- **`ai_import`**: Caso de uso con decisión `go` importado desde T4. El status y nivel de riesgo se leen en runtime desde el store de T4. Solo se persiste el override de posición/responsable.
- **`free`**: Iniciativa libre añadida por el consultor (nombre, departamento, responsable, startMonth 0–5, endMonth 0–5, riskLevel, status).

El riesgo de las filas importadas se mapea desde `AIActRiskLevel`:
- `prohibido/alto → 'alto'` | `limitado → 'medio'` | `minimo/sin_clasificar → 'bajo'`

---

### T10 — AI Value Dashboard (`/`)
**Fase:** Transversal (home screen) | **Objetivo:** Dashboard ejecutivo agregado del programa IA.

Pantalla de inicio de la plataforma. Agrega en tiempo real datos de T1+T2+T4+T11:

| Sección | Fuente | Métrica |
|---|---|---|
| Madurez IA | T1 | Score global, dimensión top, gap crítico |
| Portfolio de casos | T4 | Casos activos, ahorro anual total, casos de alto riesgo |
| Adopción | T2 | Total stakeholders, ratio early adopters, sin entrevistar |
| Governance | T11 | Tier de madurez, eventos críticos, decisiones con responsable |

El `t10ContextBuilder.ts` serializa este agregado para pasarlo al hook `useRecommendations` que genera recomendaciones contextualizadas vía Claude API.

**Modo demo vs. producción:**
- Demo (`isDemoEnabled=true`): recibe datos del escenario ficticio seleccionado.
- Producción (`isDemoEnabled=false`): recibe strings vacíos — T10View muestra un placeholder hasta que hay datos reales cargados.

---

### T11 — AI Operating Rhythm (`/t11`)
**Fase:** Normalize | **Objetivo:** Centro de operaciones de gobierno IA.

Genera un modelo operativo adaptativo basado en el score de madurez de T1.

**3 modos adaptativos** según score promedio T1:
| Modo | Score T1 | Ceremonias |
|---|---|---|
| `basic` | < 2.0 | Solo ceremonias críticas (`isCritical=true`) |
| `standard` | 2.0–3.0 | Filtrado por tier de madurez |
| `full` | > 3.0 | Catálogo SAFe completo |

**4 tiers de madurez:**
`foundational` (< 1.5) → `developing` (1.5–2.5) → `advanced` (2.5–3.5) → `optimised` (> 3.5)

**Outputs:**
- **Cadencia de ceremonias** por nivel (`team/program/direction`): frecuencia, duración, responsable, participantes, datos de entrada, agenda tipo, KPIs revisados.
- **Matriz de decisiones**: trigger, qué se decide, quién decide, quién valida, a quién escalar, plazo.
- **Objetivos por fase LEAN**: Listen/Enable/Accelerate/Normalize/Scale con sprints, objetivos, eventos clave y datos necesarios.
- **KPI groups** por nivel de gobierno.

---

### T12 — ISO 42001 Assessment (`/t12`)
**Fase:** Normalize | **Objetivo:** Evaluación completa ISO 42001.

Extiende el checklist parcial de T6 a la evaluación completa de la norma. Herramienta de auditoría formal para clientes que requieren certificación o alineación con ISO 42001 (Sistema de Gestión de IA).

Comparte el tipo `ISO42001Control` y la tabla `iso42001_controls` con T6, diferenciándose en profundidad de evaluación y contexto de uso.

---

### CompanyProfile (`/company-profile`)
**Rol:** Módulo transversal accesible desde sidebar. Captura el contexto estratégico de la empresa que alimenta todos los generadores LLM.

**Campos de perfil:**
- Nombre del proyecto, sector, tamaño de empresa
- Objetivo principal de IA, horizonte de valor (3/6/12/18+ meses)
- Ecosistema tecnológico actual
- Restricciones conocidas
- Áreas prioritarias (multiselect)

**Fricciones:** Lista de fricciones identificadas durante el diagnóstico (tipo, área funcional, frecuencia `Baja/Media/Alta`, impacto `Bajo/Medio/Alto`, notas). Persistidas en tabla `frictions`.

**Persistencia:** Tabla `company_profiles`. UPSERT por `project_id` (una fila por proyecto). En modo demo con `isDemoEnabled=true`, la vista no persiste nada en BD.

---

### Admin (`/admin`)
**Acceso:** Solo `superadmin`. Guard doble: RLS en BD + redirect en frontend.

Tres tabs de gestión:

**Empresas:** Crear empresa cliente (auto-genera `slug` desde el nombre). Listar todas las empresas.

**Usuarios:** Formulario de invitación (nombre, email, empresa, rol). La función `inviteUserToCompany` está **mockeada** en la versión actual — registra los datos en consola pero no envía email real. Requiere Edge Function con `service_role_key` (pendiente). Lista filtrable por rol y empresa con badge visual de rol.

**Proyectos:** Crear proyecto (nombre + empresa opcional). Listar proyectos activos. Usa la función SQL `create_project` (SECURITY DEFINER) para resolver el problema de RLS en la creación.

---

## 8. INTEGRACIÓN CLAUDE API (LLM)

La plataforma usa el modelo Claude de Anthropic para generación de contenido narrativo contextualizado. Las llamadas LLM son **complementarias** a los datos estructurados: los datos reales de T1–T11 siempre tienen prioridad.

| Hook | Módulo | Output generado |
|---|---|---|
| `useRecommendations` | T10 | Recomendaciones ejecutivas del programa |
| `usePolicyGeneration` | T6 | Texto narrativo de la Política IA (apertura, principios, contexto sectorial) |
| `useChangePlanGeneration` | T7 | Plan de gestión del cambio por fases |
| `useT8Generation` | T8 | Mensajes por arquetipo de stakeholder |

**Variable de entorno:** `VITE_CLAUDE_API_KEY=sk-ant-...`

**Cache de recomendaciones:** `recommendationCache.store.ts` almacena los resultados en memoria para evitar regeneración en re-renders. Se invalida al cambiar de proyecto.

**Context builders:** Cada módulo con generación LLM tiene un `t(n)ContextBuilder.ts` que serializa el estado del store en un prompt estructurado. Garantiza que el LLM recibe datos reales y tipados, no texto libre.

---

## 9. SISTEMA DE DEMO

Activado con `VITE_DEMO_ENABLED=true`. Pensado para entornos de staging/demos comerciales.

### 5 escenarios (patrones de disfunción B2B)
| Pattern ID | Nombre | Pain principal |
|---|---|---|
| `data-visibility` | Visibilidad del dato | IA activa pero sin métricas de ROI |
| `slow-decisions` | Toma de decisión lenta | Procesos de aprobación IA eternos |
| `vendor-sprawl` | Vendor sprawl | Compra departamental sin coordinación |
| `change-resistance` | Resistencia al cambio | Cultura bloqueante |
| `pilot-chaos` | Gestión de pilotos | Experimentos sin metodología ni gobierno |

Cada `DemoScenario` incluye: perfil de empresa ficticio, datos T1 radar con "firma visual" del patrón, métricas hero, fases del Metro Map, narrativa de demo (hook, problema, unlock, proof point), y 2 entrevistados pre-cargados (uno IT, uno Negocio) con scores que muestran la brecha IT/Negocio característica del patrón.

Los fixtures de demo están tipados **contra los mismos tipos que usan los componentes UI**, garantizando cero divergencia visual entre demo y producción.

**`DemoContext`** (React Context): Permite cambiar el escenario activo desde el selector en T10. Las rutas hijas acceden al escenario via `useDemoContext()`.

### Guards de demo
Los módulos que persisten en BD comprueban `isDemoEnabled` antes de ejecutar cualquier write. En modo demo, las acciones de guardado son no-ops (o alertan al usuario).

---

## 10. ROUTING Y NAVEGACIÓN

```
/login              → LoginView (pública)
/reset-password     → ResetPasswordView (pública)

/ (index)           → T10View — Dashboard ejecutivo (home)
/company-profile    → CompanyProfileView
/t1                 → T1View — AI Maturity Radar
/t2                 → T2View — Stakeholder Matrix
/t3                 → T3View — Value Stream Map
/t4                 → T4View — Use Case Priority Board
/t5                 → T5View — AI Domain Architecture Canvas
/t6                 → T6View — Risk & Governance
/t7                 → T7View — Adoption Heatmap
/t8                 → T8View — Communication Map
/t9                 → T9View — AI Roadmap 6M
/t11                → T11View — AI Operating Rhythm
/t12                → T12View — ISO 42001 Assessment
/admin              → AdminView (solo superadmin)
```

**`AppLayout`** envuelve todas las rutas protegidas: header persistente + `AppSidebar` (drawer lateral colapsable).

**`AppSidebar`:** Muestra fases y herramientas agrupadas por fase. Cada fase es colapsable. Las fases con estado `locked` no son navegables. Status dot visual por herramienta (`complete/in_progress/pending/blocked`). `Perfil de Empresa` siempre visible fuera de las fases.

---

## 11. VARIABLES DE ENTORNO

| Variable | Requerida | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | Sí | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sí | Clave anon/public de Supabase |
| `VITE_DEMO_ENABLED` | No | `true` = modo demo/staging. Omitir = false (producción) |
| `VITE_CLAUDE_API_KEY` | No | Clave Claude API para generación LLM |

**Arranque local:** Copiar `.env.example` como `.env.local` y rellenar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Sin ellas, la app lanza error explícito en `supabase.ts`.

---

## 12. BUILD Y DESPLIEGUE

### Comandos
```bash
npm run dev        # Dev server en localhost:5173 (abre navegador automáticamente)
npm run build      # tsc --noEmit && vite build → dist/
npm run preview    # Previsualizar build de producción
npm run typecheck  # Solo comprobación de tipos (sin build)
npm run lint       # ESLint (0 warnings = requisito para build)
```

**Requisito de build:** `tsc --noEmit` debe pasar sin errores. `eslint` debe pasar con 0 warnings. Si falla cualquiera de los dos, el build no continúa.

### Despliegue en Vercel
- Configuración en `vercel.json`.
- CI/CD automático desde rama `main`.
- Variables de entorno configuradas en el dashboard de Vercel por entorno (production / preview).
- Dos entornos:
  - `gobytech.vercel.app` (prod) → `VITE_DEMO_ENABLED=false`
  - `lean-ai-system-pro.vercel.app` (staging/demo) → `VITE_DEMO_ENABLED=true`
- `sourcemap: true` en build de producción para facilitar debugging.

---

## 13. DECISIONES DE DISEÑO Y ARQUITECTURA

| Decisión | Rationale |
|---|---|
| **Un cliente Supabase en `lib/supabase.ts`** | Evita importaciones directas de `@supabase/supabase-js` en componentes. Facilita sustitución futura de proveedor. |
| **Zustand por módulo (no un store global)** | Aislamiento: el reset de T1 no afecta a T4. Facilita debugging. Permite lazy-load futuro de módulos. |
| **Tipos en `database.types.ts` como fuente de verdad** | El esquema SQL manda. Los tipos TypeScript se derivan de él, no al revés. Si el tipo está desactualizado, se regenera desde Supabase CLI. |
| **Debounce en setScore/setEvidence (T1)** | El slider dispara eventos continuos. Sin debounce, un movimiento genera 20–30 UPSERTs. El debounce de 800ms agrupa en 1. |
| **SECURITY DEFINER en `create_project`** | Al crear un proyecto, el usuario aún no es `project_member`. La política RLS normal fallaría. La función SQL opera con privilegios elevados solo en ese momento controlado. |
| **`ai_act_classification` en JSON (no tabla separada)** | La clasificación es un output derivado del caso de uso, no una entidad independiente. Almacenarla en JSON evita una join costosa. |
| **Modo demo con mismos tipos que producción** | Garantiza cero divergencia. Si un fixture de demo pasa los tipos, el componente lo renderizará igual en producción con datos reales. |
| **Context builders por módulo para LLM** | El prompt del LLM no se construye en el componente — se construye en un módulo testeable independiente. Facilita evolución de prompts sin tocar UI. |
| **Chunk splitting manual en Rollup** | Recharts pesa ~540KB minificado. Sin splitting, el JS principal sería demasiado grande. Con splitting, el usuario solo descarga recharts cuando visita una vista con gráficos. |

---

## 14. CONVENCIONES DE CÓDIGO

- **Sin comentarios de "qué hace"** — el nombre de la función lo dice. Solo comentarios de "por qué" (workarounds, invariantes no obvios).
- **Sin abstracciones prematuras** — tres líneas similares son preferibles a una abstracción dudosa.
- **Sin validación de límites internos** — solo se valida en la frontera del sistema (formularios de usuario, responses de Supabase).
- **Imports tipados en servicios** — los servicios tipen explícitamente sus responses, no con `as any`. El cliente Supabase usa `any` por decisión de Sprint 3 pendiente de regeneración de tipos.
- **Alias `@deprecated`** — los campos y funciones renombrados mantienen alias con JSDoc `@deprecated` durante el periodo de transición. No se borran hasta que no queda ningún uso en `grep`.

---

## 15. TESTING Y CALIDAD

### Estado actual
- **Storybook** configurado con Chromatic. Stories de componentes UI (dev-only).
- **Sin tests unitarios** en el estado actual del proyecto. El typecheck estricto (`strict: true` en tsconfig) cubre gran parte de la regresión de tipos.
- **Sin tests E2E** automatizados. La verificación es manual en staging antes de merge a main.

### Protocolo de calidad manual (CLAUDE.md P3)
Antes de cerrar cualquier fix, se verifica explícitamente:
- Grep de cierre sobre `/src` para strings renombrados (0 ocurrencias esperadas en strings activos).
- Lectura de líneas editadas para confirmar que el cambio se aplicó correctamente.
- Evidencia de verificación incluida en la respuesta del agente.

---

## 16. PENDIENTES Y DEUDA TÉCNICA CONOCIDA

| Item | Descripción | Prioridad |
|---|---|---|
| `inviteUserToCompany` | Función mockeada. Requiere Supabase Edge Function con `service_role_key` para crear usuario en Auth y enviar email real. | Alta |
| `regenerar tipos Supabase` | `database.types.ts` se mantiene manualmente. Pendiente automatizar con `supabase gen types typescript`. | Media |
| `client Supabase genérico` | `createClient<any>` en `lib/supabase.ts` — eliminar `any` cuando los tipos estén generados. | Media |
| `tests unitarios` | Sin cobertura de tests. Al menos stores y context builders deberían tener tests. | Media |
| `T9 persistencia` | El store T9 usa Zustand local sin sync a Supabase. Pendiente tabla `roadmap_items`. | Media |
| `RLS política completa` | Las políticas RLS están definidas a nivel conceptual pero no se han auditado formalmente todas las combinaciones de rol. | Alta |
| `Edge Functions` | Sin Edge Functions activas. Las llamadas Claude API se hacen desde el cliente (expone la API key en el bundle). Mover a Edge Function antes de producción general. | Alta |

---

*Documento generado el 2026-05-22. Refleja el estado del código en rama `main` en esa fecha.*
