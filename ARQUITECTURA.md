# ARQUITECTURA — L.E.A.N. AI System

Documento de cierre del Sprint 0. Esta es la base técnica sobre la que se construyen todos los sprints posteriores.
Última actualización: 2026-04-19
Propietarios: Carlos Sánchez (COO, co-arquitecto) + Claude (co-arquitecto técnico)

---

## Tabla de contenidos

1. Resumen ejecutivo
2. Decisiones D1-D9 consolidadas
3. Stack técnico y justificación
4. Modelo de datos (entidades, relaciones, multi-tenancy)
5. Estructura del repositorio
6. Flujo de trabajo operativo (GitHub → Vercel → Supabase) sin CLI
7. Sistema de diseño (tokens, tipografía, paleta, componentes)
8. Contratos de datos por herramienta (T1-T13)
9. Plan de modularización del HTML monolítico actual
10. Riesgos técnicos y mitigaciones
11. Primeros commits sugeridos (Sprint 0.5 y Sprint 1)
12. Glosario para futuras referencias

---

## 1. Resumen ejecutivo

El L.E.A.N. AI System se construye como una aplicación web moderna (React + Vite + TypeScript + Tailwind) con Supabase como backend único (PostgreSQL + Auth + Storage + Realtime) y Vercel como hosting con deploy automático desde GitHub.

La arquitectura es modular: cada una de las 13 herramientas (T1-T13) vive como módulo independiente con su propia carpeta, consumiendo y produciendo entidades de datos a través de una capa de servicios compartida. Los contratos de datos entre herramientas están explícitamente definidos (ver sección 8) y las dependencias entre fases (L → E → A → N) están formalizadas como foreign keys estructurales + JSONB para payloads flexibles.

El sistema soporta multi-tenancy desde el día 1 vía Row Level Security (RLS) de PostgreSQL, con un modelo de 5 arquetipos de usuario y autenticación formal con MFA obligatorio para todos los roles.

Dos entornos separados (producción estable + desarrollo evolutivo) protegen al cliente mientras permiten iteración rápida. Carlos aprueba releases sin tocar terminal; Claude ejecuta todo el código, migraciones SQL manuales y despliegues.

El sistema de diseño está definido con tokens (Inter, paleta metálica + pastel funcional, 12px border radius, modo light por defecto con dark toggle) y construido en Sprint 0.5 antes de tocar ninguna herramienta.

El producto evoluciona de consultoría pura (vía A, corto plazo) a SaaS asistido por PM interno (vía B, 6-12 meses) y formación/certificación (vía C, 12+ meses). La arquitectura no bloquea ninguna de estas evoluciones.

---

## 2. Decisiones D1-D9 consolidadas

| # | Decisión | Resultado | Impacto principal |
|---|---|---|---|
| D1 | Stack frontend | React + Vite + Tailwind + TypeScript; Recharts para visualización; SheetJS para Excel/CSV | Ecosistema robusto con docs nativas para Claude-assisted coding |
| D2 | Modelo de datos | Híbrido: FKs estructurales + JSONB para payloads flexibles por herramienta | Comparabilidad entre clientes + flexibilidad por herramienta |
| D3 | Multi-tenancy | RLS como modelo principal; ruta de promoción a esquema-por-cliente o instancia bajo demanda comercial | Cubre MVP sin sobrediseñar; evolución clara si cliente enterprise la exige |
| D4 | Modularización HTML | Migración incremental herramienta por herramienta, no big-bang | Reduce riesgo; permite desplegar parcial sin bloquear uso actual |
| D5 | Workflow sin CLI | Carlos revisa PRs en GitHub web + aprueba deploys en Vercel; Claude ejecuta código, tests, migraciones SQL manuales | Carlos nunca toca terminal; Claude asume peso técnico |
| D6 | Separación prod/dev | 2 proyectos Supabase (prod/dev) + 2 deploys Vercel (prod/preview) + ramas `main`/`develop` | Cliente nunca ve código inestable; iteración agresiva posible en dev |
| D7 | Identidad y roles | 5 arquetipos: `consultor_alpha`, `pm_cliente`, `viewer_csuite`, `admin_alpha`, `superadmin` (Carlos + Óscar); MFA universal | Cubre SaaS asistido + vía consultoría + control total de fundadores |
| D8 | Contratos de datos T1-T13 | Grafo de dependencias con hard/soft deps; snapshot con versionado para outputs consumidos | Ecosistema real con trazabilidad ISO 42001 gratis |
| D9 | Sistema de diseño | Inter + paleta metálica (blanco/negro/plata/azul marino) + pastel funcional; light default + dark opcional; 12px radius | Diferencial de venta + consistencia visual en las 13 herramientas |

Detalle completo de cada decisión en las secciones 3-8.

---

## 3. Stack técnico y justificación

### 3.1 Frontend

**React 18 + Vite + TypeScript + Tailwind CSS.**

- **React:** ecosistema dominante en AI-assisted coding (más training data, más ejemplos en docs de librerías). Recharts, Supabase y la mayoría del stack publican primero para React.
- **Vite:** build tool moderno, 10-50x más rápido que Webpack/Create React App en arranque. Hot Module Replacement inmediato. Configuración mínima.
- **TypeScript:** tipado estático desde el día 1. Detecta bugs en tiempo de desarrollo, mejora autocomplete, documenta el código como efecto colateral. Para un proyecto donde Claude escribe ≥98% del código, TS es casi gratis y ahorra iteraciones.
- **Tailwind CSS:** utility-first, estilos inline sin archivos CSS separados. Cero context-switching entre archivos. Tokens del sistema de diseño se definen en `tailwind.config.ts` y se usan en componentes.

