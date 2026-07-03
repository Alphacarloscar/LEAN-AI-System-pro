-- ================================================================
-- release-v2.2.1-person-select-list.sql
--
-- GOBY — Personas de la empresa + Departamentos tipados · Release v2.2.1
-- Autor  : DBA Principal / Alpha Consulting
-- Fecha  : 2026-07-08
-- Branch : feature/person-select-list
--
-- Fuente de verdad única para desplegar en PRE y PRO todos los
-- cambios de BD de la rama feature/person-select-list.
--
-- CONSOLIDA (en orden de dependencia), todas ✅ DEV — ⏳ PRE + PRO:
--   1. 20260703_company_persons.sql
--        Tabla company_persons (scope project_id) + person_id en
--        t1_dimension_scores y t9_free_items.
--   2. 20260705_backfill_company_persons_all_projects.sql
--        Backfill de datos (NO es DDL de esquema, pero se incluye
--        aquí para que el release deje la BD completamente lista
--        y consistente en una sola ejecución) — carga company_persons
--        desde T1/T2/T3/T9 para todos los proyectos existentes.
--   3. 20260706_stakeholders_person_id.sql
--        person_id (FK) en stakeholders (T2) + backfill.
--   4. 20260707_company_departments_type.sql
--        Columna company_departments.type ('it' | 'negocio_ops').
--   5. 20260708_company_persons_company_scope.sql
--        RLS de company_persons ampliada a scope de empresa +
--        merge_company_persons con validación "misma empresa"
--        (sustituye por completo a la versión de
--        20260706_merge_company_persons_function.sql — no se
--        incluye la versión intermedia, solo la final).
--
-- NO incluye 20260704_backfill_company_persons_toy_story.sql
-- (histórico, ya ejecutado en DEV+PRE+PRO — ver docs/operations/DATABASES.md).
--
-- NO incluye scripts/migrate-departments-to-type.sql (clasificación
-- manual de departamentos preexistentes — no auto-ejecutable, revisar
-- caso a caso en el SQL Editor tras aplicar este release; ver §V).
--
-- PROPIEDADES:
--   ✅ Idempotente — re-ejecutable N veces sin duplicar datos ni romper
--   ✅ Un único archivo — ejecutar de una vez en Supabase SQL Editor
--   ✅ Sin diferencias PRE/PRO — mismo script, mismo resultado
--   ✅ Verificación incluida al final (§V)
--
-- PRERREQUISITOS:
--   - Migraciones previas ya aplicadas en el entorno destino:
--     001_foundation.sql, 20260527_security_persistence*.sql
--     (user_can_read_project / user_can_edit_project deben existir).
--   - Ninguna extensión adicional requerida.
--
-- PROTOCOLO DE EJECUCIÓN (al mergear esta rama a develop/main):
--   1. Ejecutar este script completo en el SQL Editor del proyecto PRE.
--   2. Revisar los NOTICE y el SELECT de §V — confirmar recuentos
--      esperados (sin errores, sin excepciones).
--   3. Revisar manualmente la clasificación IT/Negocio & Ops de los
--      departamentos preexistentes: copiar y ejecutar el bloque 1
--      (SELECT de revisión) de scripts/migrate-departments-to-type.sql
--      en el SQL Editor; si la propuesta es correcta, ejecutar el
--      bloque 2 con COMMIT (por defecto termina en ROLLBACK).
--   4. Repetir 1-3 en PRO solo tras confirmar el resultado en PRE.
--   5. Actualizar docs/operations/DATABASES.md: marcar ✅ PRE / ✅ PRO
--      en las 5 filas de "Migraciones Ejecutadas" que cubre este release.
-- ================================================================


