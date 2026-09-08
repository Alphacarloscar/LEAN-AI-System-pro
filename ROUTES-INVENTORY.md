# ROUTES-INVENTORY.md — Épica 2: Estandarización de Rutas

**Fecha**: 2026-09-08  
**Estado**: Mapeo completado para implementación

---

## Zona Pública (Autenticación)

| Ruta Actual | Ruta Nueva | Estado | Notas |
|---|---|---|---|
| `/login` | `/login` | ✅ Mantener | Página de login |
| *(nuevo)* | `/forgot-password` | 🆕 Agregar | Recuperación de contraseña |
| `/reset-password` | `/reset-password` | ✅ Mantener | Reset de password por token |
| `/update-password` | `/update-password` | ✅ Mantener | Update password después de login |

---

## Zona Protegida: Dashboard / Evaluación

| Ruta Actual | Ruta Nueva | Estado | Notas |
|---|---|---|---|
| `/` (index) | `/evaluation` | ❌ Cambiar | Dashboard principal (T10) |
| `/company-profile` | `/profile` | ❌ Cambiar | Perfil de empresa |

---

## Zona Protegida: Herramientas de Evaluación (T1-T12)

| Ruta Actual | Ruta Nueva | Estado | Parámetros | Notas |
|---|---|---|---|---|
| `/t1/:projectId` | `/evaluation/projects/[projectId]/t1` | ❌ Cambiar | projectId | Maturity Radar |
| `/t2/:projectId` | `/evaluation/projects/[projectId]/t2` | ❌ Cambiar | projectId | Stakeholder Matrix |
| `/t3/:projectId` | `/evaluation/projects/[projectId]/t3` | ❌ Cambiar | projectId | Value Stream Map |
| `/t4/:projectId` | `/evaluation/projects/[projectId]/t4` | ❌ Cambiar | projectId | Use Case Priority Board |
| `/t5/:projectId` | `/evaluation/projects/[projectId]/t5` | ❌ Cambiar | projectId | AI Taxonomy Canvas |
| `/t6/:projectId` | `/evaluation/projects/[projectId]/t6` | ❌ Cambiar | projectId | Risk & Governance |
| `/t7/:projectId` | `/evaluation/projects/[projectId]/t7` | ❌ Cambiar | projectId | Adoption Heatmap |
| `/t8/:projectId` | `/evaluation/projects/[projectId]/t8` | ❌ Cambiar | projectId | Communication Map |
| `/t9/:projectId` | `/evaluation/projects/[projectId]/t9` | ❌ Cambiar | projectId | AI Roadmap |
| `/t10/:projectId` | `/evaluation/projects/[projectId]/t10` | ❌ Cambiar | projectId | AI Value Dashboard |
| `/t11/:projectId` | `/evaluation/projects/[projectId]/t11` | ❌ Cambiar | projectId | Operating Rhythm |
| `/t12/:projectId` | `/evaluation/projects/[projectId]/t12` | ❌ Cambiar | projectId | ISO 42001 Assessment |

---

## Zona Admin (Superadmin Only)

| Ruta Actual | Ruta Nueva | Estado | Notas |
|---|---|---|---|
| `/admin` | `/admin` | ✅ Mantener | Dashboard admin |
| *(no existe)* | `/admin/companies` | 🆕 Agregar | Listado de empresas |
| *(no existe)* | `/admin/companies/[companyId]` | 🆕 Agregar | Detalle empresa |
| *(no existe)* | `/admin/companies/[companyId]/projects` | 🆕 Agregar | Proyectos de empresa |
| *(no existe)* | `/admin/companies/[companyId]/projects/[projectId]` | 🆕 Agregar | Detalle proyecto |
| *(no existe)* | `/admin/users` | 🆕 Agregar | Listado usuarios |
| *(no existe)* | `/admin/users/[userId]` | 🆕 Agregar | Detalle usuario |

---

## Resumen de Cambios

### Rutas a Cambiar ❌ (9 cambios críticos)
- `/` → `/evaluation`
- `/company-profile` → `/profile`
- `/t1` - `/t12` → `/evaluation/projects/[projectId]/t{n}`

### Rutas a Mantener ✅ (4 sin cambios)
- `/login`
- `/reset-password`
- `/update-password`
- `/admin`

### Rutas a Agregar 🆕 (8 nuevas)
- `/forgot-password`
- `/admin/companies`, `/admin/companies/[companyId]`
- `/admin/companies/[companyId]/projects`, `/admin/companies/[companyId]/projects/[projectId]`
- `/admin/users`, `/admin/users/[userId]`

---

## Referencias a Actualizar en Codebase

### Archivos con navigate() hardcodeado
- `src/modules/Auth/ResetPasswordView.tsx` — `/login`
- `src/modules/T7_AdoptionHeatmap/T7View.tsx` — `/t2/:projectId`
- `src/modules/T8_CommunicationMap/T8View.tsx` — `/t2/:projectId`
- `src/modules/T9_AIRoadmap/T9View.tsx` — `/t4/:projectId`
- `src/shared/layouts/AppLayout.tsx` — `/login` (logout)

### Archivos Route definition
- `src/App.tsx` — Todas las rutas de React Router

---

## Convenciones Aplicadas

✅ **kebab-case** para segmentos de ruta  
✅ **[camelCase]** para parámetros dinámicos  
✅ **Sin trailing slash**  
✅ **Plural para colecciones** (projects, companies, users)  
✅ **Inglés** como idioma estándar  
✅ **Namespacing lógico** (/evaluation/* para herramientas, /admin/* para admin)

---

## Próximos Pasos (Implementación)

1. **Task 1**: Actualizar definiciones de rutas en `App.tsx`
2. **Task 2**: Crear constantes de rutas en `src/config/routes.ts`
3. **Task 3**: Actualizar todos los `navigate()` en el codebase
4. **Task 4**: Actualizar redirects por defecto (/ → /evaluation)
5. **Task 5**: Verificar navegación completa sin rutas rotas
6. **Task 6**: npm run build && npm run typecheck
