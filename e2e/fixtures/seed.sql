-- =============================================================
-- E2E Lab Seed — GOBY
-- Empresa: Disney (company_id fijo) | Proyecto canon: Toy Story
-- Idempotente: INSERT ... ON CONFLICT DO NOTHING en todas las tablas.
--
-- Cómo ejecutar:
--   1. Instancia local Supabase Docker corriendo
--   2. Dashboard → SQL Editor → pegar este script → Run
--   O bien: psql -U postgres -d postgres -p 54322 -f e2e/fixtures/seed.sql
--
-- PREREQUISITO: los 4 usuarios lab deben existir ya en auth.users
--   (creados con supabase-cli o desde el Dashboard de Auth local).
--   superadmin@test.dev  / temporal  → UID 51e0f939-b12a-42d5-87b6-6e6d5d6036a0
--   consultor@test.dev   / temporal  → UID 22749bdd-8ea1-49e1-8f44-7ae199bb77b0
--   editor@test.dev      / temporal  → UID 85a35057-442d-46bd-b9e1-628c57eeae81
--   viewer@test.dev      / temporal  → UID 707a11db-b233-4e16-b1df-5d7838580de5
-- =============================================================

BEGIN;

-- ── 1. Company ───────────────────────────────────────────────
INSERT INTO public.companies (id, name, slug, sector, company_size)
VALUES (
  '0b83042d-414e-4d4c-8c83-3a469affbfb3',
  'Disney',
  'disney',
  'Tecnología / Software',
  '201–500 empleados'
) ON CONFLICT (id) DO NOTHING;

-- ── 2. Profiles ──────────────────────────────────────────────
INSERT INTO public.profiles (id, email, name, role, company_id) VALUES
  ('51e0f939-b12a-42d5-87b6-6e6d5d6036a0', 'superadmin@test.dev', 'david.baquero', 'superadmin',    '0b83042d-414e-4d4c-8c83-3a469affbfb3'),
  ('22749bdd-8ea1-49e1-8f44-7ae199bb77b0', 'consultor@test.dev',  'consultor',     'consultant',    '0b83042d-414e-4d4c-8c83-3a469affbfb3'),
  ('85a35057-442d-46bd-b9e1-628c57eeae81', 'editor@test.dev',     'editor',        'client_editor', '0b83042d-414e-4d4c-8c83-3a469affbfb3'),
  ('707a11db-b233-4e16-b1df-5d7838580de5', 'viewer@test.dev',     'viewer',        'client_viewer', '0b83042d-414e-4d4c-8c83-3a469affbfb3')
ON CONFLICT (id) DO NOTHING;

-- ── 3. Company departments ───────────────────────────────────
INSERT INTO public.company_departments (id, company_id, name, color) VALUES
  ('f1eb18f7-d831-4a21-aa97-0fe3659c8ddc', '0b83042d-414e-4d4c-8c83-3a469affbfb3', 'Finanzas',    '#C8860A'),
  ('c58ce8f1-464b-4bd7-a398-b21583d2b5dc', '0b83042d-414e-4d4c-8c83-3a469affbfb3', 'IT',          '#C8860A'),
  ('420e3d04-c187-4de4-b2b3-1c481be0e9ed', '0b83042d-414e-4d4c-8c83-3a469affbfb3', 'Dirección',   '#C8860A'),
  ('be999ded-1aa8-430b-87d8-3ad9ac181e9f', '0b83042d-414e-4d4c-8c83-3a469affbfb3', 'Marketing',   '#C8860A'),
  ('1b216db8-a3b9-429c-8d25-ae4bb70c148d', '0b83042d-414e-4d4c-8c83-3a469affbfb3', 'Facturación', '#C8860A'),
  ('4b55d82a-ffbb-4eee-98ca-c22648428970', '0b83042d-414e-4d4c-8c83-3a469affbfb3', 'RRHH',        '#C8860A'),
  ('97d53d9c-a3b4-4492-a24e-c8b93fb2698e', '0b83042d-414e-4d4c-8c83-3a469affbfb3', 'Operaciones', '#C8860A'),
  ('59faa869-b864-484e-83dd-7792540bf703', '0b83042d-414e-4d4c-8c83-3a469affbfb3', 'Diseño',      '#C8860A')
ON CONFLICT (id) DO NOTHING;

