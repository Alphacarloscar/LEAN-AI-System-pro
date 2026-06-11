# GOBY — AI Dev Hub 🚀
# v2.2.0 | Language: ESP (Human) / ENG (AI Files) | Owner: Carlos Sánchez

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
