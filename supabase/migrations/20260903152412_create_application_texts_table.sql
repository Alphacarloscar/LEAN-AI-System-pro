-- Create application_texts table if it doesn't exist
-- This table holds UI text/label overrides per application module

CREATE TABLE IF NOT EXISTS public.application_texts (
  id BIGSERIAL PRIMARY KEY,
  tool_module TEXT NOT NULL,                    -- e.g., 'AdminView', 'T1', 'T2'
  text_key TEXT NOT NULL,                       -- e.g., 'title', 'description', 'button_label'
  filename TEXT,                                -- Source file location: 'AdminView.tsx:154'
  text_generalizado TEXT DEFAULT '[Sin especificar]',  -- Deprecated: being moved to text_override
  text_override TEXT,                           -- Admin override value (if set)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tool_module, text_key)
);

-- Create index for lookups by module and key
CREATE INDEX IF NOT EXISTS idx_application_texts_module_key
ON public.application_texts(tool_module, text_key);

-- Create index for admin panel searches
CREATE INDEX IF NOT EXISTS idx_application_texts_filename
ON public.application_texts(filename) WHERE filename IS NOT NULL;

COMMENT ON TABLE public.application_texts IS
  'Centralized UI text/label storage with admin override capability. '
  'Each (tool_module, text_key) tuple defines a UI text element that can be overridden.';