-- ── 4. Projects (canon E2E: "Toy Story" + "Test Boost Only") ─
INSERT INTO public.projects (id, name, owner_id, company_id, status, current_phase)
VALUES (
  'e2058bff-9759-465d-ae4d-df79fdf23815',
  'Toy Story',
  '51e0f939-b12a-42d5-87b6-6e6d5d6036a0',
  '0b83042d-414e-4d4c-8c83-3a469affbfb3',
  'active',
  'listen'
),
(
  'd1a2b3c4-e5f6-4a1b-9c8d-7e6f5a4b3c2d',
  'Test Boost Only',
  '51e0f939-b12a-42d5-87b6-6e6d5d6036a0',
  '0b83042d-414e-4d4c-8c83-3a469affbfb3',
  'active',
  'listen'
) ON CONFLICT (id) DO NOTHING;

-- ── 5. Project members ───────────────────────────────────────
INSERT INTO public.project_members (project_id, user_id, role) VALUES
  ('e2058bff-9759-465d-ae4d-df79fdf23815', '51e0f939-b12a-42d5-87b6-6e6d5d6036a0', 'consultant'),
  ('e2058bff-9759-465d-ae4d-df79fdf23815', '22749bdd-8ea1-49e1-8f44-7ae199bb77b0', 'consultant'),
  ('d1a2b3c4-e5f6-4a1b-9c8d-7e6f5a4b3c2d', '51e0f939-b12a-42d5-87b6-6e6d5d6036a0', 'consultant'),
  ('d1a2b3c4-e5f6-4a1b-9c8d-7e6f5a4b3c2d', '22749bdd-8ea1-49e1-8f44-7ae199bb77b0', 'consultant')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ── 6. T1 dimension scores — interviewee: Andy (CEO / business) ──
INSERT INTO public.t1_dimension_scores
  (id, project_id, dimension_code, subdimension_code, score, evidence, interviewee_id, interviewee_name, interviewee_role, interviewee_type)
