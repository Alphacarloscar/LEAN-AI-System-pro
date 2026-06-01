# Environments — L.E.A.N. AI System Enterprise

Last updated: 2026-06-01
AI-Ready Repository System v2.1.0

---

## Environment Map

| Environment | Label | Branch | Supabase Project | Vercel URL | Who uses it |
|-------------|-------|--------|-----------------|------------|-------------|
| Production | **PRO** | `main` | [COMPLETAR: nombre proyecto Supabase PRO] | lean-ai.consultoriaalpha.com | Clientes reales |
| Pre-production | **PRE** | `develop` | [COMPLETAR: nombre proyecto Supabase DEV] | Preview Vercel automático por PR | Carlos (QA) |
| Local dev | **DEV** | any | [COMPLETAR: nombre proyecto Supabase DEV] | localhost:5173 | Carlos (dev) |

> DEV y PRE comparten el mismo proyecto Supabase de desarrollo. Si en el futuro se necesita separación completa, se creará un tercer proyecto (PRE dedicado) y se documentará en ADR-006 actualización.

---

## Environment Variables

### PRO (production — rama `main`)

Configurar en **Vercel Dashboard → Project → Settings → Environment Variables → Production**:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase de producción |
| `VITE_SUPABASE_ANON_KEY` | Clave anon del proyecto Supabase de producción |
| `VITE_DEMO_ENABLED` | `false` — producción siempre con datos reales |

Edge Functions (configurar en **Supabase Dashboard → Edge Functions → Secrets**):
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key de Anthropic para recomendaciones IA |

### PRE / DEV (desarrollo/staging — rama `develop` y local)

Configurar en **Vercel Dashboard → Project → Settings → Environment Variables → Preview** (para Vercel preview) y en `.env.local` (para desarrollo local):

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase de desarrollo |
| `VITE_SUPABASE_ANON_KEY` | Clave anon del proyecto Supabase de desarrollo |
| `VITE_DEMO_ENABLED` | `true` — PRE siempre con datos demo |

---

## Data Rules per Environment

### PRO — datos reales, sagrados
- Contiene datos reales de clientes. Acceso restringido a: `superadmin` + Claude solo a través del código (nunca directo a BD).
- **Nunca** copiar a PRE o DEV sin anonimización completa.
- Cualquier acceso directo al SQL Editor de PRO debe estar justificado (solo para migraciones validadas).
- Backups: automáticos via Supabase (verificar frecuencia en Supabase Dashboard → Database → Backups).

### PRE — datos sintéticos/demo
- `VITE_DEMO_ENABLED=true` → carga escenarios demo de `src/data/demo/scenarios/`
- Puede resetearse en cualquier momento. No hay datos reales que proteger.
- Usado para: QA antes de releases, demos a potenciales clientes con datos simulados.

### DEV — datos desechables
- Mismo proyecto Supabase que PRE. Datos de prueba que pueden resetearse libremente.
- Seed de datos de prueba: ejecutar SQL de `supabase/seed/` en Supabase SQL Editor (proyecto DEV).
- El modo demo (`VITE_DEMO_ENABLED=true`) funciona igual que en PRE.

---

## Deploy Flow

```
feature-*, refactor-*, fix-*
         │
         ▼
    [PR → develop]
    CI + validate-docs ✓
    1 approval (Carlos) ✓
         │
         ▼
    develop → PRE (Vercel preview automático)
    Validar en PRE con datos demo
         │
         ▼
    [PR: develop → main]
    CI + validate-docs ✓
    1 approval (Carlos) ✓
         │
         ▼
    main → PRO (Vercel deploy automático)
    lean-ai.consultoriaalpha.com actualizado
```

---

## VITE_DEMO_ENABLED — comportamiento detallado

| Valor | Comportamiento |
|-------|---------------|
| `true` | Selector de empresa muestra "Proyecto Demo". Datos cargados desde `src/data/demo/scenarios/` (change-resistance, data-visibility, pilot-chaos, slow-decisions, vendor-sprawl). Sin acceso a BD para datos de engagement. |
| `false` | Producción normal. Solo datos reales de la BD. Sin proyecto demo en el selector. |
| *(no definida)* | Equivale a `false`. |

---

## Access by Role and Environment

| Rol | PRO | PRE | DEV (local) |
|-----|-----|-----|-------------|
| `superadmin` | Acceso total | Acceso total | Acceso total |
| `consultant` | Sus engagements | Sus engagements (demo) | Local test data |
| `client_editor` | Su empresa | Su empresa (demo) | — |
| `client_viewer` | Su empresa (read-only) | Su empresa (demo, read-only) | — |
| Claude (AI) | Via código únicamente | Via código únicamente | Via código + SQL Editor (DEV) |

> **Claude nunca ejecuta queries directas a la BD de PRO.** Todas las operaciones de producción van a través de migraciones validadas en DEV → PRE → PRO.
