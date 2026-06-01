# gobytech_pro — Resumen Ejecutivo de Migración

**Proyecto:** GOBY (gobytech.com)
**BD destino:** gobytech_pro (Supabase producción)
**Fecha de preparación:** 2026-06-01
**Responsable:** Carlos Sánchez — Alpha Consulting Solutions S.L.

---

## Qué hace esta migración

Promociona el schema de la aplicación GOBY desde el entorno de staging (`lean_ai_pro`) a producción (`gobytech_pro`). El resultado es una base de datos limpia con:

- Schema completo (18 tablas, ~25 índices, 12 funciones, 4 triggers)
- RLS habilitado en todas las tablas
- Un único usuario activo: superadmin Carlos
- Sin datos de cliente (entorno vacío, listo para el primer cliente real)

La estrategia elegida es **Opción A — Rebuild limpio**. El schema de `gobytech_pro` actual no contiene datos valiosos, por lo que reconstruir desde cero elimina cualquier divergencia oculta.

---

## Secuencia de ejecución

Ejecutar los bloques en orden en el SQL Editor de Supabase (`gobytech_pro`):

| Bloque | Archivo | Acción | Destructivo |
|--------|---------|--------|-------------|
| 00 | `00_PRECHECKS.sql` | Verifica prerequisitos, inventaria estado actual | No |
| 01 | `01_BACKUP_REMINDER.sql` | Imprime instrucciones de backup | No |
| — | **PAUSA** | Hacer backup manual desde Supabase Dashboard | — |
| 02 | `02_RESET_PUBLIC_SCHEMA.sql` | Elimina todo el schema public | **SÍ** |
| 03 | `03_SCHEMA_CREATE.sql` | Crea schema completo (tablas + RLS + funciones) | No |
| 04 | `04_SYSTEM_SEED.sql` | Verifica schema listo (no inserta datos) | No |
| 05 | `05_SUPERADMIN_SEED.sql` | Crea perfil superadmin de Carlos | No* |
| 06 | `06_VALIDATION.sql` | 14 checks de verificación | No |

*Idempotente — se puede ejecutar varias veces.

**Tiempo estimado:** 15–20 minutos incluyendo backup y revisión manual.

---

## Precondiciones obligatorias

Antes de ejecutar el bloque 02, deben cumplirse **todas**:

1. **Backup descargado** desde Supabase Dashboard → gobytech_pro → Settings → Database → Backups. Guardar como `gobytech_pro_pre_migration_FECHA.sql`.
2. **Usuario Carlos creado** en Supabase Auth de `gobytech_pro`: Authentication → Users → Add user → `carlos.sanchez@consultoriaalpha.com`. El bloque 05 aborta si no existe.
3. **Conectado a `gobytech_pro`**, no a `lean_ai_pro`. Verificar en Settings → General → Reference ID antes de ejecutar el bloque 02.
4. **No hay sesiones activas** de clientes en `gobytech_pro`. Esta migración es solo viable en ventana de mantenimiento (antes del primer cliente real).

---

## Riesgos identificados

### Riesgo 1 — Ejecutar en el proyecto equivocado
**Probabilidad:** Baja. **Impacto:** Crítico.
El bloque 02 es destructivo e irreversible sin backup. Si se ejecuta en `lean_ai_pro` (staging), se pierde el schema de staging.
**Mitigación:** El bloque 00 imprime el nombre del proyecto y pide confirmación visual. Verificar Reference ID antes del bloque 02.

### Riesgo 2 — Usuario Carlos no existe en auth.users
**Probabilidad:** Media (entorno nuevo). **Impacto:** Bajo.
El bloque 05 aborta con mensaje claro si el usuario no existe. No hay daño — simplemente crear el usuario y ejecutar el bloque de nuevo.
**Mitigación:** Ejecutar bloque 00 primero — verifica la existencia del usuario antes de cualquier operación destructiva.

### Riesgo 3 — Schema drift entre migrations y types
**Probabilidad:** Ya materializada. **Impacto:** Gestionado.
Sprint 10 introdujo columnas (`companies.sector`, `companies.company_size`, `company_departments`, `t1_dimension_scores.interviewee_department`) sin migration SQL formal. Estas columnas están incluidas en `03_SCHEMA_CREATE.sql` con comentarios `[DRIFT]`. El check 11 de `06_VALIDATION.sql` las verifica explícitamente.
**Acción pendiente:** Crear migration formal para estas columnas en `lean_ai_pro` si aún no existe.

### Riesgo 4 — Edge Functions con secretos apuntando a lean_ai_pro
**Probabilidad:** Alta (entorno nuevo). **Impacto:** Alto.
Las Edge Functions que usan `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` pueden apuntar a staging si los secrets no se configuran en `gobytech_pro`.
**Mitigación:** Ver `INFRA_CHECKLIST.md` — sección Edge Functions y Supabase Secrets.

### Riesgo 5 — Vercel apuntando a lean_ai_pro
**Probabilidad:** Alta (hay que configurarlo). **Impacto:** Crítico.
Si `VITE_SUPABASE_URL` en el proyecto Vercel de gobytech apunta a `lean_ai_pro`, los usuarios reales estarían escribiendo en staging.
**Mitigación:** Ver `INFRA_CHECKLIST.md` — sección Vercel Environment Variables.

---

## Plan de rollback

Si algo falla durante o después de la migración:

1. **Antes del bloque 02 (nada destructivo aún):** No hay nada que revertir. Corregir y reintentar.
2. **Después del bloque 02, antes del bloque 03:** El schema public está vacío. Ejecutar `03_SCHEMA_CREATE.sql` para reconstruirlo. Si hay errores en el bloque 03, restaurar backup.
3. **Rollback completo (cualquier fase):**
   - Supabase Dashboard → gobytech_pro → Settings → Database → Restore backup
   - O via CLI: `pg_restore "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < gobytech_pro_pre_migration_FECHA.sql`
   - gobytech_pro vuelve al estado anterior a la migración
   - Revisar el error, corregir el bloque correspondiente, reintentar desde el bloque 00

---

## Estado post-migración esperado

Tras ejecutar los 7 bloques con todos los checks en [OK]:

- **18 tablas** en public, todas con RLS habilitado
- **12 funciones** (2 SECURITY DEFINER: `save_tool_output`, `check_and_log_ai_call`)
- **4 triggers** activos
- **1 perfil** en `public.profiles`: `carlos.sanchez@consultoriaalpha.com` con `role=superadmin`
- **0 filas** en tablas de cliente (companies, projects, etc.)
- App lista para primer login y alta del primer cliente real

---

## Decisiones de diseño relevantes

- **Opción A (Rebuild)** sobre Opción B (Delta migration): elegida porque `gobytech_pro` no tiene datos de valor y la Opción B requeriría auditar diferencias que no están documentadas.
- **`save_tool_output` y `check_and_log_ai_call` como SECURITY DEFINER**: las políticas RLS bloquean INSERT/UPDATE directos en `tool_outputs` y `ai_rate_limit_log` para usuarios autenticados. Estas funciones son el único camino de escritura, lo que garantiza que el rate limiting y el log de auditoría no pueden saltarse.
- **`company_departments` incluida con [DRIFT]**: no existe migration formal pero sí está en los types TypeScript. Se incluye en el schema de producción para coherencia con el codebase.