VALUES
  ('b6495f1a-b935-41e6-beff-2babe3b3cede', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'strategy', 'strategy-vision',        3.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('c24728be-c951-4888-b728-78a9699edf9c', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'strategy', 'strategy-roadmap',       1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('0b7dd551-6d07-4b59-9f9e-ce32dd0b42af', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'strategy', 'strategy-budget',        2.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('ded2a679-3ee6-4356-9c5f-cdacf7487547', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'strategy', 'strategy-sponsorship',   1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('22828d6c-310f-4e62-bb15-73ebb64b8ef5', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'data',     'data-availability',      1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('8d522548-1408-46a5-912d-584d5b7718bd', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'data',     'data-quality',           2.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('452e1c2b-dc35-4ef6-a3c0-8e7aefd9a0e8', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'data',     'data-volume',            1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('48620fa3-e4c4-4f0b-a9bd-f20741ccc039', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'data',     'data-privacy',           1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('f40c1a0a-2cab-463a-aafe-8c3b0312820d', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'technology','tech-infrastructure',   1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('83554f18-2148-4499-b66e-a74cc40546aa', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'technology','tech-integration',      1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('ac779d31-11e8-4687-98b8-21c6eaa5a227', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'technology','tech-security',         2.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('31346c1d-785f-47b8-b5ac-927ecf7012d3', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'technology','tech-mlops',            1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('8467198a-7a38-4b58-b95b-69dfa3eb4cd9', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'talent',   'talent-technical',       2.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('3a946737-7977-48d8-ad52-092c868c7eae', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'talent',   'talent-training',        3.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('71ef7afa-7107-42d2-86c0-e4c8259d590d', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'talent',   'talent-change',          1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('5c171965-d943-49cb-b6e4-042aaa1f2695', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'talent',   'talent-culture',         1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('d268ae8e-4523-4482-823c-09eb84fa3ec4', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'processes','process-identification', 1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('a50783d7-57fd-41f2-9650-f3dd376b753b', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'processes','process-redesign',       1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('2202e331-f2f7-4cdc-8f35-a14842a3fa5c', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'processes','process-roi',            2.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('fc4b834a-f31a-4d4e-bb93-5ed57910ca29', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'processes','process-pilots',         1.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('dd90a568-b9d1-4875-9e4c-c33f63b3295d', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'governance','gov-policy',            3.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('f1577340-1c6e-4ef3-bf93-2b256c9e600b', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'governance','gov-risk',              2.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('86d4a42b-4403-4516-8b14-0cd4f3e9c709', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'governance','gov-catalog',           2.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business'),
  ('be73e8f5-ee2a-409f-a0d0-7f4b0f521afe', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'governance','gov-audit',             3.0, '', '543b49ee-c3f5-4643-8511-78b8f39c92da', 'Andy', 'CEO', 'business')
ON CONFLICT ON CONSTRAINT t1_scores_unique_per_interviewee DO NOTHING;

-- ── 7. T1 dimension scores — interviewee: Buzz (CTO / it) ────
INSERT INTO public.t1_dimension_scores
  (id, project_id, dimension_code, subdimension_code, score, evidence, interviewee_id, interviewee_name, interviewee_role, interviewee_type)
VALUES
  ('33f7bad2-be7b-4b11-b7f7-34a3f8d1817e', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'strategy', 'strategy-vision',        3.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('7f3bd369-0103-4479-877d-7aa38f09580d', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'strategy', 'strategy-roadmap',       2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('47a8128f-fe52-4e69-8139-3938783cd164', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'strategy', 'strategy-budget',        3.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('070479e2-593c-4507-b30a-ddb4d08f7bcf', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'strategy', 'strategy-sponsorship',   1.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('46aaad3a-8e47-4869-b1ad-a431af06bfb8', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'data',     'data-availability',      2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('006b106d-4734-4ba1-8011-9d1afc35ba8f', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'data',     'data-quality',           3.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('8f81fc13-de24-4759-a608-83591f745b20', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'data',     'data-volume',            1.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('5bbe49de-ff26-497f-9237-d936a62453d6', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'data',     'data-privacy',           2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('1d7f079f-088d-43e9-b336-863e4ec7088f', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'technology','tech-infrastructure',   3.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('62c1fc97-ab2d-4fb8-84fd-005eaf666add', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'technology','tech-integration',      1.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('772bb0b2-5136-423a-b53e-20a53bb822d0', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'technology','tech-security',         2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('4e557cfe-f164-4101-8618-98227ec6a09e', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'technology','tech-mlops',            2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('6604c510-0419-4026-9f15-8108a3bc2642', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'talent',   'talent-technical',       3.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('03165e70-fe9b-4788-bd81-8f719931d25c', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'talent',   'talent-training',        1.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('f16d1cb5-1c06-450b-90b4-6dc6cc2afca5', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'talent',   'talent-change',          3.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('9eaeb534-e89d-40af-bb7d-73c0d2ce4b9a', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'talent',   'talent-culture',         2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('63ed7384-5613-4677-8cdd-245735eae389', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'processes','process-identification', 2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('c427f66f-dd0b-4e81-9dce-d376177c5af1', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'processes','process-redesign',       2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('cd38177f-29fc-4d74-8584-0af8daeb88d1', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'processes','process-roi',            2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('ea0f9de8-dcaf-4baa-8893-2631e1b7f141', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'processes','process-pilots',         2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('7448e0fd-95c3-47fd-a7f2-c48c7de42c1e', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'governance','gov-policy',            3.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('4c360ad6-5338-496c-876f-31bd06fcece1', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'governance','gov-risk',              2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('2480c2f1-f0cc-4d62-ad0b-f3c2e571bde5', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'governance','gov-catalog',           2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it'),
  ('f959511d-100f-4486-add5-c9346f32ff22', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'governance','gov-audit',             2.0, '', 'ffec6c9e-31f7-4533-aa5e-e9962d71cf70', 'Buzz', 'CTO', 'it')
ON CONFLICT ON CONSTRAINT t1_scores_unique_per_interviewee DO NOTHING;

-- ── 8. Stakeholders ──────────────────────────────────────────
INSERT INTO public.stakeholders (id, project_id, name, role, department, archetype, resistance, notes, manual_override) VALUES
  ('03b2b01d-ff4e-4094-8f5c-eece084decd4', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Forky',  'Operations',  'Operaciones', 'reticente',  'alta',  'Importado desde T1 — Madurez Radar', false),
  ('884d20df-2522-4891-84e1-938b54a04d96', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Woody',  'CIO',         'Dirección',   'adoptador',  'media', 'Importado desde T1 — Madurez Radar', false),
  ('8b4fe960-fc1c-4576-bffd-fb99bb70a7b3', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Jessie', 'Marketing',   'Marketing',   'adoptador',  'baja',  'Importado desde T1 — Madurez Radar', false),
  ('8ebba514-00c2-4905-b4ce-47fdd17581d8', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Slinky', 'RRHH',        'RRHH',        'adoptador',  'baja',  'Importado desde T1 — Madurez Radar', false),
  ('9cde02dc-6dff-4e5c-91c2-643289fd941b', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Sid',    'CFO',         'Marketing',   'adoptador',  'media', '',                                   false),
  ('eb443df7-8ea8-42af-a0d3-ee6bb2770073', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Andy',   'CEO',         'Dirección',   'ambassador', 'baja',  'Importado desde T1 — Madurez Radar', false),
  ('ef2658fc-ffd9-4d05-84ab-c73bd62a5529', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Rex',    'Marketing',   'Marketing',   'adoptador',  'media', 'Importado desde T1 — Madurez Radar', false),
  ('ff15abe1-baa1-4933-8d4a-42529ef5c2a5', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Buzz',   'CTO',         'IT',          'decisor',    'media', 'Importado desde T1 — Madurez Radar', false)
ON CONFLICT (id) DO NOTHING;

-- ── 9. Value streams ─────────────────────────────────────────
INSERT INTO public.value_streams
  (id, project_id, name, department, owner, phase, ai_category, org_readiness, opportunity_level, manual_override)
VALUES
  ('c83d1360-ac1c-493f-9db9-af5cdcf9bf39', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Campañas marketing Q3 2026', 'Marketing',   'Jessie', 'validacion', 'asistente_ia',         'alta', 'media', false),
  ('4d96c9d7-7538-4009-a3d8-7e301b846b6e', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Gestión de inventario',      'Operaciones', 'Buzz',   'piloto',     'analitica_predictiva', 'alta', 'media', false),
  ('7adbcb91-82b5-4b25-951e-1c9f8a140dab', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Revisión de solicitudes',    'Operaciones', 'Woody',  'idea',       'optimizacion_proceso', 'baja', 'media', false),
  ('75cef9ca-fe44-499a-b223-2f5b20025f7a', 'e2058bff-9759-465d-ae4d-df79fdf23815', 'Gestión de incidencias TI',  'IT',          'Andy',   'piloto',     'analitica_predictiva', 'alta', 'alta',  false)
ON CONFLICT (id) DO NOTHING;

-- ── 10. Use cases (para T4) ───────────────────────────────────
INSERT INTO public.use_cases
  (id, project_id, name, description, department, ai_category, status, priority_score, scores)
VALUES
  ('722bd9fb-46d8-43a3-87b4-7d301fde9ea6', 'e2058bff-9759-465d-ae4d-df79fdf23815',
   'Campañas marketing Q3 2026', '',
   'Marketing', 'asistente_ia', 'candidato', 43.70, '{}'),
  ('3cc759e6-eb90-445b-baa8-a57e9a9d736a', 'e2058bff-9759-465d-ae4d-df79fdf23815',
   'Gestión de incidencias TI', '',
   'IT', 'analitica_predictiva', 'completado', 58.00, '{}'),
  ('0ea6b655-dff6-44a6-bf21-542bb0bf45c4', 'e2058bff-9759-465d-ae4d-df79fdf23815',
   'Gestión de inventario', '',
   'Operaciones', 'analitica_predictiva', 'priorizado', 50.00, '{}'),
  ('e80bca9b-0241-4c07-9fc2-c16dd4b3bc40', 'e2058bff-9759-465d-ae4d-df79fdf23815',
   'Revisión de solicitudes', '',
   'Operaciones', 'optimizacion_proceso', 'go', 49.30, '{}')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ── Verificación ──────────────────────────────────────────────
SELECT 'companies'          AS tabla, COUNT(*) FROM public.companies          WHERE id = '0b83042d-414e-4d4c-8c83-3a469affbfb3'
UNION ALL
SELECT 'profiles',                    COUNT(*) FROM public.profiles            WHERE company_id = '0b83042d-414e-4d4c-8c83-3a469affbfb3'
UNION ALL
SELECT 'projects (Toy Story)',         COUNT(*) FROM public.projects            WHERE id = 'e2058bff-9759-465d-ae4d-df79fdf23815'
UNION ALL
SELECT 'projects (Test Boost Only)',   COUNT(*) FROM public.projects            WHERE id = 'd1a2b3c4-e5f6-4a1b-9c8d-7e6f5a4b3c2d'
UNION ALL
SELECT 'project_members',              COUNT(*) FROM public.project_members     WHERE project_id = 'e2058bff-9759-465d-ae4d-df79fdf23815'
UNION ALL
SELECT 't1_scores',                    COUNT(*) FROM public.t1_dimension_scores WHERE project_id = 'e2058bff-9759-465d-ae4d-df79fdf23815'
UNION ALL
SELECT 'stakeholders',                 COUNT(*) FROM public.stakeholders        WHERE project_id = 'e2058bff-9759-465d-ae4d-df79fdf23815'
UNION ALL
SELECT 'value_streams',                COUNT(*) FROM public.value_streams       WHERE project_id = 'e2058bff-9759-465d-ae4d-df79fdf23815'
UNION ALL
SELECT 'use_cases',                    COUNT(*) FROM public.use_cases           WHERE project_id = 'e2058bff-9759-465d-ae4d-df79fdf23815';
