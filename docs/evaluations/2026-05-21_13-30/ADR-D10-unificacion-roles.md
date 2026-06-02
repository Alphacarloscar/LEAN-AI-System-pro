# ADR-D10: Unificación del modelo de roles de usuario

**Estado:** Propuesto — requiere decisión de Carlos  
**Fecha:** 2026-05-21  
**Decididores:** Carlos Sánchez (COO)  
**Supersede a:** D7 (parcialmente) — identidad y roles en ARQUITECTURA.md  
**Criticidad:** 🔴 Bloqueante para TypeScript correcto y escalabilidad del sistema de auth

---

## Contexto

El proyecto tiene **dos definiciones contradictorias del sistema de roles**, ninguna de las cuales está alineada con la otra ni con la documentación de arquitectura:

### Estado actual — tres fuentes en conflicto

**Fuente 1: ARQUITECTURA.md (D7) — 5 roles originales**
```
consultor_alpha | pm_cliente | viewer_csuite | admin_alpha | superadmin
```

**Fuente 2: `src/types/domain.types.ts` — 5 roles originales (alineado con D7)**
```ts
type UserRole = 'consultor_alpha' | 'pm_cliente' | 'viewer_csuite' | 'admin_alpha' | 'superadmin'
```

**Fuente 3: `supabase/migrations/008_roles_four_tier.sql` — 4 roles nuevos**
```sql
-- Migration 008 migró a:
'superadmin' | 'consultant' | 'client_editor' | 'client_viewer'
```

**Fuente 4: `src/types/database.types.ts` — 4 roles nuevos (alineado con migration 008)**
```ts
type UserRole = 'superadmin' | 'consultant' | 'client_editor' | 'client_viewer'
```

### Consecuencias del estado actual

1. **El compilador TypeScript no detecta el conflicto** porque `createClient<any>` en `src/lib/supabase.ts` desactiva la inferencia de tipos de la BD. El bug existe en runtime, no en compile time.

2. **Cualquier código que importe `UserRole` desde `domain.types.ts`** opera con los 5 roles originales. Cualquier código que compare contra valores de BD opera con los 4 nuevos. Los `switch/case` de rol, las comparaciones `user.role === 'consultor_alpha'`, y las políticas RLS de Supabase están **en universos diferentes**.

3. **Las políticas RLS en Supabase** (migration 008, 99 políticas) usan los 4 roles nuevos. Si un componente React compara `role === 'consultor_alpha'`, la comparación siempre es `false` — el usuario con rol `consultant` en BD nunca activa la condición de frontend.

4. **ARQUITECTURA.md está desactualizado.** Documenta D7 con 5 roles que ya no existen en la BD. Un colaborador nuevo que lea la documentación trabajará con el modelo incorrecto.

---

## Opciones consideradas

### Opción A — Mantener los 4 roles de migration 008 (recomendada)

Los 4 roles actuales en BD son los vigentes. Actualizar todo el resto para alinearse:

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Baja — solo cambios de strings y types |
| Riesgo | Bajo — la BD ya tiene el modelo correcto |
| Trabajo | ~3-4h de grep + replace + verificación |
| Documentación | Actualizar ARQUITECTURA.md D7 + domain.types.ts |

**Mapeo de roles (5 → 4):**

| Rol anterior (D7) | Rol nuevo (migration 008) | Razonamiento |
|-------------------|--------------------------|-------------|
| `consultor_alpha` | `consultant` | Más genérico, no ata al nombre de la empresa |
| `admin_alpha` | `consultant` (o mantener separado) | ¿Alpha admin = consultor senior? Decisión de Carlos |
| `pm_cliente` | `client_editor` | Cliente con permiso de edición |
| `viewer_csuite` | `client_viewer` | Cliente solo lectura |
| `superadmin` | `superadmin` | Sin cambio |

**Incertidumbre:** `admin_alpha` no tiene mapeo directo. En el modelo de 4 roles, ¿es un `consultant` con permisos extra (recomendado: sí, con flags de permisos adicionales), o necesita mantenerse como 5º rol?

**Pros:**
- La BD ya tiene el modelo — cero migraciones SQL
- 4 roles son más simples de explicar a clientes (editor / viewer / consultor / superadmin)
- `client_editor` / `client_viewer` son semánticamente más claros para el cliente final que `pm_cliente` / `viewer_csuite`