### 3.2 Visualización

- **Recharts** para gráficos estándar (araña T1, burbujas T2, heatmaps T7, Gantt T9, dashboards T10). Es React-native, no requiere pegamento manual.
- **D3** solo si Recharts no cubre un caso específico (no anticipado en el MVP).

### 3.3 Procesamiento de archivos

- **SheetJS** (xlsx) para leer Excel que el cliente sube (ej. catálogo de stakeholders inicial, inventario de herramientas IA).
- **Papaparse** para CSV.
- Ambos operan en cliente, sin enviar datos sensibles a servidor externo.

### 3.4 Generación de PDFs

- **@react-pdf/renderer** para briefings ejecutivos, QW1, QW4, exports de T10. Genera PDFs pixel-perfect desde componentes React, con la misma paleta (versión plana, sin metálicos).
- Alternativa si @react-pdf no basta: **puppeteer** en funciones serverless de Vercel para renderizar HTML a PDF (más caro computacionalmente pero más fiel al diseño web).

### 3.5 Backend — Supabase

Supabase es la plataforma backend completa:

- **PostgreSQL 15** como base de datos relacional + JSONB nativo para payloads flexibles.
- **GoTrue** como servicio de autenticación (email/password, OAuth, MFA TOTP).
- **PostgREST** genera API REST automática desde el esquema de BBDD.
- **Realtime** (websockets) para actualizaciones en vivo del dashboard T10.
- **Storage** para archivos (PDFs generados, exports, logos de clientes, adjuntos de evidencias ISO).
- **Edge Functions** (Deno) para lógica serverless: generación de PDFs, cálculos pesados del motor IA futuro, webhooks.
- **Row Level Security (RLS)** para multi-tenancy (ver sección 4.3).

### 3.6 Hosting — Vercel

- Deploy automático desde GitHub al hacer push/merge.
- Preview deployments por cada PR (URL única, compartible con cliente antes de merge).
- CDN global, SSL automático.
- Dominio custom: `lean-ai.consultoriaalpha.com` (a configurar en Sprint 0.5).

### 3.7 Control de versiones — GitHub

- Repositorio privado durante MVP (≤12 meses).
- Plan: privado → público (open source core) en fase post-MVP según decisión de producto registrada.
- Workflow vía interfaz web; Carlos no usa CLI.
- GitHub Actions para CI (tests + type check + build) antes de permitir merge.

### 3.8 Librerías auxiliares

- `@supabase/supabase-js` + `@supabase/auth-helpers-react` para integración.
- `react-router-dom` v6 para routing.
- `zustand` para estado global ligero (preferido sobre Redux por simplicidad).
- `react-hook-form` + `zod` para formularios con validación tipada.
- `date-fns` para manejo de fechas (más ligero y tree-shakeable que moment).
- `lucide-react` para iconografía (consistente, open source, cubre todas las necesidades del MVP).

### 3.9 Lock-in y portabilidad

Supabase es la dependencia más crítica. Si a futuro se migra a AWS/GCP/Azure, las implicaciones son:

- **PostgreSQL es estándar** → BBDD migra sin drama (exportar .sql, importar en RDS/CloudSQL/Azure Postgres).
- **Auth (GoTrue)** es el mayor lock-in → mitigación: toda la autenticación pasa por un hook wrapper `useAuth()` propio que abstrae la implementación concreta. Si mañana cambia, se reescribe ese hook, no toda la app.
- **PostgREST** → API REST estándar, migra a cualquier ORM (Prisma, Drizzle, TypeORM).
- **Realtime** → usa protocolo Phoenix Channels; alternativas: Pusher, Ably, AWS AppSync.
- **Storage** → S3-compatible bajo el capó; migración directa a S3 real.
- **Edge Functions** → Deno + TypeScript estándar; portable a Cloudflare Workers, AWS Lambda@Edge, Vercel Functions.

**Estimación de esfuerzo para migrar todo desde Supabase:** 2-4 semanas de trabajo técnico + backup strategy + testing paralelo. No es trivial pero no es catastrófico. Mitigaciones implementadas desde el día 1 para reducir este coste:

1. Capa de servicios (`src/services/`) abstrae todas las llamadas a BBDD. Nunca un componente llama directamente a Supabase.
2. Hook `useAuth()` wrappea toda la auth.
3. Migraciones SQL escritas en PostgreSQL puro, sin features específicos de Supabase.
4. Backups periódicos a S3 externo (`pg_dump` semanal mínimo).
5. Documentación de dependencias en `DEPENDENCIAS_EXTERNAS.md`.

---

## 4. Modelo de datos

### 4.1 Entidades principales

**Jerarquía de contenedores:**

```
organization (tenant)
  └── client
       └── engagement
            └── tool_instance (1 por herramienta × engagement)
                 └── outputs específicos por herramienta
```

**Entidades transversales:**

- `profile` — usuario autenticado (1 a 1 con `auth.users` de Supabase).
- `user_role` — rol de un usuario con alcance global o por engagement.
- `catalog_*` — catálogos semilla (arquetipos, categorías IA, fases LEAN, controles ISO 42001, categorías AI Act).
- `audit_log` — registro inmutable de cambios (ISO 42001 art. 7.5).

