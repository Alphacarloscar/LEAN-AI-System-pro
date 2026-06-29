# Architecture Overview — GOBY

Last updated: 2026-06-29
AI-Ready Repository System v2.1.0

> Este documento es una síntesis de arquitectura para orientación rápida.
> Para el diseño completo, ver **ARQUITECTURA.md** (documento canónico de Sprint 0).

---

## What this system does

**GOBY** es una plataforma web multi-tenant que guía a empresas B2B medianas y grandes a través de una metodología propietaria de adopción de IA. Estructura: 4 fases (L→E→A→N) y 13 herramientas especializadas (T1-T13).

**Usuarios:** Consultores de Alpha Consulting + equipos del cliente (PMs, C-suite). Sistema de 4 roles: `superadmin` / `consultant` / `client_editor` / `client_viewer`.

**Estado actual:** Sprint 10+ completado. Sistema en producción con clientes reales en `lean-ai.consultoriaalpha.com`.

---

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite 6 + TypeScript 5.7 | SPA — UI de las 13 herramientas |
| Styles | Tailwind CSS 3 + Lucide React | Design system con tokens en CSS vars (ADR-021, ADR-023) |
| State | Zustand 5 | Estado global por dominio (ADR-007) |
| Charts | Recharts + chartTokens.ts | Gráficos T1 (araña), T2 (burbujas), T7 (heatmap), T9 (Gantt), T10; HEX centralizados en `src/shared/design-system/charts/chartTokens.ts` |
| Forms | React-Hook-Form + Zod | Formularios con validación tipada (ADR-022) |
| PDF | @react-pdf/renderer | Briefings ejecutivos QW1, exports T10 |
| Excel | SheetJS + Papaparse | Importación de datos del cliente |
| Backend | Supabase (PostgreSQL 15 + Auth + Storage + Realtime + Edge Functions) | BaaS completo (ADR-002) |
| AI | Claude API vía Edge Functions (Deno) | Recomendaciones IA — T6, ai-recommend (ADR-009) |
| Hosting | Vercel | Deploy automático desde GitHub |

---

## Module structure

```
src/
├── modules/           # Las 13 herramientas — cada una es un módulo independiente
│   ├── T1_MaturityRadar/          # Radar de madurez IA — L phase
│   ├── T2_StakeholderMatrix/      # Matriz de stakeholders — L phase
│   ├── T3_ValueStreamMap/         # Mapa de value streams — L phase
│   ├── T4_UseCasePriorityBoard/   # Priorización de casos de uso — E phase
│   ├── T5_AITaxonomyCanvas/       # Canvas de taxonomía IA — E phase
│   ├── T6_RiskGovernance/         # Gobierno de riesgos + política IA (LLM) — E phase
│   ├── T7_AdoptionHeatmap/        # Heatmap de adopción — A phase
│   ├── T8_CommunicationMap/       # Mapa de comunicación ejecutiva — A phase
│   ├── T9_AIRoadmap/              # Roadmap IA — A phase
│   ├── T10_AIValueDashboard/      # Dashboard de valor IA — N phase
│   ├── T11_OperatingRhythm/       # Ritmo operativo — N phase
│   ├── T12_ISOAssessment/         # Evaluación ISO 42001 — N phase
│   ├── Auth/                      # Login, password recovery, invitaciones
│   ├── Admin/                     # Panel superadmin — gestión usuarios/empresas
│   ├── CompanyProfile/            # Perfil de empresa
│   └── Engagement/                # Gestión de proyectos (engagements)
│
├── services/          # Capa de acceso a datos — abstrae Supabase
├── stores/            # Estado global Zustand — un store por dominio
├── shared/            # Componentes, hooks, layouts, utils compartidos
│   ├── design-system/ # Tokens, componentes base, iconos
│   │   └── charts/    # chartTokens.ts (HEX para Recharts) + domainIcons.tsx (iconos IA)
│   └── providers/     # Providers de contexto React
├── lib/               # Supabase client, PDF renderer, motor IA, utils
└── types/             # Tipos de dominio + tipos generados desde Supabase
```

---

## Data model (summary)

**Entidades estructurales** (FKs reales, comparables entre clientes):
- `profiles` — usuarios del sistema (extiende auth.users)
- `engagements` — proyectos de adopción IA por empresa
- `engagement_members` — relación usuario ↔ engagement
- `company_profiles` — perfil de empresa del cliente
- `snapshots` — capturas longitudinales del estado de un engagement

**Entidades con payload JSONB** (por herramienta, flexibles):
- `t1_dimension_scores` — scores de madurez multi-entrevistado
- `stakeholders` — stakeholders con cuadrante y arquetipos
- `value_streams` — value streams con fricciones
- `use_cases` — casos de uso priorizados
- `t5_canvas` — taxonomía IA por departamento/dominio
- `iso42001_controls` — controles ISO 42001

**Multi-tenancy:** Row Level Security en todas las tablas (ADR-004). Función `is_engagement_member()` para policies reutilizables.

→ Detalle completo: ARQUITECTURA.md secciones 4-8

---

## Environments

| Branch | Environment | Supabase | Vercel |
|--------|------------|---------|--------|
| `main` | PRO | Proyecto producción | lean-ai.consultoriaalpha.com |
| `develop` | PRE/DEV | Proyecto desarrollo | Preview automático por PR |
| local | DEV | Proyecto desarrollo (same as develop) | localhost:5173 |

→ Detalle: docs/operations/ENVIRONMENTS.md

---

## Key architectural decisions

