# Branching Strategy — L.E.A.N. AI System Enterprise

Last updated: 2026-06-01
AI-Ready Repository System v2.1.0

---

## Environments & Branch Mapping

| Branch | Environment | Label | Deployment | Auto-deploy |
|--------|-------------|-------|------------|-------------|
| `main` | Production | **PRO** | lean-ai.consultoriaalpha.com | ✅ On merge |
| `develop` | Pre-production | **PRE** | Preview Vercel automático | ✅ On merge |
| local | Development | **DEV** | localhost:5173 | — |

> Las URLs de Vercel preview son dinámicas por PR. El proyecto Supabase es el de desarrollo para `develop` y local.

---

## Branch Naming Convention

### Ramas estándar

| Prefijo | Propósito | Base | Merge hacia | Ejemplo |
|---------|----------|------|-------------|---------|
| `feature-` | Nueva funcionalidad | `develop` | `develop` | `feature-t13-sustainability-module` |
| `refactor-` | Mejora de código sin cambio funcional | `develop` | `develop` | `refactor-auth-store-cleanup` |
| `fix-` | Bug no crítico con workaround disponible | `develop` | `develop` | `fix-t2-quadrant-clip-path` |
| `fix-critical-` | Bug crítico en producción | `main` | `main` + `develop` | `fix-critical-auth-deadlock` |

### Reglas
- Siempre **kebab-case**: `feature-mi-nueva-cosa`, nunca `feature/MiNuevaCosa`
- Descriptivo pero conciso: `fix-stakeholder-avatar-overflow`, no `fix-bug`
- Sin números de versión en nombres de rama — los tags van en `main`
- Los prefijos del historial anterior (`feat()`, `fix()`, `debug:`) quedan en los commits — las **ramas** siguen la convención kebab-case de este documento

---

## Flujos

### Flujo normal (feature / refactor / fix)

```
develop
  └──► [checkout] feature-*, refactor-*, fix-*
              │
              ▼
         [desarrollar, commitear]
              │
              ▼
         [abrir PR → develop]
              │
         [CI + validate-docs pasan]
              │
         [1 aprobación — Carlos]
              │
              ▼
         [merge a develop] ──► PRE deploy automático
              │
              ▼ (cuando PRE está validado y el sprint termina)
         [abrir PR: develop → main]
              │
         [1 aprobación — Carlos]
              │
              ▼
         [merge a main] ──► PRO deploy automático
                            lean-ai.consultoriaalpha.com actualizado
```

### Flujo fix crítico (fix-critical-*)

```
main
  └──► [checkout] fix-critical-[descripción]
              │
              ▼
         [fix mínimo — solo el problema, nada más]
              │
              ▼
         [abrir PR → main]   ← revisión exprés: 1 aprobación, máx 2h
              │
         [CI pasa]  (validate-docs: relajado en críticos)
              │
              ▼
         [merge a main] ──► PRO deploy automático
              │
              ▼ OBLIGATORIO
         [abrir PR: fix-critical-* → develop]
              │  (o cherry-pick del commit)
              ▼
         [merge a develop] ──► PRE actualizado con el fix
```

> ⚠️ **Crítico**: Un `fix-critical-*` no backporteado a `develop` crea divergencia entre PRO y PRE.
> Esta divergencia DEBE resolverse antes del próximo release normal.

---

## Criterio: fix-critical vs fix normal

**Usar `fix-critical-` cuando CUALQUIERA de estos es verdad:**
- Clientes en producción no pueden usar el sistema (caída total o flujo core roto)
- Pérdida o corrupción de datos en PRO
- Vulnerabilidad de seguridad siendo explotada activamente
- Flujo de auth completamente roto (los usuarios no pueden hacer login)
- Flujo de facturación o acceso de pago roto

