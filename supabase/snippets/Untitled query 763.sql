CREATE TABLE IF NOT EXISTS public.application_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  clave TEXT NOT NULL,
  archivo TEXT,
  texto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_application_texts_module ON public.application_texts(module);
CREATE UNIQUE INDEX idx_application_texts_module_clave ON public.application_texts(module, clave);