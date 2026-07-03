-- ============================================================
-- Migration 20260707_company_departments_type.sql
--
-- Añade el campo `type` a company_departments para distinguir
-- departamentos IT / Tecnología de departamentos Negocio & Ops.
-- Reutiliza la misma distinción binaria que T1 ya usa para
-- clasificar entrevistados (interviewee.type: 'it' | 'business').
--
-- IDEMPOTENTE: ADD COLUMN IF NOT EXISTS con DEFAULT + backfill
-- WHERE type IS NULL — seguro de re-ejecutar.
--
-- NOT NULL: se aplica tras el backfill, con DEFAULT 'negocio_ops'
-- para departamentos existentes sin clasificar explícitamente
-- (revisar/corregir con scripts/migrate-departments-to-type.sql).
-- ============================================================

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
  'revisar clasificación real con scripts/migrate-departments-to-type.sql.';