-- ════════════════════════════════════════════════════════════════
-- §1  company_persons — tabla + RLS (scope inicial: project_id)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.company_persons (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id    uuid        REFERENCES public.companies(id) ON DELETE SET NULL,
  name          text        NOT NULL CHECK (length(trim(name)) > 0),
  role          text        NOT NULL DEFAULT '',
  department    text        NOT NULL DEFAULT '',
  source_tool   text        NOT NULL CHECK (source_tool IN ('t1', 't2', 't3', 't9', 'company_profile')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_persons ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.company_persons IS
  'Persona de la empresa/proyecto reutilizable entre T1, T2, T3, T9 y '
  'CompanyProfile via PersonSelectField. Scope de escritura: project_id. '
  'Scope de lectura ampliado a company_id en §5 de este release.';

CREATE INDEX IF NOT EXISTS idx_company_persons_project_id
  ON public.company_persons (project_id);

ALTER TABLE public.t9_free_items
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.company_persons(id) ON DELETE SET NULL;

ALTER TABLE public.t1_dimension_scores
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.company_persons(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.t9_free_items.person_id IS
  'Referencia opcional a company_persons.id — seleccionado via PersonSelectField.';
COMMENT ON COLUMN public.t1_dimension_scores.person_id IS
  'Referencia opcional a company_persons.id — seleccionado via PersonSelectField. '
  'No sustituye a interviewee_id (histórico); ver TECH-DEBT.md.';


-- ════════════════════════════════════════════════════════════════
-- §2  Backfill de datos — company_persons desde T1/T2/T3/T9
--     (todos los proyectos/empresas existentes en la BD)
-- ════════════════════════════════════════════════════════════════

-- 2a. T1 — t1_dimension_scores
INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(t1.interviewee_name),
  trim(coalesce(t1.interviewee_role, '')),
  trim(coalesce(t1.interviewee_department, '')),
  't1'
FROM public.t1_dimension_scores t1
JOIN public.projects p ON p.id = t1.project_id
WHERE t1.interviewee_name IS NOT NULL
  AND trim(t1.interviewee_name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(t1.interviewee_name))
       AND lower(cp.role)  = lower(trim(coalesce(t1.interviewee_role, '')))
  );

UPDATE public.t1_dimension_scores t1
   SET person_id = cp.id
  FROM public.company_persons cp
 WHERE t1.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(t1.interviewee_name))
   AND lower(cp.role)  = lower(trim(coalesce(t1.interviewee_role, '')))
   AND t1.person_id IS NULL;

-- 2b. T2 — stakeholders
INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(s.name),
  trim(coalesce(s.role, '')),
  trim(coalesce(s.department, '')),
  't2'
FROM public.stakeholders s
JOIN public.projects p ON p.id = s.project_id
WHERE s.name IS NOT NULL
  AND trim(s.name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(s.name))
       AND lower(cp.role)  = lower(trim(coalesce(s.role, '')))
  );

-- 2c. T9 — t9_free_items
INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(t9.responsible),
  '',
  trim(coalesce(t9.department, '')),
  't9'
FROM public.t9_free_items t9
JOIN public.projects p ON p.id = t9.project_id
WHERE t9.responsible IS NOT NULL
  AND trim(t9.responsible) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(t9.responsible))
       AND lower(cp.role)  = ''
  );

UPDATE public.t9_free_items t9
   SET person_id = cp.id
  FROM public.company_persons cp
 WHERE t9.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(t9.responsible))
   AND cp.role = ''
   AND t9.person_id IS NULL;

-- 2d. T3 — value_streams.stages (JSONB)
INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(stage->>'responsible'),
  '',
  trim(coalesce(stage->>'department', '')),
  't3'
FROM public.value_streams vs
JOIN public.projects p ON p.id = vs.project_id
CROSS JOIN LATERAL jsonb_array_elements(vs.stages) AS stage
WHERE stage->>'responsible' IS NOT NULL
  AND trim(stage->>'responsible') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(stage->>'responsible'))
       AND lower(cp.role)  = ''
  );

UPDATE public.value_streams vs
   SET stages = (
     SELECT jsonb_agg(
       CASE
         WHEN stage->>'responsible' IS NOT NULL
          AND trim(stage->>'responsible') <> ''
          AND cp.id IS NOT NULL
         THEN stage || jsonb_build_object('personId', cp.id::text)
         ELSE stage
       END
       ORDER BY ord
     )
     FROM jsonb_array_elements(vs.stages) WITH ORDINALITY AS elems(stage, ord)
     LEFT JOIN public.company_persons cp
       ON cp.project_id = vs.project_id
      AND lower(cp.name) = lower(trim(stage->>'responsible'))
      AND cp.role = ''
   )
 WHERE jsonb_array_length(vs.stages) > 0;


-- ════════════════════════════════════════════════════════════════
-- §3  stakeholders.person_id (T2) + backfill
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.stakeholders
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.company_persons(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.stakeholders.person_id IS
  'Referencia opcional a company_persons.id — seleccionado via PersonSelectField. '
  'Antes de esta columna, T2 solo copiaba name/role/department como texto libre.';

CREATE INDEX IF NOT EXISTS idx_stakeholders_person_id
  ON public.stakeholders (person_id)
  WHERE person_id IS NOT NULL;

UPDATE public.stakeholders s
   SET person_id = cp.id
  FROM public.company_persons cp
 WHERE s.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(s.name))
   AND lower(cp.role)  = lower(trim(coalesce(s.role, '')))
   AND s.person_id IS NULL;


