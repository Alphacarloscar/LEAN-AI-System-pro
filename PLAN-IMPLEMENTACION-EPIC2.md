# PLAN DE IMPLEMENTACIÓN — Épica 2: Estandarización de Rutas

**Estado**: Fase 1 completada (inventario + constantes), Fase 2 en progreso

---

## ✅ COMPLETADO (Fase 1)

### 1. Inventario de Rutas
- ✅ `ROUTES-INVENTORY.md` generado
- ✅ Todas las rutas mapeadas al nuevo esquema
- ✅ Identificadas 9 rutas a cambiar, 4 a mantener, 8 a agregar

### 2. Constantes de Rutas
- ✅ `src/config/routes.ts` creado
- ✅ Constantes para todas las rutas (PUBLIC_ROUTES, EVALUATION_ROUTES, ADMIN_ROUTES)
- ✅ Funciones helper para rutas con parámetros

### 3. Definiciones de Rutas en App.tsx
- ✅ Importadas constantes de rutas
- ✅ Actualizadas definiciones de Route:
  - ✅ Rutas públicas: `/login`, `/reset-password`, `/update-password`
  - ✅ Dashboard: `/evaluation` (era `/`)
  - ✅ Profile: `/profile` (era `/company-profile`)
  - ✅ Herramientas T1-T12: `/evaluation/projects/:projectId/t{n}` (era `/t{n}/:projectId`)
  - ✅ Admin: `/admin`
  - ✅ Fallback: redirige a `/evaluation`

---

## ❌ PENDIENTE (Fase 2)

### 4. Actualizar navigate() calls (6 archivos)

**Archivo: `src/modules/Auth/ResetPasswordView.tsx`**
```typescript
// ACTUAL (línea 142)
onClick={() => navigate('/login', { replace: true })}

// CAMBIAR A
import { PUBLIC_ROUTES } from '@/config/routes'
onClick={() => navigate(PUBLIC_ROUTES.LOGIN, { replace: true })}
```

**Archivo: `src/shared/layouts/AppLayout.tsx`**
```typescript
// ACTUAL (líneas 83, 247)
navigate('/login', { replace: true })

// CAMBIAR A
import { PUBLIC_ROUTES } from '@/config/routes'
navigate(PUBLIC_ROUTES.LOGIN, { replace: true })
```

**Archivo: `src/modules/T7_AdoptionHeatmap/T7View.tsx`**
```typescript
// ACTUAL (línea 225)
navigate(engagementId ? `/t2/${engagementId}` : '/t2')

// CAMBIAR A
import { EVALUATION_ROUTES } from '@/config/routes'
navigate(engagementId ? EVALUATION_ROUTES.T2(engagementId) : EVALUATION_ROUTES.ROOT)
```

**Archivo: `src/modules/T8_CommunicationMap/T8View.tsx`**
```typescript
// ACTUAL (línea 260)
navigate(engagementId ? `/t2/${engagementId}` : '/t2')

// CAMBIAR A
import { EVALUATION_ROUTES } from '@/config/routes'
navigate(engagementId ? EVALUATION_ROUTES.T2(engagementId) : EVALUATION_ROUTES.ROOT)
```

**Archivo: `src/modules/T9_AIRoadmap/T9View.tsx`**
```typescript
// ACTUAL (línea 298)
navigate(engagementId ? `/t4/${engagementId}` : '/t4')

// CAMBIAR A
import { EVALUATION_ROUTES } from '@/config/routes'
navigate(engagementId ? EVALUATION_ROUTES.T4(engagementId) : EVALUATION_ROUTES.ROOT)
```

---

### 5. Buscar y Reemplazar Rutas Globales

Ejecutar búsquedas para encontrar rutas hardcodeadas restantes:
```bash
# Buscar referencias a rutas antiguas
grep -r "'/t[0-9]" src/ --include="*.tsx" --include="*.ts"
grep -r "company-profile" src/ --include="*.tsx" --include="*.ts"
grep -r "'/'" src/ --include="*.tsx" --include="*.ts" | grep navigate
```

---

### 6. Tests de Rutas

**Actualizar tests que usan rutas:**
- `src/__tests__/unit/AppSidebar/AppSidebar.test.tsx` — rutas del sidebar
- `src/__tests__/e2e/navigation.spec.ts` (si existe)

**Cambios necesarios:**
```typescript
// Test actual
renderSidebar(`/t1/${TEST_PROJECT_ID}`)

// Cambiar a
renderSidebar(`/evaluation/projects/${TEST_PROJECT_ID}/t1`)
```

---

### 7. Verificación Final

- [ ] `npm run typecheck` — 0 errores
- [ ] `npm run test` — todos los tests pasando
- [ ] `npm run build` — compilación exitosa
- [ ] Navegación manual en browser:
  - [ ] / redirige a /evaluation ✓
  - [ ] /login funciona ✓
  - [ ] /evaluation/projects/[id]/t1 funciona ✓
  - [ ] Todos los T1-T12 funcionan ✓

---

## Resumen de Cambios Necesarios

| Archivo | Línea | Cambio | Prioridad |
|---------|-------|--------|-----------|
| ResetPasswordView.tsx | 142 | `/login` → `PUBLIC_ROUTES.LOGIN` | 🔴 Alta |
| AppLayout.tsx | 83, 247 | `/login` → `PUBLIC_ROUTES.LOGIN` | 🔴 Alta |
| T7View.tsx | 225 | `/t2/{id}` → `EVALUATION_ROUTES.T2(id)` | 🟡 Media |
| T8View.tsx | 260 | `/t2/{id}` → `EVALUATION_ROUTES.T2(id)` | 🟡 Media |
| T9View.tsx | 298 | `/t4/{id}` → `EVALUATION_ROUTES.T4(id)` | 🟡 Media |
| AppSidebar.test.tsx | múltiples | Rutas en tests | 🟡 Media |

---

## Notas Importantes

⚠️ **Backward Compatibility**: Las rutas antiguas (`/t1/:projectId`, `/company-profile`, etc.) dejarán de funcionar después de completar esta épica. El fallback `/` redirigirá a `/evaluation`.

📌 **Named Routes**: Se recomienda crear variables nombradas para cada ruta:
```typescript
// En lugar de:
navigate('/evaluation/projects/' + projectId + '/t1')

// Usar:
navigate(EVALUATION_ROUTES.T1(projectId))
```

🧪 **Testing**: Después de cada cambio, ejecutar:
```bash
npm run typecheck && npm run test
```

---

## Próximo Paso

Ejecutar Phase 2 (implementación de cambios) cuando esté listo.
Orden recomendado:
1. Actualizar navigate() calls (6 archivos)
2. Buscar y reemplazar rutas hardcodeadas globalmente
3. Actualizar tests
4. Verificar compilación y tests
5. Validar navegación en browser
