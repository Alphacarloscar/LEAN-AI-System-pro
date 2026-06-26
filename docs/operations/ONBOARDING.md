# Onboarding — GOBY

Last updated: 2026-06-01
AI-Ready Repository System v2.1.0

> Guía para empezar a trabajar en el proyecto. Aplica para nuevos colaboradores y para
> configurar un nuevo entorno de desarrollo.
>
> ⚠️ Nota ADR-005: El flujo de trabajo de Carlos NO requiere ningún CLI.
> Esta guía usa solo GitHub web, Vercel Dashboard y Supabase Dashboard.

---

## Contexto del proyecto

**GOBY** es una plataforma web multi-tenant de Alpha Consulting Solutions S.L.
que implementa una metodología propietaria de adopción de IA para empresas B2B.

- **13 herramientas** especializadas (T1-T13) cubren el ciclo completo L→E→A→N
- **Desarrollado por:** Claude (co-arquitecto técnico) + Carlos Sánchez (COO, revisor y aprobador)
- **Producción:** lean-ai.consultoriaalpha.com

Leer antes de empezar: **CLAUDE.md** (contrato IA-Humano), **ARQUITECTURA.md** (diseño completo), **docs/decisions/README.md** (decisiones técnicas).

---

## Setup de entorno de desarrollo local

### 1. Clonar el repositorio

Desde **GitHub web**: botón "Code" → copiar URL → clonar con tu cliente git preferido.

```bash
git clone [URL del repositorio]
cd lean-ai-system
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con los valores del proyecto Supabase DEV (obtener de Carlos):

```bash
VITE_SUPABASE_URL=https://[tu-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> Los valores están en **Supabase Dashboard → proyecto DEV → Settings → API**
> Pedir acceso a Carlos si no tienes cuenta en el proyecto.

### 4. Arrancar en local

```bash
npm run dev
```

Abre http://localhost:5173

### 5. Verificar que funciona

- [ ] La app carga sin errores de consola
- [ ] Login funciona con tu usuario en el proyecto DEV
- [ ] T1 carga y muestra datos del proyecto DEV

---

## Flujo de trabajo diario

### Antes de empezar (checklist de sesión)

1. **Leer CLAUDE.md** si es una sesión nueva o tras más de 1 semana sin trabajar en el proyecto
2. **Revisar** `docs/decisions/README.md` para decisiones recientes
3. **Revisar** `CHANGELOG.md` últimas 5 entradas
4. **Verificar** `docs/architecture/TECH-DEBT.md` para items activos

### Para trabajar en una nueva funcionalidad

1. Asignar la tarea (GitHub Issues o descripción en la sesión con Claude)
2. Claude propone el nombre de la rama: `feature-[descripción]`
3. Crear rama desde `develop` en GitHub web (o clonar y hacer checkout)
4. Claude desarrolla → abre PR a `develop`
5. Carlos revisa el PR en GitHub web y aprueba
6. Merge → Vercel preview se despliega automáticamente
7. Carlos valida en el preview de `develop`

### Para reportar un bug

1. Describir el bug a Claude con: comportamiento esperado, comportamiento actual, pasos para reproducir
2. Claude diagnostica y propone rama: `fix-[descripción]`
3. Si es crítico en producción: `fix-critical-[descripción]` (ver BRANCHING.md)
4. Resto del flujo igual que funcionalidad

### Para hacer un release a producción

1. Verificar que `develop` (PRE) está estable — sin bugs conocidos
2. Actualizar CHANGELOG.md: renombrar `[Unreleased]` a `[X.Y.Z] - YYYY-MM-DD`
3. Abrir PR: `develop → main` con release notes
4. Carlos aprueba → merge → Vercel despliega automáticamente en PRO
5. Verificar en lean-ai.consultoriaalpha.com

---

## Para ejecutar migraciones de base de datos

> Todo SQL lo prepara Claude. Carlos lo ejecuta en Supabase SQL Editor.

1. Claude entrega el script SQL completo con instrucciones
2. Carlos abre **Supabase Dashboard → SQL Editor**
3. Seleccionar el proyecto correcto (DEV para pruebas, PRO para producción)
4. Pegar el script y ejecutar
5. Ejecutar la query de verificación incluida
6. Confirmar a Claude que la migración se aplicó correctamente

→ Protocolo completo: docs/operations/MIGRATIONS.md

---

## Estructura del repositorio

```
/
├── CLAUDE.md              # Contrato IA-Humano — leer siempre primero
├── ARQUITECTURA.md        # Diseño completo del sistema (documento canónico Sprint 0)
├── CHANGELOG.md           # Historial de cambios
├── .ai-config.yml         # Configuración del sistema AI-Ready
├── src/                   # Código fuente React
│   ├── modules/           # 13 herramientas (T1-T13) + Auth + Admin
│   ├── services/          # Acceso a datos (solo vía Supabase)
│   ├── stores/            # Estado global Zustand
│   ├── shared/            # Componentes y hooks compartidos
│   ├── lib/               # Supabase client, PDF, engine
│   └── types/             # Tipos TypeScript de dominio
├── supabase/
│   ├── migrations/        # SQL — ejecutar en Supabase SQL Editor
│   ├── functions/         # Edge Functions (Deno) — ai-recommend, invite-user
│   └── policies/          # RLS policies
├── docs/
│   ├── decisions/         # ADRs y FDRs
│   ├── architecture/      # OVERVIEW.md, TECH-DEBT.md
│   ├── product/           # GLOSSARY.md
│   └── operations/        # ENVIRONMENTS, BRANCHING, INFRASTRUCTURE, DATABASES, MIGRATIONS
└── .github/
    ├── workflows/         # CI + validate-docs
    └── PULL_REQUEST_TEMPLATE.md
```

---

## Comandos de desarrollo disponibles

| Comando | Qué hace |
|---------|---------|
| `npm run dev` | Arranca servidor de desarrollo en localhost:5173 |
| `npm run build` | TypeScript check + build de producción en dist/ |
| `npm run typecheck` | Solo TypeScript check (sin build) |
| `npm run lint` | ESLint — 0 warnings tolerados |
| `npm run storybook` | Sistema de diseño navegable en localhost:6006 |

---

## Accesos que necesitas

| Sistema | Acceso | Cómo obtenerlo |
|---------|--------|----------------|
| GitHub | Collaborator en el repo | Pedir a Carlos |
| Supabase DEV project | Member | Pedir a Carlos (Dashboard → Team) |
| Supabase PRO project | Solo si eres superadmin | Pedir a Carlos con justificación |
| Vercel project | Viewer o Admin | Pedir a Carlos |
| Anthropic Console | Solo si gestionas Edge Functions IA | Pedir a Carlos |

---

## Preguntas frecuentes

**¿Dónde están los tipos de la base de datos?**
En `src/types/database.types.ts` (si se generó via `supabase gen types`) o tipados explícitamente en `src/services/`.

**¿Cómo añado datos de demo?**
Editar `src/data/demo/scenarios/` — cada fichero es un escenario de demo completo.

**¿Cómo funciona la autenticación?**
Supabase GoTrue. Auth flow: login → Supabase genera JWT → `useSession` en `AuthStore` → RLS policies usan el user_id del JWT. Para usuarios invitados: `invite-user` Edge Function → email con link → `UpdatePasswordView` (aduana de primer acceso).

**¿Qué es `resetEngagementStores()`?**
Función en `src/lib/resetEngagementStores.ts` que limpia todos los stores Zustand al cambiar de engagement o hacer logout. Imprescindible llamarla en ambos casos para evitar contaminación de datos entre proyectos de cliente.