**Contras:**
- Requiere actualizar ARQUITECTURA.md, domain.types.ts, y hacer grep exhaustivo en src/
- Si `admin_alpha` tenía permisos distintos a `consultor_alpha`, esa distinción se pierde

---

### Opción B — Volver a los 5 roles de D7

Crear migration 009 que revierta 008 a los nombres originales.

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Media — migración SQL + actualización database.types.ts |
| Riesgo | Medio — hay datos en producción con roles nuevos |
| Trabajo | ~6-8h incluyendo migración y testing |

**Pros:**
- Documentación arquitectónica correcta sin modificarla
- Los nombres originales son más descriptivos del negocio (pm_cliente > client_editor)

**Contras:**
- Los nombres originales exponen el nombre de la empresa en los roles del sistema (consultor_**alpha**) — si el producto evoluciona a SaaS multicliente, los clientes verán "alpha" en sus roles
- La BD en producción ya tiene migration 008 aplicada — revertir es más trabajo y riesgo
- Los 4 roles nuevos son más escalables para el modelo SaaS

---

### Opción C — Modelo híbrido: 4 roles DB + display labels

Mantener los 4 roles técnicos en BD y añadir un mapa de display:

```ts
const ROLE_DISPLAY: Record<UserRole, string> = {
  superadmin:     'Superadministrador',
  consultant:     'Consultor Alpha',
  client_editor:  'Project Manager Cliente',
  client_viewer:  'Viewer C-Suite',
}
```

| Dimensión | Evaluación |
|-----------|-----------|
| Complejidad | Baja — añadir constante de mapping |
| Riesgo | Bajo |
| Trabajo | <1h |

**Pros:** Preserva los nombres semánticos del negocio en la UI sin cambiar la BD  
**Contras:** No resuelve el conflicto de `domain.types.ts` — sigue existiendo el tipo incorrecto

---

## Decisión recomendada

**Opción A + elementos de Opción C.**

1. Mantener los 4 roles de migration 008 como fuente de verdad
2. Actualizar `domain.types.ts` para alinearse con `database.types.ts`
3. Añadir constante `ROLE_DISPLAY` para preservar los nombres semánticos en UI
4. Actualizar ARQUITECTURA.md sección D7 con el modelo de 4 roles
5. Clarificar qué ocurre con `admin_alpha` → decidir si es `consultant` o si se añade como 5º rol

**Pendiente de decisión de Carlos:** ¿`admin_alpha` = `consultant` con permisos extra, o rol separado?

---

## Consecuencias si se acepta

**Lo que se vuelve más fácil:**
- TypeScript puede tiparse correctamente en toda la app (`createClient<Database>` en lugar de `<any>`)
- Las comparaciones de rol en componentes son confiables
- Un colaborador nuevo entiende el sistema en 10 minutos

**Lo que se vuelve más difícil:**
- Nada de significado — es una corrección, no un trade-off

**Lo que habrá que revisar:**
- Todos los switch/case y comparaciones de rol en src/ (grep + replace, ~2-3h)
- AdminView.tsx (probable usuario intensivo del tipo UserRole)
- Las políticas RLS de Supabase — verificar que ya usan los nombres de migration 008

---

## Plan de implementación

1. **Decisión de Carlos sobre `admin_alpha`** → ¿4 roles o 5?
2. **Actualizar `domain.types.ts`:** reemplazar 5 roles por 4 roles de migration 008
3. **Grep exhaustivo en `src/`:** buscar `'consultor_alpha'`, `'pm_cliente'`, `'viewer_csuite'`, `'admin_alpha'` y reemplazar por los nuevos
4. **Activar tipado en `src/lib/supabase.ts`:** reemplazar `createClient<any>` por `createClient<Database>` para que TypeScript detecte inconsistencias futuras en compile time
5. **Actualizar ARQUITECTURA.md:** sección D7, tabla D1-D9 con nuevo modelo
6. **Añadir constante `ROLE_DISPLAY`** en `src/types/domain.types.ts`
7. **Verificación P3.1:** grep de cierre buscando todos los valores de rol antiguos en src/

---

## Métricas de éxito

- `grep -r "consultor_alpha\|pm_cliente\|viewer_csuite\|admin_alpha" src/` → 0 ocurrencias en strings activos
- `createClient<Database>` en supabase.ts sin errores TypeScript
- ARQUITECTURA.md D7 actualizado
- `domain.types.ts` y `database.types.ts` definen el mismo `UserRole`
