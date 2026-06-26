# Changelog — GOBY

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## v2.2.0 — Visual System V2 + Design System (Obsidian Editorial) — 2026-06-26

### Added
- [DS] `src/shared/design-system/charts/chartTokens.ts` — fuente única de HEX para Recharts (ADR-021 §4): 9 paletas exportadas (`QUADRANT_COLORS`, `T3_QUADRANT_COLORS`, `T3_VALUE_BAR_COLORS`, `T3_VALUE_ACTIVE_BG`, `ROGERS_SEGMENT_COLORS`, `DOMAIN_COLORS`, `DEPT_COLORS`, `DEPT_ADOPTION_COLORS`, `MONO_STATUS_COLORS`, `CHART_SERIES_COLORS`) + 4 funciones (`getThemeColor`, `getHeroColor`, `getGoldRgb`, `getNavyRgb`)
- [DS] `src/shared/design-system/charts/domainIcons.tsx` — mapa canónico Lucide por dominio IA: `DOMAIN_ICONS` + `DOMAIN_LABELS`; fuente única para T3, T4, T5
- [DS] `src/shared/components/UnsavedChangesModal.tsx` — modal "Cambios sin guardar" con tres acciones: seguir editando / descartar / guardar-y-continuar; consumido por `AppSidebar` y `EngagementSelector`
- [DS] `StreamingIndicator` — indicador inline para estados de invocación LLM (`variant: 'inline' | 'card'`); `role="status"` + `aria-live="polite"` (DEBT-027 parte 2)
- [DS] `ToastProvider` con cola FIFO limitada (MAX=3), duraciones por variante (`success 3s / info 4s / warning 6s / error 8s`), `persistent`, posicionamiento responsive (DEBT-027 partes 1+3)
- [DS] `ServiceErrorToast` + `useServiceError` — toast de error estructurado con panel debug expandible (DEBT-027 parte 3)
- [DS] `useMediaQuery` hook — breakpoint reactivo para sidebar responsive
- [DS] `useUnsavedGuard` — hook de integración que sincroniza `isDirty` local con el store global `useUnsavedChanges`
- [DS] `Table`: props `columnPriority` y `mobileView="cards"` para adaptación responsive (DEBT-026)
- [Hooks] `useEdgeFunctionInvoke` extendido con fase observable `'idle' | 'pending' | 'success' | 'error'`
- [Forms] `src/lib/schemas/t2.schemas.ts` — Zod schema para T2 StakeholderMatrix (ADR-022)
- [Forms] `src/lib/schemas/t3.schemas.ts` — Zod schema para T3 ValueStreamMap (ADR-022)
- [UX] FDR-003: T4 `UseCaseDetailPanel` — separación visual estado vs tabs mediante `SegmentedControl` + `Tabs variant="underline"`
- [Docs] `docs/decisions/technical/ADR-023-visual-system-v2.md` — registra decisión de migración Visual System V2
- [Docs] `docs/architecture/VISUAL-SYSTEM-V2.md` — guía operativa con tabla de equivalencias y configuración ESLint

### Changed
- [Design] **T1–T12 + Auth + Admin + CompanyProfile**: migración completa warm-only palette — eliminados 340+ usos de `gray-*`/`slate-*` y colores rainbow hardcodeados en 38 archivos (ADR-023)
- [Design] **T2 StakeholderMatrix**: burbujas quadrant → estilo plano con `fillOpacity="0.85"` y `stroke var(--color-warm-300)`; gray→warm en modales; `strokeWidth={2}→{1.5}` en iconos Check
- [Design] **T3 ValueStreamMap**: dominio `agéntica` migrado de violet a danger; rings slate → `var(--color-warm-200/300)`; slate→warm en 6 componentes
- [Design] **T6 RiskGovernance**: `AIACT_RISK_CONFIG` rainbow → tokens DS; `PDF_PALETTE` centraliza HEX para react-pdf; `strokeWidth={2}→{1.5}` en 10 iconos
- [Design] **Admin (AdminView, UsersTab, ProjectsTab)**: HEX inline → tokens `gold`/`gold-hover`; gray→warm; `aria-label` en `<select>` bare
- [DS] `AppSidebar`: responsive — sidebar inline en ≥lg; toggle+backdrop en <lg (DEBT-026)
- [DS] `AppLayout`: margen `ml-64` condicional cuando `isLg`; altura sidebar con `calc(100vh - var(--header-h))`
- [DS] `ChartWrapper`: `ariaLabel: string` obligatoria + `dataTable?: ReactNode` alternativa tabular (DEBT-025)
- [ESLint] **Enforcement ADR-021**: `no-restricted-syntax` activo — bloquea en CI: clases Tailwind frías, `shadow-lg/xl/2xl`, `rounded-2xl/3xl`, `strokeWidth={2}`; overrides para `*PDF*.tsx` y `chartTokens.ts`
- [Docs] ADR-020 estado actualizado a IN PROGRESS; tabla de fases actualizada con ADR-023
- [Docs] `docs/decisions/README.md` — añadidos ADR-022, ADR-023, FDR-001, FDR-003

