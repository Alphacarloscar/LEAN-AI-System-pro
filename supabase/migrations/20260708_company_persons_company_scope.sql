-- ============================================================
-- Migration 20260708_company_persons_company_scope.sql
--
-- Amplía el scope de LECTURA de company_persons de project_id a
-- company_id, para soportar la sección "Personas en la empresa"
-- (antes "Equipo del proyecto"): lista todas las personas de
-- todos los proyectos de una misma empresa, no solo del proyecto
-- activo.
--
-- Modifica:
--   - 20260703_company_persons.sql          (policies RLS)
--   - 20260706_merge_company_persons_function.sql (validación de scope)
--
-- Escritura (INSERT/UPDATE/DELETE) NO cambia: sigue exigiendo
-- user_can_edit_project(project_id) de la fila concreta — alta y
-- edición de una persona siguen atadas a un proyecto específico.
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. Helper user_can_read_company — mismo patrón que
--    user_can_read_project (20260528_security_persistence.sql),
--    pero resuelto directamente por company_id en vez de project_id.
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.user_can_read_company(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Patrón 1: cualquier miembro explícito de algún proyecto de esa empresa
    SELECT 1
    FROM   public.project_members pm
    JOIN   public.projects        p  ON p.id = pm.project_id
    WHERE  p.company_id = p_company_id
      AND  pm.user_id   = auth.uid()

    UNION ALL

    -- Patrón 2: usuarios cliente (editor o viewer) vinculados a esa empresa
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


-- ════════════════════════════════════════════════════════════════
-- 2. Policies de company_persons — SELECT amplía a company_id,
--    INSERT/UPDATE/DELETE sin cambio de fondo (re-creadas para
--    dejar el archivo autocontenido e idempotente).
-- ════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "company_persons_select" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_insert" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_update" ON public.company_persons;
DROP POLICY IF EXISTS "company_persons_delete" ON public.company_persons;

-- SELECT: por empresa (nuevo) con fallback a por proyecto (cubre
-- filas legado con company_id NULL, y cubre también accesos que
-- solo tengan permiso a nivel de proyecto sin ser de la empresa).
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


-- ════════════════════════════════════════════════════════════════
-- 3. Índice por company_id — el SELECT principal ahora filtra por
--    company_id en vez de (o además de) project_id.
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_company_persons_company_id
  ON public.company_persons (company_id);


-- ════════════════════════════════════════════════════════════════
-- 4. merge_company_persons — relaja la validación de "mismo
--    proyecto" a "misma empresa". El company_id se resuelve
--    siempre vía projects.company_id (no vía company_persons.company_id,
--    que puede ser NULL en filas legado).
--
--    LIMITACIÓN CONOCIDA (ver docs/architecture/TECH-DEBT.md):
--    el UPDATE de T3 (value_streams.stages, JSONB) sigue filtrando
--    por vs.project_id = v_project_principal — si las dos personas
--    fusionadas pertenecen a proyectos distintos de la misma empresa,
--    las referencias personId en value_streams del proyecto de la
--    persona sustituida NO se repuntan.
-- ════════════════════════════════════════════════════════════════

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

  -- Resolver company_id canónico vía projects (no vía
  -- company_persons.company_id, que puede ser NULL en filas legado).
  SELECT company_id INTO v_company_principal FROM public.projects WHERE id = v_project_principal;
  SELECT company_id INTO v_company_replaced  FROM public.projects WHERE id = v_project_replaced;

  IF v_company_principal IS DISTINCT FROM v_company_replaced THEN
    RAISE EXCEPTION 'Las dos personas deben pertenecer a la misma empresa. No se puede fusionar entre empresas distintas.';
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
  -- NOTA: sigue limitado a vs.project_id = v_project_principal — ver
  -- limitación conocida documentada en TECH-DEBT.md.
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
  'Fusiona dos company_persons: repunta todas las referencias FK reales (T1/T2/T3-JSONB/T9) de p_replaced_id hacia p_principal_id y elimina p_replaced_id. '
  'Atómico — cualquier error revierte todos los cambios. Solo superadmin/consultant. '
  'Scope: misma empresa (company_id vía projects), no mismo proyecto — ver limitación conocida sobre T3 en TECH-DEBT.md.';
