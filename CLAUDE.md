# GOBY — AI Dev Hub 🚀
# v2.2.0 | Language: ESP (Human) / ENG (AI Files) | Owner: Carlos Sánchez - Alpha Consulting

> CRITICAL: Carlos operates via Web UI ONLY (ADR-005). NO CLI commands.
> Provide raw SQL for Supabase SQL Editor and GitHub web guidelines.

## 🛠️ Core Commands
- Install: `npm ci`
- Verification: `npm run typecheck` (Cheap) | `npm run build` (Phase closure only)
- Unit Tests: `npm run test`
- E2E Tests (PRE): `npx playwright test`

## 🧠 AI Execution & Token Optimization
- **Model:** Sonnet for mechanical refactors. Opus for complex architecture only.
- **Reading:** Use grep/ripgrep to locate. Read relevant lines ONLY, never full files.
- **Scope:** Stick strictly to the requested task. Do not explore or edit outside bounds.
- **Reports:** Concise only. Show change table + grep/tsc verification. Do not reproduce untouched code.
- **UI Components:** Reuse existing design-system pieces (Button, FormField, Card, Badge, Modal, Tabs). Do not build new ones unless ≥2 consumers.

## 🧱 Strict Architecture Rules
- **ADR-011:** NO direct Supabase imports in Views/Stores. Use `src/services/`.
- **ADR-010:** Operational errors must use `reportError(context, err)`. No raw `console.error`.
- **ADR-013:** View components limit: Max 400 lines. Extract to subfolders if needed.
- **ADR-014:** LLM generations must use `useEdgeFunctionInvoke` hook.
- **CI Trigger:** To run Playwright E2E on CI, PR title must contain `feat:`, `refactor`, or `[e2e]`.

## 🔄 Self-Documenting Pipeline (MANDATORY)
Every change must be documented in the SAME commit/PR:
1. Extended technical context lives in `docs/architecture/OVERVIEW.md`.
2. Database models and schemas live in `docs/operations/DATABASES.md`.
3. If you fix or introduce tech debt, log it instantly in `docs/architecture/TECH-DEBT.md`.
4. For new standards, instantiate from template in `docs/decisions/`.

## DATABASE SAFETY RULES (BLOQUEANTE — leer antes de cualquier operación de BD)

### Comandos permitidos y prohibidos

| Acción | Comando correcto | PROHIBIDO |
|---|---|---|
| Aplicar migraciones pendientes | `supabase migration up` | ~~`supabase db reset`~~ |
| Ver estado del entorno | `supabase status` | — |
| Reconstrucción total (solo DEV) | `supabase db reset` + keyword `CONFIRM_RESET` | Sin keyword = prohibido |

### Reglas absolutas

1. **NUNCA ejecutar `supabase db reset`** sin que el usuario haya escrito explícitamente la keyword `CONFIRM_RESET` en el mismo mensaje de instrucción.
2. **`supabase db reset` destruye el esquema local completo y todos los datos.** El comando correcto para aplicar migraciones es `supabase migration up`.
3. **El campo `domain_id` en la tabla `projects` es INMUTABLE.** Una vez insertado, nunca hacer UPDATE sobre él. Está enforced en DB y en la Edge Function `ai-recommend`.
4. **Environments PRE y PRO:** nunca ejecutar migraciones ni SQL directo desde CLI. Solo vía SQL aprobado por Carlos en el panel web de Supabase.
5. **Antes de cualquier operación de BD:** confirmar el entorno activo con `supabase status`.

### Flujo correcto de migraciones (DEV local)

```
supabase status # confirmar que apunta a local
Crear fichero en supabase/migrations/ con nombre YYYYMMDD_HHMMSS_descripcion.sql
supabase migration up # aplica solo las migraciones pendientes
supabase gen types > src/types/supabase.ts # regenerar tipos TypeScript
npm run typecheck # verificar coherencia
```

## ADR-021 — Design System Enforcement
- PROHIBIDO: bg-gray-*, text-gray-*, border-gray-* → usar equivalentes warm-*
- PROHIBIDO: shadow-lg, shadow-xl, shadow-2xl → máximo shadow-md
- PROHIBIDO: rounded-2xl, rounded-3xl → usar rounded-xl
- PROHIBIDO: HEX hardcodeados en JSX → usar tokens del DS o chartTokens.ts
- PROHIBIDO: strokeWidth={2} en iconos → usar {1.5}
- PROHIBIDO: emoji en código TSX → usar Badge DS o iconos Lucide
- OBLIGATORIO: Colores de gráficos vía chartTokens.ts, no inline
- OBLIGATORIO: Todo icono semántico con texto o tooltip explicativo
- Exentos: archivos *PDF*.tsx pueden usar style={{}} inline pero con valores del DS

## DOCUMENTATION CHECKLIST (obligatorio en cada PR)

Antes de declarar cualquier tarea completada, verificar:

- [ ] Si hay cambio en BD: actualizar `DATABASES.md`
- [ ] Si hay decisión arquitectónica nueva: crear/actualizar ADR en `docs/adr/`
- [ ] Si hay deuda técnica: añadir/cerrar entrada en `TECH-DEBT.md`
- [ ] Si hay nuevo patrón de código: actualizar `ARQUITECTURA.md` u `OVERVIEW.md`
- [ ] Tests actualizados: unitarios + E2E si el cambio afecta a flujos de usuario
- [ ] `npm run typecheck` pasa sin errores
- [ ] `npm run test` pasa sin regresiones