### 4.2 Tablas principales (esquema simplificado)

```sql
-- Tenants: cada organización cliente es un tenant
CREATE TABLE organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('alpha_internal', 'client_org')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES profile(id)
);

-- Clientes individuales dentro de una organización
CREATE TABLE client (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organization(id) NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  size_employees INT,
  country TEXT,
  status TEXT CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profile(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES profile(id)
);

-- Engagement: un proyecto concreto con un cliente
CREATE TABLE engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client(id) NOT NULL,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  current_phase TEXT CHECK (current_phase IN ('listen', 'evaluate', 'activate', 'normalize', 'closed')),
  assigned_consultant_id UUID REFERENCES profile(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES profile(id)
);

-- Perfil de usuario (extiende auth.users de Supabase)
CREATE TABLE profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  organization_id UUID REFERENCES organization(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles de usuario con alcance
CREATE TABLE user_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profile(id) NOT NULL,
  role TEXT CHECK (role IN ('consultor_alpha', 'pm_cliente', 'viewer_csuite', 'admin_alpha', 'superadmin')) NOT NULL,
  scope_type TEXT CHECK (scope_type IN ('global', 'engagement')) NOT NULL,
  scope_engagement_id UUID REFERENCES engagement(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES profile(id)
);

-- Instancia de herramienta activa en un engagement
CREATE TABLE tool_instance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagement(id) NOT NULL,
  tool_code TEXT CHECK (tool_code IN ('T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12','T13')) NOT NULL,
  phase TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'in_progress', 'committed', 'archived')) DEFAULT 'draft',
  current_version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (engagement_id, tool_code)
);

-- Output de una herramienta (versionado)
CREATE TABLE tool_output (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_instance_id UUID REFERENCES tool_instance(id) NOT NULL,
  version INT NOT NULL,
  payload JSONB NOT NULL,
  committed_at TIMESTAMPTZ,
  committed_by UUID REFERENCES profile(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tool_instance_id, version)
);

-- Referencias cruzadas entre herramientas (el "pegamento" del ecosistema)
CREATE TABLE context_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_tool_instance_id UUID REFERENCES tool_instance(id) NOT NULL,
  target_tool_instance_id UUID REFERENCES tool_instance(id) NOT NULL,
  target_version_consumed INT NOT NULL,
  target_version_current INT NOT NULL,
  stale BOOLEAN GENERATED ALWAYS AS (target_version_current > target_version_consumed) STORED,
  entity_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log inmutable (ISO 42001)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profile(id),
  action TEXT NOT NULL,
  entity_table TEXT NOT NULL,
  entity_id UUID NOT NULL,
  diff JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
```

Las tablas específicas por herramienta (ej. `maturity_assessment`, `stakeholder_segment`, `prioritized_use_case`) se crean incrementalmente en cada sprint. Todas siguen el patrón:

```sql
CREATE TABLE <entity_name> (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_instance_id UUID REFERENCES tool_instance(id) NOT NULL,
  version INT NOT NULL,
  payload JSONB NOT NULL,           -- datos específicos flexibles
  structural_fields...,              -- FKs a otras entidades (rigidez donde importa)
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profile(id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES profile(id)
);
```

### 4.3 Multi-tenancy vía RLS

**Modelo elegido:** fila-por-cliente con Row Level Security (RLS) activado en todas las tablas.

Cada tabla tiene políticas que filtran automáticamente por el `organization_id` del usuario autenticado. Ejemplo simplificado:

```sql
ALTER TABLE client ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_tenant_isolation" ON client
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profile WHERE id = auth.uid()
      UNION
      SELECT scope_engagement_id::UUID FROM user_role
      WHERE user_id = auth.uid() AND role = 'superadmin'
    )
  );
```

**Cómo funciona en la práctica:** el consultor Alpha autenticado ve solo los clientes asignados a su `organization_id` Alpha, nunca ve datos de otros engagements fuera de su scope. El PM cliente ve solo los datos de su empresa. El `superadmin` (Carlos, Óscar) ve todo.

**Ruta de evolución bajo demanda comercial:**

- Si un cliente enterprise exige aislamiento físico → se promociona a **esquema-por-cliente** (`schema_client_XYZ` en el mismo proyecto Supabase).
- Si un cliente exige instancia separada (GDPR extremo, sector defensa) → se despliega **instancia-por-cliente** (proyecto Supabase dedicado).

El código de la aplicación es agnóstico a estos cambios porque la capa de servicios se conecta a la BBDD correcta según el contexto del usuario.

### 4.4 Snapshot con versionado (decisión D8)

Cuando T4 consume datos de T3, el sistema:

1. Lee el output actual de T3 (`tool_output` con `version = N`).
2. Crea un registro en `context_ref` con `target_version_consumed = N` + `target_version_current = N`.
3. Guarda el resultado de T4 como nuevo `tool_output` con su propio versionado.

Si T3 se modifica después y crea `version = N+1`:

1. Un trigger actualiza `context_ref.target_version_current = N+1`.
2. La columna calculada `stale` se vuelve `TRUE`.
3. La UI de T4 muestra un badge no-bloqueante: *"T3 actualizado — hay una versión más reciente"*.
4. El consultor puede pulsar "Actualizar" → se ejecuta recomputación + nuevo snapshot + registro en `audit_log`.