### Removed
- [T10] `DashboardHeader.tsx` — eliminado e inlineado en T10View para cumplir ADR-013 (max 400 líneas)

---

## v2.1.0 — Sistema de Auditoría y Estabilización — 2026-06-17

### Added (v1.0 — Sistema de Auditoría)
- [Audit] `src/lib/audit/` — librería de auditoría completa (ADR-017)
  - `makeAuditable` — Proxy genérico que intercepta métodos async de cualquier servicio; registra args, response, duración, status y correlation_id sin bloquear al caller
  - `auditClient` — escritor fire-and-forget que invoca la Edge Function `log-audit-event`; fallos de red nunca propagan al caller (aislados en IIFE async)
  - `types.ts` — contratos `AuditLogInsert`, `AuditAIMetadata`, `AuditUserContext`
  - `context.ts` — helper `getAuditUserContext()` para capturar sesión activa
- [Audit] `supabase/functions/log-audit-event/` — Edge Function segura que añade contexto de usuario (user_id, email, rol) desde el JWT, bypasseando RLS con service_role_key
- [Audit] `src/services/auditLogs.service.ts` — servicio de lectura de logs para el panel de superadmin
- [DB] `supabase/migrations/20260615_003_audit_system.sql` — tablas `audit_logs` + `audit_logs_archive` + `audit_access_logs`, RLS, función de archivado pg_cron (ADR-018, ADR-019)
- [DB] `supabase/migrations/20260615_007_perf_profiles_idx.sql` — índice de rendimiento en `profiles`
- [DB] `supabase/migrations/20260616_004_audit_schema_drift.sql` — `ADD COLUMN IF NOT EXISTS` idempotente para `correlation_id`, `user_email_hash`, `ai_provider`, `ai_model`, `ai_total_tokens` en ambas tablas
- [Services] Todos los servicios instrumentados con `makeAuditable`: auth, companies, company-profile, department, projects, T1–T8
- [Tests] `src/__tests__/unit/audit/makeAuditable.test.ts` — 533 tests unitarios; cubre intercepción async, pass-through síncrono, truncación de payloads, correlation_id race-condition-safe, engagement_id desde localStorage
- [Docs] `docs/architecture/audit-system.md`, ADR-017/018/019 documentados

### Fixed
- [E2E] `t3.spec.ts` beforeEach: cambiado espera de texto "Value Stream Map" por selector `main` — evita timeouts en PRE cuando T3View tiene estado de carga inicial
- [CI] `validate-docs.yml` A4: trim de whitespace antes de medir longitud del body + mensaje de error orientativo con ruta al PR template
- [DB] tool_outputs: constraint tool_code_check ampliada a 14 tool codes — fix P0 silencioso donde persistence.saved=false para t1-t11 y t3_opportunities, forzando regenerar recomendaciones al navegar
- [DB] ai_rate_limit_log: constraint tool_code_check ampliada a 14 tool codes (t1-t11 + t3_opportunities + t6_policy + t7_plan + t8_comms) — constraint anterior solo tenía 7 tool codes del Sprint 6, bloqueaba todas las llamadas nuevas
- [Edge] ai-recommend: añadidos tool codes t1, t2, t4, t5, t6, t7, t8, t9, t10, t11 a LLM_TOOLS + TOOL_CONFIG — las recomendaciones IA fallaban en todas las herramientas con error 400 "tool no soportado"
- [Edge] ai-recommend: error 400 por tool no soportado ahora incluye `error_code: unsupported_tool_code` y `valid_tools` para depuración
- [Edge] ai-recommend: diagnóstico mejorado en rate_limit_check_failed — console.error expone code/details/hint del error Supabase; respuesta 500 incluye error_code, stage, tool, version
- [Edge] ai-recommend: todas las respuestas de error ahora incluyen `version` para confirmar qué build está desplegado

### Added (P1 — Refactor Sprint)
- [Monitoring] Sentry `@sentry/react@10` integrado — error monitoring en DEV/PRE/PRO (ADR-010)
  - `src/lib/sentry.ts` con `initSentry()` — desactivado localmente (`VITE_SENTRY_ENABLED=false`)
  - `src/lib/reportError.ts` — wrapper `reportError(context, err)` → console.error + Sentry
  - `.env.example` actualizado con todas las variables Sentry documentadas
  - `vite.config.ts` — `sentryVitePlugin` condicional (solo PRO cuando `SENTRY_AUTH_TOKEN` presente)
