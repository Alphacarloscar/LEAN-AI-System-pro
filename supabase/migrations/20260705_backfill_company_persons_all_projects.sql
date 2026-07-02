-- ============================================================
-- Backfill 20260705_backfill_company_persons_all_projects.sql
--
-- Versión GENÉRICA de 20260704_backfill_company_persons_toy_story.sql:
-- carga company_persons a partir de los datos YA EXISTENTES en
-- T1, T2, T3 y T9 para TODOS los proyectos/empresas de la base
-- de datos, no solo uno concreto.
--
-- Usar este fichero para futuras cargas (nuevos clientes, nuevos
-- proyectos) en lugar de duplicar un script por cliente.
--
-- Requiere: 20260703_company_persons.sql ya aplicada en el
-- entorno (tabla company_persons + columnas person_id en
-- t1_dimension_scores y t9_free_items).
--
-- IDEMPOTENTE: cada bloque usa NOT EXISTS — ejecutarlo varias
-- veces (o tras añadir un cliente nuevo) no duplica filas ya
-- creadas. Seguro de re-ejecutar en cualquier momento y en
-- cualquier entorno (DEV / PRE / PRO).
--
-- Deduplicación: una persona = (project_id, name, role) único —
-- mismo criterio que ya usa ImportFromT1Modal. T3 y T9 no
-- capturan cargo, así que una persona ya creada con cargo desde
-- T1/T2 puede aparecer también como fila separada "sin cargo" si
-- sale en T3/T9 — es intencional (ver docs/operations/DATABASES.md
-- sección "Scripts de Backfill" para el razonamiento).
--
-- Alcance T3: además de crear las personas, reescribe el JSONB
-- value_streams.stages añadiendo "personId" en cada etapa cuyo
-- "responsible" coincida con una persona creada/existente.
-- ============================================================


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
JOIN public.projects p ON p.id = t1.project_id
WHERE t1.interviewee_name IS NOT NULL
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
 WHERE t1.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(t1.interviewee_name))
   AND lower(cp.role)  = lower(trim(coalesce(t1.interviewee_role, '')))
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
JOIN public.projects p ON p.id = s.project_id
WHERE s.name IS NOT NULL
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
JOIN public.projects p ON p.id = t9.project_id
WHERE t9.responsible IS NOT NULL
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
 WHERE t9.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(t9.responsible))
   AND cp.role = ''
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

-- 4b. Reescribir vs.stages añadiendo "personId" en cada etapa cuyo
--     "responsible" coincida con una company_persons existente.
--     Reconstruye el array completo por cada value_stream afectado
--     (de cualquier proyecto).
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
-- 5. Resumen de verificación (leer el NOTICE tras ejecutar)
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_total int;
BEGIN
  SELECT count(*) INTO v_total FROM public.company_persons;
  RAISE NOTICE 'company_persons totales en toda la BD tras el backfill: %', v_total;
END $$;

-- Desglose por proyecto/empresa y herramienta de origen — revisar
-- el resultado de este SELECT tras ejecutar el script.
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
