-- ============================================================
-- Migration 20260824_governance_domains_and_package_config.sql
--
-- ADR-029 — Fase 1: Base de datos y dominio
--
-- Objetivo: crear las tablas de configuración de dominio y añadir
-- domain_id + contracted_packages a la tabla projects.
--
-- Tablas nuevas:
--   - governance_domains       (catálogo de dominios)
--   - evaluation_dimensions    (dimensiones de evaluación por dominio)
--   - governance_configurations (configuración por empresa+dominio)
--   - llm_prompt_templates     (prompts parametrizados por dominio)
--   - framework_controls       (controles regulatorios por dominio)
--
-- Cambios en projects:
--   - domain_id uuid REFERENCES governance_domains(id) [NOT NULL]
--   - contracted_packages package_id[] NOT NULL DEFAULT '{}'
--
-- Nuevo tipo enum:
--   - package_id (boost_assessment, portfolio_management, legal_compliance)
--
-- Seed: Dominio AI Adoption como primer registro en governance_domains.
-- Backfill: todos los proyectos existentes reciben domain_id + todos los paquetes.
--
-- RLS:
--   - governance_domains: SELECT público, INSERT/UPDATE/DELETE solo service_role
--   - evaluation_dimensions: SELECT público, INSERT/UPDATE/DELETE solo service_role
--   - governance_configurations: SELECT por company_id (RLS), escritura service_role
--   - llm_prompt_templates: SELECT público, INSERT/UPDATE/DELETE solo service_role
--   - framework_controls: SELECT público, INSERT/UPDATE/DELETE solo service_role
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. Enum package_id
--    Tipos de paquetes contractados por proyecto
-- ════════════════════════════════════════════════════════════════

CREATE TYPE public.package_id AS ENUM (
  'boost_assessment',
  'portfolio_management',
  'legal_compliance'
);

COMMENT ON TYPE public.package_id IS
  'Tipos de paquetes de módulos que puede contratar un proyecto: '
  '- boost_assessment: T1 + T2 + T7 '
  '- portfolio_management: T3 + T5 + T8 + T9 + T11 (consume T4) '
  '- legal_compliance: T6 + T12 (consume T4)';


-- ════════════════════════════════════════════════════════════════
-- 2. Tabla governance_domains
--    Catálogo de dominios (AI Adoption, Data Governance, etc.)
--    Lectura pública (no contiene datos sensibles).
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.governance_domains (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,          -- 'ai_adoption', 'data_governance'
  label       text NOT NULL,                 -- 'AI Adoption', 'Data Governance'
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.governance_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "governance_domains_select" ON public.governance_domains
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "governance_domains_admin_write" ON public.governance_domains
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "governance_domains_admin_update" ON public.governance_domains
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "governance_domains_admin_delete" ON public.governance_domains
  FOR DELETE TO authenticated USING (false);

COMMENT ON TABLE public.governance_domains IS
  'Catálogo de dominios disponibles (AI Adoption, Data Governance, etc.). '
  'Lectura pública; escritura solo vía service_role. Sin datos sensibles.';


-- ════════════════════════════════════════════════════════════════
-- 3. Tabla evaluation_dimensions
--    Dimensiones de evaluación por dominio
--    Lectura pública (metadatos de configuración).
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.evaluation_dimensions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   uuid NOT NULL REFERENCES public.governance_domains(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  label       text NOT NULL,
  weight      numeric(4,3) CHECK (weight IS NULL OR (weight >= 0 AND weight <= 1)),
  sort_order  integer NOT NULL DEFAULT 0,
  UNIQUE (domain_id, slug)
);

ALTER TABLE public.evaluation_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evaluation_dimensions_select" ON public.evaluation_dimensions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "evaluation_dimensions_admin_write" ON public.evaluation_dimensions
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "evaluation_dimensions_admin_update" ON public.evaluation_dimensions
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "evaluation_dimensions_admin_delete" ON public.evaluation_dimensions
  FOR DELETE TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_evaluation_dimensions_domain_id
  ON public.evaluation_dimensions (domain_id);

COMMENT ON TABLE public.evaluation_dimensions IS
  'Dimensiones de evaluación (métricas) de cada dominio. '
  'Reemplaza literales hardcodeados en código. Lectura pública; escritura service_role.';


-- ════════════════════════════════════════════════════════════════
-- 4. Tabla governance_configurations
--    Configuración de gobierno por empresa + dominio (JSONB flexible)
--    RLS por company_id — cada empresa ve solo su configuración.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.governance_configurations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  domain_id   uuid NOT NULL REFERENCES public.governance_domains(id) ON DELETE CASCADE,
  config      jsonb NOT NULL DEFAULT '{}',
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (company_id, domain_id)
);

ALTER TABLE public.governance_configurations ENABLE ROW LEVEL SECURITY;

-- SELECT: usuario accede si es miembro de algún proyecto de esa empresa
-- Uso de user_can_read_company() del patrón de 20260708
CREATE POLICY "governance_configurations_select" ON public.governance_configurations
  FOR SELECT TO authenticated USING (
    public.user_can_read_company(company_id)
  );

-- INSERT/UPDATE/DELETE: solo service_role (no usuarios autenticados)
CREATE POLICY "governance_configurations_admin_write" ON public.governance_configurations
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "governance_configurations_admin_update" ON public.governance_configurations
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "governance_configurations_admin_delete" ON public.governance_configurations
  FOR DELETE TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_governance_configurations_company_id
  ON public.governance_configurations (company_id);

CREATE INDEX IF NOT EXISTS idx_governance_configurations_domain_id
  ON public.governance_configurations (domain_id);