Este diseño satisface ISO 42001 art. 7.5 (documented information + trazabilidad) sin coste adicional.

---

## 5. Estructura del repositorio

```
lean-ai-system/
│
├── README.md                          # Qué es, cómo arrancar, quién mantiene
├── ARQUITECTURA.md                    # Este documento
├── DECISIONES_ESTRATEGICAS.md         # Bitácora de decisiones
├── BACKLOG_DESARROLLO.md              # Sprints activos
├── DEPENDENCIAS_EXTERNAS.md           # Proveedores, servicios, lock-in
├── CLAUDE.md                          # Instrucciones para Claude
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts                 # Design tokens (D9)
├── postcss.config.js
├── .env.example                       # Variables de entorno documentadas (sin valores)
│
├── public/                            # Assets estáticos
│   ├── favicon.ico
│   └── logos/
│
├── src/
│   ├── main.tsx                       # Entry point
│   ├── App.tsx                        # Router raíz
│   ├── routes/                        # Configuración de rutas
│   │   ├── index.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleGate.tsx
│   │
│   ├── shared/                        # Código compartido entre herramientas
│   │   ├── design-system/             # Sistema de diseño (Sprint 0.5)
│   │   │   ├── tokens.ts              # Colores, tipografía, espaciado
│   │   │   ├── components/            # Button, Card, Input, Badge...
│   │   │   ├── charts/                # Wrappers de Recharts con tokens
│   │   │   └── icons/                 # Re-export curado de lucide-react
│   │   ├── hooks/
│   │   │   ├── useAuth.ts             # Wrapper de Supabase Auth (mitigación lock-in)
│   │   │   ├── useOrganization.ts
│   │   │   └── useEngagement.ts
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx
│   │   │   └── PrintLayout.tsx        # Para exports PDF
│   │   └── utils/
│   │       ├── formatters.ts          # Fechas, números, moneda
│   │       └── validators.ts
│   │
│   ├── services/                      # Capa de acceso a datos (mitigación lock-in)
│   │   ├── supabaseClient.ts          # Único punto de conexión
│   │   ├── organizationService.ts
│   │   ├── clientService.ts
│   │   ├── engagementService.ts
│   │   ├── toolInstanceService.ts
│   │   ├── maturityService.ts         # T1
│   │   ├── stakeholderService.ts      # T2
│   │   ├── valueStreamService.ts      # T3
│   │   ├── useCaseService.ts          # T4
│   │   ├── taxonomyService.ts         # T5
│   │   ├── riskService.ts             # T6
│   │   ├── adoptionService.ts         # T7
│   │   ├── communicationService.ts    # T8
│   │   ├── roadmapService.ts          # T9
│   │   ├── dashboardService.ts        # T10
│   │   ├── rhythmService.ts           # T11
│   │   ├── backlogService.ts          # T12
│   │   ├── impactAssessmentService.ts # T13
│   │   └── auditService.ts
│   │
│   ├── modules/                       # 13 herramientas, 1 carpeta cada una
│   │   ├── T1_MaturityRadar/
│   │   │   ├── README.md              # Inputs, outputs, dependencias
│   │   │   ├── index.tsx              # Export principal
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types.ts
│   │   ├── T2_StakeholderMatrix/
│   │   ├── T3_ValueStreamMap/
│   │   ├── T4_UseCasePrioritization/
│   │   ├── T5_TaxonomyCanvas/
│   │   ├── T6_RiskGovernance/
│   │   ├── T7_AdoptionHeatmap/
│   │   ├── T8_CommunicationMap/
│   │   ├── T9_Roadmap6M/
│   │   ├── T10_ValueDashboard/
│   │   ├── T11_OperatingRhythm/
│   │   ├── T12_BacklogBoard/
│   │   └── T13_ImpactAssessment/
│   │
│   ├── lib/
│   │   ├── supabase.ts                # Cliente tipado
│   │   ├── pdf/                       # Generación de PDFs (@react-pdf/renderer)
│   │   └── engine/                    # Motor IA dinámico (Sprint 5)
│   │
│   └── types/
│       ├── database.types.ts          # Generado desde Supabase (automático)
│       ├── domain.types.ts            # Tipos del dominio de negocio
│       └── index.ts
│
├── supabase/
│   ├── config.toml                    # Configuración local
│   ├── migrations/                    # Todas las migraciones SQL versionadas
│   │   ├── 20260419000001_initial_schema.sql
│   │   ├── 20260420000001_rls_policies.sql
│   │   ├── 20260421000001_audit_log.sql
│   │   └── ...
│   ├── seed/                          # Datos semilla (catálogos)
│   │   ├── archetypes.json            # 5 arquetipos de stakeholder
│   │   ├── ai_categories.json         # 7 categorías IA
│   │   ├── lean_phases.json           # 4 fases L-E-A-N
│   │   ├── iso_42001_controls.json    # Controles ISO 42001
│   │   ├── eu_ai_act_categories.json  # Categorías AI Act
│   │   └── engagement_types.json      # Tipos de engagement
│   └── policies/
│       └── rls_policies.md            # Documentación humana de RLS
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                           # Playwright
│
├── legacy/
│   └── lean-ai-system-v6.html         # HTML monolítico actual (archivado para referencia)
│
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Type check + tests + build en cada PR
│       └── preview.yml                # Preview deploys
│
└── docs/
    ├── adr/                           # Architecture Decision Records (1 por decisión)
    ├── onboarding-carlos.md           # Cómo opera Carlos el proyecto
    └── glossary.md                    # Términos del dominio
```

