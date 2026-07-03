-- ============================================================
-- scripts/migrate-departments-to-type.sql
--
-- Clasifica los departamentos existentes en company_departments
-- (creados antes de la migración 20260707_company_departments_type.sql,
-- que asignó 'negocio_ops' por defecto a todos) según palabras
-- clave en el nombre.
--
-- it:          IT, Tecnología, Tech, Sistemas, Digital, Datos, Data,
--              Infraestructura (case-insensitive)
-- negocio_ops: el resto
--
-- USO:
--   1. Ejecutar el bloque 1 (SELECT de revisión) en Supabase SQL
--      Editor y revisar manualmente la clasificación propuesta.
--   2. Si es correcta, ejecutar el bloque 2 completo. Termina en
--      ROLLBACK por defecto — cambiar a COMMIT tras revisar el
--      resultado del UPDATE (fila a fila, vía RAISE NOTICE).
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. SELECT de revisión — clasificación propuesta (no modifica nada)
-- ════════════════════════════════════════════════════════════════

SELECT
  id,
  company_id,
  name,
  type AS type_actual,
  CASE
    WHEN name ~* '(IT|Tecnolog[ií]a|Tech|Sistemas|Digital|Datos|Data|Infraestructura)'
      THEN 'it'
    ELSE 'negocio_ops'
  END AS type_propuesto
FROM public.company_departments
ORDER BY company_id, name;


-- ════════════════════════════════════════════════════════════════
-- 2. UPDATE — envuelto en BEGIN/ROLLBACK hasta revisión manual
--    Cambiar ROLLBACK por COMMIT una vez verificada la clasificación
--    del bloque 1.
-- ════════════════════════════════════════════════════════════════

BEGIN;

UPDATE public.company_departments
   SET type = CASE
     WHEN name ~* '(IT|Tecnolog[ií]a|Tech|Sistemas|Digital|Datos|Data|Infraestructura)'
       THEN 'it'
     ELSE 'negocio_ops'
   END;

-- Verificación — recuento por tipo tras el UPDATE
DO $$
DECLARE
  v_it   int;
  v_biz  int;
BEGIN
  SELECT count(*) INTO v_it  FROM public.company_departments WHERE type = 'it';
  SELECT count(*) INTO v_biz FROM public.company_departments WHERE type = 'negocio_ops';
  RAISE NOTICE 'company_departments: % clasificados como IT, % como Negocio & Ops', v_it, v_biz;
END $$;

ROLLBACK;
-- ↑ Cambiar a COMMIT tras revisar el resultado anterior en el SQL Editor.
