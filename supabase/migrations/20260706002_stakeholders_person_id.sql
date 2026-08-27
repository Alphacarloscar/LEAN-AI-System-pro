-- ============================================================
-- Migration 20260706_stakeholders_person_id.sql
--
-- Añade person_id (FK nullable a company_persons) a stakeholders
-- (T2), que hasta ahora solo copiaba nombre/cargo/departamento
-- como texto libre sin vínculo real a company_persons.
--
-- Motivo: la función merge_company_persons (ver
-- 20260706_merge_company_persons_function.sql) necesita repuntar
-- referencias reales (FK), no adivinar coincidencias de texto.
-- Con esta columna, T1, T2, T3 y T9 quedan todos con una
-- referencia real a company_persons.
--
-- IDEMPOTENTE: ADD COLUMN IF NOT EXISTS + backfill con
-- WHERE person_id IS NULL — seguro de re-ejecutar.
-- ============================================================

ALTER TABLE public.stakeholders
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.company_persons(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.stakeholders.person_id IS
  'Referencia opcional a company_persons.id — seleccionado via PersonSelectField. '
  'Antes de esta columna, T2 solo copiaba name/role/department como texto libre.';

CREATE INDEX IF NOT EXISTS idx_stakeholders_person_id
  ON public.stakeholders (person_id)
  WHERE person_id IS NOT NULL;

-- Backfill: mismo criterio (project_id, nombre, cargo) que
-- 20260705_backfill_company_persons_all_projects.sql, para todos
-- los proyectos existentes.
UPDATE public.stakeholders s
   SET person_id = cp.id
  FROM public.company_persons cp
 WHERE s.project_id = cp.project_id
   AND lower(cp.name) = lower(trim(s.name))
   AND lower(cp.role)  = lower(trim(coalesce(s.role, '')))
   AND s.person_id IS NULL;

-- Verificación
DO $$
DECLARE
  v_total   int;
  v_linked  int;
BEGIN
  SELECT count(*) INTO v_total  FROM public.stakeholders;
  SELECT count(*) INTO v_linked FROM public.stakeholders WHERE person_id IS NOT NULL;
  RAISE NOTICE 'stakeholders: % de % filas vinculadas a company_persons tras el backfill', v_linked, v_total;
END $$;
