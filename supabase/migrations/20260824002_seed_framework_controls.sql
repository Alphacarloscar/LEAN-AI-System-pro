-- ADR-029 Fase 5 — TIPO 3: Seed de framework_controls para dominio AI Adoption
--
-- Propósito: Poblar framework_controls con los 15 labels de AI Act (Tipo A)
-- que se parametrizan por dominio en T6 y T4.
--
-- Labels incluidos:
-- T6: ai_act_dashboard, ai_act_risk, ai_act_coverage, ai_act_risk_evaluation,
--     ai_act_risk_subtitle, ai_act_policy_subtitle, ai_act_governance_subtitle
-- T4: ai_act_badge, ai_act_tab, ai_act_tooltip, ai_act_empty, ai_act_risk_level,
--     ai_act_prohibited, ai_act_no_obligations, ai_act_classification
--
-- Fecha: 2026-08-24
-- Estado: Ready for review

-- T6 — Risk Governance labels
INSERT INTO framework_controls
  (domain_id, control_id, label, category, is_active)
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_dashboard',
  'Dashboard AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_risk',
  'Riesgo AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_coverage',
  'Cobertura de clasificación AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_risk_evaluation',
  'Evaluación de riesgos regulatorios IA (AI Act)',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_risk_subtitle',
  'Recomendaciones de gobernanza basadas en tu exposición AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_policy_subtitle',
  'Política corporativa de IA conforme a EU AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_governance_subtitle',
  'Marco de gobernanza y compliance regulatorio',
  'regulatory',
  true
-- T4 — Use Case Priority Board labels
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_badge',
  'AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_tab',
  'AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_tooltip',
  'Ver clasificación AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_empty',
  'Sin clasificación AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_risk_level',
  'Nivel de riesgo EU AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_prohibited',
  'Sistema potencialmente prohibido — Art. 5 AI Act',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_no_obligations',
  'Sin obligaciones regulatorias específicas del AI Act. Se recomienda documentar el uso en el catálogo corporativo de IA como buena práctica de gobernanza.',
  'regulatory',
  true
UNION ALL
SELECT
  (SELECT id FROM governance_domains WHERE slug = 'ai_adoption'),
  'ai_act_classification',
  'Clasificación AI Act',
  'regulatory',
  true
ON CONFLICT (domain_id, control_id) DO NOTHING;
