-- ============================================================
-- Transformación Digital — Seed data para governance_domains y evaluation_dimensions
-- ADR-029 Fase 5: Multi-Domain Generalization
--
-- Objetivo: Insertar metadatos del dominio "Transformación Digital"
-- en las tablas de configuración creadas en 20260824_governance_domains_and_package_config.sql
--
-- Estructura: 1 governance_domain + 6 evaluation_dimensions (una por D1-D6)
--
-- Contexto (2026-08-28): el dominio Transformación Digital nunca se insertó
-- en producción — solo existía como spec de referencia en
-- docs/domains/transformacion-digital-seed.sql. Por eso ningún proyecto
-- podía usar realmente el dominio TD (el selector de dominios lee
-- governance_domains directamente) y todas las pantallas domain-aware
-- (incluido T10) caían siempre al fallback de AI Adoption. Esta migración
-- aplica esa spec para que el dominio exista de verdad.
--
-- Idempotente: usa ON CONFLICT DO NOTHING en ambos INSERTs.
-- ============================================================


-- ════════════════════════════════════════════════════════════════
-- 1. Insertar dominio Transformación Digital
-- ════════════════════════════════════════════════════════════════

INSERT INTO public.governance_domains (slug, label, description, is_active)
VALUES (
  'transformacion_digital',
  'Transformación Digital',
  'Consultoría de madurez en transformación digital — modernización de infraestructura, ' ||
  'datos, experiencia de cliente y gobernanza del cambio. Complementario a AI Adoption: ' ||
  'es la base digital que habilita iniciativas de IA a escala.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Capturar el ID del dominio para el resto de inserts
-- (reutiliza el mismo patrón que 20260824 para el dominio AI Adoption)


-- ════════════════════════════════════════════════════════════════
-- 2. Insertar 6 dimensiones de evaluación para Transformación Digital
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_td_domain_id uuid;
BEGIN
  -- Obtener ID del dominio Transformación Digital
  SELECT id INTO v_td_domain_id
    FROM public.governance_domains
    WHERE slug = 'transformacion_digital'
    LIMIT 1;

  IF v_td_domain_id IS NULL THEN
    RAISE EXCEPTION 'No se pudo encontrar el dominio Transformación Digital. '
                    'Verifica que el INSERT anterior completó exitosamente.';
  END IF;

  -- ── D1: Visión y Liderazgo Digital ──────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'digital_vision', 'Visión y Liderazgo Digital', 0.20, 1)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D2: Datos y Analítica ──────────────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'data_analytics', 'Datos y Analítica', 0.16, 2)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D3: Infraestructura y Cloud ────────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'infrastructure_cloud', 'Infraestructura y Cloud', 0.16, 3)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D4: Talento y Cultura Digital ──────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'talent_culture', 'Talento y Cultura Digital', 0.18, 4)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D5: Experiencia de Cliente ─────────────────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'customer_experience', 'Experiencia de Cliente y Canales Digitales', 0.16, 5)
  ON CONFLICT (domain_id, slug) DO NOTHING;

  -- ── D6: Gobernanza y Gestión del Cambio ───────────────────
  INSERT INTO public.evaluation_dimensions
    (domain_id, slug, label, weight, sort_order)
  VALUES
    (v_td_domain_id, 'governance_change', 'Gobernanza y Gestión del Cambio', 0.14, 6)
  ON CONFLICT (domain_id, slug) DO NOTHING;

END $$;


-- ════════════════════════════════════════════════════════════════
-- 3. Verificación
-- ════════════════════════════════════════════════════════════════

-- Confirmar que el seed se aplicó correctamente:
-- SELECT slug, label FROM public.governance_domains WHERE slug = 'transformacion_digital';
-- SELECT d.label, ed.label, ed.weight
--   FROM public.governance_domains d
--   LEFT JOIN public.evaluation_dimensions ed ON d.id = ed.domain_id
--   WHERE d.slug = 'transformacion_digital'
--   ORDER BY ed.sort_order;

COMMENT ON TABLE public.governance_domains IS
  'Catálogo de dominios disponibles (AI Adoption, Transformación Digital, etc.). '
  'Lectura pública; escritura solo vía service_role. Sin datos sensibles.';

COMMENT ON TABLE public.evaluation_dimensions IS
  'Dimensiones de evaluación (métricas) de cada dominio. '
  'Reemplaza literales hardcodeados en código. Lectura pública; escritura service_role.';