COMMENT ON TABLE public.governance_configurations IS
  'Configuración JSONB por empresa + dominio. RLS por company_id. '
  'Contenido: parámetros de gobierno, pesos de scoring, etc. Escribible solo vía service_role.';


-- ════════════════════════════════════════════════════════════════
-- 5. Tabla llm_prompt_templates
--    Prompts de LLM parametrizados por dominio + módulo
--    Lectura pública (metadatos); escritura service_role.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.llm_prompt_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   uuid NOT NULL REFERENCES public.governance_domains(id) ON DELETE CASCADE,
  module_slug text NOT NULL,                 -- 't1_radar', 't6_risk', etc.
  prompt_key  text NOT NULL,
  template    text NOT NULL,
  version     integer NOT NULL DEFAULT 1,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (domain_id, module_slug, prompt_key, version)
);

ALTER TABLE public.llm_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "llm_prompt_templates_select" ON public.llm_prompt_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "llm_prompt_templates_admin_write" ON public.llm_prompt_templates
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "llm_prompt_templates_admin_update" ON public.llm_prompt_templates
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "llm_prompt_templates_admin_delete" ON public.llm_prompt_templates
  FOR DELETE TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_llm_prompt_templates_domain_id
  ON public.llm_prompt_templates (domain_id);

CREATE INDEX IF NOT EXISTS idx_llm_prompt_templates_module_slug
  ON public.llm_prompt_templates (module_slug);

CREATE INDEX IF NOT EXISTS idx_llm_prompt_templates_active
  ON public.llm_prompt_templates (is_active) WHERE is_active = true;

COMMENT ON TABLE public.llm_prompt_templates IS
  'Prompts parametrizados para Edge Functions, versión por dominio. '
  'Reemplaza literales AI hardcodeados en código. Lectura pública; escritura service_role.';


-- ════════════════════════════════════════════════════════════════
-- 6. Tabla framework_controls
--    Controles de frameworks regulatorios/metodológicos por dominio
--    Lectura pública (metadatos); escritura service_role.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.framework_controls (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id   uuid NOT NULL REFERENCES public.governance_domains(id) ON DELETE CASCADE,
  control_id  text NOT NULL,                 -- 'GPAI-1.1', 'ISO-27001-A.5.1', etc.
  label       text NOT NULL,
  description text,
  category    text,
  UNIQUE (domain_id, control_id)
);

ALTER TABLE public.framework_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "framework_controls_select" ON public.framework_controls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "framework_controls_admin_write" ON public.framework_controls
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "framework_controls_admin_update" ON public.framework_controls
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "framework_controls_admin_delete" ON public.framework_controls
  FOR DELETE TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_framework_controls_domain_id
  ON public.framework_controls (domain_id);

COMMENT ON TABLE public.framework_controls IS
  'Controles regulatorios/metodológicos (GPAI, ISO, etc.) por dominio. '
  'Metadatos de configuración. Lectura pública; escritura service_role.';


-- ════════════════════════════════════════════════════════════════
-- 7. Extender projects: agregar domain_id y contracted_packages
--
--    domain_id: permitir NULL temporalmente; se populará en paso 9.
--    contracted_packages: array de package_id, default vacío.
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.governance_domains(id),
  ADD COLUMN IF NOT EXISTS contracted_packages public.package_id[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.projects.domain_id IS
  'Dominio al que pertenece este proyecto (AI Adoption, Data Governance, etc.). '
  'FK a governance_domains. Determinará qué literales de configuración aplican.';

COMMENT ON COLUMN public.projects.contracted_packages IS
  'Array de tipos de paquetes contratados. Determina qué módulos T1-T13 están disponibles. '
  'Vacío = solo acceso a T10 (plataforma) en modo preview.';


-- ════════════════════════════════════════════════════════════════
-- 8. Seed: insertar dominio AI Adoption como primer registro
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.governance_domains (slug, label, description, is_active)
VALUES (
  'ai_adoption',
  'AI Adoption',
  'Consultoría de adopción de IA - metodología L.E.A.N.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Capturar el ID del dominio AI para el backfill
DO $$
DECLARE
  v_ai_domain_id uuid;
BEGIN
  SELECT id INTO v_ai_domain_id FROM public.governance_domains WHERE slug = 'ai_adoption' LIMIT 1;

  IF v_ai_domain_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo insertar el dominio AI Adoption';
  END IF;

  -- Paso 9: Backfill de proyectos existentes con domain_id + todos los paquetes
  UPDATE public.projects
     SET domain_id = v_ai_domain_id,
         contracted_packages = ARRAY['boost_assessment', 'portfolio_management', 'legal_compliance']::public.package_id[]
   WHERE domain_id IS NULL;

  -- Ahora hacer domain_id NOT NULL (todos los proyectos ya tienen valor)
  ALTER TABLE public.projects ALTER COLUMN domain_id SET NOT NULL;

END $$;


-- ════════════════════════════════════════════════════════════════
-- 10. Índices para performance en queries de projects
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_projects_domain_id
  ON public.projects (domain_id);

CREATE INDEX IF NOT EXISTS idx_projects_contracted_packages
  ON public.projects USING GIN (contracted_packages);


-- ════════════════════════════════════════════════════════════════
-- Fin de la migración
-- Verificación post-migración:
--   1. SELECT count(*) FROM governance_domains; → 1
--   2. SELECT count(*) FROM projects; → debe ser > 0 con domain_id NOT NULL
--   3. SELECT DISTINCT contracted_packages FROM projects; → debe tener valores
-- ════════════════════════════════════════════════════════════════