**Usar `fix-` (normal) cuando:**
- El bug afecta a un flujo secundario y existe workaround disponible
- El impacto es cosmético o de usabilidad menor
- Afecta solo a un subconjunto pequeño de usuarios en un path no crítico
- Puede esperar al siguiente ciclo de release normal

**¿Duda?** → Usar `fix-` y escalar a `fix-critical-` si empeora. Promover es más fácil que degradar.

---

## Convenciones de Commit

Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/):

| Tipo de rama | Prefijo de commit | Ejemplo |
|-------------|------------------|---------|
| `feature-*` | `feat:` o `feat(módulo):` | `feat(T13): add sustainability assessment module` |
| `refactor-*` | `refactor:` o `refactor(módulo):` | `refactor(auth): extract session helpers to lib/` |
| `fix-*` | `fix:` o `fix(módulo):` | `fix(T2): stakeholder quadrant clip path overflow` |
| `fix-critical-*` | `fix!:` | `fix!: resolve auth Web Lock deadlock on session restore` |
| docs / infra | `chore:` o `docs:` | `chore: update BRANCHING.md conventions` |

El `!` en `fix!:` señala un cambio crítico — aparece como breaking change en el CHANGELOG.

---

## Requisitos de PR

### Todos los PRs
- [ ] Descripción explica QUÉ cambió y POR QUÉ (mínimo 50 caracteres)
- [ ] `CHANGELOG.md` actualizado en `[Unreleased]`
- [ ] CI pasa (`ci` + `validate-docs` checks)
- [ ] Si hay cambio de esquema de BD: ADR o ADR-006 actualizado + script SQL incluido
- [ ] Vinculado a GitHub Issue si aplica

### PRs a `main` (release o fix-critical)
- [ ] Todo lo anterior
- [ ] Validado en PRE antes del merge (para releases normales)
- [ ] 1 aprobación — Carlos

### PRs fix-critical a `main` (exprés)
- [ ] Scope mínimo — solo el fix, nada más
- [ ] 1 aprobación mínima
- [ ] PR de backport a `develop` abierto simultáneamente

---

## Configuración de Branch Protection (GitHub)

Aplicar en **GitHub → Settings → Branches → Add rule**:

**Rama `main`:**
- Require pull request before merging: ✅
- Required approvals: **1** (Carlos)
- Require status checks to pass: `ci`, `validate-docs`
- Require branches to be up to date before merging: ✅
- Include administrators: ✅
- Allow force pushes: ❌

**Rama `develop`:**
- Require pull request before merging: ✅
- Required approvals: **1** (Carlos)
- Require status checks to pass: `ci`
- Allow force pushes: ❌

---

## Proceso de Release

Cuando `develop` está listo para ir a producción:

1. Verificar que PRE está estable (no hay bugs conocidos en el preview de develop)
2. Actualizar `CHANGELOG.md`: renombrar `[Unreleased]` a `[X.Y.Z] - YYYY-MM-DD`
3. Abrir PR: `develop → main` con release notes en la descripción
4. Obtener aprobación de Carlos
5. Merge a main → PRO deploy automático
6. Crear Git tag desde GitHub: `vX.Y.Z`
7. Abrir nueva sección `[Unreleased]` en CHANGELOG.md

---

## Instrucciones para la IA (Claude)

Cuando trabajes en este repositorio:

- **Siempre hacer branch desde la base correcta**: `develop` para feature/refactor/fix, `main` para fix-critical
- **Nunca pushear directamente a `develop` o `main`** — siempre via PR
- **Proponer el nombre de rama** antes de crearla, usando las convenciones de este documento
- **Verificar divergencia** después de un fix-critical: abrir siempre el PR de backport a develop
- **Incluir entrada en CHANGELOG.md** en cada PR que cambie comportamiento visible
- **ADR obligatorio** si el PR incluye cambios a package.json (deps), supabase/migrations/, o vercel.json

→ Detalle de entornos: docs/operations/ENVIRONMENTS.md
→ Configuración: .ai-config.yml → branches
