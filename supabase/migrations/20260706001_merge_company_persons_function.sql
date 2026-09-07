-- ============================================================
-- Migration 20260706_merge_company_persons_function.sql
--
-- Función RPC merge_company_persons: fusiona dos company_persons
-- (una "principal" que se conserva y una "sustituible" que se
-- elimina), repuntando todas las referencias reales (FK) de la
-- sustituible hacia la principal en T1, T2, T3 (JSONB) y T9.
--
-- Requiere: 20260703_company_persons.sql y
-- 20260706_stakeholders_person_id.sql ya aplicadas (T2 necesita
-- person_id real para poder fusionarse igual que T1/T9).
--
-- Atomicidad: SECURITY DEFINER + plpgsql — toda la función corre
-- en una única transacción implícita de Postgres. Cualquier
-- RAISE EXCEPTION revierte TODOS los cambios hechos hasta ese
-- punto dentro de la función — no hace falta rollback manual en
-- el cliente.
--
-- Autorización: solo superadmin/consultant (igual que
-- create_project en 20260602_create_project_rpc.sql).
-- ============================================================

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
  v_project_principal   uuid;
  v_project_replaced     uuid;
  v_t1_count int;
  v_t2_count int;
  v_t3_count int;
  v_t9_count int;
BEGIN
  -- Autorización — solo superadmin/consultant
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

  IF v_project_principal <> v_project_replaced THEN
    RAISE EXCEPTION 'Las dos personas deben pertenecer al mismo proyecto. No se puede fusionar entre proyectos distintos.';
  END IF;

  -- T1 — t1_dimension_scores.person_id
  UPDATE public.t1_dimension_scores
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t1_count = ROW_COUNT;

  -- T2 — stakeholders.person_id
  UPDATE public.stakeholders
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t2_count = ROW_COUNT;

  -- T3 — value_streams.stages[].personId (JSONB)
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

  -- T9 — t9_free_items.person_id
  UPDATE public.t9_free_items
     SET person_id = p_principal_id
   WHERE person_id = p_replaced_id;
  GET DIAGNOSTICS v_t9_count = ROW_COUNT;

  -- Eliminar la persona sustituible — solo si no quedó ninguna
  -- referencia sin repuntar (defensivo; ya deberían ser 0 tras
  -- los UPDATE anteriores).
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
  'Fusiona dos company_persons: repunta todas las referencias FK reales (T1/T2/T3-JSONB/T9) de p_replaced_id hacia p_principal_id y elimina p_replaced_id. Atómico — cualquier error revierte todos los cambios. Solo superadmin/consultant.';