-- ════════════════════════════════════════════════════════════════
-- §4  company_departments.type — clasificación IT / Negocio & Ops
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.company_departments
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'negocio_ops';

UPDATE public.company_departments
   SET type = 'negocio_ops'
 WHERE type IS NULL;

ALTER TABLE public.company_departments
  ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.company_departments
  DROP CONSTRAINT IF EXISTS company_departments_type_check;

ALTER TABLE public.company_departments
  ADD CONSTRAINT company_departments_type_check
  CHECK (type IN ('it', 'negocio_ops'));

COMMENT ON COLUMN public.company_departments.type IS
  'Clasificación del departamento: it (IT / Tecnología) o negocio_ops (Negocio & Ops). '
  'Misma distinción binaria que T1 usa para interviewee.type. DEFAULT negocio_ops — '
  'revisar clasificación real con scripts/migrate-departments-to-type.sql (ver §V/protocolo).';


-- ════════════════════════════════════════════════════════════════
-- §5  company_persons — RLS ampliada a scope de empresa +
--     merge_company_persons (versión final, reemplaza cualquier
--     versión anterior de la función)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.user_can_read_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.project_members pm
    JOIN   public.projects        p  ON p.id = pm.project_id
    WHERE  p.company_id = p_company_id
      AND  pm.user_id   = auth.uid()

    UNION ALL

    SELECT 1
    FROM   public.profiles pr
    WHERE  pr.company_id = p_company_id
      AND  pr.id         = auth.uid()
      AND  pr.role IN ('client_editor', 'client_viewer')
  )
$$;

COMMENT ON FUNCTION public.user_can_read_company IS
  'Acceso de lectura a nivel de empresa: miembro de cualquier proyecto de la empresa '
  '+ client_editor + client_viewer vinculados a esa empresa. STABLE → cacheado por transacción. '
  'Usado por company_persons_select para listar personas de todos los proyectos de una empresa.';

DROP POLICY IF EXISTS "company_persons_select" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_insert" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_update" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_delete" ON public.company_persons;

CREATE POLICY "company_persons_select" ON public.company_persons
  FOR SELECT TO authenticated USING (
    public.user_can_read_company(company_id)
    OR public.user_can_read_project(project_id)
  );

CREATE POLICY "company_persons_insert" ON public.company_persons
  FOR INSERT TO authenticated WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "company_persons_update" ON public.company_persons
  FOR UPDATE TO authenticated
  USING (public.user_can_edit_project(project_id))
  WITH CHECK (public.user_can_edit_project(project_id));

CREATE POLICY "company_persons_delete" ON public.company_persons
  FOR DELETE TO authenticated USING (public.user_can_edit_project(project_id));

CREATE INDEX IF NOT EXISTS idx_company_persons_company_id
  ON public.company_persons (company_id);

