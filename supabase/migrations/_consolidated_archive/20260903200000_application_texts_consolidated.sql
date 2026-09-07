-- ============================================================
-- GOBY — Consolidated Application Texts Migrations
-- ============================================================

-- From: 20260903_100000_add_text_columns.sql
-- Add new columns for filename and text_generalizado
ALTER TABLE public.application_texts
ADD COLUMN IF NOT EXISTS filename TEXT,
ADD COLUMN IF NOT EXISTS text_generalizado TEXT NOT NULL DEFAULT '[Sin especificar]';

-- Migrate data from text_es to filename and text_generalizado (only if text_es column exists)
DO $$
DECLARE
  v_has_text_es boolean;
BEGIN
  -- Check if text_es column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'application_texts'
      AND column_name = 'text_es'
  ) INTO v_has_text_es;

  IF v_has_text_es THEN
    -- Migrate data from text_es
    UPDATE public.application_texts
    SET
      filename = COALESCE(filename, text_es, tool_module || '_' || text_key),
      text_generalizado = COALESCE(NULLIF(text_generalizado, '[Sin especificar]'), text_es, '[Sin especificar]')
    WHERE text_es IS NOT NULL;
    RAISE NOTICE '[20260903] Migrated data from text_es column';
  ELSE
    RAISE NOTICE '[20260903] text_es column does not exist, skipping data migration from text_es';
  END IF;
END $$;

-- Verify migration
SELECT
  COUNT(*) as total_rows,
  COUNT(CASE WHEN filename IS NOT NULL THEN 1 END) as rows_with_filename,
  COUNT(CASE WHEN text_generalizado IS NOT NULL THEN 1 END) as rows_with_text_generalizado
FROM public.application_texts;

-- From: 20260903_200000_fill_application_texts_defaults.sql
-- Fill empty filename with tool_module + text_key
UPDATE public.application_texts
SET filename = COALESCE(
  NULLIF(filename, ''),
  tool_module || '_' || text_key
)
WHERE filename IS NULL OR filename = '';

-- Fill empty text_generalizado with a default message
UPDATE public.application_texts
SET text_generalizado = COALESCE(
  NULLIF(text_generalizado, ''),
  '[Sin especificar]'
)
WHERE text_generalizado IS NULL OR text_generalizado = '';

-- Verify results
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN filename IS NOT NULL THEN 1 END) as with_filename,
  COUNT(CASE WHEN text_generalizado IS NOT NULL THEN 1 END) as with_text_generalizado
FROM public.application_texts;

-- From: 20260903_300000_rls_application_texts.sql
-- Enable RLS on application_texts
ALTER TABLE public.application_texts ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read application_texts (global texts)
CREATE POLICY "Authenticated users can read application_texts"
  ON public.application_texts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only superadmin/admin can update application_texts
CREATE POLICY "Admins can update application_texts"
  ON public.application_texts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND (public.profiles.role = 'superadmin' OR public.profiles.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND (public.profiles.role = 'superadmin' OR public.profiles.role = 'admin')
    )
  );

-- From: 20260903_500000_app_labels_overrides.sql
-- ============================================================
-- GOBY — App Labels Overrides Table
--
-- Permite que cada proyecto tenga overrides de etiquetas en la UI
-- (por ejemplo, cambiar "Maturity Score" por un nombre personalizado)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_labels_overrides (
  id bigserial PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_code text NOT NULL,
  field_key text NOT NULL,
  label_es text NOT NULL,
  label_en text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, tool_code, field_key)
);

ALTER TABLE public.app_labels_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_labels_overrides_select"
  ON public.app_labels_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = app_labels_overrides.project_id
        AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "app_labels_overrides_insert"
  ON public.app_labels_overrides
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = app_labels_overrides.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('consultant', 'member')
    )
  );

CREATE POLICY "app_labels_overrides_update"
  ON public.app_labels_overrides
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = app_labels_overrides.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('consultant', 'member')
    )
  );
