# Infrastructure — GOBY

Last updated: 2026-06-01
AI-Ready Repository System v2.1.0

> ⚠️ Política de seguridad: Este fichero documenta la ESTRUCTURA y PROPÓSITO de la infraestructura.
> Nunca contiene IPs reales, hostnames de producción, credenciales, tokens ni API keys.
> Los datos de conexión viven en variables de entorno gestionadas via Vercel Dashboard y Supabase Dashboard.

---

## Cloud Services

### Vercel — Hosting & Deployment

| Propiedad | Valor |
|-----------|-------|
| Propósito | Hosting del frontend SPA + preview deployments automáticos por PR |
| Entornos | PRO (rama `main`), PRE (rama `develop` + preview automático por PR) |
| Config file | `vercel.json` (rewrites para SPA routing) |
| Dashboard | https://vercel.com/dashboard (acceso: Carlos como project owner) |
| Deploy | Automático en cada merge a `main` o `develop` |

**Variables de entorno requeridas** (configurar en Vercel Dashboard → Project → Settings → Env Vars):

| Variable | Entorno | Descripción |
|----------|---------|-------------|
| `VITE_SUPABASE_URL` | Production | URL del proyecto Supabase PRO |
| `VITE_SUPABASE_ANON_KEY` | Production | Clave anon pública del proyecto Supabase PRO |
| `VITE_SUPABASE_URL` | Preview | URL del proyecto Supabase DEV |
| `VITE_SUPABASE_ANON_KEY` | Preview | Clave anon pública del proyecto Supabase DEV |

> No existe `VITE_CLAUDE_API_KEY` activa en el cliente — la Claude API key se gestiona como secret de Supabase Edge Functions, no como variable de Vite.

---

### Supabase — Database, Auth, Storage & Edge Functions

| Propiedad | Valor |
|-----------|-------|
| Propósito | Backend completo: PostgreSQL + Auth + Storage + Realtime + Edge Functions |
| Entornos | 3 entornos: PRO (`vbpgsgxsslccctjhuegt`), PRE (`mkypmakmkxpecuezofkk`), DEV (local CLI) |
| Config | `supabase/config.toml` (si existe) |
| Migrations | `supabase/migrations/` — ejecutar en SQL Editor de cada proyecto |
| Dashboard | https://supabase.com/dashboard (acceso: Carlos como project owner) |

**Variables de entorno requeridas:**

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | Project URL del proyecto (diferente por entorno) |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key (segura para el cliente — no bypassa RLS) |

**Variables que NUNCA van en el cliente:**

| Variable | Por qué es peligrosa |
|----------|---------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Bypassa completamente RLS — acceso admin total |

> 🔴 Red flag: Si ves `SUPABASE_SERVICE_ROLE_KEY` en cualquier fichero `.ts` o `.tsx` de `src/`, STOP y reportar inmediatamente.

**Supabase Edge Functions secrets** (configurar en Supabase Dashboard → Edge Functions → Secrets):

| Secret | Descripción |
|--------|-------------|
| `ANTHROPIC_API_KEY` | API key de Anthropic para la Edge Function `ai-recommend` |

→ Detalle de proyectos por entorno: docs/operations/DATABASES.md

---

### Claude API (Anthropic) — AI Recommendations

| Propiedad | Valor |
|-----------|-------|
| Propósito | Motor de recomendaciones IA: política corporativa de IA (T6), recomendaciones contextuales |
| Entornos | PRO, PRE (via Edge Functions de Supabase) |
| Integración | Supabase Edge Function `ai-recommend` (Deno) — ver ADR-009 |
| Dashboard | https://console.anthropic.com (acceso: Carlos como account owner) |

**Flujo de invocación:**
```
Frontend → invoke('ai-recommend', { body }) → Edge Function
                                                    ↓
                                              Verifica JWT
                                                    ↓
                                             Lee BD (RLS)
                                                    ↓
                                           Claude API (server-side)
                                                    ↓
                                           Respuesta al frontend
```

> La API key de Anthropic NUNCA aparece en código cliente ni en variables `VITE_`. Solo existe como secret en Supabase Edge Functions.

---

## Own Servers / VPS

No se detectaron servidores propios en este proyecto. Toda la infraestructura corre en servicios cloud gestionados (Vercel + Supabase + Anthropic).

[COMPLETAR si en el futuro se añade un servidor propio — crear ADR para documentar la decisión]

---

## Development Environment Setup

### Versiones de runtime

| Herramienta | Versión | Gestor |
|-------------|---------|--------|
| Node.js | ES2020+ target (ver package.json engines si se añade) | nvm (recomendado) |
| TypeScript | 5.7.x | npm (incluido en devDependencies) |
| npm | ≥ 9.x | Incluido con Node.js |

**Setup rápido para nuevo entorno:**
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# → Rellenar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY con valores del proyecto DEV
# → Obtener valores de Carlos via canal seguro (no Slack, no email)

# Arrancar en local
npm run dev
# → http://localhost:5173
```

### Herramientas locales recomendadas

| Herramienta | Propósito | Instalación |
|-------------|----------|-------------|
| Node.js (via nvm) | Runtime JavaScript | https://github.com/nvm-sh/nvm |
| Git | Control de versiones | Sistema operativo |
| VS Code | Editor (recomendado) | https://code.visualstudio.com |
| VS Code + GitHub Copilot / Claude | AI assistance | Extensiones de VS Code |

> **Supabase CLI** se usa únicamente en DEV local (`supabase start`) para levantar la BD local. Carlos no ejecuta CLI — es Claude quien lo gestiona en las sesiones de desarrollo local.
> **Vercel CLI** no se requiere — los deploys ocurren automáticamente en Vercel al hacer merge.

### Variables de entorno locales

Copiar `.env.example` a `.env.local` y rellenar con los valores del proyecto Supabase DEV:

```bash
cp .env.example .env.local
```

> ⚠️ `.env.local` está en `.gitignore`. **Nunca commitear este fichero.**
> Los valores se obtienen de Carlos directamente (Supabase Dashboard → proyecto DEV → API settings).

→ Onboarding completo: docs/operations/ONBOARDING.md
→ Entornos y variables: docs/operations/ENVIRONMENTS.md
