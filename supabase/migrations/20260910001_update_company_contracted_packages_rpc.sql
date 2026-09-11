-- ============================================================
-- Migration: Atomic contracted package updates
-- Date: 2026-09-10
--
-- Updates companies.contracted_packages and all company projects in
-- one database transaction. Only superadmin can perform this contractual
-- administration action.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_company_contracted_packages(
  p_company_id uuid,
  p_contracted_packages public.package_id[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_company_exists boolean;
BEGIN
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'update_company_contracted_packages: usuario no autenticado o sin perfil';
  END IF;

  IF v_caller_role <> 'superadmin' THEN
    RAISE EXCEPTION 'update_company_contracted_packages: acceso denegado para rol %', v_caller_role;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = p_company_id
  ) INTO v_company_exists;

  IF NOT v_company_exists THEN
    RAISE EXCEPTION 'update_company_contracted_packages: empresa % no existe', p_company_id;
  END IF;

  UPDATE public.companies
  SET contracted_packages = COALESCE(p_contracted_packages, ARRAY[]::public.package_id[])
  WHERE id = p_company_id;

  UPDATE public.projects
  SET contracted_packages = COALESCE(p_contracted_packages, ARRAY[]::public.package_id[]),
      updated_at = now()
  WHERE company_id = p_company_id;
END;
$$;

COMMENT ON FUNCTION public.update_company_contracted_packages(uuid, public.package_id[]) IS
  'Atomically updates contracted packages for a company and its projects. Superadmin only.';

REVOKE ALL ON FUNCTION public.update_company_contracted_packages(uuid, public.package_id[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_company_contracted_packages(uuid, public.package_id[]) TO authenticated;