- [Services] Service layer T6/T7/T8 extraído de stores (ADR-011)
  - `src/services/t6.service.ts` — `savePolicyOutput()`
  - `src/services/t7.service.ts` — `saveChangePlanOutput()`
  - `src/services/t8.service.ts` — `saveCommunicationOutput()`
- [Tests] 12 nuevos tests — T6/T7/T8 services (4 cada uno, patrón `vi.mock + rpc`)
- [UX] Componente canónico `BackToDashboard` (`src/shared/components/`) — control único "Volver al dashboard" inline icono+texto. Sustituye 13 variantes hand-rolled dispersas en T1–T9, T11, T12 y CompanyProfile

### Changed (P1 — Refactor Sprint)
- [T4] T4View.tsx descompuesto (2386 → ~220 líneas): 9 sub-componentes extraídos a `components/` (ADR-013)
- [Deps] `xlsx@0.18.5` eliminado — CVE-2023-30533, zero imports en codebase (ADR-012)
- [Stores] T6/T7/T8 stores: imports directos de Supabase reemplazados por llamadas a services
- [UX] Normalizado el botón de vuelta al dashboard en 12 vistas: T3 y T4 pasan de botón redondo icon-only a inline texto+icono; T5 y T6 "Volver" → "Volver al dashboard"; unificados icono (16×16), tipografía (text-xs) y tokens de color

### Added (P2 — Refactor Sprint)
- [Hooks] `src/hooks/useEdgeFunctionInvoke.ts` — hook genérico para flujos LLM (ADR-014)
  - `usePolicyGeneration`, `useT8Generation`, `useChangePlanGeneration` refactorizados (~50 líneas c/u)
  - T6 gana timeout 90s que le faltaba (bug fix)
- [Schemas] `src/lib/schemas/t4.schemas.ts` — Zod schemas para JSONB fields (ADR-015)
  - `UseCaseScoresSchema`, `StakeholderScoresSchema`, `GoNoGoDecisionSchema`, `UseCaseEconomicsSchema`, `AIActClassificationSchema`
  - `safeParseJsonField()` integrado en `t4.service.ts`  `rowToUseCase()`
- [T3] T3View.tsx descompuesto (1202 → ~220 líneas): 5 sub-componentes extraídos (ADR-013)
  - `T3Badges.tsx`, `HeroOpportunityMatrix.tsx`, `HeroCategoryDonut.tsx`, `DetailPositionMap.tsx`, `ProcessDetailPanel.tsx`

### Changed (P2 — Refactor Sprint)
- [Types] `PolicyPDF.tsx`: tipos locales `UseCase` y `Domain` reemplazados con imports de T4/T5 (ADR-011)
- [Stores] T1/T4 stores: todos los `console.error` reemplazados con `reportError()` (ADR-010)
- [ADRs] Documentadas 6 decisiones técnicas nuevas: ADR-010 a ADR-015
- [CLAUDE.md] Reglas de diseño actualizadas con patrones P1+P2

### Changed (P0 — Infrastructure)
- [Infra] Entornos documentados con URLs y project refs reales: PRO (`gobytech-prod.vercel.app` + Supabase `vbpgsgxsslccctjhuegt`), PRE (`v0-lean-ai-system.vercel.app` + Supabase `mkypmakmkxpecuezofkk`), DEV (Supabase CLI local)
- [Docs] Actualizado `.ai-config.yml`, `CLAUDE.md`, `ENVIRONMENTS.md`, `DATABASES.md`, `INFRASTRUCTURE.md` con valores reales — eliminados todos los `[COMPLETAR]` de infraestructura

---

## [0.10.0] — 2026-06-01

