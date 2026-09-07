-- Add extended fields to projects table for objective, constraints, timeframe, and tech ecosystem
-- Aligns with ADR-029 multi-domain feature: these fields are domain-aware and populated during project creation
-- fricciones_oportunidades: JSONB array of friction objects with structure: {id, tipo, areaFuncional, frecuencia, impacto, notas}

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS objetivo_principal TEXT,
  ADD COLUMN IF NOT EXISTS restricciones TEXT,
  ADD COLUMN IF NOT EXISTS fricciones_oportunidades JSONB DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS horizonte_valor TEXT,
  ADD COLUMN IF NOT EXISTS ecosistema_tecnologico TEXT,
  ADD COLUMN IF NOT EXISTS areas_prioritarias TEXT[] DEFAULT '{}'::TEXT[];