---

## 6. Flujo de trabajo operativo sin CLI

### 6.1 Día a día del desarrollo

**Rol de Carlos:** estratega + reviewer. Nunca toca terminal.
**Rol de Claude:** escribe código, ejecuta tests, ejecuta migraciones, prepara PRs.

### 6.2 Flujo estándar de un cambio

1. **Carlos describe** una necesidad o decisión en el chat del área correspondiente.
2. **Claude propone** el cambio (análisis + diseño) y espera confirmación.
3. Tras confirmación, **Claude crea una rama** `feature/<descripcion-corta>` desde `develop`.
4. **Claude escribe el código** en Cowork (entorno primario), ejecuta tests localmente, verifica que el type check pasa.
5. **Claude abre un Pull Request** hacia `develop` con descripción detallada del cambio + referencias a decisiones.
6. **GitHub Actions ejecuta CI automático**: type check, tests, build. Si algo falla, Claude corrige.
7. **Vercel genera un preview deploy** con URL única.
8. **Carlos revisa**: abre la URL de preview, prueba visualmente, lee el diff en GitHub web.
9. **Carlos aprueba** el PR (click en GitHub web) → merge a `develop`.
10. **Vercel despliega automáticamente** `develop` al entorno de desarrollo.

### 6.3 Promoción a producción

1. Cuando un conjunto de cambios en `develop` está validado (consultor Alpha lo ha usado sin problemas en sesión real, o Carlos lo ha probado exhaustivamente), **Claude abre PR de `develop` a `main`**.
2. **Carlos aprueba** el PR de release.
3. Merge a `main` dispara:
   - **Deploy a Vercel prod**.
   - **Migraciones SQL manuales**: Claude copia el SQL de las migraciones nuevas en Supabase Studio (prod) y las ejecuta con revisión previa (antes de ejecutar confirma contigo).
4. **Notificación** en chat: "Release 2026-XX-XX desplegada a producción: <changelog>".

### 6.4 Branch protection

`main` y `develop` tienen protecciones activas:

- No se permite push directo.
- PR requiere al menos 1 aprobación (Carlos).
- CI debe pasar antes de merge.
- Merge de `main` requiere además que el PR venga de `develop` (no se permiten hotfixes al margen salvo emergencia documentada).

### 6.5 Migraciones SQL manuales

**Por qué manuales (decisión D5):** Carlos quiere aprender el proceso y mantener disciplina. Riesgo asumido: más lento, más propenso a error humano.

**Mitigaciones:**

- Cada migración está en un archivo SQL numerado cronológicamente en `supabase/migrations/`.
- Antes de ejecutar en prod, Claude ejecuta en dev primero y verifica que no hay errores.
- Claude comunica a Carlos el SQL exacto que va a ejecutar antes de ejecutarlo.
- Backup `pg_dump` antes de cualquier migración destructiva (alter table, drop column).
- Rollback SQL documentado para cada migración en el mismo archivo (comentado).

**Automatización futura:** cuando Carlos esté cómodo con el proceso (estimación: 3-4 migraciones), se valora activar GitHub Action que aplique migraciones automáticamente al hacer merge. No antes.

---

## 7. Sistema de diseño

### 7.1 Filosofía

- **80% Apple / 20% Whoop.**
- Emociones objetivo en el CIO: **claridad + rigor**. El diseño sirve a la decisión, no compite con ella.
- El diseño es **argumento de venta diferencial**: nadie en consultoría B2B entrega con estética "product premium".

### 7.2 Tokens de color

**Tier 1 — Branding (estructura):**

| Token | Valor | Uso |
|---|---|---|
| `white` | `#FFFFFF` | Fondo principal modo light |
| `black` | `#0A0A0A` | Texto principal, líneas de énfasis |
| `silver-metallic` | `linear-gradient(135deg, #E8E8EA 0%, #C0C0C5 50%, #A8A8AE 100%)` | Acentos estructurales, divisores premium |
| `navy-metallic` | `linear-gradient(135deg, #1B2A4E 0%, #0F1E3D 50%, #0A1530 100%)` | CTAs primarias, headers de módulo |

**Tier 2 — Funcionales pastel:**

| Token | Valor | Uso |
|---|---|---|
| `success-soft` | `#86C7A8` | Readiness alto, ROI positivo, OK |
| `warning-soft` | `#E8C281` | Atención, score medio, en revisión |
| `danger-soft` | `#D89090` | Bloqueante, riesgo alto, non-conformity |
| `info-soft` | `#9BB5D9` | Informativo, neutral |

**Tier 3 — Grises neutros:**

Escala estándar de Tailwind (`gray-50` a `gray-900`) para jerarquía interna de UI.

**Versión plana para PDFs:** los gradientes metálicos se sustituyen por sólidos:

- `silver-metallic` → `#C0C0C5`
- `navy-metallic` → `#1B2A4E`

### 7.3 Tipografía

**Familia:** Inter (OFL, open source).

