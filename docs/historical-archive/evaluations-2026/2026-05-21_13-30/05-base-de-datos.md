# Área 05 — Base de Datos   🟡

**Puntuación:** 6/10  |  **Anterior:** —  |  **Tendencia:** —

## Resumen

El modelo de datos está bien diseñado: 8 migraciones ordenadas, RLS activado en todas las tablas (99 políticas), índices de rendimiento para las queries de RLS. El problema principal es que `database.types.ts` está escrito manualmente (riesgo de desfase con el schema real) y que el cliente Supabase no usa el tipado generado. Las migraciones se ejecutan manualmente por Carlos sin Supabase CLI.

## Hallazgos

### 🔴 Críticos

- **database.types.ts no auto-generado**: El fichero tiene el comentario `⚠ Este archivo es FUENTE DE VERDAD para los tipos de BD. No editar manualmente — cambiar el schema SQL primero.` pero se gestiona manualmente. Sin `supabase gen types typescript`, cualquier divergencia entre el schema real de Supabase y los tipos TS es silenciosa. El fichero lleva el header de un proyecto anterior (`GOBY`) — posible artefacto de un copy.

- **`createClient<any>`**: El cliente Supabase no usa los tipos generados (`createClient<Database>`). Todos los `.select()`, `.insert()`, `.update()` devuelven `any`. La type-safety de la capa de datos es inexistente.

### 🟡 Mejorables

- **Migraciones sin Supabase CLI**: Las migraciones se ejecutan pegando SQL manualmente en el Dashboard de Supabase. No hay `supabase db push`, no hay historial verificable de qué migraciones se han aplicado al proyecto real vs. al de staging. El ARQUITECTURA.md documenta esto como decisión D5 (sin CLI), pero crea riesgo operativo a medida que el número de migraciones crece.

- **Migration 004 incluye todo el schema base**: La migración 004 tiene el comentario "Incluye también las migraciones 001, 002, 003 base". Si las tres primeras ya estaban aplicadas, ejecutar 004 sobre ellas generaría conflictos. El patrón `CREATE TABLE IF NOT EXISTS` mitiga esto, pero no para las políticas RLS.

- **`policies/` carpeta vacía**: Las políticas RLS están en las migraciones (correcto), pero la carpeta `supabase/policies/` existe y está vacía — confusión sobre dónde buscar las políticas.

- **Header "GOBY" en database.types.ts**: El fichero tiene `// GOBY — Tipos de base de datos` y `Sprint 8: renombrado engagement→project`. Son artefactos del proyecto anterior. Generan confusión sobre qué versión del schema representa el fichero.

### 🟢 Correctos

- RLS activado en todas las tablas (99 sentencias ENABLE ROW LEVEL SECURITY + CREATE POLICY).
- Índices compuestos en migration 006 para `project_members(project_id, user_id)` — optimiza la función `is_project_member()` en cada evaluación de política RLS.
- Modelo de 4 roles (superadmin / consultant / client_editor / client_viewer) bien definido en migration 008.
- UUID como PK en todas las tablas (sin secuencias enteras — evita hotspots).
- Comentarios en COMMENT ON COLUMN para campos críticos.

## Métricas

| Métrica | Valor | Referencia |
|---------|-------|------------|
| Migraciones aplicadas | 8 | — |
| Políticas RLS | ~99 CREATE POLICY | ✅ |
| Tablas sin RLS | 0 (verificado en migraciones) | Objetivo 0 |
| Índices de rendimiento | Sí (migration 006) | ✅ |
| Types auto-generados (CLI) | ❌ Manual | Requerido |
| Cliente tipado `createClient<Database>` | ❌ `<any>` | Requerido |
| Header GOBY en database.types | ❌ Artefacto | Limpiar |

## Recomendaciones priorizadas

### Prioridad 1 — Generar database.types.ts con Supabase CLI

**Qué:** Ejecutar:
```bash
npx supabase gen types typescript --project-id TU_PROJECT_ID > src/types/database.types.ts
```

**Por qué:** El fichero manual tiene riesgo permanente de desfase. La CLI genera los tipos exactos del schema en producción. Una vez generado, conectarlo al cliente:
```ts
import type { Database } from '@/types/database.types'
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, ...)
```

**Plan Maestro:** Sin PR asignado — Sprint de tipo-safety de BD.

### Prioridad 2 — Limpiar header GOBY y sincronizar domain.types.ts con database.types.ts

**Qué:** Actualizar el header de `database.types.ts`, eliminar referencias a `GOBY`, y resolver la divergencia de `UserRole` entre los dos ficheros de tipos (ver Área 02).

**Plan Maestro:** Sin PR asignado.

### Prioridad 3 — Documentar proceso de aplicación de migraciones

**Qué:** Añadir en `README.md` o en `supabase/MIGRATIONS.md` el procedimiento exacto de: cuándo y cómo aplicar cada migración, cómo verificar cuáles están aplicadas, y qué hacer si una falla a mitad.

**Plan Maestro:** Sin PR asignado.
