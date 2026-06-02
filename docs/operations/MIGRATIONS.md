# Migrations Protocol — GOBY

Last updated: 2026-06-01
AI-Ready Repository System v2.1.0

> Protocolo obligatorio y bloqueante. Ninguna migración de producción sin seguir este flujo.
> Adaptado al workflow sin CLI (ADR-005): todas las migraciones se ejecutan en Supabase SQL Editor.

---

## Convención de nombrado

```
YYYYMMDD_[acción]_[entidad].sql
```

**Ejemplos:**
- `20260601_add_avatar_url_to_profiles.sql`
- `20260615_create_notifications_table.sql`
- `20260620_drop_legacy_engagement_status.sql`
- `20260701_add_index_company_id_engagements.sql`

**Acciones estándar:** `add`, `create`, `drop`, `alter`, `rename`, `add_index`, `add_rls_policy`, `fix`

**Ubicación:** `supabase/migrations/`

---

## Protocolo completo: DEV → PRE → PRO

### Paso 1 — Escribir la migración

1. Crear fichero en `supabase/migrations/` con el nombre convencional
2. Escribir el SQL con comentarios explicando cada cambio:
   ```sql
   -- ============================================================
   -- Migración: 20260601_add_avatar_url_to_profiles.sql
   -- Propósito: Añadir columna avatar_url a profiles para QW1 PDF
   -- Prerequisito: 008_roles_four_tier.sql debe estar aplicada
   -- Autor: Claude (AI) — Aprobada por: Carlos Sánchez
   -- ============================================================
   
   ALTER TABLE public.profiles
   ADD COLUMN IF NOT EXISTS avatar_url text;
   
   -- Verificación (ejecutar tras la migración):
   -- SELECT column_name FROM information_schema.columns
   -- WHERE table_name = 'profiles' AND column_name = 'avatar_url';
   ```
3. Incluir siempre una **query de verificación** comentada al final

### Paso 2 — Aplicar en DEV

1. Abrir **Supabase Dashboard → proyecto DEV → SQL Editor**
2. Pegar el script SQL completo
3. Ejecutar y verificar que no hay errores
4. Ejecutar la query de verificación
5. Probar la funcionalidad en `localhost:5173` con el cambio aplicado

### Paso 3 — PR con la migración

1. Commitear el fichero de migración con el código que lo usa
2. Abrir PR a `develop` con:
   - Descripción del cambio de esquema
   - Resultado de la verificación en DEV
   - ADR referenciado si el cambio es arquitectónico
3. CI pasa → Carlos aprueba → merge a `develop`

### Paso 4 — Validar en PRE

> PRE usa el mismo proyecto Supabase DEV, así que la migración ya está aplicada al proyecto DEV. Si PRE tiene datos demo distintos, verificar que los datos existentes no se corrompen.

1. Verificar en el preview deploy de `develop` que la funcionalidad funciona con datos demo
2. Si hay datos demo que necesitan actualización: ejecutar script de seed actualizado

### Paso 5 — Aplicar en PRO

> **BLOCKING:** Carlos debe decir explícitamente **"ejecuta la migración"** antes de este paso.

1. **Verificar backup:** Supabase Dashboard → proyecto PRO → Database → Backups → confirmar backup < 24h
2. Si no hay backup reciente: esperar al próximo backup automático (generalmente diario)
3. **Carlos ejecuta:** Supabase Dashboard → proyecto PRO → SQL Editor → pegar script → ejecutar
4. **Carlos verifica:** ejecutar la query de verificación incluida en el script
5. **Confirmar a Claude:** "la migración está aplicada" → Claude actualiza CHANGELOG.md

### Paso 6 — Documentar

Actualizar en el mismo PR (o PR de seguimiento inmediato):
- `CHANGELOG.md` → añadir entrada en `[Unreleased]`
- `docs/operations/DATABASES.md` → actualizar tabla de migraciones ejecutadas
- `docs/architecture/OVERVIEW.md` si cambia el modelo de datos significativamente

---

## Rollback Procedure

> En Supabase (plan Pro), los backups automáticos permiten restaurar el proyecto completo.
> Para cambios pequeños, un rollback SQL es preferible a restaurar el backup completo.

### Opción A — Rollback SQL (para cambios reversibles)

Si la migración añadió columnas/tablas (operaciones reversibles):

```sql
-- Ejemplo de rollback para ADD COLUMN:
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;

-- Ejemplo de rollback para CREATE TABLE:
DROP TABLE IF EXISTS public.notifications;
```

**Cuándo usar:** el cambio es reciente (< 1h) y no hay datos en las nuevas estructuras.

### Opción B — Restaurar backup (para cambios destructivos)

Si la migración modificó datos existentes o ejecutó un DROP:

1. **Supabase Dashboard → proyecto PRO → Database → Backups**
2. Seleccionar el backup más reciente anterior a la migración
3. Clic en "Restore" → confirmar
4. ⚠️ **Atención:** la restauración sobreescribe TODOS los datos desde el backup. Los datos creados entre el backup y la restauración se pierden.

**Cuándo usar:** la migración corrompió datos existentes o es irreversible.

### Decisión de rollback

| Situación | Opción recomendada |
|-----------|-------------------|
| ADD COLUMN / CREATE TABLE — sin datos en nuevas estructuras | Rollback SQL |
| ALTER COLUMN / RENAME — con datos existentes | Backup restoration |
| DROP TABLE / DROP COLUMN — con datos | Backup restoration |
| UPDATE masivo de datos | Backup restoration |

---

## Migraciones Especiales

### Añadir RLS policy

Todo script que crea una tabla nueva DEBE incluir:
```sql
ALTER TABLE public.nueva_tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own engagement data"
ON public.nueva_tabla
FOR SELECT
USING (is_engagement_member(engagement_id));
```

> 🔴 Red flag: tabla creada sin RLS → STOP antes de aplicar en PRO.

### Añadir índice de performance

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_nueva_tabla_engagement_id
  ON public.nueva_tabla(engagement_id);
```

Usar `CONCURRENTLY` en PRO para no bloquear lecturas durante la creación del índice.

### Migración destructiva (DROP)

Antes de cualquier `DROP TABLE` o `DROP COLUMN`:
1. Confirmar con Carlos que no hay código activo que use esa tabla/columna
2. Verificar en `src/` con grep: `grep -r "tabla_a_eliminar" src/`
3. Verificar que no hay datos que necesiten migrar
4. Confirmar backup PRO < 24h

---

## Log de Migraciones Ejecutadas

Ver `docs/operations/DATABASES.md` → sección "Migraciones Ejecutadas" para el historial completo con estado por entorno.