| Uso | Peso | Tamaño | Tracking |
|---|---|---|---|
| Display | 600 SemiBold | 48-64px | -2% |
| H1 | 600 SemiBold | 32px | -1% |
| H2 | 500 Medium | 24px | 0 |
| H3 | 500 Medium | 18px | 0 |
| Body | 400 Regular | 14-15px | 0 |
| Caption | 400 Regular | 12px | +1% |
| Label UI | 500 Medium | 13px | +1% |
| Numerals tabulares | 500 Medium + `tnum` | según contexto | 0 |

### 7.4 Espaciado y radii

**Escala de espaciado (Tailwind `spacing`):** 4px base. Uso consistente: `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px).

**Border radius:**

| Componente | Radius |
|---|---|
| Botones, inputs, badges | 8px |
| Cards, modales, paneles | **12px** (0,12" — Carlos) |
| Containers grandes | 16px |
| Avatars, circulares | 9999px |

### 7.5 Líneas y bordes

**Decisión técnica:** líneas de 1px en color `#E5E7EB` (gris muy claro) en lugar de 0.5px negro.

**Justificación:** las líneas sub-1px solo renderizan correctamente en pantallas ≥2x densidad. En monitores 1080p estándar desaparecen inconsistentemente. El efecto "línea fina elegante" se replica con gris claro a 1px.

**Para resaltar bordes con sutileza de negro:** `box-shadow: 0 1px 0 rgba(10, 10, 10, 0.06)`.

### 7.6 Modo light / dark

**Default:** modo light.

**Dark mode:** disponible como toggle (discreto, no destacado). Razón de mantenerlo: CIOs en horas extendidas, viajes, confort de lectura.

Todos los tokens tienen variante dark definida en `tailwind.config.ts`.

### 7.7 Componentes atómicos del sistema (Sprint 0.5)

Construidos en `src/shared/design-system/components/`:

- `Button` (primary, secondary, ghost, danger)
- `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`
- `Card`, `Panel`, `Modal`, `Drawer`
- `Badge`, `Tag`, `Avatar`
- `Alert` (info, warning, danger, success)
- `Toast`
- `Table`, `DataGrid`
- `Tabs`, `Accordion`
- `Breadcrumb`, `Stepper`
- `ChartWrapper` (Recharts con tokens aplicados)
- `MetricHero` (número hero estilo Whoop para dashboards)
- `Skeleton` (loading states)

**Validación:** todos los componentes están en **Storybook** navegable antes de pasar a Sprint 1.

### 7.8 Guardian del sistema — modelo A (confirmado)

Claude es el guardian. Cada componente nuevo lo construye Claude siguiendo tokens. Carlos aprueba Storybook periódicamente. Evolución futura a modelo C (diseñador puntual) cuando aparezca el primer cliente SaaS pagando.

---

## 8. Contratos de datos por herramienta T1-T13

### 8.1 Tabla de dependencias

| Tool | Fase | Reads from | Writes to | Dep |
|------|------|---|---|---|
| **T1** Maturity Radar | L | — | `maturity_assessment`, `maturity_heatmap` | — |
| **T2** Stakeholder Segmentation | L | T1 (S) | `stakeholder_segment[]`, `licence_waste_report` (QW4) | S-T1 |
| **T3** Value Stream Map | L | T1 (H), T2 (S) | `value_stream[]`, `ai_opportunity[]` | H-T1 |
| **T4** Use Case Prioritization | E | T3 (H), T5 (H), T6 (S) | `prioritized_use_case[]` | H-T3, H-T5 |
| **T5** Taxonomy Canvas | E | T1 (H), T3 (S) | `ai_category_assessment[]` | H-T1 |
| **T6** Risk & Governance | E | T4 (H), T5 (H) | `risk_register`, `ai_policy`, `approved_catalog`, `shadow_ai_scan` (QW2) | H-T4, H-T5 |
| **T7** Adoption Heatmap | A | T2 (H), T4 (H) | `adoption_heatmap`, `activation_lever[]` | H-T2, H-T4 |
| **T8** Communication Map | A | T2 (H), T7 (H), T6 (S) | `communication_kit[]` (QW6) | H-T2, H-T7 |
| **T9** Roadmap 6M | A | T2-T8 todas (H agregado) | `roadmap_timeline`, `milestone[]` | H-T2..T8 |
| **T10** Value Dashboard | N | T4 (H), T7 (H), T9 (H) + `tracking_update[]` editables | `value_dashboard`, `tracking_update[]` | H-T4, H-T7, H-T9 |
| **T11** Operating Rhythm | N | T6 (H), T9 (H), T10 (S) | `operating_rhythm` | H-T6, H-T9 |
| **T12** Backlog Board | N | T4 (H), T10 (S), T9 (H) | `backlog_item[]` (QW8) | H-T4, H-T9 |
| **T13** System Impact Assessment (ISO) | Transversal | T1-T12 todas (H agregado) | `aims_document`, `iso_42001_mapping[]` | H-T1..T12 |

H = hard dependency (bloquea si falta). S = soft dependency (mejora pero no bloquea).

### 8.2 Nodos críticos del grafo

- **T4 (Use Case Prioritization)** — nodo más central. Lo leen T6, T7, T10, T12. Si falla, cadena descendente entera se compromete.
- **T2 (Stakeholder Segmentation)** — segundo nodo más central. Lo leen T3 (S), T4, T7, T8.
- **T3 (Value Stream Map)** — productor principal de oportunidades. Entrada crítica para T4.

Estos tres se rediseñan desde cero en Sprint 1, no se migran tal cual.

