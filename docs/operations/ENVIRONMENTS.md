# Environments — GOBY

Last updated: 2026-06-01
AI-Ready Repository System v2.1.0

---

## Environment Map

| Environment | Label | Branch | Supabase | Vercel URL | Who uses it |
|-------------|-------|--------|----------|------------|-------------|
| Production | **PRO** | `main` | `vbpgsgxsslccctjhuegt` (remote) | https://gobytech-prod.vercel.app/ | Clientes reales |
| Pre-production | **PRE** | `develop` | `mkypmakmkxpecuezofkk` (remote) | https://v0-lean-ai-system.vercel.app/ | Carlos (QA, demos) |
| Local dev | **DEV** | any | Supabase CLI local (127.0.0.1:54321) | localhost:5173 | Carlos (dev) |

> DEV usa Supabase CLI local (`supabase start`) — base de datos propia en la máquina, desechable y sin datos reales.
> PRE usa el proyecto remoto `mkypmakmkxpecuezofkk` con datos sintéticos.
> PRO usa el proyecto remoto `vbpgsgxsslccctjhuegt` con datos reales de clientes.

---

## Environment Variables

### PRO (production — rama `main`)

Configurar en **Vercel Dashboard → Project → Settings → Environment Variables → Production**:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase de producción |
| `VITE_SUPABASE_ANON_KEY` | Clave anon del proyecto Supabase de producción |

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

---

## Data Rules per Environment

### PRO — datos reales, sagrados
- Contiene datos reales de clientes. Acceso restringido a: `superadmin` + Claude solo a través del código (nunca directo a BD).
- **Nunca** copiar a PRE o DEV sin anonimización completa.
- Cualquier acceso directo al SQL Editor de PRO debe estar justificado (solo para migraciones validadas).
- Backups: automáticos via Supabase (verificar frecuencia en Supabase Dashboard → Database → Backups).

### PRE — datos sintéticos
- Datos de prueba sintéticos contra el proyecto Supabase de desarrollo.
- Puede resetearse en cualquier momento. No hay datos reales que proteger.
- Usado para: QA antes de releases.

### DEV — datos desechables
- Mismo proyecto Supabase que PRE. Datos de prueba que pueden resetearse libremente.
- Seed de datos de prueba: ejecutar SQL de `supabase/seed/` en Supabase SQL Editor (proyecto DEV).

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
    https://gobytech-prod.vercel.app/ actualizado
```

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