| ADR | Decisión | Impacto |
|-----|---------|---------|
| ADR-001 | React + Vite + TS | Stack permanente del MVP |
| ADR-002 | Supabase como backend único | Un solo proveedor para BD + Auth + Storage + Edge |
| ADR-003 | Híbrido FKs + JSONB | Comparabilidad + flexibilidad por herramienta |
| ADR-004 | RLS para multi-tenancy | Aislamiento de datos entre clientes |
| ADR-005 | No-CLI workflow | Carlos opera solo vía web |
| ADR-006 | 2 proyectos Supabase | PRO y DEV completamente separados |
| ADR-007 | Zustand | Estado global ligero por dominio |
| ADR-008 | 4 roles | superadmin/consultant/client_editor/client_viewer |
| ADR-009 | Claude API vía Edge Functions | Recomendaciones IA server-side |
| ADR-020 | Plan Maestro UX/UI | 4 fases de mejora de sistema de diseño (IN PROGRESS) |
| ADR-021 | Design System Charter | Escala space-*, CSS vars, densidad configurable, prohibición gray-* |
| ADR-022 | Formularios RHF+Zod | Estándar react-hook-form + zodResolver para todos los formularios |
| ADR-023 | Visual System V2 | Migración warm-only palette, 340+ gray/rainbow eliminados, ESLint enforcement |

→ Índice completo: docs/decisions/README.md
→ Detalle de cada decisión: ARQUITECTURA.md sección 2

---

## Dark mode system

**Last updated: 2026-06-25**

GOBY implementa dark mode mediante clase `dark` en `<html>` (Tailwind `darkMode: 'class'`).

### Jerarquía de tokens de color

| Propósito | Light | Dark |
|-----------|-------|------|
| Fondo de app | `bg-surface` (#F7F4EE) | `dark:bg-warm-900` (#22201C) |
| Fondo de pantallas auth | `bg-surface` | `dark:bg-warm-950` (#16140F) |
| Superficie de card | `bg-white` | `dark:bg-warm-800` (#2A2822) |
| Superficie input/select | `bg-warm-50` | `dark:bg-warm-700` (#333028) |
| Superficie secundaria (FrictionCard, AddFreeItemForm) | `bg-warm-50` | `dark:bg-warm-800` |
| Borde estándar | `border-border` | `dark:border-warm-600/30` |
| Texto principal | `text-lean-black` | `dark:text-warm-50` |
| Texto secundario | `text-text-muted` | `dark:text-warm-300` |
| Texto sutil | `text-text-subtle` | `dark:text-warm-400` |
| Placeholder | `placeholder:text-text-subtle` | `dark:placeholder:text-warm-400` |
| Tooltip background | `bg-white` | `dark:bg-warm-800` |
| Skeleton | `bg-warm-200` | `dark:bg-warm-700` |

### Reglas ADR-021 aplicadas al dark mode

- **Prohibido** `dark:bg-gray-*` / `dark:text-gray-*` — usar tokens `warm-*`
- **Prohibido** `bg-gray-*` en light — usar `bg-warm-*` o `bg-surface`
- **Prohibido** `border-gray-*` — usar `border-border` o `border-warm-*`
- Colores inline via `style={{}}` se permiten con tokens CSS (`var(--color-gold)`) o hex dinámicos desde configuración (no hardcodeados en JSX estático)
- El `index.css` contiene overrides de compatibilidad transitoria `html.dark .dark\:text-gray-*` → estos son **deuda técnica**, no usar en código nuevo

### EngagementSelector

Usa prop `dark: boolean` para cambiar clases JSX condicionalmente (el componente aparece tanto en navbar dark como en contextos light). Patrón correcto — no confundir con Tailwind `dark:`.

### Gráficos Recharts

Los tooltips usan clases Tailwind: `bg-white dark:bg-warm-800 shadow-sm`. Los ejes y colores de datos usan `getThemeColor()` de `chartTokens.ts` que lee CSS variables en tiempo de ejecución — respeta el modo activo automáticamente.


---

## E2E patterns

**Patrón canónico audit watcher (`prepareAuditWatcher`):** registrar AMBAS promises antes de la acción del usuario y destruirlas antes de que `afterEach` navegue a otra página. El helper devuelve `{ request, response }`:
- `request()` — `waitForRequest` con filtro `url + method + body`. Resuelve al ENVIAR (~15s en CI). Usar en todos los tests de payload.
- `response()` — `waitForResponse` con el mismo filtro, timeout 90s. Resuelve al RECIBIR la respuesta HTTP. Usar solo en tests que verifican status 200. Registrada ANTES de la acción para evitar que `afterEach` cancele la conexión (race condition).
- `beforeAll` warm-up: POST dummy a la Edge Function con anon key para sacarla de cold-start Deno (~60s en CI) antes del primer test real.
- Ver `e2e/audit.spec.ts::prepareAuditWatcher` como implementación de referencia.

**Rutas T1-T12 en specs:** siempre navegar con el `engagementId` explícito: `page.goto(\`/tN/${LAB_PROJECT_ID}\`)`. Sin el parámetro, el router redirige al fallback `/` y el ToolHeader no monta. `LAB_PROJECT_ID` se exporta desde `e2e/helpers.ts`. Ver ADR-024.

---

## Testing — Mocks compartidos

**Patrón canónico del mock de Supabase:** todo `vi.mock('@/lib/supabase')` en tests de servicio debe incluir `functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) }`. Sin él, `auditClient.ts` lanza `TypeError` en stderr al intentar llamar `supabase.functions.invoke` en su IIFE fire-and-forget. Ver `src/__tests__/__mocks__/supabase.ts` para la plantilla de referencia y lista completa de propiedades necesarias.