### 8.3 Payloads JSONB por herramienta

Cada entidad específica tiene un payload JSONB cuyo esquema está documentado en el `README.md` interno del módulo correspondiente. Ejemplo T1:

```json
{
  "dimensions": [
    {
      "code": "strategy",
      "score": 3,
      "evidence": "...",
      "recommendations": ["..."]
    },
    {
      "code": "data",
      "score": 2,
      "evidence": "...",
      "recommendations": ["..."]
    }
  ],
  "overall_score": 2.5,
  "maturity_level": "exploring",
  "assessment_date": "2026-04-19",
  "assessor_id": "uuid"
}
```

Los esquemas se validan en runtime con **Zod** antes de escribir en BBDD.

---

## 9. Plan de modularización del HTML monolítico

### 9.1 Estado actual (auditoría)

`lean-ai-system-v6.html` (archivado en `legacy/`):

- 7.621 líneas de código (2.5 MB son 3 imágenes base64).
- Vanilla HTML/JS/CSS. Cero React.
- Estructura: `comp-1` a `comp-12` + `nav-1` a `nav-11`.
- Router interno `loadTool()`.
- T1-T7 implementadas. T8-T12 son placeholders (`renderComingSoon`). T13 no existe.
- T7 es la más desarrollada (8+ funciones específicas).
- Dark/light mode ya presente.

### 9.2 Migración incremental (decisión D4)

**Principio:** no big-bang. Cada herramienta se reconstruye como módulo React independiente, se valida, y se publica. Las herramientas no migradas aún pueden seguir usándose desde el HTML monolítico hasta su turno.

### 9.3 Orden de migración

1. **Sprint 0.5:** sistema de diseño + scaffolding del repo. No migra ninguna herramienta, prepara el terreno.
2. **Sprint 1:** T1, T2, T3 rediseñadas desde cero (nodos críticos del grafo). QW1 instrumentado.
3. **Sprint 2:** T4, T5, T6. QW2, QW3, QW4.
4. **Sprint 3:** T7, T8, T9. QW5, QW6.
5. **Sprint 4:** T10, T11, T12, T13. QW7, QW8.

Al final de Sprint 4, el HTML monolítico se retira definitivamente.

### 9.4 Qué se conserva del HTML actual

Como referencia de diseño funcional (lo que "ya está pensado"):

- Lógica de T7 (la más desarrollada): `buildT7Summary`, `computeT7ActivationScore`, `renderT7ActivationTab`, `renderT7ExecutiveReport`, `renderT7HeatmapTab`, `renderT7InputsTab`. Se reescribe en React pero el algoritmo es la base.
- Estructura de navegación entre herramientas.
- Contenido textual de formularios, labels, ayudas.

### 9.5 Qué se descarta

- Todo el CSS vainilla (sustituido por Tailwind).
- Router `loadTool` (sustituido por react-router-dom).
- Estado global manual (sustituido por zustand + Supabase).
- Persistencia en localStorage (sustituida por Supabase).
- Los 3 assets base64 inflados (se suben a Supabase Storage).

---

## 10. Riesgos técnicos y mitigaciones

| # | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R1 | Lock-in severo con Supabase si hay que migrar a otra nube | Baja | Alto | Capa de servicios, hook `useAuth` wrapper, PostgreSQL puro, backups a S3 externo |
| R2 | Migraciones SQL manuales generan errores en prod | Media | Medio | Ejecutar siempre primero en dev, comunicar SQL antes de ejecutar, rollback SQL documentado, backups previos |
| R3 | T2 (nodo central) arrastra bugs que infectan T3, T4, T7, T8 | Media | Alto | Rediseño desde cero en Sprint 1, tests unitarios + integración exhaustivos para T2 |
| R4 | Diseño metálico no renderiza bien en impresión PDF | Alta | Bajo | Paleta plana paralela para PDFs, probada en Sprint 0.5 |
| R5 | Líneas 0.5px invisibles en monitores no-retina | Alta | Bajo | 1px gris claro como sustituto (ya resuelto en D9) |
| R6 | Performance degradado con 50+ entidades cargadas a la vez (T10, T13) | Media | Medio | Paginación virtual, lazy loading por fase, índices adecuados en PostgreSQL |
| R7 | RLS mal configurado expone datos entre tenants | Baja | Crítico | Tests de RLS específicos, revisión por pares (Claude propone, Carlos valida cada política), pre-producción con data dummy antes de prod |
| R8 | Carlos pierde acceso a cuenta superadmin → no hay recovery | Baja | Crítico | Óscar también es superadmin, backup de MFA codes, política de recovery documentada |
| R9 | Cambio del stack de AI provider en Sprint 5 invalida el trabajo previo | Media | Medio | Capa `lib/engine/` abstrae el provider; en Sprint 5 se decide proveedor con datos de costes reales |
| R10 | Deuda técnica en componentes de diseño si se construyen fuera de Storybook | Media | Medio | Regla estricta: todo componente nace en Storybook antes de usarse en módulo |
| R11 | Multi-tenancy vía RLS no escala si cliente enterprise exige aislamiento físico | Baja | Alto | Ruta documentada a esquema-por-cliente / instancia-por-cliente; código agnóstico al modelo concreto |
| R12 | Pérdida de contexto entre chats especializados | Alta | Medio | Documentos vivos (este archivo, DECISIONES_ESTRATEGICAS.md) como source of truth; cada chat los lee antes de actuar |

