-- ============================================================
-- Backfill 20260704_backfill_company_persons_toy_story.sql
--
-- Carga inicial de company_persons a partir de los datos YA
-- EXISTENTES en T1, T2, T3 y T9, para el proyecto "Toy Story"
-- de la empresa "Disney".
--
-- Requiere: 20260703_company_persons.sql ya aplicada en el
-- entorno (tabla company_persons + columnas person_id en
-- t1_dimension_scores y t9_free_items).
--
-- IDEMPOTENTE: cada bloque usa NOT EXISTS / ON CONFLICT para
-- poder re-ejecutarse sin duplicar filas al pasar por DEV → PRE
-- → PRO. Ejecutar tal cual, sin modificar, en cada entorno.
--
-- Deduplicación: una persona = (name, role) único dentro del
-- proyecto — mismo criterio que ya usa ImportFromT1Modal.
--
-- Alcance T3: además de crear las personas, reescribe el JSONB
-- value_streams.stages añadiendo "personId" en cada etapa cuyo
-- "responsible" coincida con una persona creada/existente.
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 0. Resolver project_id de "Toy Story" (empresa "Disney")
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_project_id uuid;
  v_company_id uuid;
BEGIN
  SELECT p.id, p.company_id
    INTO v_project_id, v_company_id
    FROM public.projects p
    JOIN public.companies c ON c.id = p.company_id
   WHERE p.name = 'Toy Story'
     AND c.name = 'Disney';

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el proyecto "Toy Story" de la empresa "Disney". Verifica companies.name / projects.name antes de ejecutar este backfill.';
  END IF;

  RAISE NOTICE 'Backfill company_persons → project_id=%, company_id=%', v_project_id, v_company_id;
END $$;


-- ════════════════════════════════════════════════════════════════
-- 1. T1 — t1_dimension_scores (interviewee_name / interviewee_role / interviewee_department)
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(t1.interviewee_name),
  trim(coalesce(t1.interviewee_role, '')),
  trim(coalesce(t1.interviewee_department, '')),
  't1'
FROM public.t1_dimension_scores t1
JOIN public.projects p  ON p.id = t1.project_id
JOIN public.companies c ON c.id = p.company_id
WHERE p.name = 'Toy Story'
  AND c.name = 'Disney'
  AND t1.interviewee_name IS NOT NULL
  AND trim(t1.interviewee_name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(t1.interviewee_name))
       AND lower(cp.role)  = lower(trim(coalesce(t1.interviewee_role, '')))
  );

-- Vincular person_id en t1_dimension_scores para las filas recién creadas / ya existentes
UPDATE public.t1_dimension_scores t1
   SET person_id = cp.id
  FROM public.company_persons cp
  JOIN public.projects p ON p.id = cp.project_id
 WHERE t1.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(t1.interviewee_name))
   AND lower(cp.role)  = lower(trim(coalesce(t1.interviewee_role, '')))
   AND p.name = 'Toy Story'
   AND t1.person_id IS NULL;


-- ════════════════════════════════════════════════════════════════
-- 2. T2 — stakeholders (name / role / department)
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(s.name),
  trim(coalesce(s.role, '')),
  trim(coalesce(s.department, '')),
  't2'
FROM public.stakeholders s
JOIN public.projects p  ON p.id = s.project_id
JOIN public.companies c ON c.id = p.company_id
WHERE p.name = 'Toy Story'
  AND c.name = 'Disney'
  AND s.name IS NOT NULL
  AND trim(s.name) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(s.name))
       AND lower(cp.role)  = lower(trim(coalesce(s.role, '')))
  );

-- stakeholders no tiene columna person_id (fuera de alcance de 20260703) — solo se crea la persona.


-- ════════════════════════════════════════════════════════════════
-- 3. T9 — t9_free_items (responsible / department)
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(t9.responsible),
  '',
  trim(coalesce(t9.department, '')),
  't9'
FROM public.t9_free_items t9
JOIN public.projects p  ON p.id = t9.project_id
JOIN public.companies c ON c.id = p.company_id
WHERE p.name = 'Toy Story'
  AND c.name = 'Disney'
  AND t9.responsible IS NOT NULL
  AND trim(t9.responsible) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(t9.responsible))
       AND lower(cp.role)  = ''
  );

-- Vincular person_id en t9_free_items para las filas recién creadas / ya existentes
UPDATE public.t9_free_items t9
   SET person_id = cp.id
  FROM public.company_persons cp
  JOIN public.projects p ON p.id = cp.project_id
 WHERE t9.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(t9.responsible))
   AND cp.role = ''
   AND p.name = 'Toy Story'
   AND t9.person_id IS NULL;


-- ════════════════════════════════════════════════════════════════
-- 4. T3 — value_streams.stages (JSONB) → responsible / department por etapa
-- ════════════════════════════════════════════════════════════════

-- 4a. Crear personas a partir de cada etapa con "responsible" no vacío
INSERT INTO public.company_persons (project_id, company_id, name, role, department, source_tool)
SELECT DISTINCT
  p.id,
  p.company_id,
  trim(stage->>'responsible'),
  '',
  trim(coalesce(stage->>'department', '')),
  't3'
FROM public.value_streams vs
JOIN public.projects p  ON p.id = vs.project_id
JOIN public.companies c ON c.id = p.company_id
CROSS JOIN LATERAL jsonb_array_elements(vs.stages) AS stage
WHERE p.name = 'Toy Story'
  AND c.name = 'Disney'
  AND stage->>'responsible' IS NOT NULL
  AND trim(stage->>'responsible') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.company_persons cp
     WHERE cp.project_id = p.id
       AND lower(cp.name) = lower(trim(stage->>'responsible'))
       AND lower(cp.role)  = ''
  );

-- 4b. Reescribir vs.stages añadiendo "personId" en cada etapa cuyo
--     "responsible" coincida con una company_persons existente.
--     Reconstruye el array completo por cada value_stream afectado.
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
  FROM public.projects p
  JOIN public.companies c ON c.id = p.company_id
 WHERE vs.project_id = p.id
   AND p.name = 'Toy Story'
   AND c.name = 'Disney'
   AND jsonb_array_length(vs.stages) > 0;


-- ════════════════════════════════════════════════════════════════
-- 5. Resumen de verificación (leer el NOTICE tras ejecutar)
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_project_id uuid;
  v_count      int;
BEGIN
  SELECT p.id INTO v_project_id
    FROM public.projects p
    JOIN public.companies c ON c.id = p.company_id
   WHERE p.name = 'Toy Story' AND c.name = 'Disney';

  SELECT count(*) INTO v_count FROM public.company_persons WHERE project_id = v_project_id;
  RAISE NOTICE 'company_persons totales para Toy Story tras el backfill: %', v_count;

  SELECT count(*) INTO v_count FROM public.company_persons WHERE project_id = v_project_id AND source_tool = 't1';
  RAISE NOTICE '  · procedentes de T1: %', v_count;

  SELECT count(*) INTO v_count FROM public.company_persons WHERE project_id = v_project_id AND source_tool = 't2';
  RAISE NOTICE '  · procedentes de T2: %', v_count;

  SELECT count(*) INTO v_count FROM public.company_persons WHERE project_id = v_project_id AND source_tool = 't3';
  RAISE NOTICE '  · procedentes de T3: %', v_count;

  SELECT count(*) INTO v_count FROM public.company_persons WHERE project_id = v_project_id AND source_tool = 't9';
  RAISE NOTICE '  · procedentes de T9: %', v_count;
END $$;