### Added
- AI-Ready Repository System v2.1.0 instalado:
  - `CLAUDE.md` — Contrato IA-Humano con 9 decisiones técnicas cerradas (ADRs)
  - `.ai-config.yml` — Configuración del sistema AI-Ready
  - 9 ADRs documentando decisiones técnicas del Sprint 0 al Sprint 10
  - `docs/decisions/` — Registro completo de ADRs y templates
  - `docs/architecture/OVERVIEW.md` — Síntesis de arquitectura
  - `docs/architecture/TECH-DEBT.md` — 2 items de deuda técnica registrados
  - `docs/product/GLOSSARY.md` — Glosario completo (T1-T13, arquetipos, roles)
  - `docs/operations/ENVIRONMENTS.md` — Mapa de entornos PRO/PRE/DEV
  - `docs/operations/BRANCHING.md` — Estrategia de ramas y flujos
  - `docs/operations/INFRASTRUCTURE.md` — Supabase, Vercel, Claude API
  - `docs/operations/DATABASES.md` — Protocolo de BD y migraciones por entorno
  - `docs/operations/MIGRATIONS.md` — Protocolo de migraciones sin CLI
  - `docs/operations/ONBOARDING.md` — Guía de setup y flujo de trabajo
  - `.github/PULL_REQUEST_TEMPLATE.md` — Template de PRs
  - `.github/workflows/validate-docs.yml` — Pipeline de validación documental (bloqueante)
  - `.github/workflows/ci.yml` — Pipeline CI: TypeScript check + build de producción
  - `CODEOWNERS` — Propietarios de código por área

---

## [0.9.x] — Sprint 10 (mayo 2026)

### Fixed
- [Auth] `onAuthStateChange` sync — elimina deadlock Web Lock Supabase
- [Arch] `ProjectRuntimeProvider` = context only, no global load
- [Arch] Único orquestador de carga — eliminar dual-load
- [Runtime] Deshabilitar tab-focus refresh (`ENABLE_TAB_FOCUS_REFRESH=false`)
- [Auth] P0 rollback — restaurar `getSession()` + timeout 5s + boot logs
- [Auth] Eliminar Web Lock contention + conservar datos en timeout
- [T2] Timeout 10s en `load()` — evita spinner infinito si Supabase no responde

### Added
- [Infra] SQL security + Edge Function `ai-recommend`
- [Shared] Bloque H — Spinner / ToolLoadingScreen / ToolErrorState + guards T7/T8
- [Permissions] Sistema `isReadOnly` global para `client_viewer` — hook + `ViewerEmptyState` + 11 vistas
- [Auth] `UpdatePasswordView` — aduana de contraseñas para usuarios invitados
- [Admin] Sistema 4 roles superadmin/consultant/client_editor/client_viewer (ADR-008)
- [Admin] `invite-user` Edge Function real + conexión frontend

---

## [0.8.x] — Sprint 9 (mayo 2026)

### Fixed
- [QA] Sprint 9 QA quirúrgico — demo opt-in, permisos T10, tabs T11, errors T7/T8

### Added
- [T10] Bloque D — empty states Obsidian Amber, P5/P6 datos reales (T12+T4+T9), Proyecto Demo en selector
- [T4] LowScoreRecommendations en pestaña Scoring — amber palette, 5 alert triggers
- [T12] AI System Impact Assessment — ISO 42001 completo
- [Shared] Shadow AI — captura `unofficial_tools` en T2, indicador Riesgo en T6 y T10
- [Auth] Interceptar primer acceso de usuario invitado via `user_metadata`
- [Auth] Interceptar `PASSWORD_RECOVERY` + fix timing en `ResetPasswordView`
- [Admin] Prevenir proyectos huérfanos — empresa obligatoria al crear
- [Admin] Solo superadmin elige empresa al crear proyecto

---

## [0.7.x] — Sprint 7-8 (abril-mayo 2026)

### Added
- [T6] Política IA generada por LLM — sector-aware, PDF descargable
- [T6] Recomendaciones LLM — Risk & Governance (AI Act + ISO 42001)
- [T5] Clickable dept×domain dots → DeptCategoryModal
- [T4] Opción departamento en casos de uso
- [T8] Fix bug IA + ajustes de componentes
- [T9] Update y correcciones
- [Infra] `VITE_DEMO_ENABLED` flag — producción sin datos demo, staging conserva demo mode
- [Infra] Dual demo mode — gobytech-prod sin datos, lean-ai-system-pro con demo mode
- [Infra] Auto-añadir miembros de empresa a `project_members` al crear proyecto

---

## [0.1.0] — Sprint 0 (abril 2026)

### Added
- Arquitectura inicial definida (ARQUITECTURA.md — Sprint 0)
- Stack: React 18 + Vite + TypeScript + Tailwind + Supabase + Vercel
- 9 decisiones técnicas D1-D9 (ahora formalizadas como ADR-001 a ADR-009)
- Schema base (001_foundation.sql): profiles, engagements, members, company_profiles, frictions, T1, T2, T3, T4, T5, T12
- Sistema de diseño: Inter + paleta metálica + pastel funcional + 12px border radius
- Estructura modular: `src/modules/T[N]_[Name]/` para las 13 herramientas
- Deploy en Vercel + 2 proyectos Supabase (PRO/DEV) configurados