---

## 11. Primeros commits sugeridos

### 11.1 Sprint 0.5 (Sistema de diseño)

**Duración estimada:** 4-5 días.

1. `feat: initial repo scaffold with vite + react + typescript` — package.json, tsconfig, vite.config, tailwind.config inicial, estructura de carpetas vacía.
2. `feat: supabase client setup with env vars documentation` — `src/lib/supabase.ts` + `.env.example`.
3. `feat: design tokens (colors, typography, spacing, radii)` — `tailwind.config.ts` con paleta D9 + tokens custom.
4. `feat: Inter font integration with variable weights` — carga optimizada vía `@fontsource/inter` (self-hosted, sin dependencia de Google Fonts).
5. `feat: atomic components — Button, Input, Card, Badge, Alert` — componentes base en `src/shared/design-system/components/`.
6. `feat: chart wrappers with design tokens applied` — `ChartWrapper`, `BarChart`, `RadarChart`, `HeatmapChart` con paleta aplicada.
7. `feat: PrintLayout with flat palette for PDFs` — layout alternativo para exports.
8. `feat: storybook setup with all atomic components` — Storybook navegable en Vercel preview.
9. `feat: main layout with sidebar navigation and dark mode toggle` — `MainLayout.tsx` + tema persistente.
10. `feat: routing skeleton with protected routes and role gates` — estructura de rutas sin herramientas aún.

**Entregable Sprint 0.5:** Storybook desplegado en Vercel + app base con navegación y theming. Cero funcionalidad de negocio todavía.

### 11.2 Sprint 1 (T1, T2, T3 + QW1)

Primeros commits tras aprobar Storybook:

1. `feat: supabase schema — organization, client, engagement, profile, user_role` — primera migración SQL.
2. `feat: RLS policies for tenant isolation` — segunda migración + documentación en `rls_policies.md`.
3. `feat: audit_log infrastructure` — tercera migración + trigger genérico.
4. `feat: auth flow with MFA enrollment and login` — hook `useAuth`, pantallas de login, onboarding MFA.
5. `feat: organization + client + engagement CRUD for admin_alpha` — vistas de administración.
6. `feat: T1 Maturity Radar — 8 dimensions assessment with radar chart` — primera herramienta completa.
7. `feat: T1 executive output with PDF export` — QW1 inicial.
8. `feat: T2 Stakeholder Segmentation — bubble chart + licence waste report` — segunda herramienta.
9. `feat: T3 Value Stream Map — process mapping with readiness scoring` — tercera herramienta.
10. `feat: context_refs infrastructure with snapshot versioning` — conecta T1↔T2↔T3 como ecosistema real.
11. `feat: QW1 Executive Briefing Pack auto-generated after 3 interviews` — QW1 completo.

---

## 12. Glosario

| Término | Definición |
|---|---|
| **Engagement** | Proyecto concreto con un cliente. Contiene 1 instancia de cada herramienta T1-T13 según la fase que esté activa. |
| **Tool instance** | Ejecución de una herramienta en un engagement específico. Una herramienta puede tener múltiples versiones dentro de la misma instancia. |
| **Context ref** | Referencia cruzada entre herramientas. Registra qué versión consumió una herramienta de otra. |
| **Snapshot con versionado** | Modelo donde cuando T4 consume datos de T3, guarda una copia inmutable de esa versión. Si T3 cambia, T4 muestra badge "actualización disponible" pero no se recalcula automáticamente. |
| **RLS (Row Level Security)** | Mecanismo de PostgreSQL que filtra filas automáticamente según políticas definidas por tabla, a nivel de BBDD (no de aplicación). |
| **Hard dependency (H)** | La herramienta no puede ejecutarse sin el input. |
| **Soft dependency (S)** | La herramienta mejora con el input pero puede ejecutarse sin él. |
| **Draft / committed / archived** | Estados de un output de herramienta. Draft = en edición. Committed = firmado por consultor. Archived = ya no activo pero conservado para auditoría. |
| **Arquetipo** | Rol del usuario en la herramienta. 5 definidos: consultor_alpha, pm_cliente, viewer_csuite, admin_alpha, superadmin. |
| **Superadmin** | Rol de control total. Asignado a Carlos y Óscar como co-fundadores. |
| **AIMS** | AI Management System — sistema de gestión ISO 42001 que T13 produce. |
| **QW (Quick Win)** | Entregable rápido de alto impacto autogenerado por la herramienta. 8 definidos: QW1-QW8. |
| **Sprint 0.5** | Sprint intermedio dedicado exclusivamente al sistema de diseño antes de Sprint 1. |
| **Guardian del sistema de diseño** | Responsable de mantener consistencia visual. En MVP es Claude (modelo A). Evoluciona a diseñador humano puntual (modelo C) con el primer cliente SaaS pagando. |

---

## Cierre

Este documento es el cierre formal del Sprint 0. A partir de aquí se ejecutan Sprint 0.5 (sistema de diseño) → Sprint 1 (T1, T2, T3) → sucesivos.

Cualquier decisión técnica futura que contradiga lo escrito aquí debe:
1. Justificarse con datos nuevos o cambio de contexto de mercado.
2. Registrarse como ADR (Architecture Decision Record) en `docs/adr/`.
3. Actualizar la sección correspondiente de este documento.

Documento vivo, propiedad de Alpha Consulting Solutions S.L.