CREATE OR REPLACE FUNCTION public.merge_company_persons(
  p_principal_id uuid,
  p_replaced_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role        text;
  v_project_principal  uuid;
  v_project_replaced   uuid;
  v_company_principal  uuid;
  v_company_replaced   uuid;
  v_t1_count int;
  v_t2_count int;
  v_t3_count int;
  v_t9_count int;
BEGIN
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('superadmin', 'consultant') THEN
    RAISE EXCEPTION 'Acceso denegado. Tu rol no está autorizado a fusionar personas.';
  END IF;

  IF p_principal_id IS NULL OR p_replaced_id IS NULL THEN
    RAISE EXCEPTION 'Debes indicar la persona principal y la persona a sustituir.';
  END IF;

  IF p_principal_id = p_replaced_id THEN
    RAISE EXCEPTION 'No puedes fusionar una persona consigo misma. Elige dos personas distintas.';
  END IF;

  SELECT project_id INTO v_project_principal FROM public.company_persons WHERE id = p_principal_id;
  SELECT project_id INTO v_project_replaced  FROM public.company_persons WHERE id = p_replaced_id;

  IF v_project_principal IS NULL THEN
    RAISE EXCEPTION 'La persona principal indicada no existe.';
  END IF;

  IF v_project_replaced IS NULL THEN
    RAISE EXCEPTION 'La persona a sustituir indicada no existe.';
  END IF;

  SELECT company_id INTO v_company_principal FROM public.projects WHERE id = v_project_principal;
  SELECT company_id INTO v_company_replaced  FROM public.projects WHERE id = v_project_replaced;

  IF v_company_principal IS DISTINCT FROM v_company_replaced THEN
    RAISE EXCEPTION 'Las dos personas deben pertenecer a la misma empresa. No se puede fusionar entre empresas distintas.';
  END IF;

  UPDATE public.t1_dimension_scores
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t1_count = ROW_COUNT;

  UPDATE public.stakeholders
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t2_count = ROW_COUNT;

  WITH updated AS (
    UPDATE public.value_streams vs
       SET stages = (
         SELECT jsonb_agg(
           CASE
             WHEN stage->>'personId' = p_replaced_id::text
             THEN stage || jsonb_build_object('personId', p_principal_id::text)
             ELSE stage
           END
           ORDER BY ord
         )
         FROM jsonb_array_elements(vs.stages) WITH ORDINALITY AS elems(stage, ord)
       )
     WHERE vs.project_id = v_project_principal
       AND EXISTS (
         SELECT 1 FROM jsonb_array_elements(vs.stages) s
          WHERE s->>'personId' = p_replaced_id::text
       )
    RETURNING 1
  )
  SELECT count(*) INTO v_t3_count FROM updated;

  UPDATE public.t9_free_items
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t9_count = ROW_COUNT;

  IF EXISTS (SELECT 1 FROM public.t1_dimension_scores WHERE person_id = p_replaced_id)
     OR EXISTS (SELECT 1 FROM public.stakeholders WHERE person_id = p_replaced_id)
     OR EXISTS (SELECT 1 FROM public.t9_free_items WHERE person_id = p_replaced_id)
  THEN
    RAISE EXCEPTION 'Quedan referencias sin repuntar tras la fusión. Operación cancelada.';
  END IF;

  DELETE FROM public.company_persons WHERE id = p_replaced_id;

  RETURN jsonb_build_object(
    't1_updated', v_t1_count,
    't2_updated', v_t2_count,
    't3_updated', v_t3_count,
    't9_updated', v_t9_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_company_persons(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.merge_company_persons(uuid, uuid) IS
  'Fusiona dos company_persons: repunta todas las referencias FK reales (T1/T2/T3-JSONB/T9) de p_replaced_id hacia p_principal_id y elimina p_replaced_id. '
  'Atómico — cualquier error revierte todos los cambios. Solo superadmin/consultant. '
  'Scope: misma empresa (company_id vía projects), no mismo proyecto — ver limitación conocida sobre T3 en TECH-DEBT.md (DEBT-035).';


-- ════════════════════════════════════════════════════════════════
-- §V  VERIFICACIÓN — ejecutar y revisar tras aplicar el release
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_total_persons  int;
  v_linked_t1      int;
  v_linked_t2      int;
  v_linked_t9      int;
  v_dept_it        int;
  v_dept_biz       int;
BEGIN
  SELECT count(*) INTO v_total_persons FROM public.company_persons;
  SELECT count(*) INTO v_linked_t1 FROM public.t1_dimension_scores WHERE person_id IS NOT NULL;
  SELECT count(*) INTO v_linked_t2 FROM public.stakeholders WHERE person_id IS NOT NULL;
  SELECT count(*) INTO v_linked_t9 FROM public.t9_free_items WHERE person_id IS NOT NULL;
  SELECT count(*) INTO v_dept_it  FROM public.company_departments WHERE type = 'it';
  SELECT count(*) INTO v_dept_biz FROM public.company_departments WHERE type = 'negocio_ops';

  RAISE NOTICE '── release-v2.2.1-person-select-list — resumen ──';
  RAISE NOTICE 'company_persons totales: %', v_total_persons;
  RAISE NOTICE 't1_dimension_scores vinculadas: %', v_linked_t1;
  RAISE NOTICE 'stakeholders vinculadas: %', v_linked_t2;
  RAISE NOTICE 't9_free_items vinculadas: %', v_linked_t9;
  RAISE NOTICE 'company_departments — IT: % / Negocio & Ops: % (revisar clasificación real, ver protocolo paso 3)', v_dept_it, v_dept_biz;
END $$;

-- Desglose de company_persons por empresa/proyecto/herramienta
SELECT
  c.name  AS empresa,
  p.name  AS proyecto,
  cp.source_tool,
  count(*) AS personas
FROM public.company_persons cp
JOIN public.projects  p ON p.id = cp.project_id
JOIN public.companies c ON c.id = p.company_id
GROUP BY c.name, p.name, cp.source_tool
ORDER BY c.name, p.name, cp.source_tool;

-- Confirmar que las policies y funciones quedaron activas
SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'public.company_persons'::regclass;
SELECT proname FROM pg_proc WHERE proname IN ('user_can_read_company', 'merge_company_persons');
