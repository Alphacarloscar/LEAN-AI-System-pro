-- Atomic save for company profile and its frictions.
-- Replaces client-side upsert + delete + insert to avoid partial data loss.

CREATE OR REPLACE FUNCTION public.upsert_company_profile_with_frictions(
  p_project_id uuid,
  p_profile jsonb,
  p_frictions jsonb DEFAULT '[]'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_project_id IS NULL THEN
    RAISE EXCEPTION 'upsert_company_profile_with_frictions: p_project_id is required';
  END IF;

  IF p_profile IS NULL THEN
    RAISE EXCEPTION 'upsert_company_profile_with_frictions: p_profile is required';
  END IF;

  IF jsonb_typeof(COALESCE(p_frictions, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'upsert_company_profile_with_frictions: p_frictions must be a JSON array';
  END IF;

  INSERT INTO public.company_profiles (
    project_id,
    project_name,
    objetivo_principal_ia,
    horizonte_valor,
    ecosistema_tecnologico,
    restricciones,
    areas_prioritarias,
    saved_at,
    updated_at
  )
  VALUES (
    p_project_id,
    COALESCE(p_profile->>'project_name', ''),
    COALESCE(p_profile->>'objetivo_principal_ia', ''),
    COALESCE(p_profile->>'horizonte_valor', ''),
    COALESCE(p_profile->>'ecosistema_tecnologico', ''),
    COALESCE(p_profile->>'restricciones', ''),
    COALESCE(p_profile->'areas_prioritarias', '[]'::jsonb),
    COALESCE((p_profile->>'saved_at')::timestamptz, now()),
    now()
  )
  ON CONFLICT (project_id) DO UPDATE SET
    project_name = EXCLUDED.project_name,
    objetivo_principal_ia = EXCLUDED.objetivo_principal_ia,
    horizonte_valor = EXCLUDED.horizonte_valor,
    ecosistema_tecnologico = EXCLUDED.ecosistema_tecnologico,
    restricciones = EXCLUDED.restricciones,
    areas_prioritarias = EXCLUDED.areas_prioritarias,
    saved_at = EXCLUDED.saved_at,
    updated_at = now();

  DELETE FROM public.frictions
  WHERE project_id = p_project_id;

  INSERT INTO public.frictions (
    id,
    project_id,
    tipo,
    area_funcional,
    frecuencia,
    impacto,
    notas
  )
  SELECT
    COALESCE(NULLIF(item->>'id', '')::uuid, gen_random_uuid()),
    p_project_id,
    COALESCE(item->>'tipo', ''),
    COALESCE(item->>'area_funcional', ''),
    NULLIF(item->>'frecuencia', ''),
    NULLIF(item->>'impacto', ''),
    COALESCE(item->>'notas', '')
  FROM jsonb_array_elements(COALESCE(p_frictions, '[]'::jsonb)) AS item;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_company_profile_with_frictions(uuid, jsonb, jsonb) TO authenticated;

COMMENT ON FUNCTION public.upsert_company_profile_with_frictions(uuid, jsonb, jsonb) IS
  'Atomically upserts company_profiles and replaces frictions for one project.';
